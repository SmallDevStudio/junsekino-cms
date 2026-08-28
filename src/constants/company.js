export const COMPANY_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  ARCHIVED: "archived",
};

export const COMPANY_LOCALES = {
  EN: "en",
  TH: "th",
};

/*
 * =========================================================
 * LOCALIZATION
 * =========================================================
 *
 * Junsekino CMS rule:
 *
 * - English is always available.
 * - New companies use English only.
 * - Thai is optional and must be enabled
 *   from Company Settings.
 * - Admin UI language is a separate
 *   user preference and does not affect
 *   public content languages.
 * =========================================================
 */

export const COMPANY_LOCALE_OPTIONS = [
  {
    value: COMPANY_LOCALES.EN,
    label: "English",
    shortLabel: "EN",
    required: true,
  },
  {
    value: COMPANY_LOCALES.TH,
    label: "ไทย",
    shortLabel: "TH",
    required: false,
  },
];

export const DEFAULT_COMPANY_LOCALE = COMPANY_LOCALES.EN;

export const DEFAULT_COMPANY_LOCALES = [COMPANY_LOCALES.EN];

export const DEFAULT_COMPANY_BRANDING = {
  logoLight: null,
  logoDark: null,
  favicon: null,

  colors: {
    primary: "#111111",
    secondary: "#ffffff",
    accent: "#d4d4d4",
    background: "#ffffff",
    surface: "#f7f7f7",
    text: "#111111",
  },
};

export const DEFAULT_COMPANY_SOCIAL = {
  facebook: null,
  instagram: null,
  linkedin: null,
  youtube: null,
  x: null,
  tiktok: null,
  pinterest: null,
};

export const DEFAULT_COMPANY_SEO = {
  th: {
    title: "",
    description: "",
    keywords: [],
    ogTitle: "",
    ogDescription: "",
    ogImage: null,
  },

  en: {
    title: "",
    description: "",
    keywords: [],
    ogTitle: "",
    ogDescription: "",
    ogImage: null,
  },

  index: true,
  follow: true,
};
