import "server-only";

import {
  getPublicCompanyBySlug,
  getPublicCompanySettings,
} from "./public-company.repository";

import { serializeFirestoreDocument } from "@/utils/firestore";

export async function getPublicCompany(companySlug) {
  const company = await getPublicCompanyBySlug(companySlug);

  if (!company) {
    throw new Error("PUBLIC_COMPANY_NOT_FOUND");
  }

  const settings = await getPublicCompanySettings(company.id);

  return {
    company: serializeFirestoreDocument(company),

    settings: serializeFirestoreDocument(settings),
  };
}
