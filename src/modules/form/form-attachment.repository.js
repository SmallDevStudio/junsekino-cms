import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

const PENDING_ATTACHMENT_RETENTION_MS = 24 * 60 * 60 * 1000;

function getAttachmentCollection(companyId) {
  return adminDb
    .collection("companies")
    .doc(companyId)
    .collection("formAttachments");
}

function createCleanupTimestamp() {
  return Timestamp.fromDate(
    new Date(Date.now() + PENDING_ATTACHMENT_RETENTION_MS),
  );
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

export async function listAttachmentsBySubmissionId({
  companyId,
  submissionId,
}) {
  const snapshot = await getAttachmentCollection(companyId)
    .where("submissionId", "==", submissionId)
    .get();

  return snapshot.docs.map((document) => ({
    id: document.id,

    ...document.data(),
  }));
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

    /*
     * Pending and unattached files must be
     * removed by the Storage-aware cleanup job.
     *
     * Do not configure Firestore TTL on this field.
     */
    cleanupAfter: createCleanupTimestamp(),

    cleanupStatus: "pending",

    cleanupAttempts: 0,

    cleanupError: null,

    createdAt: FieldValue.serverTimestamp(),

    updatedAt: FieldValue.serverTimestamp(),

    finalizedAt: null,

    attachedAt: null,

    retentionExpiresAt: null,

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

    /*
     * A finalized file that is never submitted
     * is still temporary and must be cleaned.
     */
    cleanupAfter: createCleanupTimestamp(),

    cleanupStatus: "pending",

    cleanupError: null,

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

    cleanupAfter: createCleanupTimestamp(),

    cleanupStatus: "pending",

    cleanupError: null,

    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function markAttachmentCleanupStarted({
  companyId,
  attachmentId,
}) {
  const ref = getAttachmentCollection(companyId).doc(attachmentId);

  const snapshot = await ref.get();

  if (!snapshot.exists) {
    return null;
  }

  await ref.update({
    cleanupStatus: "processing",

    cleanupAttempts: FieldValue.increment(1),

    cleanupStartedAt: FieldValue.serverTimestamp(),

    cleanupError: null,

    updatedAt: FieldValue.serverTimestamp(),
  });

  return getAttachmentById({
    companyId,

    attachmentId,
  });
}

export async function markAttachmentCleanupFailed({
  companyId,
  attachmentId,
  error,
}) {
  const ref = getAttachmentCollection(companyId).doc(attachmentId);

  const snapshot = await ref.get();

  if (!snapshot.exists) {
    return;
  }

  await ref.update({
    cleanupStatus: "failed",

    cleanupError: String(error || "ATTACHMENT_CLEANUP_FAILED").slice(0, 1000),

    cleanupFailedAt: FieldValue.serverTimestamp(),

    /*
     * Retry after one hour.
     */
    cleanupAfter: Timestamp.fromDate(new Date(Date.now() + 60 * 60 * 1000)),

    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function deleteAttachmentRecord({ companyId, attachmentId }) {
  await getAttachmentCollection(companyId).doc(attachmentId).delete();

  return {
    id: attachmentId,

    deleted: true,
  };
}

export async function listExpiredUnattachedAttachments({
  companyId,
  now = new Date(),
  limit = 100,
}) {
  const safeLimit = Math.max(
    1,

    Math.min(200, limit),
  );

  const snapshot = await getAttachmentCollection(companyId)
    .where("cleanupAfter", "<=", Timestamp.fromDate(now))
    .limit(safeLimit)
    .get();

  return snapshot.docs
    .map((document) => ({
      id: document.id,

      ...document.data(),
    }))
    .filter(
      (attachment) =>
        !attachment.submissionId && attachment.status !== "attached",
    );
}
