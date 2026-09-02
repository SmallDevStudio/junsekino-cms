import "server-only";

import { DEFAULT_COOKIE_BANNER } from "@/constants/legal-defaults";

import { DEFAULT_COOKIE_CATEGORIES } from "@/constants/legal";

import {
  getPrivacySettings,
  updatePrivacySettingsRecord,
} from "./privacy-settings.repository";

import { createAuditLogSafe } from "@/modules/audit/audit.service";

import { serializeFirestoreDocument } from "@/utils/firestore";

/*
 * =========================================================
 * DEFAULTS
 * =========================================================
 */

const DEFAULT_CONSENT_MANAGEMENT = {
  enabled: true,

  version: 1,

  cookieMaxAgeDays: 180,

  renewOnPolicyChange: true,

  recordProof: true,

  anonymizeTechnicalData: true,
};

const DEFAULT_RETENTION = {
  /*
   * Consent records are retained for two years by default.
   * Each company can adjust this value according to its
   * approved privacy policy.
   */
  consentRecordDays: 730,

  /*
   * Raw analytics data is intentionally short-lived.
   */
  analyticsRawDays: 90,

  /*
   * Aggregated data contains less identifying detail.
   */
  analyticsAggregateMonths: 25,

  formSubmissionDays: 730,

  securityLogDays: 365,
};

const DEFAULT_DATA_SUBJECT_RIGHTS = {
  enabled: true,

  requestEmail: "",

  responseDays: 30,

  allowAccessRequest: true,

  allowCorrectionRequest: true,

  allowDeletionRequest: true,

  allowConsentWithdrawal: true,

  allowDataPortabilityRequest: true,

  instructions: {
    th: "",

    en: "",
  },
};

const DEFAULT_PRIVACY_CONTACT = {
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
};

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function normalizeCategory(defaultCategory, storedCategory = {}) {
  return {
    ...defaultCategory,

    ...storedCategory,

    title: {
      ...(defaultCategory?.title || {}),

      ...(storedCategory?.title || {}),
    },

    description: {
      ...(defaultCategory?.description || {}),

      ...(storedCategory?.description || {}),
    },
  };
}

function normalizeCategories(categories = {}) {
  return {
    necessary: {
      ...normalizeCategory(
        DEFAULT_COOKIE_CATEGORIES.necessary,

        categories.necessary,
      ),

      /*
       * Necessary cookies must always be available.
       */
      enabled: true,

      required: true,

      enabledByDefault: true,
    },

    analytics: {
      ...normalizeCategory(
        DEFAULT_COOKIE_CATEGORIES.analytics,

        categories.analytics,
      ),

      enabled: categories.analytics?.enabled !== false,

      required: false,

      enabledByDefault: false,
    },

    functional: {
      ...normalizeCategory(
        DEFAULT_COOKIE_CATEGORIES.functional,

        categories.functional,
      ),

      enabled: categories.functional?.enabled !== false,

      required: false,

      enabledByDefault: false,
    },

    marketing: {
      ...normalizeCategory(
        DEFAULT_COOKIE_CATEGORIES.marketing,

        categories.marketing,
      ),

      /*
       * Marketing is prepared for future use
       * but disabled until a company explicitly enables it.
       */
      enabled: categories.marketing?.enabled === true,

      required: false,

      enabledByDefault: false,
    },
  };
}

function normalizeCookieBanner(cookieBanner = {}) {
  return {
    ...DEFAULT_COOKIE_BANNER,

    ...cookieBanner,

    th: {
      ...DEFAULT_COOKIE_BANNER.th,

      ...(cookieBanner.th || {}),
    },

    en: {
      ...DEFAULT_COOKIE_BANNER.en,

      ...(cookieBanner.en || {}),
    },
  };
}

function normalizeConsentManagement(consentManagement = {}) {
  return {
    ...DEFAULT_CONSENT_MANAGEMENT,

    ...consentManagement,

    enabled: consentManagement.enabled !== false,

    version: Number.isInteger(consentManagement.version)
      ? Math.max(1, consentManagement.version)
      : DEFAULT_CONSENT_MANAGEMENT.version,

    cookieMaxAgeDays: Number.isInteger(consentManagement.cookieMaxAgeDays)
      ? Math.max(
          1,

          Math.min(
            365,

            consentManagement.cookieMaxAgeDays,
          ),
        )
      : DEFAULT_CONSENT_MANAGEMENT.cookieMaxAgeDays,

    recordProof: consentManagement.recordProof !== false,

    anonymizeTechnicalData: consentManagement.anonymizeTechnicalData !== false,
  };
}

function normalizeRetention(retention = {}) {
  return {
    ...DEFAULT_RETENTION,

    ...retention,
  };
}

function normalizeDataSubjectRights(dataSubjectRights = {}) {
  return {
    ...DEFAULT_DATA_SUBJECT_RIGHTS,

    ...dataSubjectRights,

    instructions: {
      ...DEFAULT_DATA_SUBJECT_RIGHTS.instructions,

      ...(dataSubjectRights.instructions || {}),
    },
  };
}

function normalizePrivacyContact(privacyContact = {}) {
  return {
    ...DEFAULT_PRIVACY_CONTACT,

    ...privacyContact,

    companyName: {
      ...DEFAULT_PRIVACY_CONTACT.companyName,

      ...(privacyContact.companyName || {}),
    },

    address: {
      ...DEFAULT_PRIVACY_CONTACT.address,

      ...(privacyContact.address || {}),
    },
  };
}

function normalizePrivacySettings(settings = {}) {
  return {
    showCookieBanner: settings.showCookieBanner !== false,

    allowRejectOptional: settings.allowRejectOptional !== false,

    showPreferences: settings.showPreferences !== false,

    cookieBanner: normalizeCookieBanner(settings.cookieBanner),

    categories: normalizeCategories(settings.categories),

    consentManagement: normalizeConsentManagement(settings.consentManagement),

    retention: normalizeRetention(settings.retention),

    dataSubjectRights: normalizeDataSubjectRights(settings.dataSubjectRights),

    privacyContact: normalizePrivacyContact(settings.privacyContact),
  };
}

/*
 * =========================================================
 * GET
 * =========================================================
 */

export async function getCompanyPrivacySettings(companyId) {
  if (!companyId) {
    throw new Error("COMPANY_ID_REQUIRED");
  }

  const existing = await getPrivacySettings(companyId);

  return normalizePrivacySettings(existing || {});
}

/*
 * =========================================================
 * UPDATE
 * =========================================================
 */

export async function updateCompanyPrivacySettings({
  companyId,
  input,
  currentUser,
}) {
  if (!companyId) {
    throw new Error("COMPANY_ID_REQUIRED");
  }

  if (!currentUser?.uid) {
    throw new Error("CURRENT_USER_REQUIRED");
  }

  const existing = await getCompanyPrivacySettings(companyId);

  const nextSettings = normalizePrivacySettings({
    ...existing,

    ...input,

    cookieBanner: input.cookieBanner
      ? {
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
        }
      : existing.cookieBanner,

    categories: input.categories
      ? {
          ...existing.categories,

          ...input.categories,

          necessary: {
            ...existing.categories?.necessary,

            ...input.categories?.necessary,
          },

          analytics: {
            ...existing.categories?.analytics,

            ...input.categories?.analytics,
          },

          functional: {
            ...existing.categories?.functional,

            ...input.categories?.functional,
          },

          marketing: {
            ...existing.categories?.marketing,

            ...input.categories?.marketing,
          },
        }
      : existing.categories,

    consentManagement: input.consentManagement
      ? {
          ...existing.consentManagement,

          ...input.consentManagement,
        }
      : existing.consentManagement,

    retention: input.retention
      ? {
          ...existing.retention,

          ...input.retention,
        }
      : existing.retention,

    dataSubjectRights: input.dataSubjectRights
      ? {
          ...existing.dataSubjectRights,

          ...input.dataSubjectRights,

          instructions: {
            ...existing.dataSubjectRights?.instructions,

            ...input.dataSubjectRights?.instructions,
          },
        }
      : existing.dataSubjectRights,

    privacyContact: input.privacyContact
      ? {
          ...existing.privacyContact,

          ...input.privacyContact,

          companyName: {
            ...existing.privacyContact?.companyName,

            ...input.privacyContact?.companyName,
          },

          address: {
            ...existing.privacyContact?.address,

            ...input.privacyContact?.address,
          },
        }
      : existing.privacyContact,
  });

  const result = await updatePrivacySettingsRecord({
    companyId,

    data: nextSettings,

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

  return serializeFirestoreDocument(normalizePrivacySettings(result.after));
}
