"use client";

import RichTextEditor from "@/components/admin/editor/RichTextEditor";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { useCompanyLocalization } from "@/components/admin/localization/CompanyLocalizationProvider";

import { COMPANY_LOCALES } from "@/constants/company";

import { cn } from "@/utils/cn";

/*
 * =========================================================
 * LOCALIZED RICH TEXT EDITOR
 * =========================================================
 */

export default function LocalizedRichTextEditor({
  label,

  value,

  onChange,

  minHeight = 260,

  disabled = false,

  placeholder,
}) {
  const { contentLocales, multilingual } = useCompanyLocalization();

  const { t } = useAdminTranslation();

  const locales =
    Array.isArray(contentLocales) && contentLocales.length > 0
      ? contentLocales
      : [COMPANY_LOCALES.EN];

  const resolvedLabel = label || t("editor.content");

  function getLanguageLabel(locale) {
    if (locale === COMPANY_LOCALES.EN) {
      return t("contentLanguage.english");
    }

    if (locale === COMPANY_LOCALES.TH) {
      return t("contentLanguage.thai");
    }

    return locale.toUpperCase();
  }

  function getPlaceholder(locale) {
    if (typeof placeholder === "object") {
      return placeholder?.[locale] || "";
    }

    if (typeof placeholder === "string" && placeholder) {
      return placeholder;
    }

    return locale === COMPANY_LOCALES.TH
      ? t("editor.placeholderThai")
      : t("editor.placeholderEnglish");
  }

  return (
    <div
      className={cn(
        "grid gap-4",

        multilingual && locales.length > 1 ? "xl:grid-cols-2" : "grid-cols-1",
      )}
    >
      {locales.map((locale) => {
        const languageLabel = getLanguageLabel(locale);

        return (
          <div key={locale}>
            {/* =================================
                  LABEL
              ================================= */}

            <div
              className="
                  mb-2

                  flex
                  items-center
                  justify-between

                  gap-3
                "
            >
              <div
                className="
                    admin-text-12
                    font-medium

                    text-[var(--admin-muted)]
                  "
              >
                {multilingual
                  ? `${resolvedLabel} — ${languageLabel}`
                  : resolvedLabel}
              </div>

              {multilingual && (
                <span
                  className="
                      admin-text-9
                      font-semibold
                      uppercase
                      tracking-[0.12em]

                      text-[var(--company-primary)]
                    "
                >
                  {locale}
                </span>
              )}
            </div>

            {/* =================================
                  EDITOR
              ================================= */}

            <RichTextEditor
              value={value?.[locale]}
              minHeight={minHeight}
              disabled={disabled}
              onChange={(nextValue) => onChange?.(locale, nextValue)}
              placeholder={getPlaceholder(locale)}
            />

            {/* =================================
                  OPTIONAL THAI INFO
              ================================= */}

            {multilingual && locale === COMPANY_LOCALES.TH && (
              <div
                className="
                      mt-1.5

                      admin-text-10

                      text-[var(--admin-muted-light)]
                    "
              >
                {t("contentLanguage.thaiOptional")}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
