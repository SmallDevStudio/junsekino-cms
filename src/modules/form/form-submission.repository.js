import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

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

export async function listSubmissionRecords({
  companyId,
  formId = null,
  status = null,
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

  return items.filter((item) => !item.deletedAt);
}

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

        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),

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
 * Creates the submission and claims all
 * private attachments atomically.
 *
 * attachmentBindings:
 * [
 *   {
 *     attachmentId,
 *     fieldId
 *   }
 * ]
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

  await adminDb.runTransaction(async (transaction) => {
    /*
     * IMPORTANT:
     * all Firestore reads occur
     * before the first write.
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

    transaction.set(submissionRef, {
      ...data,

      status: "new",

      createdAt: FieldValue.serverTimestamp(),

      updatedAt: FieldValue.serverTimestamp(),

      assignedTo: null,

      readAt: null,

      resolvedAt: null,

      deletedAt: null,
    });

    for (let index = 0; index < attachmentBindings.length; index += 1) {
      const attachmentRef = attachmentRefs[index];

      transaction.update(attachmentRef, {
        status: "attached",

        submissionId: submissionRef.id,

        attachedAt: FieldValue.serverTimestamp(),

        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  });

  return getSubmissionById({
    companyId,

    submissionId: submissionRef.id,
  });
}

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
