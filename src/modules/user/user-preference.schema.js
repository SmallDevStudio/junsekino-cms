import { z } from "zod";

export const adminPreferenceSchema = z.object({
  locale: z.enum(["en", "th"]).optional(),

  sidebarCollapsed: z.boolean().optional(),

  density: z.enum(["compact", "comfortable", "spacious"]).optional(),

  fontSize: z.enum(["small", "medium", "large"]).optional(),

  tooltipEnabled: z.boolean().optional(),

  tooltipDelay: z.number().int().min(0).max(3000).optional(),

  actionDisplay: z.enum(["icon-label", "icon", "label"]).optional(),
});

export const privacyPreferenceSchema = z.object({
  avatarVisibility: z.enum(["company", "private"]).optional(),

  phoneVisibility: z.enum(["company", "private"]).optional(),

  bioVisibility: z.enum(["company", "private"]).optional(),

  lastActiveVisibility: z.enum(["admins", "private"]).optional(),
});

export const notificationPreferenceSchema = z.object({
  emailEnabled: z.boolean().optional(),

  browserEnabled: z.boolean().optional(),

  formSubmissions: z.boolean().optional(),

  contentPublished: z.boolean().optional(),

  memberUpdates: z.boolean().optional(),

  /*
   * Security notifications cannot be disabled.
   * The service always normalizes this to true.
   */
  securityAlerts: z.boolean().optional(),
});

export const updateUserPreferenceSchema = z
  .object({
    admin: adminPreferenceSchema.optional(),

    privacy: privacyPreferenceSchema.optional(),

    notifications: notificationPreferenceSchema.optional(),
  })
  .refine(
    (input) => Boolean(input.admin || input.privacy || input.notifications),
    {
      message: "At least one preference section is required.",
    },
  );
