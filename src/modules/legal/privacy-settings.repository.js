import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

function getPrivacyRef(companyId) {
  return adminDb
    .collection("companies")
    .doc(companyId)
    .collection("settings")
    .doc("privacy");
}

export async function getPrivacySettings(companyId) {
  const snapshot = await getPrivacyRef(companyId).get();

  if (!snapshot.exists) {
    return null;
  }

  return {
    id: snapshot.id,

    ...snapshot.data(),
  };
}

export async function updatePrivacySettingsRecord({ companyId, data, userId }) {
  const ref = getPrivacyRef(companyId);

  const snapshot = await ref.get();

  const before = snapshot.exists
    ? {
        id: snapshot.id,

        ...snapshot.data(),
      }
    : null;

  await ref.set(
    {
      ...data,

      updatedAt: FieldValue.serverTimestamp(),

      updatedBy: userId,

      ...(!snapshot.exists
        ? {
            createdAt: FieldValue.serverTimestamp(),

            createdBy: userId,
          }
        : {}),
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
