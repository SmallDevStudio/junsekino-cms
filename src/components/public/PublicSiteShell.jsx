import PublicHeader from "@/components/public/PublicHeader";

import PublicThemeProvider from "@/components/public/PublicThemeProvider";

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
    ...(settings?.social || {}),

    ...(company?.social || {}),
  };
}

function resolvePublicTheme(company, settings) {
  const companyColors = company?.colors || {};

  const companyBranding = company?.branding || {};

  const companyBrandingColors = companyBranding.colors || {};

  const settingsBranding = settings?.branding || {};

  const settingsColors = settingsBranding.colors || {};

  const companyTheme = company?.theme || {};

  const settingsTheme = settings?.theme || {};

  const theme = {
    ...settingsTheme,

    ...companyTheme,

    light: {
      ...(settingsTheme.light || {}),

      ...(companyTheme.light || {}),
    },

    dark: {
      ...(settingsTheme.dark || {}),

      ...(companyTheme.dark || {}),
    },
  };

  const fallbackPrimary = getBrandFallback(company);

  const primary =
    companyColors.primary ||
    companyBrandingColors.primary ||
    companyBranding.primaryColor ||
    settingsColors.primary ||
    settingsBranding.primaryColor ||
    fallbackPrimary;

  const secondary =
    companyColors.secondary ||
    companyBrandingColors.secondary ||
    settingsColors.secondary ||
    "#ffffff";

  const accent =
    companyColors.accent ||
    companyBrandingColors.accent ||
    settingsColors.accent ||
    primary;

  const legacyBackground =
    companyColors.background ||
    companyBrandingColors.background ||
    companyBranding.backgroundColor ||
    settingsColors.background ||
    settingsBranding.backgroundColor ||
    "#ffffff";

  const legacySurface =
    companyColors.surface ||
    companyBrandingColors.surface ||
    settingsColors.surface ||
    "#f7f7f7";

  const legacyText =
    companyColors.text ||
    companyBrandingColors.text ||
    settingsColors.text ||
    "#111111";

  return {
    primary,

    secondary,

    accent,

    defaultMode: ["light", "dark", "system"].includes(theme.defaultMode)
      ? theme.defaultMode
      : "light",

    allowVisitorPreference: theme.allowVisitorPreference === true,

    light: {
      background: theme.light?.background || legacyBackground,

      surface: theme.light?.surface || legacySurface,

      text: theme.light?.text || legacyText,

      mutedText: theme.light?.mutedText || "#737373",

      border: theme.light?.border || "#e5e5e5",
    },

    dark: {
      background: theme.dark?.background || "#111111",

      surface: theme.dark?.surface || "#1a1a1a",

      text: theme.dark?.text || "#f5f5f5",

      mutedText: theme.dark?.mutedText || "#a3a3a3",

      border: theme.dark?.border || "#333333",
    },
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
  const theme = resolvePublicTheme(company, settings);

  const navigation = resolveNavigation(settings);

  const social = resolveSocial(company, settings);

  return (
    <PublicThemeProvider
      companySlug={companySlug}
      defaultMode={theme.defaultMode}
      allowVisitorPreference={theme.allowVisitorPreference}
      primary={theme.primary}
      secondary={theme.secondary}
      accent={theme.accent}
      light={theme.light}
      dark={theme.dark}
    >
      <PublicHeader
        company={company}
        companySlug={companySlug}
        companies={companies}
        navigation={navigation}
        projectCategories={projectCategories}
        social={social}
        primaryColor={theme.primary}
      />

      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
    </PublicThemeProvider>
  );
}
