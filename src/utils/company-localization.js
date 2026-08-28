import {
  COMPANY_LOCALES,
  DEFAULT_COMPANY_LOCALE,
  DEFAULT_COMPANY_LOCALES,
} from "@/constants/company";

/*
 * =========================================================
 * NORMALIZE
 * =========================================================
 */

export function normalizeSupportedLocales(value) {
  const source = Array.isArray(value) ? value : [];

  const locales = source.filter(
    (locale) => locale === COMPANY_LOCALES.EN || locale === COMPANY_LOCALES.TH,
  );

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
 * COMPANY
 * =========================================================
 */

export function getCompanySupportedLocales(company) {
  if (!company) {
    return [...DEFAULT_COMPANY_LOCALES];
  }

  return normalizeSupportedLocales(company.supportedLocales);
}

export function getCompanyDefaultLocale(company) {
  const supportedLocales = getCompanySupportedLocales(company);

  const requested = company?.defaultLocale;

  if (requested && supportedLocales.includes(requested)) {
    return requested;
  }

  return DEFAULT_COMPANY_LOCALE;
}

export function isCompanyLocaleEnabled(company, locale) {
  return getCompanySupportedLocales(company).includes(locale);
}

export function isCompanyMultilingual(company) {
  return getCompanySupportedLocales(company).length > 1;
}

/*
 * =========================================================
 * ADMIN CONTENT EDITOR
 * =========================================================
 *
 * These are content languages.
 *
 * They are NOT related to the language
 * used to display the Admin interface.
 * =========================================================
 */

export function getAdminContentLocales(company) {
  return getCompanySupportedLocales(company);
}

export function shouldShowThaiContent(company) {
  return isCompanyLocaleEnabled(company, COMPANY_LOCALES.TH);
}

/*
 * =========================================================
 * LOCALIZED VALUE
 * =========================================================
 */

export function getLocalizedValue(
  value,
  { locale = COMPANY_LOCALES.EN, fallbackLocale = COMPANY_LOCALES.EN } = {},
) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  const preferred = value?.[locale];

  if (typeof preferred === "string" && preferred.trim()) {
    return preferred;
  }

  const fallback = value?.[fallbackLocale];

  if (typeof fallback === "string" && fallback.trim()) {
    return fallback;
  }

  return value?.en || value?.th || "";
}

/*
 * =========================================================
 * EMPTY LOCALIZED VALUE
 * =========================================================
 */

export function createEmptyLocalizedValue() {
  return {
    en: "",
    th: "",
  };
}
