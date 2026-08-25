import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

function getStatsRef({ companyId, contentType, contentId }) {
  return adminDb
    .collection("companies")
    .doc(companyId)
    .collection("contentStats")
    .doc(`${contentType}_${contentId}`);
}

function getReactionRef({ companyId, contentType, contentId, visitorHash }) {
  return adminDb
    .collection("companies")
    .doc(companyId)
    .collection("reactions")
    .doc(`${contentType}_${contentId}_${visitorHash}`);
}

function getDailyAnalyticsRef({ companyId, dateKey, contentType, contentId }) {
  return adminDb
    .collection("companies")
    .doc(companyId)
    .collection("analyticsDaily")
    .doc(`${dateKey}_${contentType}_${contentId}`);
}

function getDailyVisitorRef({
  companyId,
  dateKey,
  contentType,
  contentId,
  visitorHash,
}) {
  return adminDb
    .collection("companies")
    .doc(companyId)
    .collection("analyticsVisitors")
    .doc(`${dateKey}_${contentType}_${contentId}_${visitorHash}`);
}

export async function getEngagementStats({
  companyId,
  contentType,
  contentId,
}) {
  const snapshot = await getStatsRef({
    companyId,
    contentType,
    contentId,
  }).get();

  if (!snapshot.exists) {
    return {
      views: 0,
      likes: 0,
      shares: 0,
    };
  }

  const data = snapshot.data();

  return {
    views: data.views || 0,

    likes: data.likes || 0,

    shares: data.shares || 0,
  };
}

export async function getVisitorReaction({
  companyId,
  contentType,
  contentId,
  visitorHash,
}) {
  const snapshot = await getReactionRef({
    companyId,
    contentType,
    contentId,
    visitorHash,
  }).get();

  return {
    liked: snapshot.exists,
  };
}

export async function likeContentRecord({
  companyId,
  contentType,
  contentId,
  visitorHash,
  dateKey,
}) {
  const statsRef = getStatsRef({
    companyId,
    contentType,
    contentId,
  });

  const reactionRef = getReactionRef({
    companyId,
    contentType,
    contentId,
    visitorHash,
  });

  const dailyRef = getDailyAnalyticsRef({
    companyId,
    dateKey,
    contentType,
    contentId,
  });

  let changed = false;

  await adminDb.runTransaction(async (transaction) => {
    const reactionSnapshot = await transaction.get(reactionRef);

    if (reactionSnapshot.exists) {
      return;
    }

    transaction.set(reactionRef, {
      contentType,
      contentId,

      visitorHash,

      reaction: "like",

      createdAt: FieldValue.serverTimestamp(),
    });

    transaction.set(
      statsRef,
      {
        contentType,
        contentId,

        likes: FieldValue.increment(1),

        views: FieldValue.increment(0),

        shares: FieldValue.increment(0),

        updatedAt: FieldValue.serverTimestamp(),
      },
      {
        merge: true,
      },
    );

    transaction.set(
      dailyRef,
      {
        date: dateKey,

        contentType,

        contentId,

        likes: FieldValue.increment(1),

        views: FieldValue.increment(0),

        shares: FieldValue.increment(0),

        uniqueVisitors: FieldValue.increment(0),

        updatedAt: FieldValue.serverTimestamp(),
      },
      {
        merge: true,
      },
    );

    changed = true;
  });

  return {
    changed,
  };
}

export async function unlikeContentRecord({
  companyId,
  contentType,
  contentId,
  visitorHash,
  dateKey,
}) {
  const statsRef = getStatsRef({
    companyId,
    contentType,
    contentId,
  });

  const reactionRef = getReactionRef({
    companyId,
    contentType,
    contentId,
    visitorHash,
  });

  const dailyRef = getDailyAnalyticsRef({
    companyId,
    dateKey,
    contentType,
    contentId,
  });

  let changed = false;

  await adminDb.runTransaction(async (transaction) => {
    /*
     * All reads before writes.
     */

    const [reactionSnapshot, statsSnapshot, dailySnapshot] =
      await transaction.getAll(reactionRef, statsRef, dailyRef);

    if (!reactionSnapshot.exists) {
      return;
    }

    const currentLikes = statsSnapshot.exists
      ? statsSnapshot.data().likes || 0
      : 0;

    const currentDailyLikes = dailySnapshot.exists
      ? dailySnapshot.data().likes || 0
      : 0;

    transaction.delete(reactionRef);

    transaction.set(
      statsRef,
      {
        likes: Math.max(currentLikes - 1, 0),

        updatedAt: FieldValue.serverTimestamp(),
      },
      {
        merge: true,
      },
    );

    transaction.set(
      dailyRef,
      {
        date: dateKey,

        contentType,

        contentId,

        likes: Math.max(currentDailyLikes - 1, 0),

        updatedAt: FieldValue.serverTimestamp(),
      },
      {
        merge: true,
      },
    );

    changed = true;
  });

  return {
    changed,
  };
}

export async function incrementShareRecord({
  companyId,
  contentType,
  contentId,
  channel,
  dateKey,
}) {
  const statsRef = getStatsRef({
    companyId,
    contentType,
    contentId,
  });

  const dailyRef = getDailyAnalyticsRef({
    companyId,
    dateKey,
    contentType,
    contentId,
  });

  const eventRef = adminDb
    .collection("companies")
    .doc(companyId)
    .collection("engagementEvents")
    .doc();

  const batch = adminDb.batch();

  batch.set(
    statsRef,
    {
      contentType,
      contentId,

      shares: FieldValue.increment(1),

      updatedAt: FieldValue.serverTimestamp(),
    },
    {
      merge: true,
    },
  );

  batch.set(
    dailyRef,
    {
      date: dateKey,

      contentType,

      contentId,

      shares: FieldValue.increment(1),

      updatedAt: FieldValue.serverTimestamp(),
    },
    {
      merge: true,
    },
  );

  batch.set(eventRef, {
    type: "share",

    contentType,

    contentId,

    channel,

    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
}

export async function incrementViewRecord({
  companyId,
  contentType,
  contentId,
  dateKey,
  visitorHash = null,
  countUnique = false,
}) {
  const statsRef = getStatsRef({
    companyId,
    contentType,
    contentId,
  });

  const dailyRef = getDailyAnalyticsRef({
    companyId,
    dateKey,
    contentType,
    contentId,
  });

  if (!countUnique || !visitorHash) {
    const batch = adminDb.batch();

    batch.set(
      statsRef,
      {
        contentType,
        contentId,

        views: FieldValue.increment(1),

        updatedAt: FieldValue.serverTimestamp(),
      },
      {
        merge: true,
      },
    );

    batch.set(
      dailyRef,
      {
        date: dateKey,

        contentType,

        contentId,

        views: FieldValue.increment(1),

        updatedAt: FieldValue.serverTimestamp(),
      },
      {
        merge: true,
      },
    );

    await batch.commit();

    return {
      unique: false,
    };
  }

  const visitorRef = getDailyVisitorRef({
    companyId,
    dateKey,
    contentType,
    contentId,
    visitorHash,
  });

  let unique = false;

  await adminDb.runTransaction(async (transaction) => {
    const visitorSnapshot = await transaction.get(visitorRef);

    transaction.set(
      statsRef,
      {
        contentType,
        contentId,

        views: FieldValue.increment(1),

        updatedAt: FieldValue.serverTimestamp(),
      },
      {
        merge: true,
      },
    );

    const dailyData = {
      date: dateKey,

      contentType,

      contentId,

      views: FieldValue.increment(1),

      updatedAt: FieldValue.serverTimestamp(),
    };

    if (!visitorSnapshot.exists) {
      dailyData.uniqueVisitors = FieldValue.increment(1);

      transaction.set(visitorRef, {
        date: dateKey,

        contentType,

        contentId,

        visitorHash,

        createdAt: FieldValue.serverTimestamp(),
      });

      unique = true;
    }

    transaction.set(dailyRef, dailyData, {
      merge: true,
    });
  });

  return {
    unique,
  };
}
