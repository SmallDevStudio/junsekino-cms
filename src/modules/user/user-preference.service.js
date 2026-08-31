import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

import { createAuditLog } from "@/modules/audit/audit.service";

const DEFAULT_ADMIN_PREFERENCES = {
  locale: "en",

  sidebarCollapsed: false,

  density: "comfortable",

  fontSize: "medium",

  tooltipEnabled: true,

  tooltipDelay: 300,

  actionDisplay: "icon-label",
};

const DEFAULT_PRIVACY_PREFERENCES = {
  avatarVisibility: "company",

  phoneVisibility: "private",

  bioVisibility: "company",

  lastActiveVisibility: "admins",
};

const DEFAULT_NOTIFICATION_PREFERENCES = {
  emailEnabled: true,

  browserEnabled: true,

  formSubmissions: true,

  contentPublished: true,

  memberUpdates: true,

  securityAlerts: true,
};

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

function normalizePrivacyPreferences(value = {}) {
  return {
    avatarVisibility: ["company", "private"].includes(value.avatarVisibility)
      ? value.avatarVisibility
      : DEFAULT_PRIVACY_PREFERENCES.avatarVisibility,

    phoneVisibility: ["company", "private"].includes(value.phoneVisibility)
      ? value.phoneVisibility
      : DEFAULT_PRIVACY_PREFERENCES.phoneVisibility,

    bioVisibility: ["company", "private"].includes(value.bioVisibility)
      ? value.bioVisibility
      : DEFAULT_PRIVACY_PREFERENCES.bioVisibility,

    lastActiveVisibility: ["admins", "private"].includes(
      value.lastActiveVisibility,
    )
      ? value.lastActiveVisibility
      : DEFAULT_PRIVACY_PREFERENCES.lastActiveVisibility,
  };
}

function normalizeNotificationPreferences(value = {}) {
  return {
    emailEnabled:
      typeof value.emailEnabled === "boolean"
        ? value.emailEnabled
        : DEFAULT_NOTIFICATION_PREFERENCES.emailEnabled,

    browserEnabled:
      typeof value.browserEnabled === "boolean"
        ? value.browserEnabled
        : DEFAULT_NOTIFICATION_PREFERENCES.browserEnabled,

    formSubmissions:
      typeof value.formSubmissions === "boolean"
        ? value.formSubmissions
        : DEFAULT_NOTIFICATION_PREFERENCES.formSubmissions,

    contentPublished:
      typeof value.contentPublished === "boolean"
        ? value.contentPublished
        : DEFAULT_NOTIFICATION_PREFERENCES.contentPublished,

    memberUpdates:
      typeof value.memberUpdates === "boolean"
        ? value.memberUpdates
        : DEFAULT_NOTIFICATION_PREFERENCES.memberUpdates,

    /*
     * Security alerts are mandatory.
     */
    securityAlerts: true,
  };
}

function createPreferenceResponse(data = {}) {
  const storedAdmin =
    data?.preferences?.admin || data?.preferences?.adminUi || {};

  return {
    admin: normalizeAdminPreferences(storedAdmin),

    privacy: normalizePrivacyPreferences(data?.preferences?.privacy || {}),

    notifications: normalizeNotificationPreferences(
      data?.preferences?.notifications || {},
    ),
  };
}

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

  const normalized = createPreferenceResponse(data);

  const storedAdmin =
    data?.preferences?.admin || data?.preferences?.adminUi || {};

  const needsMigration =
    !data?.preferences?.admin ||
    !["small", "medium", "large"].includes(storedAdmin.fontSize) ||
    !data?.preferences?.privacy ||
    !data?.preferences?.notifications;

  if (needsMigration) {
    await ref.update({
      "preferences.admin": normalized.admin,

      "preferences.privacy": normalized.privacy,

      "preferences.notifications": normalized.notifications,

      preferencesUpdatedAt: FieldValue.serverTimestamp(),
    });
  }

  return normalized;
}

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

  if (existing.deletedAt || existing.status === "deleted") {
    throw new Error("USER_NOT_FOUND");
  }

  const current = createPreferenceResponse(existing);

  const nextAdmin = normalizeAdminPreferences({
    ...current.admin,

    ...(input?.admin || {}),
  });

  const nextPrivacy = normalizePrivacyPreferences({
    ...current.privacy,

    ...(input?.privacy || {}),
  });

  const nextNotifications = normalizeNotificationPreferences({
    ...current.notifications,

    ...(input?.notifications || {}),
  });

  await ref.update({
    "preferences.admin": nextAdmin,

    "preferences.privacy": nextPrivacy,

    "preferences.notifications": nextNotifications,

    preferencesUpdatedAt: FieldValue.serverTimestamp(),

    preferencesUpdatedBy: userId,
  });

  /*
   * Admin UI changes are frequent and already
   * persisted in the user document. Audit only
   * privacy and notification/security changes.
   */
  if (input?.privacy || input?.notifications) {
    await createAuditLog({
      userId,

      companyId: null,

      action: "USER_PREFERENCES_UPDATE",

      resource: "platformUser",

      resourceId: userId,

      before: {
        privacy: current.privacy,

        notifications: current.notifications,
      },

      after: {
        privacy: nextPrivacy,

        notifications: nextNotifications,
      },

      metadata: {
        selfPreferenceUpdate: true,

        privacyUpdated: Boolean(input?.privacy),

        notificationsUpdated: Boolean(input?.notifications),
      },
    });
  }

  return {
    admin: nextAdmin,

    privacy: nextPrivacy,

    notifications: nextNotifications,
  };
}

export function getDefaultAdminPreferences() {
  return {
    ...DEFAULT_ADMIN_PREFERENCES,
  };
}

export function getDefaultPrivacyPreferences() {
  return {
    ...DEFAULT_PRIVACY_PREFERENCES,
  };
}

export function getDefaultNotificationPreferences() {
  return {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
  };
}
