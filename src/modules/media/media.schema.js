import { z } from "zod";

import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_MEDIA_FILE_SIZE,
  MEDIA_USAGE,
} from "@/constants/media";

const localizedStringSchema = z.object({
  th: z.string().max(500).default(""),

  en: z.string().max(500).default(""),
});

export const createMediaUploadSchema = z.object({
  fileName: z.string().trim().min(1).max(255),

  mimeType: z.enum(ALLOWED_IMAGE_MIME_TYPES),

  size: z
    .number()
    .int()
    .positive()
    .max(MAX_MEDIA_FILE_SIZE, "File is too large."),

  usage: z.enum(Object.values(MEDIA_USAGE)).default(MEDIA_USAGE.GENERAL),

  alt: localizedStringSchema.optional(),

  caption: localizedStringSchema.optional(),
});

export const finalizeMediaSchema = z.object({});

export const updateMediaSchema = z.object({
  alt: localizedStringSchema.optional(),

  caption: localizedStringSchema.optional(),

  usage: z.enum(Object.values(MEDIA_USAGE)).optional(),
});

export const mediaIdSchema = z.string().trim().min(1).max(200);
