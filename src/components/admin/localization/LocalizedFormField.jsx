"use client";

import FormField from "@/components/admin/form/FormField";

import { useCompanyLocalization } from "@/components/admin/localization/CompanyLocalizationProvider";

import { COMPANY_LOCALES } from "@/constants/company";

import { cn } from "@/utils/cn";

/*
 * =========================================================
 * LANGUAGE META
 * =========================================================
 */

const LANGUAGE_META = {
  [COMPANY_LOCALES.EN]: {
    label: "English",
    shortLabel: "EN",
  },

  [COMPANY_LOCALES.TH]: {
    label: "Thai",
    shortLabel: "TH",
  },
};

/*
 * =========================================================
 * LOCALIZED FORM FIELD
 * =========================================================
 *
 * Shared multilingual field used by all
 * CMS content editors.
 *
 * Rules:
 *
 * - English is always shown.
 * - Thai is shown only when enabled in
 *   Company → Localization.
 * - Hiding Thai NEVER mutates or clears
 *   its stored value.
 * - English is the primary / required
 *   content language.
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
}) {
  const { contentLocales, multilingual } = useCompanyLocalization();

  const locales =
    Array.isArray(contentLocales) && contentLocales.length > 0
      ? contentLocales
      : [COMPANY_LOCALES.EN];

  function handleChange(locale, nextValue) {
    onChange?.(locale, nextValue);

    onLanguageChange?.(locale, nextValue);
  }

  return (
    <div data-form-field={fieldName || undefined}>
      <div
        className={cn(
          "grid gap-4",

          multilingual && locales.length > 1 ? "sm:grid-cols-2" : "grid-cols-1",
        )}
      >
        {locales.map((locale) => {
          const meta = LANGUAGE_META[locale] || {
            label: locale.toUpperCase(),

            shortLabel: locale.toUpperCase(),
          };

          /*
           * English is the canonical
           * required language.
           *
           * Thai remains optional even
           * when the company enables it.
           */
          const languageRequired = required && locale === COMPANY_LOCALES.EN;

          const fieldLabel = multilingual ? `${label} — ${meta.label}` : label;

          const fieldHint =
            multilingual && locale === COMPANY_LOCALES.TH
              ? "Optional Thai translation."
              : hint;

          const commonProps = {
            value: value?.[locale] || "",

            disabled,

            maxLength,

            autoComplete,

            placeholder:
              typeof placeholder === "object"
                ? placeholder?.[locale] || ""
                : placeholder,

            onChange: (event) => handleChange(locale, event.target.value),
          };

          return (
            <FormField
              key={locale}
              label={fieldLabel}
              required={languageRequired}
              hint={fieldHint}
              error={locale === COMPANY_LOCALES.EN ? error : ""}
            >
              {type === "textarea" ? (
                <textarea
                  {...commonProps}
                  rows={rows}
                  aria-invalid={locale === COMPANY_LOCALES.EN && Boolean(error)}
                  className={textareaClassName}
                />
              ) : (
                <input
                  {...commonProps}
                  type={type}
                  aria-invalid={locale === COMPANY_LOCALES.EN && Boolean(error)}
                  className={inputClassName}
                />
              )}
            </FormField>
          );
        })}
      </div>
    </div>
  );
}
