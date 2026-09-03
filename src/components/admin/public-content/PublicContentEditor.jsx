"use client";

import {
  Check,
  ExternalLink,
  FileText,
  LoaderCircle,
  PlaySquare,
  RefreshCw,
  Save,
  Star,
  X,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";

import { toast } from "sonner";

import ContentMediaSection from "@/components/admin/content/ContentMediaSection";
import ContentSeoSection from "@/components/admin/content/ContentSeoSection";

import FormField from "@/components/admin/form/FormField";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import LocalizedFormField from "@/components/admin/localization/LocalizedFormField";
import LocalizedRichTextEditor from "@/components/admin/localization/LocalizedRichTextEditor";

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
} from "@/utils/admin-form-validation";

import {
  applyContentSeoDefaults,
  syncSeoImageSource,
  syncSeoKeywordsSource,
  syncSeoTextSource,
} from "@/utils/content-seo";

import { cn } from "@/utils/cn";

import { slugify } from "@/utils/slug";

/*
 * =========================================================
 * CONSTANTS
 * =========================================================
 */

const CONTENT_TYPE_VALUES = [
  PUBLIC_CONTENT_TYPE.ARTICLE,
  PUBLIC_CONTENT_TYPE.VIDEO,
  PUBLIC_CONTENT_TYPE.EMBED,
];

const PROVIDER_VALUES = [
  PUBLIC_PROVIDER.YOUTUBE,
  PUBLIC_PROVIDER.FACEBOOK,
  PUBLIC_PROVIDER.VIMEO,
  PUBLIC_PROVIDER.INSTAGRAM,
  PUBLIC_PROVIDER.TIKTOK,
  PUBLIC_PROVIDER.OTHER,
];

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

function emptySource() {
  return {
    provider: null,

    sourceUrl: "",

    externalId: null,

    metadata: emptyMetadata(),
  };
}

function emptyForm() {
  return {
    slug: "",

    contentType: PUBLIC_CONTENT_TYPE.ARTICLE,

    title: emptyLocalized(),

    excerpt: emptyLocalized(),

    content: emptyLocalized(),

    source: emptySource(),

    featuredImage: null,

    gallery: [],

    tags: [],

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

function normalizeMetadata(metadata) {
  return {
    ...emptyMetadata(),

    ...(metadata || {}),
  };
}

function normalizeItem(item) {
  if (!item) {
    return emptyForm();
  }

  const normalized = {
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

  return {
    ...normalized,

    seo: applyContentSeoDefaults({
      seo: normalized.seo,

      title: normalized.title,

      description: normalized.excerpt,

      keywords: normalized.tags,

      image: normalized.featuredImage,
    }),
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

/*
 * =========================================================
 * TAGS
 * =========================================================
 */

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

  return [...tags.values()].sort((first, second) =>
    first.localeCompare(second, "en", {
      sensitivity: "base",
    }),
  );
}

/*
 * =========================================================
 * TEXT
 * =========================================================
 */

function truncateText(value, maxLength = 300) {
  const text = String(value || "")
    .trim()
    .replace(/\s+/g, " ");

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1)}…`;
}

/*
 * =========================================================
 * DATE / DURATION
 * =========================================================
 */

function formatPublishedDate(value, locale) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
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

/*
 * =========================================================
 * RICH TEXT
 * =========================================================
 */

function richTextHasContent(value) {
  if (typeof value === "string") {
    const text = value
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    return Boolean(text);
  }

  if (
    !value ||
    typeof value !== "object" ||
    value.type !== "doc" ||
    !Array.isArray(value.content)
  ) {
    return false;
  }

  function nodeHasContent(node) {
    if (!node) {
      return false;
    }

    if (
      node.type === "text" &&
      typeof node.text === "string" &&
      node.text.trim()
    ) {
      return true;
    }

    if (
      ["image", "horizontalRule", "youtube", "video", "embed"].includes(
        node.type,
      )
    ) {
      return true;
    }

    return Array.isArray(node.content) && node.content.some(nodeHasContent);
  }

  return value.content.some(nodeHasContent);
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
 * PUBLIC CONTENT EDITOR
 * =========================================================
 */

export default function PublicContentEditor({
  open,

  companyId,

  item,

  onClose,

  onSaved,
}) {
  const { t, locale } = useAdminTranslation();

  const [form, setForm] = useState(() => normalizeItem(item));

  const [saving, setSaving] = useState(false);

  const [metadataLoading, setMetadataLoading] = useState(false);

  const [errors, setErrors] = useState({});

  const [tagSuggestions, setTagSuggestions] = useState([]);

  const [tagSuggestionsLoading, setTagSuggestionsLoading] = useState(false);

  const slugManuallyEditedRef = useRef(false);

  const lastResolvedUrlRef = useRef("");

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
      const nextForm = normalizeItem(item);

      setForm(nextForm);

      setErrors({});

      slugManuallyEditedRef.current = Boolean(item?.id);

      lastResolvedUrlRef.current = nextForm.source.sourceUrl || "";
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [item, open]);

  /*
   * =======================================================
   * TAG SUGGESTIONS
   * =======================================================
   */

  useEffect(() => {
    if (!open || !companyId) {
      return;
    }

    let cancelled = false;

    const timeoutId = window.setTimeout(async () => {
      try {
        if (!cancelled) {
          setTagSuggestionsLoading(true);
        }

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
            payload?.message || t("publicContent.editor.errors.loadTags"),
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
      } finally {
        if (!cancelled) {
          setTagSuggestionsLoading(false);
        }
      }
    }, 0);

    return () => {
      cancelled = true;

      window.clearTimeout(timeoutId);
    };
  }, [companyId, open, t]);

  if (!open) {
    return null;
  }

  /*
   * =======================================================
   * TRANSLATED OPTIONS
   * =======================================================
   */

  function getContentTypeMeta(value) {
    const meta = {
      [PUBLIC_CONTENT_TYPE.ARTICLE]: {
        icon: FileText,

        label: t("publicContent.types.article"),

        description: t("publicContent.editor.contentTypes.article"),
      },

      [PUBLIC_CONTENT_TYPE.VIDEO]: {
        icon: PlaySquare,

        label: t("publicContent.types.video"),

        description: t("publicContent.editor.contentTypes.video"),
      },

      [PUBLIC_CONTENT_TYPE.EMBED]: {
        icon: PlaySquare,

        label: t("publicContent.types.embed"),

        description: t("publicContent.editor.contentTypes.embed"),
      },
    };

    return meta[value] || meta[PUBLIC_CONTENT_TYPE.ARTICLE];
  }

  function getProviderLabel(provider) {
    if (!provider) {
      return "";
    }

    return t(`publicContent.providers.${provider}`);
  }

  /*
   * =======================================================
   * LOCALIZED FIELD
   * =======================================================
   */

  function updateLocalized(field, language, value) {
    setForm((current) => {
      const previousValue = current[field]?.[language] || "";

      return {
        ...current,

        [field]: {
          ...current[field],

          [language]: value,
        },

        seo:
          field === "excerpt"
            ? syncSeoTextSource({
                seo: current.seo,

                language,

                previousSource: previousValue,

                nextSource: value,

                fields: ["description", "ogDescription"],
              })
            : current.seo,
      };
    });

    if (field === "title") {
      clearFieldError(setErrors, "title");
    }

    if (field === "content") {
      clearFieldError(setErrors, "content");
    }
  }

  /*
   * =======================================================
   * TITLE
   * =======================================================
   */

  function updateTitle(language, value) {
    setForm((current) => {
      const previousTitle = current.title?.[language] || "";

      return {
        ...current,

        title: {
          ...current.title,

          [language]: value,
        },

        slug:
          language === "en" && !item && !slugManuallyEditedRef.current
            ? slugify(value)
            : current.slug,

        seo: syncSeoTextSource({
          seo: current.seo,

          language,

          previousSource: previousTitle,

          nextSource: value,

          fields: ["title", "ogTitle"],
        }),
      };
    });

    clearFieldError(setErrors, "title");

    if (language === "en" && !item && !slugManuallyEditedRef.current) {
      clearFieldError(setErrors, "slug");
    }
  }

  /*
   * =======================================================
   * CONTENT TYPE
   * =======================================================
   */

  function changeContentType(contentType) {
    setForm((current) => ({
      ...current,

      contentType,

      source:
        contentType === PUBLIC_CONTENT_TYPE.ARTICLE
          ? emptySource()
          : current.source,
    }));

    lastResolvedUrlRef.current = "";

    clearFieldErrors(setErrors, [
      "contentType",
      "content",
      "sourceProvider",
      "sourceUrl",
    ]);
  }

  /*
   * =======================================================
   * VALIDATION
   * =======================================================
   */

  function validateForm(value) {
    const nextErrors = {};

    if (!CONTENT_TYPE_VALUES.includes(value.contentType)) {
      nextErrors.contentType = t(
        "publicContent.editor.validation.contentTypeRequired",
      );
    }

    /*
     * English is canonical.
     */
    if (!value.title?.en?.trim()) {
      nextErrors.title = t("publicContent.editor.validation.titleRequired");
    }

    if (!value.slug?.trim()) {
      nextErrors.slug = t("publicContent.editor.validation.slugRequired");
    }

    /*
     * Article requires English body content.
     */
    if (
      value.contentType === PUBLIC_CONTENT_TYPE.ARTICLE &&
      !richTextHasContent(value.content?.en)
    ) {
      nextErrors.content = t(
        "publicContent.editor.validation.articleContentRequired",
      );
    }

    /*
     * Video / Embed requires a source URL.
     */
    if (value.contentType !== PUBLIC_CONTENT_TYPE.ARTICLE) {
      if (!String(value.source?.sourceUrl || "").trim()) {
        nextErrors.sourceUrl = t(
          "publicContent.editor.validation.sourceUrlRequired",
        );
      }

      if (!value.source?.provider) {
        nextErrors.sourceProvider = t(
          "publicContent.editor.validation.providerRequired",
        );
      }
    }

    return nextErrors;
  }

  function applyValidationErrors(validationErrors) {
    setErrors(validationErrors);

    focusFirstInvalidField(validationErrors);

    toast.error(t("publicContent.editor.validation.completeRequired"));
  }

  /*
   * =======================================================
   * EXTERNAL METADATA
   * =======================================================
   */

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
          result?.message ||
            t("publicContent.editor.metadata.errors.loadFailed"),
        );
      }

      const data = result?.data;

      if (!data) {
        throw new Error(t("publicContent.editor.metadata.errors.loadFailed"));
      }

      lastResolvedUrlRef.current = data.canonicalUrl || sourceUrl;

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

      toast.success(t("publicContent.editor.metadata.messages.loaded"));
    } catch (error) {
      console.error("Load external media metadata error:", error);

      const message =
        error?.message || t("publicContent.editor.metadata.errors.loadFailed");

      setErrors((current) => ({
        ...current,

        sourceUrl: message,
      }));

      toast.error(message);
    } finally {
      setMetadataLoading(false);
    }
  }

  /*
   * =======================================================
   * PAYLOAD
   * =======================================================
   */

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

  /*
   * =======================================================
   * SAVE REQUEST
   * =======================================================
   */

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

  /*
   * =======================================================
   * SAVE
   * =======================================================
   */

  async function handleSubmit(event) {
    event.preventDefault();

    if (!companyId || saving || metadataLoading) {
      return;
    }

    const normalizedSlug = slugify(form.slug);

    const normalizedForm = {
      ...form,

      slug: normalizedSlug,
    };

    const validationErrors = validateForm(normalizedForm);

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

        /*
         * SUCCESS
         */

        if (response.ok && result?.success !== false) {
          setForm((current) => ({
            ...current,

            slug: currentSlug,
          }));

          slugManuallyEditedRef.current = true;

          toast.success(
            item
              ? t("publicContent.editor.messages.updated")
              : t("publicContent.editor.messages.created"),
          );

          await onSaved?.(result?.data);

          return;
        }

        /*
         * SERVER FIELD ERRORS
         */

        const serverErrors = normalizeServerFieldErrors(result?.errors);

        if (hasErrors(serverErrors)) {
          setErrors(serverErrors);

          focusFirstInvalidField(serverErrors);
        }

        /*
         * SLUG CONFLICT
         */

        const slugConflict =
          response.status === 409 &&
          (result?.code === "PUBLIC_SLUG_EXISTS" ||
            String(result?.message || "")
              .toLowerCase()
              .includes("slug"));

        if (!slugConflict) {
          throw new Error(
            result?.message || t("publicContent.editor.errors.saveFailed"),
          );
        }

        const suggestedSlug = slugify(result?.suggestedSlug);

        if (!suggestedSlug || suggestedSlug === currentSlug) {
          const slugErrors = {
            slug: t("publicContent.editor.slug.exists"),
          };

          setErrors(slugErrors);

          focusFirstInvalidField(slugErrors);

          toast.error(t("publicContent.editor.slug.noAlternative"));

          return;
        }

        const confirmed = window.confirm(
          t("publicContent.editor.slug.confirmSuggestion", {
            current: currentSlug,

            suggested: suggestedSlug,
          }),
        );

        if (!confirmed) {
          const slugErrors = {
            slug: t("publicContent.editor.slug.exists"),
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
          throw new Error(t("publicContent.editor.slug.reserveFailed"));
        }
      }
    } catch (error) {
      console.error("Save public content error:", error);

      toast.error(
        error?.message || t("publicContent.editor.errors.saveFailed"),
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * =======================================================
   * CLOSE
   * =======================================================
   */

  const busy = saving || metadataLoading;

  function handleClose() {
    if (busy) {
      return;
    }

    onClose?.();
  }

  /*
   * =======================================================
   * STATE
   * =======================================================
   */

  const requiresSource =
    form.contentType === PUBLIC_CONTENT_TYPE.VIDEO ||
    form.contentType === PUBLIC_CONTENT_TYPE.EMBED;

  const metadata = form.source.metadata || emptyMetadata();

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

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <div
      className="
        fixed
        inset-0
        z-[200]
      "
    >
      {/* =====================================
          BACKDROP
      ===================================== */}

      <button
        type="button"
        aria-label={t("common.close")}
        className="
          absolute
          inset-0

          bg-black/40

          backdrop-blur-[1px]
        "
        onClick={handleClose}
        disabled={busy}
      />

      {/* =====================================
          PANEL
      ===================================== */}

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
        {/* =================================
            HEADER
        ================================= */}

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
              {t("publicContent.editor.sectionLabel")}
            </div>

            <h2
              className="
                mt-1

                admin-text-18
                font-semibold
                tracking-[-0.02em]

                text-[var(--admin-foreground)]
              "
            >
              {item
                ? t("publicContent.editor.editTitle")
                : t("publicContent.editor.newTitle")}
            </h2>

            <p
              className="
                mt-1

                admin-text-12

                text-[var(--admin-muted)]
              "
            >
              {t("publicContent.editor.headerDescription")}
            </p>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={handleClose}
            aria-label={t("common.close")}
            title={t("common.close")}
            className="
              flex
              h-9
              w-9
              shrink-0

              items-center
              justify-center

              rounded-xl

              text-[var(--admin-muted)]

              transition

              hover:bg-[var(--admin-hover)]

              hover:text-[var(--admin-foreground)]

              disabled:opacity-50
            "
          >
            <X size={18} />
          </button>
        </header>

        {/* =================================
            FORM
        ================================= */}

        <form
          id="public-content-editor-form"
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
            {/* ===============================
                CONTENT TYPE
            =============================== */}

            <section>
              <SectionHeader
                title={t("publicContent.editor.typeSection.title")}
                description={t("publicContent.editor.typeSection.description")}
              />

              <div
                data-form-field="contentType"
                className="
                  mt-4

                  grid
                  gap-3

                  sm:grid-cols-3
                "
              >
                {CONTENT_TYPE_VALUES.map((value) => {
                  const {
                    label,
                    description,
                    icon: Icon,
                  } = getContentTypeMeta(value);

                  const active = form.contentType === value;

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => changeContentType(value)}
                      className={cn(
                        "rounded-2xl",

                        "border",

                        "p-4",

                        "text-left",

                        "transition",

                        active
                          ? [
                              "border-[var(--company-primary)]",

                              "bg-[var(--company-primary-soft)]",
                            ]
                          : [
                              "border-[var(--admin-border)]",

                              "bg-[var(--admin-surface)]",

                              "hover:bg-[var(--admin-hover)]",
                            ],

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

                      <div
                        className="
                            mt-3

                            admin-text-14
                            font-medium

                            text-[var(--admin-foreground)]
                          "
                      >
                        {label}
                      </div>

                      <p
                        className="
                            mt-1

                            admin-text-11
                            leading-[1.6]

                            text-[var(--admin-muted)]
                          "
                      >
                        {description}
                      </p>
                    </button>
                  );
                })}
              </div>

              {errors.contentType && (
                <p
                  className="
                    mt-2

                    admin-text-12
                    font-medium

                    text-red-500
                  "
                >
                  {errors.contentType}
                </p>
              )}
            </section>

            {/* ===============================
                BASIC
            =============================== */}

            <section
              className="
                mt-10

                border-t
                border-[var(--admin-border)]

                pt-8
              "
            >
              <SectionHeader
                title={t("publicContent.editor.basic.title")}
                description={t("publicContent.editor.basic.description")}
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
                  label={t("publicContent.editor.fields.title")}
                  required
                  value={form.title}
                  error={getFieldError(errors, "title")}
                  onChange={updateTitle}
                  placeholder={{
                    en: t("publicContent.editor.placeholders.titleEnglish"),

                    th: t("publicContent.editor.placeholders.titleThai"),
                  }}
                />

                <div data-form-field="slug">
                  <FormField
                    label={t("publicContent.editor.fields.slug")}
                    required
                    error={getFieldError(errors, "slug")}
                    hint={t("publicContent.editor.slug.hint")}
                    infoTitle={t("publicContent.editor.slug.infoTitle")}
                    infoContent={t("publicContent.editor.slug.infoDescription")}
                  >
                    <input
                      value={form.slug}
                      aria-invalid={Boolean(errors.slug)}
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
                      placeholder="public-content-slug"
                      className={cn(
                        inputClass,

                        getInvalidFieldClass(errors.slug),
                      )}
                    />
                  </FormField>
                </div>
              </div>
            </section>

            {/* ===============================
                EXTERNAL SOURCE
            =============================== */}

            {requiresSource && (
              <section
                className="
                  mt-10

                  border-t
                  border-[var(--admin-border)]

                  pt-8
                "
              >
                <SectionHeader
                  title={t("publicContent.editor.source.title")}
                  description={t(
                    form.contentType === PUBLIC_CONTENT_TYPE.VIDEO
                      ? "publicContent.editor.source.videoDescription"
                      : "publicContent.editor.source.embedDescription",
                  )}
                />

                {/* SOURCE URL */}

                <div data-form-field="sourceUrl" className="mt-5">
                  <FormField
                    label={t("publicContent.editor.fields.sourceUrl")}
                    required
                    error={getFieldError(errors, "sourceUrl")}
                    hint={t("publicContent.editor.source.urlHint")}
                    infoTitle={t("publicContent.editor.source.infoTitle")}
                    infoContent={t(
                      "publicContent.editor.source.infoDescription",
                    )}
                  >
                    <div
                      className="
                        flex
                        flex-col
                        gap-2

                        sm:flex-row
                      "
                    >
                      <input
                        type="url"
                        value={form.source.sourceUrl || ""}
                        aria-invalid={Boolean(errors.sourceUrl)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        onChange={(event) => {
                          const value = event.target.value;

                          lastResolvedUrlRef.current = "";

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
                        className="
                          inline-flex
                          h-11
                          shrink-0

                          items-center
                          justify-center
                          gap-2

                          rounded-xl

                          border
                          border-[var(--admin-border)]

                          bg-[var(--admin-surface)]

                          px-4

                          admin-text-12
                          font-medium

                          text-[var(--admin-foreground)]

                          transition

                          hover:border-[var(--company-primary-border)]

                          hover:bg-[var(--company-primary-soft)]

                          hover:text-[var(--company-primary)]

                          disabled:cursor-not-allowed
                          disabled:opacity-50
                        "
                      >
                        {metadataLoading ? (
                          <LoaderCircle size={15} className="animate-spin" />
                        ) : (
                          <RefreshCw size={15} />
                        )}

                        {metadataLoading
                          ? t("publicContent.editor.metadata.loading")
                          : t("publicContent.editor.metadata.fetch")}
                      </button>
                    </div>
                  </FormField>
                </div>

                {/* PROVIDER */}

                <div
                  className="
                    mt-4

                    grid
                    gap-4

                    sm:grid-cols-2
                  "
                >
                  <div data-form-field="sourceProvider">
                    <FormField
                      label={t("publicContent.editor.fields.provider")}
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
                        <option value="">
                          {t("publicContent.editor.source.autoDetect")}
                        </option>

                        {PROVIDER_VALUES.map((provider) => (
                          <option key={provider} value={provider}>
                            {getProviderLabel(provider)}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </div>

                  <FormField
                    label={t("publicContent.editor.fields.externalId")}
                    hint={t("publicContent.editor.source.externalIdHint")}
                  >
                    <input
                      value={form.source.externalId || ""}
                      readOnly
                      placeholder={t(
                        "publicContent.editor.source.externalIdPlaceholder",
                      )}
                      className={cn(
                        inputClass,

                        "cursor-default",

                        "bg-[var(--admin-background)]",
                      )}
                    />
                  </FormField>
                </div>

                {/* METADATA PREVIEW */}

                {metadata.thumbnailUrl && (
                  <div
                    className="
                      mt-5

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

                        aspect-video
                        w-full

                        overflow-hidden

                        bg-[var(--admin-background)]
                      "
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={metadata.thumbnailUrl}
                        alt={metadata.title || ""}
                        loading="lazy"
                        decoding="async"
                        className="
                          h-full
                          w-full

                          object-cover
                        "
                      />
                    </div>

                    <div
                      className="
                        p-4

                        sm:p-5
                      "
                    >
                      <div
                        className="
                          flex
                          flex-col
                          gap-4

                          sm:flex-row
                          sm:items-start
                          sm:justify-between
                        "
                      >
                        <div className="min-w-0">
                          <div
                            className="
                              admin-text-10
                              font-semibold
                              uppercase
                              tracking-[0.12em]

                              text-[var(--company-primary)]
                            "
                          >
                            {t("publicContent.editor.metadata.preview")}
                          </div>

                          <div
                            className="
                              mt-2

                              admin-text-14
                              font-semibold
                              leading-[1.6]

                              text-[var(--admin-foreground)]
                            "
                          >
                            {metadata.title ||
                              t("publicContent.editor.metadata.untitled")}
                          </div>

                          {metadata.authorName && (
                            <div
                              className="
                                mt-1

                                admin-text-12

                                text-[var(--admin-muted)]
                              "
                            >
                              {metadata.authorName}
                            </div>
                          )}

                          <div
                            className="
                              mt-3

                              flex
                              flex-wrap

                              gap-x-4
                              gap-y-1

                              admin-text-11

                              text-[var(--admin-muted)]
                            "
                          >
                            {metadata.publishedAt && (
                              <span>
                                {t("publicContent.editor.metadata.published", {
                                  date: formatPublishedDate(
                                    metadata.publishedAt,

                                    locale,
                                  ),
                                })}
                              </span>
                            )}

                            {metadata.duration && (
                              <span>
                                {t("publicContent.editor.metadata.duration", {
                                  duration: formatIsoDuration(
                                    metadata.duration,
                                  ),
                                })}
                              </span>
                            )}
                          </div>
                        </div>

                        {form.source.sourceUrl && (
                          <a
                            href={form.source.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="
                              inline-flex
                              h-9
                              shrink-0

                              items-center
                              justify-center
                              gap-2

                              rounded-xl

                              border
                              border-[var(--admin-border)]

                              px-3

                              admin-text-12
                              font-medium

                              text-[var(--admin-foreground)]

                              transition

                              hover:border-[var(--company-primary-border)]

                              hover:bg-[var(--company-primary-soft)]

                              hover:text-[var(--company-primary)]
                            "
                          >
                            <ExternalLink size={14} />

                            {t("publicContent.editor.metadata.openSource")}
                          </a>
                        )}
                      </div>

                      {metadata.description && (
                        <p
                          className="
                            mt-4

                            line-clamp-4

                            admin-text-12
                            leading-[1.65]

                            text-[var(--admin-muted)]
                          "
                        >
                          {metadata.description}
                        </p>
                      )}

                      <div
                        className="
                          mt-5

                          border-t
                          border-[var(--admin-border)]

                          pt-4
                        "
                      >
                        <div
                          className="
                            flex
                            items-start
                            gap-3

                            rounded-xl

                            bg-[var(--company-primary-soft)]

                            p-3
                          "
                        >
                          <span
                            className="
                              mt-0.5

                              flex
                              h-6
                              w-6
                              shrink-0

                              items-center
                              justify-center

                              rounded-full

                              bg-[var(--company-primary)]

                              text-[var(--company-primary-foreground)]
                            "
                          >
                            <Check size={14} />
                          </span>

                          <div>
                            <div
                              className="
                                admin-text-12
                                font-medium

                                text-[var(--admin-foreground)]
                              "
                            >
                              {t(
                                "publicContent.editor.metadata.autoCover.title",
                              )}
                            </div>

                            <p
                              className="
                                mt-1

                                admin-text-11
                                leading-[1.6]

                                text-[var(--admin-muted)]
                              "
                            >
                              {t(
                                "publicContent.editor.metadata.autoCover.description",
                              )}
                            </p>

                            {form.featuredImage?.mediaId && (
                              <p
                                className="
                                  mt-2

                                  admin-text-11
                                  font-medium

                                  text-[var(--company-primary)]
                                "
                              >
                                {t(
                                  "publicContent.editor.metadata.autoCover.override",
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* ===============================
                CONTENT
            =============================== */}

            <section
              className="
                mt-10

                border-t
                border-[var(--admin-border)]

                pt-8
              "
            >
              <SectionHeader
                title={t("publicContent.editor.content.title")}
                description={t(
                  form.contentType === PUBLIC_CONTENT_TYPE.ARTICLE
                    ? "publicContent.editor.content.articleDescription"
                    : "publicContent.editor.content.mediaDescription",
                )}
              />

              {/* EXCERPT */}

              <div className="mt-5">
                <LocalizedFormField
                  label={t("publicContent.editor.fields.excerpt")}
                  type="textarea"
                  rows={4}
                  value={form.excerpt}
                  onChange={(language, value) =>
                    updateLocalized(
                      "excerpt",

                      language,

                      value,
                    )
                  }
                  placeholder={{
                    en: t("publicContent.editor.placeholders.excerptEnglish"),

                    th: t("publicContent.editor.placeholders.excerptThai"),
                  }}
                  infoTitle={t("publicContent.editor.excerpt.infoTitle")}
                  infoContent={t(
                    "publicContent.editor.excerpt.infoDescription",
                  )}
                />
              </div>

              {/* RICH TEXT */}

              <div data-form-field="content" className="mt-5">
                <LocalizedRichTextEditor
                  label={t("publicContent.editor.fields.content")}
                  required={form.contentType === PUBLIC_CONTENT_TYPE.ARTICLE}
                  value={form.content}
                  error={getFieldError(errors, "content")}
                  minHeight={
                    form.contentType === PUBLIC_CONTENT_TYPE.ARTICLE ? 360 : 220
                  }
                  onChange={(language, value) =>
                    updateLocalized(
                      "content",

                      language,

                      value,
                    )
                  }
                  placeholder={{
                    en:
                      form.contentType === PUBLIC_CONTENT_TYPE.ARTICLE
                        ? t(
                            "publicContent.editor.placeholders.articleContentEnglish",
                          )
                        : t(
                            "publicContent.editor.placeholders.mediaContentEnglish",
                          ),

                    th:
                      form.contentType === PUBLIC_CONTENT_TYPE.ARTICLE
                        ? t(
                            "publicContent.editor.placeholders.articleContentThai",
                          )
                        : t(
                            "publicContent.editor.placeholders.mediaContentThai",
                          ),
                  }}
                />
              </div>
            </section>

            {/* ===============================
                MEDIA
            =============================== */}

            <ContentMediaSection
              companyId={companyId}
              featuredImage={form.featuredImage}
              gallery={form.gallery}
              onFeaturedImageChange={(featuredImage) =>
                setForm((current) => ({
                  ...current,

                  featuredImage,

                  seo: syncSeoImageSource({
                    seo: current.seo,

                    previousSource: current.featuredImage,

                    nextSource: featuredImage,
                  }),
                }))
              }
            />

            {/* ===============================
                TAGS
            =============================== */}

            <section
              className="
                mt-10

                border-t
                border-[var(--admin-border)]

                pt-8
              "
            >
              <SectionHeader
                title={t("publicContent.editor.tags.title")}
                description={t("publicContent.editor.tags.description")}
              />

              <div className="mt-4">
                <TagInput
                  value={form.tags}
                  suggestions={tagSuggestions}
                  loadingSuggestions={tagSuggestionsLoading}
                  placeholder={t("publicContent.editor.tags.placeholder")}
                  onChange={(tags) =>
                    setForm((current) => ({
                      ...current,

                      tags,

                      seo: syncSeoKeywordsSource({
                        seo: current.seo,

                        previousSource: current.tags,

                        nextSource: tags,
                      }),
                    }))
                  }
                />
              </div>
            </section>

            {/* ===============================
                FEATURED
            =============================== */}

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

                  "rounded-2xl",

                  "border",

                  "p-4",

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
                    min-w-0
                    flex-1

                    items-start
                    gap-3
                  "
                >
                  <span
                    className="
                      flex
                      h-9
                      w-9
                      shrink-0

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

                        text-[var(--admin-foreground)]
                      "
                    >
                      {t("publicContent.editor.featured.title")}
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
                      {t("publicContent.editor.featured.description")}
                    </span>
                  </span>
                </span>
              </label>
            </section>

            {/* ===============================
                SEO
            =============================== */}

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

        {/* =================================
            FOOTER
        ================================= */}

        <footer
          className="
            flex
            shrink-0

            flex-col
            gap-3

            border-t
            border-[var(--admin-border)]

            bg-[var(--admin-surface)]

            px-5
            py-4

            sm:flex-row
            sm:items-center
            sm:justify-between

            sm:px-8
          "
        >
          <div
            className="
              admin-text-11
              leading-[1.55]

              text-[var(--admin-muted)]
            "
          >
            {t("publicContent.editor.saveHint")}
          </div>

          <div
            className="
              flex
              shrink-0
              items-center
              justify-end

              gap-2
            "
          >
            <button
              type="button"
              disabled={busy}
              onClick={handleClose}
              className="
                h-10

                rounded-xl

                px-4

                admin-text-14
                font-medium

                text-[var(--admin-muted)]

                transition

                hover:bg-[var(--admin-hover)]

                disabled:opacity-50
              "
            >
              {t("common.cancel")}
            </button>

            <button
              type="submit"
              form="public-content-editor-form"
              disabled={busy}
              className="
                inline-flex
                h-10
                min-w-36

                items-center
                justify-center
                gap-2

                rounded-xl

                bg-[var(--company-primary)]

                px-5

                admin-text-14
                font-medium

                text-[var(--company-primary-foreground)]

                transition

                hover:bg-[var(--company-primary-hover)]

                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {saving ? (
                <LoaderCircle size={15} className="animate-spin" />
              ) : (
                <Save size={15} />
              )}

              {saving
                ? t("common.saving")
                : item
                  ? t("common.saveChanges")
                  : t("publicContent.editor.createAction")}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
