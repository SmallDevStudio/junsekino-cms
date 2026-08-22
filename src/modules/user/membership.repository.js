import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

export function getMembersCollection(companyId) {
  return adminDb.collection("companies").doc(companyId).collection("members");
}

export async function getMembership({ companyId, uid }) {
  const snapshot = await getMembersCollection(companyId).doc(uid).get();

  if (!snapshot.exists) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

export async function listMemberships(companyId) {
  const snapshot = await getMembersCollection(companyId).get();

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
}

export async function createMembership({
  companyId,
  uid,
  role,
  permissions = [],
  userId,
}) {
  const ref = getMembersCollection(companyId).doc(uid);

  const existing = await ref.get();

  if (existing.exists) {
    const existingData = existing.data();

    if (existingData.status === "active") {
      throw new Error("MEMBERSHIP_EXISTS");
    }
  }

  await ref.set(
    {
      userId: uid,

      role,

      permissions,

      status: "active",

      createdAt: FieldValue.serverTimestamp(),

      createdBy: userId,

      updatedAt: FieldValue.serverTimestamp(),

      updatedBy: userId,

      deletedAt: null,

      deletedBy: null,
    },
    {
      merge: true,
    },
  );

  return getMembership({
    companyId,
    uid,
  });
}

export async function updateMembership({ companyId, uid, data, userId }) {
  const ref = getMembersCollection(companyId).doc(uid);

  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new Error("MEMBERSHIP_NOT_FOUND");
  }

  const before = {
    id: snapshot.id,
    ...snapshot.data(),
  };

  await ref.update({
    ...data,

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: userId,
  });

  const after = await getMembership({
    companyId,
    uid,
  });

  return {
    before,
    after,
  };
}

export async function softDeleteMembership({ companyId, uid, userId }) {
  const ref = getMembersCollection(companyId).doc(uid);

  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new Error("MEMBERSHIP_NOT_FOUND");
  }

  const data = snapshot.data();

  if (data.deletedAt) {
    throw new Error("MEMBERSHIP_ALREADY_DELETED");
  }

  await ref.update({
    status: "inactive",

    deletedAt: FieldValue.serverTimestamp(),

    deletedBy: userId,

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: userId,
  });

  return {
    id: uid,
    ...data,
  };
}
