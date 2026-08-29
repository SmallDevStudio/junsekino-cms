"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";

import { adminEn } from "@/i18n/admin/en";
import { adminTh } from "@/i18n/admin/th";

import { ADMIN_LOCALE } from "@/constants/admin-ui";

import { useAdminUiPreferences } from "@/components/admin/ui/AdminUiPreferencesProvider";

/*
 * =========================================================
 * DICTIONARIES
 * =========================================================
 */

const DICTIONARIES = {
  [ADMIN_LOCALE.EN]: adminEn,

  [ADMIN_LOCALE.TH]: adminTh,
};

const AdminI18nContext = createContext(null);

/*
 * =========================================================
 * GET NESTED VALUE
 * =========================================================
 *
 * t("about.cover.title")
 *
 * →
 *
 * dictionary.about.cover.title
 * =========================================================
 */

function getNestedValue(object, path) {
  if (!object || !path) {
    return undefined;
  }

  return String(path)
    .split(".")
    .reduce((current, key) => current?.[key], object);
}

/*
 * =========================================================
 * INTERPOLATION
 * =========================================================
 *
 * dictionary:
 *
 * 'Delete "{title}"?'
 *
 * t("...", {
 *   title: "About 2026"
 * })
 * =========================================================
 */

function interpolate(value, params = {}) {
  if (typeof value !== "string") {
    return value;
  }

  return value.replace(/\{([^{}]+)\}/g, (match, key) => {
    const replacement = params[key];

    if (replacement === undefined || replacement === null) {
      return match;
    }

    return String(replacement);
  });
}

/*
 * =========================================================
 * PROVIDER
 * =========================================================
 */

export function AdminI18nProvider({ children }) {
  const { locale, setLocale } = useAdminUiPreferences();

  const activeLocale = DICTIONARIES[locale] ? locale : ADMIN_LOCALE.EN;

  const dictionary = DICTIONARIES[activeLocale];

  /*
   * Admin document language.
   *
   * This only affects Admin accessibility /
   * browser language semantics.
   *
   * It does NOT change Public content locale.
   */
  useEffect(() => {
    const root = document.documentElement;

    const previousLang = root.lang;

    root.lang = activeLocale === ADMIN_LOCALE.TH ? "th" : "en";

    return () => {
      root.lang = previousLang;
    };
  }, [activeLocale]);

  /*
   * =======================================================
   * TRANSLATE
   * =======================================================
   */

  const t = useCallback(
    (key, params = {}) => {
      /*
       * Current language.
       */
      const localized = getNestedValue(dictionary, key);

      /*
       * English fallback.
       */
      const fallback = getNestedValue(adminEn, key);

      const value = localized ?? fallback;

      /*
       * Development safety:
       *
       * Missing translation shows its key
       * instead of breaking the interface.
       */
      if (value === undefined) {
        return key;
      }

      if (typeof value !== "string") {
        return value;
      }

      return interpolate(value, params);
    },
    [dictionary],
  );

  /*
   * =======================================================
   * STATUS TRANSLATION
   * =======================================================
   */

  const statusLabel = useCallback(
    (status) => {
      if (!status) {
        return "";
      }

      return t(`status.${status}`);
    },
    [t],
  );

  /*
   * =======================================================
   * API ERROR TRANSLATION
   * =======================================================
   */

  const errorMessage = useCallback(
    (code, fallback) => {
      const map = {
        AUTHENTICATION_REQUIRED: "errors.authenticationRequired",

        PERMISSION_DENIED: "errors.permissionDenied",

        COMPANY_NOT_FOUND: "errors.companyNotFound",

        PAGE_NOT_FOUND: "errors.pageNotFound",

        PAGE_VALIDATION_FAILED: "errors.invalidData",
      };

      const key = map[code];

      if (key) {
        return t(key);
      }

      return fallback || t("errors.unknown");
    },
    [t],
  );

  /*
   * =======================================================
   * CONTEXT
   * =======================================================
   */

  const value = useMemo(
    () => ({
      locale: activeLocale,

      isEnglish: activeLocale === ADMIN_LOCALE.EN,

      isThai: activeLocale === ADMIN_LOCALE.TH,

      dictionary,

      t,

      statusLabel,

      errorMessage,

      setLocale,
    }),
    [activeLocale, dictionary, t, statusLabel, errorMessage, setLocale],
  );

  return (
    <AdminI18nContext.Provider value={value}>
      {children}
    </AdminI18nContext.Provider>
  );
}

/*
 * =========================================================
 * HOOK
 * =========================================================
 */

export function useAdminI18n() {
  const context = useContext(AdminI18nContext);

  if (!context) {
    throw new Error("useAdminI18n must be used inside AdminI18nProvider.");
  }

  return context;
}

/*
 * =========================================================
 * CONVENIENCE ALIAS
 * =========================================================
 */

export function useAdminTranslation() {
  return useAdminI18n();
}
