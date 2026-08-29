"use client";

import {
  Image as ImageIcon,
  LoaderCircle,
  Newspaper,
  Save,
  Star,
  X,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";

import { toast } from "sonner";

import ContentSeoSection from "@/components/admin/content/ContentSeoSection";
import FormField from "@/components/admin/form/FormField";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import LocalizedFormField from "@/components/admin/localization/LocalizedFormField";
import LocalizedRichTextEditor from "@/components/admin/localization/LocalizedRichTextEditor";
import MediaPicker from "@/components/admin/media/MediaPicker";
import TagInput from "@/components/admin/tag/TagInput";

import {
  clearFieldError,
  focusFirstInvalidField,
  getFieldError,
  getInvalidFieldClass,
  hasErrors,
  normalizeServerFieldErrors,
} from "@/utils/admin-form-validation";

import { cn } from "@/utils/cn";

import { slugify } from "@/utils/slug";

/*
 * =========================================================
 * EMPTY VALUES
 * =========================================================
 */

function emptyLocalized() {
  return {
    th: "",
    en: "",
  };
}

function emptySeoLanguage() {
  return {
    title: "",
    description: "",
    keywords: [],
    ogTitle: "",
    ogDescription: "",
    ogImage: null,
  };
}

function emptySeo() {
  return {
    th: emptySeoLanguage(),
    en: emptySeoLanguage(),

    index: true,
    follow: true,
  };
}

function emptyForm() {
  return {
    slug: "",

    title: emptyLocalized(),

    excerpt: emptyLocalized(),

    content: emptyLocalized(),

    category: "",

    tags: [],

    author: "",

    featuredImage: null,

    featured: false,

    seo: emptySeo(),
  };
}

/*
 * =========================================================
 * NORMALIZATION
 * =========================================================
 */

function normalizeSeoLanguage(value) {
  return {
    title: value?.title || "",

    description: value?.description || "",

    keywords: Array.isArray(value?.keywords) ? value.keywords : [],

    ogTitle: value?.ogTitle || "",

    ogDescription: value?.ogDescription || "",

    ogImage: value?.ogImage || null,
  };
}

function normalizeSeo(value) {
  return {
    th: normalizeSeoLanguage(value?.th),

    en: normalizeSeoLanguage(value?.en),

    index: value?.index !== false,

    follow: value?.follow !== false,
  };
}

function normalizeNews(item) {
  if (!item) {
    return emptyForm();
  }

  return {
    slug: item.slug || "",

    title: {
      th: item.title?.th || "",

      en: item.title?.en || "",
    },

    excerpt: {
      th: item.excerpt?.th || "",

      en: item.excerpt?.en || "",
    },

    content: {
      th: item.content?.th || "",

      en: item.content?.en || "",
    },

    category: item.category || "",

    tags: Array.isArray(item.tags) ? item.tags : [],

    author: item.author || "",

    featuredImage: item.featuredImage || null,

    featured: item.featured === true,

    seo: normalizeSeo(item.seo),
  };
}

/*
 * =========================================================
 * RICH TEXT
 * =========================================================
 */

function richTextHasContent(value) {
  return Boolean(
    String(value || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

/*
 * =========================================================
 * SECTION HEADER
 * =========================================================
 */

function SectionHeader({ title, description }) {
  return (
    <div>
      <h3
        className="
          admin-text-14
          font-semibold

          text-[var(--admin-foreground)]
        "
      >
        {title}
      </h3>

      {description && (
        <p
          className="
            mt-1
            max-w-2xl

            admin-text-12
            leading-[1.65]

            text-[var(--admin-muted)]
          "
        >
          {description}
        </p>
      )}
    </div>
  );
}

/*
 * =========================================================
 * NEWS EDITOR
 * =========================================================
 */

export default function NewsEditor({
  open,

  companyId,

  item,

  categorySuggestions = [],

  tagSuggestions = [],

  onClose,

  onSaved,
}) {
  const { t } = useAdminTranslation();

  const [form, setForm] = useState(() => normalizeNews(item));

  const [saving, setSaving] = useState(false);

  const [errors, setErrors] = useState({});

  const [coverPickerOpen, setCoverPickerOpen] = useState(false);

  const [previewUrl, setPreviewUrl] = useState(null);

  const [previewLoading, setPreviewLoading] = useState(false);

  const slugManuallyEditedRef = useRef(false);

  /*
   * =======================================================
   * OPEN SYNC
   * =======================================================
   */

  useEffect(() => {
    if (!open) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setForm(normalizeNews(item));

      setErrors({});

      slugManuallyEditedRef.current = Boolean(item?.id);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [item, open]);

  /*
   * =======================================================
   * COVER PREVIEW
   * =======================================================
   */

  const coverMediaId = form.featuredImage?.mediaId || null;

  useEffect(() => {
    if (!open || !companyId || !coverMediaId) {
      return;
    }

    let cancelled = false;

    const timeoutId = window.setTimeout(async () => {
      try {
        if (!cancelled) {
          setPreviewUrl(null);
          setPreviewLoading(true);
        }

        const response = await fetch(
          `/api/v1/companies/${companyId}/media/${coverMediaId}/preview?variant=large`,
          {
            method: "GET",
            cache: "no-store",
            credentials: "include",
          },
        );

        const payload = await response.json();

        if (!response.ok || payload?.success === false) {
          throw new Error("NEWS_COVER_PREVIEW_FAILED");
        }

        const url = payload?.data?.url || payload?.url || null;

        if (!cancelled) {
          setPreviewUrl(url);
        }
      } catch (error) {
        console.error("News cover preview error:", error);
      } finally {
        if (!cancelled) {
          setPreviewLoading(false);
        }
      }
    }, 0);

    return () => {
      cancelled = true;

      window.clearTimeout(timeoutId);
    };
  }, [companyId, coverMediaId, open]);

  if (!open) {
    return null;
  }

  /*
   * =======================================================
   * TITLE
   * =======================================================
   */

  function updateTitle(language, value) {
    setForm((current) => ({
      ...current,

      title: {
        ...current.title,

        [language]: value,
      },

      slug:
        language === "en" && !item && !slugManuallyEditedRef.current
          ? slugify(value)
          : current.slug,
    }));

    clearFieldError(setErrors, "title");

    if (language === "en" && !item && !slugManuallyEditedRef.current) {
      clearFieldError(setErrors, "slug");
    }
  }

  /*
   * =======================================================
   * LOCALIZED
   * =======================================================
   */

  function updateLocalized(field, language, value) {
    setForm((current) => ({
      ...current,

      [field]: {
        ...current[field],

        [language]: value,
      },
    }));

    if (field === "content") {
      clearFieldError(setErrors, "content");
    }
  }

  /*
   * =======================================================
   * VALIDATE
   * =======================================================
   */

  function validateForm(value) {
    const nextErrors = {};

    /*
     * English canonical.
     */
    if (!value.title?.en?.trim()) {
      nextErrors.title = t("news.editor.validation.titleRequired");
    }

    if (!value.slug?.trim()) {
      nextErrors.slug = t("news.editor.validation.slugRequired");
    }

    if (!richTextHasContent(value.content?.en)) {
      nextErrors.content = t("news.editor.validation.contentRequired");
    }

    return nextErrors;
  }

  /*
   * =======================================================
   * PAYLOAD
   * =======================================================
   */

  function createPayload(slug) {
    return {
      slug,

      title: form.title,

      excerpt: form.excerpt,

      content: form.content,

      category: form.category?.trim() || null,

      tags: form.tags,

      author: form.author?.trim() || null,

      featuredImage: form.featuredImage,

      featured: form.featured,

      seo: form.seo,
    };
  }

  /*
   * =======================================================
   * SAVE
   * =======================================================
   */

  async function handleSubmit(event) {
    event.preventDefault();

    if (!companyId || saving) {
      return;
    }

    const normalizedSlug = slugify(form.slug);

    const normalizedForm = {
      ...form,

      slug: normalizedSlug,
    };

    const validationErrors = validateForm(normalizedForm);

    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);

      focusFirstInvalidField(validationErrors);

      toast.error(t("news.editor.validation.completeRequired"));

      return;
    }

    try {
      setSaving(true);
      setErrors({});

      const editing = Boolean(item?.id);

      const response = await fetch(
        editing
          ? `/api/v1/companies/${companyId}/news/${item.id}`
          : `/api/v1/companies/${companyId}/news`,
        {
          method: editing ? "PATCH" : "POST",

          credentials: "include",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(createPayload(normalizedSlug)),
        },
      );

      let payload = null;

      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok || payload?.success === false) {
        const serverErrors = normalizeServerFieldErrors(payload?.errors);

        if (hasErrors(serverErrors)) {
          setErrors(serverErrors);

          focusFirstInvalidField(serverErrors);
        }

        if (response.status === 409) {
          const conflictErrors = {
            slug: t("news.editor.slug.exists"),
          };

          setErrors(conflictErrors);

          focusFirstInvalidField(conflictErrors);

          throw new Error(t("news.editor.slug.exists"));
        }

        throw new Error(payload?.message || t("news.editor.errors.saveFailed"));
      }

      setForm((current) => ({
        ...current,

        slug: normalizedSlug,
      }));

      slugManuallyEditedRef.current = true;

      toast.success(
        editing
          ? t("news.editor.messages.updated")
          : t("news.editor.messages.created"),
      );

      await onSaved?.(payload?.data);
    } catch (error) {
      console.error("Save news error:", error);

      toast.error(error?.message || t("news.editor.errors.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  /*
   * =======================================================
   * COVER
   * =======================================================
   */

  function handleCoverSelected(media) {
    if (!media?.id) {
      return;
    }

    setForm((current) => ({
      ...current,

      featuredImage: {
        mediaId: media.id,

        alt: {
          th: media.alt?.th || "",

          en: media.alt?.en || "",
        },

        caption: {
          th: media.caption?.th || "",

          en: media.caption?.en || "",
        },
      },
    }));
  }

  /*
   * =======================================================
   * CLOSE
   * =======================================================
   */

  function handleClose() {
    if (saving) {
      return;
    }

    onClose?.();
  }

  const inputClass = cn(
    "h-11 w-full",

    "rounded-xl",

    "border border-[var(--admin-border)]",

    "bg-[var(--admin-surface)]",

    "px-3",

    "admin-text-14",

    "text-[var(--admin-foreground)]",

    "outline-none transition",

    "placeholder:text-[var(--admin-muted-light)]",

    "focus:border-[var(--company-primary)]",

    "focus:ring-2 focus:ring-[var(--company-primary-soft)]",
  );

  return (
    <>
      <div
        className="
          fixed
          inset-0
          z-[200]
        "
      >
        {/* BACKDROP */}

        <button
          type="button"
          disabled={saving}
          onClick={handleClose}
          aria-label={t("common.close")}
          className="
            absolute
            inset-0

            bg-black/40

            backdrop-blur-[1px]
          "
        />

        {/* PANEL */}

        <div
          className="
            absolute
            inset-y-0
            right-0

            flex
            w-full
            max-w-[1120px]
            flex-col

            bg-[var(--admin-background)]

            shadow-2xl
          "
        >
          {/* HEADER */}

          <header
            className="
              flex
              min-h-[80px]
              shrink-0

              items-center
              justify-between

              gap-4

              border-b
              border-[var(--admin-border)]

              bg-[var(--admin-surface)]

              px-5
              py-4

              sm:px-8
            "
          >
            <div>
              <div
                className="
                  admin-text-10
                  font-semibold
                  uppercase
                  tracking-[0.14em]

                  text-[var(--company-primary)]
                "
              >
                {t("news.editor.sectionLabel")}
              </div>

              <h2
                className="
                  mt-1

                  admin-text-18
                  font-semibold

                  text-[var(--admin-foreground)]
                "
              >
                {item ? t("news.editor.editTitle") : t("news.editor.newTitle")}
              </h2>

              <p
                className="
                  mt-1

                  admin-text-12

                  text-[var(--admin-muted)]
                "
              >
                {t("news.editor.headerDescription")}
              </p>
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={handleClose}
              aria-label={t("common.close")}
              className="
                flex
                h-9
                w-9

                items-center
                justify-center

                rounded-xl

                text-[var(--admin-muted)]

                transition

                hover:bg-[var(--admin-hover)]

                disabled:opacity-50
              "
            >
              <X size={18} />
            </button>
          </header>

          {/* FORM */}

          <form
            id="news-editor-form"
            onSubmit={handleSubmit}
            noValidate
            className="
              admin-sidebar-scrollbar-hide

              min-h-0
              flex-1

              overflow-y-auto
            "
          >
            <div
              className="
                px-5
                py-6

                sm:px-8
                sm:py-8
              "
            >
              {/* BASIC */}

              <section>
                <SectionHeader
                  title={t("news.editor.basic.title")}
                  description={t("news.editor.basic.description")}
                />

                <div
                  className="
                    mt-5

                    grid
                    gap-5
                  "
                >
                  <LocalizedFormField
                    fieldName="title"
                    label={t("news.editor.fields.title")}
                    required
                    value={form.title}
                    error={getFieldError(errors, "title")}
                    onChange={updateTitle}
                    placeholder={{
                      en: t("news.editor.placeholders.titleEnglish"),

                      th: t("news.editor.placeholders.titleThai"),
                    }}
                  />

                  <div data-form-field="slug">
                    <FormField
                      label={t("news.editor.fields.slug")}
                      required
                      error={getFieldError(errors, "slug")}
                      hint={t("news.editor.slug.hint")}
                      infoTitle={t("news.editor.slug.infoTitle")}
                      infoContent={t("news.editor.slug.infoDescription")}
                    >
                      <input
                        value={form.slug}
                        aria-invalid={Boolean(errors.slug)}
                        placeholder="studio-news-2026"
                        onChange={(event) => {
                          slugManuallyEditedRef.current = true;

                          setForm((current) => ({
                            ...current,

                            slug: event.target.value,
                          }));

                          clearFieldError(setErrors, "slug");
                        }}
                        onBlur={() =>
                          setForm((current) => ({
                            ...current,

                            slug: slugify(current.slug),
                          }))
                        }
                        className={cn(
                          inputClass,

                          getInvalidFieldClass(errors.slug),
                        )}
                      />
                    </FormField>
                  </div>

                  <div
                    className="
                      grid
                      gap-5

                      md:grid-cols-2
                    "
                  >
                    <FormField
                      label={t("news.editor.fields.category")}
                      hint={t("news.editor.category.hint")}
                    >
                      <input
                        value={form.category}
                        list="news-category-suggestions"
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,

                            category: event.target.value,
                          }))
                        }
                        placeholder={t("news.editor.placeholders.category")}
                        className={inputClass}
                      />

                      <datalist id="news-category-suggestions">
                        {categorySuggestions.map((category) => (
                          <option key={category} value={category} />
                        ))}
                      </datalist>
                    </FormField>

                    <FormField
                      label={t("news.editor.fields.author")}
                      hint={t("news.editor.author.hint")}
                    >
                      <input
                        value={form.author}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,

                            author: event.target.value,
                          }))
                        }
                        placeholder={t("news.editor.placeholders.author")}
                        className={inputClass}
                      />
                    </FormField>
                  </div>
                </div>
              </section>

              {/* EXCERPT */}

              <section
                className="
                  mt-10

                  border-t
                  border-[var(--admin-border)]

                  pt-8
                "
              >
                <SectionHeader
                  title={t("news.editor.summary.title")}
                  description={t("news.editor.summary.description")}
                />

                <div className="mt-5">
                  <LocalizedFormField
                    label={t("news.editor.fields.excerpt")}
                    type="textarea"
                    rows={4}
                    value={form.excerpt}
                    onChange={(language, value) =>
                      updateLocalized("excerpt", language, value)
                    }
                  />
                </div>
              </section>

              {/* CONTENT */}

              <section
                className="
                  mt-10

                  border-t
                  border-[var(--admin-border)]

                  pt-8
                "
              >
                <SectionHeader
                  title={t("news.editor.content.title")}
                  description={t("news.editor.content.description")}
                />

                <div data-form-field="content" className="mt-5">
                  <LocalizedRichTextEditor
                    label={t("news.editor.fields.content")}
                    required
                    value={form.content}
                    error={getFieldError(errors, "content")}
                    minHeight={360}
                    onChange={(language, value) =>
                      updateLocalized("content", language, value)
                    }
                    placeholder={{
                      en: t("news.editor.placeholders.contentEnglish"),

                      th: t("news.editor.placeholders.contentThai"),
                    }}
                  />
                </div>
              </section>

              {/* COVER */}

              <section
                className="
                  mt-10

                  border-t
                  border-[var(--admin-border)]

                  pt-8
                "
              >
                <SectionHeader
                  title={t("news.editor.cover.title")}
                  description={t("news.editor.cover.description")}
                />

                <div className="mt-5">
                  {coverMediaId ? (
                    <div
                      className="
                        overflow-hidden

                        rounded-2xl

                        border
                        border-[var(--admin-border)]

                        bg-[var(--admin-surface)]
                      "
                    >
                      <div
                        className="
                          relative

                          aspect-[16/9]

                          overflow-hidden

                          bg-[var(--admin-background)]
                        "
                      >
                        {previewLoading && (
                          <div
                            className="
                              absolute
                              inset-0

                              animate-pulse

                              bg-[var(--admin-hover)]
                            "
                          />
                        )}

                        {previewUrl ? (
                          // Signed preview URL.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={previewUrl}
                            alt={
                              form.featuredImage?.alt?.en ||
                              form.featuredImage?.alt?.th ||
                              ""
                            }
                            className="
                              h-full
                              w-full

                              object-cover
                            "
                          />
                        ) : (
                          !previewLoading && (
                            <div
                              className="
                                flex
                                h-full

                                items-center
                                justify-center
                              "
                            >
                              <ImageIcon
                                size={24}
                                className="
                                  text-[var(--admin-muted-light)]
                                "
                              />
                            </div>
                          )
                        )}
                      </div>

                      <div
                        className="
                          flex
                          items-center
                          justify-between

                          gap-3

                          p-4
                        "
                      >
                        <button
                          type="button"
                          onClick={() => setCoverPickerOpen(true)}
                          className="
                            h-9

                            rounded-xl

                            border
                            border-[var(--admin-border)]

                            px-3

                            admin-text-12
                            font-medium

                            transition

                            hover:border-[var(--company-primary-border)]

                            hover:bg-[var(--company-primary-soft)]

                            hover:text-[var(--company-primary)]
                          "
                        >
                          {t("common.changeImage")}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPreviewUrl(null);

                            setForm((current) => ({
                              ...current,

                              featuredImage: null,
                            }));
                          }}
                          className="
                            h-9

                            rounded-xl

                            px-3

                            admin-text-12
                            font-medium

                            text-red-500

                            transition

                            hover:bg-red-50
                          "
                        >
                          {t("common.remove")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCoverPickerOpen(true)}
                      className="
                        flex
                        min-h-[220px]
                        w-full

                        flex-col
                        items-center
                        justify-center

                        rounded-2xl

                        border
                        border-dashed
                        border-[var(--admin-border)]

                        bg-[var(--admin-background)]

                        p-6

                        text-center

                        transition

                        hover:border-[var(--company-primary-border)]

                        hover:bg-[var(--company-primary-soft)]
                      "
                    >
                      <ImageIcon
                        size={22}
                        className="
                          text-[var(--company-primary)]
                        "
                      />

                      <div
                        className="
                          mt-3

                          admin-text-14
                          font-medium
                        "
                      >
                        {t("news.editor.cover.select")}
                      </div>

                      <div
                        className="
                          mt-1

                          admin-text-12

                          text-[var(--admin-muted)]
                        "
                      >
                        {t("news.editor.cover.emptyDescription")}
                      </div>
                    </button>
                  )}
                </div>
              </section>

              {/* TAGS */}

              <section
                className="
                  mt-10

                  border-t
                  border-[var(--admin-border)]

                  pt-8
                "
              >
                <SectionHeader
                  title={t("news.editor.tags.title")}
                  description={t("news.editor.tags.description")}
                />

                <div className="mt-5">
                  <TagInput
                    value={form.tags}
                    suggestions={tagSuggestions}
                    onChange={(tags) =>
                      setForm((current) => ({
                        ...current,

                        tags,
                      }))
                    }
                  />
                </div>
              </section>

              {/* FEATURED */}

              <section
                className="
                  mt-10

                  border-t
                  border-[var(--admin-border)]

                  pt-8
                "
              >
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-3",

                    "rounded-2xl border p-4",

                    "transition",

                    form.featured
                      ? [
                          "border-[var(--company-primary-border)]",

                          "bg-[var(--company-primary-soft)]",
                        ]
                      : [
                          "border-[var(--admin-border)]",

                          "bg-[var(--admin-surface)]",

                          "hover:bg-[var(--admin-hover)]",
                        ],
                  )}
                >
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,

                        featured: event.target.checked,
                      }))
                    }
                    className="
                      mt-1

                      accent-[var(--company-primary)]
                    "
                  />

                  <span
                    className="
                      flex
                      gap-3
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

                        bg-[var(--company-primary-soft)]

                        text-[var(--company-primary)]
                      "
                    >
                      <Star size={16} />
                    </span>

                    <span>
                      <span
                        className="
                          block

                          admin-text-14
                          font-medium
                        "
                      >
                        {t("news.editor.featured.title")}
                      </span>

                      <span
                        className="
                          mt-1
                          block

                          admin-text-12

                          text-[var(--admin-muted)]
                        "
                      >
                        {t("news.editor.featured.description")}
                      </span>
                    </span>
                  </span>
                </label>
              </section>

              {/* SEO */}

              <ContentSeoSection
                companyId={companyId}
                seo={form.seo}
                onChange={(seo) =>
                  setForm((current) => ({
                    ...current,

                    seo,
                  }))
                }
              />
            </div>
          </form>

          {/* FOOTER */}

          <footer
            className="
              flex
              shrink-0

              items-center
              justify-between

              gap-3

              border-t
              border-[var(--admin-border)]

              bg-[var(--admin-surface)]

              px-5
              py-4

              sm:px-8
            "
          >
            <div
              className="
                admin-text-11

                text-[var(--admin-muted)]
              "
            >
              {t("news.editor.saveHint")}
            </div>

            <div
              className="
                flex
                gap-2
              "
            >
              <button
                type="button"
                disabled={saving}
                onClick={handleClose}
                className="
                  h-10

                  rounded-xl

                  px-4

                  admin-text-14
                  font-medium

                  text-[var(--admin-muted)]

                  hover:bg-[var(--admin-hover)]
                "
              >
                {t("common.cancel")}
              </button>

              <button
                type="submit"
                form="news-editor-form"
                disabled={saving}
                className="
                  inline-flex
                  h-10
                  min-w-32

                  items-center
                  justify-center
                  gap-2

                  rounded-xl

                  bg-[var(--company-primary)]

                  px-5

                  admin-text-14
                  font-medium

                  text-[var(--company-primary-foreground)]

                  hover:bg-[var(--company-primary-hover)]

                  disabled:opacity-50
                "
              >
                {saving ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : item ? (
                  <Save size={15} />
                ) : (
                  <Newspaper size={15} />
                )}

                {saving
                  ? t("common.saving")
                  : item
                    ? t("common.saveChanges")
                    : t("news.editor.createAction")}
              </button>
            </div>
          </footer>
        </div>
      </div>

      <MediaPicker
        open={coverPickerOpen}
        companyId={companyId}
        selectedIds={coverMediaId ? [coverMediaId] : []}
        multiple={false}
        title={t("news.editor.cover.pickerTitle")}
        onClose={() => setCoverPickerOpen(false)}
        onConfirm={handleCoverSelected}
      />
    </>
  );
}
