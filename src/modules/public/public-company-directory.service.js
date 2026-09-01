import "server-only";

import {
  COMPANY_LOGO_MODE,
  COMPANY_STATUS,
  DEFAULT_COMPANY_BRANDING,
  DEFAULT_COMPANY_THEME,
} from "@/constants/company";

import { listCompanies } from "@/modules/company/company.repository";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function normalizeText(value) {
  return String(value || "").trim();
}

function resolveBrandSuffix(company) {
  const explicitHighlight = company.branding?.textLogo?.highlight;

  if (normalizeText(explicitHighlight)) {
    return normalizeText(explicitHighlight);
  }

  const shortName = normalizeText(company.shortName);

  if (shortName) {
    return shortName.replace(/^junsekino\s*/i, "").trim();
  }

  const name = normalizeText(company.name);

  return name.replace(/^junsekino\s*/i, "").trim();
}

function resolveBrandName(company) {
  return (
    normalizeText(company.branding?.textLogo?.text) ||
    normalizeText(company.publicIdentity?.brandName) ||
    "JUNSEKINO"
  );
}

function resolveBrandSubtitle(company) {
  const explicit =
    company.publicIdentity?.subtitle?.en ||
    company.publicSubtitle?.en ||
    company.subtitle?.en ||
    company.tagline?.en ||
    "";

  if (explicit) {
    return explicit;
  }

  /*
   * Compatibility for the two existing
   * Junsekino companies.
   */
  const suffix = resolveBrandSuffix(company).toUpperCase();

  if (suffix === "A+D") {
    return "Architecture";
  }

  if (suffix === "I+D") {
    return "Interior Design";
  }

  return "";
}

function resolvePrimaryColor(company) {
  return (
    company.branding?.colors?.primary ||
    company.colors?.primary ||
    company.primaryColor ||
    DEFAULT_COMPANY_BRANDING.colors.primary
  );
}

/*
 * =========================================================
 * MEDIA
 * =========================================================
 */

function sanitizeMediaReference(value) {
  if (!value) {
    return null;
  }

  /*
   * Legacy records may contain only Media ID.
   */
  if (typeof value === "string") {
    return {
      mediaId: value,

      alt: {
        en: "",

        th: "",
      },

      caption: {
        en: "",

        th: "",
      },

      crop: null,
    };
  }

  if (!value.mediaId && !value.id) {
    return null;
  }

  return {
    mediaId: value.mediaId || value.id,

    alt: {
      en: value.alt?.en || "",

      th: value.alt?.th || "",
    },

    caption: {
      en: value.caption?.en || "",

      th: value.caption?.th || "",
    },

    crop: value.crop || null,
  };
}

/*
 * =========================================================
 * BRANDING
 * =========================================================
 */

function sanitizeBranding(company) {
  const branding = company.branding || {};

  const logoMode = Object.values(COMPANY_LOGO_MODE).includes(branding.logoMode)
    ? branding.logoMode
    : DEFAULT_COMPANY_BRANDING.logoMode;

  return {
    logoMode,

    logoLight: sanitizeMediaReference(branding.logoLight),

    logoDark: sanitizeMediaReference(branding.logoDark),

    favicon: sanitizeMediaReference(branding.favicon),

    textLogo: {
      text: normalizeText(branding.textLogo?.text) || resolveBrandName(company),

      highlight:
        normalizeText(branding.textLogo?.highlight) ||
        resolveBrandSuffix(company),

      separator:
        branding.textLogo?.separator !== undefined
          ? String(branding.textLogo.separator)
          : " ",
    },

    colors: {
      ...DEFAULT_COMPANY_BRANDING.colors,

      ...(company.colors || {}),

      ...(branding.colors || {}),
    },
  };
}

function sanitizeTheme(company, branding) {
  const theme = company.theme || {};

  return {
    defaultMode: theme.defaultMode || DEFAULT_COMPANY_THEME.defaultMode,

    allowVisitorPreference:
      typeof theme.allowVisitorPreference === "boolean"
        ? theme.allowVisitorPreference
        : DEFAULT_COMPANY_THEME.allowVisitorPreference,

    light: {
      ...DEFAULT_COMPANY_THEME.light,

      background:
        branding.colors.background || DEFAULT_COMPANY_THEME.light.background,

      surface: branding.colors.surface || DEFAULT_COMPANY_THEME.light.surface,

      text: branding.colors.text || DEFAULT_COMPANY_THEME.light.text,

      ...(theme.light || {}),
    },

    dark: {
      ...DEFAULT_COMPANY_THEME.dark,

      ...(theme.dark || {}),
    },
  };
}

/*
 * =========================================================
 * MAP
 * =========================================================
 */

function mapPublicCompany(company) {
  const branding = sanitizeBranding(company);

  const theme = sanitizeTheme(company, branding);

  return {
    id: company.id,

    slug: company.slug,

    name: company.name || "",

    shortName: company.shortName || "",

    brandName: resolveBrandName(company),

    brandSuffix: resolveBrandSuffix(company),

    subtitle: resolveBrandSubtitle(company),

    primaryColor: resolvePrimaryColor(company),

    branding,

    theme,

    sortOrder: company.publicIdentity?.sortOrder ?? company.sortOrder ?? 0,
  };
}

/*
 * =========================================================
 * LIST
 * =========================================================
 */

export async function listPublicCompanies() {
  const companies = await listCompanies();

  return companies
    .filter(
      (company) =>
        !company.deletedAt &&
        company.status === COMPANY_STATUS.ACTIVE &&
        Boolean(company.slug),
    )
    .map(mapPublicCompany)
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }

      return a.name.localeCompare(b.name, "en", {
        sensitivity: "base",
      });
    });
}
