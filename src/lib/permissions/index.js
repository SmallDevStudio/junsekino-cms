import { ROLE_PERMISSIONS } from "./role-permissions";

export function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role] || [];
}

export function hasPermission({
  isSuperAdmin = false,
  role = null,
  permissions = [],
  permission,
}) {
  if (isSuperAdmin) {
    return true;
  }

  if (!permission) {
    return false;
  }

  const rolePermissions = getRolePermissions(role);

  const resolvedPermissions = new Set([
    ...rolePermissions,
    ...(permissions || []),
  ]);

  return resolvedPermissions.has(permission);
}

export function resolvePermissions({
  isSuperAdmin = false,
  role = null,
  permissions = [],
}) {
  if (isSuperAdmin) {
    return ["*"];
  }

  return Array.from(
    new Set([...getRolePermissions(role), ...(permissions || [])]),
  );
}
