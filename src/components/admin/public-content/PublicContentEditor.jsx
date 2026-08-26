"use client";

import {
  Check,
  ExternalLink,
  FileText,
  ImagePlus,
  LoaderCircle,
  PlaySquare,
  RefreshCw,
  X,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";

import { toast } from "sonner";

import ContentMediaSection from "@/components/admin/content/ContentMediaSection";
import ContentSeoSection from "@/components/admin/content/ContentSeoSection";
import FormField from "@/components/admin/form/FormField";
import TagInput from "@/components/admin/tag/TagInput";

import {
  PUBLIC_CONTENT_TYPE,
  PUBLIC_PROVIDER,
} from "@/constants/public-content";

import {
  clearFieldError,
  clearFieldErrors,
  focusFirstInvalidField,
  getFieldError,
  getInvalidFieldClass,
  hasErrors,
  normalizeServerFieldErrors,
  validatePublicContentForm,
} from "@/utils/admin-form-validation";

import { cn } from "@/utils/cn";
import { slugify } from "@/utils/slug";

const CONTENT_TYPES = [
  {
    value: PUBLIC_CONTENT_TYPE.ARTICLE,
    label: "Article",
    description: "Long-form editorial or media article.",
    icon: FileText,
  },
  {
    value: PUBLIC_CONTENT_TYPE.VIDEO,
    label: "Video",
    description:
      "Video hosted on YouTube, Vimeo, Facebook or another platform.",
    icon: PlaySquare,
  },
  {
    value: PUBLIC_CONTENT_TYPE.EMBED,
    label: "Embed",
    description: "Embedded social post or external media.",
    icon: PlaySquare,
  },
];

const PROVIDERS = [
  {
    value: PUBLIC_PROVIDER.YOUTUBE,
    label: "YouTube",
  },
  {
    value: PUBLIC_PROVIDER.FACEBOOK,
    label: "Facebook",
  },
  {
    value: PUBLIC_PROVIDER.VIMEO,
    label: "Vimeo",
  },
  {
    value: PUBLIC_PROVIDER.INSTAGRAM,
    label: "Instagram",
  },
  {
    value: PUBLIC_PROVIDER.TIKTOK,
    label: "TikTok",
  },
  {
    value: PUBLIC_PROVIDER.OTHER,
    label: "Other",
  },
];

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

function emptyMetadata() {
  return {
    title: "",
    description: "",
    authorName: "",
    authorUrl: null,
    thumbnailUrl: null,
    thumbnailWidth: null,
    thumbnailHeight: null,
    publishedAt: null,
    duration: null,
  };
}

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

function normalizeMetadata(metadata) {
  return {
    ...emptyMetadata(),
    ...(metadata || {}),
  };
}

function emptyForm() {
  return {
    slug: "",

    contentType: PUBLIC_CONTENT_TYPE.ARTICLE,

    title: emptyLocalized(),

    excerpt: emptyLocalized(),

    content: emptyLocalized(),

    source: {
      provider: null,
      sourceUrl: "",
      externalId: null,
      metadata: emptyMetadata(),
    },

    featuredImage: null,

    gallery: [],

    tags: [],

    featured: false,

    seo: emptySeo(),
  };
}

function normalizeItem(item) {
  if (!item) {
    return emptyForm();
  }

  return {
    slug: item.slug || "",

    contentType: item.contentType || PUBLIC_CONTENT_TYPE.ARTICLE,

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

    source: {
      provider: item.source?.provider || null,
      sourceUrl: item.source?.sourceUrl || "",
      externalId: item.source?.externalId || null,
      metadata: normalizeMetadata(item.source?.metadata),
    },

    featuredImage: item.featuredImage || null,

    gallery: Array.isArray(item.gallery) ? item.gallery : [],

    tags: Array.isArray(item.tags) ? item.tags : [],

    featured: item.featured === true,

    seo: normalizeSeo(item.seo),
  };
}

function normalizeArray(payload) {
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
}

function extractTagSuggestions(items) {
  const tags = new Map();

  for (const item of items) {
    if (!Array.isArray(item?.tags)) {
      continue;
    }

    for (const rawTag of item.tags) {
      const tag = String(rawTag || "")
        .trim()
        .replace(/\s+/g, " ");

      if (!tag) {
        continue;
      }

      const key = tag.toLowerCase();

      if (!tags.has(key)) {
        tags.set(key, tag);
      }
    }
  }

  return [...tags.values()].sort((a, b) =>
    a.localeCompare(b, "en", {
      sensitivity: "base",
    }),
  );
}

function truncateText(value, maxLength = 300) {
  const text = String(value || "")
    .trim()
    .replace(/\s+/g, " ");

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1)}…`;
}

function formatPublishedDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
}

function formatIsoDuration(value) {
  if (!value) {
    return null;
  }

  const match = String(value).match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);

  if (!match) {
    return value;
  }

  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);

  if (hours > 0) {
    return [
      hours,
      String(minutes).padStart(2, "0"),
      String(seconds).padStart(2, "0"),
    ].join(":");
  }

  return [minutes, String(seconds).padStart(2, "0")].join(":");
}

function createImportedImage(media, metadata) {
  return {
    mediaId: media.id,

    alt: {
      th: "",
      en: metadata.title || "",
    },

    caption: {
      th: "",
      en: metadata.authorName
        ? `YouTube thumbnail — ${metadata.authorName}`
        : "YouTube thumbnail",
    },
  };
}

export default function PublicContentEditor({
  open,
  companyId,
  item,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState(() => normalizeItem(item));

  const [saving, setSaving] = useState(false);

  const [metadataLoading, setMetadataLoading] = useState(false);

  const [importingThumbnail, setImportingThumbnail] = useState(false);

  const [importedThumbnailMedia, setImportedThumbnailMedia] = useState(null);

  const [errors, setErrors] = useState({});

  const [tagSuggestions, setTagSuggestions] = useState([]);

  const slugManuallyEditedRef = useRef(false);

  const lastResolvedUrlRef = useRef("");

  useEffect(() => {
    if (!open) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const nextForm = normalizeItem(item);

      setForm(nextForm);

      setErrors({});

      setImportedThumbnailMedia(null);

      slugManuallyEditedRef.current = Boolean(item?.id);

      lastResolvedUrlRef.current = nextForm.source.sourceUrl || "";
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [item, open]);

  useEffect(() => {
    if (!open || !companyId) {
      return;
    }

    let cancelled = false;

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/v1/companies/${companyId}/public-contents`,
          {
            method: "GET",
            cache: "no-store",
            credentials: "include",
          },
        );

        const payload = await response.json();

        if (!response.ok || payload?.success === false) {
          throw new Error(
            payload?.message || "Unable to retrieve public content tags.",
          );
        }

        if (cancelled) {
          return;
        }

        setTagSuggestions(extractTagSuggestions(normalizeArray(payload)));
      } catch (error) {
        console.error("Load public content tag suggestions error:", error);

        if (!cancelled) {
          setTagSuggestions([]);
        }
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [companyId, open]);

  if (!open) {
    return null;
  }

  function updateLocalized(field, language, value) {
    setForm((current) => ({
      ...current,

      [field]: {
        ...current[field],
        [language]: value,
      },
    }));

    if (field === "title") {
      clearFieldError(setErrors, "title");
    }

    if (field === "content") {
      clearFieldError(setErrors, "content");
    }
  }

  function changeContentType(contentType) {
    setForm((current) => ({
      ...current,

      contentType,

      source:
        contentType === PUBLIC_CONTENT_TYPE.ARTICLE
          ? {
              provider: null,
              sourceUrl: "",
              externalId: null,
              metadata: emptyMetadata(),
            }
          : current.source,
    }));

    setImportedThumbnailMedia(null);

    lastResolvedUrlRef.current = "";

    clearFieldErrors(setErrors, [
      "contentType",
      "content",
      "sourceProvider",
      "sourceUrl",
    ]);
  }

  function applyValidationErrors(validationErrors) {
    setErrors(validationErrors);

    focusFirstInvalidField(validationErrors);

    toast.error("Please complete the required fields.");
  }

  async function fetchExternalMetadata({ force = false } = {}) {
    if (!companyId || metadataLoading) {
      return;
    }

    const sourceUrl = String(form.source.sourceUrl || "").trim();

    if (!sourceUrl) {
      return;
    }

    if (!force && lastResolvedUrlRef.current === sourceUrl) {
      return;
    }

    try {
      setMetadataLoading(true);

      clearFieldError(setErrors, "sourceUrl");

      const response = await fetch(
        `/api/v1/companies/${companyId}/public-contents/external-media`,
        {
          method: "POST",

          credentials: "include",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            sourceUrl,
          }),
        },
      );

      let result = null;

      try {
        result = await response.json();
      } catch {
        result = null;
      }

      if (!response.ok || result?.success === false) {
        throw new Error(
          result?.message || "Unable to retrieve video information.",
        );
      }

      const data = result?.data;

      if (!data) {
        throw new Error("Unable to retrieve video information.");
      }

      lastResolvedUrlRef.current = data.canonicalUrl || sourceUrl;

      setImportedThumbnailMedia(null);

      setForm((current) => {
        const metadata = normalizeMetadata(data.metadata);

        const shouldSetTitle = !current.title.en.trim();

        const shouldSetExcerpt =
          !current.excerpt.en.trim() && Boolean(metadata.description);

        const shouldSetSlug =
          !item &&
          !slugManuallyEditedRef.current &&
          !current.slug.trim() &&
          Boolean(metadata.title);

        return {
          ...current,

          source: {
            ...current.source,

            provider: data.provider || current.source.provider,

            sourceUrl: data.canonicalUrl || current.source.sourceUrl,

            externalId: data.externalId || null,

            metadata,
          },

          title: shouldSetTitle
            ? {
                ...current.title,
                en: metadata.title,
              }
            : current.title,

          excerpt: shouldSetExcerpt
            ? {
                ...current.excerpt,
                en: truncateText(metadata.description, 500),
              }
            : current.excerpt,

          slug: shouldSetSlug ? slugify(metadata.title) : current.slug,

          seo: {
            ...current.seo,

            en: {
              ...current.seo.en,

              title: current.seo.en.title || truncateText(metadata.title, 70),

              description:
                current.seo.en.description ||
                truncateText(metadata.description, 180),

              ogTitle:
                current.seo.en.ogTitle || truncateText(metadata.title, 100),

              ogDescription:
                current.seo.en.ogDescription ||
                truncateText(metadata.description, 200),
            },
          },
        };
      });

      clearFieldErrors(setErrors, [
        "sourceProvider",
        "sourceUrl",
        "title",
        "slug",
      ]);

      toast.success("Video information loaded.");
    } catch (error) {
      console.error("Load external media metadata error:", error);

      const sourceErrors = {
        sourceUrl: error?.message || "Unable to retrieve video information.",
      };

      setErrors((current) => ({
        ...current,
        ...sourceErrors,
      }));

      toast.error(sourceErrors.sourceUrl);
    } finally {
      setMetadataLoading(false);
    }
  }

  async function importThumbnail() {
    if (
      !companyId ||
      importingThumbnail ||
      !metadata.thumbnailUrl ||
      importedThumbnailMedia
    ) {
      return;
    }

    try {
      setImportingThumbnail(true);

      const response = await fetch(
        `/api/v1/companies/${companyId}/media/import-url`,
        {
          method: "POST",

          credentials: "include",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            url: metadata.thumbnailUrl,

            usage: "public",

            alt: {
              th: "",
              en: metadata.title || "",
            },

            caption: {
              th: "",
              en: metadata.authorName
                ? `YouTube thumbnail — ${metadata.authorName}`
                : "YouTube thumbnail",
            },
          }),
        },
      );

      let result = null;

      try {
        result = await response.json();
      } catch {
        result = null;
      }

      if (!response.ok || result?.success === false || !result?.data?.id) {
        throw new Error(result?.message || "Unable to import thumbnail.");
      }

      setImportedThumbnailMedia(result.data);

      toast.success("Thumbnail imported to Media Library.");
    } catch (error) {
      console.error("Import YouTube thumbnail error:", error);

      toast.error(error?.message || "Unable to import thumbnail.");
    } finally {
      setImportingThumbnail(false);
    }
  }

  function useImportedThumbnailAsCover() {
    if (!importedThumbnailMedia?.id) {
      return;
    }

    if (
      form.featuredImage?.mediaId &&
      form.featuredImage.mediaId !== importedThumbnailMedia.id
    ) {
      const confirmed = window.confirm(
        "This content already has a cover image.\n\nReplace the current cover image with the imported YouTube thumbnail?",
      );

      if (!confirmed) {
        return;
      }
    }

    const image = createImportedImage(importedThumbnailMedia, metadata);

    setForm((current) => ({
      ...current,

      featuredImage: image,
    }));

    toast.success("YouTube thumbnail set as cover image.");
  }

  function createPayload(slug) {
    return {
      slug,

      contentType: form.contentType,

      title: form.title,

      excerpt: form.excerpt,

      content: form.content,

      source:
        form.contentType === PUBLIC_CONTENT_TYPE.ARTICLE
          ? {
              provider: null,
              sourceUrl: null,
              externalId: null,
              metadata: null,
            }
          : {
              provider: form.source.provider || null,
              sourceUrl: form.source.sourceUrl?.trim() || null,
              externalId: form.source.externalId || null,
              metadata: form.source.metadata || null,
            },

      featuredImage: form.featuredImage,

      gallery: form.gallery,

      tags: form.tags,

      featured: form.featured,

      seo: form.seo,
    };
  }

  async function saveContent(payload) {
    const editing = Boolean(item?.id);

    const response = await fetch(
      editing
        ? `/api/v1/companies/${companyId}/public-contents/${item.id}`
        : `/api/v1/companies/${companyId}/public-contents`,
      {
        method: editing ? "PATCH" : "POST",

        credentials: "include",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(payload),
      },
    );

    let result = null;

    try {
      result = await response.json();
    } catch {
      result = null;
    }

    return {
      response,
      result,
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!companyId || saving || importingThumbnail) {
      return;
    }

    const normalizedSlug = slugify(form.slug);

    const normalizedForm = {
      ...form,
      slug: normalizedSlug,
    };

    const validationErrors = validatePublicContentForm(normalizedForm);

    if (hasErrors(validationErrors)) {
      applyValidationErrors(validationErrors);
      return;
    }

    try {
      setSaving(true);
      setErrors({});

      let currentSlug = normalizedSlug;

      let conflictAttempts = 0;

      const maxConflictAttempts = 5;

      while (conflictAttempts <= maxConflictAttempts) {
        const payload = createPayload(currentSlug);

        const { response, result } = await saveContent(payload);

        if (response.ok && result?.success !== false) {
          setForm((current) => ({
            ...current,
            slug: currentSlug,
          }));

          slugManuallyEditedRef.current = true;

          toast.success(
            item
              ? "Public content updated successfully."
              : "Public content created successfully.",
          );

          await onSaved?.(result?.data);

          return;
        }

        const serverErrors = normalizeServerFieldErrors(result?.errors);

        if (hasErrors(serverErrors)) {
          setErrors(serverErrors);
          focusFirstInvalidField(serverErrors);
        }

        const slugConflict =
          response.status === 409 &&
          (result?.code === "PUBLIC_SLUG_EXISTS" ||
            String(result?.message || "")
              .toLowerCase()
              .includes("slug"));

        if (!slugConflict) {
          throw new Error(result?.message || "Unable to save public content.");
        }

        const suggestedSlug = slugify(result?.suggestedSlug);

        if (!suggestedSlug || suggestedSlug === currentSlug) {
          const slugErrors = {
            slug: "This slug is already in use.",
          };

          setErrors(slugErrors);

          focusFirstInvalidField(slugErrors);

          toast.error(
            "This slug is already in use and no alternative slug is currently available.",
          );

          return;
        }

        const confirmed = window.confirm(
          `The slug "${currentSlug}" is already in use.\n\n` +
            `Would you like to use "${suggestedSlug}" instead?`,
        );

        if (!confirmed) {
          const slugErrors = {
            slug: "This slug is already in use.",
          };

          setErrors(slugErrors);

          focusFirstInvalidField(slugErrors);

          return;
        }

        currentSlug = suggestedSlug;

        conflictAttempts += 1;

        setForm((current) => ({
          ...current,
          slug: suggestedSlug,
        }));

        slugManuallyEditedRef.current = true;

        clearFieldError(setErrors, "slug");

        if (conflictAttempts > maxConflictAttempts) {
          throw new Error(
            "Unable to reserve an available slug. Please enter another slug.",
          );
        }
      }
    } catch (error) {
      console.error("Save public content error:", error);

      toast.error(error?.message || "Unable to save public content.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = cn(
    "h-11 w-full rounded-xl",
    "border border-[var(--admin-border)]",
    "bg-[var(--admin-surface)] px-3",
    "text-sm text-[var(--admin-foreground)]",
    "outline-none transition",
    "placeholder:text-[var(--admin-muted-light)]",
    "focus:border-[var(--company-primary)]",
    "focus:ring-2 focus:ring-[var(--company-primary-soft)]",
  );

  const textareaClass = cn(
    "w-full rounded-xl",
    "border border-[var(--admin-border)]",
    "bg-[var(--admin-surface)] p-3",
    "text-sm text-[var(--admin-foreground)]",
    "outline-none transition",
    "placeholder:text-[var(--admin-muted-light)]",
    "focus:border-[var(--company-primary)]",
    "focus:ring-2 focus:ring-[var(--company-primary-soft)]",
  );

  const requiresSource =
    form.contentType === PUBLIC_CONTENT_TYPE.VIDEO ||
    form.contentType === PUBLIC_CONTENT_TYPE.EMBED;

  const metadata = form.source.metadata || emptyMetadata();

  const importedThumbnailIsCover =
    Boolean(importedThumbnailMedia?.id) &&
    form.featuredImage?.mediaId === importedThumbnailMedia.id;

  const busy = saving || metadataLoading || importingThumbnail;

  return (
    <div className="fixed inset-0 z-[200]">
      <button
        type="button"
        aria-label="Close public content editor"
        className="absolute inset-0 bg-black/40"
        onClick={busy ? undefined : onClose}
      />

      <div className="absolute inset-y-0 right-0 flex w-full max-w-5xl flex-col bg-[var(--admin-background)] shadow-2xl">
        <header className="flex items-center justify-between border-b border-[var(--admin-border)] bg-[var(--admin-surface)] px-5 py-4 sm:px-6">
          <div>
            <div className="text-xs uppercase tracking-[0.14em] text-[var(--admin-muted)]">
              Public Content
            </div>

            <h2 className="mt-1 text-xl font-semibold text-[var(--admin-foreground)]">
              {item ? "Edit Content" : "New Content"}
            </h2>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--admin-border)] text-[var(--admin-muted)] transition hover:bg-[var(--admin-hover)] disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </header>

        <form
          id="public-content-editor-form"
          onSubmit={handleSubmit}
          noValidate
          className="flex-1 overflow-y-auto"
        >
          <div className="p-5 sm:p-6">
            <section>
              <h3 className="text-sm font-semibold text-[var(--admin-foreground)]">
                Content Type
              </h3>

              <p className="mt-1 text-xs leading-5 text-[var(--admin-muted)]">
                Choose how this content will be presented on the public website.
              </p>

              <div
                data-form-field="contentType"
                className="mt-4 grid gap-3 sm:grid-cols-3"
              >
                {CONTENT_TYPES.map(
                  ({ value, label, description, icon: Icon }) => {
                    const active = form.contentType === value;

                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => changeContentType(value)}
                        className={cn(
                          "rounded-2xl border p-4 text-left transition",

                          active
                            ? "border-[var(--company-primary)] bg-[var(--company-primary-soft)]"
                            : "border-[var(--admin-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-hover)]",

                          getInvalidFieldClass(errors.contentType),
                        )}
                      >
                        <Icon
                          size={18}
                          className={
                            active
                              ? "text-[var(--company-primary)]"
                              : "text-[var(--admin-muted)]"
                          }
                        />

                        <div className="mt-3 text-sm font-medium text-[var(--admin-foreground)]">
                          {label}
                        </div>

                        <p className="mt-1 text-[11px] leading-5 text-[var(--admin-muted)]">
                          {description}
                        </p>
                      </button>
                    );
                  },
                )}
              </div>

              {errors.contentType && (
                <p className="mt-2 text-xs font-medium text-red-500">
                  {errors.contentType}
                </p>
              )}
            </section>

            <section className="mt-10 border-t border-[var(--admin-border)] pt-8">
              <h3 className="text-sm font-semibold text-[var(--admin-foreground)]">
                Basic Information
              </h3>

              <div
                data-form-field="title"
                className="mt-5 grid gap-4 sm:grid-cols-2"
              >
                <FormField
                  label="Title — English"
                  required
                  error={getFieldError(errors, "title")}
                >
                  <input
                    value={form.title.en}
                    aria-invalid={Boolean(errors.title)}
                    onChange={(event) => {
                      const value = event.target.value;

                      setForm((current) => ({
                        ...current,

                        title: {
                          ...current.title,
                          en: value,
                        },

                        slug:
                          !item && !slugManuallyEditedRef.current
                            ? slugify(value)
                            : current.slug,
                      }));

                      clearFieldError(setErrors, "title");

                      if (!item && !slugManuallyEditedRef.current) {
                        clearFieldError(setErrors, "slug");
                      }
                    }}
                    className={cn(
                      inputClass,
                      getInvalidFieldClass(errors.title),
                    )}
                  />
                </FormField>

                <FormField label="Title — ไทย" required>
                  <input
                    value={form.title.th}
                    aria-invalid={Boolean(errors.title)}
                    onChange={(event) =>
                      updateLocalized("title", "th", event.target.value)
                    }
                    className={cn(
                      inputClass,
                      getInvalidFieldClass(errors.title),
                    )}
                  />
                </FormField>
              </div>

              <div data-form-field="slug" className="mt-4">
                <FormField
                  label="Slug"
                  required
                  error={getFieldError(errors, "slug")}
                  hint="Lowercase letters, numbers and hyphens only."
                >
                  <input
                    value={form.slug}
                    aria-invalid={Boolean(errors.slug)}
                    onChange={(event) => {
                      slugManuallyEditedRef.current = true;

                      setForm((current) => ({
                        ...current,
                        slug: slugify(event.target.value),
                      }));

                      clearFieldError(setErrors, "slug");
                    }}
                    placeholder="public-content-slug"
                    className={cn(
                      inputClass,
                      getInvalidFieldClass(errors.slug),
                    )}
                  />
                </FormField>
              </div>
            </section>

            {requiresSource && (
              <section className="mt-10 border-t border-[var(--admin-border)] pt-8">
                <h3 className="text-sm font-semibold text-[var(--admin-foreground)]">
                  External Source
                </h3>

                <p className="mt-1 text-xs leading-5 text-[var(--admin-muted)]">
                  Paste a YouTube URL. Provider, video ID and available metadata
                  will be detected automatically.
                </p>

                <div className="mt-5">
                  <div data-form-field="sourceUrl">
                    <FormField
                      label="Source URL"
                      required
                      error={getFieldError(errors, "sourceUrl")}
                      hint="Supports youtube.com/watch, youtu.be, Shorts, Live and Embed URLs."
                    >
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          type="url"
                          value={form.source.sourceUrl || ""}
                          aria-invalid={Boolean(errors.sourceUrl)}
                          placeholder="https://www.youtube.com/watch?v=..."
                          onChange={(event) => {
                            const value = event.target.value;

                            lastResolvedUrlRef.current = "";

                            setImportedThumbnailMedia(null);

                            setForm((current) => ({
                              ...current,

                              source: {
                                ...current.source,

                                sourceUrl: value,

                                externalId: null,

                                metadata: emptyMetadata(),
                              },
                            }));

                            clearFieldError(setErrors, "sourceUrl");
                          }}
                          onBlur={() => fetchExternalMetadata()}
                          className={cn(
                            inputClass,
                            "flex-1",
                            getInvalidFieldClass(errors.sourceUrl),
                          )}
                        />

                        <button
                          type="button"
                          disabled={
                            metadataLoading || !form.source.sourceUrl?.trim()
                          }
                          onClick={() =>
                            fetchExternalMetadata({
                              force: true,
                            })
                          }
                          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-sm font-medium text-[var(--admin-foreground)] transition hover:bg-[var(--admin-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {metadataLoading ? (
                            <LoaderCircle size={15} className="animate-spin" />
                          ) : (
                            <RefreshCw size={15} />
                          )}

                          {metadataLoading ? "Loading..." : "Fetch Video Info"}
                        </button>
                      </div>
                    </FormField>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div data-form-field="sourceProvider">
                    <FormField
                      label="Provider"
                      required
                      error={getFieldError(errors, "sourceProvider")}
                    >
                      <select
                        value={form.source.provider || ""}
                        aria-invalid={Boolean(errors.sourceProvider)}
                        onChange={(event) => {
                          setForm((current) => ({
                            ...current,

                            source: {
                              ...current.source,
                              provider: event.target.value || null,
                            },
                          }));

                          clearFieldError(setErrors, "sourceProvider");
                        }}
                        className={cn(
                          inputClass,
                          getInvalidFieldClass(errors.sourceProvider),
                        )}
                      >
                        <option value="">Auto detect</option>

                        {PROVIDERS.map((provider) => (
                          <option key={provider.value} value={provider.value}>
                            {provider.label}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </div>

                  <FormField
                    label="External ID"
                    hint="Detected automatically when supported."
                  >
                    <input
                      value={form.source.externalId || ""}
                      readOnly
                      placeholder="Video ID"
                      className={cn(
                        inputClass,
                        "cursor-default bg-[var(--admin-background)]",
                      )}
                    />
                  </FormField>
                </div>

                {metadata.thumbnailUrl && (
                  <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
                    <div
                      className="aspect-video w-full bg-[var(--admin-background)] bg-cover bg-center"
                      style={{
                        backgroundImage: `url("${metadata.thumbnailUrl}")`,
                      }}
                    />

                    <div className="p-4 sm:p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-muted)]">
                            YouTube Preview
                          </div>

                          <div className="mt-2 text-sm font-semibold leading-6 text-[var(--admin-foreground)]">
                            {metadata.title || "Untitled video"}
                          </div>

                          {metadata.authorName && (
                            <div className="mt-1 text-xs text-[var(--admin-muted)]">
                              {metadata.authorName}
                            </div>
                          )}

                          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[var(--admin-muted)]">
                            {metadata.publishedAt && (
                              <span>
                                Published{" "}
                                {formatPublishedDate(metadata.publishedAt)}
                              </span>
                            )}

                            {metadata.duration && (
                              <span>
                                Duration {formatIsoDuration(metadata.duration)}
                              </span>
                            )}
                          </div>
                        </div>

                        {form.source.sourceUrl && (
                          <a
                            href={form.source.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--admin-border)] px-3 text-xs font-medium text-[var(--admin-foreground)] transition hover:bg-[var(--admin-hover)]"
                          >
                            <ExternalLink size={14} />
                            Open YouTube
                          </a>
                        )}
                      </div>

                      {metadata.description && (
                        <p className="mt-4 line-clamp-4 text-xs leading-5 text-[var(--admin-muted)]">
                          {metadata.description}
                        </p>
                      )}

                      <div className="mt-5 border-t border-[var(--admin-border)] pt-4">
                        {!importedThumbnailMedia ? (
                          <button
                            type="button"
                            disabled={importingThumbnail}
                            onClick={importThumbnail}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--company-primary)] px-4 text-xs font-medium text-[var(--company-primary-foreground)] transition hover:bg-[var(--company-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {importingThumbnail ? (
                              <LoaderCircle
                                size={15}
                                className="animate-spin"
                              />
                            ) : (
                              <ImagePlus size={15} />
                            )}

                            {importingThumbnail
                              ? "Importing..."
                              : "Import to Media Library"}
                          </button>
                        ) : (
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="inline-flex items-center gap-2 text-xs font-medium text-[var(--admin-foreground)]">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--company-primary-soft)] text-[var(--company-primary)]">
                                <Check size={14} />
                              </span>
                              Imported to Media Library
                            </div>

                            <button
                              type="button"
                              disabled={importedThumbnailIsCover}
                              onClick={useImportedThumbnailAsCover}
                              className={cn(
                                "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-xs font-medium transition",

                                importedThumbnailIsCover
                                  ? "cursor-default border border-[var(--company-primary)] bg-[var(--company-primary-soft)] text-[var(--company-primary)]"
                                  : "bg-[var(--company-primary)] text-[var(--company-primary-foreground)] hover:bg-[var(--company-primary-hover)]",
                              )}
                            >
                              {importedThumbnailIsCover ? (
                                <Check size={15} />
                              ) : (
                                <ImagePlus size={15} />
                              )}

                              {importedThumbnailIsCover
                                ? "Used as Cover"
                                : "Use as Cover"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            <section className="mt-10 border-t border-[var(--admin-border)] pt-8">
              <h3 className="text-sm font-semibold text-[var(--admin-foreground)]">
                Content
              </h3>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <FormField label="Excerpt — English">
                  <textarea
                    rows={4}
                    value={form.excerpt.en}
                    onChange={(event) =>
                      updateLocalized("excerpt", "en", event.target.value)
                    }
                    className={textareaClass}
                  />
                </FormField>

                <FormField label="Excerpt — ไทย">
                  <textarea
                    rows={4}
                    value={form.excerpt.th}
                    onChange={(event) =>
                      updateLocalized("excerpt", "th", event.target.value)
                    }
                    className={textareaClass}
                  />
                </FormField>
              </div>

              <div
                data-form-field="content"
                className="mt-4 grid gap-4 sm:grid-cols-2"
              >
                <FormField
                  label="Content — English"
                  required={form.contentType === PUBLIC_CONTENT_TYPE.ARTICLE}
                  error={getFieldError(errors, "content")}
                >
                  <textarea
                    rows={12}
                    value={form.content.en}
                    aria-invalid={Boolean(errors.content)}
                    onChange={(event) =>
                      updateLocalized("content", "en", event.target.value)
                    }
                    className={cn(
                      textareaClass,
                      getInvalidFieldClass(errors.content),
                    )}
                  />
                </FormField>

                <FormField
                  label="Content — ไทย"
                  required={form.contentType === PUBLIC_CONTENT_TYPE.ARTICLE}
                >
                  <textarea
                    rows={12}
                    value={form.content.th}
                    aria-invalid={Boolean(errors.content)}
                    onChange={(event) =>
                      updateLocalized("content", "th", event.target.value)
                    }
                    className={cn(
                      textareaClass,
                      getInvalidFieldClass(errors.content),
                    )}
                  />
                </FormField>
              </div>
            </section>

            <ContentMediaSection
              companyId={companyId}
              contentLabel="Public Content"
              featuredImage={form.featuredImage}
              gallery={form.gallery}
              onFeaturedImageChange={(featuredImage) =>
                setForm((current) => ({
                  ...current,
                  featuredImage,
                }))
              }
              onGalleryChange={(gallery) =>
                setForm((current) => ({
                  ...current,
                  gallery,
                }))
              }
            />

            <section className="mt-10 border-t border-[var(--admin-border)] pt-8">
              <h3 className="text-sm font-semibold text-[var(--admin-foreground)]">
                Tags
              </h3>

              <p className="mt-1 text-xs leading-5 text-[var(--admin-muted)]">
                Add keywords for classification, search and related content.
              </p>

              <div className="mt-4">
                <TagInput
                  value={form.tags}
                  suggestions={tagSuggestions}
                  placeholder="architecture"
                  onChange={(tags) =>
                    setForm((current) => ({
                      ...current,
                      tags,
                    }))
                  }
                />
              </div>
            </section>

            <section className="mt-10 border-t border-[var(--admin-border)] pt-8">
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--admin-border)] p-4 sm:p-5">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      featured: event.target.checked,
                    }))
                  }
                  className="mt-0.5 h-4 w-4 accent-[var(--company-primary)]"
                />

                <span>
                  <span className="block text-sm font-medium text-[var(--admin-foreground)]">
                    Featured Content
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-[var(--admin-muted)]">
                    Highlight this content in supported public layouts.
                  </span>
                </span>
              </label>
            </section>

            <ContentSeoSection
              companyId={companyId}
              contentLabel="Public Content"
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

        <footer className="flex items-center justify-end gap-3 border-t border-[var(--admin-border)] bg-[var(--admin-surface)] px-5 py-4 sm:px-6">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="h-10 rounded-xl border border-[var(--admin-border)] px-4 text-sm font-medium text-[var(--admin-foreground)] transition hover:bg-[var(--admin-hover)] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="public-content-editor-form"
            disabled={busy}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--company-primary)] px-5 text-sm font-medium text-[var(--company-primary-foreground)] transition hover:bg-[var(--company-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving && <LoaderCircle size={15} className="animate-spin" />}

            {saving ? "Saving..." : item ? "Save Changes" : "Create Content"}
          </button>
        </footer>
      </div>
    </div>
  );
}
