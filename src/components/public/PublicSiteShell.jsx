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

function resolveBranding(company, settings) {
  const settingsBranding = settings?.branding || {};

  const companyBranding = company?.branding || {};

  const fallbackPrimary = getBrandFallback(company);

  /*
   * IMPORTANT
   *
   * Company document is now the primary
   * source of truth for public brand colors.
   *
   * This keeps:
   *
   * - company selector
   * - company switcher
   * - public header
   * - active navigation
   * - slideshow dots
   * - breadcrumbs
   * - project accents
   *
   * using the exact same company color.
   *
   * settings/branding remains as a
   * compatibility fallback for older data.
   */
  const primaryColor =
    companyBranding?.colors?.primary ||
    companyBranding?.primaryColor ||
    settingsBranding?.colors?.primary ||
    settingsBranding?.primaryColor ||
    fallbackPrimary;

  const secondaryColor =
    companyBranding?.colors?.secondary ||
    settingsBranding?.colors?.secondary ||
    "#ffffff";

  const accentColor =
    companyBranding?.colors?.accent ||
    settingsBranding?.colors?.accent ||
    "#d4d4d4";

  const backgroundColor =
    companyBranding?.colors?.background ||
    companyBranding?.backgroundColor ||
    settingsBranding?.colors?.background ||
    settingsBranding?.backgroundColor ||
    "#ffffff";

  const surfaceColor =
    companyBranding?.colors?.surface ||
    settingsBranding?.colors?.surface ||
    "#f7f7f7";

  return {
    primaryColor,

    secondaryColor,

    accentColor,

    backgroundColor,

    surfaceColor,

    /*
     * Normal website copy stays neutral.
     *
     * Brand primary is used for active /
     * highlighted visual states.
     */
    textColor: "#111111",
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
