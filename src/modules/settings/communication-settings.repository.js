import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

const SETTINGS_COLLECTION = "settings";

const COMMUNICATION_DOCUMENT = "communication";

/*
 * =========================================================
 * REF
 * =========================================================
 */

function getCommunicationSettingsRef(companyId) {
  return adminDb
    .collection("companies")
    .doc(companyId)
    .collection(SETTINGS_COLLECTION)
    .doc(COMMUNICATION_DOCUMENT);
}

/*
 * =========================================================
 * GET
 * =========================================================
 */

export async function getCommunicationSettingsRecord({ companyId }) {
  const snapshot = await getCommunicationSettingsRef(companyId).get();

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
 * SAVE
 * =========================================================
 */

export async function saveCommunicationSettingsRecord({
  companyId,
  data,
  userId,
}) {
  const ref = getCommunicationSettingsRef(companyId);

  const beforeSnapshot = await ref.get();

  const before = beforeSnapshot.exists
    ? {
        id: beforeSnapshot.id,

        ...beforeSnapshot.data(),
      }
    : null;

  await ref.set(
    {
      ...data,

      updatedAt: FieldValue.serverTimestamp(),

      updatedBy: userId,

      createdAt: before?.createdAt || FieldValue.serverTimestamp(),
    },
    {
      merge: true,
    },
  );

  const afterSnapshot = await ref.get();

  return {
    before,

    after: {
      id: afterSnapshot.id,

      ...afterSnapshot.data(),
    },
  };
}
