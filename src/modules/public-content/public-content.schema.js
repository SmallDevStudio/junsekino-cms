import { z } from "zod";

import {
  PUBLIC_CONTENT_STATUSES,
  PUBLIC_CONTENT_TYPES,
  PUBLIC_PROVIDERS,
} from "@/constants/public-content";

const localizedString = z.object({
  th: z.string().default(""),
  en: z.string().default(""),
});

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

  ogImage: z.union([z.string(), z.null()]).optional(),
});

const seoSchema = z.object({
  th: localizedSeo,

  en: localizedSeo,

  index: z.boolean().default(true),

  follow: z.boolean().default(true),
});

const externalMetadataSchema = z.object({
  title: z.string().max(1000).default(""),

  description: z.string().max(10000).default(""),

  authorName: z.string().max(1000).default(""),

  authorUrl: z.union([z.string().url(), z.null()]).default(null),

  thumbnailUrl: z.union([z.string().url(), z.null()]).default(null),

  thumbnailWidth: z
    .union([z.number().int().positive(), z.null()])
    .default(null),

  thumbnailHeight: z
    .union([z.number().int().positive(), z.null()])
    .default(null),

  publishedAt: z.union([z.string(), z.null()]).default(null),

  duration: z.union([z.string(), z.null()]).default(null),
});

const sourceSchema = z.object({
  provider: z.union([z.enum(PUBLIC_PROVIDERS), z.null()]).default(null),

  sourceUrl: z.union([z.string().url(), z.literal(""), z.null()]).default(null),

  externalId: z.union([z.string(), z.null()]).default(null),

  metadata: z.union([externalMetadataSchema, z.null()]).optional(),
});

const baseSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(150)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid public content slug."),

  contentType: z.enum(PUBLIC_CONTENT_TYPES),

  title: localizedString,

  excerpt: localizedString.optional(),

  content: localizedString.optional(),

  source: sourceSchema.optional(),

  featuredImage: z.union([imageSchema, z.null()]).optional(),

  gallery: z.array(imageSchema).default([]),

  tags: z.array(z.string().trim().min(1).max(100)).default([]),

  featured: z.boolean().default(false),

  status: z.enum(PUBLIC_CONTENT_STATUSES).default("draft"),

  scheduledAt: z.union([z.string().datetime(), z.null()]).optional(),

  seo: seoSchema.optional(),
});

export const createPublicContentSchema = baseSchema;

export const updatePublicContentSchema = baseSchema.partial();

export const publicContentIdSchema = z.string().trim().min(1).max(200);

export const publishPublicContentSchema = z.object({
  scheduledAt: z.union([z.string().datetime(), z.null()]).optional(),
});
