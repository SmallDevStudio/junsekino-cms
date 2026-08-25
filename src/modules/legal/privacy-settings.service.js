import "server-only";

import { DEFAULT_COOKIE_BANNER } from "@/constants/legal-defaults";

import { DEFAULT_COOKIE_CATEGORIES } from "@/constants/legal";

import {
  getPrivacySettings,
  updatePrivacySettingsRecord,
} from "./privacy-settings.repository";

import { createAuditLogSafe } from "@/modules/audit/audit.service";

import { serializeFirestoreDocument } from "@/utils/firestore";

export async function getCompanyPrivacySettings(companyId) {
  const existing = await getPrivacySettings(companyId);

  if (existing) {
    return serializeFirestoreDocument(existing);
  }

  return {
    showCookieBanner: true,

    allowRejectOptional: true,

    showPreferences: true,

    cookieBanner: DEFAULT_COOKIE_BANNER,

    categories: DEFAULT_COOKIE_CATEGORIES,

    privacyContact: {
      companyName: {
        th: "",
        en: "",
      },

      address: {
        th: "",
        en: "",
      },

      email: "",

      phone: "",

      dpoEmail: "",
    },
  };
}

export async function updateCompanyPrivacySettings({
  companyId,
  input,
  currentUser,
}) {
  const existing = await getCompanyPrivacySettings(companyId);

  const data = {
    ...input,
  };

  if (input.cookieBanner) {
    data.cookieBanner = {
      ...existing.cookieBanner,

      ...input.cookieBanner,

      th: {
        ...existing.cookieBanner?.th,

        ...input.cookieBanner?.th,
      },

      en: {
        ...existing.cookieBanner?.en,

        ...input.cookieBanner?.en,
      },
    };
  }

  if (input.privacyContact) {
    data.privacyContact = {
      ...existing.privacyContact,

      ...input.privacyContact,
    };
  }

  const result = await updatePrivacySettingsRecord({
    companyId,

    data,

    userId: currentUser.uid,
  });

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: "PRIVACY_SETTINGS_UPDATE",

    resource: "companySettings",

    resourceId: "privacy",

    before: serializeFirestoreDocument(result.before),

    after: serializeFirestoreDocument(result.after),
  });

  return serializeFirestoreDocument(result.after);
}
