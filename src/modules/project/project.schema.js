import { z } from "zod";

import { PROJECT_STATUSES } from "@/constants/project";

const nullableStringSchema = z.union([z.string(), z.null()]);

const localizedStringSchema = z.object({
  th: z.string().default(""),

  en: z.string().default(""),
});

/*
 * =========================================================
 * RICH TEXT
 * =========================================================
 *
 * Project legacy records use plain
 * strings.
 *
 * New editor records use TipTap JSON.
 *
 * Both remain valid during transition.
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
 * CREDIT
 * =========================================================
 */

const localizedCreditSchema = z.object({
  th: z.string().trim().max(250).default(""),

  en: z.string().trim().max(250).default(""),
});

const projectCreditsSchema = z.object({
  architecture: z.array(localizedCreditSchema).default([]),

  interior: z.array(localizedCreditSchema).default([]),

  landscape: z.array(localizedCreditSchema).default([]),

  consultant: z.array(localizedCreditSchema).default([]),
});

/*
 * =========================================================
 * PROJECT INFORMATION
 * =========================================================
 */

const areaSchema = z.object({
  value: z.union([z.number().nonnegative(), z.null()]).default(null),

  unit: z.enum(["sqm", "sqft"]).default("sqm"),
});

const projectInfoSchema = z.object({
  location: localizedStringSchema.optional(),

  designYear: z
    .union([z.number().int().min(1900).max(2200), z.null()])
    .default(null),

  completionYear: z
    .union([z.number().int().min(1900).max(2200), z.null()])
    .default(null),

  area: areaSchema.optional(),

  client: localizedStringSchema.optional(),

  credits: projectCreditsSchema.optional(),
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
 * IMAGE
 * =========================================================
 */

const projectImageSchema = z.object({
  mediaId: z.string().min(1),

  alt: localizedStringSchema.optional(),

  caption: localizedStringSchema.optional(),
});

/*
 * =========================================================
 * PROJECT
 * =========================================================
 */

const baseProjectSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(150)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid project slug."),

  title: localizedStringSchema,

  excerpt: localizedStringSchema.optional(),

  /*
   * Legacy String + TipTap JSON
   */
  content: localizedRichTextSchema.optional(),

  categoryId: z.union([z.string().min(1), z.null()]).default(null),

  subCategoryId: z.union([z.string().min(1), z.null()]).default(null),

  projectInfo: projectInfoSchema.optional(),

  tags: z.array(z.string().trim().min(1).max(100)).default([]),

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
