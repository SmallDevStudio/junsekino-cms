import { z } from "zod";

import { PAGE_STATUSES, PAGE_TYPES } from "@/constants/page";

const nullableString = z.union([z.string(), z.null()]).optional();

const localizedString = z.object({
  th: z.string().default(""),

  en: z.string().default(""),
});

const localizedSeo = z.object({
  title: z.string().max(70).default(""),

  description: z.string().max(180).default(""),

  keywords: z.array(z.string().max(100)).default([]),

  ogTitle: z.string().max(100).default(""),

  ogDescription: z.string().max(200).default(""),

  ogImage: nullableString,
});

const seoSchema = z.object({
  th: localizedSeo,

  en: localizedSeo,

  index: z.boolean().default(true),

  follow: z.boolean().default(true),
});

const pageImageSchema = z.object({
  mediaId: z.string().min(1),

  alt: localizedString.optional(),

  caption: localizedString.optional(),
});

const heroSchema = z.object({
  title: localizedString.optional(),

  subtitle: localizedString.optional(),

  media: z.union([pageImageSchema, z.null()]).optional(),

  enabled: z.boolean().default(true),
});

const navigationSchema = z.object({
  showInNavigation: z.boolean().default(false),

  label: localizedString.optional(),

  sortOrder: z.number().int().min(0).max(9999).default(0),
});

const pageSectionSchema = z.object({
  id: z.string().trim().min(1).max(100).optional(),

  type: z.string().trim().min(1).max(100),

  enabled: z.boolean().default(true),

  sortOrder: z.number().int().min(0).max(9999).default(0),

  data: z.record(z.string(), z.unknown()).default({}),
});

const basePageSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(150)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain lowercase letters, numbers and hyphens only.",
    ),

  pageType: z.enum(PAGE_TYPES).default("standard"),

  title: z.object({
    th: z.string().trim().max(250).default(""),

    en: z.string().trim().max(250).default(""),
  }),

  excerpt: localizedString.optional(),

  content: localizedString.optional(),

  hero: heroSchema.optional(),

  sections: z.array(pageSectionSchema).default([]),

  navigation: navigationSchema.optional(),

  featuredImage: z.union([pageImageSchema, z.null()]).optional(),

  status: z.enum(PAGE_STATUSES).default("draft"),

  scheduledAt: z.union([z.string().datetime(), z.null()]).optional(),

  seo: seoSchema.optional(),
});

export const createPageSchema = basePageSchema;

export const updatePageSchema = basePageSchema.partial();

export const pageIdSchema = z.string().trim().min(1).max(200);

export const publishPageSchema = z.object({
  scheduledAt: z.union([z.string().datetime(), z.null()]).optional(),
});
