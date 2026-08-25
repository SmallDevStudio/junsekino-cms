import { z } from "zod";

import { TAG_MAX_PER_CONTENT, TAG_STATUSES } from "@/constants/tag";

const localizedTagNameSchema = z.object({
  th: z.string().trim().max(100).default(""),

  en: z.string().trim().max(100).default(""),
});

export const createTagSchema = z.object({
  name: localizedTagNameSchema,

  aliases: z.array(z.string().trim().min(1).max(100)).max(30).default([]),
});

export const updateTagSchema = z.object({
  name: localizedTagNameSchema.partial().optional(),

  aliases: z.array(z.string().trim().min(1).max(100)).max(30).optional(),

  status: z.enum(TAG_STATUSES).optional(),
});

export const tagIdSchema = z.string().trim().min(1).max(200);

export const contentTagIdsSchema = z
  .array(tagIdSchema)
  .max(TAG_MAX_PER_CONTENT)
  .default([]);
