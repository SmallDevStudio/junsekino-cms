"use client";

import { Image as ImageIcon, Search, Trash2 } from "lucide-react";

import { useState } from "react";

import MediaPicker from "@/components/admin/media/MediaPicker";

import { useCompanyLocalization } from "@/components/admin/localization/CompanyLocalizationProvider";

import { COMPANY_LOCALES } from "@/constants/company";

import { cn } from "@/utils/cn";

/*
 * =========================================================
 * KEYWORD EDITOR
 * =========================================================
 */

function KeywordEditor({ value = [], onChange }) {
  const [input, setInput] = useState("");

  function addKeyword() {
    const keyword = input.trim();

    if (!keyword || value.includes(keyword)) {
      setInput("");

      return;
    }

    onChange([...value, keyword]);

    setInput("");
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();

              addKeyword();
            }
          }}
          placeholder="architecture"
          className="
            h-10
            flex-1
            rounded-xl
            border
            border-[var(--admin-border)]
            bg-[var(--admin-surface)]
            px-3
            text-sm
            outline-none
            transition
            focus:border-[var(--company-primary)]
          "
        />

        <button
          type="button"
          onClick={addKeyword}
          className="
            h-10
            rounded-xl
            border
            border-[var(--admin-border)]
            px-4
            text-xs
            font-medium
            text-[var(--admin-foreground)]
            transition
            hover:bg-[var(--admin-hover)]
          "
        >
          Add
        </button>
      </div>

      {value.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {value.map((keyword) => (
            <button
              key={keyword}
              type="button"
              onClick={() => onChange(value.filter((item) => item !== keyword))}
              title="Remove keyword"
              className="
                  rounded-full
                  bg-[var(--admin-hover)]
                  px-3
                  py-1
                  text-xs
                  text-[var(--admin-foreground)]
                  transition
                  hover:bg-red-50
                  hover:text-red-600
                "
            >
              {keyword} ×
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
  const languageLabel = language === COMPANY_LOCALES.TH ? "Thai" : "English";

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
        p-4
        sm:p-5
      "
    >
      {showLanguageLabel && (
        <div
          className="
            text-xs
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
          "space-y-4",

          showLanguageLabel && "mt-4",
        )}
      >
        <label className="block">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-[var(--admin-muted)]">
              SEO Title
            </span>

            <span className="text-[10px] text-[var(--admin-muted-light)]">
              {value.title.length}
              /70
            </span>
          </div>

          <input
            value={value.title}
            maxLength={70}
            onChange={(event) => update("title", event.target.value)}
            className="
              mt-2
              h-10
              w-full
              rounded-xl
              border
              border-[var(--admin-border)]
              bg-[var(--admin-surface)]
              px-3
              text-sm
              outline-none
              transition
              focus:border-[var(--company-primary)]
            "
          />
        </label>

        <label className="block">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-[var(--admin-muted)]">
              Meta Description
            </span>

            <span className="text-[10px] text-[var(--admin-muted-light)]">
              {value.description.length}
              /180
            </span>
          </div>

          <textarea
            rows={4}
            value={value.description}
            maxLength={180}
            onChange={(event) => update("description", event.target.value)}
            className="
              mt-2
              w-full
              rounded-xl
              border
              border-[var(--admin-border)]
              bg-[var(--admin-surface)]
              p-3
              text-sm
              outline-none
              transition
              focus:border-[var(--company-primary)]
            "
          />
        </label>

        <div>
          <div className="mb-2 text-xs font-medium text-[var(--admin-muted)]">
            SEO Keywords
          </div>

          <KeywordEditor
            value={value.keywords}
            onChange={(keywords) => update("keywords", keywords)}
          />
        </div>

        <label className="block">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-[var(--admin-muted)]">
              Open Graph Title
            </span>

            <span className="text-[10px] text-[var(--admin-muted-light)]">
              {value.ogTitle.length}
              /100
            </span>
          </div>

          <input
            value={value.ogTitle}
            maxLength={100}
            onChange={(event) => update("ogTitle", event.target.value)}
            className="
              mt-2
              h-10
              w-full
              rounded-xl
              border
              border-[var(--admin-border)]
              bg-[var(--admin-surface)]
              px-3
              text-sm
              outline-none
              transition
              focus:border-[var(--company-primary)]
            "
          />
        </label>

        <label className="block">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-[var(--admin-muted)]">
              Open Graph Description
            </span>

            <span className="text-[10px] text-[var(--admin-muted-light)]">
              {value.ogDescription.length}
              /200
            </span>
          </div>

          <textarea
            rows={4}
            value={value.ogDescription}
            maxLength={200}
            onChange={(event) => update("ogDescription", event.target.value)}
            className="
              mt-2
              w-full
              rounded-xl
              border
              border-[var(--admin-border)]
              bg-[var(--admin-surface)]
              p-3
              text-sm
              outline-none
              transition
              focus:border-[var(--company-primary)]
            "
          />
        </label>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * CONTENT SEO
 * =========================================================
 */

export default function ContentSeoSection({
  companyId,
  seo,
  onChange,
  contentLabel = "Content",
}) {
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  const { contentLocales, multilingual } = useCompanyLocalization();

  const locales =
    Array.isArray(contentLocales) && contentLocales.length > 0
      ? contentLocales
      : [COMPANY_LOCALES.EN];

  function updateLanguage(language, value) {
    onChange({
      ...seo,

      [language]: value,
    });
  }

  /*
   * EN is canonical.
   *
   * TH fallback is retained for legacy
   * records that may not yet have an EN
   * Open Graph image.
   */
  const ogImage = seo.en?.ogImage || seo.th?.ogImage || null;

  /*
   * Change OG image only for enabled
   * languages.
   *
   * Hidden languages are preserved.
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
            <Search size={17} />
          </div>

          <div>
            <h3
              className="
                text-sm
                font-semibold
                text-[var(--admin-foreground)]
              "
            >
              Search Engine Optimization
            </h3>

            <p
              className="
                mt-1
                text-xs
                leading-5
                text-[var(--admin-muted)]
              "
            >
              Configure search engine metadata and social sharing information
              for this {contentLabel.toLowerCase()}.
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
            p-4
            sm:p-5
          "
        >
          <div className="text-xs font-medium text-[var(--admin-foreground)]">
            Open Graph Image
          </div>

          <p className="mt-1 text-[11px] leading-5 text-[var(--admin-muted)]">
            Optional image used when this {contentLabel.toLowerCase()} is shared
            on social media.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => setMediaPickerOpen(true)}
              className={cn(
                "inline-flex h-10 items-center justify-center gap-2",

                "rounded-xl border border-[var(--admin-border)]",

                "px-4 text-xs font-medium text-[var(--admin-foreground)]",

                "transition hover:bg-[var(--admin-hover)]",
              )}
            >
              <ImageIcon size={15} />

              {ogImage ? "Change Image" : "Select Image"}
            </button>

            {ogImage && (
              <>
                <div className="min-w-0 flex-1 truncate text-[11px] text-[var(--admin-muted)]">
                  Media ID: {ogImage}
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
                    text-xs
                    font-medium
                    text-red-500
                    transition
                    hover:bg-red-50
                    sm:self-auto
                  "
                >
                  <Trash2 size={14} />
                  Remove
                </button>
              </>
            )}
          </div>
        </div>

        {/* =================================
            ROBOTS
        ================================= */}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label
            className="
              flex
              cursor-pointer
              items-start
              gap-3
              rounded-2xl
              border
              border-[var(--admin-border)]
              p-4
            "
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
              className="mt-0.5 accent-[var(--company-primary)]"
            />

            <span>
              <span className="block text-sm font-medium text-[var(--admin-foreground)]">
                Allow Indexing
              </span>

              <span className="mt-1 block text-xs leading-5 text-[var(--admin-muted)]">
                Allow search engines to include this{" "}
                {contentLabel.toLowerCase()} in search results.
              </span>
            </span>
          </label>

          <label
            className="
              flex
              cursor-pointer
              items-start
              gap-3
              rounded-2xl
              border
              border-[var(--admin-border)]
              p-4
            "
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
              className="mt-0.5 accent-[var(--company-primary)]"
            />

            <span>
              <span className="block text-sm font-medium text-[var(--admin-foreground)]">
                Follow Links
              </span>

              <span className="mt-1 block text-xs leading-5 text-[var(--admin-muted)]">
                Allow search engines to follow links contained on this{" "}
                {contentLabel.toLowerCase()} page.
              </span>
            </span>
          </label>
        </div>
      </section>

      <MediaPicker
        open={mediaPickerOpen}
        companyId={companyId}
        selectedIds={ogImage ? [ogImage] : []}
        multiple={false}
        title="Select Open Graph image"
        onClose={() => setMediaPickerOpen(false)}
        onConfirm={(media) => {
          const mediaId = media?.id || null;

          setOgImage(mediaId);
        }}
      />
    </>
  );
}
