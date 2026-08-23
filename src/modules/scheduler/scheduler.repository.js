import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

import { SCHEDULER_BATCH_LIMIT } from "@/constants/scheduler";

export async function findDueScheduledContent({
  collectionGroup,
  now = new Date(),
  limit = SCHEDULER_BATCH_LIMIT,
}) {
  const nowTimestamp = Timestamp.fromDate(now);

  const snapshot = await adminDb
    .collectionGroup(collectionGroup)
    .where("status", "==", "scheduled")
    .where("scheduledAt", "<=", nowTimestamp)
    .orderBy("scheduledAt", "asc")
    .limit(limit)
    .get();

  return snapshot.docs.map((document) => ({
    id: document.id,

    ref: document.ref,

    path: document.ref.path,

    data: document.data(),
  }));
}

export async function publishScheduledDocument({ ref, systemUserId }) {
  let result = null;

  await adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);

    if (!snapshot.exists) {
      throw new Error("SCHEDULED_DOCUMENT_NOT_FOUND");
    }

    const data = snapshot.data();

    /*
     * Another scheduler invocation
     * may have published this record
     * already.
     */

    if (data.status !== "scheduled") {
      result = {
        skipped: true,

        reason: "STATUS_CHANGED",

        before: {
          id: snapshot.id,

          ...data,
        },

        after: null,
      };

      return;
    }

    if (data.deletedAt) {
      result = {
        skipped: true,

        reason: "DELETED",

        before: {
          id: snapshot.id,

          ...data,
        },

        after: null,
      };

      return;
    }

    const scheduledAt = data.scheduledAt;

    if (!scheduledAt || typeof scheduledAt.toMillis !== "function") {
      result = {
        skipped: true,

        reason: "INVALID_SCHEDULE",

        before: {
          id: snapshot.id,

          ...data,
        },

        after: null,
      };

      return;
    }

    if (scheduledAt.toMillis() > Date.now()) {
      result = {
        skipped: true,

        reason: "NOT_DUE",

        before: {
          id: snapshot.id,

          ...data,
        },

        after: null,
      };

      return;
    }

    const before = {
      id: snapshot.id,

      ...data,
    };

    transaction.update(ref, {
      status: "published",

      scheduledAt: null,

      publishedAt: FieldValue.serverTimestamp(),

      publishedBy: systemUserId,

      updatedAt: FieldValue.serverTimestamp(),

      updatedBy: systemUserId,
    });

    result = {
      skipped: false,

      reason: null,

      before,

      after: null,
    };
  });

  if (result && !result.skipped) {
    const afterSnapshot = await ref.get();

    result.after = {
      id: afterSnapshot.id,

      ...afterSnapshot.data(),
    };
  }

  return result;
}
