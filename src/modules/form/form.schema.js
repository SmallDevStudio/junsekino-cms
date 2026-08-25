import { z } from "zod";

import {
  FORM_FIELD_TYPES,
  FORM_MAX_FIELDS,
  FORM_MAX_OPTIONS,
  FORM_STATUSES,
  FORM_TYPES,
} from "@/constants/form";

const localizedSchema = z.object({
  th: z.string().max(5000).default(""),

  en: z.string().max(5000).default(""),
});

const fieldOptionSchema = z.object({
  value: z.string().trim().min(1).max(200),

  label: localizedSchema,
});

const validationSchema = z.object({
  minLength: z.number().int().nonnegative().nullable().optional(),

  maxLength: z.number().int().positive().nullable().optional(),

  min: z.number().nullable().optional(),

  max: z.number().nullable().optional(),

  pattern: z.string().max(500).nullable().optional(),

  maxFileSize: z.number().int().positive().nullable().optional(),

  allowedMimeTypes: z.array(z.string().max(200)).default([]),
});

const consentConfigSchema = z.object({
  legalDocument: z.enum(["privacy", "cookies", "terms"]).default("privacy"),

  required: z.boolean().default(true),
});

export const formFieldSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/, "Invalid field ID."),

  type: z.enum(FORM_FIELD_TYPES),

  label: localizedSchema,

  placeholder: localizedSchema.optional(),

  helpText: localizedSchema.optional(),

  required: z.boolean().default(false),

  sortOrder: z.number().int().nonnegative(),

  options: z.array(fieldOptionSchema).max(FORM_MAX_OPTIONS).default([]),

  validation: validationSchema.optional(),

  consent: consentConfigSchema.optional(),

  width: z.enum(["full", "half", "third"]).default("full"),

  enabled: z.boolean().default(true),
});

const formSettingsSchema = z.object({
  submitLabel: localizedSchema.default({
    th: "ส่งข้อมูล",

    en: "Submit",
  }),

  successTitle: localizedSchema.default({
    th: "ส่งข้อมูลเรียบร้อยแล้ว",

    en: "Submission received",
  }),

  successMessage: localizedSchema.default({
    th: "ขอบคุณสำหรับข้อมูล เราจะติดต่อกลับตามความเหมาะสม",

    en: "Thank you. We have received your submission.",
  }),

  allowMultipleSubmissions: z.boolean().default(true),

  requirePrivacyConsent: z.boolean().default(true),

  notifyEmployees: z.boolean().default(true),

  sendEmailNotification: z.boolean().default(false),

  notificationEmails: z.array(z.string().email()).default([]),
});

const baseFormSchema = z.object({
  name: localizedSchema,

  slug: z
    .string()
    .trim()
    .min(2)
    .max(150)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid form slug."),

  type: z.enum(FORM_TYPES),

  description: localizedSchema.optional(),

  fields: z.array(formFieldSchema).max(FORM_MAX_FIELDS).default([]),

  settings: formSettingsSchema.optional(),

  status: z.enum(FORM_STATUSES).default("draft"),
});

export const createFormSchema = baseFormSchema;

export const updateFormSchema = baseFormSchema.partial();

export const formIdSchema = z.string().trim().min(1).max(200);

export const formSlugSchema = z
  .string()
  .trim()
  .min(2)
  .max(150)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
