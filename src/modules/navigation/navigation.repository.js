import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

function getNavigationRef(companyId) {
  return adminDb
    .collection("companies")
    .doc(companyId)
    .collection("settings")
    .doc("navigation");
}

export async function getNavigationSettingsRecord(companyId) {
  const snapshot = await getNavigationRef(companyId).get();

  if (!snapshot.exists) {
    return null;
  }

  return {
    id: snapshot.id,

    ...snapshot.data(),
  };
}

export async function updateNavigationSettingsRecord({
  companyId,

  data,

  userId,
}) {
  const ref = getNavigationRef(companyId);

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
