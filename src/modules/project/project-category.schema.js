import { z } from "zod";

const localizedNameSchema = z.object({
  th: z.string().trim().max(150).default(""),

  en: z.string().trim().max(150).default(""),
});

const baseSchema = z.object({
  name: localizedNameSchema,

  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid category slug."),

  parentId: z.union([z.string().min(1), z.null()]).default(null),

  description: z
    .object({
      th: z.string().default(""),

      en: z.string().default(""),
    })
    .optional(),

  sortOrder: z.number().int().min(0).max(9999).default(0),

  status: z.enum(["active", "inactive"]).default("active"),
});

export const createProjectCategorySchema = baseSchema;

export const updateProjectCategorySchema = baseSchema.partial();

export const projectCategoryIdSchema = z.string().trim().min(1).max(200);
