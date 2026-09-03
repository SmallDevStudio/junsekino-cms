import { z } from "zod";

import {
  PUBLIC_CONTENT_STATUSES,
  PUBLIC_CONTENT_TYPES,
  PUBLIC_PROVIDERS,
} from "@/constants/public-content";

/*
 * =========================================================
 * COMMON
 * =========================================================
 */

const localizedStringSchema = z.object({
  th: z.string().default(""),

  en: z.string().default(""),
});

const nullableStringSchema = z.union([z.string(), z.null()]);

/*
 * =========================================================
 * RICH TEXT
 *
 * Legacy records:
 * string
 *
 * New records:
 * TipTap JSON document
 * =========================================================
 */

const tiptapDocumentSchema = z
  .object({
    type: z.literal("doc"),

    content: z.array(z.unknown()).optional(),
  })
  .passthrough();

const richTextValueSchema = z.union([z.string(), tiptapDocumentSchema]);

const localizedRichTextSchema = z.object({
  th: richTextValueSchema.default(""),

  en: richTextValueSchema.default(""),
});

/*
 * =========================================================
 * IMAGE
 * =========================================================
 */

const imageSchema = z.object({
  mediaId: z.string().min(1),

  alt: localizedStringSchema.optional(),

  caption: localizedStringSchema.optional(),
});

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

  ogImage: nullableStringSchema.optional(),
});

const seoSchema = z.object({
  th: localizedSeoSchema,

  en: localizedSeoSchema,

  index: z.boolean().default(true),

  follow: z.boolean().default(true),
});

/*
 * =========================================================
 * EXTERNAL METADATA
 * =========================================================
 */

const externalStatisticsSchema = z.object({
  viewCount: z
    .union([z.number().nonnegative(), z.string(), z.null()])
    .optional(),

  likeCount: z
    .union([z.number().nonnegative(), z.string(), z.null()])
    .optional(),

  commentCount: z
    .union([z.number().nonnegative(), z.string(), z.null()])
    .optional(),

  fetchedAt: z.union([z.string(), z.null()]).optional(),
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

  statistics: z.union([externalStatisticsSchema, z.null()]).optional(),
});

const sourceSchema = z.object({
  provider: z.union([z.enum(PUBLIC_PROVIDERS), z.null()]).default(null),

  sourceUrl: z.union([z.string().url(), z.literal(""), z.null()]).default(null),

  externalId: z.union([z.string(), z.null()]).default(null),

  metadata: z.union([externalMetadataSchema, z.null()]).optional(),
});

/*
 * =========================================================
 * PUBLIC CONTENT
 * =========================================================
 */

const baseSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(150)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,

      "Invalid public content slug.",
    ),

  contentType: z.enum(PUBLIC_CONTENT_TYPES),

  title: localizedStringSchema,

  excerpt: localizedStringSchema.optional(),

  /*
   * Supports legacy string and
   * new TipTap JSON content.
   */
  content: localizedRichTextSchema.optional(),

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
