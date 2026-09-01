"use client";

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Globe2,
  LoaderCircle,
  MapPin,
  Palette,
  Plus,
  X,
} from "lucide-react";

import { useState } from "react";

import { toast } from "sonner";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { cn } from "@/utils/cn";

/*
 * =========================================================
 * CONSTANTS
 * =========================================================
 */

const STEPS = [
  {
    key: "identity",

    icon: Building2,
  },

  {
    key: "profile",

    icon: MapPin,
  },

  {
    key: "branding",

    icon: Palette,
  },
];

const INITIAL_FORM = {
  name: "",

  legalName: "",

  shortName: "",

  slug: "",

  status: "active",

  defaultLocale: "en",

  supportedLocales: ["en"],

  profile: {
    email: null,

    phone: null,

    secondaryPhone: null,

    website: null,

    address: {
      en: "",

      th: "",
    },

    businessHours: {
      en: "",

      th: "",
    },
  },

  branding: {
    logoMode: "auto",

    logoLight: null,

    logoDark: null,

    favicon: null,

    textLogo: {
      text: "JUNSEKINO",

      highlight: "",

      separator: " ",
    },

    colors: {
      primary: "#111111",

      secondary: "#ffffff",

      accent: "#d4d4d4",

      background: "#ffffff",

      surface: "#f7f7f7",

      text: "#111111",
    },
  },

  theme: {
    defaultMode: "light",

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
  },
};

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function createInitialForm() {
  return {
    ...INITIAL_FORM,

    supportedLocales: [...INITIAL_FORM.supportedLocales],

    profile: {
      ...INITIAL_FORM.profile,

      address: {
        ...INITIAL_FORM.profile.address,
      },

      businessHours: {
        ...INITIAL_FORM.profile.businessHours,
      },
    },

    branding: {
      ...INITIAL_FORM.branding,

      textLogo: {
        ...INITIAL_FORM.branding.textLogo,
      },

      colors: {
        ...INITIAL_FORM.branding.colors,
      },
    },

    theme: {
      ...INITIAL_FORM.theme,

      light: {
        ...INITIAL_FORM.theme.light,
      },

      dark: {
        ...INITIAL_FORM.theme.dark,
      },
    },
  };
}

function createSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createBrandHighlight(value) {
  return String(value || "")
    .replace(/^junsekino\s*/i, "")
    .trim()
    .toUpperCase();
}

function nullable(value) {
  const normalized = String(value ?? "").trim();

  return normalized || null;
}

function isValidEmail(value) {
  if (!value) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidUrl(value) {
  if (!value) {
    return true;
  }

  try {
    new URL(value);

    return true;
  } catch {
    return false;
  }
}

function isValidHex(value) {
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(
    String(value || "").trim(),
  );
}

/*
 * =========================================================
 * FIELD
 * =========================================================
 */

function Field({
  label,

  value,

  onChange,

  type = "text",

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

function ColorField({
  label,

  value,

  fallback,

  onChange,
}) {
  const pickerValue = isValidHex(value) ? value : fallback;

  return (
    <label className="grid gap-1.5">
      <span className="admin-text-11 font-medium text-[var(--admin-foreground)]">
        {label}
      </span>

      <div className="flex h-11 overflow-hidden rounded-xl border border-[var(--admin-border)]">
        <input
          type="color"
          value={pickerValue}
          onChange={(event) => onChange(event.target.value)}
          className="h-full w-12 cursor-pointer border-0 bg-transparent p-1"
        />

        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="
            min-w-0
            flex-1

            bg-[var(--admin-background)]

            px-3

            admin-text-11
            uppercase

            outline-none
          "
        />
      </div>
    </label>
  );
}

/*
 * =========================================================
 * DIALOG
 * =========================================================
 */

export default function CompanyCreateDialog({
  open,

  onClose,

  onCreated,
}) {
  const { t } = useAdminTranslation();

  const [form, setForm] = useState(createInitialForm);

  const [step, setStep] = useState(0);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  if (!open) {
    return null;
  }

  const currentStep = STEPS[step];

  /*
   * =======================================================
   * UPDATE
   * =======================================================
   */

  function updateRoot(field, value) {
    setForm((current) => {
      const next = {
        ...current,

        [field]: value,
      };

      if (field === "name" && !current.slug) {
        next.slug = createSlug(value);
      }

      if (field === "shortName" && !current.branding.textLogo.highlight) {
        next.branding = {
          ...current.branding,

          textLogo: {
            ...current.branding.textLogo,

            highlight: createBrandHighlight(value),
          },
        };
      }

      return next;
    });
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
          ...current.profile[field],

          [locale]: value,
        },
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

  function updateColor(field, value) {
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

  function toggleThai(enabled) {
    setForm((current) => ({
      ...current,

      supportedLocales: enabled ? ["en", "th"] : ["en"],

      defaultLocale:
        !enabled && current.defaultLocale === "th"
          ? "en"
          : current.defaultLocale,
    }));
  }

  /*
   * =======================================================
   * VALIDATE
   * =======================================================
   */

  function validateStep() {
    if (step === 0) {
      if (!form.name.trim()) {
        setError(t("companyAdmin.create.errors.nameRequired"));

        return false;
      }

      if (!createSlug(form.slug)) {
        setError(t("companyAdmin.create.errors.slugRequired"));

        return false;
      }
    }

    if (step === 1) {
      if (!isValidEmail(form.profile.email)) {
        setError(t("companyAdmin.create.errors.emailInvalid"));

        return false;
      }

      if (!isValidUrl(form.profile.website)) {
        setError(t("companyAdmin.create.errors.websiteInvalid"));

        return false;
      }
    }

    if (step === 2) {
      const colors = [
        form.branding.colors.primary,

        form.branding.colors.secondary,

        form.branding.colors.accent,
      ];

      if (colors.some((color) => !isValidHex(color))) {
        setError(t("companyAdmin.create.errors.colorInvalid"));

        return false;
      }
    }

    setError("");

    return true;
  }

  /*
   * =======================================================
   * NAVIGATION
   * =======================================================
   */

  function next() {
    if (!validateStep()) {
      return;
    }

    setStep((current) =>
      Math.min(
        current + 1,

        STEPS.length - 1,
      ),
    );
  }

  function back() {
    setError("");

    setStep((current) => Math.max(current - 1, 0));
  }

  function reset() {
    setForm(createInitialForm());

    setStep(0);

    setError("");
  }

  function close() {
    if (saving) {
      return;
    }

    reset();

    onClose?.();
  }

  /*
   * =======================================================
   * BOOTSTRAP
   * =======================================================
   */

  async function bootstrapCompany(companyId) {
    const response = await fetch(
      `/api/v1/companies/${encodeURIComponent(companyId)}/bootstrap`,
      {
        method: "POST",

        credentials: "include",
      },
    );

    const payload = await response.json();

    if (!response.ok || payload?.success === false) {
      throw new Error(
        payload?.message || t("companyAdmin.create.errors.bootstrap"),
      );
    }

    return payload.data;
  }

  /*
   * =======================================================
   * CREATE
   * =======================================================
   */

  async function submit(event) {
    event.preventDefault();

    if (step < STEPS.length - 1) {
      next();

      return;
    }

    if (!validateStep() || saving) {
      return;
    }

    setSaving(true);

    setError("");

    let createdCompany = null;

    try {
      const response = await fetch("/api/v1/companies", {
        method: "POST",

        credentials: "include",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          name: form.name.trim(),

          legalName: form.legalName.trim(),

          shortName: form.shortName.trim(),

          slug: createSlug(form.slug),

          status: "active",

          defaultLocale: form.defaultLocale,

          supportedLocales: form.supportedLocales,

          profile: {
            ...form.profile,

            email: nullable(form.profile.email),

            phone: nullable(form.profile.phone),

            secondaryPhone: nullable(form.profile.secondaryPhone),

            website: nullable(form.profile.website),
          },

          branding: form.branding,

          theme: form.theme,
        }),
      });

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.message || t("companyAdmin.create.errors.save"),
        );
      }

      createdCompany = payload.data;

      /*
       * Bootstrap only after Company ID exists.
       *
       * Bootstrap is idempotent and may be
       * called again safely.
       */
      try {
        await bootstrapCompany(createdCompany.id);
      } catch (bootstrapError) {
        /*
         * Company already exists at this point.
         *
         * Do not show "Create failed", otherwise
         * the user may retry and hit duplicate Slug.
         */
        console.error(
          "Bootstrap new company error:",

          bootstrapError,
        );

        toast.warning(
          bootstrapError?.message || t("companyAdmin.create.errors.bootstrap"),
        );
      }

      await onCreated?.(createdCompany);

      toast.success(t("companyAdmin.create.success"));

      reset();

      onClose?.();
    } catch (saveError) {
      console.error(
        "Create company error:",

        saveError,
      );

      /*
       * If Company creation already succeeded,
       * do not encourage duplicate submission.
       */
      if (createdCompany?.id) {
        await onCreated?.(createdCompany);

        reset();

        onClose?.();

        return;
      }

      setError(saveError?.message || t("companyAdmin.create.errors.save"));
    } finally {
      setSaving(false);
    }
  }

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <div
      className="
        fixed
        inset-0
        z-[220]

        flex
        items-center
        justify-center

        bg-black/40

        p-4

        backdrop-blur-sm
      "
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          close();
        }
      }}
    >
      <form
        onSubmit={submit}
        className="
          flex
          max-h-[calc(100svh-32px)]
          w-full
          max-w-3xl
          flex-col

          overflow-hidden

          rounded-2xl

          border
          border-[var(--admin-border)]

          bg-[var(--admin-surface)]

          shadow-2xl
        "
      >
        {/* HEADER */}

        <header className="flex shrink-0 items-start justify-between border-b border-[var(--admin-border)] p-5">
          <div>
            <h2 className="admin-text-18 font-semibold">
              {t("companyAdmin.create.title")}
            </h2>

            <p className="mt-1 admin-text-10 text-[var(--admin-muted)]">
              {t("companyAdmin.create.description")}
            </p>
          </div>

          <button
            type="button"
            onClick={close}
            disabled={saving}
            aria-label={t("common.close")}
            className="flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-[var(--admin-background)]"
          >
            <X size={18} />
          </button>
        </header>

        {/* STEPS */}

        <div className="shrink-0 border-b border-[var(--admin-border)] px-5 py-4">
          <div className="grid grid-cols-3 gap-2">
            {STEPS.map(
              (
                item,

                index,
              ) => {
                const Icon = item.icon;

                const active = index === step;

                const completed = index < step;

                return (
                  <div
                    key={item.key}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-3 py-2 transition",

                      active
                        ? "bg-[var(--company-primary-soft)] text-[var(--company-primary)]"
                        : completed
                          ? "text-[var(--company-primary)]"
                          : "text-[var(--admin-muted)]",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",

                        active || completed
                          ? "border-[var(--company-primary-border)]"
                          : "border-[var(--admin-border)]",
                      )}
                    >
                      {completed ? <Check size={14} /> : <Icon size={14} />}
                    </span>

                    <span className="hidden admin-text-10 font-semibold sm:block">
                      {t(`companyAdmin.create.steps.${item.key}`)}
                    </span>
                  </div>
                );
              },
            )}
          </div>
        </div>

        {/* CONTENT */}

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {/* IDENTITY */}

          {currentStep.key === "identity" ? (
            <div>
              <div className="mb-5">
                <div className="flex items-center gap-2 text-[var(--company-primary)]">
                  <Building2 size={17} />

                  <h3 className="admin-text-14 font-semibold">
                    {t("companyAdmin.create.identity.title")}
                  </h3>
                </div>

                <p className="mt-1 admin-text-10 text-[var(--admin-muted)]">
                  {t("companyAdmin.create.identity.description")}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label={t("companyAdmin.fields.name")}
                  value={form.name}
                  onChange={(value) =>
                    updateRoot(
                      "name",

                      value,
                    )
                  }
                  required
                />

                <Field
                  label={t("companyAdmin.fields.shortName")}
                  value={form.shortName}
                  onChange={(value) =>
                    updateRoot(
                      "shortName",

                      value,
                    )
                  }
                  placeholder="I+D"
                />

                <Field
                  label={t("companyAdmin.fields.slug")}
                  value={form.slug}
                  onChange={(value) =>
                    updateRoot(
                      "slug",

                      createSlug(value),
                    )
                  }
                  required
                  helper={t("companyAdmin.help.slug")}
                />

                <label className="grid gap-1.5">
                  <span className="admin-text-11 font-medium">
                    {t("companyAdmin.fields.defaultLocale")}
                  </span>

                  <select
                    value={form.defaultLocale}
                    onChange={(event) =>
                      updateRoot(
                        "defaultLocale",

                        event.target.value,
                      )
                    }
                    className="h-11 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 admin-text-12 outline-none"
                  >
                    <option value="en">English</option>

                    {form.supportedLocales.includes("th") ? (
                      <option value="th">ไทย</option>
                    ) : null}
                  </select>
                </label>

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
            </div>
          ) : null}

          {/* PROFILE */}

          {currentStep.key === "profile" ? (
            <div>
              <div className="mb-5">
                <div className="flex items-center gap-2 text-[var(--company-primary)]">
                  <MapPin size={17} />

                  <h3 className="admin-text-14 font-semibold">
                    {t("companyAdmin.create.profile.title")}
                  </h3>
                </div>

                <p className="mt-1 admin-text-10 text-[var(--admin-muted)]">
                  {t("companyAdmin.create.profile.description")}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label={t("companyAdmin.fields.legalName")}
                  value={form.legalName}
                  onChange={(value) =>
                    updateRoot(
                      "legalName",

                      value,
                    )
                  }
                />

                <Field
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

                <Field
                  label={t("companyAdmin.profile.phone")}
                  value={form.profile.phone}
                  onChange={(value) =>
                    updateProfile(
                      "phone",

                      value,
                    )
                  }
                />

                <Field
                  label={t("companyAdmin.profile.secondaryPhone")}
                  value={form.profile.secondaryPhone}
                  onChange={(value) =>
                    updateProfile(
                      "secondaryPhone",

                      value,
                    )
                  }
                />

                <Field
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

                <div className="hidden sm:block" />

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
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* BRANDING */}

          {currentStep.key === "branding" ? (
            <div>
              <div className="mb-5">
                <div className="flex items-center gap-2 text-[var(--company-primary)]">
                  <Palette size={17} />

                  <h3 className="admin-text-14 font-semibold">
                    {t("companyAdmin.create.branding.title")}
                  </h3>
                </div>

                <p className="mt-1 admin-text-10 text-[var(--admin-muted)]">
                  {t("companyAdmin.create.branding.description")}
                </p>
              </div>

              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label={t("companyAdmin.logo.text")}
                      value={form.branding.textLogo.text}
                      onChange={(value) =>
                        updateTextLogo(
                          "text",

                          value,
                        )
                      }
                    />

                    <Field
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

                  <div className="grid gap-4 sm:grid-cols-3">
                    <ColorField
                      label={t("companyAdmin.colors.primary")}
                      value={form.branding.colors.primary}
                      fallback="#111111"
                      onChange={(value) =>
                        updateColor(
                          "primary",

                          value,
                        )
                      }
                    />

                    <ColorField
                      label={t("companyAdmin.colors.secondary")}
                      value={form.branding.colors.secondary}
                      fallback="#ffffff"
                      onChange={(value) =>
                        updateColor(
                          "secondary",

                          value,
                        )
                      }
                    />

                    <ColorField
                      label={t("companyAdmin.colors.accent")}
                      value={form.branding.colors.accent}
                      fallback="#d4d4d4"
                      onChange={(value) =>
                        updateColor(
                          "accent",

                          value,
                        )
                      }
                    />
                  </div>
                </div>

                {/* PREVIEW */}

                <div
                  className="rounded-2xl border p-5"
                  style={{
                    borderColor: form.branding.colors.accent,

                    backgroundColor: form.theme.light.background,

                    color: form.theme.light.text,
                  }}
                >
                  <div className="admin-text-9 font-semibold uppercase tracking-[0.12em] opacity-55">
                    {t("companyAdmin.create.branding.preview")}
                  </div>

                  <div className="mt-8 whitespace-nowrap text-[20px] leading-none">
                    <span className="font-normal tracking-[0.085em]">
                      {form.branding.textLogo.text}
                    </span>

                    <span
                      className="ml-2 font-semibold"
                      style={{
                        color: form.branding.colors.primary,
                      }}
                    >
                      {form.branding.textLogo.highlight}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="mt-8 rounded-lg px-4 py-2 admin-text-10 font-semibold"
                    style={{
                      backgroundColor: form.branding.colors.primary,

                      color: form.branding.colors.secondary,
                    }}
                  >
                    {t("companyAdmin.create.branding.button")}
                  </button>

                  <p className="mt-4 admin-text-9 leading-[1.5] opacity-55">
                    {t("companyAdmin.create.branding.logoLater")}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 admin-text-10 text-red-700">
              {error}
            </div>
          ) : null}
        </div>

        {/* FOOTER */}

        <footer className="flex shrink-0 items-center justify-between border-t border-[var(--admin-border)] p-5">
          <button
            type="button"
            onClick={step === 0 ? close : back}
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--admin-border)] px-4 admin-text-11 font-medium transition hover:bg-[var(--admin-hover)] disabled:opacity-50"
          >
            {step === 0 ? (
              t("common.cancel")
            ) : (
              <>
                <ArrowLeft size={15} />

                {t("common.back")}
              </>
            )}
          </button>

          <button
            type="submit"
            disabled={saving}
            className="
              inline-flex
              h-10
              items-center
              gap-2
              rounded-xl

              bg-[var(--company-primary)]

              px-4

              admin-text-11
              font-semibold

              text-[var(--company-primary-foreground)]

              transition

              hover:bg-[var(--company-primary-hover)]

              disabled:opacity-50
            "
          >
            {saving ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : step < STEPS.length - 1 ? (
              <ArrowRight size={15} />
            ) : (
              <Plus size={15} />
            )}

            {saving
              ? t("companyAdmin.create.creating")
              : step < STEPS.length - 1
                ? t("common.next")
                : t("companyAdmin.create.action")}
          </button>
        </footer>
      </form>
    </div>
  );
}
