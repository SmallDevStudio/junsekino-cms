import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

function getPagesCollection(companyId) {
  return adminDb.collection("companies").doc(companyId).collection("pages");
}

function getPageSlugsCollection(companyId) {
  return adminDb.collection("companies").doc(companyId).collection("pageSlugs");
}

export async function getPageById({ companyId, pageId }) {
  const snapshot = await getPagesCollection(companyId).doc(pageId).get();

  if (!snapshot.exists) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

export async function getPageBySlug({ companyId, slug }) {
  const slugSnapshot = await getPageSlugsCollection(companyId).doc(slug).get();

  if (!slugSnapshot.exists) {
    return null;
  }

  const { pageId } = slugSnapshot.data();

  if (!pageId) {
    return null;
  }

  return getPageById({
    companyId,
    pageId,
  });
}

export async function listPageRecords({ companyId, includeDeleted = false }) {
  const snapshot = await getPagesCollection(companyId).get();

  let items = snapshot.docs.map((document) => ({
    id: document.id,

    ...document.data(),
  }));

  if (!includeDeleted) {
    items = items.filter((item) => !item.deletedAt);
  }

  return items;
}

export async function createPageRecord({ companyId, data, userId }) {
  const pageRef = getPagesCollection(companyId).doc();

  const slugRef = getPageSlugsCollection(companyId).doc(data.slug);

  await adminDb.runTransaction(async (transaction) => {
    const slugSnapshot = await transaction.get(slugRef);

    if (slugSnapshot.exists) {
      throw new Error("PAGE_SLUG_EXISTS");
    }

    transaction.set(pageRef, {
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
      pageId: pageRef.id,

      slug: data.slug,

      createdAt: FieldValue.serverTimestamp(),
    });
  });

  return getPageById({
    companyId,

    pageId: pageRef.id,
  });
}

export async function updatePageRecord({ companyId, pageId, data, userId }) {
  const pageRef = getPagesCollection(companyId).doc(pageId);

  let before = null;

  await adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(pageRef);

    if (!snapshot.exists) {
      throw new Error("PAGE_NOT_FOUND");
    }

    before = {
      id: snapshot.id,

      ...snapshot.data(),
    };

    if (before.deletedAt) {
      throw new Error("PAGE_NOT_FOUND");
    }

    const oldSlug = before.slug;

    const newSlug = data.slug || oldSlug;

    if (oldSlug !== newSlug) {
      const oldSlugRef = getPageSlugsCollection(companyId).doc(oldSlug);

      const newSlugRef = getPageSlugsCollection(companyId).doc(newSlug);

      const newSlugSnapshot = await transaction.get(newSlugRef);

      if (newSlugSnapshot.exists) {
        throw new Error("PAGE_SLUG_EXISTS");
      }

      transaction.delete(oldSlugRef);

      transaction.set(newSlugRef, {
        pageId,

        slug: newSlug,

        createdAt: FieldValue.serverTimestamp(),
      });
    }

    transaction.update(pageRef, {
      ...data,

      updatedAt: FieldValue.serverTimestamp(),

      updatedBy: userId,
    });
  });

  const after = await getPageById({
    companyId,
    pageId,
  });

  return {
    before,
    after,
  };
}

export async function publishPageRecord({
  companyId,
  pageId,
  userId,
  scheduledAt = null,
}) {
  const pageRef = getPagesCollection(companyId).doc(pageId);

  const snapshot = await pageRef.get();

  if (!snapshot.exists) {
    throw new Error("PAGE_NOT_FOUND");
  }

  const before = {
    id: snapshot.id,

    ...snapshot.data(),
  };

  if (before.deletedAt) {
    throw new Error("PAGE_NOT_FOUND");
  }

  if (scheduledAt) {
    const scheduleDate = new Date(scheduledAt);

    if (Number.isNaN(scheduleDate.getTime())) {
      throw new Error("INVALID_SCHEDULE_DATE");
    }

    if (scheduleDate.getTime() <= Date.now()) {
      throw new Error("SCHEDULE_MUST_BE_FUTURE");
    }

    await pageRef.update({
      status: "scheduled",

      scheduledAt: Timestamp.fromDate(scheduleDate),

      publishedAt: null,

      publishedBy: null,

      updatedAt: FieldValue.serverTimestamp(),

      updatedBy: userId,
    });
  } else {
    await pageRef.update({
      status: "published",

      scheduledAt: null,

      publishedAt: FieldValue.serverTimestamp(),

      publishedBy: userId,

      updatedAt: FieldValue.serverTimestamp(),

      updatedBy: userId,
    });
  }

  const after = await getPageById({
    companyId,
    pageId,
  });

  return {
    before,
    after,
  };
}

export async function unpublishPageRecord({ companyId, pageId, userId }) {
  const pageRef = getPagesCollection(companyId).doc(pageId);

  const snapshot = await pageRef.get();

  if (!snapshot.exists) {
    throw new Error("PAGE_NOT_FOUND");
  }

  const before = {
    id: snapshot.id,

    ...snapshot.data(),
  };

  if (before.deletedAt) {
    throw new Error("PAGE_NOT_FOUND");
  }

  await pageRef.update({
    status: "draft",

    scheduledAt: null,

    publishedAt: null,

    publishedBy: null,

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: userId,
  });

  const after = await getPageById({
    companyId,
    pageId,
  });

  return {
    before,
    after,
  };
}

export async function softDeletePageRecord({ companyId, pageId, userId }) {
  const pageRef = getPagesCollection(companyId).doc(pageId);

  const snapshot = await pageRef.get();

  if (!snapshot.exists) {
    throw new Error("PAGE_NOT_FOUND");
  }

  const before = {
    id: snapshot.id,

    ...snapshot.data(),
  };

  if (before.deletedAt) {
    throw new Error("PAGE_ALREADY_DELETED");
  }

  await pageRef.update({
    status: "archived",

    scheduledAt: null,

    deletedAt: FieldValue.serverTimestamp(),

    deletedBy: userId,

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: userId,
  });

  return before;
}
