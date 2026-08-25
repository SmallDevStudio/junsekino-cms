import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

function getAttachmentCollection(companyId) {
  return adminDb
    .collection("companies")
    .doc(companyId)
    .collection("formAttachments");
}

export function createAttachmentRef(companyId) {
  return getAttachmentCollection(companyId).doc();
}

export async function getAttachmentById({ companyId, attachmentId }) {
  const snapshot = await getAttachmentCollection(companyId)
    .doc(attachmentId)
    .get();

  if (!snapshot.exists) {
    return null;
  }

  return {
    id: snapshot.id,

    ...snapshot.data(),
  };
}

export async function createPendingAttachment({
  companyId,
  attachmentId,
  data,
}) {
  const ref = getAttachmentCollection(companyId).doc(attachmentId);

  await ref.set({
    ...data,

    status: "uploading",

    submissionId: null,

    createdAt: FieldValue.serverTimestamp(),

    updatedAt: FieldValue.serverTimestamp(),

    finalizedAt: null,

    attachedAt: null,

    deletedAt: null,
  });

  return getAttachmentById({
    companyId,
    attachmentId,
  });
}

export async function markAttachmentReady({ companyId, attachmentId, data }) {
  const ref = getAttachmentCollection(companyId).doc(attachmentId);

  const snapshot = await ref.get();

  if (!snapshot.exists || snapshot.data().deletedAt) {
    throw new Error("FORM_ATTACHMENT_NOT_FOUND");
  }

  await ref.update({
    ...data,

    status: "ready",

    failureReason: null,

    finalizedAt: FieldValue.serverTimestamp(),

    updatedAt: FieldValue.serverTimestamp(),
  });

  return getAttachmentById({
    companyId,
    attachmentId,
  });
}

export async function markAttachmentFailed({
  companyId,
  attachmentId,
  reason,
}) {
  const ref = getAttachmentCollection(companyId).doc(attachmentId);

  const snapshot = await ref.get();

  if (!snapshot.exists) {
    return;
  }

  await ref.update({
    status: "failed",

    failureReason: reason,

    updatedAt: FieldValue.serverTimestamp(),
  });
}
