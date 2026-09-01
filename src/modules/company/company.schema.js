import { z } from "zod";

import {
  COMPANY_LOCALES,
  COMPANY_LOGO_MODE,
  COMPANY_STATUS,
  COMPANY_THEME_MODE,
  DEFAULT_COMPANY_LOCALE,
  DEFAULT_COMPANY_LOCALES,
} from "@/constants/company";

/*
 * =========================================================
 * COMMON
 * =========================================================
 */

const nullableStringSchema = z
  .union([z.string().trim().max(1000), z.null()])
  .optional();

const nullableUrlSchema = z
  .union([z.string().trim().url(), z.literal(""), z.null()])
  .optional();

const nullableEmailSchema = z
  .union([z.string().trim().email(), z.literal(""), z.null()])
  .optional();

const nullableNumberSchema = z.union([z.number(), z.null()]).optional();

const colorSchema = z
  .string()
  .trim()
  .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Invalid HEX color.");

const localizedPlainTextSchema = z
  .object({
    en: z.string().max(3000).optional(),

    th: z.string().max(3000).optional(),
  })
  .optional();

/*
 * =========================================================
 * COMPANY MEDIA REFERENCE
 * =========================================================
 *
 * Uses the same structure returned by CoverImageField.
 *
 * Legacy string values remain supported during migration.
 *
 * IMPORTANT:
 * These schemas must be declared before brandingSchema.
 * =========================================================
 */

const localizedMediaTextSchema = z.object({
  en: z.string().max(500).optional(),

  th: z.string().max(500).optional(),
});

const mediaCropSchema = z
  .object({
    x: z.number().optional(),

    y: z.number().optional(),

    zoom: z.number().optional(),

    rotation: z.number().optional(),

    aspect: z.number().optional(),

    objectPosition: z.string().max(100).optional(),
  })
  .passthrough()
  .nullable()
  .optional();

const companyMediaReferenceSchema = z.object({
  mediaId: z.string().trim().min(1).max(200),

  alt: localizedMediaTextSchema.optional(),

  caption: localizedMediaTextSchema.optional(),

  crop: mediaCropSchema,
});

/*
 * Existing records may contain only the Media ID.
 *
 * New records use:
 *
 * {
 *   mediaId,
 *   alt,
 *   caption,
 *   crop
 * }
 */
const companyLogoReferenceSchema = z
  .union([
    companyMediaReferenceSchema,

    z.string().trim().min(1).max(200),

    z.null(),
  ])
  .optional();

/*
 * =========================================================
 * COMPANY PROFILE
 * =========================================================
 */

const companyProfileSchema = z
  .object({
    taxId: nullableStringSchema,

    registrationNumber: nullableStringSchema,

    email: nullableEmailSchema,

    phone: nullableStringSchema,

    secondaryPhone: nullableStringSchema,

    website: nullableUrlSchema,

    address: localizedPlainTextSchema,

    mapUrl: nullableUrlSchema,

    latitude: nullableNumberSchema,

    longitude: nullableNumberSchema,

    businessHours: localizedPlainTextSchema,
  })
  .optional();

/*
 * =========================================================
 * SEO
 * =========================================================
 */

const localizedSeoSchema = z.object({
  title: z.string().max(70).optional(),

  description: z.string().max(180).optional(),

  keywords: z.array(z.string().trim().max(100)).max(100).optional(),

  ogTitle: z.string().max(100).optional(),

  ogDescription: z.string().max(200).optional(),

  ogImage: companyLogoReferenceSchema,
});

const seoSchema = z
  .object({
    th: localizedSeoSchema.optional(),

    en: localizedSeoSchema.optional(),

    index: z.boolean().optional(),

    follow: z.boolean().optional(),
  })
  .optional();

/*
 * =========================================================
 * BRANDING
 * =========================================================
 */

const brandingColorsSchema = z.object({
  /*
   * Main brand color.
   *
   * Used for buttons, links, active menus
   * and important highlights.
   */
  primary: colorSchema.optional(),

  /*
   * Secondary brand color.
   */
  secondary: colorSchema.optional(),

  /*
   * Decorative/highlight color.
   */
  accent: colorSchema.optional(),

  /*
   * Backward-compatible public colors.
   *
   * Existing public pages may still read
   * these values directly.
   *
   * Company Settings UI will display them
   * under the Light Theme section.
   */
  background: colorSchema.optional(),

  surface: colorSchema.optional(),

  text: colorSchema.optional(),
});

const textLogoSchema = z.object({
  /*
   * Main wordmark.
   *
   * Example: JUNSEKINO
   */
  text: z.string().trim().max(100).optional(),

  /*
   * Highlighted suffix.
   *
   * Example: I+D or A+D
   */
  highlight: z.string().trim().max(50).optional(),

  /*
   * Optional separator between text
   * and highlighted suffix.
   */
  separator: z.string().max(10).optional(),
});

const brandingSchema = z
  .object({
    /*
     * auto:
     * Use an image when available, otherwise text.
     *
     * image:
     * Prefer the image, with text fallback.
     *
     * text:
     * Always use the text wordmark.
     */
    logoMode: z
      .enum([
        COMPANY_LOGO_MODE.AUTO,
        COMPANY_LOGO_MODE.IMAGE,
        COMPANY_LOGO_MODE.TEXT,
      ])
      .optional(),

    /*
     * Logo displayed on a light background.
     */
    logoLight: companyLogoReferenceSchema,

    /*
     * Logo displayed on a dark background.
     */
    logoDark: companyLogoReferenceSchema,

    /*
     * Square browser/site icon.
     */
    favicon: companyLogoReferenceSchema,

    /*
     * Text logo and image fallback.
     */
    textLogo: textLogoSchema.optional(),

    colors: brandingColorsSchema.optional(),
  })
  .optional();

/*
 * =========================================================
 * PUBLIC THEME
 * =========================================================
 */

const themeColorSetSchema = z.object({
  background: colorSchema.optional(),

  surface: colorSchema.optional(),

  text: colorSchema.optional(),

  mutedText: colorSchema.optional(),

  border: colorSchema.optional(),
});

const themeSchema = z
  .object({
    /*
     * Default mode of the public website.
     *
     * Admin theme remains a user preference
     * and is not controlled here.
     */
    defaultMode: z
      .enum([
        COMPANY_THEME_MODE.LIGHT,
        COMPANY_THEME_MODE.DARK,
        COMPANY_THEME_MODE.SYSTEM,
      ])
      .optional(),

    /*
     * Whether public visitors may select
     * their own Light/Dark preference.
     */
    allowVisitorPreference: z.boolean().optional(),

    light: themeColorSetSchema.optional(),

    dark: themeColorSetSchema.optional(),
  })
  .optional();

/*
 * =========================================================
 * SOCIAL
 * =========================================================
 */

const socialSchema = z
  .object({
    facebook: nullableUrlSchema,

    instagram: nullableUrlSchema,

    linkedin: nullableUrlSchema,

    youtube: nullableUrlSchema,

    x: nullableUrlSchema,

    tiktok: nullableUrlSchema,

    pinterest: nullableUrlSchema,

    line: nullableUrlSchema,
  })
  .optional();

/*
 * =========================================================
 * SETUP
 * =========================================================
 */

const setupSchema = z
  .object({
    completed: z.boolean().optional(),

    completedSteps: z
      .object({
        profile: z.boolean().optional(),

        branding: z.boolean().optional(),

        contact: z.boolean().optional(),

        seo: z.boolean().optional(),
      })
      .optional(),
  })
  .optional();

/*
 * =========================================================
 * LOCALIZATION
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

  defaultLocale: z
    .enum([COMPANY_LOCALES.EN, COMPANY_LOCALES.TH])
    .default(DEFAULT_COMPANY_LOCALE),

  supportedLocales: supportedLocalesSchema,

  profile: companyProfileSchema,

  branding: brandingSchema,

  theme: themeSchema,

  social: socialSchema,

  seo: seoSchema,

  setup: setupSchema,
});

/*
 * =========================================================
 * LOCALIZATION VALIDATION
 * =========================================================
 */

function validateLocalization(company, context) {
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
}

/*
 * =========================================================
 * CREATE
 * =========================================================
 */

export const createCompanySchema =
  companyObjectSchema.superRefine(validateLocalization);

/*
 * =========================================================
 * UPDATE
 * =========================================================
 */

export const updateCompanySchema = companyObjectSchema
  .partial()
  .superRefine(validateLocalization);

/*
 * =========================================================
 * COMPANY ID
 * =========================================================
 */

export const companyIdSchema = z.string().trim().min(1).max(150);
