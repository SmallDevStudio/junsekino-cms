import "server-only";

import { COMPANY_STATUS } from "@/constants/company";

import { listCompanies } from "@/modules/company/company.repository";

function normalizeText(value) {
  return String(value || "").trim();
}

function resolveBrandSuffix(company) {
  const shortName = normalizeText(company.shortName);

  if (shortName) {
    return shortName.replace(/^junsekino\s*/i, "").trim();
  }

  const name = normalizeText(company.name);

  return name.replace(/^junsekino\s*/i, "").trim();
}

function resolveBrandSubtitle(company) {
  const explicit =
    company.publicIdentity?.subtitle?.en ||
    company.publicSubtitle?.en ||
    company.subtitle?.en ||
    company.tagline?.en ||
    "";

  if (explicit) {
    return explicit;
  }

  /*
   * Temporary compatibility for the
   * two existing Junsekino companies.
   *
   * Later Company Management will store
   * this explicitly in publicIdentity.
   */
  const suffix = resolveBrandSuffix(company).toUpperCase();

  if (suffix === "A+D") {
    return "Architecture";
  }

  if (suffix === "I+D") {
    return "Interior Design";
  }

  return "";
}

function resolvePrimaryColor(company) {
  return company.branding?.colors?.primary || company.primaryColor || "#000000";
}

function mapPublicCompany(company) {
  return {
    id: company.id,

    slug: company.slug,

    name: company.name || "",

    brandName: company.publicIdentity?.brandName || "JUNSEKINO",

    brandSuffix: resolveBrandSuffix(company),

    subtitle: resolveBrandSubtitle(company),

    primaryColor: resolvePrimaryColor(company),

    sortOrder: company.publicIdentity?.sortOrder ?? company.sortOrder ?? 0,
  };
}

export async function listPublicCompanies() {
  const companies = await listCompanies();

  return companies
    .filter(
      (company) =>
        !company.deletedAt &&
        company.status === COMPANY_STATUS.ACTIVE &&
        Boolean(company.slug),
    )
    .map(mapPublicCompany)
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }

      return a.name.localeCompare(b.name, "en", {
        sensitivity: "base",
      });
    });
}
