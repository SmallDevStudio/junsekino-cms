import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

/*
 * =========================================================
 * COLLECTION
 * =========================================================
 */

function getNotificationsCollection(companyId) {
  return adminDb
    .collection("companies")
    .doc(companyId)
    .collection("notifications");
}

/*
 * =========================================================
 * CREATE
 * =========================================================
 */

export async function createNotificationRecord({ companyId, data }) {
  const ref = getNotificationsCollection(companyId).doc();

  await ref.set({
    ...data,

    /*
     * Notification records are shared
     * within a company.
     *
     * Read state is therefore tracked
     * per user rather than globally.
     */
    readBy: [],

    createdAt: FieldValue.serverTimestamp(),

    deletedAt: null,
  });

  return {
    id: ref.id,
  };
}

/*
 * =========================================================
 * GET
 * =========================================================
 */

export async function getNotificationById({ companyId, notificationId }) {
  const snapshot = await getNotificationsCollection(companyId)
    .doc(notificationId)
    .get();

  if (!snapshot.exists || snapshot.data()?.deletedAt) {
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

/*
 * =========================================================
 * MARK READ
 * =========================================================
 */

export async function markNotificationReadRecord({
  companyId,
  notificationId,
  userId,
}) {
  const ref = getNotificationsCollection(companyId).doc(notificationId);

  const snapshot = await ref.get();

  if (!snapshot.exists || snapshot.data()?.deletedAt) {
    throw new Error("NOTIFICATION_NOT_FOUND");
  }

  await ref.update({
    readBy: FieldValue.arrayUnion(userId),

    updatedAt: FieldValue.serverTimestamp(),
  });

  return getNotificationById({
    companyId,
    notificationId,
  });
}
