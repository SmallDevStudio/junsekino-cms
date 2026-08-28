import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

/*
 * =========================================================
 * COLLECTION
 * =========================================================
 */

function getCollection(companyId) {
  return adminDb
    .collection("companies")
    .doc(companyId)
    .collection("aboutPages");
}

/*
 * =========================================================
 * GET
 * =========================================================
 */

export async function getAboutPageById({ companyId, aboutPageId }) {
  const snapshot = await getCollection(companyId).doc(aboutPageId).get();

  if (!snapshot.exists) {
    return null;
  }

  return {
    id: snapshot.id,

    ...snapshot.data(),
  };
}

/*
 * =========================================================
 * LIST
 * =========================================================
 */

export async function listAboutPageRecords(companyId) {
  const snapshot = await getCollection(companyId).get();

  return snapshot.docs
    .map((document) => ({
      id: document.id,

      ...document.data(),
    }))
    .filter((item) => !item.deletedAt);
}

/*
 * =========================================================
 * CREATE
 * =========================================================
 */

export async function createAboutPageRecord({ companyId, data, userId }) {
  const ref = getCollection(companyId).doc();

  await ref.set({
    ...data,

    status: "draft",

    createdAt: FieldValue.serverTimestamp(),

    createdBy: userId,

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: userId,

    publishedAt: null,

    publishedBy: null,

    deletedAt: null,

    deletedBy: null,
  });

  return getAboutPageById({
    companyId,

    aboutPageId: ref.id,
  });
}

/*
 * =========================================================
 * UPDATE
 * =========================================================
 */

export async function updateAboutPageRecord({
  companyId,
  aboutPageId,
  data,
  userId,
}) {
  const ref = getCollection(companyId).doc(aboutPageId);

  const snapshot = await ref.get();

  if (!snapshot.exists || snapshot.data().deletedAt) {
    throw new Error("ABOUT_PAGE_NOT_FOUND");
  }

  const before = {
    id: snapshot.id,

    ...snapshot.data(),
  };

  await ref.update({
    ...data,

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: userId,
  });

  return {
    before,

    after: await getAboutPageById({
      companyId,

      aboutPageId,
    }),
  };
}

/*
 * =========================================================
 * PUBLISH
 * =========================================================
 *
 * Exactly one active About Page
 * should be published per company.
 *
 * Publishing a new version
 * automatically returns the previous
 * published version to draft.
 * =========================================================
 */

export async function publishAboutPageRecord({
  companyId,
  aboutPageId,
  userId,
}) {
  const collectionRef = getCollection(companyId);

  const targetRef = collectionRef.doc(aboutPageId);

  const result = await adminDb.runTransaction(async (transaction) => {
    /*
     * Firestore requires transaction
     * reads before writes.
     */

    const targetSnapshot = await transaction.get(targetRef);

    if (!targetSnapshot.exists || targetSnapshot.data().deletedAt) {
      throw new Error("ABOUT_PAGE_NOT_FOUND");
    }

    const before = {
      id: targetSnapshot.id,

      ...targetSnapshot.data(),
    };

    const publishedQuery = collectionRef.where("status", "==", "published");

    const publishedSnapshot = await transaction.get(publishedQuery);

    /*
     * Unpublish previous version(s).
     */

    for (const document of publishedSnapshot.docs) {
      if (document.id === aboutPageId) {
        continue;
      }

      const data = document.data();

      if (data.deletedAt) {
        continue;
      }

      transaction.update(document.ref, {
        status: "draft",

        publishedAt: null,

        publishedBy: null,

        updatedAt: FieldValue.serverTimestamp(),

        updatedBy: userId,
      });
    }

    /*
     * Publish target.
     */

    transaction.update(targetRef, {
      status: "published",

      publishedAt: FieldValue.serverTimestamp(),

      publishedBy: userId,

      updatedAt: FieldValue.serverTimestamp(),

      updatedBy: userId,
    });

    return {
      before,
    };
  });

  return {
    before: result.before,

    after: await getAboutPageById({
      companyId,

      aboutPageId,
    }),
  };
}

/*
 * =========================================================
 * UNPUBLISH
 * =========================================================
 */

export async function unpublishAboutPageRecord({
  companyId,
  aboutPageId,
  userId,
}) {
  const ref = getCollection(companyId).doc(aboutPageId);

  const snapshot = await ref.get();

  if (!snapshot.exists || snapshot.data().deletedAt) {
    throw new Error("ABOUT_PAGE_NOT_FOUND");
  }

  const before = {
    id: snapshot.id,

    ...snapshot.data(),
  };

  if (before.status !== "published") {
    throw new Error("ABOUT_PAGE_NOT_PUBLISHED");
  }

  await ref.update({
    status: "draft",

    publishedAt: null,

    publishedBy: null,

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: userId,
  });

  return {
    before,

    after: await getAboutPageById({
      companyId,

      aboutPageId,
    }),
  };
}

/*
 * =========================================================
 * DELETE
 * =========================================================
 */

export async function deleteAboutPageRecord({
  companyId,
  aboutPageId,
  userId,
}) {
  const ref = getCollection(companyId).doc(aboutPageId);

  const snapshot = await ref.get();

  if (!snapshot.exists || snapshot.data().deletedAt) {
    throw new Error("ABOUT_PAGE_NOT_FOUND");
  }

  const before = {
    id: snapshot.id,

    ...snapshot.data(),
  };

  /*
   * Never delete the live About page.
   */
  if (before.status === "published") {
    throw new Error("ABOUT_PAGE_PUBLISHED_DELETE_NOT_ALLOWED");
  }

  await ref.update({
    status: "archived",

    deletedAt: FieldValue.serverTimestamp(),

    deletedBy: userId,

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: userId,
  });

  return before;
}

/*
 * =========================================================
 * PUBLIC
 * =========================================================
 */

export async function getPublishedAboutPage(companyId) {
  const snapshot = await getCollection(companyId)
    .where("status", "==", "published")
    .get();

  const items = snapshot.docs
    .map((document) => ({
      id: document.id,

      ...document.data(),
    }))
    .filter((item) => !item.deletedAt);

  if (items.length === 0) {
    return null;
  }

  /*
   * Safety fallback if historical
   * data somehow contains more than
   * one published About version.
   */

  items.sort(
    (a, b) =>
      (b.publishedAt?.toMillis?.() || 0) - (a.publishedAt?.toMillis?.() || 0),
  );

  return items[0];
}
