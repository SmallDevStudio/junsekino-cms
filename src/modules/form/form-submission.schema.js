import { z } from "zod";

import { FORM_SUBMISSION_STATUSES } from "@/constants/form";

export const publicFormSubmissionSchema = z.object({
  values: z.record(z.string(), z.unknown()),

  source: z
    .object({
      pagePath: z.string().max(1000).nullable().optional(),

      popupId: z.string().max(200).nullable().optional(),

      referrer: z.string().max(2000).nullable().optional(),
    })
    .optional(),

  /*
   * Honeypot.
   *
   * Real users never fill this.
   */
  website: z.string().max(500).optional().default(""),
});

export const formSubmissionIdSchema = z.string().trim().min(1).max(200);

export const updateFormSubmissionSchema = z.object({
  status: z.enum(FORM_SUBMISSION_STATUSES),
});
