import "server-only";

import { listMemberships } from "./membership.repository";

import { listUserDocuments } from "./user.repository";

import { serializeFirestoreDocument } from "@/utils/firestore";

function resolveGlobalRole(user) {
  if (user?.isSuperAdmin) {
    return "SUPERADMIN";
  }

  return "USER";
}

function normalizeCompanyAccess(membership) {
  if (!membership || membership.deletedAt) {
    return {
      assigned: false,

      role: null,

      status: null,

      permissions: [],

      groupIds: [],
    };
  }

  return {
    assigned: true,

    membershipId: membership.id,

    role: membership.role || null,

    status: membership.status || "active",

    permissions: Array.isArray(membership.permissions)
      ? membership.permissions
      : [],

    groupIds: Array.isArray(membership.groupIds) ? membership.groupIds : [],
  };
}

export async function listPlatformUsers({ companyId = null }) {
  const users = await listUserDocuments();

  let membershipByUserId = new Map();

  if (companyId) {
    const memberships = await listMemberships(companyId);

    membershipByUserId = new Map(
      memberships
        .filter((membership) => !membership.deletedAt)
        .map((membership) => [membership.userId || membership.id, membership]),
    );
  }

  const result = users.map((user) => {
    const serializedUser = serializeFirestoreDocument(user);

    const membership = companyId ? membershipByUserId.get(user.id) : null;

    return {
      id: user.id,

      uid: user.id,

      email: serializedUser.email || null,

      displayName: serializedUser.displayName || "",

      avatar: serializedUser.avatar || null,

      phone: serializedUser.phone || null,

      status: serializedUser.status || "active",

      authStatus: serializedUser.authStatus || "active",

      isSuperAdmin: serializedUser.isSuperAdmin === true,

      globalRole: resolveGlobalRole(serializedUser),

      mustChangePassword: serializedUser.mustChangePassword === true,

      emailVerified: serializedUser.emailVerified === true,

      lastLoginAt: serializedUser.lastLoginAt || null,

      passwordChangedAt: serializedUser.passwordChangedAt || null,

      companyAccess: normalizeCompanyAccess(membership),

      createdAt: serializedUser.createdAt || null,

      updatedAt: serializedUser.updatedAt || null,
    };
  });

  return result.sort((a, b) => {
    if (a.isSuperAdmin !== b.isSuperAdmin) {
      return a.isSuperAdmin ? -1 : 1;
    }

    const nameA = String(a.displayName || a.email || "").toLowerCase();

    const nameB = String(b.displayName || b.email || "").toLowerCase();

    return nameA.localeCompare(nameB);
  });
}
