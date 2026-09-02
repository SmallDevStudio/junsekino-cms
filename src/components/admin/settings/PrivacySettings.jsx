"use client";

import {
  Cookie,
  Database,
  LoaderCircle,
  Save,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";

import { useEffect, useState } from "react";

import { toast } from "sonner";

import { useCompanyWorkspace } from "@/components/admin/company/CompanyWorkspaceProvider";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { cn } from "@/utils/cn";

/*
 * =========================================================
 * CONSTANTS
 * =========================================================
 */

const COOKIE_CATEGORY_KEYS = [
  "necessary",
  "analytics",
  "functional",
  "marketing",
];

const BANNER_FIELD_KEYS = [
  "title",
  "description",
  "acceptAll",
  "rejectOptional",
  "preferences",
  "savePreferences",
  "privacyLink",
  "cookieLink",
];

const RIGHTS_KEYS = [
  "allowAccessRequest",
  "allowCorrectionRequest",
  "allowDeletionRequest",
  "allowConsentWithdrawal",
  "allowDataPortabilityRequest",
];

const RETENTION_FIELDS = [
  {
    key: "consentRecordDays",
    min: 30,
    max: 3650,
  },
  {
    key: "analyticsRawDays",
    min: 1,
    max: 365,
  },
  {
    key: "analyticsAggregateMonths",
    min: 1,
    max: 60,
  },
  {
    key: "formSubmissionDays",
    min: 30,
    max: 3650,
  },
  {
    key: "securityLogDays",
    min: 30,
    max: 3650,
  },
];

const INITIAL_SETTINGS = {
  showCookieBanner: true,

  allowRejectOptional: true,

  showPreferences: true,

  cookieBanner: {
    en: {},
    th: {},
  },

  categories: {
    necessary: {
      enabled: true,
      title: {
        en: "",
        th: "",
      },
      description: {
        en: "",
        th: "",
      },
    },

    analytics: {
      enabled: true,
      title: {
        en: "",
        th: "",
      },
      description: {
        en: "",
        th: "",
      },
    },

    functional: {
      enabled: true,
      title: {
        en: "",
        th: "",
      },
      description: {
        en: "",
        th: "",
      },
    },

    marketing: {
      enabled: false,
      title: {
        en: "",
        th: "",
      },
      description: {
        en: "",
        th: "",
      },
    },
  },

  consentManagement: {
    enabled: true,

    version: 1,

    cookieMaxAgeDays: 180,

    renewOnPolicyChange: true,

    recordProof: true,

    anonymizeTechnicalData: true,
  },

  retention: {
    consentRecordDays: 730,

    analyticsRawDays: 90,

    analyticsAggregateMonths: 25,

    formSubmissionDays: 730,

    securityLogDays: 365,
  },

  dataSubjectRights: {
    enabled: true,

    requestEmail: "",

    responseDays: 30,

    allowAccessRequest: true,

    allowCorrectionRequest: true,

    allowDeletionRequest: true,

    allowConsentWithdrawal: true,

    allowDataPortabilityRequest: true,

    instructions: {
      en: "",
      th: "",
    },
  },

  privacyContact: {
    companyName: {
      en: "",
      th: "",
    },

    address: {
      en: "",
      th: "",
    },

    email: "",

    phone: "",

    dpoEmail: "",
  },
};

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function normalizeLocalized(value = {}) {
  return {
    en: value?.en || "",
    th: value?.th || "",
  };
}

function normalizeCategory(category = {}, fallback = {}) {
  return {
    enabled:
      typeof category?.enabled === "boolean"
        ? category.enabled
        : fallback.enabled,

    title: normalizeLocalized(category?.title),

    description: normalizeLocalized(category?.description),
  };
}

function normalizeSettings(value = {}) {
  return {
    showCookieBanner: value.showCookieBanner !== false,

    allowRejectOptional: value.allowRejectOptional !== false,

    showPreferences: value.showPreferences !== false,

    cookieBanner: {
      en: {
        ...(value.cookieBanner?.en || {}),
      },

      th: {
        ...(value.cookieBanner?.th || {}),
      },
    },

    categories: {
      necessary: {
        ...normalizeCategory(value.categories?.necessary, {
          enabled: true,
        }),

        enabled: true,
      },

      analytics: normalizeCategory(value.categories?.analytics, {
        enabled: true,
      }),

      functional: normalizeCategory(value.categories?.functional, {
        enabled: true,
      }),

      marketing: normalizeCategory(value.categories?.marketing, {
        enabled: false,
      }),
    },

    consentManagement: {
      ...INITIAL_SETTINGS.consentManagement,
      ...(value.consentManagement || {}),
    },

    retention: {
      ...INITIAL_SETTINGS.retention,
      ...(value.retention || {}),
    },

    dataSubjectRights: {
      ...INITIAL_SETTINGS.dataSubjectRights,
      ...(value.dataSubjectRights || {}),

      requestEmail: value.dataSubjectRights?.requestEmail || "",

      instructions: normalizeLocalized(value.dataSubjectRights?.instructions),
    },

    privacyContact: {
      ...INITIAL_SETTINGS.privacyContact,
      ...(value.privacyContact || {}),

      companyName: normalizeLocalized(value.privacyContact?.companyName),

      address: normalizeLocalized(value.privacyContact?.address),

      email: value.privacyContact?.email || "",

      phone: value.privacyContact?.phone || "",

      dpoEmail: value.privacyContact?.dpoEmail || "",
    },
  };
}

function createPayload(form) {
  return {
    showCookieBanner: form.showCookieBanner,

    allowRejectOptional: form.allowRejectOptional,

    showPreferences: form.showPreferences,

    cookieBanner: {
      en: {
        ...form.cookieBanner.en,
      },

      th: {
        ...form.cookieBanner.th,
      },
    },

    categories: {
      necessary: {
        enabled: true,

        title: form.categories.necessary.title,

        description: form.categories.necessary.description,
      },

      analytics: {
        enabled: form.categories.analytics.enabled,

        title: form.categories.analytics.title,

        description: form.categories.analytics.description,
      },

      functional: {
        enabled: form.categories.functional.enabled,

        title: form.categories.functional.title,

        description: form.categories.functional.description,
      },

      marketing: {
        enabled: form.categories.marketing.enabled,

        title: form.categories.marketing.title,

        description: form.categories.marketing.description,
      },
    },

    consentManagement: {
      enabled: form.consentManagement.enabled,

      version: Number(form.consentManagement.version),

      cookieMaxAgeDays: Number(form.consentManagement.cookieMaxAgeDays),

      renewOnPolicyChange: form.consentManagement.renewOnPolicyChange,

      recordProof: form.consentManagement.recordProof,

      anonymizeTechnicalData: form.consentManagement.anonymizeTechnicalData,
    },

    retention: Object.fromEntries(
      RETENTION_FIELDS.map(({ key }) => [key, Number(form.retention[key])]),
    ),

    dataSubjectRights: {
      enabled: form.dataSubjectRights.enabled,

      requestEmail: form.dataSubjectRights.requestEmail.trim(),

      responseDays: Number(form.dataSubjectRights.responseDays),

      allowAccessRequest: form.dataSubjectRights.allowAccessRequest,

      allowCorrectionRequest: form.dataSubjectRights.allowCorrectionRequest,

      allowDeletionRequest: form.dataSubjectRights.allowDeletionRequest,

      allowConsentWithdrawal: form.dataSubjectRights.allowConsentWithdrawal,

      allowDataPortabilityRequest:
        form.dataSubjectRights.allowDataPortabilityRequest,

      instructions: form.dataSubjectRights.instructions,
    },

    privacyContact: {
      companyName: form.privacyContact.companyName,

      address: form.privacyContact.address,

      email: form.privacyContact.email.trim(),

      phone: form.privacyContact.phone.trim(),

      dpoEmail: form.privacyContact.dpoEmail.trim(),
    },
  };
}

/*
 * =========================================================
 * UI HELPERS
 * =========================================================
 */

function Section({ icon: Icon, title, description, children }) {
  return (
    <section
      className="
        border-b
        border-[var(--admin-border)]

        px-5
        py-6

        last:border-b-0

        sm:px-6
      "
    >
      <div className="flex items-start gap-3">
        <div
          className="
            flex
            h-10
            w-10
            shrink-0

            items-center
            justify-center

            rounded-xl

            bg-[var(--company-primary-soft)]

            text-[var(--company-primary)]
          "
        >
          <Icon size={17} />
        </div>

        <div className="min-w-0">
          <h3 className="admin-text-14 font-semibold text-[var(--admin-foreground)]">
            {title}
          </h3>

          <p
            className="
              mt-1

              admin-text-10
              leading-[1.6]

              text-[var(--admin-muted)]
            "
          >
            {description}
          </p>
        </div>
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}

function Toggle({ checked, onChange, title, description, disabled = false }) {
  return (
    <label
      className={cn(
        "flex items-start justify-between gap-4",

        "rounded-xl",

        "border border-[var(--admin-border)]",

        "bg-[var(--admin-background)]",

        "px-4 py-3.5",

        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
      )}
    >
      <span className="min-w-0">
        <span className="block admin-text-11 font-medium text-[var(--admin-foreground)]">
          {title}
        </span>

        {description ? (
          <span
            className="
              mt-1
              block

              admin-text-9
              leading-[1.55]

              text-[var(--admin-muted)]
            "
          >
            {description}
          </span>
        ) : null}
      </span>

      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />

        <span
          className="
            h-6
            w-11

            rounded-full

            bg-[var(--admin-border)]

            transition

            peer-checked:bg-[var(--company-primary)]

            peer-focus-visible:ring-2
            peer-focus-visible:ring-[var(--company-primary)]
            peer-focus-visible:ring-offset-2
          "
        />

        <span
          className="
            pointer-events-none

            absolute
            left-1
            top-1

            h-4
            w-4

            rounded-full

            bg-white

            shadow-sm

            transition-transform

            peer-checked:translate-x-5
          "
        />
      </span>
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  min,
  max,
  description,
  multiline = false,
  disabled = false,
}) {
  const className = `
    w-full

    rounded-xl

    border
    border-[var(--admin-border)]

    bg-[var(--admin-background)]

    px-3

    admin-text-11
    text-[var(--admin-foreground)]

    outline-none

    transition

    placeholder:text-[var(--admin-muted)]

    focus:border-[var(--company-primary)]
    focus:ring-2
    focus:ring-[var(--company-primary-soft)]

    disabled:cursor-not-allowed
    disabled:opacity-60
  `;

  return (
    <label className="grid gap-1.5">
      <span className="admin-text-10 font-medium text-[var(--admin-foreground)]">
        {label}
      </span>

      {multiline ? (
        <textarea
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          className={cn(className, "resize-y py-3")}
        />
      ) : (
        <input
          type={type}
          value={value}
          min={min}
          max={max}
          disabled={disabled}
          onChange={(event) =>
            onChange(
              type === "number"
                ? Number(event.target.value)
                : event.target.value,
            )
          }
          className={cn(className, "h-11")}
        />
      )}

      {description ? (
        <span
          className="
            admin-text-9
            leading-[1.5]

            text-[var(--admin-muted)]
          "
        >
          {description}
        </span>
      ) : null}
    </label>
  );
}

/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

export default function PrivacySettings() {
  const { t } = useAdminTranslation();

  const {
    activeCompany,
    activeCompanyId,
    loading: companyLoading,
  } = useCompanyWorkspace();

  const [form, setForm] = useState(INITIAL_SETTINGS);

  const [language, setLanguage] = useState("en");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  /*
   * =======================================================
   * LOAD
   * =======================================================
   */

  useEffect(() => {
    if (!activeCompanyId) {
      return undefined;
    }

    const controller = new AbortController();

    const timeoutId = window.setTimeout(async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/v1/companies/${activeCompanyId}/settings/privacy`,
          {
            method: "GET",

            cache: "no-store",

            credentials: "include",

            signal: controller.signal,
          },
        );

        const payload = await response.json();

        if (!response.ok || payload?.success === false) {
          throw new Error(
            payload?.message || t("settings.privacy.messages.loadFailed"),
          );
        }

        setForm(normalizeSettings(payload?.data || {}));
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        console.error("Load privacy settings error:", error);

        toast.error(
          error?.message || t("settings.privacy.messages.loadFailed"),
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);

      controller.abort();
    };
  }, [activeCompanyId, t]);

  /*
   * =======================================================
   * UPDATE HELPERS
   * =======================================================
   */

  function updateRoot(key, value) {
    setForm((current) => ({
      ...current,

      [key]: value,
    }));
  }

  function updateSection(section, key, value) {
    setForm((current) => ({
      ...current,

      [section]: {
        ...current[section],

        [key]: value,
      },
    }));
  }

  function updateLocalized(section, key, locale, value) {
    setForm((current) => ({
      ...current,

      [section]: {
        ...current[section],

        [key]: {
          ...current[section][key],

          [locale]: value,
        },
      },
    }));
  }

  function updateBanner(locale, key, value) {
    setForm((current) => ({
      ...current,

      cookieBanner: {
        ...current.cookieBanner,

        [locale]: {
          ...current.cookieBanner[locale],

          [key]: value,
        },
      },
    }));
  }

  function updateCategory(categoryKey, key, value) {
    setForm((current) => ({
      ...current,

      categories: {
        ...current.categories,

        [categoryKey]: {
          ...current.categories[categoryKey],

          [key]: value,
        },
      },
    }));
  }

  function updateCategoryLocalized(categoryKey, field, locale, value) {
    setForm((current) => ({
      ...current,

      categories: {
        ...current.categories,

        [categoryKey]: {
          ...current.categories[categoryKey],

          [field]: {
            ...current.categories[categoryKey][field],

            [locale]: value,
          },
        },
      },
    }));
  }

  /*
   * =======================================================
   * SAVE
   * =======================================================
   */

  async function saveSettings(event) {
    event.preventDefault();

    if (!activeCompanyId || saving) {
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `/api/v1/companies/${activeCompanyId}/settings/privacy`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify(createPayload(form)),
        },
      );

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.message || t("settings.privacy.messages.saveFailed"),
        );
      }

      setForm(normalizeSettings(payload?.data || form));

      toast.success(t("settings.privacy.messages.saved"));
    } catch (error) {
      console.error("Save privacy settings error:", error);

      toast.error(error?.message || t("settings.privacy.messages.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  /*
   * =======================================================
   * STATES
   * =======================================================
   */

  if (companyLoading || loading) {
    return (
      <div
        className="
          flex
          min-h-[420px]

          items-center
          justify-center

          rounded-2xl

          border
          border-[var(--admin-border)]

          bg-[var(--admin-surface)]
        "
      >
        <LoaderCircle
          size={20}
          className="
            animate-spin

            text-[var(--company-primary)]
          "
        />
      </div>
    );
  }

  if (!activeCompany || !activeCompanyId) {
    return null;
  }

  return (
    <form
      onSubmit={saveSettings}
      className="
        overflow-hidden

        rounded-2xl

        border
        border-[var(--admin-border)]

        bg-[var(--admin-surface)]
      "
    >
      {/* =================================
          HEADER
      ================================= */}

      <div
        className="
          flex
          flex-col
          gap-4

          border-b
          border-[var(--admin-border)]

          px-5
          py-5

          sm:flex-row
          sm:items-center
          sm:justify-between
          sm:px-6
        "
      >
        <div className="flex items-start gap-3">
          <div
            className="
              flex
              h-10
              w-10
              shrink-0

              items-center
              justify-center

              rounded-xl

              bg-[var(--company-primary-soft)]

              text-[var(--company-primary)]
            "
          >
            <ShieldCheck size={17} />
          </div>

          <div>
            <h2 className="admin-text-16 font-semibold text-[var(--admin-foreground)]">
              {t("settings.privacy.title")}
            </h2>

            <p
              className="
                mt-1

                admin-text-10
                leading-[1.6]

                text-[var(--admin-muted)]
              "
            >
              {t("settings.privacy.description")}
            </p>
          </div>
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

            admin-text-10
            font-semibold

            text-[var(--company-primary-foreground)]

            transition

            hover:opacity-90

            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >
          {saving ? (
            <LoaderCircle size={15} className="animate-spin" />
          ) : (
            <Save size={15} />
          )}

          {saving
            ? t("settings.privacy.actions.saving")
            : t("settings.privacy.actions.save")}
        </button>
      </div>

      {/* =================================
          COOKIE BANNER
      ================================= */}

      <Section
        icon={Cookie}
        title={t("settings.privacy.banner.title")}
        description={t("settings.privacy.banner.description")}
      >
        <div className="grid gap-3">
          <Toggle
            checked={form.showCookieBanner}
            onChange={(value) => updateRoot("showCookieBanner", value)}
            title={t("settings.privacy.banner.showCookieBanner")}
            description={t(
              "settings.privacy.banner.showCookieBannerDescription",
            )}
          />

          <div className="grid gap-3 md:grid-cols-2">
            <Toggle
              checked={form.allowRejectOptional}
              onChange={(value) => updateRoot("allowRejectOptional", value)}
              title={t("settings.privacy.banner.allowRejectOptional")}
              description={t(
                "settings.privacy.banner.allowRejectOptionalDescription",
              )}
            />

            <Toggle
              checked={form.showPreferences}
              onChange={(value) => updateRoot("showPreferences", value)}
              title={t("settings.privacy.banner.showPreferences")}
              description={t(
                "settings.privacy.banner.showPreferencesDescription",
              )}
            />
          </div>
        </div>

        <div
          className="
            mt-5

            rounded-xl

            border
            border-[var(--admin-border)]

            p-4
          "
        >
          <div className="flex gap-2">
            {["en", "th"].map((locale) => (
              <button
                key={locale}
                type="button"
                onClick={() => setLanguage(locale)}
                className={cn(
                  "h-9 rounded-lg px-3",

                  "admin-text-10 font-semibold",

                  "transition",

                  language === locale
                    ? "bg-[var(--company-primary)] text-[var(--company-primary-foreground)]"
                    : "bg-[var(--admin-background)] text-[var(--admin-muted)] hover:text-[var(--admin-foreground)]",
                )}
              >
                {locale === "en"
                  ? t("settings.privacy.languages.en")
                  : t("settings.privacy.languages.th")}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {BANNER_FIELD_KEYS.map((key) => (
              <TextField
                key={key}
                label={t(`settings.privacy.banner.fields.${key}`)}
                value={form.cookieBanner[language]?.[key] || ""}
                multiline={key === "description"}
                onChange={(value) => updateBanner(language, key, value)}
              />
            ))}
          </div>
        </div>
      </Section>

      {/* =================================
          CONSENT
      ================================= */}

      <Section
        icon={ShieldCheck}
        title={t("settings.privacy.consent.title")}
        description={t("settings.privacy.consent.description")}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Toggle
            checked={form.consentManagement.enabled}
            onChange={(value) =>
              updateSection("consentManagement", "enabled", value)
            }
            title={t("settings.privacy.consent.enabled")}
            description={t("settings.privacy.consent.enabledDescription")}
          />

          <Toggle
            checked={form.consentManagement.renewOnPolicyChange}
            onChange={(value) =>
              updateSection("consentManagement", "renewOnPolicyChange", value)
            }
            title={t("settings.privacy.consent.renewOnPolicyChange")}
            description={t(
              "settings.privacy.consent.renewOnPolicyChangeDescription",
            )}
          />

          <Toggle
            checked={form.consentManagement.recordProof}
            onChange={(value) =>
              updateSection("consentManagement", "recordProof", value)
            }
            title={t("settings.privacy.consent.recordProof")}
            description={t("settings.privacy.consent.recordProofDescription")}
          />

          <Toggle
            checked={form.consentManagement.anonymizeTechnicalData}
            onChange={(value) =>
              updateSection(
                "consentManagement",
                "anonymizeTechnicalData",
                value,
              )
            }
            title={t("settings.privacy.consent.anonymizeTechnicalData")}
            description={t(
              "settings.privacy.consent.anonymizeTechnicalDataDescription",
            )}
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TextField
            type="number"
            min={1}
            max={100000}
            label={t("settings.privacy.consent.version")}
            description={t("settings.privacy.consent.versionDescription")}
            value={form.consentManagement.version}
            onChange={(value) =>
              updateSection("consentManagement", "version", value)
            }
          />

          <TextField
            type="number"
            min={1}
            max={365}
            label={t("settings.privacy.consent.cookieMaxAgeDays")}
            description={t(
              "settings.privacy.consent.cookieMaxAgeDaysDescription",
            )}
            value={form.consentManagement.cookieMaxAgeDays}
            onChange={(value) =>
              updateSection("consentManagement", "cookieMaxAgeDays", value)
            }
          />
        </div>
      </Section>

      {/* =================================
          CATEGORIES
      ================================= */}

      <Section
        icon={Cookie}
        title={t("settings.privacy.categories.title")}
        description={t("settings.privacy.categories.description")}
      >
        <div className="grid gap-4">
          {COOKIE_CATEGORY_KEYS.map((categoryKey) => {
            const category = form.categories[categoryKey];

            const necessary = categoryKey === "necessary";

            return (
              <div
                key={categoryKey}
                className="
                  rounded-xl

                  border
                  border-[var(--admin-border)]

                  bg-[var(--admin-background)]

                  p-4
                "
              >
                <Toggle
                  checked={category.enabled}
                  disabled={necessary}
                  onChange={(value) =>
                    updateCategory(categoryKey, "enabled", value)
                  }
                  title={t(`settings.privacy.categories.${categoryKey}`)}
                  description={
                    necessary
                      ? t("settings.privacy.categories.necessaryDescription")
                      : t(
                          `settings.privacy.categories.${categoryKey}Description`,
                        )
                  }
                />

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {["en", "th"].map((locale) => (
                    <div key={locale} className="grid gap-3">
                      <div className="admin-text-10 font-semibold text-[var(--admin-muted)]">
                        {locale === "en"
                          ? t("settings.privacy.languages.en")
                          : t("settings.privacy.languages.th")}
                      </div>

                      <TextField
                        label={t("settings.privacy.categories.name")}
                        value={category.title?.[locale] || ""}
                        onChange={(value) =>
                          updateCategoryLocalized(
                            categoryKey,
                            "title",
                            locale,
                            value,
                          )
                        }
                      />

                      <TextField
                        multiline
                        label={t("settings.privacy.categories.purpose")}
                        value={category.description?.[locale] || ""}
                        onChange={(value) =>
                          updateCategoryLocalized(
                            categoryKey,
                            "description",
                            locale,
                            value,
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* =================================
          DATA SUBJECT RIGHTS
      ================================= */}

      <Section
        icon={UserRoundCheck}
        title={t("settings.privacy.rights.title")}
        description={t("settings.privacy.rights.description")}
      >
        <Toggle
          checked={form.dataSubjectRights.enabled}
          onChange={(value) =>
            updateSection("dataSubjectRights", "enabled", value)
          }
          title={t("settings.privacy.rights.enabled")}
          description={t("settings.privacy.rights.enabledDescription")}
        />

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TextField
            type="email"
            label={t("settings.privacy.rights.requestEmail")}
            value={form.dataSubjectRights.requestEmail}
            onChange={(value) =>
              updateSection("dataSubjectRights", "requestEmail", value)
            }
          />

          <TextField
            type="number"
            min={1}
            max={90}
            label={t("settings.privacy.rights.responseDays")}
            description={t("settings.privacy.rights.responseDaysDescription")}
            value={form.dataSubjectRights.responseDays}
            onChange={(value) =>
              updateSection("dataSubjectRights", "responseDays", value)
            }
          />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {RIGHTS_KEYS.map((key) => (
            <Toggle
              key={key}
              checked={form.dataSubjectRights[key]}
              onChange={(value) =>
                updateSection("dataSubjectRights", key, value)
              }
              title={t(`settings.privacy.rights.${key}`)}
            />
          ))}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {["en", "th"].map((locale) => (
            <TextField
              key={locale}
              multiline
              label={t(`settings.privacy.rights.instructions.${locale}`)}
              value={form.dataSubjectRights.instructions[locale]}
              onChange={(value) =>
                updateLocalized(
                  "dataSubjectRights",
                  "instructions",
                  locale,
                  value,
                )
              }
            />
          ))}
        </div>
      </Section>

      {/* =================================
          PRIVACY CONTACT
      ================================= */}

      <Section
        icon={UserRoundCheck}
        title={t("settings.privacy.contact.title")}
        description={t("settings.privacy.contact.description")}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {["en", "th"].map((locale) => (
            <TextField
              key={`company-${locale}`}
              label={t(`settings.privacy.contact.companyName.${locale}`)}
              value={form.privacyContact.companyName[locale]}
              onChange={(value) =>
                updateLocalized("privacyContact", "companyName", locale, value)
              }
            />
          ))}

          {["en", "th"].map((locale) => (
            <TextField
              key={`address-${locale}`}
              multiline
              label={t(`settings.privacy.contact.address.${locale}`)}
              value={form.privacyContact.address[locale]}
              onChange={(value) =>
                updateLocalized("privacyContact", "address", locale, value)
              }
            />
          ))}

          <TextField
            type="email"
            label={t("settings.privacy.contact.email")}
            value={form.privacyContact.email}
            onChange={(value) =>
              updateSection("privacyContact", "email", value)
            }
          />

          <TextField
            label={t("settings.privacy.contact.phone")}
            value={form.privacyContact.phone}
            onChange={(value) =>
              updateSection("privacyContact", "phone", value)
            }
          />

          <TextField
            type="email"
            label={t("settings.privacy.contact.dpoEmail")}
            description={t("settings.privacy.contact.dpoEmailDescription")}
            value={form.privacyContact.dpoEmail}
            onChange={(value) =>
              updateSection("privacyContact", "dpoEmail", value)
            }
          />
        </div>
      </Section>

      {/* =================================
          RETENTION
      ================================= */}

      <Section
        icon={Database}
        title={t("settings.privacy.retention.title")}
        description={t("settings.privacy.retention.description")}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {RETENTION_FIELDS.map(({ key, min, max }) => (
            <TextField
              key={key}
              type="number"
              min={min}
              max={max}
              label={t(`settings.privacy.retention.${key}`)}
              description={t(`settings.privacy.retention.${key}Description`)}
              value={form.retention[key]}
              onChange={(value) => updateSection("retention", key, value)}
            />
          ))}
        </div>
      </Section>

      {/* =================================
          FOOTER
      ================================= */}

      <div
        className="
          flex
          justify-end

          border-t
          border-[var(--admin-border)]

          bg-[var(--admin-background)]

          px-5
          py-4

          sm:px-6
        "
      >
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

            px-5

            admin-text-10
            font-semibold

            text-[var(--company-primary-foreground)]

            transition

            hover:opacity-90

            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >
          {saving ? (
            <LoaderCircle size={15} className="animate-spin" />
          ) : (
            <Save size={15} />
          )}

          {saving
            ? t("settings.privacy.actions.saving")
            : t("settings.privacy.actions.save")}
        </button>
      </div>
    </form>
  );
}
