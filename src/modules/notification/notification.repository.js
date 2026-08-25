import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

function getNotificationsCollection(companyId) {
  return adminDb
    .collection("companies")
    .doc(companyId)
    .collection("notifications");
}

export async function createNotificationRecord({ companyId, data }) {
  const ref = getNotificationsCollection(companyId).doc();

  await ref.set({
    ...data,

    createdAt: FieldValue.serverTimestamp(),

    deletedAt: null,
  });

  return {
    id: ref.id,
  };
}

export async function listNotificationRecords({ companyId, limit = 50 }) {
  const snapshot = await getNotificationsCollection(companyId).get();

  let items = snapshot.docs.map((document) => ({
    id: document.id,

    ...document.data(),
  }));

  items = items.filter((item) => !item.deletedAt);

  items.sort(
    (a, b) =>
      (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0),
  );

  return items.slice(0, limit);
}
