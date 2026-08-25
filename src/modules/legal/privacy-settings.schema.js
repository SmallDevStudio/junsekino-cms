import { z } from "zod";

const localizedTextSchema = z.object({
  th: z.string().max(5000),
  en: z.string().max(5000),
});

const bannerLanguageSchema = z.object({
  title: z.string().max(300),

  description: z.string().max(3000),

  acceptAll: z.string().max(100),

  rejectOptional: z.string().max(100),

  preferences: z.string().max(100),

  savePreferences: z.string().max(100),

  privacyLink: z.string().max(100),

  cookieLink: z.string().max(100),
});

export const updatePrivacySettingsSchema = z.object({
  showCookieBanner: z.boolean().optional(),

  allowRejectOptional: z.boolean().optional(),

  showPreferences: z.boolean().optional(),

  cookieBanner: z
    .object({
      th: bannerLanguageSchema,

      en: bannerLanguageSchema,
    })
    .optional(),

  privacyContact: z
    .object({
      companyName: localizedTextSchema.optional(),

      address: localizedTextSchema.optional(),

      email: z.string().email().or(z.literal("")).optional(),

      phone: z.string().max(100).optional(),

      dpoEmail: z.string().email().or(z.literal("")).optional(),
    })
    .optional(),
});
