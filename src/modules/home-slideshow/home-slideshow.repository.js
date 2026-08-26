import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

function getCollection(companyId) {
  return adminDb
    .collection("companies")
    .doc(companyId)
    .collection("homeSlideshows");
}

export async function getHomeSlideshowById({ companyId, slideshowId }) {
  const snapshot = await getCollection(companyId).doc(slideshowId).get();

  if (!snapshot.exists) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

export async function listHomeSlideshowRecords(companyId) {
  const snapshot = await getCollection(companyId).get();

  return snapshot.docs
    .map((document) => ({
      id: document.id,
      ...document.data(),
    }))
    .filter((item) => !item.deletedAt);
}

export async function createHomeSlideshowRecord({ companyId, data, userId }) {
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

  return getHomeSlideshowById({
    companyId,
    slideshowId: ref.id,
  });
}

export async function updateHomeSlideshowRecord({
  companyId,
  slideshowId,
  data,
  userId,
}) {
  const ref = getCollection(companyId).doc(slideshowId);

  const snapshot = await ref.get();

  if (!snapshot.exists || snapshot.data().deletedAt) {
    throw new Error("HOME_SLIDESHOW_NOT_FOUND");
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

    after: await getHomeSlideshowById({
      companyId,
      slideshowId,
    }),
  };
}

export async function publishHomeSlideshowRecord({
  companyId,
  slideshowId,
  userId,
}) {
  const collectionRef = getCollection(companyId);

  const targetRef = collectionRef.doc(slideshowId);

  /*
   * IMPORTANT
   *
   * Firestore transaction reads must happen
   * before transaction writes.
   *
   * We read the target and current published
   * slideshows inside the same transaction so
   * publishing remains atomic.
   */
  const result = await adminDb.runTransaction(async (transaction) => {
    const targetSnapshot = await transaction.get(targetRef);

    if (!targetSnapshot.exists || targetSnapshot.data().deletedAt) {
      throw new Error("HOME_SLIDESHOW_NOT_FOUND");
    }

    const before = {
      id: targetSnapshot.id,
      ...targetSnapshot.data(),
    };

    /*
     * Only query currently published records.
     *
     * This is normally zero or one document.
     */
    const publishedQuery = collectionRef.where("status", "==", "published");

    const publishedSnapshot = await transaction.get(publishedQuery);

    /*
     * Unpublish every other currently
     * published slideshow.
     */
    for (const document of publishedSnapshot.docs) {
      if (document.id === slideshowId) {
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

    after: await getHomeSlideshowById({
      companyId,
      slideshowId,
    }),
  };
}

export async function deleteHomeSlideshowRecord({
  companyId,
  slideshowId,
  userId,
}) {
  const ref = getCollection(companyId).doc(slideshowId);

  const snapshot = await ref.get();

  if (!snapshot.exists || snapshot.data().deletedAt) {
    throw new Error("HOME_SLIDESHOW_NOT_FOUND");
  }

  const before = {
    id: snapshot.id,
    ...snapshot.data(),
  };

  if (before.status === "published") {
    throw new Error("HOME_SLIDESHOW_PUBLISHED_DELETE_NOT_ALLOWED");
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

export async function getPublishedHomeSlideshow(companyId) {
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
   * Safety guard.
   *
   * Normally there is exactly one
   * published slideshow.
   */
  items.sort(
    (a, b) =>
      (b.publishedAt?.toMillis?.() || 0) - (a.publishedAt?.toMillis?.() || 0),
  );

  return items[0];
}
