import { notFound, permanentRedirect } from "next/navigation";

import PublicLegalDocument from "@/components/public/legal/PublicLegalDocument";

import { getPublicCompany } from "@/modules/public/public-company.service";

import { getPublicLegalDocuments } from "@/modules/legal/legal.service";

/*
 * =========================================================
 * CONSTANTS
 * =========================================================
 */

const LEGAL_TYPES = new Set(["privacy", "cookies", "terms"]);

const FALLBACK_TITLES = {
  privacy: {
    en: "Privacy Notice",
    th: "ประกาศความเป็นส่วนตัว",
  },

  cookies: {
    en: "Cookie Policy",
    th: "นโยบายคุกกี้",
  },

  terms: {
    en: "Website Terms of Use",
    th: "ข้อกำหนดการใช้งานเว็บไซต์",
  },
};

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function normalizeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizeLegalType(value) {
  const type = String(value || "")
    .trim()
    .toLowerCase();

  return LEGAL_TYPES.has(type) ? type : null;
}

function normalizeLocale(value) {
  return value === "th" ? "th" : "en";
}

function localized(value, locale, fallback = "") {
  if (!value) {
    return fallback;
  }

  if (typeof value === "string") {
    return value;
  }

  return value?.[locale] || value?.en || value?.th || fallback;
}

function getCompanyName(company, locale) {
  if (locale === "th") {
    return (
      company?.displayName?.th ||
      company?.legalNameTh ||
      company?.shortName ||
      company?.name ||
      "Junsekino"
    );
  }

  return (
    company?.displayName?.en ||
    company?.legalName ||
    company?.shortName ||
    company?.name ||
    "Junsekino"
  );
}

async function resolveLegalPage({
  companySlug,

  type,
}) {
  const companyData = await getPublicCompany(companySlug);

  if (companyData.redirect) {
    return {
      redirectTo: companyData.redirectTo,
    };
  }

  const documents = await getPublicLegalDocuments(companyData.company.id);

  const document = documents?.[type] || null;

  return {
    companyData,

    document,
  };
}

/*
 * =========================================================
 * METADATA
 * =========================================================
 */

export async function generateMetadata({
  params,

  searchParams,
}) {
  const resolvedParams = await params;

  const resolvedSearchParams = await searchParams;

  const companySlug = normalizeSlug(resolvedParams.companySlug);

  const type = normalizeLegalType(resolvedParams.type);

  const locale = normalizeLocale(resolvedSearchParams?.lang);

  if (!companySlug || !type) {
    return {
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  try {
    const result = await resolveLegalPage({
      companySlug,

      type,
    });

    if (result.redirectTo || !result.document) {
      return {
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    const fallbackTitle =
      FALLBACK_TITLES[type]?.[locale] ||
      FALLBACK_TITLES[type]?.en ||
      "Legal Document";

    const title = localized(
      result.document.title,

      locale,

      fallbackTitle,
    );

    const companyName = getCompanyName(
      result.companyData.company,

      locale,
    );

    return {
      title,

      description:
        locale === "th"
          ? `${title} ของ ${companyName}`
          : `${title} for ${companyName}.`,

      alternates: {
        canonical: `/${companySlug}/legal/${type}`,

        languages: {
          en: `/${companySlug}/legal/${type}?lang=en`,

          th: `/${companySlug}/legal/${type}?lang=th`,
        },
      },

      robots: {
        index: true,

        follow: true,
      },
    };
  } catch {
    return {};
  }
}

/*
 * =========================================================
 * PAGE
 * =========================================================
 */

export default async function LegalPage({
  params,

  searchParams,
}) {
  const resolvedParams = await params;

  const resolvedSearchParams = await searchParams;

  const companySlug = normalizeSlug(resolvedParams.companySlug);

  const type = normalizeLegalType(resolvedParams.type);

  const locale = normalizeLocale(resolvedSearchParams?.lang);

  if (!companySlug || !type) {
    notFound();
  }

  let result;

  try {
    result = await resolveLegalPage({
      companySlug,

      type,
    });
  } catch (error) {
    if (error.message === "PUBLIC_COMPANY_NOT_FOUND") {
      notFound();
    }

    throw error;
  }

  if (result.redirectTo) {
    const query = locale === "th" ? "?lang=th" : "";

    permanentRedirect(`/${result.redirectTo}/legal/${type}${query}`);
  }

  if (!result.document) {
    notFound();
  }

  const companyName = getCompanyName(
    result.companyData.company,

    locale,
  );

  return (
    <PublicLegalDocument
      document={result.document}
      companySlug={companySlug}
      companyName={companyName}
      locale={locale}
    />
  );
}
