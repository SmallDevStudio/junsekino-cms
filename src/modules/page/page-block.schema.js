import { z } from "zod";

/*
 * =========================================================
 * RICH TEXT
 * =========================================================
 *
 * Backward compatible:
 *
 * Legacy:
 * "Plain text / markdown"
 *
 * New:
 * {
 *   type: "doc",
 *   content: [...]
 * }
 * =========================================================
 */

export const tiptapDocumentSchema = z
  .object({
    type: z.literal("doc"),

    content: z.array(z.unknown()).optional(),
  })
  .passthrough();

export const richTextValueSchema = z.union([z.string(), tiptapDocumentSchema]);

export const localizedRichTextSchema = z.object({
  en: richTextValueSchema.default(""),

  th: richTextValueSchema.default(""),
});

/*
 * =========================================================
 * LOCALIZED STRING
 * =========================================================
 */

export const localizedStringSchema = z.object({
  en: z.string().default(""),

  th: z.string().default(""),
});

/*
 * =========================================================
 * IMAGE
 * =========================================================
 */

export const pageBuilderImageSchema = z.object({
  mediaId: z.string().trim().min(1),

  alt: localizedStringSchema.optional(),

  caption: localizedStringSchema.optional(),

  /*
   * Future shared crop / focal point.
   *
   * We add the schema now so we do not
   * need to redesign stored blocks later.
   */
  presentation: z
    .object({
      objectFit: z.enum(["cover", "contain"]).default("cover"),

      aspectRatio: z.string().trim().max(30).default("auto"),

      focalPoint: z
        .object({
          x: z.number().min(0).max(1).default(0.5),

          y: z.number().min(0).max(1).default(0.5),
        })
        .default({
          x: 0.5,
          y: 0.5,
        }),

      zoom: z.number().min(1).max(5).default(1),
    })
    .optional(),
});

/*
 * =========================================================
 * BLOCK BASE
 * =========================================================
 */

const blockBaseSchema = z.object({
  id: z.string().trim().min(1).max(100).optional(),

  enabled: z.boolean().default(true),

  sortOrder: z.number().int().min(0).max(9999).default(0),
});

/*
 * =========================================================
 * RICH TEXT BLOCK
 * =========================================================
 */

export const richTextBlockSchema = blockBaseSchema.extend({
  type: z.literal("richText"),

  data: z.object({
    content: localizedRichTextSchema,

    width: z.enum(["narrow", "medium", "wide", "full"]).default("medium"),

    textAlign: z.enum(["left", "center", "right"]).default("left"),
  }),
});

/*
 * =========================================================
 * IMAGE BLOCK
 * =========================================================
 */

export const imageBlockSchema = blockBaseSchema.extend({
  type: z.literal("image"),

  data: z.object({
    image: pageBuilderImageSchema,

    width: z.enum(["medium", "wide", "full"]).default("wide"),

    showCaption: z.boolean().default(false),
  }),
});

/*
 * =========================================================
 * IMAGE + TEXT
 * =========================================================
 */

export const imageTextBlockSchema = blockBaseSchema.extend({
  type: z.literal("imageText"),

  data: z.object({
    image: pageBuilderImageSchema,

    content: localizedRichTextSchema,

    imagePosition: z.enum(["left", "right"]).default("left"),

    imageWidth: z.enum(["40", "50", "60"]).default("50"),

    verticalAlign: z.enum(["start", "center", "end"]).default("center"),
  }),
});

/*
 * =========================================================
 * GALLERY
 * =========================================================
 */

export const galleryBlockSchema = blockBaseSchema.extend({
  type: z.literal("gallery"),

  data: z.object({
    images: z.array(pageBuilderImageSchema).default([]),

    columns: z.number().int().min(1).max(4).default(3),

    gap: z.enum(["small", "medium", "large"]).default("medium"),
  }),
});

/*
 * =========================================================
 * SPACER
 * =========================================================
 */

export const spacerBlockSchema = blockBaseSchema.extend({
  type: z.literal("spacer"),

  data: z.object({
    size: z.enum(["small", "medium", "large", "xlarge"]).default("medium"),
  }),
});

/*
 * =========================================================
 * PAGE BLOCK
 * =========================================================
 */

export const pageBlockSchema = z.discriminatedUnion("type", [
  richTextBlockSchema,
  imageBlockSchema,
  imageTextBlockSchema,
  galleryBlockSchema,
  spacerBlockSchema,
]);

export const pageBlocksSchema = z.array(pageBlockSchema).default([]);
