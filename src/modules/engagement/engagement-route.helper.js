import "server-only";

import {
  engagementContentIdSchema,
  engagementContentTypeSchema,
} from "./engagement.schema";

import { companySlugSchema } from "@/modules/company/company-slug.schema";

import { resolvePublicCompany } from "@/modules/company/company-slug.service";

export async function resolveEngagementRoute(context) {
  const params = await context.params;

  const companyValidation = companySlugSchema.safeParse(params.companySlug);

  const typeValidation = engagementContentTypeSchema.safeParse(
    params.contentType,
  );

  const idValidation = engagementContentIdSchema.safeParse(params.contentId);

  if (
    !companyValidation.success ||
    !typeValidation.success ||
    !idValidation.success
  ) {
    return {
      valid: false,
    };
  }

  const resolved = await resolvePublicCompany(companyValidation.data);

  if (!resolved || resolved.redirect || !resolved.company) {
    return {
      valid: false,
      companyNotFound: true,
    };
  }

  return {
    valid: true,

    company: resolved.company,

    companySlug: companyValidation.data,

    contentType: typeValidation.data,

    contentId: idValidation.data,
  };
}
