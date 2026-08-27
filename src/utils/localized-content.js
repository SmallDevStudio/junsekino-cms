import { DEFAULT_LOCALE, LOCALE } from "@/constants/locale";

function normalizeLocale(locale) {
  if (locale === LOCALE.TH) {
    return LOCALE.TH;
  }

  return DEFAULT_LOCALE;
}

export function getLocalizedValue(
  value,
  locale = DEFAULT_LOCALE,
  options = {},
) {
  const { fallbackLocale = DEFAULT_LOCALE, fallback = "" } = options;

  if (value === null || value === undefined) {
    return fallback;
  }

  /*
   * Support legacy/non-localized values.
   */
  if (typeof value === "string") {
    return value;
  }

  const resolvedLocale = normalizeLocale(locale);

  const primary = value?.[resolvedLocale];

  if (typeof primary === "string" && primary.trim()) {
    return primary;
  }

  const secondary = value?.[fallbackLocale];

  if (typeof secondary === "string" && secondary.trim()) {
    return secondary;
  }

  /*
   * Final fallback allows existing CMS data
   * to remain usable when another language
   * has content but the requested language
   * has not been entered yet.
   */
  const english = value?.en;

  if (typeof english === "string" && english.trim()) {
    return english;
  }

  const thai = value?.th;

  if (typeof thai === "string" && thai.trim()) {
    return thai;
  }

  return fallback;
}

export function getLocalizedObject(object, locale = DEFAULT_LOCALE) {
  if (!object || typeof object !== "object") {
    return object;
  }

  const result = {};

  for (const [key, value] of Object.entries(object)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      ("en" in value || "th" in value)
    ) {
      result[key] = getLocalizedValue(value, locale);

      continue;
    }

    result[key] = value;
  }

  return result;
}
