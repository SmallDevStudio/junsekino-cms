import { z } from "zod";

import { AWARD_STATUSES } from "@/constants/award";

const localizedString = z.object({
  th: z.string().default(""),

  en: z.string().default(""),
});

const nullableString = z.union([z.string(), z.null()]);

const imageSchema = z.object({
  mediaId: z.string().min(1),

  alt: localizedString.optional(),

  caption: localizedString.optional(),
});

const localizedSeo = z.object({
  title: z.string().max(70).default(""),

  description: z.string().max(180).default(""),

  keywords: z.array(z.string().max(100)).default([]),

  ogTitle: z.string().max(100).default(""),

  ogDescription: z.string().max(200).default(""),

  ogImage: nullableString.optional(),
});

const seoSchema = z.object({
  th: localizedSeo,

  en: localizedSeo,

  index: z.boolean().default(true),

  follow: z.boolean().default(true),
});

const awardInfoSchema = z.object({
  name: localizedString,

  organization: localizedString.optional(),

  year: z.union([z.number().int().min(1900).max(2200), z.null()]).default(null),

  category: localizedString.optional(),

  level: localizedString.optional(),
});

const baseAwardSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(150)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid award slug."),

  title: localizedString,

  projectId: z.union([z.string().min(1), z.null()]).default(null),

  awardInfo: awardInfoSchema,

  excerpt: localizedString.optional(),

  content: localizedString.optional(),

  featuredImage: z.union([imageSchema, z.null()]).optional(),

  gallery: z.array(imageSchema).default([]),

  featured: z.boolean().default(false),

  status: z.enum(AWARD_STATUSES).default("draft"),

  scheduledAt: z.union([z.string().datetime(), z.null()]).optional(),

  seo: seoSchema.optional(),
});

export const createAwardSchema = baseAwardSchema;

export const updateAwardSchema = baseAwardSchema.partial();

export const awardIdSchema = z.string().trim().min(1).max(200);

export const publishAwardSchema = z.object({
  scheduledAt: z.union([z.string().datetime(), z.null()]).optional(),
});
