import { z } from "zod";

import { FORM_SUBMISSION_STATUSES } from "@/constants/form";

/*
 * =========================================================
 * PUBLIC SUBMISSION
 * =========================================================
 */

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
   */
  website: z.string().max(500).optional().default(""),
});

/*
 * =========================================================
 * ID
 * =========================================================
 */

export const formSubmissionIdSchema = z.string().trim().min(1).max(200);

/*
 * =========================================================
 * UPDATE
 * =========================================================
 *
 * Existing workflow statuses remain supported.
 *
 * Additional actions are used by the shared Inbox:
 *
 * mark_read
 * trash
 * restore
 * =========================================================
 */

export const updateFormSubmissionSchema = z.union([
  z.object({
    status: z.enum(FORM_SUBMISSION_STATUSES),

    action: z.never().optional(),
  }),

  z.object({
    action: z.enum(["mark_read", "trash", "restore"]),

    status: z.never().optional(),
  }),
]);
