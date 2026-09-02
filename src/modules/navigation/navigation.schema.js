import { z } from "zod";

const localizedLabelSchema = z.object({
  th: z.string().trim().max(80).default(""),

  en: z.string().trim().min(1).max(80),
});

const navigationItemSchema = z
  .object({
    key: z
      .string()
      .trim()
      .toLowerCase()
      .min(1)
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),

    type: z.enum(["system", "page", "module", "external"]),

    label: localizedLabelSchema,

    path: z.string().trim().max(160).default(""),

    url: z
      .union([z.string().trim().url().max(2048), z.literal("")])
      .default(""),

    enabled: z.boolean().default(true),

    openInNewTab: z.boolean().default(false),

    sortOrder: z.number().int().min(0).max(10000).default(0),
  })
  .strict();

export const updateNavigationSchema = z
  .object({
    items: z.array(navigationItemSchema).min(6).max(30),
  })
  .strict();
