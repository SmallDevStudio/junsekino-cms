import "server-only";

import { getCurrentUser } from "@/lib/auth/current-user";

import { getMembership } from "@/modules/user/membership.repository";

import { hasPermission, resolvePermissions } from "@/lib/permissions";

import { MEMBERSHIP_STATUS } from "@/constants/membership";

export async function getCompanyAccess({ companyId }) {
  const user = await getCurrentUser();

  if (!user) {
    return {
      authorized: false,
      reason: "AUTHENTICATION_REQUIRED",
      user: null,
      membership: null,
    };
  }

  if (user.isSuperAdmin) {
    return {
      authorized: true,

      reason: null,

      user,

      membership: {
        role: "SUPERADMIN",

        permissions: ["*"],

        status: MEMBERSHIP_STATUS.ACTIVE,
      },
    };
  }

  const membership = await getMembership({
    companyId,
    uid: user.uid,
  });

  if (!membership) {
    return {
      authorized: false,

      reason: "COMPANY_ACCESS_DENIED",

      user,
      membership: null,
    };
  }

  if (membership.status !== MEMBERSHIP_STATUS.ACTIVE || membership.deletedAt) {
    return {
      authorized: false,

      reason: "COMPANY_ACCESS_DENIED",

      user,
      membership,
    };
  }

  return {
    authorized: true,

    reason: null,

    user,

    membership: {
      ...membership,

      resolvedPermissions: resolvePermissions({
        role: membership.role,

        permissions: membership.permissions || [],
      }),
    },
  };
}

export async function getCompanyPermission({ companyId, permission }) {
  const access = await getCompanyAccess({
    companyId,
  });

  if (!access.authorized) {
    return access;
  }

  const permitted = hasPermission({
    isSuperAdmin: access.user.isSuperAdmin,

    role: access.membership.role,

    permissions: access.membership.permissions || [],

    permission,
  });

  if (!permitted) {
    return {
      ...access,

      authorized: false,

      reason: "PERMISSION_DENIED",
    };
  }

  return access;
}
