import { DEFAULT_LOCALE } from "@/constants/locale";

export const PUBLIC_SITE = Object.freeze({
  defaultLocale: DEFAULT_LOCALE,

  /*
   * Phase 1:
   * English public website only.
   *
   * Locale switcher should remain hidden
   * while this array contains one language.
   */
  locales: ["en"],
});

export const PUBLIC_NAVIGATION = Object.freeze([
  {
    key: "home",
    label: {
      en: "Home",
      th: "หน้าหลัก",
    },
    path: "",
  },

  {
    key: "about",
    label: {
      en: "About",
      th: "เกี่ยวกับเรา",
    },
    path: "/about",
  },

  {
    key: "projects",
    label: {
      en: "Projects",
      th: "โครงการ",
    },
    path: "/projects",
  },

  {
    key: "awards",
    label: {
      en: "Awards",
      th: "รางวัล",
    },
    path: "/awards",
  },

  {
    key: "public",
    label: {
      en: "Public",
      th: "สื่อและบทความ",
    },
    path: "/public",
  },

  {
    key: "news",
    label: {
      en: "News",
      th: "ข่าวสาร",
    },
    path: "/news",
  },

  {
    key: "contact",
    label: {
      en: "Contact",
      th: "ติดต่อ",
    },
    path: "/contact",
  },
]);
