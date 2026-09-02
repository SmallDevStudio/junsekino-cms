import { z } from "zod";

/*
 * =========================================================
 * COMMON
 * =========================================================
 */

const localizedTextSchema = z.object({
  th: z.string().max(5000).optional(),

  en: z.string().max(5000).optional(),
});

const nullableEmailSchema = z
  .union([z.string().trim().email(), z.literal(""), z.null()])
  .optional();

/*
 * =========================================================
 * COOKIE BANNER
 * =========================================================
 */

const bannerLanguageSchema = z.object({
  title: z.string().max(300).optional(),

  description: z.string().max(3000).optional(),

  acceptAll: z.string().max(100).optional(),

  rejectOptional: z.string().max(100).optional(),

  preferences: z.string().max(100).optional(),

  savePreferences: z.string().max(100).optional(),

  privacyLink: z.string().max(100).optional(),

  cookieLink: z.string().max(100).optional(),
});

/*
 * =========================================================
 * COOKIE CATEGORY
 * =========================================================
 */

const cookieCategorySchema = z.object({
  enabled: z.boolean().optional(),

  title: localizedTextSchema.optional(),

  description: localizedTextSchema.optional(),
});

const necessaryCookieCategorySchema = cookieCategorySchema.extend({
  /*
   * Necessary cookies cannot be disabled.
   */
  enabled: z.literal(true).optional(),
});

/*
 * =========================================================
 * CONSENT MANAGEMENT
 * =========================================================
 */

const consentManagementSchema = z.object({
  enabled: z.boolean().optional(),

  /*
   * Increment this value when the consent
   * structure or processing purpose changes.
   */
  version: z.number().int().min(1).max(100000).optional(),

  /*
   * Number of days the consent cookie remains valid.
   */
  cookieMaxAgeDays: z.number().int().min(1).max(365).optional(),

  /*
   * Ask for consent again when a published
   * legal document version changes.
   */
  renewOnPolicyChange: z.boolean().optional(),

  /*
   * Save a server-side consent record as
   * proof of the visitor's decision.
   */
  recordProof: z.boolean().optional(),

  /*
   * Avoid storing raw technical identifiers
   * in consent records.
   */
  anonymizeTechnicalData: z.boolean().optional(),
});

/*
 * =========================================================
 * RETENTION
 * =========================================================
 */

const retentionSchema = z.object({
  /*
   * Consent history.
   */
  consentRecordDays: z.number().int().min(30).max(3650).optional(),

  /*
   * Raw analytics events.
   */
  analyticsRawDays: z.number().int().min(1).max(365).optional(),

  /*
   * Aggregated analytics reports.
   */
  analyticsAggregateMonths: z.number().int().min(1).max(60).optional(),

  /*
   * Public form submissions.
   */
  formSubmissionDays: z.number().int().min(30).max(3650).optional(),

  /*
   * Technical and security records.
   */
  securityLogDays: z.number().int().min(30).max(3650).optional(),
});

/*
 * =========================================================
 * DATA SUBJECT RIGHTS / DSAR
 * =========================================================
 */

const dataSubjectRightsSchema = z.object({
  enabled: z.boolean().optional(),

  requestEmail: nullableEmailSchema,

  responseDays: z.number().int().min(1).max(90).optional(),

  allowAccessRequest: z.boolean().optional(),

  allowCorrectionRequest: z.boolean().optional(),

  allowDeletionRequest: z.boolean().optional(),

  allowConsentWithdrawal: z.boolean().optional(),

  allowDataPortabilityRequest: z.boolean().optional(),

  instructions: localizedTextSchema.optional(),
});

/*
 * =========================================================
 * PRIVACY CONTACT
 * =========================================================
 */

const privacyContactSchema = z.object({
  companyName: localizedTextSchema.optional(),

  address: localizedTextSchema.optional(),

  email: nullableEmailSchema,

  phone: z
    .union([z.string().trim().max(100), z.literal(""), z.null()])
    .optional(),

  dpoEmail: nullableEmailSchema,
});

/*
 * =========================================================
 * UPDATE
 * =========================================================
 */

export const updatePrivacySettingsSchema = z.object({
  showCookieBanner: z.boolean().optional(),

  allowRejectOptional: z.boolean().optional(),

  showPreferences: z.boolean().optional(),

  cookieBanner: z
    .object({
      th: bannerLanguageSchema.optional(),

      en: bannerLanguageSchema.optional(),
    })
    .optional(),

  categories: z
    .object({
      necessary: necessaryCookieCategorySchema.optional(),

      analytics: cookieCategorySchema.optional(),

      functional: cookieCategorySchema.optional(),

      marketing: cookieCategorySchema.optional(),
    })
    .optional(),

  consentManagement: consentManagementSchema.optional(),

  retention: retentionSchema.optional(),

  dataSubjectRights: dataSubjectRightsSchema.optional(),

  privacyContact: privacyContactSchema.optional(),
});
