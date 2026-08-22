import { z } from "zod";

import { NEWS_STATUSES } from "@/constants/news";

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

const newsImageSchema = z.object({
  mediaId: z.string().min(1),

  alt: localizedString.optional(),

  caption: localizedString.optional(),
});

const baseNewsSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(150)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain lowercase letters, numbers and hyphens only.",
    ),

  title: z.object({
    th: z.string().trim().max(250).default(""),

    en: z.string().trim().max(250).default(""),
  }),

  excerpt: localizedString.optional(),

  content: localizedString.optional(),

  category: z.union([z.string().trim(), z.null()]).optional(),

  tags: z.array(z.string().trim().min(1).max(100)).default([]),

  author: z.union([z.string().trim(), z.null()]).optional(),

  featuredImage: z.union([newsImageSchema, z.null()]).optional(),

  featured: z.boolean().default(false),

  status: z.enum(NEWS_STATUSES).default("draft"),

  scheduledAt: z.union([z.string().datetime(), z.null()]).optional(),

  seo: seoSchema.optional(),
});

export const createNewsSchema = baseNewsSchema;

export const updateNewsSchema = baseNewsSchema.partial();

export const newsIdSchema = z.string().trim().min(1).max(200);

export const publishNewsSchema = z.object({
  scheduledAt: z.union([z.string().datetime(), z.null()]).optional(),
});
