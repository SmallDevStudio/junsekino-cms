import "server-only";

import { COMPANY_LOCALES } from "@/constants/company";

import {
  getCompanyById,
  updateCompanyRecord,
} from "@/modules/company/company.repository";

import { AUDIT_ACTIONS, createAuditLog } from "@/modules/audit/audit.service";

import { serializeFirestoreDocument } from "@/utils/firestore";

/*
 * =========================================================
 * NORMALIZE
 * =========================================================
 */

function normalizeSupportedLocales(supportedLocales) {
  const locales = Array.isArray(supportedLocales)
    ? supportedLocales.filter(
        (locale) =>
          locale === COMPANY_LOCALES.EN || locale === COMPANY_LOCALES.TH,
      )
    : [];

  /*
   * English is mandatory.
   */
  if (!locales.includes(COMPANY_LOCALES.EN)) {
    locales.unshift(COMPANY_LOCALES.EN);
  }

  return Array.from(new Set(locales));
}

/*
 * =========================================================
 * GET
 * =========================================================
 */

export async function getCompanyLocalization({ companyId }) {
  const company = await getCompanyById(companyId);

  if (!company || company.deletedAt) {
    throw new Error("COMPANY_NOT_FOUND");
  }

  const supportedLocales = normalizeSupportedLocales(company.supportedLocales);

  const defaultLocale = supportedLocales.includes(company.defaultLocale)
    ? company.defaultLocale
    : COMPANY_LOCALES.EN;

  return {
    defaultLocale,

    supportedLocales,

    multilingual: supportedLocales.length > 1,
  };
}

/*
 * =========================================================
 * UPDATE
 * =========================================================
 */

export async function updateCompanyLocalization({
  companyId,
  input,
  currentUser,
}) {
  const existing = await getCompanyById(companyId);

  if (!existing || existing.deletedAt) {
    throw new Error("COMPANY_NOT_FOUND");
  }

  const supportedLocales = normalizeSupportedLocales(input.supportedLocales);

  if (!supportedLocales.includes(input.defaultLocale)) {
    throw new Error("DEFAULT_LOCALE_NOT_SUPPORTED");
  }

  const before = serializeFirestoreDocument(existing);

  const result = await updateCompanyRecord({
    companyId,

    data: {
      defaultLocale: input.defaultLocale,

      supportedLocales,
    },

    userId: currentUser.uid,
  });

  const after = serializeFirestoreDocument(result.after);

  await createAuditLog({
    userId: currentUser.uid,

    companyId,

    action: AUDIT_ACTIONS.COMPANY_UPDATE,

    resource: "companyLocalization",

    resourceId: companyId,

    before: {
      defaultLocale: before.defaultLocale,

      supportedLocales: before.supportedLocales,
    },

    after: {
      defaultLocale: after.defaultLocale,

      supportedLocales: after.supportedLocales,
    },
  });

  return {
    defaultLocale: after.defaultLocale,

    supportedLocales: normalizeSupportedLocales(after.supportedLocales),

    multilingual: normalizeSupportedLocales(after.supportedLocales).length > 1,
  };
}
