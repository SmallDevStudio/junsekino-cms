import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

function getNewsCollection(companyId) {
  return adminDb.collection("companies").doc(companyId).collection("news");
}

function getNewsSlugsCollection(companyId) {
  return adminDb.collection("companies").doc(companyId).collection("newsSlugs");
}

export async function getNewsById({ companyId, newsId }) {
  const snapshot = await getNewsCollection(companyId).doc(newsId).get();

  if (!snapshot.exists) {
    return null;
  }

  return {
    id: snapshot.id,

    ...snapshot.data(),
  };
}

export async function getNewsBySlug({ companyId, slug }) {
  const slugSnapshot = await getNewsSlugsCollection(companyId).doc(slug).get();

  if (!slugSnapshot.exists) {
    return null;
  }

  const data = slugSnapshot.data();

  if (!data.newsId) {
    return null;
  }

  return getNewsById({
    companyId,

    newsId: data.newsId,
  });
}

export async function listNewsRecords({ companyId, includeDeleted = false }) {
  const snapshot = await getNewsCollection(companyId).get();

  let items = snapshot.docs.map((document) => ({
    id: document.id,

    ...document.data(),
  }));

  if (!includeDeleted) {
    items = items.filter((item) => !item.deletedAt);
  }

  return items;
}

export async function createNewsRecord({ companyId, data, userId }) {
  const newsRef = getNewsCollection(companyId).doc();

  const slugRef = getNewsSlugsCollection(companyId).doc(data.slug);

  await adminDb.runTransaction(async (transaction) => {
    const slugSnapshot = await transaction.get(slugRef);

    if (slugSnapshot.exists) {
      throw new Error("NEWS_SLUG_EXISTS");
    }

    transaction.set(newsRef, {
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
      newsId: newsRef.id,

      slug: data.slug,

      createdAt: FieldValue.serverTimestamp(),
    });
  });

  return getNewsById({
    companyId,

    newsId: newsRef.id,
  });
}

export async function updateNewsRecord({ companyId, newsId, data, userId }) {
  const newsRef = getNewsCollection(companyId).doc(newsId);

  let before = null;

  await adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(newsRef);

    if (!snapshot.exists) {
      throw new Error("NEWS_NOT_FOUND");
    }

    before = {
      id: snapshot.id,

      ...snapshot.data(),
    };

    if (before.deletedAt) {
      throw new Error("NEWS_NOT_FOUND");
    }

    const oldSlug = before.slug;

    const newSlug = data.slug || oldSlug;

    if (newSlug !== oldSlug) {
      const oldSlugRef = getNewsSlugsCollection(companyId).doc(oldSlug);

      const newSlugRef = getNewsSlugsCollection(companyId).doc(newSlug);

      const newSlugSnapshot = await transaction.get(newSlugRef);

      if (newSlugSnapshot.exists) {
        throw new Error("NEWS_SLUG_EXISTS");
      }

      transaction.delete(oldSlugRef);

      transaction.set(newSlugRef, {
        newsId,

        slug: newSlug,

        createdAt: FieldValue.serverTimestamp(),
      });
    }

    transaction.update(newsRef, {
      ...data,

      updatedAt: FieldValue.serverTimestamp(),

      updatedBy: userId,
    });
  });

  const after = await getNewsById({
    companyId,
    newsId,
  });

  return {
    before,
    after,
  };
}

export async function publishNewsRecord({
  companyId,
  newsId,
  userId,
  scheduledAt = null,
}) {
  const newsRef = getNewsCollection(companyId).doc(newsId);

  const snapshot = await newsRef.get();

  if (!snapshot.exists) {
    throw new Error("NEWS_NOT_FOUND");
  }

  const before = {
    id: snapshot.id,

    ...snapshot.data(),
  };

  if (before.deletedAt) {
    throw new Error("NEWS_NOT_FOUND");
  }

  if (scheduledAt) {
    const scheduleDate = new Date(scheduledAt);

    if (Number.isNaN(scheduleDate.getTime())) {
      throw new Error("INVALID_SCHEDULE_DATE");
    }

    if (scheduleDate.getTime() <= Date.now()) {
      throw new Error("SCHEDULE_MUST_BE_FUTURE");
    }

    await newsRef.update({
      status: "scheduled",

      scheduledAt: Timestamp.fromDate(scheduleDate),

      publishedAt: null,

      publishedBy: null,

      updatedAt: FieldValue.serverTimestamp(),

      updatedBy: userId,
    });
  } else {
    await newsRef.update({
      status: "published",

      scheduledAt: null,

      publishedAt: FieldValue.serverTimestamp(),

      publishedBy: userId,

      updatedAt: FieldValue.serverTimestamp(),

      updatedBy: userId,
    });
  }

  const after = await getNewsById({
    companyId,
    newsId,
  });

  return {
    before,
    after,
  };
}

export async function unpublishNewsRecord({ companyId, newsId, userId }) {
  const newsRef = getNewsCollection(companyId).doc(newsId);

  const snapshot = await newsRef.get();

  if (!snapshot.exists) {
    throw new Error("NEWS_NOT_FOUND");
  }

  const before = {
    id: snapshot.id,

    ...snapshot.data(),
  };

  if (before.deletedAt) {
    throw new Error("NEWS_NOT_FOUND");
  }

  await newsRef.update({
    status: "draft",

    scheduledAt: null,

    publishedAt: null,

    publishedBy: null,

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: userId,
  });

  const after = await getNewsById({
    companyId,
    newsId,
  });

  return {
    before,
    after,
  };
}

export async function softDeleteNewsRecord({ companyId, newsId, userId }) {
  const newsRef = getNewsCollection(companyId).doc(newsId);

  const snapshot = await newsRef.get();

  if (!snapshot.exists) {
    throw new Error("NEWS_NOT_FOUND");
  }

  const before = {
    id: snapshot.id,

    ...snapshot.data(),
  };

  if (before.deletedAt) {
    throw new Error("NEWS_ALREADY_DELETED");
  }

  await newsRef.update({
    status: "archived",

    scheduledAt: null,

    deletedAt: FieldValue.serverTimestamp(),

    deletedBy: userId,

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: userId,
  });

  return before;
}
