import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

function getSubmissionCollection(companyId) {
  return adminDb
    .collection("companies")
    .doc(companyId)
    .collection("formSubmissions");
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

  items = items.filter((item) => !item.deletedAt);

  return items;
}

export async function checkSubmissionRateLimit({
  companyId,
  formId,
  visitorHash,
  limit = 5,
}) {
  /*
   * One bucket per hour.
   */
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
      allowed = false;

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

export async function createSubmissionRecord({ companyId, data }) {
  const ref = getSubmissionCollection(companyId).doc();

  await ref.set({
    ...data,

    status: "new",

    createdAt: FieldValue.serverTimestamp(),

    updatedAt: FieldValue.serverTimestamp(),

    assignedTo: null,

    readAt: null,

    resolvedAt: null,

    deletedAt: null,
  });

  return getSubmissionById({
    companyId,

    submissionId: ref.id,
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
