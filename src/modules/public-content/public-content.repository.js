import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

function getCollection(companyId) {
  return adminDb
    .collection("companies")
    .doc(companyId)
    .collection("publicContents");
}

function getSlugCollection(companyId) {
  return adminDb
    .collection("companies")
    .doc(companyId)
    .collection("publicContentSlugs");
}

export async function getPublicContentById({ companyId, contentId }) {
  const snapshot = await getCollection(companyId).doc(contentId).get();

  if (!snapshot.exists) {
    return null;
  }

  return {
    id: snapshot.id,

    ...snapshot.data(),
  };
}

export async function getPublicContentBySlug({ companyId, slug }) {
  const snapshot = await getSlugCollection(companyId).doc(slug).get();

  if (!snapshot.exists) {
    return null;
  }

  const { contentId } = snapshot.data();

  if (!contentId) {
    return null;
  }

  return getPublicContentById({
    companyId,
    contentId,
  });
}

export async function listPublicContentRecords(companyId) {
  const snapshot = await getCollection(companyId).get();

  return snapshot.docs
    .map((document) => ({
      id: document.id,

      ...document.data(),
    }))
    .filter((item) => !item.deletedAt);
}

export async function createPublicContentRecord({ companyId, data, userId }) {
  const contentRef = getCollection(companyId).doc();

  const slugRef = getSlugCollection(companyId).doc(data.slug);

  await adminDb.runTransaction(async (transaction) => {
    const slugSnapshot = await transaction.get(slugRef);

    if (slugSnapshot.exists) {
      throw new Error("PUBLIC_SLUG_EXISTS");
    }

    transaction.set(contentRef, {
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
      contentId: contentRef.id,

      createdAt: FieldValue.serverTimestamp(),
    });
  });

  return getPublicContentById({
    companyId,

    contentId: contentRef.id,
  });
}

export async function updatePublicContentRecord({
  companyId,
  contentId,
  data,
  userId,
}) {
  const ref = getCollection(companyId).doc(contentId);

  let before = null;

  await adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);

    if (!snapshot.exists || snapshot.data().deletedAt) {
      throw new Error("PUBLIC_CONTENT_NOT_FOUND");
    }

    before = {
      id: snapshot.id,

      ...snapshot.data(),
    };

    const oldSlug = before.slug;

    const newSlug = data.slug || oldSlug;

    if (oldSlug !== newSlug) {
      const oldSlugRef = getSlugCollection(companyId).doc(oldSlug);

      const newSlugRef = getSlugCollection(companyId).doc(newSlug);

      const existing = await transaction.get(newSlugRef);

      if (existing.exists) {
        throw new Error("PUBLIC_SLUG_EXISTS");
      }

      transaction.delete(oldSlugRef);

      transaction.set(newSlugRef, {
        contentId,

        createdAt: FieldValue.serverTimestamp(),
      });
    }

    transaction.update(ref, {
      ...data,

      updatedAt: FieldValue.serverTimestamp(),

      updatedBy: userId,
    });
  });

  return {
    before,

    after: await getPublicContentById({
      companyId,
      contentId,
    }),
  };
}

export async function publishPublicContentRecord({
  companyId,
  contentId,
  userId,
  scheduledAt = null,
}) {
  const ref = getCollection(companyId).doc(contentId);

  const snapshot = await ref.get();

  if (!snapshot.exists || snapshot.data().deletedAt) {
    throw new Error("PUBLIC_CONTENT_NOT_FOUND");
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

    after: await getPublicContentById({
      companyId,
      contentId,
    }),
  };
}

export async function unpublishPublicContentRecord({
  companyId,
  contentId,
  userId,
}) {
  const ref = getCollection(companyId).doc(contentId);

  const snapshot = await ref.get();

  if (!snapshot.exists || snapshot.data().deletedAt) {
    throw new Error("PUBLIC_CONTENT_NOT_FOUND");
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

    after: await getPublicContentById({
      companyId,
      contentId,
    }),
  };
}

export async function softDeletePublicContentRecord({
  companyId,
  contentId,
  userId,
}) {
  const ref = getCollection(companyId).doc(contentId);

  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new Error("PUBLIC_CONTENT_NOT_FOUND");
  }

  const before = {
    id: snapshot.id,

    ...snapshot.data(),
  };

  if (before.deletedAt) {
    throw new Error("PUBLIC_CONTENT_ALREADY_DELETED");
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
