import { z } from "zod";

const localizedSeoSchema = z.object({
  th: z.string().trim().max(500).default(""),

  en: z.string().trim().max(500).default(""),
});

export const seoMetadataSchema = z.object({
  metaTitle: localizedSeoSchema.optional(),

  metaDescription: localizedSeoSchema.optional(),

  ogTitle: localizedSeoSchema.optional(),

  ogDescription: localizedSeoSchema.optional(),

  ogImageMediaId: z.string().trim().max(200).nullable().optional(),

  canonicalUrl: z.string().trim().url().max(2000).nullable().optional(),

  noIndex: z.boolean().default(false),

  noFollow: z.boolean().default(false),
});
