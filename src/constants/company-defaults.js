export const COMPANY_SETTING_KEYS = {
  NAVIGATION: "navigation",
  BRANDING: "branding",
  SEO: "seo",
  SOCIAL: "social",
};

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

    path: "projects",

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
      th: "สื่อและบทความ",
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

export const DEFAULT_COMPANY_BRANDING = {
  logoMediaId: null,

  logoDarkMediaId: null,

  faviconMediaId: null,

  primaryColor: "#000000",

  secondaryColor: "#FFFFFF",

  accentColor: "#000000",

  backgroundColor: "#FFFFFF",

  textColor: "#111111",

  font: {
    heading: null,
    body: null,
  },
};

export const DEFAULT_COMPANY_SEO = {
  th: {
    siteName: "",

    title: "",

    description: "",

    keywords: [],

    ogImageMediaId: null,
  },

  en: {
    siteName: "",

    title: "",

    description: "",

    keywords: [],

    ogImageMediaId: null,
  },

  robots: {
    index: true,
    follow: true,
  },
};

export const DEFAULT_COMPANY_SOCIAL = {
  facebook: null,

  instagram: null,

  youtube: null,

  linkedin: null,

  tiktok: null,

  x: null,

  pinterest: null,

  line: null,
};

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
