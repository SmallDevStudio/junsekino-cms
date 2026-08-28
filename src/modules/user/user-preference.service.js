import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

/*
 * =========================================================
 * DEFAULTS
 * =========================================================
 */

const DEFAULT_ADMIN_PREFERENCES = {
  locale: "en",

  sidebarCollapsed: false,

  density: "comfortable",

  tooltipEnabled: true,

  tooltipDelay: 300,

  actionDisplay: "icon-label",
};

/*
 * =========================================================
 * NORMALIZE
 * =========================================================
 */

function normalizeAdminPreferences(value = {}) {
  return {
    locale: value.locale === "th" ? "th" : "en",

    sidebarCollapsed:
      typeof value.sidebarCollapsed === "boolean"
        ? value.sidebarCollapsed
        : false,

    density: ["compact", "comfortable", "spacious"].includes(value.density)
      ? value.density
      : "comfortable",

    tooltipEnabled:
      typeof value.tooltipEnabled === "boolean" ? value.tooltipEnabled : true,

    tooltipDelay: Number.isFinite(Number(value.tooltipDelay))
      ? Math.max(0, Math.min(3000, Number(value.tooltipDelay)))
      : 300,

    actionDisplay: ["icon-label", "icon", "label"].includes(value.actionDisplay)
      ? value.actionDisplay
      : "icon-label",
  };
}

/*
 * =========================================================
 * GET
 * =========================================================
 */

export async function getUserPreferences({ userId }) {
  if (!userId) {
    throw new Error("USER_ID_REQUIRED");
  }

  const ref = adminDb.collection("users").doc(userId);

  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new Error("USER_NOT_FOUND");
  }

  const data = snapshot.data();

  const admin = normalizeAdminPreferences(
    data?.preferences?.admin || data?.preferences?.adminUi || {},
  );

  return {
    admin,
  };
}

/*
 * =========================================================
 * UPDATE
 * =========================================================
 */

export async function updateUserPreferences({ userId, input }) {
  if (!userId) {
    throw new Error("USER_ID_REQUIRED");
  }

  const ref = adminDb.collection("users").doc(userId);

  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new Error("USER_NOT_FOUND");
  }

  const existing = snapshot.data();

  const currentAdmin = normalizeAdminPreferences(
    existing?.preferences?.admin || existing?.preferences?.adminUi || {},
  );

  const nextAdmin = normalizeAdminPreferences({
    ...currentAdmin,
    ...input.admin,
  });

  await ref.update({
    "preferences.admin": nextAdmin,

    preferencesUpdatedAt: FieldValue.serverTimestamp(),
  });

  return {
    admin: nextAdmin,
  };
}

/*
 * =========================================================
 * DEFAULT EXPORT HELPER
 * =========================================================
 */

export function getDefaultAdminPreferences() {
  return {
    ...DEFAULT_ADMIN_PREFERENCES,
  };
}
