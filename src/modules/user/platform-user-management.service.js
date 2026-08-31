import "server-only";

import {
  deleteFirebaseUser,
  getUserDocument,
  updateFirebaseUser,
  updateUserDocument,
} from "./user.repository";

import {
  AUDIT_ACTIONS,
  createAuditLogSafe,
} from "@/modules/audit/audit.service";

import { serializeFirestoreDocument } from "@/utils/firestore";

function assertUserExists(user) {
  if (!user || user.deletedAt || user.status === "deleted") {
    throw new Error("USER_NOT_FOUND");
  }
}

function validateSelfUpdate({ uid, input, currentUser }) {
  if (uid !== currentUser.uid) {
    return;
  }

  /*
   * Superadmin may edit their own profile and avatar,
   * but may not:
   *
   * - deactivate/suspend/delete themselves
   * - remove their own Superadmin role
   */
  if (input.status !== undefined && input.status !== "active") {
    throw new Error("CANNOT_CHANGE_OWN_STATUS");
  }

  if (input.isSuperAdmin === false) {
    throw new Error("CANNOT_REMOVE_OWN_SUPERADMIN");
  }
}

function validateDelete({ uid, currentUser }) {
  if (uid === currentUser.uid) {
    throw new Error("CANNOT_DELETE_OWN_ACCOUNT");
  }
}

function createUserResponse(user) {
  const serialized = serializeFirestoreDocument(user);

  return {
    ...serialized,

    uid: serialized.id,

    globalRole: serialized.isSuperAdmin ? "SUPERADMIN" : "USER",

    status: serialized.status || "active",

    avatar: serialized.avatar || null,

    mustChangePassword: serialized.mustChangePassword === true,
  };
}

export async function getPlatformUser({ uid }) {
  const user = await getUserDocument(uid);

  assertUserExists(user);

  return createUserResponse(user);
}

export async function updatePlatformUser({ uid, input, currentUser }) {
  const existing = await getUserDocument(uid);

  assertUserExists(existing);

  validateSelfUpdate({
    uid,
    input,
    currentUser,
  });

  const firebaseUpdate = {};

  if (input.displayName !== undefined) {
    firebaseUpdate.displayName = input.displayName;
  }

  if (input.status !== undefined) {
    firebaseUpdate.disabled = input.status !== "active";
  }

  if (Object.keys(firebaseUpdate).length > 0) {
    await updateFirebaseUser({
      uid,
      ...firebaseUpdate,
    });
  }

  const updated = await updateUserDocument({
    uid,

    data: {
      ...input,
    },

    userId: currentUser.uid,
  });

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId: null,

    action: AUDIT_ACTIONS.USER_UPDATE || "USER_UPDATE",

    resource: "platformUser",

    resourceId: uid,

    before: serializeFirestoreDocument(existing),

    after: serializeFirestoreDocument(updated),

    metadata: {
      globalUserUpdate: true,
    },
  });

  return createUserResponse(updated);
}

export async function deletePlatformUser({ uid, currentUser }) {
  const existing = await getUserDocument(uid);

  assertUserExists(existing);

  validateDelete({
    uid,

    currentUser,
  });

  /*
   * Permanently delete Firebase Authentication.
   *
   * If the same email is added again later,
   * Firebase creates a completely new UID.
   * Old company memberships therefore cannot
   * become active for the new account.
   */
  const authenticationResult = await deleteFirebaseUser(uid);

  const deletedAt = new Date();

  /*
   * Keep a minimal Firestore tombstone because:
   *
   * - audit logs may reference the old UID
   * - content created by this user may reference the UID
   * - deletion history must remain traceable
   *
   * Personal/profile data that is not required for
   * historical display is removed.
   */
  const deleted = await updateUserDocument({
    uid,

    data: {
      status: "deleted",

      isSuperAdmin: false,

      mustChangePassword: false,

      avatar: null,

      phone: null,

      defaultCompanyId: null,

      authDeleted: true,

      authDeletedAt: deletedAt,

      deletedAt,

      deletedBy: currentUser.uid,
    },

    userId: currentUser.uid,
  });

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId: null,

    action: AUDIT_ACTIONS.USER_DELETE || "USER_DELETE",

    resource: "platformUser",

    resourceId: uid,

    before: serializeFirestoreDocument(existing),

    after: {
      uid,

      status: "deleted",

      authenticationDeleted: true,

      deletedAt,
    },

    metadata: {
      globalUserDelete: true,

      authenticationDeleted: true,

      firebaseUserAlreadyDeleted: authenticationResult.alreadyDeleted,

      softDeletedFirestoreTombstone: true,
    },
  });

  return {
    uid,

    deleted: true,

    status: "deleted",

    authenticationDeleted: true,
  };
}
