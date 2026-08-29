"use client";

import FormField from "@/components/admin/form/FormField";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { useCompanyLocalization } from "@/components/admin/localization/CompanyLocalizationProvider";

import { COMPANY_LOCALES } from "@/constants/company";

import { cn } from "@/utils/cn";

/*
 * =========================================================
 * LOCALIZED FORM FIELD
 * =========================================================
 *
 * Admin UI language:
 * User preference EN / TH
 *
 * Content languages:
 * Company localization setting
 *
 * These systems remain independent.
 * =========================================================
 */

export default function LocalizedFormField({
  label,

  value,

  onChange,

  required = false,

  error = "",

  hint = "",

  type = "input",

  rows = 4,

  placeholder,

  inputClassName,

  textareaClassName,

  fieldName,

  disabled = false,

  maxLength,

  autoComplete,

  onLanguageChange,

  infoTitle = "",

  infoContent = "",
}) {
  const { contentLocales, multilingual } = useCompanyLocalization();

  const { t } = useAdminTranslation();

  const locales =
    Array.isArray(contentLocales) && contentLocales.length > 0
      ? contentLocales
      : [COMPANY_LOCALES.EN];

  function getLanguageLabel(locale) {
    if (locale === COMPANY_LOCALES.EN) {
      return t("contentLanguage.english");
    }

    if (locale === COMPANY_LOCALES.TH) {
      return t("contentLanguage.thai");
    }

    return locale.toUpperCase();
  }

  function handleChange(locale, nextValue) {
    onChange?.(locale, nextValue);

    onLanguageChange?.(locale, nextValue);
  }

  /*
   * Default styles are deliberately
   * provided here so Admin font scaling
   * works even when consumers do not
   * pass custom classes.
   */

  const defaultInputClass = `
      h-11
      w-full

      rounded-xl

      border
      border-[var(--admin-border)]

      bg-[var(--admin-surface)]

      px-3

      admin-text-14

      text-[var(--admin-foreground)]

      outline-none

      transition

      placeholder:text-[var(--admin-muted-light)]

      focus:border-[var(--company-primary)]

      focus:ring-2
      focus:ring-[var(--company-primary-soft)]

      disabled:cursor-not-allowed
      disabled:opacity-60
    `;

  const defaultTextareaClass = `
      min-h-[120px]
      w-full

      resize-y

      rounded-xl

      border
      border-[var(--admin-border)]

      bg-[var(--admin-surface)]

      px-3
      py-2.5

      admin-text-14
      leading-[1.65]

      text-[var(--admin-foreground)]

      outline-none

      transition

      placeholder:text-[var(--admin-muted-light)]

      focus:border-[var(--company-primary)]

      focus:ring-2
      focus:ring-[var(--company-primary-soft)]

      disabled:cursor-not-allowed
      disabled:opacity-60
    `;

  return (
    <div data-form-field={fieldName || undefined}>
      <div
        className={cn(
          "grid gap-4",

          multilingual && locales.length > 1 ? "sm:grid-cols-2" : "grid-cols-1",
        )}
      >
        {locales.map((locale) => {
          const languageLabel = getLanguageLabel(locale);

          /*
           * English is canonical.
           *
           * Thai remains optional even
           * when Company enables TH.
           */
          const languageRequired = required && locale === COMPANY_LOCALES.EN;

          const fieldLabel = multilingual
            ? `${label} — ${languageLabel}`
            : label;

          const fieldHint =
            multilingual && locale === COMPANY_LOCALES.TH
              ? t("contentLanguage.thaiOptional")
              : hint;

          const localizedPlaceholder =
            typeof placeholder === "object"
              ? placeholder?.[locale] || ""
              : placeholder;

          const commonProps = {
            value: value?.[locale] || "",

            disabled,

            maxLength,

            autoComplete,

            placeholder: localizedPlaceholder,

            onChange: (event) =>
              handleChange(
                locale,

                event.target.value,
              ),
          };

          return (
            <FormField
              key={locale}
              label={fieldLabel}
              required={languageRequired}
              hint={fieldHint}
              error={locale === COMPANY_LOCALES.EN ? error : ""}
              infoTitle={infoTitle}
              infoContent={infoContent}
            >
              {type === "textarea" ? (
                <textarea
                  {...commonProps}
                  rows={rows}
                  aria-invalid={locale === COMPANY_LOCALES.EN && Boolean(error)}
                  className={cn(
                    defaultTextareaClass,

                    textareaClassName,
                  )}
                />
              ) : (
                <input
                  {...commonProps}
                  type={type}
                  aria-invalid={locale === COMPANY_LOCALES.EN && Boolean(error)}
                  className={cn(
                    defaultInputClass,

                    inputClassName,
                  )}
                />
              )}
            </FormField>
          );
        })}
      </div>
    </div>
  );
}
