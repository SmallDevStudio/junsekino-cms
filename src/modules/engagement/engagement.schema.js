import { z } from "zod";

import { ENGAGEMENT_CONTENT_TYPES } from "@/constants/engagement";

export const engagementContentTypeSchema = z.enum(ENGAGEMENT_CONTENT_TYPES);

export const engagementContentIdSchema = z.string().trim().min(1).max(200);

export const shareEventSchema = z.object({
  channel: z
    .enum(["native", "facebook", "line", "x", "copy_link", "other"])
    .default("native"),
});
