import "server-only";

import {
  createFirebaseUser,
  findFirebaseUserByEmail,
  getUserDocument,
  listUserDocuments,
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

function isDeletedUser(user) {
  return !user || user.deletedAt || user.status === "deleted";
}

function assertUserExists(user) {
  if (isDeletedUser(user)) {
    throw new Error("USER_NOT_FOUND");
  }
}

function assertTargetManageable({ targetUser, currentUser }) {
  assertUserExists(targetUser);

  if (targetUser.isSuperAdmin && !currentUser.isSuperAdmin) {
    throw new Error("CANNOT_MANAGE_SUPERADMIN");
  }
}

function getUserPrivacy(user) {
  return {
    avatarVisibility: user?.preferences?.privacy?.avatarVisibility || "company",

    phoneVisibility: user?.preferences?.privacy?.phoneVisibility || "private",

    bioVisibility: user?.preferences?.privacy?.bioVisibility || "company",

    lastActiveVisibility:
      user?.preferences?.privacy?.lastActiveVisibility || "admins",
  };
}

function createMemberUserView({ user, currentUser, currentMembership }) {
  const serialized = serializeFirestoreDocument(user);

  const privacy = getUserPrivacy(user);

  const isOwner = currentUser?.uid === user.id;

  const isAdministrator =
    currentUser?.isSuperAdmin === true || currentMembership?.role === "ADMIN";

  const canSeeAvatar = isOwner || privacy.avatarVisibility === "company";

  const canSeePhone = isOwner || privacy.phoneVisibility === "company";

  const canSeeBio = isOwner || privacy.bioVisibility === "company";

  const canSeeLastActive =
    isOwner || (privacy.lastActiveVisibility === "admins" && isAdministrator);

  /*
   * Explicit whitelist.
   *
   * Never expose:
   * - preferences
   * - password metadata
   * - deletedBy
   * - internal audit fields
   * - defaultCompanyId
   */
  return {
    id: user.id,

    uid: user.id,

    email: serialized.email || null,

    displayName: serialized.displayName || null,

    phone: canSeePhone ? serialized.phone || null : null,

    position: serialized.position || null,

    department: serialized.department || null,

    employeeCode: serialized.employeeCode || null,

    bio: canSeeBio ? serialized.bio || null : null,

    avatar: canSeeAvatar ? serialized.avatar || null : null,

    status: serialized.status || "active",

    isSuperAdmin: serialized.isSuperAdmin === true,

    mustChangePassword: serialized.mustChangePassword === true,

    emailVerified: serialized.emailVerified === true,

    lastActiveAt: canSeeLastActive ? serialized.lastActiveAt || null : null,

    createdAt: serialized.createdAt || null,
  };
}

function normalizeStringArray(values = []) {
  return Array.from(new Set(values)).sort();
}

function arraysEqual(left = [], right = []) {
  const normalizedLeft = normalizeStringArray(left);

  const normalizedRight = normalizeStringArray(right);

  if (normalizedLeft.length !== normalizedRight.length) {
    return false;
  }

  return normalizedLeft.every(
    (value, index) => value === normalizedRight[index],
  );
}

function membershipMatches({
  membership,
  role,
  permissions = [],
  groupIds = [],
}) {
  return (
    membership &&
    !membership.deletedAt &&
    membership.status === "active" &&
    membership.role === role &&
    arraysEqual(membership.permissions || [], permissions) &&
    arraysEqual(membership.groupIds || [], groupIds)
  );
}

function createNoAccessResponse({ uid, unchanged = false }) {
  return {
    uid,

    userId: uid,

    access: "NO_ACCESS",

    assigned: false,

    membership: null,

    unchanged,
  };
}

function createAccessResponse(member, { unchanged = false } = {}) {
  return {
    ...member,

    access: member.role,

    assigned: true,

    unchanged,
  };
}

export async function getCompanyMembers({
  companyId,
  includePlatformUsers = false,
  currentUser,
  currentMembership,
}) {
  const memberships = await listMemberships(companyId);

  const activeMemberships = memberships.filter(
    (membership) => !membership.deletedAt && membership.status === "active",
  );

  const companyMembers = (
    await Promise.all(
      activeMemberships.map(async (membership) => {
        const user = await getUserDocument(membership.userId);

        if (isDeletedUser(user)) {
          return null;
        }

        return {
          ...serializeFirestoreDocument(membership),

          access: membership.role,

          assigned: true,

          unassigned: false,

          user: createMemberUserView({
            user,

            currentUser,

            currentMembership,
          }),
        };
      }),
    )
  ).filter(Boolean);

  if (!includePlatformUsers) {
    return companyMembers;
  }

  const platformUsers = await listUserDocuments();

  const superAdmins = platformUsers.filter(
    (user) => !isDeletedUser(user) && user.isSuperAdmin === true,
  );

  const memberByUserId = new Map(
    companyMembers.map((member) => [member.userId || member.id, member]),
  );

  const result = [...companyMembers];

  for (const user of superAdmins) {
    if (memberByUserId.has(user.id)) {
      continue;
    }

    result.push({
      id: user.id,

      userId: user.id,

      role: null,

      access: "NO_ACCESS",

      assigned: false,

      permissions: [],

      groupIds: [],

      status: "unassigned",

      unassigned: true,

      user: createMemberUserView({
        user,

        currentUser,

        currentMembership,
      }),
    });
  }

  return result.sort((left, right) => {
    const leftUser = left.user || {};
    const rightUser = right.user || {};

    const leftSuperAdmin = leftUser.isSuperAdmin === true;

    const rightSuperAdmin = rightUser.isSuperAdmin === true;

    if (leftSuperAdmin !== rightSuperAdmin) {
      return leftSuperAdmin ? -1 : 1;
    }

    const leftName = String(
      leftUser.displayName || leftUser.email || "",
    ).toLowerCase();

    const rightName = String(
      rightUser.displayName || rightUser.email || "",
    ).toLowerCase();

    return leftName.localeCompare(rightName);
  });
}

export async function getCompanyMember({
  companyId,
  uid,
  currentUser,
  currentMembership,
}) {
  const membership = await getMembership({
    companyId,

    uid,
  });

  if (!membership || membership.deletedAt || membership.status !== "active") {
    throw new Error("MEMBERSHIP_NOT_FOUND");
  }

  const user = await getUserDocument(uid);

  assertUserExists(user);

  return {
    ...serializeFirestoreDocument(membership),

    access: membership.role,

    assigned: true,

    unassigned: false,

    user: createMemberUserView({
      user,

      currentUser,

      currentMembership,
    }),
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

  /*
   * Existing Firebase user:
   *
   * Reuse the existing account and create
   * only the company membership.
   *
   * New email:
   *
   * Create both Firebase Auth account and
   * company membership.
   */
  if (!firebaseUser) {
    firebaseUser = await createFirebaseUser({
      email: input.email,

      password: input.password,

      displayName: input.displayName,
    });

    createdFirebaseUser = true;
  }

  const uid = firebaseUser.uid;

  const existingUser = await getUserDocument(uid);

  if (existingUser?.deletedAt || existingUser?.status === "deleted") {
    throw new Error("USER_DELETED");
  }

  await upsertUserDocument({
    uid,

    email: firebaseUser.email || input.email,

    displayName: input.displayName,

    avatar: input.avatar,

    defaultCompanyId: companyId,

    userId: currentUser.uid,
  });

  const existingMembership = await getMembership({
    companyId,

    uid,
  });

  if (
    existingMembership &&
    !existingMembership.deletedAt &&
    existingMembership.status === "active"
  ) {
    throw new Error("MEMBERSHIP_EXISTS");
  }

  const membership = await createMembership({
    companyId,

    uid,

    role: input.role,

    permissions,

    groupIds: input.groupIds || [],

    userId: currentUser.uid,
  });

  await createAuditLog({
    userId: currentUser.uid,

    companyId,

    action: "USER_CREATE",

    resource: "membership",

    resourceId: uid,

    before: existingMembership
      ? serializeFirestoreDocument(existingMembership)
      : null,

    after: serializeFirestoreDocument(membership),

    metadata: {
      email: input.email,

      createdFirebaseUser,

      restoredMembership: Boolean(existingMembership),
    },
  });

  return getCompanyMember({
    companyId,

    uid,

    currentUser,

    currentMembership: currentUser.isSuperAdmin
      ? {
          role: "SUPERADMIN",
        }
      : null,
  });
}

export async function assignExistingCompanyMember({
  companyId,
  uid,
  input,
  currentUser,
}) {
  if (!currentUser.isSuperAdmin) {
    throw new Error("SUPERADMIN_REQUIRED");
  }

  const user = await getUserDocument(uid);

  assertUserExists(user);

  const permissions = validateCustomPermissions({
    role: input.role,

    permissions: input.permissions || [],
  });

  const existing = await getMembership({
    companyId,

    uid,
  });

  if (existing && !existing.deletedAt && existing.status === "active") {
    throw new Error("MEMBERSHIP_EXISTS");
  }

  const membership = await createMembership({
    companyId,

    uid,

    role: input.role,

    permissions,

    groupIds: input.groupIds || [],

    userId: currentUser.uid,
  });

  await createAuditLog({
    userId: currentUser.uid,

    companyId,

    action: "USER_ASSIGN",

    resource: "membership",

    resourceId: uid,

    before: existing ? serializeFirestoreDocument(existing) : null,

    after: serializeFirestoreDocument(membership),

    metadata: {
      email: user.email || null,

      assignedExistingUser: true,

      restoredMembership: Boolean(existing),
    },
  });

  return getCompanyMember({
    companyId,

    uid,

    currentUser,

    currentMembership: currentUser.isSuperAdmin
      ? {
          role: "SUPERADMIN",
        }
      : null,
  });
}

export async function setCompanyMemberAccess({
  companyId,
  uid,
  input,
  currentUser,
}) {
  const targetUser = await getUserDocument(uid);

  assertTargetManageable({
    targetUser,

    currentUser,
  });

  const existing = await getMembership({
    companyId,

    uid,
  });

  /*
   * NO_ACCESS
   *
   * Revoke only the selected company's
   * membership. The global user account
   * and memberships in other companies
   * remain unchanged.
   */
  if (input.access === "NO_ACCESS") {
    if (!existing || existing.deletedAt || existing.status !== "active") {
      return createNoAccessResponse({
        uid,

        unchanged: true,
      });
    }

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

      action: "USER_REVOKE",

      resource: "membership",

      resourceId: uid,

      before: serializeFirestoreDocument(before),

      after: {
        access: "NO_ACCESS",

        assigned: false,

        removed: true,
      },

      metadata: {
        companyAccessUpdate: true,

        softDelete: true,
      },
    });

    return createNoAccessResponse({
      uid,
    });
  }

  const permissions = validateCustomPermissions({
    role: input.access,

    permissions: input.permissions || [],
  });

  const groupIds = input.groupIds || [];

  /*
   * The requested access already matches
   * the active membership. Return without
   * writing or creating duplicate audits.
   */
  if (
    membershipMatches({
      membership: existing,

      role: input.access,

      permissions,

      groupIds,
    })
  ) {
    const member = await getCompanyMember({
      companyId,

      uid,

      currentUser,

      currentMembership: currentUser.isSuperAdmin
        ? {
            role: "SUPERADMIN",
          }
        : null,
    });

    return createAccessResponse(member, {
      unchanged: true,
    });
  }

  /*
   * No membership or a previously revoked
   * membership: create/restore the same
   * deterministic membership document.
   */
  if (!existing || existing.deletedAt || existing.status !== "active") {
    const membership = await createMembership({
      companyId,

      uid,

      role: input.access,

      permissions,

      groupIds,

      userId: currentUser.uid,
    });

    await createAuditLog({
      userId: currentUser.uid,

      companyId,

      action: "USER_ASSIGN",

      resource: "membership",

      resourceId: uid,

      before: existing ? serializeFirestoreDocument(existing) : null,

      after: serializeFirestoreDocument(membership),

      metadata: {
        companyAccessUpdate: true,

        restoredMembership: Boolean(existing),

        globalRole: targetUser.isSuperAdmin ? "SUPERADMIN" : "USER",
      },
    });

    const member = await getCompanyMember({
      companyId,

      uid,

      currentUser,

      currentMembership: currentUser.isSuperAdmin
        ? {
            role: "SUPERADMIN",
          }
        : null,
    });

    return createAccessResponse(member);
  }

  /*
   * Existing active membership:
   * update its role, permissions or groups.
   */
  const result = await updateMembership({
    companyId,

    uid,

    data: {
      role: input.access,

      permissions,

      groupIds,

      status: "active",

      deletedAt: null,

      deletedBy: null,
    },

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

    metadata: {
      companyAccessUpdate: true,

      previousAccess: existing.role || "NO_ACCESS",

      nextAccess: input.access,
    },
  });

  const member = await getCompanyMember({
    companyId,

    uid,

    currentUser,

    currentMembership: currentUser.isSuperAdmin
      ? {
          role: "SUPERADMIN",
        }
      : null,
  });

  return createAccessResponse(member);
}

export async function editCompanyMember({
  companyId,
  uid,
  input,
  currentUser,
}) {
  const targetUser = await getUserDocument(uid);

  assertTargetManageable({
    targetUser,

    currentUser,
  });

  const existing = await getMembership({
    companyId,

    uid,
  });

  if (!existing || existing.deletedAt || existing.status !== "active") {
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

  /*
   * Display name belongs to the global
   * user account.
   */
  if (input.displayName !== undefined) {
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

  /*
   * Avatar belongs to the global user
   * document and is shared across all
   * company memberships.
   */
  if (input.avatar !== undefined) {
    await updateUserDocument({
      uid,

      data: {
        avatar: input.avatar || null,
      },

      userId: currentUser.uid,
    });
  }

  const updateData = {
    ...input,

    role: resolvedRole,

    permissions: resolvedPermissions,

    groupIds:
      input.groupIds !== undefined ? input.groupIds : existing.groupIds || [],
  };

  delete updateData.displayName;
  delete updateData.avatar;

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

    currentUser,

    currentMembership: currentUser.isSuperAdmin
      ? {
          role: "SUPERADMIN",
        }
      : null,
  });
}

export async function removeCompanyMember({ companyId, uid, currentUser }) {
  const targetUser = await getUserDocument(uid);

  assertTargetManageable({
    targetUser,

    currentUser,
  });

  if (uid === currentUser.uid && !currentUser.isSuperAdmin) {
    throw new Error("CANNOT_REMOVE_SELF");
  }

  const existing = await getMembership({
    companyId,

    uid,
  });

  if (!existing || existing.deletedAt || existing.status !== "active") {
    throw new Error("MEMBERSHIP_NOT_FOUND");
  }

  const before = await softDeleteMembership({
    companyId,

    uid,

    userId: currentUser.uid,
  });

  await createAuditLog({
    userId: currentUser.uid,

    companyId,

    action: "USER_REVOKE",

    resource: "membership",

    resourceId: uid,

    before: serializeFirestoreDocument(before),

    after: {
      access: "NO_ACCESS",

      removed: true,
    },

    metadata: {
      companyAccessUpdate: true,

      softDelete: true,
    },
  });

  return {
    uid,

    access: "NO_ACCESS",

    assigned: false,

    removed: true,
  };
}
