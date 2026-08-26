"use client";

import { Globe2, Image as ImageIcon, Plus, Search, X } from "lucide-react";

import { useMemo, useState } from "react";

import MediaPicker from "@/components/admin/media/MediaPicker";
import { cn } from "@/utils/cn";

function emptyLocalizedSeo() {
  return {
    title: "",
    description: "",
    keywords: [],
    ogTitle: "",
    ogDescription: "",
    ogImage: null,
  };
}

export function createEmptyProjectSeo() {
  return {
    th: emptyLocalizedSeo(),
    en: emptyLocalizedSeo(),

    index: true,
    follow: true,
  };
}

export function normalizeProjectSeo(seo) {
  const fallback = createEmptyProjectSeo();

  return {
    th: {
      title: seo?.th?.title || "",

      description: seo?.th?.description || "",

      keywords: Array.isArray(seo?.th?.keywords) ? seo.th.keywords : [],

      ogTitle: seo?.th?.ogTitle || "",

      ogDescription: seo?.th?.ogDescription || "",

      ogImage: seo?.th?.ogImage || null,
    },

    en: {
      title: seo?.en?.title || "",

      description: seo?.en?.description || "",

      keywords: Array.isArray(seo?.en?.keywords) ? seo.en.keywords : [],

      ogTitle: seo?.en?.ogTitle || "",

      ogDescription: seo?.en?.ogDescription || "",

      ogImage: seo?.en?.ogImage || null,
    },

    index: seo?.index ?? fallback.index,

    follow: seo?.follow ?? fallback.follow,
  };
}

function CharacterCount({ value = "", max, recommended }) {
  const length = value?.length || 0;

  const warning = recommended && length > recommended;

  const invalid = length > max;

  return (
    <span
      className={cn(
        "text-[10px]",
        invalid
          ? "font-medium text-red-600"
          : warning
            ? "text-amber-600"
            : "text-[var(--admin-muted-light)]",
      )}
    >
      {length}/{max}
    </span>
  );
}

function KeywordEditor({ keywords = [], onChange }) {
  const [input, setInput] = useState("");

  function normalizeKeyword(value) {
    return value.trim().replace(/\s+/g, " ");
  }

  function addKeyword() {
    const keyword = normalizeKeyword(input);

    if (!keyword) {
      return;
    }

    const exists = keywords.some(
      (item) => item.toLowerCase() === keyword.toLowerCase(),
    );

    if (exists) {
      setInput("");

      return;
    }

    onChange?.([...keywords, keyword]);

    setInput("");
  }

  function removeKeyword(keyword) {
    onChange?.(keywords.filter((item) => item !== keyword));
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

            if (event.key === "," && input.trim()) {
              event.preventDefault();

              addKeyword();
            }
          }}
          maxLength={100}
          placeholder="architecture"
          className={cn(
            "h-10 min-w-0 flex-1 rounded-xl",
            "border border-[var(--admin-border)]",
            "bg-[var(--admin-surface)] px-3",
            "text-sm text-[var(--admin-foreground)]",
            "outline-none transition",
            "placeholder:text-[var(--admin-muted-light)]",
            "focus:border-[var(--company-primary)]",
            "focus:ring-2 focus:ring-[var(--company-primary-soft)]",
          )}
        />

        <button
          type="button"
          onClick={addKeyword}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[var(--admin-border)] px-3 text-xs font-medium text-[var(--admin-foreground)] transition hover:bg-[var(--admin-hover)]"
        >
          <Plus size={13} />
          Add
        </button>
      </div>

      {keywords.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {keywords.map((keyword) => (
            <button
              key={keyword}
              type="button"
              onClick={() => removeKeyword(keyword)}
              title="Remove keyword"
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--admin-hover)] px-3 py-1.5 text-[11px] text-[var(--admin-foreground)] transition hover:bg-red-50 hover:text-red-600"
            >
              {keyword}

              <X size={11} />
            </button>
          ))}
        </div>
      )}

      <p className="mt-2 text-[10px] leading-4 text-[var(--admin-muted-light)]">
        Press Enter or comma to add a keyword. Duplicate keywords are ignored.
      </p>
    </div>
  );
}

function SeoPreview({ title, description, slug }) {
  const previewTitle = title?.trim() || "Project title";

  const previewDescription =
    description?.trim() || "Project SEO description will appear here.";

  const previewSlug = slug || "project-slug";

  return (
    <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-background)] p-4">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-[var(--admin-muted-light)]">
        <Search size={12} />
        Search Preview
      </div>

      <div className="mt-3 text-[11px] text-emerald-700">
        junsekino.com › projects › {previewSlug}
      </div>

      <div className="mt-1 line-clamp-1 text-[16px] font-medium text-blue-700">
        {previewTitle}
      </div>

      <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--admin-muted)]">
        {previewDescription}
      </p>
    </div>
  );
}

function OgImageControl({ companyId, mediaId, onChange, language }) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <>
      <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-background)] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-medium text-[var(--admin-foreground)]">
              <ImageIcon size={14} />
              Open Graph Image
            </div>

            {mediaId ? (
              <p className="mt-1 truncate text-[10px] text-[var(--admin-muted)]">
                Media ID: {mediaId}
              </p>
            ) : (
              <p className="mt-1 text-[10px] leading-4 text-[var(--admin-muted)]">
                No custom image. The public website can fall back to the project
                cover image.
              </p>
            )}
          </div>

          <div className="flex shrink-0 gap-2">
            {mediaId && (
              <button
                type="button"
                onClick={() => onChange?.(null)}
                className="h-9 rounded-xl border border-[var(--admin-border)] px-3 text-xs font-medium text-red-600 transition hover:bg-red-50"
              >
                Remove
              </button>
            )}

            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="h-9 rounded-xl border border-[var(--admin-border)] px-3 text-xs font-medium text-[var(--admin-foreground)] transition hover:bg-[var(--admin-hover)]"
            >
              {mediaId ? "Change" : "Select Image"}
            </button>
          </div>
        </div>
      </div>

      <MediaPicker
        open={pickerOpen}
        companyId={companyId}
        selectedIds={mediaId ? [mediaId] : []}
        multiple={false}
        title={`Select ${language.toUpperCase()} social image`}
        onClose={() => setPickerOpen(false)}
        onConfirm={(media) => {
          if (!media?.id) {
            return;
          }

          onChange?.(media.id);
        }}
      />
    </>
  );
}

function LocalizedSeoEditor({ language, value, companyId, slug, onChange }) {
  const labels =
    language === "th"
      ? {
          language: "Thai",
          title: "SEO Title — Thai",
          description: "Meta Description — Thai",
          keywords: "Keywords — Thai",
          ogTitle: "Open Graph Title — Thai",
          ogDescription: "Open Graph Description — Thai",
        }
      : {
          language: "English",
          title: "SEO Title — English",
          description: "Meta Description — English",
          keywords: "Keywords — English",
          ogTitle: "Open Graph Title — English",
          ogDescription: "Open Graph Description — English",
        };

  function updateField(field, nextValue) {
    onChange?.({
      ...value,
      [field]: nextValue,
    });
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <Globe2 size={15} className="text-[var(--company-primary)]" />

        <div className="text-xs font-semibold text-[var(--admin-foreground)]">
          {labels.language} SEO
        </div>
      </div>

      <div className="mt-4 space-y-5">
        {/* SEO title */}

        <label className="block">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-[var(--admin-muted)]">
              {labels.title}
            </span>

            <CharacterCount value={value.title} recommended={60} max={70} />
          </div>

          <input
            value={value.title}
            onChange={(event) => updateField("title", event.target.value)}
            maxLength={70}
            placeholder="Project name | Junsekino"
            className={cn(
              "mt-2 h-11 w-full rounded-xl",
              "border border-[var(--admin-border)]",
              "bg-[var(--admin-surface)] px-3",
              "text-sm text-[var(--admin-foreground)]",
              "outline-none transition",
              "placeholder:text-[var(--admin-muted-light)]",
              "focus:border-[var(--company-primary)]",
              "focus:ring-2 focus:ring-[var(--company-primary-soft)]",
            )}
          />

          <p className="mt-1.5 text-[10px] text-[var(--admin-muted-light)]">
            Recommended around 50–60 characters.
          </p>
        </label>

        {/* Meta description */}

        <label className="block">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-[var(--admin-muted)]">
              {labels.description}
            </span>

            <CharacterCount
              value={value.description}
              recommended={160}
              max={180}
            />
          </div>

          <textarea
            rows={4}
            value={value.description}
            onChange={(event) => updateField("description", event.target.value)}
            maxLength={180}
            placeholder="A concise description of the project..."
            className={cn(
              "mt-2 w-full rounded-xl",
              "border border-[var(--admin-border)]",
              "bg-[var(--admin-surface)] p-3",
              "text-sm text-[var(--admin-foreground)]",
              "outline-none transition",
              "placeholder:text-[var(--admin-muted-light)]",
              "focus:border-[var(--company-primary)]",
              "focus:ring-2 focus:ring-[var(--company-primary-soft)]",
            )}
          />
        </label>

        {/* Search preview */}

        <SeoPreview
          title={value.title}
          description={value.description}
          slug={slug}
        />

        {/* Keywords */}

        <div>
          <div className="text-xs font-medium text-[var(--admin-muted)]">
            {labels.keywords}
          </div>

          <div className="mt-2">
            <KeywordEditor
              keywords={value.keywords}
              onChange={(keywords) => updateField("keywords", keywords)}
            />
          </div>
        </div>

        {/* Open Graph */}

        <div className="border-t border-[var(--admin-border)] pt-5">
          <div className="text-xs font-semibold text-[var(--admin-foreground)]">
            Social Sharing
          </div>

          <p className="mt-1 text-[11px] leading-5 text-[var(--admin-muted)]">
            Open Graph metadata is used when the project is shared on social
            platforms.
          </p>

          <label className="mt-4 block">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-[var(--admin-muted)]">
                {labels.ogTitle}
              </span>

              <CharacterCount value={value.ogTitle} max={100} />
            </div>

            <input
              value={value.ogTitle}
              onChange={(event) => updateField("ogTitle", event.target.value)}
              maxLength={100}
              placeholder="Leave blank to use SEO title"
              className={cn(
                "mt-2 h-11 w-full rounded-xl",
                "border border-[var(--admin-border)]",
                "bg-[var(--admin-surface)] px-3",
                "text-sm text-[var(--admin-foreground)]",
                "outline-none transition",
                "placeholder:text-[var(--admin-muted-light)]",
                "focus:border-[var(--company-primary)]",
                "focus:ring-2 focus:ring-[var(--company-primary-soft)]",
              )}
            />
          </label>

          <label className="mt-4 block">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-[var(--admin-muted)]">
                {labels.ogDescription}
              </span>

              <CharacterCount value={value.ogDescription} max={200} />
            </div>

            <textarea
              rows={3}
              value={value.ogDescription}
              onChange={(event) =>
                updateField("ogDescription", event.target.value)
              }
              maxLength={200}
              placeholder="Leave blank to use meta description"
              className={cn(
                "mt-2 w-full rounded-xl",
                "border border-[var(--admin-border)]",
                "bg-[var(--admin-surface)] p-3",
                "text-sm text-[var(--admin-foreground)]",
                "outline-none transition",
                "placeholder:text-[var(--admin-muted-light)]",
                "focus:border-[var(--company-primary)]",
                "focus:ring-2 focus:ring-[var(--company-primary-soft)]",
              )}
            />
          </label>

          <div className="mt-4">
            <OgImageControl
              companyId={companyId}
              mediaId={value.ogImage}
              language={language}
              onChange={(ogImage) => updateField("ogImage", ogImage)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectSeoSection({ companyId, seo, slug, onChange }) {
  const normalizedSeo = useMemo(() => normalizeProjectSeo(seo), [seo]);

  const [activeLanguage, setActiveLanguage] = useState("en");

  function updateLocalized(language, value) {
    onChange?.({
      ...normalizedSeo,

      [language]: value,
    });
  }

  function updateRobots(field, value) {
    onChange?.({
      ...normalizedSeo,

      [field]: value,
    });
  }

  return (
    <section className="mt-10 border-t border-[var(--admin-border)] pt-8">
      <div>
        <div className="flex items-center gap-2">
          <Search size={16} className="text-[var(--company-primary)]" />

          <h3 className="text-sm font-semibold text-[var(--admin-foreground)]">
            Search Engine Optimization
          </h3>
        </div>

        <p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--admin-muted)]">
          Control how this project is described to search engines and social
          platforms.
        </p>
      </div>

      {/* Robots */}

      <div className="mt-5 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-background)] p-4">
        <div className="text-xs font-semibold text-[var(--admin-foreground)]">
          Search Visibility
        </div>

        <p className="mt-1 text-[11px] leading-5 text-[var(--admin-muted)]">
          These settings control robots directives for the public project page.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3">
            <input
              type="checkbox"
              checked={normalizedSeo.index}
              onChange={(event) => updateRobots("index", event.target.checked)}
              className="mt-0.5"
            />

            <span>
              <span className="block text-xs font-medium text-[var(--admin-foreground)]">
                Allow indexing
              </span>

              <span className="mt-1 block text-[10px] leading-4 text-[var(--admin-muted)]">
                Search engines may include this project in search results.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3">
            <input
              type="checkbox"
              checked={normalizedSeo.follow}
              onChange={(event) => updateRobots("follow", event.target.checked)}
              className="mt-0.5"
            />

            <span>
              <span className="block text-xs font-medium text-[var(--admin-foreground)]">
                Allow link following
              </span>

              <span className="mt-1 block text-[10px] leading-4 text-[var(--admin-muted)]">
                Search engines may follow links from this page.
              </span>
            </span>
          </label>
        </div>

        {!normalizedSeo.index && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] leading-5 text-amber-700">
            This project will request
            <strong> noindex</strong>. It may not appear in search engine
            results.
          </div>
        )}
      </div>

      {/* Language tabs */}

      <div className="mt-6 flex border-b border-[var(--admin-border)]">
        {[
          {
            value: "en",
            label: "English",
          },
          {
            value: "th",
            label: "Thai",
          },
        ].map((option) => {
          const active = activeLanguage === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setActiveLanguage(option.value)}
              className={cn(
                "relative px-4 py-3",
                "text-xs font-medium transition",
                active
                  ? "text-[var(--company-primary)]"
                  : "text-[var(--admin-muted)] hover:text-[var(--admin-foreground)]",
              )}
            >
              {option.label}

              {active && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[var(--company-primary)]" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        <LocalizedSeoEditor
          language={activeLanguage}
          value={normalizedSeo[activeLanguage]}
          companyId={companyId}
          slug={slug}
          onChange={(value) => updateLocalized(activeLanguage, value)}
        />
      </div>
    </section>
  );
}
