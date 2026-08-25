import { z } from "zod";

import {
  POPUP_ACTION_TYPES,
  POPUP_FREQUENCIES,
  POPUP_STATUSES,
  POPUP_TRIGGERS,
  POPUP_TYPES,
} from "@/constants/popup";

const localizedSchema = z.object({
  th: z.string().max(10000).default(""),

  en: z.string().max(10000).default(""),
});

const popupContentSchema = z.object({
  title: localizedSchema.optional(),

  subtitle: localizedSchema.optional(),

  body: localizedSchema.optional(),

  imageMediaId: z.string().max(200).nullable().optional(),
});

const popupActionSchema = z.object({
  type: z.enum(POPUP_ACTION_TYPES).default("none"),

  label: localizedSchema.optional(),

  url: z.string().max(2000).nullable().optional(),

  formId: z.string().max(200).nullable().optional(),

  newTab: z.boolean().default(false),
});

const popupTargetingSchema = z.object({
  pages: z.array(z.string().max(1000)).default(["*"]),

  languages: z.array(z.enum(["th", "en"])).default(["th", "en"]),
});

const popupBehaviorSchema = z.object({
  trigger: z.enum(POPUP_TRIGGERS).default("immediate"),

  delaySeconds: z.number().int().min(0).max(300).default(0),

  scrollPercent: z.number().int().min(1).max(100).default(50),

  frequency: z.enum(POPUP_FREQUENCIES).default("once_per_session"),

  closeOnBackdrop: z.boolean().default(true),

  showCloseButton: z.boolean().default(true),
});

const popupScheduleSchema = z.object({
  startAt: z.string().datetime().nullable().optional(),

  endAt: z.string().datetime().nullable().optional(),
});

const basePopupSchema = z.object({
  name: z.string().trim().min(1).max(200),

  type: z.enum(POPUP_TYPES),

  content: popupContentSchema,

  action: popupActionSchema.optional(),

  targeting: popupTargetingSchema.optional(),

  behavior: popupBehaviorSchema.optional(),

  schedule: popupScheduleSchema.optional(),

  priority: z.number().int().min(0).max(1000).default(100),

  status: z.enum(POPUP_STATUSES).default("draft"),
});

export const createPopupSchema = basePopupSchema;

export const updatePopupSchema = basePopupSchema.partial();

export const popupIdSchema = z.string().trim().min(1).max(200);
