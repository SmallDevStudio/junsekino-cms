import "server-only";

import { getPublicCompanySettings } from "./public-company.repository";

import { resolvePublicCompany } from "@/modules/company/company-slug.service";

import { serializeFirestoreDocument } from "@/utils/firestore";

export async function getPublicCompany(companySlug) {
  const resolved = await resolvePublicCompany(companySlug);

  if (!resolved) {
    throw new Error("PUBLIC_COMPANY_NOT_FOUND");
  }

  if (resolved.redirect) {
    return {
      redirect: true,

      redirectTo: resolved.redirectTo,

      company: null,

      settings: null,
    };
  }

  const company = resolved.company;

  const settings = await getPublicCompanySettings(company.id);

  return {
    redirect: false,

    redirectTo: null,

    company: company,

    settings: serializeFirestoreDocument(settings),
  };
}
