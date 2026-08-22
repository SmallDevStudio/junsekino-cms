import "server-only";

import {
  DEFAULT_COMPANY_BRANDING,
  DEFAULT_COMPANY_LOCALES,
  DEFAULT_COMPANY_SEO,
  DEFAULT_COMPANY_SOCIAL,
} from "@/constants/company";

import {
  createCompanyRecord,
  getCompanyById,
  listCompanies,
  softDeleteCompanyRecord,
  updateCompanyRecord,
} from "./company.repository";

import { AUDIT_ACTIONS, createAuditLog } from "@/modules/audit/audit.service";

import { serializeFirestoreDocument } from "@/utils/firestore";

function normalizeNullableValue(value) {
  if (value === "" || value === undefined) {
    return null;
  }

  return value;
}

function normalizeSocial(social = {}) {
  return {
    ...DEFAULT_COMPANY_SOCIAL,

    ...Object.fromEntries(
      Object.entries(social).map(([key, value]) => [
        key,
        normalizeNullableValue(value),
      ]),
    ),
  };
}

function mergeBranding(branding = {}) {
  return {
    ...DEFAULT_COMPANY_BRANDING,
    ...branding,

    colors: {
      ...DEFAULT_COMPANY_BRANDING.colors,
      ...(branding.colors || {}),
    },
  };
}

function mergeSeo(seo = {}) {
  return {
    ...DEFAULT_COMPANY_SEO,
    ...seo,

    th: {
      ...DEFAULT_COMPANY_SEO.th,
      ...(seo.th || {}),
    },

    en: {
      ...DEFAULT_COMPANY_SEO.en,
      ...(seo.en || {}),
    },
  };
}

export async function getCompanies() {
  const companies = await listCompanies();

  return companies.map(serializeFirestoreDocument);
}

export async function getCompany(companyId) {
  const company = await getCompanyById(companyId);

  if (!company || company.deletedAt) {
    throw new Error("COMPANY_NOT_FOUND");
  }

  return serializeFirestoreDocument(company);
}

export async function createCompany({ input, currentUser }) {
  const supportedLocales = input.supportedLocales || DEFAULT_COMPANY_LOCALES;

  if (!supportedLocales.includes(input.defaultLocale)) {
    throw new Error("DEFAULT_LOCALE_NOT_SUPPORTED");
  }

  const companyData = {
    name: input.name,

    legalName: input.legalName || "",

    shortName: input.shortName || "",

    slug: input.slug.toLowerCase(),

    status: input.status || "active",

    defaultLocale: input.defaultLocale || "en",

    supportedLocales,

    branding: mergeBranding(input.branding),

    social: normalizeSocial(input.social),

    seo: mergeSeo(input.seo),
  };

  const company = await createCompanyRecord({
    data: companyData,

    userId: currentUser.uid,
  });

  await createAuditLog({
    userId: currentUser.uid,

    companyId: company.id,

    action: AUDIT_ACTIONS.COMPANY_CREATE,

    resource: "company",

    resourceId: company.id,

    before: null,

    after: serializeFirestoreDocument(company),
  });

  return serializeFirestoreDocument(company);
}

export async function updateCompany({ companyId, input, currentUser }) {
  const existing = await getCompanyById(companyId);

  if (!existing || existing.deletedAt) {
    throw new Error("COMPANY_NOT_FOUND");
  }

  const defaultLocale = input.defaultLocale ?? existing.defaultLocale;

  const supportedLocales = input.supportedLocales ?? existing.supportedLocales;

  if (!supportedLocales.includes(defaultLocale)) {
    throw new Error("DEFAULT_LOCALE_NOT_SUPPORTED");
  }

  const updateData = {
    ...input,
  };

  if (input.slug) {
    updateData.slug = input.slug.toLowerCase();
  }

  if (input.branding) {
    updateData.branding = mergeBranding({
      ...existing.branding,
      ...input.branding,

      colors: {
        ...existing.branding?.colors,

        ...input.branding?.colors,
      },
    });
  }

  if (input.social) {
    updateData.social = normalizeSocial({
      ...existing.social,
      ...input.social,
    });
  }

  if (input.seo) {
    updateData.seo = mergeSeo({
      ...existing.seo,
      ...input.seo,

      th: {
        ...existing.seo?.th,
        ...input.seo?.th,
      },

      en: {
        ...existing.seo?.en,
        ...input.seo?.en,
      },
    });
  }

  const result = await updateCompanyRecord({
    companyId,

    data: updateData,

    userId: currentUser.uid,
  });

  await createAuditLog({
    userId: currentUser.uid,

    companyId,

    action: AUDIT_ACTIONS.COMPANY_UPDATE,

    resource: "company",

    resourceId: companyId,

    before: serializeFirestoreDocument(result.before),

    after: serializeFirestoreDocument(result.after),
  });

  return serializeFirestoreDocument(result.after);
}

export async function deleteCompany({ companyId, currentUser }) {
  const before = await softDeleteCompanyRecord({
    companyId,

    userId: currentUser.uid,
  });

  await createAuditLog({
    userId: currentUser.uid,

    companyId,

    action: AUDIT_ACTIONS.COMPANY_DELETE,

    resource: "company",

    resourceId: companyId,

    before: serializeFirestoreDocument(before),

    after: {
      deleted: true,
    },
  });

  return {
    id: companyId,
    deleted: true,
  };
}
