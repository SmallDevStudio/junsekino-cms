import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

/*
 * =========================================================
 * COLLECTIONS
 * =========================================================
 */

function getSubmissionCollection(companyId) {
  return adminDb
    .collection("companies")
    .doc(companyId)
    .collection("formSubmissions");
}

function getAttachmentCollection(companyId) {
  return adminDb
    .collection("companies")
    .doc(companyId)
    .collection("formAttachments");
}

function getRateLimitCollection(companyId) {
  return adminDb
    .collection("companies")
    .doc(companyId)
    .collection("formSubmissionRateLimits");
}

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function normalizeRetentionTimestamp(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Timestamp) {
    return value;
  }

  if (value instanceof Date) {
    return Timestamp.fromDate(value);
  }

  if (typeof value?.toDate === "function") {
    return Timestamp.fromDate(value.toDate());
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return Timestamp.fromDate(date);
}

function isExpiredTimestamp(
  value,

  now = new Date(),
) {
  if (!value) {
    return false;
  }

  const date =
    typeof value.toDate === "function" ? value.toDate() : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date.getTime() <= now.getTime();
}

/*
 * =========================================================
 * GET
 * =========================================================
 */

export async function getSubmissionById({ companyId, submissionId }) {
  const snapshot = await getSubmissionCollection(companyId)
    .doc(submissionId)
    .get();

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

export async function listSubmissionRecords({
  companyId,
  formId = null,
  status = null,
  folder = "inbox",
}) {
  const snapshot = await getSubmissionCollection(companyId).get();

  let items = snapshot.docs.map((document) => ({
    id: document.id,

    ...document.data(),
  }));

  if (formId) {
    items = items.filter((item) => item.formId === formId);
  }

  if (status) {
    items = items.filter((item) => item.status === status);
  }

  if (folder === "trash") {
    return items.filter((item) => Boolean(item.deletedAt));
  }

  return items.filter((item) => !item.deletedAt);
}

/*
 * =========================================================
 * LIST EXPIRED
 * =========================================================
 *
 * Do not enable Firestore TTL on formSubmissions.
 *
 * The cleanup service must remove private Storage
 * attachments before deleting the submission document.
 * =========================================================
 */

export async function listExpiredSubmissionRecords({
  companyId,
  now = new Date(),
  limit = 100,
}) {
  const safeLimit = Math.max(
    1,

    Math.min(200, limit),
  );

  const snapshot = await getSubmissionCollection(companyId)
    .where("retentionExpiresAt", "<=", Timestamp.fromDate(now))
    .limit(safeLimit)
    .get();

  return snapshot.docs.map((document) => ({
    id: document.id,

    ...document.data(),
  }));
}

/*
 * =========================================================
 * RATE LIMIT
 * =========================================================
 */

export async function checkSubmissionRateLimit({
  companyId,
  formId,
  visitorHash,
  limit = 5,
}) {
  const bucket = Math.floor(Date.now() / (60 * 60 * 1000));

  const ref = getRateLimitCollection(companyId).doc(
    `${formId}_${visitorHash}_${bucket}`,
  );

  let allowed = false;

  let count = 0;

  await adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);

    const existing = snapshot.exists ? snapshot.data().count || 0 : 0;

    count = existing;

    if (existing >= limit) {
      return;
    }

    count = existing + 1;

    transaction.set(
      ref,

      {
        formId,

        count,

        /*
         * This collection contains no Storage
         * references and can safely use Firestore TTL.
         */
        expiresAt: Timestamp.fromDate(
          new Date(Date.now() + 2 * 60 * 60 * 1000),
        ),

        updatedAt: FieldValue.serverTimestamp(),
      },

      {
        merge: true,
      },
    );

    allowed = true;
  });

  return {
    allowed,

    count,

    limit,
  };
}

/*
 * =========================================================
 * CREATE
 * =========================================================
 */

export async function createSubmissionRecord({
  companyId,
  data,
  attachmentBindings = [],
  visitorHash,
}) {
  const submissionRef = getSubmissionCollection(companyId).doc();

  const attachmentRefs = attachmentBindings.map((binding) =>
    getAttachmentCollection(companyId).doc(binding.attachmentId),
  );

  const retentionExpiresAt = normalizeRetentionTimestamp(
    data.retentionExpiresAt,
  );

  await adminDb.runTransaction(async (transaction) => {
    /*
     * All transaction reads must happen
     * before transaction writes.
     */
    const attachmentSnapshots =
      attachmentRefs.length > 0
        ? await transaction.getAll(...attachmentRefs)
        : [];

    for (let index = 0; index < attachmentBindings.length; index += 1) {
      const binding = attachmentBindings[index];

      const snapshot = attachmentSnapshots[index];

      if (!snapshot.exists) {
        throw new Error(`FORM_ATTACHMENT_NOT_FOUND:${binding.fieldId}`);
      }

      const attachment = snapshot.data();

      if (attachment.deletedAt || attachment.status !== "ready") {
        throw new Error(`FORM_ATTACHMENT_NOT_READY:${binding.fieldId}`);
      }

      if (attachment.visitorHash !== visitorHash) {
        throw new Error(`FORM_ATTACHMENT_NOT_FOUND:${binding.fieldId}`);
      }

      if (attachment.formId !== data.formId) {
        throw new Error(`FORM_ATTACHMENT_FORM_MISMATCH:${binding.fieldId}`);
      }

      if (attachment.fieldId !== binding.fieldId) {
        throw new Error(`FORM_ATTACHMENT_FIELD_MISMATCH:${binding.fieldId}`);
      }

      if (attachment.submissionId) {
        throw new Error(`FORM_ATTACHMENT_ALREADY_ATTACHED:${binding.fieldId}`);
      }
    }

    transaction.set(
      submissionRef,

      {
        ...data,

        retentionExpiresAt,

        status: "new",

        createdAt: FieldValue.serverTimestamp(),

        updatedAt: FieldValue.serverTimestamp(),

        assignedTo: null,

        readAt: null,

        readBy: {},

        resolvedAt: null,

        deletedAt: null,

        deletedBy: null,

        cleanupStatus: "retained",

        cleanupAttempts: 0,

        cleanupError: null,
      },
    );

    for (let index = 0; index < attachmentBindings.length; index += 1) {
      const attachmentRef = attachmentRefs[index];

      transaction.update(
        attachmentRef,

        {
          status: "attached",

          submissionId: submissionRef.id,

          attachedAt: FieldValue.serverTimestamp(),

          /*
           * Attached files follow the same
           * retention policy as the submission.
           */
          retentionExpiresAt,

          /*
           * The temporary-file cleanup job
           * must no longer delete this file.
           */
          cleanupAfter: null,

          cleanupStatus: "retained",

          cleanupError: null,

          updatedAt: FieldValue.serverTimestamp(),
        },
      );
    }
  });

  return getSubmissionById({
    companyId,

    submissionId: submissionRef.id,
  });
}

/*
 * =========================================================
 * STATUS
 * =========================================================
 */

export async function updateSubmissionStatusRecord({
  companyId,
  submissionId,
  status,
  userId,
}) {
  const ref = getSubmissionCollection(companyId).doc(submissionId);

  const snapshot = await ref.get();

  if (!snapshot.exists || snapshot.data().deletedAt) {
    throw new Error("FORM_SUBMISSION_NOT_FOUND");
  }

  const before = {
    id: snapshot.id,

    ...snapshot.data(),
  };

  const data = {
    status,

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: userId,
  };

  if (status === "read" && !before.readAt) {
    data.readAt = FieldValue.serverTimestamp();
  }

  if (status === "resolved") {
    data.resolvedAt = FieldValue.serverTimestamp();
  }

  await ref.update(data);

  return {
    before,

    after: await getSubmissionById({
      companyId,

      submissionId,
    }),
  };
}

/*
 * =========================================================
 * MARK READ — PER USER
 * =========================================================
 */

export async function markSubmissionReadRecord({
  companyId,
  submissionId,
  reader,
}) {
  const ref = getSubmissionCollection(companyId).doc(submissionId);

  let before = null;

  await adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);

    if (!snapshot.exists || snapshot.data()?.deletedAt) {
      throw new Error("FORM_SUBMISSION_NOT_FOUND");
    }

    before = {
      id: snapshot.id,

      ...snapshot.data(),
    };

    const existingReadBy =
      before.readBy && typeof before.readBy === "object" ? before.readBy : {};

    if (existingReadBy[reader.uid]) {
      return;
    }

    const nextReadBy = {
      ...existingReadBy,

      [reader.uid]: {
        uid: reader.uid,

        displayName: reader.displayName || reader.email || "User",

        email: reader.email || null,

        avatarUrl: reader.avatarUrl || null,

        readAt: new Date(),
      },
    };

    const update = {
      readBy: nextReadBy,

      updatedAt: FieldValue.serverTimestamp(),
    };

    if (before.status === "new") {
      update.status = "read";

      if (!before.readAt) {
        update.readAt = FieldValue.serverTimestamp();
      }
    }

    transaction.update(ref, update);
  });

  return {
    before,

    after: await getSubmissionById({
      companyId,

      submissionId,
    }),
  };
}

/*
 * =========================================================
 * MOVE TO TRASH
 * =========================================================
 */

export async function trashSubmissionRecord({
  companyId,
  submissionId,
  userId,
}) {
  const ref = getSubmissionCollection(companyId).doc(submissionId);

  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new Error("FORM_SUBMISSION_NOT_FOUND");
  }

  const before = {
    id: snapshot.id,

    ...snapshot.data(),
  };

  if (before.deletedAt) {
    return {
      before,

      after: before,
    };
  }

  await ref.update({
    deletedAt: FieldValue.serverTimestamp(),

    deletedBy: userId,

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: userId,
  });

  return {
    before,

    after: await getSubmissionById({
      companyId,

      submissionId,
    }),
  };
}

/*
 * =========================================================
 * RESTORE
 * =========================================================
 */

export async function restoreSubmissionRecord({
  companyId,
  submissionId,
  userId,
}) {
  const ref = getSubmissionCollection(companyId).doc(submissionId);

  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new Error("FORM_SUBMISSION_NOT_FOUND");
  }

  const before = {
    id: snapshot.id,

    ...snapshot.data(),
  };

  if (!before.deletedAt) {
    return {
      before,

      after: before,
    };
  }

  await ref.update({
    deletedAt: null,

    deletedBy: null,

    restoredAt: FieldValue.serverTimestamp(),

    restoredBy: userId,

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: userId,
  });

  return {
    before,

    after: await getSubmissionById({
      companyId,

      submissionId,
    }),
  };
}

/*
 * =========================================================
 * CLEANUP STATUS
 * =========================================================
 */

export async function markSubmissionCleanupStarted({
  companyId,
  submissionId,
}) {
  const ref = getSubmissionCollection(companyId).doc(submissionId);

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

  return getSubmissionById({
    companyId,

    submissionId,
  });
}

export async function markSubmissionCleanupFailed({
  companyId,
  submissionId,
  error,
}) {
  const ref = getSubmissionCollection(companyId).doc(submissionId);

  const snapshot = await ref.get();

  if (!snapshot.exists) {
    return;
  }

  await ref.update({
    cleanupStatus: "failed",

    cleanupError: String(error || "FORM_SUBMISSION_CLEANUP_FAILED").slice(
      0,
      1000,
    ),

    cleanupFailedAt: FieldValue.serverTimestamp(),

    updatedAt: FieldValue.serverTimestamp(),
  });
}

/*
 * =========================================================
 * PERMANENT DELETE
 * =========================================================
 */

export async function permanentlyDeleteSubmissionRecord({
  companyId,
  submissionId,
  allowExpired = false,
  now = new Date(),
}) {
  const ref = getSubmissionCollection(companyId).doc(submissionId);

  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new Error("FORM_SUBMISSION_NOT_FOUND");
  }

  const before = {
    id: snapshot.id,

    ...snapshot.data(),
  };

  const expired = isExpiredTimestamp(
    before.retentionExpiresAt,

    now,
  );

  /*
   * Manual permanent deletion:
   * submission must be in Trash.
   *
   * Automated retention cleanup:
   * submission must have actually expired.
   */
  if (!before.deletedAt && !(allowExpired && expired)) {
    throw new Error("FORM_SUBMISSION_NOT_IN_TRASH");
  }

  if (allowExpired && !expired) {
    throw new Error("FORM_SUBMISSION_RETENTION_NOT_EXPIRED");
  }

  await ref.delete();

  return {
    before,
  };
}
