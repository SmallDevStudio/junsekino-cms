import { z } from "zod";

import {
  ABOUT_BLOCK_TYPE,
  ABOUT_IMAGE_FIT,
  ABOUT_IMAGE_POSITION,
  ABOUT_IMAGE_RATIO,
  ABOUT_MAX_BLOCKS,
  ABOUT_SPACING,
  ABOUT_TEXT_ALIGN,
  ABOUT_VERTICAL_ALIGN,
} from "@/constants/about-page";

/*
 * =========================================================
 * LOCALIZED
 * =========================================================
 */

const localizedTextSchema = z.object({
  th: z.string().max(5000).default(""),

  en: z.string().max(5000).default(""),
});

/*
 * =========================================================
 * TIPTAP DOCUMENT
 * =========================================================
 *
 * We store TipTap JSON instead of raw HTML.
 *
 * Full TipTap node validation happens at
 * Editor / Renderer level later.
 *
 * At API level we validate the document
 * root so malformed arbitrary primitives
 * cannot be stored as rich content.
 * =========================================================
 */

export const tiptapDocumentSchema = z
  .object({
    type: z.literal("doc"),

    content: z.array(z.unknown()).optional(),
  })
  .passthrough();

const localizedRichContentSchema = z.object({
  th: tiptapDocumentSchema.nullable().default(null),

  en: tiptapDocumentSchema.nullable().default(null),
});

/*
 * =========================================================
 * MEDIA
 * =========================================================
 */

export const aboutMediaSchema = z.object({
  mediaId: z.string().trim().min(1).max(200),

  alt: localizedTextSchema.optional(),
});

/*
 * =========================================================
 * COMMON BLOCK SETTINGS
 * =========================================================
 */

const blockSettingsSchema = z.object({
  spacingTop: z
    .enum(Object.values(ABOUT_SPACING))
    .default(ABOUT_SPACING.MEDIUM),

  spacingBottom: z
    .enum(Object.values(ABOUT_SPACING))
    .default(ABOUT_SPACING.MEDIUM),

  textAlign: z
    .enum(Object.values(ABOUT_TEXT_ALIGN))
    .default(ABOUT_TEXT_ALIGN.LEFT),

  verticalAlign: z
    .enum(Object.values(ABOUT_VERTICAL_ALIGN))
    .default(ABOUT_VERTICAL_ALIGN.CENTER),
});

/*
 * =========================================================
 * RICH TEXT BLOCK
 * =========================================================
 */

const richTextBlockSchema = z.object({
  id: z.string().trim().min(1).max(100),

  type: z.literal(ABOUT_BLOCK_TYPE.RICH_TEXT),

  content: localizedRichContentSchema,

  settings: blockSettingsSchema.optional(),
});

/*
 * =========================================================
 * IMAGE + TEXT BLOCK
 * =========================================================
 */

const imageTextBlockSchema = z.object({
  id: z.string().trim().min(1).max(100),

  type: z.literal(ABOUT_BLOCK_TYPE.IMAGE_TEXT),

  image: aboutMediaSchema,

  imagePosition: z
    .enum(Object.values(ABOUT_IMAGE_POSITION))
    .default(ABOUT_IMAGE_POSITION.LEFT),

  imageRatio: z
    .enum(Object.values(ABOUT_IMAGE_RATIO))
    .default(ABOUT_IMAGE_RATIO.STANDARD),

  imageFit: z
    .enum(Object.values(ABOUT_IMAGE_FIT))
    .default(ABOUT_IMAGE_FIT.COVER),

  content: localizedRichContentSchema,

  settings: blockSettingsSchema.optional(),
});

/*
 * =========================================================
 * IMAGE BLOCK
 * =========================================================
 */

const imageBlockSchema = z.object({
  id: z.string().trim().min(1).max(100),

  type: z.literal(ABOUT_BLOCK_TYPE.IMAGE),

  image: aboutMediaSchema,

  imageRatio: z
    .enum(Object.values(ABOUT_IMAGE_RATIO))
    .default(ABOUT_IMAGE_RATIO.AUTO),

  imageFit: z
    .enum(Object.values(ABOUT_IMAGE_FIT))
    .default(ABOUT_IMAGE_FIT.COVER),

  settings: blockSettingsSchema.optional(),
});

/*
 * =========================================================
 * SPACER
 * =========================================================
 */

const spacerBlockSchema = z.object({
  id: z.string().trim().min(1).max(100),

  type: z.literal(ABOUT_BLOCK_TYPE.SPACER),

  size: z.enum(Object.values(ABOUT_SPACING)).default(ABOUT_SPACING.MEDIUM),
});

/*
 * =========================================================
 * BLOCK UNION
 * =========================================================
 */

export const aboutBlockSchema = z.discriminatedUnion("type", [
  richTextBlockSchema,
  imageTextBlockSchema,
  imageBlockSchema,
  spacerBlockSchema,
]);

/*
 * =========================================================
 * ABOUT PAGE
 * =========================================================
 */

export const createAboutPageSchema = z.object({
  name: localizedTextSchema,

  cover: aboutMediaSchema.nullable(),

  blocks: z.array(aboutBlockSchema).max(ABOUT_MAX_BLOCKS).default([]),

  seo: z
    .object({
      title: localizedTextSchema.optional(),

      description: localizedTextSchema.optional(),
    })
    .optional(),
});

export const updateAboutPageSchema = createAboutPageSchema.partial();

export const aboutPageIdSchema = z.string().trim().min(1).max(200);
