import "server-only";

import { adminAuth } from "@/lib/firebase/admin";

import {
  getUserDocument,
  revokeFirebaseUserSessions,
  updateFirebaseUser,
  updateUserDocument,
} from "./user.repository";

import { getMembership } from "./membership.repository";

import { createAuditLog } from "@/modules/audit/audit.service";

import { createPlatformSession } from "@/modules/auth/auth.service";

import { serializeFirestoreDocument } from "@/utils/firestore";

function assertUserExists(user) {
  if (!user || user.deletedAt || user.status === "deleted") {
    throw new Error("USER_NOT_FOUND");
  }
}

function assertCanResetPassword({ uid, targetUser, companyId, currentUser }) {
  if (uid === currentUser.uid) {
    throw new Error("CANNOT_RESET_OWN_PASSWORD");
  }

  if (currentUser.isSuperAdmin) {
    return;
  }

  if (!companyId) {
    throw new Error("COMPANY_ID_REQUIRED");
  }

  if (targetUser.isSuperAdmin) {
    throw new Error("CANNOT_MANAGE_SUPERADMIN");
  }
}

async function validateCompanyMembership({ uid, companyId, currentUser }) {
  if (currentUser.isSuperAdmin) {
    return null;
  }

  const membership = await getMembership({
    companyId,

    uid,
  });

  if (!membership || membership.deletedAt || membership.status !== "active") {
    throw new Error("MEMBERSHIP_NOT_FOUND");
  }

  return membership;
}

export async function resetUserPassword({ uid, input, currentUser }) {
  const existing = await getUserDocument(uid);

  assertUserExists(existing);

  assertCanResetPassword({
    uid,

    targetUser: existing,

    companyId: input.companyId,

    currentUser,
  });

  await validateCompanyMembership({
    uid,

    companyId: input.companyId,

    currentUser,
  });

  await updateFirebaseUser({
    uid,

    password: input.password,
  });

  await revokeFirebaseUserSessions(uid);

  const changedAt = new Date();

  const updated = await updateUserDocument({
    uid,

    data: {
      mustChangePassword: input.mustChangePassword !== false,

      passwordResetAt: changedAt,

      passwordResetBy: currentUser.uid,

      passwordChangedAt: changedAt,

      passwordChangedBy: currentUser.uid,
    },

    userId: currentUser.uid,
  });

  await createAuditLog({
    userId: currentUser.uid,

    companyId: input.companyId || null,

    action: "USER_PASSWORD_RESET",

    resource: "platformUser",

    resourceId: uid,

    before: {
      uid,

      mustChangePassword: existing.mustChangePassword === true,
    },

    after: {
      uid,

      mustChangePassword: updated.mustChangePassword === true,

      sessionsRevoked: true,
    },

    metadata: {
      passwordReset: true,

      forcedPasswordChange: updated.mustChangePassword === true,

      targetIsSuperAdmin: existing.isSuperAdmin === true,
    },
  });

  return {
    uid,

    passwordReset: true,

    mustChangePassword: updated.mustChangePassword === true,

    sessionsRevoked: true,

    passwordResetAt:
      serializeFirestoreDocument(updated).passwordResetAt || null,
  };
}

export async function completeOwnPasswordChange({ idToken, currentUser }) {
  const decodedToken = await adminAuth.verifyIdToken(idToken, true);

  if (decodedToken.uid !== currentUser.uid) {
    throw new Error("PASSWORD_USER_MISMATCH");
  }

  const existing = await getUserDocument(currentUser.uid);

  assertUserExists(existing);

  const changedAt = new Date();

  const updated = await updateUserDocument({
    uid: currentUser.uid,

    data: {
      mustChangePassword: false,

      passwordChangedAt: changedAt,

      passwordChangedBy: currentUser.uid,

      passwordChangeCompletedAt: changedAt,
    },

    userId: currentUser.uid,
  });

  await createAuditLog({
    userId: currentUser.uid,

    companyId: null,

    action: "USER_PASSWORD_CHANGE",

    resource: "platformUser",

    resourceId: currentUser.uid,

    before: {
      uid: currentUser.uid,

      mustChangePassword: existing.mustChangePassword === true,
    },

    after: {
      uid: currentUser.uid,

      mustChangePassword: false,
    },

    metadata: {
      selfPasswordChange: true,

      forcedPasswordChangeCompleted: existing.mustChangePassword === true,
    },
  });

  /*
   * Create a fresh server session using the ID token
   * obtained after Firebase Client updatePassword().
   */
  const session = await createPlatformSession(idToken);

  return {
    sessionCookie: session.sessionCookie,

    user: {
      ...session.user,

      mustChangePassword: updated.mustChangePassword === true,
    },
  };
}
