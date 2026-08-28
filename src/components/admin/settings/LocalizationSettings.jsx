"use client";

import { Check, Globe2, Languages, LoaderCircle, Save } from "lucide-react";

import { useEffect, useState } from "react";

import { COMPANY_LOCALES } from "@/constants/company";

import { useCompanyWorkspace } from "@/components/admin/company/CompanyWorkspaceProvider";

import { useCompanyLocalization } from "@/components/admin/localization/CompanyLocalizationProvider";

import { cn } from "@/utils/cn";

/*
 * =========================================================
 * LANGUAGE OPTION
 * =========================================================
 */

function LanguageOption({
  code,
  title,
  description,
  enabled,
  required = false,
  onToggle,
}) {
  return (
    <button
      type="button"
      disabled={required}
      onClick={() => {
        if (!required) {
          onToggle();
        }
      }}
      className={cn(
        "group",

        "flex w-full items-center gap-4",

        "rounded-2xl",

        "border",

        "p-4",

        "text-left",

        "transition-all duration-150",

        enabled
          ? "border-[var(--company-primary-border)] bg-[var(--company-primary-soft)]"
          : "border-[var(--admin-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-hover)]",

        required && "cursor-default",
      )}
    >
      {/* CODE */}

      <span
        className={cn(
          "flex h-11 w-11 shrink-0",

          "items-center justify-center",

          "rounded-xl",

          "border",

          "text-[10px] font-semibold",

          enabled
            ? "border-[var(--company-primary-border)] bg-[var(--company-primary)] text-[var(--company-primary-foreground)]"
            : "border-[var(--admin-border)] bg-[var(--admin-background)] text-[var(--admin-muted)]",
        )}
      >
        {code}
      </span>

      {/* TEXT */}

      <span className="min-w-0 flex-1">
        <span
          className="
            block

            text-[13px]
            font-semibold

            text-[var(--admin-foreground)]
          "
        >
          {title}
        </span>

        <span
          className="
            mt-1
            block

            text-[10px]
            leading-[1.5]

            text-[var(--admin-muted)]
          "
        >
          {description}
        </span>

        {required && (
          <span
            className="
              mt-2

              inline-flex

              rounded-full

              bg-[var(--admin-background)]

              px-2
              py-0.5

              text-[8px]
              font-medium
              uppercase
              tracking-[0.08em]

              text-[var(--admin-muted)]
            "
          >
            Required
          </span>
        )}
      </span>

      {/* STATE */}

      <span
        className={cn(
          "flex h-6 w-6 shrink-0",

          "items-center justify-center",

          "rounded-full",

          "border",

          enabled
            ? "border-[var(--company-primary)] bg-[var(--company-primary)] text-[var(--company-primary-foreground)]"
            : "border-[var(--admin-border)] bg-[var(--admin-surface)] text-transparent",
        )}
      >
        <Check size={12} strokeWidth={2.2} />
      </span>
    </button>
  );
}

/*
 * =========================================================
 * LOCALIZATION SETTINGS
 * =========================================================
 */

export default function LocalizationSettings() {
  const {
    activeCompany,
    activeCompanyId,
    loading: companyLoading,
    refreshCompanies,
  } = useCompanyWorkspace();

  const { contentLocales } = useCompanyLocalization();

  const [supportedLocales, setSupportedLocales] = useState([
    COMPANY_LOCALES.EN,
  ]);

  const [defaultLocale, setDefaultLocale] = useState(COMPANY_LOCALES.EN);

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState(null);

  /*
   * =======================================================
   * SYNC ACTIVE COMPANY
   * =======================================================
   *
   * setState is intentionally inside a
   * timer callback to comply with the
   * React Compiler rule used in this
   * project.
   * =======================================================
   */

  useEffect(() => {
    if (!activeCompanyId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const locales =
        Array.isArray(contentLocales) && contentLocales.length > 0
          ? contentLocales
          : [COMPANY_LOCALES.EN];

      setSupportedLocales(locales);

      setDefaultLocale(
        locales.includes(activeCompany?.defaultLocale)
          ? activeCompany.defaultLocale
          : COMPANY_LOCALES.EN,
      );

      setMessage(null);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeCompany, activeCompanyId, contentLocales]);

  /*
   * =======================================================
   * LOAD SERVER SETTINGS
   * =======================================================
   */

  useEffect(() => {
    if (!activeCompanyId) {
      return;
    }

    let active = true;

    const timeoutId = window.setTimeout(async () => {
      setLoading(true);

      try {
        const response = await fetch(
          `/api/v1/companies/${encodeURIComponent(
            activeCompanyId,
          )}/localization`,
          {
            method: "GET",

            cache: "no-store",

            credentials: "same-origin",
          },
        );

        const payload = await response.json();

        if (!response.ok || payload?.success === false) {
          throw new Error(
            payload?.message || "Unable to load localization settings.",
          );
        }

        if (!active) {
          return;
        }

        setSupportedLocales(
          payload.data?.supportedLocales || [COMPANY_LOCALES.EN],
        );

        setDefaultLocale(payload.data?.defaultLocale || COMPANY_LOCALES.EN);
      } catch (error) {
        if (!active) {
          return;
        }

        setMessage({
          type: "error",

          text: error?.message || "Unable to load localization settings.",
        });
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }, 0);

    return () => {
      active = false;

      window.clearTimeout(timeoutId);
    };
  }, [activeCompanyId]);

  /*
   * =======================================================
   * TOGGLE THAI
   * =======================================================
   */

  function toggleThai() {
    setSupportedLocales((current) => {
      const enabled = current.includes(COMPANY_LOCALES.TH);

      if (enabled) {
        setDefaultLocale((currentDefault) =>
          currentDefault === COMPANY_LOCALES.TH
            ? COMPANY_LOCALES.EN
            : currentDefault,
        );

        return current.filter((locale) => locale !== COMPANY_LOCALES.TH);
      }

      return [COMPANY_LOCALES.EN, COMPANY_LOCALES.TH];
    });

    setMessage(null);
  }

  /*
   * =======================================================
   * SAVE
   * =======================================================
   */

  async function handleSave() {
    if (!activeCompanyId || saving) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/v1/companies/${encodeURIComponent(activeCompanyId)}/localization`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "same-origin",

          body: JSON.stringify({
            defaultLocale,

            supportedLocales,
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.message || "Unable to save localization settings.",
        );
      }

      await refreshCompanies();

      setMessage({
        type: "success",

        text: "Localization settings saved.",
      });
    } catch (error) {
      setMessage({
        type: "error",

        text: error?.message || "Unable to save localization settings.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (companyLoading || !activeCompany) {
    return (
      <div
        className="
          flex
          min-h-[260px]

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
          className="animate-spin text-[var(--company-primary)]"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* =====================================
          HEADER
      ===================================== */}

      <div>
        <div
          className="
            flex
            items-center
            gap-2

            text-[10px]
            font-semibold
            uppercase
            tracking-[0.14em]

            text-[var(--company-primary)]
          "
        >
          <Globe2 size={14} strokeWidth={1.8} />
          Public Website
        </div>

        <h1
          className="
            mt-2

            text-[24px]
            font-semibold
            tracking-[-0.025em]

            text-[var(--admin-foreground)]
          "
        >
          Localization
        </h1>

        <p
          className="
            mt-2
            max-w-[680px]

            text-[12px]
            leading-[1.7]

            text-[var(--admin-muted)]
          "
        >
          Choose which languages are available for public website content.
          English is always enabled. Thai fields will only appear in CMS editors
          when Thai is enabled here.
        </p>
      </div>

      {/* =====================================
          COMPANY
      ===================================== */}

      <div
        className="
          flex
          items-center
          gap-3

          rounded-2xl

          border
          border-[var(--admin-border)]

          bg-[var(--admin-surface)]

          px-4
          py-3
        "
      >
        <span
          className="
            flex
            h-9
            w-9

            items-center
            justify-center

            rounded-xl

            bg-[var(--company-primary)]

            text-[9px]
            font-semibold

            text-[var(--company-primary-foreground)]
          "
        >
          {activeCompany.shortName || "CO"}
        </span>

        <div className="min-w-0">
          <div
            className="
              truncate

              text-[12px]
              font-semibold

              text-[var(--admin-foreground)]
            "
          >
            {activeCompany.name}
          </div>

          <div
            className="
              mt-0.5

              text-[9px]

              text-[var(--admin-muted)]
            "
          >
            Current workspace
          </div>
        </div>
      </div>

      {/* =====================================
          LANGUAGE CARDS
      ===================================== */}

      <section
        className="
          rounded-2xl

          border
          border-[var(--admin-border)]

          bg-[var(--admin-surface)]

          p-5
        "
      >
        <div
          className="
            flex
            items-center
            gap-2
          "
        >
          <Languages
            size={16}
            strokeWidth={1.8}
            className="text-[var(--company-primary)]"
          />

          <h2
            className="
              text-[13px]
              font-semibold

              text-[var(--admin-foreground)]
            "
          >
            Public Languages
          </h2>
        </div>

        <div
          className="
            mt-5

            grid
            gap-3

            lg:grid-cols-2
          "
        >
          <LanguageOption
            code="EN"
            title="English"
            description="Primary language for public content and CMS data entry."
            enabled
            required
            onToggle={() => {}}
          />

          <LanguageOption
            code="TH"
            title="Thai"
            description="Enable Thai fields in Project, Award, About, Public Content and future page editors."
            enabled={supportedLocales.includes(COMPANY_LOCALES.TH)}
            onToggle={toggleThai}
          />
        </div>
      </section>

      {/* =====================================
          DEFAULT LANGUAGE
      ===================================== */}

      <section
        className="
          rounded-2xl

          border
          border-[var(--admin-border)]

          bg-[var(--admin-surface)]

          p-5
        "
      >
        <h2
          className="
            text-[13px]
            font-semibold

            text-[var(--admin-foreground)]
          "
        >
          Default Public Language
        </h2>

        <p
          className="
            mt-1

            text-[10px]
            leading-[1.6]

            text-[var(--admin-muted)]
          "
        >
          This language is used when a visitor has not selected another
          language.
        </p>

        <div
          className="
            mt-4
            flex
            flex-wrap
            gap-2
          "
        >
          <button
            type="button"
            onClick={() => setDefaultLocale(COMPANY_LOCALES.EN)}
            className={cn(
              "rounded-xl border px-4 py-2",

              "text-[10px] font-medium",

              "transition",

              defaultLocale === COMPANY_LOCALES.EN
                ? "border-[var(--company-primary-border)] bg-[var(--company-primary-soft)] text-[var(--company-primary)]"
                : "border-[var(--admin-border)] text-[var(--admin-muted)] hover:bg-[var(--admin-hover)]",
            )}
          >
            English
          </button>

          {supportedLocales.includes(COMPANY_LOCALES.TH) && (
            <button
              type="button"
              onClick={() => setDefaultLocale(COMPANY_LOCALES.TH)}
              className={cn(
                "rounded-xl border px-4 py-2",

                "text-[10px] font-medium",

                "transition",

                defaultLocale === COMPANY_LOCALES.TH
                  ? "border-[var(--company-primary-border)] bg-[var(--company-primary-soft)] text-[var(--company-primary)]"
                  : "border-[var(--admin-border)] text-[var(--admin-muted)] hover:bg-[var(--admin-hover)]",
              )}
            >
              ไทย
            </button>
          )}
        </div>
      </section>

      {/* =====================================
          MESSAGE
      ===================================== */}

      {message && (
        <div
          className={cn(
            "rounded-xl",

            "border",

            "px-4 py-3",

            "text-[10px]",

            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700",
          )}
        >
          {message.text}
        </div>
      )}

      {/* =====================================
          ACTION
      ===================================== */}

      <div
        className="
          flex
          justify-end
        "
      >
        <button
          type="button"
          disabled={saving || loading}
          onClick={handleSave}
          className="
            inline-flex
            h-10

            items-center
            justify-center

            gap-2

            rounded-xl

            bg-[var(--company-primary)]

            px-4

            text-[11px]
            font-semibold

            text-[var(--company-primary-foreground)]

            transition

            hover:bg-[var(--company-primary-hover)]

            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {saving ? (
            <LoaderCircle size={14} className="animate-spin" />
          ) : (
            <Save size={14} strokeWidth={1.8} />
          )}

          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
