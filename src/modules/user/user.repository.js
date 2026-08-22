import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminAuth, adminDb } from "@/lib/firebase/admin";

export async function getUserDocument(uid) {
  const snapshot = await adminDb.collection("users").doc(uid).get();

  if (!snapshot.exists) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

export async function findFirebaseUserByEmail(email) {
  try {
    return await adminAuth.getUserByEmail(email);
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      return null;
    }

    throw error;
  }
}

export async function createFirebaseUser({ email, password, displayName }) {
  return adminAuth.createUser({
    email,
    password,
    displayName,

    disabled: false,

    emailVerified: false,
  });
}

export async function updateFirebaseUser({ uid, displayName }) {
  return adminAuth.updateUser(uid, {
    ...(displayName ? { displayName } : {}),
  });
}

export async function upsertUserDocument({ uid, email, displayName, userId }) {
  const ref = adminDb.collection("users").doc(uid);

  const snapshot = await ref.get();

  if (snapshot.exists) {
    await ref.set(
      {
        email,
        displayName,

        status: "active",

        updatedAt: FieldValue.serverTimestamp(),

        updatedBy: userId,
      },
      {
        merge: true,
      },
    );

    return getUserDocument(uid);
  }

  await ref.set({
    email,

    displayName,

    userType: "staff",

    status: "active",

    isSuperAdmin: false,

    defaultCompanyId: null,

    createdAt: FieldValue.serverTimestamp(),

    createdBy: userId,

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: userId,
  });

  return getUserDocument(uid);
}

export async function updateUserDocument({ uid, data, userId }) {
  const ref = adminDb.collection("users").doc(uid);

  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new Error("USER_NOT_FOUND");
  }

  await ref.update({
    ...data,

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: userId,
  });

  return getUserDocument(uid);
}
