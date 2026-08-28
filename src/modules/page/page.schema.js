import { z } from "zod";

import { PAGE_STATUSES, PAGE_TYPES } from "@/constants/page";

import {
  localizedRichTextSchema,
  localizedStringSchema,
  pageBlocksSchema,
  pageBuilderImageSchema,
} from "./page-block.schema";

/*
 * =========================================================
 * COMMON
 * =========================================================
 */

const nullableString = z.union([z.string(), z.null()]).optional();

/*
 * =========================================================
 * SEO
 * =========================================================
 */

const localizedSeo = z.object({
  title: z.string().max(70).default(""),

  description: z.string().max(180).default(""),

  keywords: z.array(z.string().max(100)).default([]),

  ogTitle: z.string().max(100).default(""),

  ogDescription: z.string().max(200).default(""),

  ogImage: nullableString,
});

const seoSchema = z.object({
  en: localizedSeo,

  th: localizedSeo,

  index: z.boolean().default(true),

  follow: z.boolean().default(true),
});

/*
 * =========================================================
 * HERO
 * =========================================================
 */

const heroSchema = z.object({
  title: localizedStringSchema.optional(),

  subtitle: localizedStringSchema.optional(),

  media: z.union([pageBuilderImageSchema, z.null()]).optional(),

  enabled: z.boolean().default(true),
});

/*
 * =========================================================
 * NAVIGATION
 * =========================================================
 *
 * We retain this structure for compatibility.
 *
 * Later Navigation Manager will become the
 * source of truth for menu placement.
 * =========================================================
 */

const navigationSchema = z.object({
  showInNavigation: z.boolean().default(false),

  label: localizedStringSchema.optional(),

  sortOrder: z.number().int().min(0).max(9999).default(0),
});

/*
 * =========================================================
 * PAGE
 * =========================================================
 */

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

  /*
   * English remains primary.
   *
   * Thai may remain empty when disabled
   * at Company Localization level.
   */
  title: z.object({
    en: z.string().trim().max(250).default(""),

    th: z.string().trim().max(250).default(""),
  }),

  excerpt: localizedStringSchema.optional(),

  /*
   * Legacy single page body.
   *
   * Keep this for migration compatibility.
   *
   * New About / Custom Pages should prefer
   * sections.
   */
  content: localizedRichTextSchema.optional(),

  hero: heroSchema.optional(),

  /*
   * Shared Page Builder blocks.
   */
  sections: pageBlocksSchema,

  navigation: navigationSchema.optional(),

  featuredImage: z.union([pageBuilderImageSchema, z.null()]).optional(),

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
