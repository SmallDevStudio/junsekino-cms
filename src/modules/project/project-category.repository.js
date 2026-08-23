import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

function getCollection(companyId) {
  return adminDb
    .collection("companies")
    .doc(companyId)
    .collection("projectCategories");
}

function getSlugCollection(companyId) {
  return adminDb
    .collection("companies")
    .doc(companyId)
    .collection("projectCategorySlugs");
}

export async function getProjectCategoryById({ companyId, categoryId }) {
  const snapshot = await getCollection(companyId).doc(categoryId).get();

  if (!snapshot.exists) {
    return null;
  }

  return {
    id: snapshot.id,

    ...snapshot.data(),
  };
}

export async function listProjectCategoryRecords(companyId) {
  const snapshot = await getCollection(companyId).get();

  return snapshot.docs
    .map((document) => ({
      id: document.id,

      ...document.data(),
    }))
    .filter((item) => !item.deletedAt);
}

export async function createProjectCategoryRecord({ companyId, data, userId }) {
  const ref = getCollection(companyId).doc();

  const slugRef = getSlugCollection(companyId).doc(data.slug);

  await adminDb.runTransaction(async (transaction) => {
    const slugSnapshot = await transaction.get(slugRef);

    if (slugSnapshot.exists) {
      throw new Error("PROJECT_CATEGORY_SLUG_EXISTS");
    }

    if (data.parentId) {
      const parentRef = getCollection(companyId).doc(data.parentId);

      const parentSnapshot = await transaction.get(parentRef);

      if (!parentSnapshot.exists || parentSnapshot.data().deletedAt) {
        throw new Error("PROJECT_CATEGORY_PARENT_NOT_FOUND");
      }
    }

    transaction.set(ref, {
      ...data,

      createdAt: FieldValue.serverTimestamp(),

      createdBy: userId,

      updatedAt: FieldValue.serverTimestamp(),

      updatedBy: userId,

      deletedAt: null,

      deletedBy: null,
    });

    transaction.set(slugRef, {
      categoryId: ref.id,

      createdAt: FieldValue.serverTimestamp(),
    });
  });

  return getProjectCategoryById({
    companyId,

    categoryId: ref.id,
  });
}

export async function updateProjectCategoryRecord({
  companyId,
  categoryId,
  data,
  userId,
}) {
  const ref = getCollection(companyId).doc(categoryId);

  let before = null;

  await adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);

    if (!snapshot.exists || snapshot.data().deletedAt) {
      throw new Error("PROJECT_CATEGORY_NOT_FOUND");
    }

    before = {
      id: snapshot.id,

      ...snapshot.data(),
    };

    if (data.parentId === categoryId) {
      throw new Error("PROJECT_CATEGORY_CANNOT_PARENT_SELF");
    }

    if (data.parentId) {
      const parentRef = getCollection(companyId).doc(data.parentId);

      const parentSnapshot = await transaction.get(parentRef);

      if (!parentSnapshot.exists || parentSnapshot.data().deletedAt) {
        throw new Error("PROJECT_CATEGORY_PARENT_NOT_FOUND");
      }
    }

    const oldSlug = before.slug;

    const newSlug = data.slug || oldSlug;

    if (newSlug !== oldSlug) {
      const oldSlugRef = getSlugCollection(companyId).doc(oldSlug);

      const newSlugRef = getSlugCollection(companyId).doc(newSlug);

      const newSlugSnapshot = await transaction.get(newSlugRef);

      if (newSlugSnapshot.exists) {
        throw new Error("PROJECT_CATEGORY_SLUG_EXISTS");
      }

      transaction.delete(oldSlugRef);

      transaction.set(newSlugRef, {
        categoryId,

        createdAt: FieldValue.serverTimestamp(),
      });
    }

    transaction.update(ref, {
      ...data,

      updatedAt: FieldValue.serverTimestamp(),

      updatedBy: userId,
    });
  });

  const after = await getProjectCategoryById({
    companyId,
    categoryId,
  });

  return {
    before,
    after,
  };
}
