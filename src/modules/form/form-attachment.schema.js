import { z } from "zod";

import {
  FORM_ATTACHMENT_ALLOWED_MIME_TYPES,
  FORM_ATTACHMENT_MAX_SIZE,
} from "@/constants/form-attachment";

export const createFormAttachmentSchema = z.object({
  fieldId: z.string().trim().min(1).max(100),

  fileName: z.string().trim().min(1).max(255),

  mimeType: z.enum(FORM_ATTACHMENT_ALLOWED_MIME_TYPES),

  size: z.number().int().positive().max(FORM_ATTACHMENT_MAX_SIZE),
});

export const formAttachmentIdSchema = z.string().trim().min(1).max(200);
