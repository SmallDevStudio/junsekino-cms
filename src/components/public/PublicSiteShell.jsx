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

  const primaryColor =
    settingsBranding?.colors?.primary ||
    settingsBranding?.primaryColor ||
    companyBranding?.colors?.primary ||
    companyBranding?.primaryColor ||
    fallbackPrimary;

  return {
    primaryColor,

    secondaryColor:
      settingsBranding?.colors?.secondary ||
      companyBranding?.colors?.secondary ||
      "#ffffff",

    accentColor:
      settingsBranding?.colors?.accent ||
      companyBranding?.colors?.accent ||
      "#d4d4d4",

    backgroundColor:
      settingsBranding?.colors?.background ||
      settingsBranding?.backgroundColor ||
      companyBranding?.colors?.background ||
      companyBranding?.backgroundColor ||
      "#ffffff",

    surfaceColor:
      settingsBranding?.colors?.surface ||
      companyBranding?.colors?.surface ||
      "#f7f7f7",

    /*
     * Main readable text stays neutral.
     *
     * Company primary color is reserved
     * for selected navigation, accents,
     * active states and highlights.
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
