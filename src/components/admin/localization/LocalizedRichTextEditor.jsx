"use client";

import RichTextEditor from "@/components/admin/editor/RichTextEditor";

import { useCompanyLocalization } from "@/components/admin/localization/CompanyLocalizationProvider";

import { COMPANY_LOCALES } from "@/constants/company";

import { cn } from "@/utils/cn";

const LANGUAGE_META = {
  [COMPANY_LOCALES.EN]: {
    label: "English",
  },

  [COMPANY_LOCALES.TH]: {
    label: "Thai",
  },
};

export default function LocalizedRichTextEditor({
  label = "Content",
  value,
  onChange,
  minHeight = 260,
}) {
  const { contentLocales, multilingual } = useCompanyLocalization();

  const locales =
    Array.isArray(contentLocales) && contentLocales.length > 0
      ? contentLocales
      : [COMPANY_LOCALES.EN];

  return (
    <div
      className={cn(
        "grid gap-4",

        multilingual ? "xl:grid-cols-2" : "grid-cols-1",
      )}
    >
      {locales.map((locale) => {
        const languageLabel =
          LANGUAGE_META[locale]?.label || locale.toUpperCase();

        return (
          <div key={locale}>
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
                    text-xs
                    font-medium

                    text-[var(--admin-muted)]
                  "
              >
                {multilingual ? `${label} — ${languageLabel}` : label}
              </div>

              {multilingual && (
                <span
                  className="
                      text-[9px]
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

            <RichTextEditor
              value={value?.[locale]}
              minHeight={minHeight}
              onChange={(nextValue) => onChange?.(locale, nextValue)}
              placeholder={
                locale === COMPANY_LOCALES.TH
                  ? "เขียนรายละเอียด..."
                  : "Write project description..."
              }
            />
          </div>
        );
      })}
    </div>
  );
}
