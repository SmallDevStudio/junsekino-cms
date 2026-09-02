import "server-only";

import { getPublicCompanySettings } from "./public-company.repository";

import { resolvePublicCompany } from "@/modules/company/company-slug.service";

import { getCompanyPrivacySettings } from "@/modules/legal/privacy-settings.service";

import { serializeFirestoreDocument } from "@/utils/firestore";

/*
 * =========================================================
 * PUBLIC COMPANY
 * =========================================================
 */

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

  /*
   * The public settings repository returns null
   * when a company has never saved Privacy Settings.
   *
   * Privacy Settings service provides normalized,
   * privacy-safe defaults in that situation.
   */
  const privacy =
    settings?.privacy || (await getCompanyPrivacySettings(company.id));

  return {
    redirect: false,

    redirectTo: null,

    company: serializeFirestoreDocument(company),

    settings: serializeFirestoreDocument({
      ...(settings || {}),

      privacy,
    }),
  };
}
