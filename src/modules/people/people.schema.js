import { z } from "zod";

import { PEOPLE_STATUSES, PEOPLE_TYPES } from "@/constants/people";

const nullableString = z.union([z.string(), z.null()]).optional();

const nullableUrl = z
  .union([z.string().url(), z.literal(""), z.null()])
  .optional();

const localizedString = z.object({
  th: z.string().default(""),

  en: z.string().default(""),
});

const localizedSeo = z.object({
  title: z.string().max(70).default(""),

  description: z.string().max(180).default(""),

  keywords: z.array(z.string().max(100)).default([]),

  ogTitle: z.string().max(100).default(""),

  ogDescription: z.string().max(200).default(""),

  ogImage: nullableString,
});

const seoSchema = z.object({
  th: localizedSeo,
  en: localizedSeo,

  index: z.boolean().default(true),

  follow: z.boolean().default(true),
});

const profileImageSchema = z.object({
  mediaId: z.string().min(1),

  alt: localizedString.optional(),

  caption: localizedString.optional(),
});

const socialSchema = z.object({
  website: nullableUrl,

  linkedin: nullableUrl,

  instagram: nullableUrl,

  facebook: nullableUrl,

  x: nullableUrl,
});

const basePeopleSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(150)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain lowercase letters, numbers and hyphens only.",
    ),

  name: z.object({
    th: z.string().trim().max(200).default(""),

    en: z.string().trim().max(200).default(""),
  }),

  position: localizedString.optional(),

  biography: localizedString.optional(),

  peopleType: z.enum(PEOPLE_TYPES).default("staff"),

  email: z.union([z.string().email(), z.literal(""), z.null()]).optional(),

  phone: z.union([z.string(), z.null()]).optional(),

  profileImage: z.union([profileImageSchema, z.null()]).optional(),

  social: socialSchema.optional(),

  sortOrder: z.number().int().min(0).max(9999).default(0),

  featured: z.boolean().default(false),

  status: z.enum(PEOPLE_STATUSES).default("draft"),

  seo: seoSchema.optional(),
});

export const createPeopleSchema = basePeopleSchema;

export const updatePeopleSchema = basePeopleSchema.partial();

export const peopleIdSchema = z.string().trim().min(1).max(200);
