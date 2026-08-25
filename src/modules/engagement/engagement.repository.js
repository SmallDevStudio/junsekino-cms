import "server-only";

import crypto from "node:crypto";

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

const VIEW_WINDOW_MS = 30 * 60 * 1000;

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

function getViewWindowKey({ contentType, contentId, visitorHash }) {
  const bucket = Math.floor(Date.now() / VIEW_WINDOW_MS);

  return crypto
    .createHash("sha256")
    .update(`${contentType}:${contentId}:${visitorHash}:${bucket}`)
    .digest("hex");
}

function getViewCooldownRef({
  companyId,
  contentType,
  contentId,
  visitorHash,
}) {
  const key = getViewWindowKey({
    contentType,
    contentId,
    visitorHash,
  });

  return adminDb
    .collection("companies")
    .doc(companyId)
    .collection("viewCooldowns")
    .doc(key);
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
    const reaction = await transaction.get(reactionRef);

    if (reaction.exists) {
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
    const [reaction, stats, daily] = await transaction.getAll(
      reactionRef,
      statsRef,
      dailyRef,
    );

    if (!reaction.exists) {
      return;
    }

    const likes = stats.exists ? stats.data().likes || 0 : 0;

    const dailyLikes = daily.exists ? daily.data().likes || 0 : 0;

    transaction.delete(reactionRef);

    transaction.set(
      statsRef,
      {
        likes: Math.max(likes - 1, 0),

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

        likes: Math.max(dailyLikes - 1, 0),

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
  visitorHash,
  countUnique = false,
}) {
  if (!visitorHash) {
    throw new Error("VIEW_VISITOR_REQUIRED");
  }

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

  const cooldownRef = getViewCooldownRef({
    companyId,
    contentType,
    contentId,
    visitorHash,
  });

  const uniqueRef = countUnique
    ? getDailyVisitorRef({
        companyId,
        dateKey,
        contentType,
        contentId,
        visitorHash,
      })
    : null;

  let counted = false;

  let unique = false;

  await adminDb.runTransaction(async (transaction) => {
    const refs = [cooldownRef];

    if (uniqueRef) {
      refs.push(uniqueRef);
    }

    const snapshots = await transaction.getAll(...refs);

    const cooldownSnapshot = snapshots[0];

    /*
     * Same visitor/content/window
     * has already been counted.
     */
    if (cooldownSnapshot.exists) {
      return;
    }

    let uniqueSnapshot = null;

    if (uniqueRef) {
      uniqueSnapshot = snapshots[1];
    }

    transaction.set(cooldownRef, {
      contentType,
      contentId,

      /*
       * Do not store visitorHash
       * again in this record.
       */

      createdAt: FieldValue.serverTimestamp(),

      expiresAt: new Date(Date.now() + VIEW_WINDOW_MS + 5 * 60 * 1000),
    });

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

    if (uniqueRef && !uniqueSnapshot.exists) {
      dailyData.uniqueVisitors = FieldValue.increment(1);

      transaction.set(uniqueRef, {
        date: dateKey,

        contentType,
        contentId,

        /*
         * Pseudonymous hash,
         * only created with
         * Analytics consent.
         */
        visitorHash,

        createdAt: FieldValue.serverTimestamp(),
      });

      unique = true;
    }

    transaction.set(dailyRef, dailyData, {
      merge: true,
    });

    counted = true;
  });

  return {
    counted,
    unique,
  };
}
