import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

/*
 * =========================================================
 * DEFAULTS
 * =========================================================
 *
 * These defaults are intentionally
 * mirrored with ADMIN_UI_DEFAULTS.
 *
 * Server code must not import client-side
 * Admin UI constants.
 * =========================================================
 */

const DEFAULT_ADMIN_PREFERENCES = {
  locale: "en",

  sidebarCollapsed: false,

  density: "comfortable",

  /*
   * Medium is now the standard default.
   */
  fontSize: "medium",

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
        : DEFAULT_ADMIN_PREFERENCES.sidebarCollapsed,

    density: ["compact", "comfortable", "spacious"].includes(value.density)
      ? value.density
      : DEFAULT_ADMIN_PREFERENCES.density,

    fontSize: ["small", "medium", "large"].includes(value.fontSize)
      ? value.fontSize
      : DEFAULT_ADMIN_PREFERENCES.fontSize,

    tooltipEnabled:
      typeof value.tooltipEnabled === "boolean"
        ? value.tooltipEnabled
        : DEFAULT_ADMIN_PREFERENCES.tooltipEnabled,

    tooltipDelay: Number.isFinite(Number(value.tooltipDelay))
      ? Math.max(0, Math.min(3000, Number(value.tooltipDelay)))
      : DEFAULT_ADMIN_PREFERENCES.tooltipDelay,

    actionDisplay: ["icon-label", "icon", "label"].includes(value.actionDisplay)
      ? value.actionDisplay
      : DEFAULT_ADMIN_PREFERENCES.actionDisplay,
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

  const storedAdmin =
    data?.preferences?.admin || data?.preferences?.adminUi || {};

  const admin = normalizeAdminPreferences(storedAdmin);

  /*
   * =======================================================
   * LAZY MIGRATION
   * =======================================================
   *
   * Existing users created before fontSize
   * was introduced do not contain the field.
   *
   * Normalize them to Medium and persist the
   * missing value automatically.
   *
   * We do NOT overwrite existing valid user
   * preferences.
   * =======================================================
   */

  const needsMigration =
    !data?.preferences?.admin ||
    !["small", "medium", "large"].includes(storedAdmin.fontSize);

  if (needsMigration) {
    await ref.update({
      "preferences.admin": admin,

      preferencesUpdatedAt: FieldValue.serverTimestamp(),
    });
  }

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

  /*
   * Existing stored values.
   */
  const currentAdmin = normalizeAdminPreferences(
    existing?.preferences?.admin || existing?.preferences?.adminUi || {},
  );

  /*
   * IMPORTANT:
   *
   * Patch only the fields requested by
   * the client while keeping every other
   * preference intact.
   *
   * Example:
   *
   * locale = th
   * fontSize = large
   *
   * User changes only locale to en.
   *
   * fontSize MUST remain large.
   */
  const nextAdmin = normalizeAdminPreferences({
    ...currentAdmin,

    ...(input?.admin || {}),
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
