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

export async function listUserDocuments() {
  const snapshot = await adminDb.collection("users").get();

  return snapshot.docs
    .map((document) => ({
      id: document.id,
      ...document.data(),
    }))
    .filter((user) => !user.deletedAt && user.status !== "deleted");
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

export async function updateFirebaseUser({
  uid,
  displayName,
  disabled,
  password,
  emailVerified,
  photoURL,
}) {
  const updateData = {};

  if (displayName !== undefined) {
    updateData.displayName = displayName || null;
  }

  if (disabled !== undefined) {
    updateData.disabled = disabled === true;
  }

  if (password !== undefined) {
    updateData.password = password;
  }

  if (emailVerified !== undefined) {
    updateData.emailVerified = emailVerified === true;
  }

  if (photoURL !== undefined) {
    updateData.photoURL = photoURL || null;
  }

  if (Object.keys(updateData).length === 0) {
    return adminAuth.getUser(uid);
  }

  return adminAuth.updateUser(uid, updateData);
}

export async function deleteFirebaseUser(uid) {
  try {
    await adminAuth.deleteUser(uid);

    return {
      uid,

      deleted: true,

      alreadyDeleted: false,
    };
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      return {
        uid,

        deleted: true,

        alreadyDeleted: true,
      };
    }

    throw error;
  }
}

export async function revokeFirebaseUserSessions(uid) {
  await adminAuth.revokeRefreshTokens(uid);

  return adminAuth.getUser(uid);
}

export async function upsertUserDocument({
  uid,
  email,
  displayName,
  avatar,
  defaultCompanyId,
  userId,
}) {
  const ref = adminDb.collection("users").doc(uid);

  await adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);

    if (snapshot.exists) {
      const existing = snapshot.data();

      const updateData = {
        email,
        displayName,
        status: "active",
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: userId,
      };

      if (avatar !== undefined) {
        updateData.avatar = avatar || null;
      }

      /*
       * Set the first company only when the user
       * does not already have a default company.
       *
       * Adding the same user to another company
       * must not overwrite their original default.
       */
      if (!existing.defaultCompanyId && defaultCompanyId) {
        updateData.defaultCompanyId = defaultCompanyId;
      }

      transaction.set(ref, updateData, {
        merge: true,
      });

      return;
    }

    transaction.set(ref, {
      email,
      displayName,
      avatar: avatar || null,
      userType: "staff",
      status: "active",
      isSuperAdmin: false,
      mustChangePassword: false,

      /*
       * The company where the account is created
       * becomes its initial workspace.
       */
      defaultCompanyId: defaultCompanyId || null,

      createdAt: FieldValue.serverTimestamp(),
      createdBy: userId,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: userId,
      deletedAt: null,
      deletedBy: null,
    });
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
