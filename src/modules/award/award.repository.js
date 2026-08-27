import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

function getAwardsCollection(companyId) {
  return adminDb.collection("companies").doc(companyId).collection("awards");
}

function getAwardSlugsCollection(companyId) {
  return adminDb
    .collection("companies")
    .doc(companyId)
    .collection("awardSlugs");
}

export async function getAwardById({ companyId, awardId }) {
  const snapshot = await getAwardsCollection(companyId).doc(awardId).get();

  if (!snapshot.exists) {
    return null;
  }

  return {
    id: snapshot.id,

    ...snapshot.data(),
  };
}

export async function listAwardRecords(companyId) {
  const snapshot = await getAwardsCollection(companyId).get();

  return snapshot.docs
    .map((document) => ({
      id: document.id,

      ...document.data(),
    }))
    .filter((item) => !item.deletedAt);
}

export async function createAwardRecord({ companyId, data, userId }) {
  const awardRef = getAwardsCollection(companyId).doc();

  const slugRef = getAwardSlugsCollection(companyId).doc(data.slug);

  await adminDb.runTransaction(async (transaction) => {
    const slugSnapshot = await transaction.get(slugRef);

    if (slugSnapshot.exists) {
      const error = new Error("AWARD_SLUG_EXISTS");

      error.slug = data.slug;

      throw error;
    }

    transaction.set(awardRef, {
      ...data,

      status: "draft",

      scheduledAt: null,

      publishedAt: null,

      publishedBy: null,

      createdAt: FieldValue.serverTimestamp(),

      createdBy: userId,

      updatedAt: FieldValue.serverTimestamp(),

      updatedBy: userId,

      deletedAt: null,

      deletedBy: null,
    });

    transaction.set(slugRef, {
      awardId: awardRef.id,

      createdAt: FieldValue.serverTimestamp(),
    });
  });

  return getAwardById({
    companyId,

    awardId: awardRef.id,
  });
}

export async function updateAwardRecord({ companyId, awardId, data, userId }) {
  const awardRef = getAwardsCollection(companyId).doc(awardId);

  let before = null;

  await adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(awardRef);

    if (!snapshot.exists || snapshot.data().deletedAt) {
      throw new Error("AWARD_NOT_FOUND");
    }

    before = {
      id: snapshot.id,

      ...snapshot.data(),
    };

    const oldSlug = before.slug;

    const newSlug = data.slug || oldSlug;

    if (newSlug !== oldSlug) {
      const oldSlugRef = getAwardSlugsCollection(companyId).doc(oldSlug);

      const newSlugRef = getAwardSlugsCollection(companyId).doc(newSlug);

      const existing = await transaction.get(newSlugRef);

      if (existing.exists) {
        const error = new Error("AWARD_SLUG_EXISTS");

        error.slug = newSlug;

        throw error;
      }

      transaction.delete(oldSlugRef);

      transaction.set(newSlugRef, {
        awardId,

        createdAt: FieldValue.serverTimestamp(),
      });
    }

    transaction.update(awardRef, {
      ...data,

      updatedAt: FieldValue.serverTimestamp(),

      updatedBy: userId,
    });
  });

  const after = await getAwardById({
    companyId,
    awardId,
  });

  return {
    before,
    after,
  };
}

export async function publishAwardRecord({
  companyId,
  awardId,
  userId,
  scheduledAt = null,
}) {
  const ref = getAwardsCollection(companyId).doc(awardId);

  const snapshot = await ref.get();

  if (!snapshot.exists || snapshot.data().deletedAt) {
    throw new Error("AWARD_NOT_FOUND");
  }

  const before = {
    id: snapshot.id,

    ...snapshot.data(),
  };

  if (scheduledAt) {
    const date = new Date(scheduledAt);

    if (Number.isNaN(date.getTime())) {
      throw new Error("INVALID_SCHEDULE_DATE");
    }

    if (date.getTime() <= Date.now()) {
      throw new Error("SCHEDULE_MUST_BE_FUTURE");
    }

    await ref.update({
      status: "scheduled",

      scheduledAt: Timestamp.fromDate(date),

      publishedAt: null,

      publishedBy: null,

      updatedAt: FieldValue.serverTimestamp(),

      updatedBy: userId,
    });
  } else {
    await ref.update({
      status: "published",

      scheduledAt: null,

      publishedAt: FieldValue.serverTimestamp(),

      publishedBy: userId,

      updatedAt: FieldValue.serverTimestamp(),

      updatedBy: userId,
    });
  }

  return {
    before,

    after: await getAwardById({
      companyId,
      awardId,
    }),
  };
}

export async function unpublishAwardRecord({ companyId, awardId, userId }) {
  const ref = getAwardsCollection(companyId).doc(awardId);

  const snapshot = await ref.get();

  if (!snapshot.exists || snapshot.data().deletedAt) {
    throw new Error("AWARD_NOT_FOUND");
  }

  const before = {
    id: snapshot.id,

    ...snapshot.data(),
  };

  await ref.update({
    status: "draft",

    scheduledAt: null,

    publishedAt: null,

    publishedBy: null,

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: userId,
  });

  return {
    before,

    after: await getAwardById({
      companyId,
      awardId,
    }),
  };
}

export async function softDeleteAwardRecord({ companyId, awardId, userId }) {
  const ref = getAwardsCollection(companyId).doc(awardId);

  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new Error("AWARD_NOT_FOUND");
  }

  const before = {
    id: snapshot.id,

    ...snapshot.data(),
  };

  if (before.deletedAt) {
    throw new Error("AWARD_ALREADY_DELETED");
  }

  await ref.update({
    status: "archived",

    scheduledAt: null,

    deletedAt: FieldValue.serverTimestamp(),

    deletedBy: userId,

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: userId,
  });

  return before;
}

export async function getAwardBySlug({ companyId, slug }) {
  const slugSnapshot = await getAwardSlugsCollection(companyId).doc(slug).get();

  if (!slugSnapshot.exists) {
    return null;
  }

  const data = slugSnapshot.data();

  if (!data.awardId) {
    return null;
  }

  return getAwardById({
    companyId,
    awardId: data.awardId,
  });
}
