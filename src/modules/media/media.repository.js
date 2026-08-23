import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

function getMediaCollection(companyId) {
  return adminDb.collection("companies").doc(companyId).collection("media");
}

export function createMediaDocumentRef(companyId) {
  return getMediaCollection(companyId).doc();
}

export async function getMediaById({ companyId, mediaId }) {
  const snapshot = await getMediaCollection(companyId).doc(mediaId).get();

  if (!snapshot.exists) {
    return null;
  }

  return {
    id: snapshot.id,

    ...snapshot.data(),
  };
}

export async function listMediaRecords({ companyId, includeDeleted = false }) {
  const snapshot = await getMediaCollection(companyId).get();

  let items = snapshot.docs.map((document) => ({
    id: document.id,

    ...document.data(),
  }));

  if (!includeDeleted) {
    items = items.filter((item) => !item.deletedAt);
  }

  return items;
}

export async function createPendingMediaRecord({
  companyId,
  mediaId,
  data,
  userId,
}) {
  const ref = getMediaCollection(companyId).doc(mediaId);

  await ref.set({
    ...data,

    status: "uploading",

    variants: {},

    createdAt: FieldValue.serverTimestamp(),

    createdBy: userId,

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: userId,

    uploadedAt: null,

    processedAt: null,

    deletedAt: null,

    deletedBy: null,
  });

  return getMediaById({
    companyId,
    mediaId,
  });
}

export async function markMediaProcessing({ companyId, mediaId, userId }) {
  const ref = getMediaCollection(companyId).doc(mediaId);

  const snapshot = await ref.get();

  if (!snapshot.exists || snapshot.data().deletedAt) {
    throw new Error("MEDIA_NOT_FOUND");
  }

  await ref.update({
    status: "processing",

    failureReason: null,

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: userId,
  });
}

export async function markMediaReady({ companyId, mediaId, data, userId }) {
  const ref = getMediaCollection(companyId).doc(mediaId);

  const snapshot = await ref.get();

  if (!snapshot.exists || snapshot.data().deletedAt) {
    throw new Error("MEDIA_NOT_FOUND");
  }

  const before = {
    id: snapshot.id,

    ...snapshot.data(),
  };

  await ref.update({
    ...data,

    status: "ready",

    failureReason: null,

    uploadedAt: FieldValue.serverTimestamp(),

    processedAt: FieldValue.serverTimestamp(),

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: userId,
  });

  const after = await getMediaById({
    companyId,
    mediaId,
  });

  return {
    before,
    after,
  };
}

export async function markMediaFailed({ companyId, mediaId, reason, userId }) {
  const ref = getMediaCollection(companyId).doc(mediaId);

  const snapshot = await ref.get();

  if (!snapshot.exists) {
    return;
  }

  await ref.update({
    status: "failed",

    failureReason: reason,

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: userId,
  });
}

export async function updateMediaRecord({ companyId, mediaId, data, userId }) {
  const ref = getMediaCollection(companyId).doc(mediaId);

  const snapshot = await ref.get();

  if (!snapshot.exists || snapshot.data().deletedAt) {
    throw new Error("MEDIA_NOT_FOUND");
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

  const after = await getMediaById({
    companyId,
    mediaId,
  });

  return {
    before,
    after,
  };
}

export async function softDeleteMediaRecord({ companyId, mediaId, userId }) {
  const ref = getMediaCollection(companyId).doc(mediaId);

  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new Error("MEDIA_NOT_FOUND");
  }

  const before = {
    id: snapshot.id,

    ...snapshot.data(),
  };

  if (before.deletedAt) {
    throw new Error("MEDIA_ALREADY_DELETED");
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
