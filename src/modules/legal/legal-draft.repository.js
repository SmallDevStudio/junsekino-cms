import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

/*
 * =========================================================
 * REF
 * =========================================================
 */

function getLegalVersionRef({
  companyId,

  versionId,
}) {
  return adminDb
    .collection("companies")
    .doc(companyId)
    .collection("legalDocumentVersions")
    .doc(versionId);
}

/*
 * =========================================================
 * UPDATE DRAFT
 * =========================================================
 */

export async function updateLegalDraftRecord({
  companyId,

  type,

  versionId,

  data,

  userId,
}) {
  const ref = getLegalVersionRef({
    companyId,

    versionId,
  });

  let before = null;

  await adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);

    if (!snapshot.exists) {
      throw new Error("LEGAL_VERSION_NOT_FOUND");
    }

    const existing = snapshot.data();

    if (existing.type !== type) {
      throw new Error("LEGAL_VERSION_TYPE_MISMATCH");
    }

    if (existing.status !== "draft") {
      throw new Error("LEGAL_VERSION_NOT_DRAFT");
    }

    before = {
      id: snapshot.id,

      ...existing,
    };

    transaction.update(ref, {
      ...data,

      updatedAt: FieldValue.serverTimestamp(),

      updatedBy: userId,
    });
  });

  const afterSnapshot = await ref.get();

  return {
    before,

    after: {
      id: afterSnapshot.id,

      ...afterSnapshot.data(),
    },
  };
}
