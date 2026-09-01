import "server-only";

import {
  COMPANY_LOGO_MODE,
  DEFAULT_COMPANY_BRANDING,
  DEFAULT_COMPANY_LOCALE,
  DEFAULT_COMPANY_LOCALES,
  DEFAULT_COMPANY_PROFILE,
  DEFAULT_COMPANY_SEO,
  DEFAULT_COMPANY_SETUP,
  DEFAULT_COMPANY_SOCIAL,
  DEFAULT_COMPANY_THEME,
} from "@/constants/company";

import {
  createCompanyRecord,
  getCompanyById,
  listCompanies,
  softDeleteCompanyRecord,
  updateCompanyRecord,
} from "./company.repository";

import { getMembership } from "@/modules/user/membership.repository";

import { AUDIT_ACTIONS, createAuditLog } from "@/modules/audit/audit.service";

import { serializeFirestoreDocument } from "@/utils/firestore";

/*
 * =========================================================
 * BASIC NORMALIZATION
 * =========================================================
 */

function normalizeNullableValue(value) {
  if (value === "" || value === undefined) {
    return null;
  }

  return value;
}

function normalizeNullableObjectValues(value = {}) {
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      normalizeNullableValue(item),
    ]),
  );
}

function mergeLocalized(defaultValue = {}, value = {}) {
  return {
    en: value?.en ?? defaultValue?.en ?? "",

    th: value?.th ?? defaultValue?.th ?? "",
  };
}

/*
 * =========================================================
 * PROFILE
 * =========================================================
 */

function mergeProfile(profile = {}, legacyCompany = {}) {
  return {
    ...DEFAULT_COMPANY_PROFILE,

    ...normalizeNullableObjectValues(profile),

    /*
     * Legacy fallback.
     *
     * Existing company records may still contain
     * email, phone, address or website at root level.
     */
    email: normalizeNullableValue(
      profile.email ?? legacyCompany.email ?? DEFAULT_COMPANY_PROFILE.email,
    ),

    phone: normalizeNullableValue(
      profile.phone ?? legacyCompany.phone ?? DEFAULT_COMPANY_PROFILE.phone,
    ),

    secondaryPhone: normalizeNullableValue(
      profile.secondaryPhone ?? DEFAULT_COMPANY_PROFILE.secondaryPhone,
    ),

    website: normalizeNullableValue(
      profile.website ??
        legacyCompany.website ??
        DEFAULT_COMPANY_PROFILE.website,
    ),

    address: mergeLocalized(
      DEFAULT_COMPANY_PROFILE.address,

      profile.address ||
        (legacyCompany.address
          ? {
              en:
                typeof legacyCompany.address === "string"
                  ? legacyCompany.address
                  : legacyCompany.address?.en || "",

              th:
                typeof legacyCompany.address === "object"
                  ? legacyCompany.address?.th || ""
                  : "",
            }
          : {}),
    ),

    businessHours: mergeLocalized(
      DEFAULT_COMPANY_PROFILE.businessHours,

      profile.businessHours,
    ),

    mapUrl: normalizeNullableValue(
      profile.mapUrl ?? legacyCompany.mapUrl ?? DEFAULT_COMPANY_PROFILE.mapUrl,
    ),

    latitude:
      profile.latitude ??
      legacyCompany.latitude ??
      DEFAULT_COMPANY_PROFILE.latitude,

    longitude:
      profile.longitude ??
      legacyCompany.longitude ??
      DEFAULT_COMPANY_PROFILE.longitude,
  };
}

/*
 * =========================================================
 * BRANDING
 * =========================================================
 */

function mergeBranding(branding = {}) {
  const allowedLogoModes = Object.values(COMPANY_LOGO_MODE);

  const logoMode = allowedLogoModes.includes(branding.logoMode)
    ? branding.logoMode
    : DEFAULT_COMPANY_BRANDING.logoMode;

  return {
    ...DEFAULT_COMPANY_BRANDING,

    ...branding,

    logoMode,

    logoLight: normalizeNullableValue(branding.logoLight),

    logoDark: normalizeNullableValue(branding.logoDark),

    favicon: normalizeNullableValue(branding.favicon),

    textLogo: {
      ...DEFAULT_COMPANY_BRANDING.textLogo,

      ...(branding.textLogo || {}),
    },

    colors: {
      ...DEFAULT_COMPANY_BRANDING.colors,

      ...(branding.colors || {}),
    },
  };
}

/*
 * =========================================================
 * THEME
 * =========================================================
 */

function createLegacyLightTheme(branding = {}) {
  const colors = branding?.colors || {};

  return {
    ...DEFAULT_COMPANY_THEME.light,

    background: colors.background || DEFAULT_COMPANY_THEME.light.background,

    surface: colors.surface || DEFAULT_COMPANY_THEME.light.surface,

    text: colors.text || DEFAULT_COMPANY_THEME.light.text,
  };
}

function mergeTheme(theme = {}, branding = {}) {
  return {
    ...DEFAULT_COMPANY_THEME,

    ...theme,

    defaultMode: theme.defaultMode || DEFAULT_COMPANY_THEME.defaultMode,

    allowVisitorPreference:
      typeof theme.allowVisitorPreference === "boolean"
        ? theme.allowVisitorPreference
        : DEFAULT_COMPANY_THEME.allowVisitorPreference,

    light: {
      ...createLegacyLightTheme(branding),

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
 * SOCIAL
 * =========================================================
 */

function normalizeSocial(social = {}) {
  return {
    ...DEFAULT_COMPANY_SOCIAL,

    ...Object.fromEntries(
      Object.entries(social).map(([key, value]) => [
        key,
        normalizeNullableValue(value),
      ]),
    ),
  };
}

/*
 * =========================================================
 * SEO
 * =========================================================
 */

function mergeSeo(seo = {}) {
  return {
    ...DEFAULT_COMPANY_SEO,

    ...seo,

    th: {
      ...DEFAULT_COMPANY_SEO.th,

      ...(seo.th || {}),
    },

    en: {
      ...DEFAULT_COMPANY_SEO.en,

      ...(seo.en || {}),
    },
  };
}

/*
 * =========================================================
 * SETUP
 * =========================================================
 */

function hasProfileData(profile) {
  return Boolean(
    profile.email ||
    profile.phone ||
    profile.website ||
    profile.address?.en?.trim() ||
    profile.address?.th?.trim(),
  );
}

function hasCustomBranding(branding) {
  return Boolean(
    branding.logoLight ||
    branding.logoDark ||
    branding.favicon ||
    branding.textLogo?.text?.trim() ||
    branding.textLogo?.highlight?.trim() ||
    branding.logoMode !== DEFAULT_COMPANY_BRANDING.logoMode ||
    branding.colors?.primary !== DEFAULT_COMPANY_BRANDING.colors.primary,
  );
}

function hasSeoData(seo) {
  return Boolean(
    seo.en?.title?.trim() ||
    seo.en?.description?.trim() ||
    seo.th?.title?.trim() ||
    seo.th?.description?.trim(),
  );
}

function mergeSetup(setup = {}, { profile, branding, seo } = {}) {
  const completedSteps = {
    ...DEFAULT_COMPANY_SETUP.completedSteps,

    profile: hasProfileData(profile),

    branding: hasCustomBranding(branding),

    seo: hasSeoData(seo),

    ...(setup.completedSteps || {}),
  };

  const completed =
    typeof setup.completed === "boolean"
      ? setup.completed
      : Object.values(completedSteps).every(Boolean);

  return {
    ...DEFAULT_COMPANY_SETUP,

    ...setup,

    completed,

    completedSteps,
  };
}

/*
 * =========================================================
 * COMPANY NORMALIZATION
 * =========================================================
 */

function normalizeCompanyRecord(company = {}) {
  const branding = mergeBranding(company.branding);

  const profile = mergeProfile(company.profile, company);

  const theme = mergeTheme(company.theme, branding);

  const social = normalizeSocial(company.social);

  const seo = mergeSeo(company.seo);

  const setup = mergeSetup(company.setup, {
    profile,

    branding,

    seo,
  });

  return {
    ...company,

    defaultLocale: company.defaultLocale || DEFAULT_COMPANY_LOCALE,

    supportedLocales:
      Array.isArray(company.supportedLocales) &&
      company.supportedLocales.length > 0
        ? company.supportedLocales
        : DEFAULT_COMPANY_LOCALES,

    profile,

    branding,

    theme,

    social,

    seo,

    setup,
  };
}

function serializeCompany(company) {
  return serializeFirestoreDocument(normalizeCompanyRecord(company));
}

/*
 * =========================================================
 * ACCESS HELPERS
 * =========================================================
 */

function isAvailableCompany(company) {
  return company && !company.deletedAt && company.status !== "archived";
}

function isActiveMembership(membership) {
  return Boolean(
    membership && !membership.deletedAt && membership.status === "active",
  );
}

/*
 * =========================================================
 * LIST
 * =========================================================
 */

export async function getCompanies() {
  const companies = await listCompanies();

  return companies.map(serializeCompany);
}

export async function getCompaniesForUser({ currentUser }) {
  const companies = await listCompanies();

  const availableCompanies = companies.filter(isAvailableCompany);

  if (currentUser.isSuperAdmin) {
    return availableCompanies.map((company) => ({
      ...serializeCompany(company),

      membership: {
        role: "SUPERADMIN",

        status: "active",

        permissions: ["*"],
      },
    }));
  }

  const scopedCompanies = (
    await Promise.all(
      availableCompanies.map(async (company) => {
        const membership = await getMembership({
          companyId: company.id,

          uid: currentUser.uid,
        });

        if (!isActiveMembership(membership)) {
          return null;
        }

        return {
          ...serializeCompany(company),

          membership: serializeFirestoreDocument(membership),
        };
      }),
    )
  ).filter(Boolean);

  return scopedCompanies;
}

/*
 * =========================================================
 * GET
 * =========================================================
 */

export async function getCompany(companyId) {
  const company = await getCompanyById(companyId);

  if (!company || company.deletedAt) {
    throw new Error("COMPANY_NOT_FOUND");
  }

  return serializeCompany(company);
}

/*
 * =========================================================
 * CREATE
 * =========================================================
 */

export async function createCompany({ input, currentUser }) {
  const supportedLocales = input.supportedLocales || DEFAULT_COMPANY_LOCALES;

  const defaultLocale = input.defaultLocale || DEFAULT_COMPANY_LOCALE;

  if (!supportedLocales.includes(defaultLocale)) {
    throw new Error("DEFAULT_LOCALE_NOT_SUPPORTED");
  }

  const profile = mergeProfile(input.profile);

  const branding = mergeBranding(input.branding);

  const theme = mergeTheme(input.theme, branding);

  const social = normalizeSocial(input.social);

  const seo = mergeSeo(input.seo);

  const setup = mergeSetup(input.setup, {
    profile,

    branding,

    seo,
  });

  const companyData = {
    name: input.name,

    legalName: input.legalName || "",

    shortName: input.shortName || "",

    slug: input.slug.toLowerCase(),

    status: input.status || "active",

    defaultLocale,

    supportedLocales,

    profile,

    branding,

    theme,

    social,

    seo,

    setup,
  };

  const company = await createCompanyRecord({
    data: companyData,

    userId: currentUser.uid,
  });

  await createAuditLog({
    userId: currentUser.uid,

    companyId: company.id,

    action: AUDIT_ACTIONS.COMPANY_CREATE,

    resource: "company",

    resourceId: company.id,

    before: null,

    after: serializeCompany(company),
  });

  return serializeCompany(company);
}

/*
 * =========================================================
 * UPDATE
 * =========================================================
 */

export async function updateCompany({ companyId, input, currentUser }) {
  const existing = await getCompanyById(companyId);

  if (!existing || existing.deletedAt) {
    throw new Error("COMPANY_NOT_FOUND");
  }

  const normalizedExisting = normalizeCompanyRecord(existing);

  const defaultLocale = input.defaultLocale ?? normalizedExisting.defaultLocale;

  const supportedLocales =
    input.supportedLocales ?? normalizedExisting.supportedLocales;

  if (!supportedLocales.includes(defaultLocale)) {
    throw new Error("DEFAULT_LOCALE_NOT_SUPPORTED");
  }

  const updateData = {
    ...input,
  };

  if (input.slug) {
    updateData.slug = input.slug.toLowerCase();
  }

  if (input.profile) {
    updateData.profile = mergeProfile(
      {
        ...normalizedExisting.profile,

        ...input.profile,

        address: {
          ...normalizedExisting.profile.address,

          ...(input.profile.address || {}),
        },

        businessHours: {
          ...normalizedExisting.profile.businessHours,

          ...(input.profile.businessHours || {}),
        },
      },

      existing,
    );
  }

  if (input.branding) {
    updateData.branding = mergeBranding({
      ...normalizedExisting.branding,

      ...input.branding,

      colors: {
        ...normalizedExisting.branding.colors,

        ...(input.branding.colors || {}),
      },
    });
  }

  const nextBranding = updateData.branding || normalizedExisting.branding;

  if (input.theme) {
    updateData.theme = mergeTheme(
      {
        ...normalizedExisting.theme,

        ...input.theme,

        light: {
          ...normalizedExisting.theme.light,

          ...(input.theme.light || {}),
        },

        dark: {
          ...normalizedExisting.theme.dark,

          ...(input.theme.dark || {}),
        },
      },

      nextBranding,
    );
  }

  if (input.social) {
    updateData.social = normalizeSocial({
      ...normalizedExisting.social,

      ...input.social,
    });
  }

  if (input.seo) {
    updateData.seo = mergeSeo({
      ...normalizedExisting.seo,

      ...input.seo,

      th: {
        ...normalizedExisting.seo.th,

        ...(input.seo.th || {}),
      },

      en: {
        ...normalizedExisting.seo.en,

        ...(input.seo.en || {}),
      },
    });
  }

  const nextProfile = updateData.profile || normalizedExisting.profile;

  const nextTheme = updateData.theme || normalizedExisting.theme;

  const nextSocial = updateData.social || normalizedExisting.social;

  const nextSeo = updateData.seo || normalizedExisting.seo;

  updateData.setup = mergeSetup(
    {
      ...normalizedExisting.setup,

      ...(input.setup || {}),

      completedSteps: {
        ...normalizedExisting.setup.completedSteps,

        ...(input.setup?.completedSteps || {}),
      },
    },

    {
      profile: nextProfile,

      branding: nextBranding,

      theme: nextTheme,

      social: nextSocial,

      seo: nextSeo,
    },
  );

  const result = await updateCompanyRecord({
    companyId,

    data: updateData,

    userId: currentUser.uid,
  });

  await createAuditLog({
    userId: currentUser.uid,

    companyId,

    action: AUDIT_ACTIONS.COMPANY_UPDATE,

    resource: "company",

    resourceId: companyId,

    before: serializeCompany(result.before),

    after: serializeCompany(result.after),
  });

  return serializeCompany(result.after);
}

/*
 * =========================================================
 * DELETE
 * =========================================================
 */

export async function deleteCompany({ companyId, currentUser }) {
  const before = await softDeleteCompanyRecord({
    companyId,

    userId: currentUser.uid,
  });

  await createAuditLog({
    userId: currentUser.uid,

    companyId,

    action: AUDIT_ACTIONS.COMPANY_DELETE,

    resource: "company",

    resourceId: companyId,

    before: serializeCompany(before),

    after: {
      deleted: true,
    },
  });

  return {
    id: companyId,

    deleted: true,
  };
}
