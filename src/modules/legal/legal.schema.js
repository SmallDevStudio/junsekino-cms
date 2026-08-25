import { z } from "zod";

import { LEGAL_DOCUMENT_TYPES } from "@/constants/legal";

const localizedStringSchema = z.object({
  th: z.string().default(""),

  en: z.string().default(""),
});

export const legalTypeSchema = z.enum(LEGAL_DOCUMENT_TYPES);

export const legalVersionIdSchema = z.string().trim().min(1).max(200);

export const createLegalVersionSchema = z.object({
  title: localizedStringSchema,

  content: localizedStringSchema,

  changeSummary: localizedStringSchema.optional(),

  effectiveAt: z.union([z.string().datetime(), z.null()]).optional(),

  requireReConsent: z.boolean().default(false),
});

export const publishLegalVersionSchema = z.object({
  versionId: legalVersionIdSchema,
});

export const consentSchema = z.object({
  necessary: z.literal(true),

  analytics: z.boolean(),

  functional: z.boolean(),

  marketing: z.boolean(),
});

export const saveConsentSchema = z.object({
  consent: consentSchema,

  source: z
    .enum(["cookie_banner", "cookie_preferences", "embed_consent"])
    .default("cookie_banner"),
});
