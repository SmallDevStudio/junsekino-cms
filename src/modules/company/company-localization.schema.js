import { z } from "zod";

import { COMPANY_LOCALES } from "@/constants/company";

/*
 * =========================================================
 * COMPANY LOCALIZATION SETTINGS
 * =========================================================
 *
 * English is always required.
 *
 * Thai is optional.
 *
 * This schema is intentionally separate
 * from the full Company schema because
 * Company Admin should be able to manage
 * localization without receiving access
 * to unrelated Company fields.
 * =========================================================
 */

export const updateCompanyLocalizationSchema = z
  .object({
    defaultLocale: z.enum([COMPANY_LOCALES.EN, COMPANY_LOCALES.TH]),

    supportedLocales: z
      .array(z.enum([COMPANY_LOCALES.EN, COMPANY_LOCALES.TH]))
      .min(1, "At least one language is required.")
      .transform((locales) => Array.from(new Set(locales))),
  })
  .superRefine((value, context) => {
    if (!value.supportedLocales.includes(COMPANY_LOCALES.EN)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,

        path: ["supportedLocales"],

        message: "English must always be enabled.",
      });
    }

    if (!value.supportedLocales.includes(value.defaultLocale)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,

        path: ["defaultLocale"],

        message: "Default language must be enabled.",
      });
    }
  });
