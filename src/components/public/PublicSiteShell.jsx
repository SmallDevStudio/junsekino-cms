import PublicHeader from "@/components/public/PublicHeader";

import { DEFAULT_COMPANY_NAVIGATION } from "@/constants/company-defaults";

function resolveBrandSuffix(company) {
  const value = company?.shortName || company?.name || "";

  return String(value)
    .replace(/^junsekino\s*/i, "")
    .trim()
    .toUpperCase();
}

function getBrandFallback(company) {
  const suffix = resolveBrandSuffix(company);

  if (suffix === "I+D") {
    return "#800000";
  }

  if (suffix === "A+D") {
    return "#FE9800";
  }

  return "#000000";
}

/*
 * =========================================================
 * BRANDING
 * =========================================================
 *
 * Source priority:
 *
 * 1. company.colors
 * 2. company.branding.colors
 * 3. company.branding legacy fields
 * 4. settings.branding.colors
 * 5. settings legacy fields
 * 6. company suffix fallback
 *
 * Firestore current structure:
 *
 * company.colors.primary
 *
 * therefore company.colors MUST be
 * treated as the primary source.
 * =========================================================
 */

function resolveBranding(company, settings) {
  const companyColors = company?.colors || {};

  const companyBranding = company?.branding || {};

  const companyBrandingColors = companyBranding?.colors || {};

  const settingsBranding = settings?.branding || {};

  const settingsColors = settingsBranding?.colors || {};

  const fallbackPrimary = getBrandFallback(company);

  const primaryColor =
    companyColors.primary ||
    companyBrandingColors.primary ||
    companyBranding.primaryColor ||
    settingsColors.primary ||
    settingsBranding.primaryColor ||
    fallbackPrimary;

  const secondaryColor =
    companyColors.secondary ||
    companyBrandingColors.secondary ||
    settingsColors.secondary ||
    "#ffffff";

  const accentColor =
    companyColors.accent ||
    companyBrandingColors.accent ||
    settingsColors.accent ||
    primaryColor;

  const backgroundColor =
    companyColors.background ||
    companyBrandingColors.background ||
    companyBranding.backgroundColor ||
    settingsColors.background ||
    settingsBranding.backgroundColor ||
    "#ffffff";

  const surfaceColor =
    companyColors.surface ||
    companyBrandingColors.surface ||
    settingsColors.surface ||
    "#f7f7f7";

  /*
   * Normal copy stays neutral.
   *
   * Brand color is reserved for:
   *
   * active navigation
   * breadcrumb
   * title
   * like
   * filter
   * interaction accents
   */
  const textColor = "#111111";

  return {
    primaryColor,
    secondaryColor,
    accentColor,
    backgroundColor,
    surfaceColor,
    textColor,
  };
}

function resolveNavigation(settings) {
  const navigation = settings?.navigation;

  if (Array.isArray(navigation)) {
    return navigation;
  }

  if (Array.isArray(navigation?.items)) {
    return navigation.items;
  }

  return DEFAULT_COMPANY_NAVIGATION;
}

function resolveSocial(company, settings) {
  return {
    ...(company?.social || {}),
    ...(settings?.social || {}),
  };
}

export default function PublicSiteShell({
  company,

  settings,

  companySlug,

  companies = [],

  projectCategories = [],

  children,
}) {
  const branding = resolveBranding(company, settings);

  const navigation = resolveNavigation(settings);

  const social = resolveSocial(company, settings);

  return (
    <div
      className="
        flex
        min-h-svh
        flex-col
      "
      style={{
        /*
         * =================================================
         * PUBLIC DESIGN TOKENS
         * =================================================
         */

        "--public-primary": branding.primaryColor,

        "--public-secondary": branding.secondaryColor,

        "--public-accent": branding.accentColor,

        "--public-background": branding.backgroundColor,

        "--public-surface": branding.surfaceColor,

        "--public-foreground": branding.textColor,

        backgroundColor: "var(--public-background)",

        color: "var(--public-foreground)",
      }}
    >
      <PublicHeader
        company={company}
        companySlug={companySlug}
        companies={companies}
        navigation={navigation}
        projectCategories={projectCategories}
        social={social}
        primaryColor={branding.primaryColor}
      />

      <main
        className="
          flex
          min-h-0
          flex-1
          flex-col
        "
      >
        {children}
      </main>
    </div>
  );
}
