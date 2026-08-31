import { z } from "zod";

const localizedTextSchema = z.object({
  th: z.string().max(500).default(""),

  en: z.string().max(500).default(""),
});

const avatarCropSchema = z
  .record(z.string(), z.unknown())
  .nullable()
  .optional();

export const userAvatarSchema = z
  .object({
    mediaId: z.string().trim().min(1).max(200),

    alt: localizedTextSchema.optional().default({
      th: "",
      en: "",
    }),

    caption: localizedTextSchema.optional().default({
      th: "",
      en: "",
    }),

    crop: avatarCropSchema,
  })
  .nullable();

export const updateOwnProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(150).optional(),

  phone: z.union([z.string().trim().max(50), z.null()]).optional(),

  position: z.union([z.string().trim().max(150), z.null()]).optional(),

  department: z.union([z.string().trim().max(150), z.null()]).optional(),

  employeeCode: z.union([z.string().trim().max(100), z.null()]).optional(),

  bio: z.union([z.string().trim().max(1000), z.null()]).optional(),

  avatar: userAvatarSchema.optional(),
});
