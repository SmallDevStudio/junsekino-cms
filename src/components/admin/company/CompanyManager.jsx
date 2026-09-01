"use client";

import {
  Building2,
  CheckCircle2,
  Globe2,
  Image as ImageIcon,
  LoaderCircle,
  MapPin,
  Moon,
  Palette,
  Save,
  Sun,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useCompanyWorkspace } from "@/components/admin/company/CompanyWorkspaceProvider";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import CoverImageField from "@/components/admin/media/CoverImageField";

import { cn } from "@/utils/cn";

import CompanyMarketingEditor from "@/components/admin/company/CompanyMarketingEditor";

/*
 * =========================================================
 * DEFAULTS
 * =========================================================
 */

const DEFAULT_BRAND_COLORS = {
  primary: "#111111",

  secondary: "#ffffff",

  accent: "#d4d4d4",

  background: "#ffffff",

  surface: "#f7f7f7",

  text: "#111111",
};

const DEFAULT_LIGHT_THEME = {
  background: "#ffffff",

  surface: "#f7f7f7",

  text: "#111111",

  mutedText: "#737373",

  border: "#e5e5e5",
};

const DEFAULT_DARK_THEME = {
  background: "#111111",

  surface: "#1c1c1c",

  text: "#ffffff",

  mutedText: "#a3a3a3",

  border: "#333333",
};

const DEFAULT_PROFILE = {
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

const DEFAULT_SOCIAL = {
  facebook: null,
  instagram: null,
  youtube: null,
  linkedin: null,
  tiktok: null,
  x: null,
  pinterest: null,
  line: null,
};

const DEFAULT_LOCALIZED_SEO = {
  title: "",
  description: "",
  keywords: [],
  ogTitle: "",
  ogDescription: "",
  ogImage: null,
};

const DEFAULT_SEO = {
  en: DEFAULT_LOCALIZED_SEO,
  th: DEFAULT_LOCALIZED_SEO,
  index: true,
  follow: true,
};

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function normalizeNullable(value) {
  const normalized = String(value ?? "").trim();

  return normalized || null;
}

function normalizeCompany(value) {
  const company = value || {};

  const branding = company.branding || {};

  const theme = company.theme || {};

  const profile = company.profile || {};

  return {
    name: company.name || "",

    legalName: company.legalName || "",

    shortName: company.shortName || "",

    slug: company.slug || "",

    status: company.status || "active",

    defaultLocale: company.defaultLocale || "en",

    supportedLocales:
      Array.isArray(company.supportedLocales) &&
      company.supportedLocales.length > 0
        ? company.supportedLocales
        : ["en"],

    profile: {
      ...DEFAULT_PROFILE,

      ...profile,

      email: profile.email || company.email || null,

      phone: profile.phone || company.phone || null,

      website: profile.website || company.website || null,

      address: {
        ...DEFAULT_PROFILE.address,

        ...(profile.address || {}),
      },

      businessHours: {
        ...DEFAULT_PROFILE.businessHours,

        ...(profile.businessHours || {}),
      },
    },

    branding: {
      logoMode: branding.logoMode || "auto",

      logoLight: branding.logoLight || null,

      logoDark: branding.logoDark || null,

      favicon: branding.favicon || null,

      textLogo: {
        text: branding.textLogo?.text || "JUNSEKINO",

        highlight:
          branding.textLogo?.highlight ||
          String(company.shortName || company.name || "")
            .replace(/^junsekino\s*/i, "")
            .trim(),

        separator:
          branding.textLogo?.separator !== undefined
            ? branding.textLogo.separator
            : " ",
      },

      colors: {
        ...DEFAULT_BRAND_COLORS,

        ...(company.colors || {}),

        ...(branding.colors || {}),
      },
    },

    theme: {
      defaultMode: theme.defaultMode || "light",

      allowVisitorPreference: theme.allowVisitorPreference === true,

      light: {
        ...DEFAULT_LIGHT_THEME,

        background:
          branding.colors?.background || DEFAULT_LIGHT_THEME.background,

        surface: branding.colors?.surface || DEFAULT_LIGHT_THEME.surface,

        text: branding.colors?.text || DEFAULT_LIGHT_THEME.text,

        ...(theme.light || {}),
      },

      dark: {
        ...DEFAULT_DARK_THEME,

        ...(theme.dark || {}),
      },
    },

    social: {
      ...DEFAULT_SOCIAL,

      ...(company.social || {}),
    },

    seo: {
      ...DEFAULT_SEO,

      ...(company.seo || {}),

      en: {
        ...DEFAULT_LOCALIZED_SEO,

        ...(company.seo?.en || {}),
      },

      th: {
        ...DEFAULT_LOCALIZED_SEO,

        ...(company.seo?.th || {}),
      },

      index: company.seo?.index !== false,

      follow: company.seo?.follow !== false,
    },

    setup: {
      completed: company.setup?.completed === true,

      completedSteps: {
        profile: company.setup?.completedSteps?.profile === true,

        branding: company.setup?.completedSteps?.branding === true,

        contact: company.setup?.completedSteps?.contact === true,

        seo: company.setup?.completedSteps?.seo === true,
      },
    },
  };
}

function isValidHex(value) {
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(
    String(value || "").trim(),
  );
}

function colorPickerValue(value, fallback) {
  return isValidHex(value) ? value : fallback;
}

/*
 * =========================================================
 * FIELD COMPONENTS
 * =========================================================
 */

function SectionHeader({
  icon: Icon,

  title,

  description,
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--company-primary-soft)] text-[var(--company-primary)]">
        <Icon size={17} />
      </span>

      <div>
        <h2 className="admin-text-14 font-semibold text-[var(--admin-foreground)]">
          {title}
        </h2>

        {description ? (
          <p className="mt-1 admin-text-10 leading-[1.6] text-[var(--admin-muted)]">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function TextField({
  label,

  value,

  onChange,

  type = "text",

  disabled = false,

  required = false,

  placeholder = "",

  helper = "",
}) {
  return (
    <label className="grid gap-1.5">
      <span className="admin-text-11 font-medium text-[var(--admin-foreground)]">
        {label}
      </span>

      <input
        type={type}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        className="
          h-11
          w-full
          rounded-xl

          border
          border-[var(--admin-border)]

          bg-[var(--admin-background)]

          px-3

          admin-text-12

          text-[var(--admin-foreground)]

          outline-none
          transition

          placeholder:text-[var(--admin-muted-light)]

          focus:border-[var(--company-primary)]
          focus:ring-2
          focus:ring-[var(--company-primary-soft)]

          disabled:cursor-not-allowed
          disabled:opacity-55
        "
      />

      {helper ? (
        <span className="admin-text-9 leading-[1.5] text-[var(--admin-muted)]">
          {helper}
        </span>
      ) : null}
    </label>
  );
}

function TextareaField({
  label,

  value,

  onChange,

  rows = 4,

  placeholder = "",
}) {
  return (
    <label className="grid gap-1.5">
      <span className="admin-text-11 font-medium text-[var(--admin-foreground)]">
        {label}
      </span>

      <textarea
        rows={rows}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="
          w-full
          resize-y
          rounded-xl

          border
          border-[var(--admin-border)]

          bg-[var(--admin-background)]

          px-3
          py-3

          admin-text-12
          leading-[1.65]

          text-[var(--admin-foreground)]

          outline-none
          transition

          placeholder:text-[var(--admin-muted-light)]

          focus:border-[var(--company-primary)]
          focus:ring-2
          focus:ring-[var(--company-primary-soft)]
        "
      />
    </label>
  );
}

function SelectField({
  label,

  value,

  onChange,

  disabled = false,

  children,

  helper = "",
}) {
  return (
    <label className="grid gap-1.5">
      <span className="admin-text-11 font-medium text-[var(--admin-foreground)]">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="
          h-11
          w-full
          rounded-xl

          border
          border-[var(--admin-border)]

          bg-[var(--admin-background)]

          px-3

          admin-text-12

          text-[var(--admin-foreground)]

          outline-none

          focus:border-[var(--company-primary)]

          disabled:cursor-not-allowed
          disabled:opacity-55
        "
      >
        {children}
      </select>

      {helper ? (
        <span className="admin-text-9 leading-[1.5] text-[var(--admin-muted)]">
          {helper}
        </span>
      ) : null}
    </label>
  );
}

function ColorField({
  label,

  value,

  fallback,

  onChange,

  description = "",
}) {
  return (
    <label className="grid gap-1.5">
      <span className="admin-text-11 font-medium text-[var(--admin-foreground)]">
        {label}
      </span>

      <div className="flex h-11 overflow-hidden rounded-xl border border-[var(--admin-border)]">
        <input
          type="color"
          value={colorPickerValue(
            value,

            fallback,
          )}
          onChange={(event) => onChange(event.target.value)}
          className="h-full w-12 shrink-0 cursor-pointer border-0 bg-transparent p-1"
        />

        <input
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          className="
            min-w-0
            flex-1

            bg-[var(--admin-background)]

            px-3

            admin-text-11
            uppercase

            text-[var(--admin-foreground)]

            outline-none
          "
        />
      </div>

      {description ? (
        <span className="admin-text-9 leading-[1.5] text-[var(--admin-muted)]">
          {description}
        </span>
      ) : null}
    </label>
  );
}

/*
 * =========================================================
 * MANAGER
 * =========================================================
 */

export default function CompanyManager() {
  const {
    activeCompanyId,

    activeCompany,

    isSuperAdmin,

    refreshCompanies,
  } = useCompanyWorkspace();

  const { t } = useAdminTranslation();

  const [form, setForm] = useState(() => normalizeCompany(activeCompany));

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [themePreview, setThemePreview] = useState("light");

  /*
   * =======================================================
   * LOAD
   * =======================================================
   */

  const loadCompany = useCallback(async () => {
    if (!activeCompanyId) {
      return;
    }

    try {
      setLoading(true);

      setError("");

      setSuccess("");

      const response = await fetch(
        `/api/v1/companies/${encodeURIComponent(activeCompanyId)}`,
        {
          method: "GET",

          cache: "no-store",

          credentials: "include",
        },
      );

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || t("companyAdmin.errors.load"));
      }

      setForm(normalizeCompany(payload.data));
    } catch (loadError) {
      console.error(
        "Load company error:",

        loadError,
      );

      setError(loadError?.message || t("companyAdmin.errors.load"));
    } finally {
      setLoading(false);
    }
  }, [activeCompanyId, t]);

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => {
        loadCompany();
      },

      0,
    );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadCompany]);

  /*
   * =======================================================
   * UPDATE
   * =======================================================
   */

  function updateRoot(field, value) {
    setForm((current) => ({
      ...current,

      [field]: value,
    }));
  }

  function updateProfile(field, value) {
    setForm((current) => ({
      ...current,

      profile: {
        ...current.profile,

        [field]: value,
      },
    }));
  }

  function updateProfileLocalized(
    field,

    locale,

    value,
  ) {
    setForm((current) => ({
      ...current,

      profile: {
        ...current.profile,

        [field]: {
          ...current.profile?.[field],

          [locale]: value,
        },
      },
    }));
  }

  function updateBranding(field, value) {
    setForm((current) => ({
      ...current,

      branding: {
        ...current.branding,

        [field]: value,
      },
    }));
  }

  function updateTextLogo(field, value) {
    setForm((current) => ({
      ...current,

      branding: {
        ...current.branding,

        textLogo: {
          ...current.branding.textLogo,

          [field]: value,
        },
      },
    }));
  }

  function updateBrandColor(
    field,

    value,
  ) {
    setForm((current) => ({
      ...current,

      branding: {
        ...current.branding,

        colors: {
          ...current.branding.colors,

          [field]: value,
        },
      },
    }));
  }

  function updateTheme(field, value) {
    setForm((current) => ({
      ...current,

      theme: {
        ...current.theme,

        [field]: value,
      },
    }));
  }

  function updateThemeColor(
    mode,

    field,

    value,
  ) {
    setForm((current) => {
      const next = {
        ...current,

        theme: {
          ...current.theme,

          [mode]: {
            ...current.theme[mode],

            [field]: value,
          },
        },
      };

      /*
       * Keep legacy public colors synchronized
       * with the new Light Theme.
       */
      if (
        mode === "light" &&
        ["background", "surface", "text"].includes(field)
      ) {
        next.branding = {
          ...current.branding,

          colors: {
            ...current.branding.colors,

            [field]: value,
          },
        };
      }

      return next;
    });
  }

  function toggleThai(enabled) {
    setForm((current) => ({
      ...current,

      supportedLocales: enabled
        ? Array.from(new Set([...current.supportedLocales, "th"]))
        : current.supportedLocales.filter((locale) => locale !== "th"),

      defaultLocale:
        !enabled && current.defaultLocale === "th"
          ? "en"
          : current.defaultLocale,
    }));
  }

  /*
   * =======================================================
   * SAVE
   * =======================================================
   */

  async function save(event) {
    event.preventDefault();

    if (!activeCompanyId || saving) {
      return;
    }

    setSaving(true);

    setError("");

    setSuccess("");

    try {
      const body = {
        name: form.name.trim(),

        legalName: form.legalName.trim(),

        shortName: form.shortName.trim(),

        defaultLocale: form.defaultLocale,

        supportedLocales: form.supportedLocales,

        profile: {
          ...form.profile,

          taxId: normalizeNullable(form.profile.taxId),

          registrationNumber: normalizeNullable(
            form.profile.registrationNumber,
          ),

          email: normalizeNullable(form.profile.email),

          phone: normalizeNullable(form.profile.phone),

          secondaryPhone: normalizeNullable(form.profile.secondaryPhone),

          website: normalizeNullable(form.profile.website),

          mapUrl: normalizeNullable(form.profile.mapUrl),

          latitude:
            form.profile.latitude === "" || form.profile.latitude === null
              ? null
              : Number(form.profile.latitude),

          longitude:
            form.profile.longitude === "" || form.profile.longitude === null
              ? null
              : Number(form.profile.longitude),
        },

        branding: form.branding,

        theme: form.theme,

        social: form.social,

        seo: form.seo,
      };

      /*
       * Platform-level fields are controlled
       * only by Superadmin.
       */
      if (isSuperAdmin) {
        body.slug = form.slug.trim().toLowerCase();

        body.status = form.status;
      }

      const response = await fetch(
        `/api/v1/companies/${encodeURIComponent(activeCompanyId)}`,
        {
          method: "PATCH",

          credentials: "include",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(body),
        },
      );

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || t("companyAdmin.errors.save"));
      }

      setForm(normalizeCompany(payload.data));

      setSuccess(t("companyAdmin.saved"));

      await refreshCompanies({
        silent: true,
      });
    } catch (saveError) {
      console.error(
        "Save company error:",

        saveError,
      );

      setError(saveError?.message || t("companyAdmin.errors.save"));
    } finally {
      setSaving(false);
    }
  }

  /*
   * =======================================================
   * THEME PREVIEW
   * =======================================================
   */

  const previewColors = useMemo(
    () => (themePreview === "dark" ? form.theme.dark : form.theme.light),

    [form.theme.dark, form.theme.light, themePreview],
  );

  /*
   * =======================================================
   * LOADING
   * =======================================================
   */

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoaderCircle className="animate-spin text-[var(--company-primary)]" />
      </div>
    );
  }

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <form onSubmit={save} className="mx-auto w-full max-w-6xl space-y-6">
      {/* HEADER */}

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[var(--company-primary)]">
            <Building2 size={18} />

            <span className="admin-text-10 font-semibold uppercase tracking-[0.12em]">
              {t("companyAdmin.eyebrow")}
            </span>
          </div>

          <h1 className="mt-2 admin-text-28 font-semibold tracking-[-0.03em]">
            {t("companyAdmin.title")}
          </h1>

          <p className="mt-1 max-w-[680px] admin-text-12 leading-[1.6] text-[var(--admin-muted)]">
            {t("companyAdmin.description")}
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="
            inline-flex
            h-10
            items-center
            justify-center
            gap-2
            rounded-xl

            bg-[var(--company-primary)]

            px-4

            admin-text-12
            font-semibold

            text-[var(--company-primary-foreground)]

            transition

            hover:bg-[var(--company-primary-hover)]

            disabled:opacity-50
          "
        >
          {saving ? (
            <LoaderCircle size={15} className="animate-spin" />
          ) : (
            <Save size={15} />
          )}

          {t("common.save")}
        </button>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 admin-text-11 text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 admin-text-11 text-emerald-700">
          <CheckCircle2 size={15} />

          {success}
        </div>
      ) : null}

      {/* BASIC INFORMATION */}

      <section className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
        <SectionHeader
          icon={Building2}
          title={t("companyAdmin.sections.basic.title")}
          description={t("companyAdmin.sections.basic.description")}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={t("companyAdmin.fields.name")}
            value={form.name}
            onChange={(value) => updateRoot("name", value)}
            required
          />

          <TextField
            label={t("companyAdmin.fields.shortName")}
            value={form.shortName}
            onChange={(value) =>
              updateRoot(
                "shortName",

                value,
              )
            }
          />

          <TextField
            label={t("companyAdmin.fields.legalName")}
            value={form.legalName}
            onChange={(value) =>
              updateRoot(
                "legalName",

                value,
              )
            }
          />

          <TextField
            label={t("companyAdmin.fields.slug")}
            value={form.slug}
            onChange={(value) => updateRoot("slug", value)}
            disabled={!isSuperAdmin}
            helper={
              isSuperAdmin
                ? t("companyAdmin.help.slug")
                : t("companyAdmin.help.superadminOnly")
            }
          />

          <SelectField
            label={t("companyAdmin.fields.status")}
            value={form.status}
            onChange={(value) => updateRoot("status", value)}
            disabled={!isSuperAdmin}
            helper={!isSuperAdmin ? t("companyAdmin.help.superadminOnly") : ""}
          >
            <option value="active">{t("companyAdmin.status.active")}</option>

            <option value="inactive">
              {t("companyAdmin.status.inactive")}
            </option>

            <option value="archived">
              {t("companyAdmin.status.archived")}
            </option>
          </SelectField>

          <SelectField
            label={t("companyAdmin.fields.defaultLocale")}
            value={form.defaultLocale}
            onChange={(value) =>
              updateRoot(
                "defaultLocale",

                value,
              )
            }
          >
            <option value="en">English</option>

            {form.supportedLocales.includes("th") ? (
              <option value="th">ไทย</option>
            ) : null}
          </SelectField>

          <label className="flex items-center gap-3 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.supportedLocales.includes("th")}
              onChange={(event) => toggleThai(event.target.checked)}
              className="h-4 w-4 accent-[var(--company-primary)]"
            />

            <span className="admin-text-11">
              {t("companyAdmin.fields.enableThai")}
            </span>
          </label>
        </div>
      </section>

      {/* COMPANY PROFILE */}

      <section className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
        <SectionHeader
          icon={MapPin}
          title={t("companyAdmin.sections.profile.title")}
          description={t("companyAdmin.sections.profile.description")}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={t("companyAdmin.profile.taxId")}
            value={form.profile.taxId}
            onChange={(value) =>
              updateProfile(
                "taxId",

                value,
              )
            }
          />

          <TextField
            label={t("companyAdmin.profile.registrationNumber")}
            value={form.profile.registrationNumber}
            onChange={(value) =>
              updateProfile(
                "registrationNumber",

                value,
              )
            }
          />

          <TextField
            label={t("companyAdmin.profile.email")}
            type="email"
            value={form.profile.email}
            onChange={(value) =>
              updateProfile(
                "email",

                value,
              )
            }
          />

          <TextField
            label={t("companyAdmin.profile.phone")}
            value={form.profile.phone}
            onChange={(value) =>
              updateProfile(
                "phone",

                value,
              )
            }
          />

          <TextField
            label={t("companyAdmin.profile.secondaryPhone")}
            value={form.profile.secondaryPhone}
            onChange={(value) =>
              updateProfile(
                "secondaryPhone",

                value,
              )
            }
          />

          <TextField
            label={t("companyAdmin.profile.website")}
            type="url"
            value={form.profile.website}
            onChange={(value) =>
              updateProfile(
                "website",

                value,
              )
            }
            placeholder="https://"
          />

          <div className="sm:col-span-2">
            <div className="grid gap-4 lg:grid-cols-2">
              <TextareaField
                label={t("companyAdmin.profile.addressEn")}
                value={form.profile.address.en}
                onChange={(value) =>
                  updateProfileLocalized(
                    "address",

                    "en",

                    value,
                  )
                }
                rows={4}
              />

              <TextareaField
                label={t("companyAdmin.profile.addressTh")}
                value={form.profile.address.th}
                onChange={(value) =>
                  updateProfileLocalized(
                    "address",

                    "th",

                    value,
                  )
                }
                rows={4}
              />
            </div>
          </div>

          <TextField
            label={t("companyAdmin.profile.mapUrl")}
            type="url"
            value={form.profile.mapUrl}
            onChange={(value) =>
              updateProfile(
                "mapUrl",

                value,
              )
            }
            placeholder="https://maps.google.com/..."
          />

          <div className="grid grid-cols-2 gap-3">
            <TextField
              label={t("companyAdmin.profile.latitude")}
              type="number"
              value={form.profile.latitude ?? ""}
              onChange={(value) =>
                updateProfile(
                  "latitude",

                  value,
                )
              }
            />

            <TextField
              label={t("companyAdmin.profile.longitude")}
              type="number"
              value={form.profile.longitude ?? ""}
              onChange={(value) =>
                updateProfile(
                  "longitude",

                  value,
                )
              }
            />
          </div>

          <TextareaField
            label={t("companyAdmin.profile.businessHoursEn")}
            value={form.profile.businessHours.en}
            onChange={(value) =>
              updateProfileLocalized(
                "businessHours",

                "en",

                value,
              )
            }
            rows={3}
          />

          <TextareaField
            label={t("companyAdmin.profile.businessHoursTh")}
            value={form.profile.businessHours.th}
            onChange={(value) =>
              updateProfileLocalized(
                "businessHours",

                "th",

                value,
              )
            }
            rows={3}
          />
        </div>
      </section>

      {/* LOGO */}

      <section className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
        <SectionHeader
          icon={ImageIcon}
          title={t("companyAdmin.sections.logo.title")}
          description={t("companyAdmin.sections.logo.description")}
        />

        <div className="mb-5 grid gap-4 sm:grid-cols-3">
          <SelectField
            label={t("companyAdmin.logo.mode")}
            value={form.branding.logoMode}
            onChange={(value) =>
              updateBranding(
                "logoMode",

                value,
              )
            }
          >
            <option value="auto">{t("companyAdmin.logo.modes.auto")}</option>

            <option value="image">{t("companyAdmin.logo.modes.image")}</option>

            <option value="text">{t("companyAdmin.logo.modes.text")}</option>
          </SelectField>

          <TextField
            label={t("companyAdmin.logo.text")}
            value={form.branding.textLogo.text}
            onChange={(value) =>
              updateTextLogo(
                "text",

                value,
              )
            }
          />

          <TextField
            label={t("companyAdmin.logo.highlight")}
            value={form.branding.textLogo.highlight}
            onChange={(value) =>
              updateTextLogo(
                "highlight",

                value,
              )
            }
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <CoverImageField
            companyId={activeCompanyId}
            value={form.branding.logoLight}
            onChange={(value) =>
              updateBranding(
                "logoLight",

                value,
              )
            }
            cropPreset="landscape"
            previewClassName="aspect-[4/1] bg-white"
            title={t("companyAdmin.logo.lightTitle")}
            description={t("companyAdmin.logo.lightDescription")}
            emptyTitle={t("companyAdmin.logo.emptyTitle")}
            emptyDescription={t("companyAdmin.logo.emptyDescription")}
            selectLabel={t("companyAdmin.logo.select")}
            pickerTitle={t("companyAdmin.logo.pickerTitle")}
            removable
          />

          <CoverImageField
            companyId={activeCompanyId}
            value={form.branding.logoDark}
            onChange={(value) =>
              updateBranding(
                "logoDark",

                value,
              )
            }
            cropPreset="landscape"
            previewClassName="aspect-[4/1] bg-neutral-950"
            title={t("companyAdmin.logo.darkTitle")}
            description={t("companyAdmin.logo.darkDescription")}
            emptyTitle={t("companyAdmin.logo.emptyTitle")}
            emptyDescription={t("companyAdmin.logo.emptyDescription")}
            selectLabel={t("companyAdmin.logo.select")}
            pickerTitle={t("companyAdmin.logo.pickerTitle")}
            removable
          />
        </div>

        <div className="mt-5 max-w-sm">
          <CoverImageField
            companyId={activeCompanyId}
            value={form.branding.favicon}
            onChange={(value) =>
              updateBranding(
                "favicon",

                value,
              )
            }
            cropPreset="square"
            previewClassName="aspect-square max-w-[160px]"
            title={t("companyAdmin.logo.faviconTitle")}
            description={t("companyAdmin.logo.faviconDescription")}
            emptyTitle={t("companyAdmin.logo.emptyFavicon")}
            emptyDescription={t("companyAdmin.logo.emptyFaviconDescription")}
            selectLabel={t("companyAdmin.logo.select")}
            pickerTitle={t("companyAdmin.logo.faviconPickerTitle")}
            removable
          />
        </div>
      </section>

      {/* BRAND COLORS */}

      <section className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
        <SectionHeader
          icon={Palette}
          title={t("companyAdmin.sections.branding.title")}
          description={t("companyAdmin.sections.branding.description")}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["primary", "#111111"],

            ["secondary", "#ffffff"],

            ["accent", "#d4d4d4"],
          ].map(([field, fallback]) => (
            <ColorField
              key={field}
              label={t(`companyAdmin.colors.${field}`)}
              value={form.branding.colors[field]}
              fallback={fallback}
              onChange={(value) =>
                updateBrandColor(
                  field,

                  value,
                )
              }
              description={t(`companyAdmin.colorHelp.${field}`)}
            />
          ))}
        </div>
      </section>

      {/* PUBLIC THEME */}

      <section className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
        <SectionHeader
          icon={Globe2}
          title={t("companyAdmin.sections.theme.title")}
          description={t("companyAdmin.sections.theme.description")}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label={t("companyAdmin.theme.defaultMode")}
            value={form.theme.defaultMode}
            onChange={(value) =>
              updateTheme(
                "defaultMode",

                value,
              )
            }
          >
            <option value="light">{t("companyAdmin.theme.modes.light")}</option>

            <option value="dark">{t("companyAdmin.theme.modes.dark")}</option>

            <option value="system">
              {t("companyAdmin.theme.modes.system")}
            </option>
          </SelectField>

          <label className="flex items-center gap-3 self-end pb-3">
            <input
              type="checkbox"
              checked={form.theme.allowVisitorPreference}
              onChange={(event) =>
                updateTheme(
                  "allowVisitorPreference",

                  event.target.checked,
                )
              }
              className="h-4 w-4 accent-[var(--company-primary)]"
            />

            <span className="admin-text-11">
              {t("companyAdmin.theme.allowVisitorPreference")}
            </span>
          </label>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            {[
              {
                mode: "light",

                icon: Sun,

                defaults: DEFAULT_LIGHT_THEME,
              },

              {
                mode: "dark",

                icon: Moon,

                defaults: DEFAULT_DARK_THEME,
              },
            ].map(
              ({
                mode,

                icon: ModeIcon,

                defaults,
              }) => (
                <div
                  key={mode}
                  className="rounded-xl border border-[var(--admin-border)] p-4"
                >
                  <div className="mb-4 flex items-center gap-2">
                    <ModeIcon
                      size={16}
                      className="text-[var(--company-primary)]"
                    />

                    <h3 className="admin-text-12 font-semibold">
                      {t(`companyAdmin.theme.${mode}Title`)}
                    </h3>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      "background",

                      "surface",

                      "text",

                      "mutedText",

                      "border",
                    ].map((field) => (
                      <ColorField
                        key={field}
                        label={t(`companyAdmin.theme.colors.${field}`)}
                        value={form.theme[mode][field]}
                        fallback={defaults[field]}
                        onChange={(value) =>
                          updateThemeColor(
                            mode,

                            field,

                            value,
                          )
                        }
                      />
                    ))}
                  </div>
                </div>
              ),
            )}
          </div>

          {/* THEME PREVIEW */}

          <div>
            <div className="mb-3 flex rounded-xl border border-[var(--admin-border)] p-1">
              {[
                ["light", Sun],

                ["dark", Moon],
              ].map(([mode, ModeIcon]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setThemePreview(mode)}
                  className={cn(
                    "flex h-9 flex-1 items-center justify-center gap-2 rounded-lg admin-text-10 font-medium transition",

                    themePreview === mode
                      ? "bg-[var(--company-primary-soft)] text-[var(--company-primary)]"
                      : "text-[var(--admin-muted)]",
                  )}
                >
                  <ModeIcon size={14} />

                  {t(`companyAdmin.theme.modes.${mode}`)}
                </button>
              ))}
            </div>

            <div
              className="overflow-hidden rounded-2xl border p-4 transition-colors"
              style={{
                backgroundColor: previewColors.background,

                color: previewColors.text,

                borderColor: previewColors.border,
              }}
            >
              <div
                className="rounded-xl border p-4"
                style={{
                  backgroundColor: previewColors.surface,

                  borderColor: previewColors.border,
                }}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="text-lg font-semibold tracking-[0.08em]"
                    style={{
                      color: previewColors.text,
                    }}
                  >
                    {form.branding.textLogo.text}

                    <span
                      className="ml-2"
                      style={{
                        color: form.branding.colors.primary,
                      }}
                    >
                      {form.branding.textLogo.highlight}
                    </span>
                  </div>

                  <span
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: form.branding.colors.accent,
                    }}
                  />
                </div>

                <h3 className="mt-8 text-lg font-semibold">
                  {t("companyAdmin.theme.previewTitle")}
                </h3>

                <p
                  className="mt-2 text-sm leading-[1.6]"
                  style={{
                    color: previewColors.mutedText,
                  }}
                >
                  {t("companyAdmin.theme.previewDescription")}
                </p>

                <button
                  type="button"
                  className="mt-5 rounded-lg px-4 py-2 text-sm font-semibold"
                  style={{
                    backgroundColor: form.branding.colors.primary,

                    color: form.branding.colors.secondary,
                  }}
                >
                  {t("companyAdmin.theme.previewAction")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CompanyMarketingEditor
        companyId={activeCompanyId}
        social={form.social}
        seo={form.seo}
        supportedLocales={form.supportedLocales}
        onSocialChange={(social) =>
          setForm((current) => ({
            ...current,

            social,
          }))
        }
        onSeoChange={(seo) =>
          setForm((current) => ({
            ...current,

            seo,
          }))
        }
      />
    </form>
  );
}
