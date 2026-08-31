import "server-only";

import {
  getUserDocument,
  updateFirebaseUser,
  updateUserDocument,
} from "./user.repository";

import { createAuditLog } from "@/modules/audit/audit.service";

import { serializeFirestoreDocument } from "@/utils/firestore";

function assertUserExists(user) {
  if (!user || user.deletedAt || user.status === "deleted") {
    throw new Error("USER_NOT_FOUND");
  }
}

function normalizeNullableText(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const normalized = value.trim();

  return normalized || null;
}

function createProfileResponse(user) {
  const serialized = serializeFirestoreDocument(user);

  return {
    uid: serialized.id,

    email: serialized.email || null,

    displayName: serialized.displayName || "",

    phone: serialized.phone || "",

    position: serialized.position || "",

    department: serialized.department || "",

    employeeCode: serialized.employeeCode || "",

    bio: serialized.bio || "",

    avatar: serialized.avatar || null,

    status: serialized.status || "active",

    isSuperAdmin: serialized.isSuperAdmin === true,

    mustChangePassword: serialized.mustChangePassword === true,

    emailVerified: serialized.emailVerified === true,

    createdAt: serialized.createdAt || null,

    updatedAt: serialized.updatedAt || null,
  };
}

export async function getOwnProfile({ currentUser }) {
  const user = await getUserDocument(currentUser.uid);

  assertUserExists(user);

  return createProfileResponse(user);
}

export async function updateOwnProfile({ input, currentUser }) {
  const existing = await getUserDocument(currentUser.uid);

  assertUserExists(existing);

  if (
    input.displayName !== undefined &&
    input.displayName !== existing.displayName
  ) {
    await updateFirebaseUser({
      uid: currentUser.uid,

      displayName: input.displayName,
    });
  }

  const updateData = {};

  if (input.displayName !== undefined) {
    updateData.displayName = input.displayName;
  }

  if (input.phone !== undefined) {
    updateData.phone = normalizeNullableText(input.phone);
  }

  if (input.position !== undefined) {
    updateData.position = normalizeNullableText(input.position);
  }

  if (input.department !== undefined) {
    updateData.department = normalizeNullableText(input.department);
  }

  if (input.employeeCode !== undefined) {
    updateData.employeeCode = normalizeNullableText(input.employeeCode);
  }

  if (input.bio !== undefined) {
    updateData.bio = normalizeNullableText(input.bio);
  }

  /*
   * This service is accessible only through
   * /users/me/profile, so the current user is
   * always the owner of this avatar.
   */
  if (input.avatar !== undefined) {
    updateData.avatar = input.avatar || null;
  }

  const updated = await updateUserDocument({
    uid: currentUser.uid,

    data: updateData,

    userId: currentUser.uid,
  });

  await createAuditLog({
    userId: currentUser.uid,

    companyId: null,

    action: "USER_PROFILE_UPDATE",

    resource: "platformUser",

    resourceId: currentUser.uid,

    before: {
      displayName: existing.displayName || null,

      phone: existing.phone || null,

      position: existing.position || null,

      department: existing.department || null,

      employeeCode: existing.employeeCode || null,

      bio: existing.bio || null,

      avatar: existing.avatar || null,
    },

    after: {
      displayName: updated.displayName || null,

      phone: updated.phone || null,

      position: updated.position || null,

      department: updated.department || null,

      employeeCode: updated.employeeCode || null,

      bio: updated.bio || null,

      avatar: updated.avatar || null,
    },

    metadata: {
      selfProfileUpdate: true,

      avatarUpdated: input.avatar !== undefined,
    },
  });

  return createProfileResponse(updated);
}
