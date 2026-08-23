export const SYSTEM_NAVIGATION_KEYS = {
  HOME: "home",
  ABOUT: "about",
  PROJECT: "project",
  AWARD: "award",
  PUBLIC: "public",
  CONTACT: "contact",
};

export const DEFAULT_COMPANY_NAVIGATION = [
  {
    key: SYSTEM_NAVIGATION_KEYS.HOME,

    type: "system",

    label: {
      th: "หน้าแรก",
      en: "Home",
    },

    path: "",

    enabled: true,

    sortOrder: 10,
  },

  {
    key: SYSTEM_NAVIGATION_KEYS.ABOUT,

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
    key: SYSTEM_NAVIGATION_KEYS.PROJECT,

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
    key: SYSTEM_NAVIGATION_KEYS.AWARD,

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
    key: SYSTEM_NAVIGATION_KEYS.PUBLIC,

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
    key: SYSTEM_NAVIGATION_KEYS.CONTACT,

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
