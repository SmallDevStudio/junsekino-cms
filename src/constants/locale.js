export const LOCALE = Object.freeze({
  EN: "en",
  TH: "th",
});

/*
 * Languages supported by the platform.
 *
 * Thai is prepared at architecture/data level,
 * but is not enabled on the public website yet.
 */
export const SUPPORTED_LOCALES = Object.freeze([LOCALE.EN, LOCALE.TH]);

/*
 * Initial Junsekino public website configuration.
 *
 * English only for Phase 1.
 */
export const ENABLED_PUBLIC_LOCALES = Object.freeze([LOCALE.EN]);

export const DEFAULT_LOCALE = LOCALE.EN;

export function isSupportedLocale(locale) {
  return SUPPORTED_LOCALES.includes(locale);
}

export function isPublicLocaleEnabled(locale) {
  return ENABLED_PUBLIC_LOCALES.includes(locale);
}
