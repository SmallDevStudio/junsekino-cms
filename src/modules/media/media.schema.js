import { z } from "zod";

import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_MEDIA_FILE_SIZE,
  MEDIA_USAGE,
} from "@/constants/media";

/*
 * =========================================================
 * LOCALIZED STRING
 * =========================================================
 */

const localizedShortStringSchema = z.object({
  th: z.string().max(500).default(""),
  en: z.string().max(500).default(""),
});

const localizedLongStringSchema = z.object({
  th: z.string().max(5000).default(""),
  en: z.string().max(5000).default(""),
});

/*
 * =========================================================
 * TAGS
 * =========================================================
 */

const mediaTagsSchema = z
  .array(z.string().trim().min(1).max(80))
  .max(50)
  .default([]);

/*
 * =========================================================
 * CREATE UPLOAD
 * =========================================================
 */

export const createMediaUploadSchema = z.object({
  fileName: z.string().trim().min(1).max(255),

  mimeType: z.enum(ALLOWED_IMAGE_MIME_TYPES),

  size: z
    .number()
    .int()
    .positive()
    .max(MAX_MEDIA_FILE_SIZE, "File is too large."),

  usage: z.enum(Object.values(MEDIA_USAGE)).default(MEDIA_USAGE.GENERAL),

  title: localizedShortStringSchema.optional(),

  alt: localizedShortStringSchema.optional(),

  description: localizedLongStringSchema.optional(),

  caption: localizedLongStringSchema.optional(),

  credit: localizedShortStringSchema.optional(),

  tags: mediaTagsSchema.optional(),
});

/*
 * =========================================================
 * IMPORT URL
 * =========================================================
 */

export const importMediaUrlSchema = z.object({
  url: z.string().trim().url("Invalid image URL.").max(4000),

  usage: z.enum(Object.values(MEDIA_USAGE)).default(MEDIA_USAGE.GENERAL),

  title: localizedShortStringSchema.optional(),

  alt: localizedShortStringSchema.optional(),

  description: localizedLongStringSchema.optional(),

  caption: localizedLongStringSchema.optional(),

  credit: localizedShortStringSchema.optional(),

  tags: mediaTagsSchema.optional(),
});

export const finalizeMediaSchema = z.object({});

/*
 * =========================================================
 * UPDATE MEDIA METADATA
 * =========================================================
 */

export const updateMediaSchema = z.object({
  title: localizedShortStringSchema.optional(),

  alt: localizedShortStringSchema.optional(),

  description: localizedLongStringSchema.optional(),

  caption: localizedLongStringSchema.optional(),

  credit: localizedShortStringSchema.optional(),

  tags: mediaTagsSchema.optional(),

  usage: z.enum(Object.values(MEDIA_USAGE)).optional(),
});

export const mediaIdSchema = z.string().trim().min(1).max(200);
