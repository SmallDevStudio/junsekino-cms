import { z } from "zod";

import {
  COMPANY_STATUS,
  COMPANY_LOCALES,
  DEFAULT_COMPANY_LOCALE,
  DEFAULT_COMPANY_LOCALES,
} from "@/constants/company";

/*
 * =========================================================
 * COMMON
 * =========================================================
 */

const nullableUrlSchema = z
  .union([z.string().url(), z.literal(""), z.null()])
  .optional();

const nullableStringSchema = z.union([z.string(), z.null()]).optional();

const colorSchema = z
  .string()
  .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Invalid HEX color.");

/*
 * =========================================================
 * SEO
 * =========================================================
 */

const localizedSeoSchema = z.object({
  title: z.string().max(70).default(""),

  description: z.string().max(180).default(""),

  keywords: z.array(z.string().max(100)).default([]),

  ogTitle: z.string().max(100).default(""),

  ogDescription: z.string().max(200).default(""),

  ogImage: nullableStringSchema,
});

const seoSchema = z.object({
  th: localizedSeoSchema,

  en: localizedSeoSchema,

  index: z.boolean(),

  follow: z.boolean(),
});

/*
 * =========================================================
 * BRANDING
 * =========================================================
 */

const brandingSchema = z.object({
  logoLight: nullableStringSchema,

  logoDark: nullableStringSchema,

  favicon: nullableStringSchema,

  colors: z.object({
    primary: colorSchema,

    secondary: colorSchema,

    accent: colorSchema,

    background: colorSchema,

    surface: colorSchema,

    text: colorSchema,
  }),
});

/*
 * =========================================================
 * SOCIAL
 * =========================================================
 */

const socialSchema = z.object({
  facebook: nullableUrlSchema,

  instagram: nullableUrlSchema,

  linkedin: nullableUrlSchema,

  youtube: nullableUrlSchema,

  x: nullableUrlSchema,

  tiktok: nullableUrlSchema,

  pinterest: nullableUrlSchema,
});

/*
 * =========================================================
 * LOCALIZATION
 * =========================================================
 *
 * English is mandatory.
 *
 * Thai is optional and can be enabled
 * from Company Settings.
 * =========================================================
 */

const supportedLocalesSchema = z
  .array(z.enum([COMPANY_LOCALES.EN, COMPANY_LOCALES.TH]))
  .min(1, "At least one language is required.")
  .default(DEFAULT_COMPANY_LOCALES)
  .transform((locales) => Array.from(new Set(locales)))
  .refine((locales) => locales.includes(COMPANY_LOCALES.EN), {
    message: "English must always be enabled.",
  });

/*
 * =========================================================
 * BASE OBJECT
 * =========================================================
 *
 * IMPORTANT
 *
 * Keep this as a plain z.object().
 *
 * Do NOT put superRefine here because
 * updateCompanySchema needs .partial().
 * =========================================================
 */

const companyObjectSchema = z.object({
  name: z.string().trim().min(2).max(150),

  legalName: z.string().trim().max(200).default(""),

  shortName: z.string().trim().max(50).default(""),

  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain lowercase letters, numbers and hyphens only.",
    ),

  status: z
    .enum([
      COMPANY_STATUS.ACTIVE,
      COMPANY_STATUS.INACTIVE,
      COMPANY_STATUS.ARCHIVED,
    ])
    .default(COMPANY_STATUS.ACTIVE),

  /*
   * Public website default locale.
   *
   * English remains platform default.
   */
  defaultLocale: z
    .enum([COMPANY_LOCALES.EN, COMPANY_LOCALES.TH])
    .default(DEFAULT_COMPANY_LOCALE),

  /*
   * Public website enabled languages.
   */
  supportedLocales: supportedLocalesSchema,

  branding: brandingSchema.optional(),

  social: socialSchema.optional(),

  seo: seoSchema.optional(),
});

/*
 * =========================================================
 * CREATE
 * =========================================================
 */

export const createCompanySchema = companyObjectSchema.superRefine(
  (company, context) => {
    /*
     * Thai may only be the default
     * language when Thai is enabled.
     */

    if (
      company.defaultLocale === COMPANY_LOCALES.TH &&
      !company.supportedLocales.includes(COMPANY_LOCALES.TH)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,

        path: ["defaultLocale"],

        message: "Thai cannot be the default language unless Thai is enabled.",
      });
    }
  },
);

/*
 * =========================================================
 * UPDATE
 * =========================================================
 *
 * partial() MUST be applied before
 * superRefine().
 *
 * During PATCH, either localization
 * field may be omitted.
 *
 * Full merged-record validation will
 * remain a service-layer responsibility.
 * =========================================================
 */

export const updateCompanySchema = companyObjectSchema
  .partial()
  .superRefine((company, context) => {
    /*
     * We can validate this relation
     * here only when both values are
     * included in the request.
     */

    if (
      company.defaultLocale === COMPANY_LOCALES.TH &&
      Array.isArray(company.supportedLocales) &&
      !company.supportedLocales.includes(COMPANY_LOCALES.TH)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,

        path: ["defaultLocale"],

        message: "Thai cannot be the default language unless Thai is enabled.",
      });
    }

    /*
     * If caller explicitly removes TH
     * while also explicitly declaring
     * TH as default, reject the request.
     */

    if (
      Array.isArray(company.supportedLocales) &&
      company.defaultLocale === COMPANY_LOCALES.TH &&
      !company.supportedLocales.includes(COMPANY_LOCALES.TH)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,

        path: ["supportedLocales"],

        message: "Thai must remain enabled while it is the default language.",
      });
    }
  });

/*
 * =========================================================
 * COMPANY ID
 * =========================================================
 */

export const companyIdSchema = z.string().trim().min(1).max(150);
