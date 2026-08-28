import { z } from "zod";

export const adminPreferenceSchema = z.object({
  locale: z.enum(["en", "th"]).optional(),

  sidebarCollapsed: z.boolean().optional(),

  density: z.enum(["compact", "comfortable", "spacious"]).optional(),

  tooltipEnabled: z.boolean().optional(),

  tooltipDelay: z.number().int().min(0).max(3000).optional(),

  actionDisplay: z.enum(["icon-label", "icon", "label"]).optional(),
});

export const updateUserPreferenceSchema = z.object({
  admin: adminPreferenceSchema,
});
