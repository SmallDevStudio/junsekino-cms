import { z } from "zod";

import {
  COMPANY_SLUG_MAX_LENGTH,
  COMPANY_SLUG_MIN_LENGTH,
  COMPANY_SLUG_PATTERN,
} from "@/constants/company-slug";

export const companySlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(COMPANY_SLUG_MIN_LENGTH, "Company slug is too short.")
  .max(COMPANY_SLUG_MAX_LENGTH, "Company slug is too long.")
  .regex(
    COMPANY_SLUG_PATTERN,
    "Company slug may contain lowercase letters, numbers and hyphens only.",
  );

export const updateCompanySlugSchema = z.object({
  slug: companySlugSchema,
});
