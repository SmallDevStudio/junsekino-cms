import { z } from "zod";

import { COMPANY_STATUS, COMPANY_LOCALES } from "@/constants/company";

const nullableUrlSchema = z
  .union([z.string().url(), z.literal(""), z.null()])
  .optional();

const nullableStringSchema = z.union([z.string(), z.null()]).optional();

const colorSchema = z
  .string()
  .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Invalid HEX color.");

const localizedSeoSchema = z.object({
  title: z.string().max(70).default(""),

  description: z.string().max(180).default(""),

  keywords: z.array(z.string().max(100)).default([]),

  ogTitle: z.string().max(100).default(""),

  ogDescription: z.string().max(200).default(""),

  ogImage: nullableStringSchema,
});

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

const socialSchema = z.object({
  facebook: nullableUrlSchema,
  instagram: nullableUrlSchema,
  linkedin: nullableUrlSchema,
  youtube: nullableUrlSchema,
  x: nullableUrlSchema,
  tiktok: nullableUrlSchema,
  pinterest: nullableUrlSchema,
});

const seoSchema = z.object({
  th: localizedSeoSchema,

  en: localizedSeoSchema,

  index: z.boolean(),

  follow: z.boolean(),
});

const baseCompanySchema = z.object({
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
    .enum([COMPANY_LOCALES.TH, COMPANY_LOCALES.EN])
    .default(COMPANY_LOCALES.EN),

  supportedLocales: z
    .array(z.enum([COMPANY_LOCALES.TH, COMPANY_LOCALES.EN]))
    .min(1),

  branding: brandingSchema.optional(),

  social: socialSchema.optional(),

  seo: seoSchema.optional(),
});

export const createCompanySchema = baseCompanySchema;

export const updateCompanySchema = baseCompanySchema.partial();

export const companyIdSchema = z.string().trim().min(1).max(150);
