import { z } from "zod";

import { HOME_SLIDESHOW_MAX_SLIDES } from "@/constants/home-slideshow";

const localizedSchema = z.object({
  th: z.string().max(5000).default(""),

  en: z.string().max(5000).default(""),
});

const slideLinkSchema = z.object({
  enabled: z.boolean().default(false),

  url: z.string().max(2000).nullable().optional(),

  newTab: z.boolean().default(false),
});

export const homeSlideSchema = z.object({
  id: z.string().trim().min(1).max(100),

  mediaId: z.string().trim().min(1).max(200),

  sortOrder: z.number().int().min(0),

  alt: localizedSchema.optional(),

  caption: localizedSchema.optional(),

  link: slideLinkSchema.optional(),

  enabled: z.boolean().default(true),
});

export const createHomeSlideshowSchema = z.object({
  name: localizedSchema,

  description: localizedSchema.optional(),

  slides: z.array(homeSlideSchema).max(HOME_SLIDESHOW_MAX_SLIDES).default([]),
});

export const updateHomeSlideshowSchema = createHomeSlideshowSchema.partial();

export const homeSlideshowIdSchema = z.string().trim().min(1).max(200);
