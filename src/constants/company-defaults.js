import {
  DEFAULT_COMPANY_BRANDING as CORE_COMPANY_BRANDING,
  DEFAULT_COMPANY_SEO as CORE_COMPANY_SEO,
  DEFAULT_COMPANY_SOCIAL as CORE_COMPANY_SOCIAL,
} from "@/constants/company";

/*
 * =========================================================
 * SETTING KEYS
 * =========================================================
 */

export const COMPANY_SETTING_KEYS = {
  NAVIGATION: "navigation",

  BRANDING: "branding",

  SEO: "seo",

  SOCIAL: "social",
};

/*
 * =========================================================
 * NAVIGATION
 * =========================================================
 */

export const DEFAULT_COMPANY_NAVIGATION = [
  {
    key: "home",

    type: "page",

    label: {
      th: "หน้าแรก",

      en: "Home",
    },

    path: "",

    enabled: true,

    sortOrder: 10,
  },

  {
    key: "about",

    type: "page",

    label: {
      th: "เกี่ยวกับเรา",

      en: "About",
    },

    path: "about",

    enabled: true,

    sortOrder: 20,
  },

  {
    key: "project",

    type: "module",

    label: {
      th: "โครงการ",

      en: "Project",
    },

    /*
     * Public route is /[companySlug]/project
     * and not /projects.
     */
    path: "project",

    enabled: true,

    sortOrder: 30,
  },

  {
    key: "award",

    type: "module",

    label: {
      th: "รางวัล",

      en: "Award",
    },

    path: "awards",

    enabled: true,

    sortOrder: 40,
  },

  {
    key: "public",

    type: "module",

    label: {
      th: "สื่อเผยแพร่",

      en: "Public",
    },

    path: "public",

    enabled: true,

    sortOrder: 50,
  },

  {
    key: "contact",

    type: "page",

    label: {
      th: "ติดต่อ",

      en: "Contact",
    },

    path: "contact",

    enabled: true,

    sortOrder: 60,
  },
];

/*
 * =========================================================
 * BRANDING SETTING
 * =========================================================
 *
 * Company document is the canonical source.
 *
 * Compatibility fields remain because existing
 * Settings/Public code may still read them.
 * =========================================================
 */

export const DEFAULT_COMPANY_BRANDING = {
  ...CORE_COMPANY_BRANDING,

  logoMediaId: null,

  logoDarkMediaId: null,

  faviconMediaId: null,

  primaryColor: CORE_COMPANY_BRANDING.colors.primary,

  secondaryColor: CORE_COMPANY_BRANDING.colors.secondary,

  accentColor: CORE_COMPANY_BRANDING.colors.accent,

  backgroundColor: CORE_COMPANY_BRANDING.colors.background,

  textColor: CORE_COMPANY_BRANDING.colors.text,

  font: {
    heading: null,

    body: null,
  },
};

/*
 * =========================================================
 * SEO SETTING
 * =========================================================
 */

export const DEFAULT_COMPANY_SEO = {
  ...CORE_COMPANY_SEO,

  th: {
    ...CORE_COMPANY_SEO.th,

    siteName: "",

    ogImageMediaId: null,
  },

  en: {
    ...CORE_COMPANY_SEO.en,

    siteName: "",

    ogImageMediaId: null,
  },

  /*
   * Legacy compatibility.
   */
  robots: {
    index: CORE_COMPANY_SEO.index,

    follow: CORE_COMPANY_SEO.follow,
  },
};

/*
 * =========================================================
 * SOCIAL SETTING
 * =========================================================
 */

export const DEFAULT_COMPANY_SOCIAL = {
  ...CORE_COMPANY_SOCIAL,

  line: null,
};

/*
 * =========================================================
 * SYSTEM PAGES
 * =========================================================
 *
 * Project, Award and Public are modules,
 * not generic Page documents.
 * =========================================================
 */

export const DEFAULT_SYSTEM_PAGES = [
  {
    id: "home",

    slug: "home",

    pageType: "home",

    title: {
      th: "หน้าแรก",

      en: "Home",
    },

    navigation: {
      showInNavigation: true,

      label: {
        th: "หน้าแรก",

        en: "Home",
      },

      sortOrder: 10,
    },
  },

  {
    id: "about",

    slug: "about",

    pageType: "about",

    title: {
      th: "เกี่ยวกับเรา",

      en: "About",
    },

    navigation: {
      showInNavigation: true,

      label: {
        th: "เกี่ยวกับเรา",

        en: "About",
      },

      sortOrder: 20,
    },
  },

  {
    id: "contact",

    slug: "contact",

    pageType: "contact",

    title: {
      th: "ติดต่อ",

      en: "Contact",
    },

    navigation: {
      showInNavigation: true,

      label: {
        th: "ติดต่อ",

        en: "Contact",
      },

      sortOrder: 60,
    },
  },
];
