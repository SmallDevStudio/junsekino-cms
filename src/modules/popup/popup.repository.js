import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

function getPopupCollection(companyId) {
  return adminDb.collection("companies").doc(companyId).collection("popups");
}

export async function getPopupById({ companyId, popupId }) {
  const snapshot = await getPopupCollection(companyId).doc(popupId).get();

  if (!snapshot.exists) {
    return null;
  }

  return {
    id: snapshot.id,

    ...snapshot.data(),
  };
}

export async function listPopupRecords(companyId) {
  const snapshot = await getPopupCollection(companyId).get();

  return snapshot.docs
    .map((document) => ({
      id: document.id,

      ...document.data(),
    }))
    .filter((item) => !item.deletedAt);
}

export async function createPopupRecord({ companyId, data, userId }) {
  const ref = getPopupCollection(companyId).doc();

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

  return getPopupById({
    companyId,
    popupId: ref.id,
  });
}

export async function updatePopupRecord({ companyId, popupId, data, userId }) {
  const ref = getPopupCollection(companyId).doc(popupId);

  const snapshot = await ref.get();

  if (!snapshot.exists || snapshot.data().deletedAt) {
    throw new Error("POPUP_NOT_FOUND");
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

    after: await getPopupById({
      companyId,
      popupId,
    }),
  };
}

export async function publishPopupRecord({ companyId, popupId, userId }) {
  const ref = getPopupCollection(companyId).doc(popupId);

  const snapshot = await ref.get();

  if (!snapshot.exists || snapshot.data().deletedAt) {
    throw new Error("POPUP_NOT_FOUND");
  }

  const before = {
    id: snapshot.id,
    ...snapshot.data(),
  };

  await ref.update({
    status: "published",

    publishedAt: FieldValue.serverTimestamp(),

    publishedBy: userId,

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: userId,
  });

  return {
    before,

    after: await getPopupById({
      companyId,
      popupId,
    }),
  };
}

export async function unpublishPopupRecord({ companyId, popupId, userId }) {
  const ref = getPopupCollection(companyId).doc(popupId);

  const snapshot = await ref.get();

  if (!snapshot.exists || snapshot.data().deletedAt) {
    throw new Error("POPUP_NOT_FOUND");
  }

  const before = {
    id: snapshot.id,
    ...snapshot.data(),
  };

  await ref.update({
    status: "draft",

    publishedAt: null,

    publishedBy: null,

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: userId,
  });

  return {
    before,

    after: await getPopupById({
      companyId,
      popupId,
    }),
  };
}

export async function deletePopupRecord({ companyId, popupId, userId }) {
  const ref = getPopupCollection(companyId).doc(popupId);

  const snapshot = await ref.get();

  if (!snapshot.exists || snapshot.data().deletedAt) {
    throw new Error("POPUP_NOT_FOUND");
  }

  const before = {
    id: snapshot.id,
    ...snapshot.data(),
  };

  await ref.update({
    status: "archived",

    deletedAt: FieldValue.serverTimestamp(),

    deletedBy: userId,

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: userId,
  });

  return before;
}

export async function listActivePublicPopups({ companyId }) {
  const snapshot = await getPopupCollection(companyId)
    .where("status", "==", "published")
    .get();

  const now = Date.now();

  return snapshot.docs
    .map((document) => ({
      id: document.id,

      ...document.data(),
    }))
    .filter((popup) => {
      if (popup.deletedAt) {
        return false;
      }

      const startAt = popup.schedule?.startAt;

      const endAt = popup.schedule?.endAt;

      const startMillis = startAt?.toMillis?.() || null;

      const endMillis = endAt?.toMillis?.() || null;

      if (startMillis && startMillis > now) {
        return false;
      }

      if (endMillis && endMillis < now) {
        return false;
      }

      return true;
    });
}
