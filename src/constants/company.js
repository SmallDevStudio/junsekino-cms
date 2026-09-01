export const COMPANY_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  ARCHIVED: "archived",
};

export const COMPANY_LOCALES = {
  EN: "en",
  TH: "th",
};

export const COMPANY_THEME_MODE = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
};

export const COMPANY_LOGO_MODE = {
  AUTO: "auto",

  IMAGE: "image",

  TEXT: "text",
};

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

/*
 * =========================================================
 * COMPANY PROFILE
 * =========================================================
 *
 * This is the canonical source for:
 *
 * - Contact address
 * - Phone
 * - Email
 * - Website
 * - Map
 * - Business hours
 *
 * Contact Page controls presentation only.
 * =========================================================
 */

export const DEFAULT_COMPANY_PROFILE = {
  taxId: null,

  registrationNumber: null,

  email: null,

  phone: null,

  secondaryPhone: null,

  website: null,

  address: {
    en: "",

    th: "",
  },

  mapUrl: null,

  latitude: null,

  longitude: null,

  businessHours: {
    en: "",

    th: "",
  },
};

/*
 * =========================================================
 * BRANDING
 * =========================================================
 *
 * colors.background, surface and text remain here
 * temporarily for backward compatibility.
 *
 * New UI will display them under Light Theme instead
 * of presenting all colors as one confusing group.
 * =========================================================
 */

export const DEFAULT_COMPANY_BRANDING = {
  /*
   * auto:
   * - Use image logo when available.
   * - Fall back to text logo automatically.
   *
   * image:
   * - Prefer image logo.
   * - Fall back to text when image is unavailable.
   *
   * text:
   * - Always display the text logo.
   */
  logoMode: COMPANY_LOGO_MODE.AUTO,

  logoLight: null,

  logoDark: null,

  favicon: null,

  textLogo: {
    /*
     * Main company/brand name.
     *
     * Example: JUNSEKINO
     */
    text: "",

    /*
     * Highlighted suffix.
     *
     * Example: I+D or A+D
     */
    highlight: "",

    /*
     * Optional separator between text and highlight.
     *
     * Example: space, /, | or empty string.
     */
    separator: "",
  },

  colors: {
    primary: "#111111",

    secondary: "#ffffff",

    accent: "#d4d4d4",

    /*
     * Backward-compatible colors.
     *
     * Company Settings UI will display these
     * under the Light Theme group.
     */
    background: "#ffffff",

    surface: "#f7f7f7",

    text: "#111111",
  },
};

/*
 * =========================================================
 * PUBLIC WEBSITE THEME
 * =========================================================
 */

export const DEFAULT_COMPANY_THEME = {
  defaultMode: COMPANY_THEME_MODE.LIGHT,

  allowVisitorPreference: false,

  light: {
    background: "#ffffff",

    surface: "#f7f7f7",

    text: "#111111",

    mutedText: "#737373",

    border: "#e5e5e5",
  },

  dark: {
    background: "#111111",

    surface: "#1c1c1c",

    text: "#ffffff",

    mutedText: "#a3a3a3",

    border: "#333333",
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

  line: null,
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

/*
 * =========================================================
 * COMPANY SETUP
 * =========================================================
 */

export const DEFAULT_COMPANY_SETUP = {
  completed: false,

  completedSteps: {
    profile: false,

    branding: false,

    contact: false,

    seo: false,
  },
};
