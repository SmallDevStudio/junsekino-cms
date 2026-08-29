"use client";

import { Image as ImageIcon, Plus, Search, Trash2, X } from "lucide-react";

import { useState } from "react";

import MediaPicker from "@/components/admin/media/MediaPicker";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { useCompanyLocalization } from "@/components/admin/localization/CompanyLocalizationProvider";

import { COMPANY_LOCALES } from "@/constants/company";

import { cn } from "@/utils/cn";

/*
 * =========================================================
 * KEYWORD EDITOR
 * =========================================================
 */

function KeywordEditor({ value = [], onChange }) {
  const { t } = useAdminTranslation();

  const [input, setInput] = useState("");

  /*
   * =======================================================
   * ADD
   * =======================================================
   */

  function addKeyword() {
    const keyword = input.trim();

    if (!keyword || value.includes(keyword)) {
      setInput("");

      return;
    }

    onChange([...value, keyword]);

    setInput("");
  }

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <div>
      <div
        className="
          flex
          gap-2
        "
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();

              addKeyword();
            }
          }}
          placeholder={t("contentSeo.keywords.placeholder")}
          className="
            h-10
            min-w-0
            flex-1

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
          "
        />

        <button
          type="button"
          onClick={addKeyword}
          disabled={!input.trim()}
          className="
            inline-flex
            h-10

            items-center
            justify-center
            gap-1.5

            rounded-xl

            border
            border-[var(--admin-border)]

            px-4

            admin-text-12
            font-medium

            text-[var(--admin-foreground)]

            transition

            hover:border-[var(--company-primary-border)]

            hover:bg-[var(--company-primary-soft)]

            hover:text-[var(--company-primary)]

            disabled:cursor-not-allowed
            disabled:opacity-40
          "
        >
          <Plus size={13} />

          {t("common.add")}
        </button>
      </div>

      {value.length > 0 && (
        <div
          className="
            mt-3

            flex
            flex-wrap

            gap-2
          "
        >
          {value.map((keyword) => (
            <button
              key={keyword}
              type="button"
              onClick={() => onChange(value.filter((item) => item !== keyword))}
              title={t("contentSeo.keywords.remove", {
                keyword,
              })}
              aria-label={t("contentSeo.keywords.remove", {
                keyword,
              })}
              className="
                  inline-flex
                  items-center
                  gap-1.5

                  rounded-full

                  bg-[var(--company-primary-soft)]

                  px-3
                  py-1.5

                  admin-text-11

                  text-[var(--company-primary)]

                  transition

                  hover:bg-red-50

                  hover:text-red-600
                "
            >
              <span>{keyword}</span>

              <X size={11} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/*
 * =========================================================
 * SEO LANGUAGE PANEL
 * =========================================================
 */

function SeoLanguagePanel({ language, value, onChange, showLanguageLabel }) {
  const { t } = useAdminTranslation();

  const languageLabel =
    language === COMPANY_LOCALES.TH
      ? t("contentLanguage.thai")
      : t("contentLanguage.english");

  function update(field, fieldValue) {
    onChange({
      ...value,

      [field]: fieldValue,
    });
  }

  return (
    <div
      className="
        rounded-2xl

        border
        border-[var(--admin-border)]

        bg-[var(--admin-surface)]

        p-4

        sm:p-5
      "
    >
      {/* =================================
          LANGUAGE
      ================================= */}

      {showLanguageLabel && (
        <div
          className="
            admin-text-10
            font-semibold
            uppercase
            tracking-[0.12em]

            text-[var(--company-primary)]
          "
        >
          {languageLabel}
        </div>
      )}

      <div
        className={cn(
          "space-y-5",

          showLanguageLabel && "mt-4",
        )}
      >
        {/* =================================
            SEO TITLE
        ================================= */}

        <label className="block">
          <div
            className="
              flex
              items-center
              justify-between

              gap-3
            "
          >
            <span
              className="
                admin-text-12
                font-medium

                text-[var(--admin-muted)]
              "
            >
              {t("contentSeo.fields.title")}
            </span>

            <span
              className="
                admin-text-10

                text-[var(--admin-muted-light)]
              "
            >
              {value.title.length}
              /70
            </span>
          </div>

          <input
            value={value.title}
            maxLength={70}
            onChange={(event) =>
              update(
                "title",

                event.target.value,
              )
            }
            placeholder={t("contentSeo.placeholders.title")}
            className="
              mt-2

              h-10
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
            "
          />
        </label>

        {/* =================================
            DESCRIPTION
        ================================= */}

        <label className="block">
          <div
            className="
              flex
              items-center
              justify-between

              gap-3
            "
          >
            <span
              className="
                admin-text-12
                font-medium

                text-[var(--admin-muted)]
              "
            >
              {t("contentSeo.fields.description")}
            </span>

            <span
              className="
                admin-text-10

                text-[var(--admin-muted-light)]
              "
            >
              {value.description.length}
              /180
            </span>
          </div>

          <textarea
            rows={4}
            value={value.description}
            maxLength={180}
            onChange={(event) =>
              update(
                "description",

                event.target.value,
              )
            }
            placeholder={t("contentSeo.placeholders.description")}
            className="
              mt-2

              w-full

              resize-y

              rounded-xl

              border
              border-[var(--admin-border)]

              bg-[var(--admin-surface)]

              p-3

              admin-text-14
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

        {/* =================================
            KEYWORDS
        ================================= */}

        <div>
          <div
            className="
              mb-2

              admin-text-12
              font-medium

              text-[var(--admin-muted)]
            "
          >
            {t("contentSeo.fields.keywords")}
          </div>

          <KeywordEditor
            value={value.keywords}
            onChange={(keywords) => update("keywords", keywords)}
          />
        </div>

        {/* =================================
            OG TITLE
        ================================= */}

        <label className="block">
          <div
            className="
              flex
              items-center
              justify-between

              gap-3
            "
          >
            <span
              className="
                admin-text-12
                font-medium

                text-[var(--admin-muted)]
              "
            >
              {t("contentSeo.fields.ogTitle")}
            </span>

            <span
              className="
                admin-text-10

                text-[var(--admin-muted-light)]
              "
            >
              {value.ogTitle.length}
              /100
            </span>
          </div>

          <input
            value={value.ogTitle}
            maxLength={100}
            onChange={(event) =>
              update(
                "ogTitle",

                event.target.value,
              )
            }
            placeholder={t("contentSeo.placeholders.ogTitle")}
            className="
              mt-2

              h-10
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
            "
          />
        </label>

        {/* =================================
            OG DESCRIPTION
        ================================= */}

        <label className="block">
          <div
            className="
              flex
              items-center
              justify-between

              gap-3
            "
          >
            <span
              className="
                admin-text-12
                font-medium

                text-[var(--admin-muted)]
              "
            >
              {t("contentSeo.fields.ogDescription")}
            </span>

            <span
              className="
                admin-text-10

                text-[var(--admin-muted-light)]
              "
            >
              {value.ogDescription.length}
              /200
            </span>
          </div>

          <textarea
            rows={4}
            value={value.ogDescription}
            maxLength={200}
            onChange={(event) =>
              update(
                "ogDescription",

                event.target.value,
              )
            }
            placeholder={t("contentSeo.placeholders.ogDescription")}
            className="
              mt-2

              w-full

              resize-y

              rounded-xl

              border
              border-[var(--admin-border)]

              bg-[var(--admin-surface)]

              p-3

              admin-text-14
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
      </div>
    </div>
  );
}

/*
 * =========================================================
 * CONTENT SEO SECTION
 * =========================================================
 */

export default function ContentSeoSection({
  companyId,

  seo,

  onChange,

  /*
   * Backward compatibility.
   *
   * Shared UI text no longer depends on
   * an English-only content label.
   */
  contentLabel,
}) {
  const { t } = useAdminTranslation();

  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  const { contentLocales, multilingual } = useCompanyLocalization();

  const locales =
    Array.isArray(contentLocales) && contentLocales.length > 0
      ? contentLocales
      : [COMPANY_LOCALES.EN];

  /*
   * =======================================================
   * LANGUAGE
   * =======================================================
   */

  function updateLanguage(language, value) {
    onChange({
      ...seo,

      [language]: value,
    });
  }

  /*
   * =======================================================
   * OG IMAGE
   * =======================================================
   */

  const ogImage = seo.en?.ogImage || seo.th?.ogImage || null;

  /*
   * Change image only for currently
   * enabled company content languages.
   *
   * Hidden localized SEO data remains
   * untouched.
   */
  function setOgImage(mediaId) {
    const next = {
      ...seo,
    };

    for (const locale of locales) {
      next[locale] = {
        ...next[locale],

        ogImage: mediaId,
      };
    }

    onChange(next);
  }

  function removeOgImage() {
    const next = {
      ...seo,
    };

    for (const locale of locales) {
      next[locale] = {
        ...next[locale],

        ogImage: null,
      };
    }

    onChange(next);
  }

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <>
      <section
        className="
          mt-10

          border-t
          border-[var(--admin-border)]

          pt-8
        "
      >
        {/* =================================
            HEADER
        ================================= */}

        <div
          className="
            flex
            items-start
            gap-3
          "
        >
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
            <Search size={17} />
          </div>

          <div>
            <h3
              className="
                admin-text-14
                font-semibold

                text-[var(--admin-foreground)]
              "
            >
              {t("contentSeo.title")}
            </h3>

            <p
              className="
                mt-1

                max-w-2xl

                admin-text-12
                leading-[1.65]

                text-[var(--admin-muted)]
              "
            >
              {t("contentSeo.description")}
            </p>
          </div>
        </div>

        {/* =================================
            LANGUAGES
        ================================= */}

        <div
          className={cn(
            "mt-5 grid gap-4",

            multilingual ? "xl:grid-cols-2" : "grid-cols-1",
          )}
        >
          {locales.map((language) => (
            <SeoLanguagePanel
              key={language}
              language={language}
              value={seo[language]}
              onChange={(value) => updateLanguage(language, value)}
              showLanguageLabel={multilingual}
            />
          ))}
        </div>

        {/* =================================
            OG IMAGE
        ================================= */}

        <div
          className="
            mt-5

            rounded-2xl

            border
            border-[var(--admin-border)]

            bg-[var(--admin-surface)]

            p-4

            sm:p-5
          "
        >
          <div
            className="
              admin-text-12
              font-medium

              text-[var(--admin-foreground)]
            "
          >
            {t("contentSeo.ogImage.title")}
          </div>

          <p
            className="
              mt-1

              admin-text-11
              leading-[1.65]

              text-[var(--admin-muted)]
            "
          >
            {t("contentSeo.ogImage.description")}
          </p>

          <div
            className="
              mt-4

              flex
              flex-col
              gap-3

              sm:flex-row
              sm:items-center
            "
          >
            <button
              type="button"
              onClick={() => setMediaPickerOpen(true)}
              className={cn(
                "inline-flex h-10",

                "items-center justify-center gap-2",

                "rounded-xl",

                "border border-[var(--admin-border)]",

                "px-4",

                "admin-text-12 font-medium",

                "text-[var(--admin-foreground)]",

                "transition",

                "hover:border-[var(--company-primary-border)]",

                "hover:bg-[var(--company-primary-soft)]",

                "hover:text-[var(--company-primary)]",
              )}
            >
              <ImageIcon size={15} />

              {ogImage ? t("common.changeImage") : t("common.selectImage")}
            </button>

            {ogImage && (
              <>
                <div
                  className="
                    min-w-0
                    flex-1
                    truncate

                    admin-text-11

                    text-[var(--admin-muted)]
                  "
                >
                  {t("contentSeo.ogImage.mediaId", {
                    id: ogImage,
                  })}
                </div>

                <button
                  type="button"
                  onClick={removeOgImage}
                  className="
                    inline-flex
                    h-9

                    items-center
                    justify-center
                    gap-2

                    self-start

                    rounded-xl

                    px-3

                    admin-text-12
                    font-medium

                    text-red-500

                    transition

                    hover:bg-red-50

                    hover:text-red-600

                    sm:self-auto
                  "
                >
                  <Trash2 size={14} />

                  {t("common.remove")}
                </button>
              </>
            )}
          </div>
        </div>

        {/* =================================
            ROBOTS
        ================================= */}

        <div
          className="
            mt-5

            grid
            gap-4

            sm:grid-cols-2
          "
        >
          {/* INDEX */}

          <label
            className={cn(
              "flex cursor-pointer items-start gap-3",

              "rounded-2xl",

              "border",

              "p-4",

              "transition",

              seo.index
                ? "border-[var(--company-primary-border)] bg-[var(--company-primary-soft)]"
                : "border-[var(--admin-border)] hover:bg-[var(--admin-hover)]",
            )}
          >
            <input
              type="checkbox"
              checked={seo.index}
              onChange={(event) =>
                onChange({
                  ...seo,

                  index: event.target.checked,
                })
              }
              className="
                mt-0.5

                accent-[var(--company-primary)]
              "
            />

            <span>
              <span
                className="
                  block

                  admin-text-14
                  font-medium

                  text-[var(--admin-foreground)]
                "
              >
                {t("contentSeo.robots.index.title")}
              </span>

              <span
                className="
                  mt-1
                  block

                  admin-text-12
                  leading-[1.6]

                  text-[var(--admin-muted)]
                "
              >
                {t("contentSeo.robots.index.description")}
              </span>
            </span>
          </label>

          {/* FOLLOW */}

          <label
            className={cn(
              "flex cursor-pointer items-start gap-3",

              "rounded-2xl",

              "border",

              "p-4",

              "transition",

              seo.follow
                ? "border-[var(--company-primary-border)] bg-[var(--company-primary-soft)]"
                : "border-[var(--admin-border)] hover:bg-[var(--admin-hover)]",
            )}
          >
            <input
              type="checkbox"
              checked={seo.follow}
              onChange={(event) =>
                onChange({
                  ...seo,

                  follow: event.target.checked,
                })
              }
              className="
                mt-0.5

                accent-[var(--company-primary)]
              "
            />

            <span>
              <span
                className="
                  block

                  admin-text-14
                  font-medium

                  text-[var(--admin-foreground)]
                "
              >
                {t("contentSeo.robots.follow.title")}
              </span>

              <span
                className="
                  mt-1
                  block

                  admin-text-12
                  leading-[1.6]

                  text-[var(--admin-muted)]
                "
              >
                {t("contentSeo.robots.follow.description")}
              </span>
            </span>
          </label>
        </div>
      </section>

      {/* =====================================
          MEDIA PICKER
      ===================================== */}

      <MediaPicker
        open={mediaPickerOpen}
        companyId={companyId}
        selectedIds={ogImage ? [ogImage] : []}
        multiple={false}
        title={t("contentSeo.ogImage.pickerTitle")}
        onClose={() => setMediaPickerOpen(false)}
        onConfirm={(media) => {
          const mediaId = media?.id || null;

          setOgImage(mediaId);
        }}
      />
    </>
  );
}
