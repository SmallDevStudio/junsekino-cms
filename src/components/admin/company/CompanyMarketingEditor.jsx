"use client";

import {
  AtSign,
  Globe2,
  Link2,
  MessageCircle,
  Music2,
  Search,
} from "lucide-react";

import CoverImageField from "@/components/admin/media/CoverImageField";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

/*
 * =========================================================
 * CONSTANTS
 * =========================================================
 */

const SOCIAL_FIELDS = [
  {
    key: "facebook",
    icon: Link2,
  },
  {
    key: "instagram",
    icon: Link2,
  },
  {
    key: "youtube",
    icon: Link2,
  },
  {
    key: "linkedin",
    icon: Link2,
  },
  {
    key: "tiktok",
    icon: Music2,
  },
  {
    key: "x",
    icon: AtSign,
  },
  {
    key: "pinterest",
    icon: Link2,
  },
  {
    key: "line",
    icon: MessageCircle,
  },
];

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function keywordsToText(value) {
  if (!Array.isArray(value)) {
    return "";
  }

  return value.join(", ");
}

function textToKeywords(value) {
  return Array.from(
    new Set(
      String(value || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

/*
 * =========================================================
 * SECTION HEADER
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

        <p className="mt-1 admin-text-10 leading-[1.6] text-[var(--admin-muted)]">
          {description}
        </p>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * TEXT FIELD
 * =========================================================
 */

function TextField({
  label,

  value,

  onChange,

  type = "text",

  placeholder = "",

  maxLength,

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
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
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

      <span className="flex justify-between gap-3 admin-text-9 text-[var(--admin-muted)]">
        <span>{helper}</span>

        {maxLength ? (
          <span>
            {String(value || "").length}/{maxLength}
          </span>
        ) : null}
      </span>
    </label>
  );
}

/*
 * =========================================================
 * TEXTAREA
 * =========================================================
 */

function TextareaField({
  label,

  value,

  onChange,

  maxLength,

  rows = 4,
}) {
  return (
    <label className="grid gap-1.5">
      <span className="admin-text-11 font-medium text-[var(--admin-foreground)]">
        {label}
      </span>

      <textarea
        value={value ?? ""}
        rows={rows}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
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

          focus:border-[var(--company-primary)]
          focus:ring-2
          focus:ring-[var(--company-primary-soft)]
        "
      />

      {maxLength ? (
        <span className="text-right admin-text-9 text-[var(--admin-muted)]">
          {String(value || "").length}/{maxLength}
        </span>
      ) : null}
    </label>
  );
}

/*
 * =========================================================
 * LOCALIZED SEO
 * =========================================================
 */

function LocalizedSeoEditor({
  companyId,

  locale,

  value,

  onChange,
}) {
  const { t } = useAdminTranslation();

  function update(field, nextValue) {
    onChange({
      ...value,

      [field]: nextValue,
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--admin-border)] p-4">
      <div className="mb-4 flex items-center gap-2">
        <Globe2 size={15} className="text-[var(--company-primary)]" />

        <h3 className="admin-text-12 font-semibold uppercase">
          {locale === "th" ? "ภาษาไทย" : "English"}
        </h3>
      </div>

      <div className="grid gap-4">
        <TextField
          label={t("companyAdmin.seo.title")}
          value={value?.title}
          maxLength={70}
          onChange={(nextValue) => update("title", nextValue)}
        />

        <TextareaField
          label={t("companyAdmin.seo.description")}
          value={value?.description}
          maxLength={180}
          rows={3}
          onChange={(nextValue) =>
            update(
              "description",

              nextValue,
            )
          }
        />

        <TextField
          label={t("companyAdmin.seo.keywords")}
          value={keywordsToText(value?.keywords)}
          helper={t("companyAdmin.seo.keywordsHelp")}
          onChange={(nextValue) =>
            update(
              "keywords",

              textToKeywords(nextValue),
            )
          }
        />

        <TextField
          label={t("companyAdmin.seo.ogTitle")}
          value={value?.ogTitle}
          maxLength={100}
          onChange={(nextValue) => update("ogTitle", nextValue)}
        />

        <TextareaField
          label={t("companyAdmin.seo.ogDescription")}
          value={value?.ogDescription}
          maxLength={200}
          rows={3}
          onChange={(nextValue) =>
            update(
              "ogDescription",

              nextValue,
            )
          }
        />

        <CoverImageField
          companyId={companyId}
          value={value?.ogImage || null}
          onChange={(nextValue) => update("ogImage", nextValue)}
          cropPreset="landscape"
          previewClassName="aspect-[1.91/1]"
          title={t("companyAdmin.seo.ogImage")}
          description={t("companyAdmin.seo.ogImageDescription")}
          emptyTitle={t("companyAdmin.seo.emptyImage")}
          emptyDescription={t("companyAdmin.seo.emptyImageDescription")}
          selectLabel={t("companyAdmin.seo.selectImage")}
          pickerTitle={t("companyAdmin.seo.pickerTitle")}
          removable
        />
      </div>
    </div>
  );
}

/*
 * =========================================================
 * MARKETING EDITOR
 * =========================================================
 */

export default function CompanyMarketingEditor({
  companyId,

  social,

  seo,

  supportedLocales = ["en"],

  onSocialChange,

  onSeoChange,
}) {
  const { t } = useAdminTranslation();

  function updateSocial(field, value) {
    onSocialChange({
      ...social,

      [field]: value,
    });
  }

  function updateLocalizedSeo(
    locale,

    value,
  ) {
    onSeoChange({
      ...seo,

      [locale]: value,
    });
  }

  function updateRobots(field, value) {
    onSeoChange({
      ...seo,

      [field]: value,
    });
  }

  return (
    <>
      {/* SOCIAL */}

      <section className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
        <SectionHeader
          icon={Link2}
          title={t("companyAdmin.sections.social.title")}
          description={t("companyAdmin.sections.social.description")}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {SOCIAL_FIELDS.map(
            ({
              key,

              icon: Icon,
            }) => (
              <label key={key} className="grid gap-1.5">
                <span className="flex items-center gap-2 admin-text-11 font-medium">
                  <Icon size={14} className="text-[var(--company-primary)]" />

                  {t(`companyAdmin.social.${key}`)}
                </span>

                <input
                  type="url"
                  value={social?.[key] || ""}
                  placeholder="https://"
                  onChange={(event) =>
                    updateSocial(
                      key,

                      event.target.value,
                    )
                  }
                  className="
                    h-11
                    rounded-xl

                    border
                    border-[var(--admin-border)]

                    bg-[var(--admin-background)]

                    px-3

                    admin-text-12

                    outline-none

                    focus:border-[var(--company-primary)]
                    focus:ring-2
                    focus:ring-[var(--company-primary-soft)]
                  "
                />
              </label>
            ),
          )}
        </div>
      </section>

      {/* SEO */}

      <section className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
        <SectionHeader
          icon={Search}
          title={t("companyAdmin.sections.seo.title")}
          description={t("companyAdmin.sections.seo.description")}
        />

        <div className="mb-5 flex flex-wrap gap-5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] p-4">
          <label className="inline-flex items-center gap-2 admin-text-11">
            <input
              type="checkbox"
              checked={seo?.index !== false}
              onChange={(event) =>
                updateRobots(
                  "index",

                  event.target.checked,
                )
              }
              className="h-4 w-4 accent-[var(--company-primary)]"
            />

            {t("companyAdmin.seo.allowIndex")}
          </label>

          <label className="inline-flex items-center gap-2 admin-text-11">
            <input
              type="checkbox"
              checked={seo?.follow !== false}
              onChange={(event) =>
                updateRobots(
                  "follow",

                  event.target.checked,
                )
              }
              className="h-4 w-4 accent-[var(--company-primary)]"
            />

            {t("companyAdmin.seo.allowFollow")}
          </label>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <LocalizedSeoEditor
            companyId={companyId}
            locale="en"
            value={seo?.en || {}}
            onChange={(value) =>
              updateLocalizedSeo(
                "en",

                value,
              )
            }
          />

          {supportedLocales.includes("th") ? (
            <LocalizedSeoEditor
              companyId={companyId}
              locale="th"
              value={seo?.th || {}}
              onChange={(value) =>
                updateLocalizedSeo(
                  "th",

                  value,
                )
              }
            />
          ) : (
            <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--admin-border)] p-6 text-center">
              <Globe2 size={22} className="text-[var(--admin-muted-light)]" />

              <div className="mt-3 admin-text-12 font-semibold">
                {t("companyAdmin.seo.thDisabledTitle")}
              </div>

              <p className="mt-1 max-w-sm admin-text-10 leading-[1.6] text-[var(--admin-muted)]">
                {t("companyAdmin.seo.thDisabledDescription")}
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
