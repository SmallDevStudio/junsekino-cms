import { z } from "zod";

import { PROJECT_STATUSES } from "@/constants/project";

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

const projectImageSchema = z.object({
  mediaId: z.string().min(1),

  alt: localizedString.optional(),

  caption: localizedString.optional(),
});

const baseProjectSchema = z.object({
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
    th: z.string().trim().max(200).default(""),

    en: z.string().trim().max(200).default(""),
  }),

  excerpt: localizedString.optional(),

  content: localizedString.optional(),

  location: localizedString.optional(),

  client: z.string().trim().max(200).default(""),

  completionYear: z
    .union([z.number().int().min(1900).max(2200), z.null()])
    .optional(),

  projectType: z.string().trim().max(100).default(""),

  categories: z.array(z.string()).default([]),

  tags: z.array(z.string().trim().min(1).max(100)).default([]),

  architects: z.array(z.string()).default([]),

  featuredImage: z.union([projectImageSchema, z.null()]).optional(),

  gallery: z.array(projectImageSchema).default([]),

  featured: z.boolean().default(false),

  status: z.enum(PROJECT_STATUSES).default("draft"),

  scheduledAt: z.union([z.string().datetime(), z.null()]).optional(),

  seo: seoSchema.optional(),
});

export const createProjectSchema = baseProjectSchema;

export const updateProjectSchema = baseProjectSchema.partial();

export const projectIdSchema = z.string().trim().min(1).max(200);

export const publishProjectSchema = z.object({
  scheduledAt: z.union([z.string().datetime(), z.null()]).optional(),
});
