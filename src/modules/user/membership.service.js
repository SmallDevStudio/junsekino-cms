import "server-only";

import {
  createFirebaseUser,
  findFirebaseUserByEmail,
  getUserDocument,
  updateFirebaseUser,
  updateUserDocument,
  upsertUserDocument,
} from "./user.repository";

import {
  createMembership,
  getMembership,
  listMemberships,
  softDeleteMembership,
  updateMembership,
} from "./membership.repository";

import { createAuditLog } from "@/modules/audit/audit.service";

import { serializeFirestoreDocument } from "@/utils/firestore";

import { getRolePermissions } from "@/lib/permissions";

export async function getCompanyMembers(companyId) {
  const memberships = await listMemberships(companyId);

  const active = memberships.filter((membership) => !membership.deletedAt);

  const members = await Promise.all(
    active.map(async (membership) => {
      const user = await getUserDocument(membership.userId);

      return {
        ...serializeFirestoreDocument(membership),

        user: serializeFirestoreDocument(user),
      };
    }),
  );

  return members;
}

export async function getCompanyMember({ companyId, uid }) {
  const membership = await getMembership({
    companyId,
    uid,
  });

  if (!membership || membership.deletedAt) {
    throw new Error("MEMBERSHIP_NOT_FOUND");
  }

  const user = await getUserDocument(uid);

  return {
    ...serializeFirestoreDocument(membership),

    user: serializeFirestoreDocument(user),
  };
}

function validateCustomPermissions({ role, permissions = [] }) {
  const allowed = new Set(getRolePermissions(role));

  for (const permission of permissions) {
    if (!allowed.has(permission)) {
      throw new Error("INVALID_CUSTOM_PERMISSION");
    }
  }

  return Array.from(new Set(permissions));
}

export async function addCompanyMember({ companyId, input, currentUser }) {
  const permissions = validateCustomPermissions({
    role: input.role,

    permissions: input.permissions || [],
  });

  let firebaseUser = await findFirebaseUserByEmail(input.email);

  let createdFirebaseUser = false;

  if (!firebaseUser) {
    firebaseUser = await createFirebaseUser({
      email: input.email,

      password: input.password,

      displayName: input.displayName,
    });

    createdFirebaseUser = true;
  }

  const uid = firebaseUser.uid;

  await upsertUserDocument({
    uid,

    email: firebaseUser.email || input.email,

    displayName: input.displayName,

    userId: currentUser.uid,
  });

  try {
    const membership = await createMembership({
      companyId,

      uid,

      role: input.role,

      permissions,

      userId: currentUser.uid,
    });

    await createAuditLog({
      userId: currentUser.uid,

      companyId,

      action: "USER_CREATE",

      resource: "membership",

      resourceId: uid,

      before: null,

      after: serializeFirestoreDocument(membership),

      metadata: {
        email: input.email,

        createdFirebaseUser,
      },
    });

    return getCompanyMember({
      companyId,
      uid,
    });
  } catch (error) {
    /*
     * We intentionally do not delete the
     * Firebase account here.
     *
     * The account may already belong to
     * another company.
     */

    throw error;
  }
}

export async function editCompanyMember({
  companyId,
  uid,
  input,
  currentUser,
}) {
  const existing = await getMembership({
    companyId,
    uid,
  });

  if (!existing || existing.deletedAt) {
    throw new Error("MEMBERSHIP_NOT_FOUND");
  }

  const resolvedRole = input.role || existing.role;

  const resolvedPermissions =
    input.permissions !== undefined
      ? validateCustomPermissions({
          role: resolvedRole,

          permissions: input.permissions,
        })
      : existing.permissions || [];

  if (input.displayName) {
    await updateFirebaseUser({
      uid,

      displayName: input.displayName,
    });

    await updateUserDocument({
      uid,

      data: {
        displayName: input.displayName,
      },

      userId: currentUser.uid,
    });
  }

  const updateData = {
    ...input,

    role: resolvedRole,

    permissions: resolvedPermissions,
  };

  delete updateData.displayName;

  const result = await updateMembership({
    companyId,

    uid,

    data: updateData,

    userId: currentUser.uid,
  });

  await createAuditLog({
    userId: currentUser.uid,

    companyId,

    action: "USER_UPDATE",

    resource: "membership",

    resourceId: uid,

    before: serializeFirestoreDocument(result.before),

    after: serializeFirestoreDocument(result.after),
  });

  return getCompanyMember({
    companyId,
    uid,
  });
}

export async function removeCompanyMember({ companyId, uid, currentUser }) {
  if (uid === currentUser.uid && !currentUser.isSuperAdmin) {
    throw new Error("CANNOT_REMOVE_SELF");
  }

  const before = await softDeleteMembership({
    companyId,

    uid,

    userId: currentUser.uid,
  });

  await createAuditLog({
    userId: currentUser.uid,

    companyId,

    action: "USER_DELETE",

    resource: "membership",

    resourceId: uid,

    before: serializeFirestoreDocument(before),

    after: {
      removed: true,
    },
  });

  return {
    uid,
    removed: true,
  };
}
