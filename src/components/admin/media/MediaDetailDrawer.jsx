"use client";

import {
  ExternalLink,
  FileImage,
  FolderKanban,
  Home,
  Image as ImageIcon,
  LoaderCircle,
  Newspaper,
  RefreshCw,
  Save,
  Tag,
  Trash2,
  Trophy,
  X,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";

import { toast } from "sonner";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { useCompanyLocalization } from "@/components/admin/localization/CompanyLocalizationProvider";

import { cn } from "@/utils/cn";

import MediaDeleteDialog from "./MediaDeleteDialog";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function emptyLocalized() {
  return {
    en: "",
    th: "",
  };
}

function normalizeLocalized(value) {
  return {
    en: value?.en || "",
    th: value?.th || "",
  };
}

function normalizeMedia(media) {
  if (!media) {
    return null;
  }

  return {
    ...media,

    title: normalizeLocalized(media.title),

    alt: normalizeLocalized(media.alt),

    description: normalizeLocalized(media.description),

    caption: normalizeLocalized(media.caption),

    credit: normalizeLocalized(media.credit),

    tags: Array.isArray(media.tags) ? media.tags : [],
  };
}

function formatBytes(bytes) {
  const value = Number(bytes);

  if (!Number.isFinite(value)) {
    return "-";
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileName(media) {
  return media?.originalFileName || media?.fileName || media?.id || "-";
}

async function readResponse(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getLocalizedTitle(value, locale) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return value?.[locale] || value?.en || value?.th || "";
}

/*
 * =========================================================
 * MODULE
 * =========================================================
 */

function ModuleIcon({ module, size = 16, strokeWidth = 1.7 }) {
  const props = {
    size,
    strokeWidth,
  };

  switch (module) {
    case "project":
      return <FolderKanban {...props} />;

    case "award":
      return <Trophy {...props} />;

    case "home-slideshow":
      return <Home {...props} />;

    case "page":
      return <Newspaper {...props} />;

    case "public-content":
      return <ImageIcon {...props} />;

    default:
      return <FileImage {...props} />;
  }
}

function getModuleLabel(module, t) {
  switch (module) {
    case "project":
      return t("media.details.usage.modules.project");

    case "award":
      return t("media.details.usage.modules.award");

    case "home-slideshow":
      return t("media.details.usage.modules.homeSlideshow");

    case "page":
      return t("media.details.usage.modules.page");

    case "public-content":
      return t("media.details.usage.modules.publicContent");

    default:
      return module;
  }
}

function getLocationLabel(usage, t) {
  switch (usage?.location) {
    case "featured-image":
      return t("media.details.usage.locations.featuredImage");

    case "hero":
      return t("media.details.usage.locations.hero");

    case "gallery":
      return t("media.details.usage.locations.gallery", {
        number: (usage?.index ?? 0) + 1,
      });

    case "slideshow":
      return t("media.details.usage.locations.slideshow", {
        number: (usage?.index ?? 0) + 1,
      });

    case "page-section-image":
      return t("media.details.usage.locations.sectionImage", {
        number: (usage?.sectionIndex ?? 0) + 1,
      });

    case "page-section-gallery":
      return t("media.details.usage.locations.sectionGallery", {
        section: (usage?.sectionIndex ?? 0) + 1,
        number: (usage?.sectionImageIndex ?? 0) + 1,
      });

    default:
      return usage?.location || "-";
  }
}

/*
 * =========================================================
 * STATUS
 * =========================================================
 */

function UsageStatus({ status, t }) {
  const value = status || "draft";

  const label =
    value === "published"
      ? t("status.published")
      : value === "scheduled"
        ? t("status.scheduled")
        : value === "review"
          ? t("status.review")
          : t("status.draft");

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5",

        "admin-text-9 font-semibold uppercase tracking-[0.06em]",

        value === "published"
          ? "bg-emerald-50 text-emerald-700"
          : value === "scheduled"
            ? "bg-blue-50 text-blue-700"
            : "bg-[var(--admin-background)] text-[var(--admin-muted)]",
      )}
    >
      {label}
    </span>
  );
}

/*
 * =========================================================
 * LOCALIZED FIELD
 * =========================================================
 */

function LocalizedField({
  label,
  value,
  locales,
  multiline = false,
  rows = 3,
  maxLength,
  onChange,
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {locales.map((language) => (
        <label key={language} className="block min-w-0">
          <div className="flex items-center justify-between gap-3">
            <span
              className="
                admin-text-11
                font-medium

                text-[var(--admin-muted)]
              "
            >
              {label}{" "}
              <span
                className="
                  uppercase

                  text-[var(--company-primary)]
                "
              >
                {language}
              </span>
            </span>

            {maxLength && (
              <span
                className="
                  admin-text-9

                  text-[var(--admin-muted-light)]
                "
              >
                {(value?.[language] || "").length}/{maxLength}
              </span>
            )}
          </div>

          {multiline ? (
            <textarea
              rows={rows}
              maxLength={maxLength}
              value={value?.[language] || ""}
              onChange={(event) => onChange(language, event.target.value)}
              className="
                mt-2
                min-h-[100px]
                w-full
                resize-y

                rounded-xl

                border
                border-[var(--admin-border)]

                bg-[var(--admin-surface)]

                px-3
                py-3

                admin-text-12
                leading-[1.6]

                text-[var(--admin-foreground)]

                outline-none

                focus:border-[var(--company-primary)]

                focus:ring-2
                focus:ring-[var(--company-primary-soft)]
              "
            />
          ) : (
            <input
              type="text"
              maxLength={maxLength}
              value={value?.[language] || ""}
              onChange={(event) => onChange(language, event.target.value)}
              className="
                mt-2
                h-10
                w-full

                rounded-xl

                border
                border-[var(--admin-border)]

                bg-[var(--admin-surface)]

                px-3

                admin-text-12

                text-[var(--admin-foreground)]

                outline-none

                focus:border-[var(--company-primary)]

                focus:ring-2
                focus:ring-[var(--company-primary-soft)]
              "
            />
          )}
        </label>
      ))}
    </div>
  );
}

/*
 * =========================================================
 * USAGE ITEM
 * =========================================================
 */

function MediaUsageItem({ usage, locale, t }) {
  const moduleLabel = getModuleLabel(usage?.module, t);

  const contentTitle =
    getLocalizedTitle(usage?.contentTitle, locale) ||
    t("media.details.usage.untitled");

  const locationLabel = getLocationLabel(usage, t);

  return (
    <div
      className="
        flex
        gap-3

        rounded-2xl

        border
        border-[var(--admin-border)]

        p-4
      "
    >
      <div
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
        <ModuleIcon module={usage?.module} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="
              admin-text-9
              font-semibold
              uppercase
              tracking-[0.08em]

              text-[var(--company-primary)]
            "
          >
            {moduleLabel}
          </span>

          <UsageStatus status={usage?.status} t={t} />
        </div>

        <div
          className="
            mt-1
            truncate

            admin-text-12
            font-medium

            text-[var(--admin-foreground)]
          "
        >
          {contentTitle}
        </div>

        <div
          className="
            mt-1

            admin-text-10

            text-[var(--admin-muted)]
          "
        >
          {locationLabel}
        </div>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * DRAWER
 * =========================================================
 */

export default function MediaDetailDrawer({
  open,
  companyId,
  media,
  onClose,
  onSaved,
  onDeleted,
}) {
  const { t, locale: adminLocale } = useAdminTranslation();

  const { contentLocales } = useCompanyLocalization();

  const locales =
    Array.isArray(contentLocales) && contentLocales.length
      ? contentLocales
      : ["en"];

  const locale = locales.includes(adminLocale) ? adminLocale : locales[0];

  const [form, setForm] = useState(() => normalizeMedia(media));

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [previewUrl, setPreviewUrl] = useState(null);

  const [previewLoading, setPreviewLoading] = useState(false);

  const [previewError, setPreviewError] = useState(false);

  const [tagInput, setTagInput] = useState("");

  const [usageData, setUsageData] = useState({
    usageCount: 0,
    modules: {},
    usages: [],
  });

  const [usageLoading, setUsageLoading] = useState(false);

  const [usageError, setUsageError] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);

  const mediaId = media?.id || null;

  /*
   * RESET
   */

  useEffect(() => {
    if (!open || !media) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setForm(normalizeMedia(media));

      setTagInput("");

      setUsageData({
        usageCount: 0,
        modules: {},
        usages: [],
      });

      setUsageError(null);

      setDeleteOpen(false);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [open, media]);

  /*
   * METADATA
   */

  useEffect(() => {
    if (!open || !companyId || !mediaId) {
      return;
    }

    let cancelled = false;

    const timeoutId = window.setTimeout(async () => {
      try {
        if (!cancelled) {
          setLoading(true);
        }

        const response = await fetch(
          `/api/v1/companies/${companyId}/media/${mediaId}/metadata`,
          {
            cache: "no-store",
            credentials: "include",
          },
        );

        const payload = await readResponse(response);

        if (!response.ok || payload?.success === false) {
          throw new Error("MEDIA_METADATA_LOAD_FAILED");
        }

        if (!cancelled) {
          setForm(normalizeMedia(payload?.data));
        }
      } catch (error) {
        console.error("Load media metadata error:", error);

        if (!cancelled) {
          toast.error(t("media.details.errors.loadFailed"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 0);

    return () => {
      cancelled = true;

      window.clearTimeout(timeoutId);
    };
  }, [open, companyId, mediaId, t]);

  /*
   * PREVIEW
   */

  useEffect(() => {
    if (!open || !companyId || !mediaId) {
      return;
    }

    let cancelled = false;

    const timeoutId = window.setTimeout(async () => {
      try {
        if (!cancelled) {
          setPreviewLoading(true);

          setPreviewError(false);

          setPreviewUrl(null);
        }

        const response = await fetch(
          `/api/v1/companies/${companyId}/media/${mediaId}/preview?variant=large`,
          {
            cache: "no-store",
            credentials: "include",
          },
        );

        const payload = await readResponse(response);

        if (!response.ok || payload?.success === false) {
          throw new Error("MEDIA_PREVIEW_FAILED");
        }

        const url = payload?.data?.url || payload?.url || null;

        if (!url) {
          throw new Error("MEDIA_PREVIEW_URL_MISSING");
        }

        if (!cancelled) {
          setPreviewUrl(url);
        }
      } catch (error) {
        console.error("Media preview error:", error);

        if (!cancelled) {
          setPreviewError(true);
        }
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
  }, [open, companyId, mediaId]);

  /*
   * USAGE
   */

  const loadUsage = useCallback(async () => {
    if (!companyId || !mediaId) {
      return;
    }

    try {
      setUsageLoading(true);

      setUsageError(null);

      const response = await fetch(
        `/api/v1/companies/${companyId}/media/${mediaId}/usage`,
        {
          cache: "no-store",
          credentials: "include",
        },
      );

      const payload = await readResponse(response);

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.message || t("media.details.usage.errors.loadFailed"),
        );
      }

      setUsageData({
        usageCount: payload?.data?.usageCount || 0,

        modules: payload?.data?.modules || {},

        usages: Array.isArray(payload?.data?.usages) ? payload.data.usages : [],
      });
    } catch (error) {
      console.error("Load media usage error:", error);

      setUsageError(
        error?.message || t("media.details.usage.errors.loadFailed"),
      );
    } finally {
      setUsageLoading(false);
    }
  }, [companyId, mediaId, t]);

  useEffect(() => {
    if (!open || !companyId || !mediaId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      loadUsage();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [open, companyId, mediaId, loadUsage]);

  const sortedUsages = useMemo(() => {
    return [...usageData.usages].sort((first, second) => {
      if (first?.status === "published" && second?.status !== "published") {
        return -1;
      }

      if (first?.status !== "published" && second?.status === "published") {
        return 1;
      }

      return String(first?.module || "").localeCompare(
        String(second?.module || ""),
      );
    });
  }, [usageData.usages]);

  if (!open || !media) {
    return null;
  }

  /*
   * FORM
   */

  function updateLocalized(field, language, value) {
    setForm((current) => ({
      ...current,

      [field]: {
        ...current?.[field],

        [language]: value,
      },
    }));
  }

  function addTag() {
    const value = tagInput.trim();

    if (!value) {
      return;
    }

    setForm((current) => {
      const tags = Array.isArray(current?.tags) ? current.tags : [];

      if (tags.some((tag) => tag.toLowerCase() === value.toLowerCase())) {
        return current;
      }

      return {
        ...current,

        tags: [...tags, value],
      };
    });

    setTagInput("");
  }

  function removeTag(tagToRemove) {
    setForm((current) => ({
      ...current,

      tags: (current?.tags || []).filter((tag) => tag !== tagToRemove),
    }));
  }

  function handleTagKeyDown(event) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();

      addTag();
    }
  }

  /*
   * SAVE
   */

  async function handleSave() {
    if (!companyId || !mediaId || saving) {
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `/api/v1/companies/${companyId}/media/${mediaId}/metadata`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            title: form?.title || emptyLocalized(),

            alt: form?.alt || emptyLocalized(),

            description: form?.description || emptyLocalized(),

            caption: form?.caption || emptyLocalized(),

            credit: form?.credit || emptyLocalized(),

            tags: Array.isArray(form?.tags) ? form.tags : [],
          }),
        },
      );

      const payload = await readResponse(response);

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.message || t("media.details.errors.saveFailed"),
        );
      }

      const nextMedia = normalizeMedia(payload?.data);

      setForm(nextMedia);

      toast.success(t("media.details.messages.saved"));

      await onSaved?.(nextMedia);
    } catch (error) {
      console.error("Save media metadata error:", error);

      toast.error(error?.message || t("media.details.errors.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  const fileName = getFileName(form);

  return (
    <>
      <div
        className="
          fixed
          inset-0
          z-[230]

          flex
          justify-end
        "
      >
        <button
          type="button"
          onClick={saving ? undefined : onClose}
          className="
            absolute
            inset-0

            bg-black/35
          "
        />

        <aside
          className="
            relative
            z-10

            flex
            h-full
            w-full
            max-w-[760px]
            flex-col

            border-l
            border-[var(--admin-border)]

            bg-[var(--admin-surface)]
          "
        >
          {/* HEADER */}

          <header
            className="
              flex
              min-h-20

              items-center
              justify-between

              border-b
              border-[var(--admin-border)]

              px-6
            "
          >
            <div className="min-w-0">
              <div
                className="
                  admin-text-10
                  font-semibold
                  uppercase
                  tracking-[0.14em]

                  text-[var(--company-primary)]
                "
              >
                {t("media.details.sectionLabel")}
              </div>

              <h2
                className="
                  mt-1
                  truncate

                  admin-text-16
                  font-semibold
                "
              >
                {fileName}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="
                flex
                h-9
                w-9

                items-center
                justify-center

                rounded-xl

                text-[var(--admin-muted)]

                hover:bg-[var(--admin-hover)]
              "
            >
              <X size={18} />
            </button>
          </header>

          {/* BODY */}

          <div className="min-h-0 flex-1 overflow-y-auto">
            {/* PREVIEW */}

            <section
              className="
                border-b
                border-[var(--admin-border)]

                bg-[var(--admin-background)]

                p-6
              "
            >
              <div
                className="
                  relative

                  flex
                  min-h-[280px]

                  items-center
                  justify-center

                  overflow-hidden

                  rounded-2xl

                  border
                  border-[var(--admin-border)]
                "
              >
                {previewLoading ? (
                  <LoaderCircle
                    size={22}
                    className="
                      animate-spin

                      text-[var(--company-primary)]
                    "
                  />
                ) : previewUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt={form?.alt?.en || form?.alt?.th || ""}
                      className="
                        max-h-[480px]
                        max-w-full

                        object-contain
                      "
                    />

                    <button
                      type="button"
                      onClick={() =>
                        window.open(previewUrl, "_blank", "noopener,noreferrer")
                      }
                      className="
                        absolute
                        right-3
                        top-3

                        flex
                        h-9
                        w-9

                        items-center
                        justify-center

                        rounded-xl

                        bg-black/55

                        text-white
                      "
                    >
                      <ExternalLink size={15} />
                    </button>
                  </>
                ) : (
                  <FileImage
                    size={28}
                    className={
                      previewError
                        ? "text-red-300"
                        : "text-[var(--admin-muted-light)]"
                    }
                  />
                )}
              </div>
            </section>

            {/* METADATA */}

            <section className="px-6 py-7">
              <h3
                className="
                  admin-text-14
                  font-semibold
                "
              >
                {t("media.details.metadata.title")}
              </h3>

              {loading ? (
                <div
                  className="
                    mt-6
                    h-40

                    animate-pulse

                    rounded-2xl

                    bg-[var(--admin-hover)]
                  "
                />
              ) : (
                <>
                  <div className="mt-6">
                    <LocalizedField
                      label={t("media.details.fields.title")}
                      value={form?.title}
                      locales={locales}
                      maxLength={500}
                      onChange={(language, value) =>
                        updateLocalized("title", language, value)
                      }
                    />
                  </div>

                  <div className="mt-6">
                    <LocalizedField
                      label={t("media.details.fields.alt")}
                      value={form?.alt}
                      locales={locales}
                      maxLength={500}
                      onChange={(language, value) =>
                        updateLocalized("alt", language, value)
                      }
                    />
                  </div>

                  <div className="mt-6">
                    <LocalizedField
                      label={t("media.details.fields.description")}
                      value={form?.description}
                      locales={locales}
                      multiline
                      rows={4}
                      maxLength={5000}
                      onChange={(language, value) =>
                        updateLocalized("description", language, value)
                      }
                    />
                  </div>

                  <div className="mt-6">
                    <LocalizedField
                      label={t("media.details.fields.caption")}
                      value={form?.caption}
                      locales={locales}
                      multiline
                      rows={3}
                      maxLength={5000}
                      onChange={(language, value) =>
                        updateLocalized("caption", language, value)
                      }
                    />
                  </div>

                  <div className="mt-6">
                    <LocalizedField
                      label={t("media.details.fields.credit")}
                      value={form?.credit}
                      locales={locales}
                      maxLength={500}
                      onChange={(language, value) =>
                        updateLocalized("credit", language, value)
                      }
                    />
                  </div>

                  <div className="mt-6">
                    <div
                      className="
                        flex
                        min-h-11

                        flex-wrap
                        gap-2

                        rounded-xl

                        border
                        border-[var(--admin-border)]

                        p-2
                      "
                    >
                      {(form?.tags || []).map((tag) => (
                        <span
                          key={tag}
                          className="
                            inline-flex
                            items-center
                            gap-1

                            rounded-lg

                            bg-[var(--company-primary-soft)]

                            px-2
                            py-1

                            admin-text-10

                            text-[var(--company-primary)]
                          "
                        >
                          <Tag size={10} />

                          {tag}

                          <button type="button" onClick={() => removeTag(tag)}>
                            <X size={10} />
                          </button>
                        </span>
                      ))}

                      <input
                        value={tagInput}
                        onChange={(event) => setTagInput(event.target.value)}
                        onKeyDown={handleTagKeyDown}
                        onBlur={addTag}
                        className="
                          min-w-[140px]
                          flex-1

                          bg-transparent

                          admin-text-12

                          outline-none
                        "
                      />
                    </div>
                  </div>
                </>
              )}
            </section>

            {/* FILE INFO */}

            <section
              className="
                border-t
                border-[var(--admin-border)]

                px-6
                py-7
              "
            >
              <h3
                className="
                  admin-text-14
                  font-semibold
                "
              >
                {t("media.details.fileInfo.title")}
              </h3>

              <div
                className="
                  mt-4

                  grid
                  grid-cols-2
                  gap-4

                  sm:grid-cols-3
                "
              >
                <div>
                  <div className="admin-text-9 text-[var(--admin-muted)]">
                    {t("media.details.fileInfo.dimensions")}
                  </div>

                  <div className="mt-1 admin-text-11">
                    {form?.width && form?.height
                      ? `${form.width} × ${form.height}`
                      : "-"}
                  </div>
                </div>

                <div>
                  <div className="admin-text-9 text-[var(--admin-muted)]">
                    {t("media.details.fileInfo.size")}
                  </div>

                  <div className="mt-1 admin-text-11">
                    {formatBytes(form?.size)}
                  </div>
                </div>

                <div>
                  <div className="admin-text-9 text-[var(--admin-muted)]">
                    {t("media.details.fileInfo.type")}
                  </div>

                  <div className="mt-1 admin-text-11">
                    {form?.mimeType || "-"}
                  </div>
                </div>
              </div>
            </section>

            {/* USAGE */}

            <section
              className="
                border-t
                border-[var(--admin-border)]

                px-6
                py-7
              "
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3
                    className="
                      admin-text-14
                      font-semibold
                    "
                  >
                    {t("media.details.usage.title")}{" "}
                    {!usageLoading && !usageError
                      ? `(${usageData.usageCount})`
                      : ""}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={loadUsage}
                  disabled={usageLoading}
                >
                  <RefreshCw
                    size={14}
                    className={cn(usageLoading && "animate-spin")}
                  />
                </button>
              </div>

              {usageLoading ? (
                <div
                  className="
                    mt-4
                    h-24

                    animate-pulse

                    rounded-2xl

                    bg-[var(--admin-hover)]
                  "
                />
              ) : usageError ? (
                <div className="mt-4 admin-text-11 text-red-600">
                  {usageError}
                </div>
              ) : sortedUsages.length ? (
                <div className="mt-4 space-y-3">
                  {sortedUsages.map((usage) => (
                    <MediaUsageItem
                      key={usage.id}
                      usage={usage}
                      locale={locale}
                      t={t}
                    />
                  ))}
                </div>
              ) : (
                <div
                  className="
                    mt-4

                    rounded-2xl

                    bg-[var(--admin-background)]

                    p-5

                    admin-text-11

                    text-[var(--admin-muted)]
                  "
                >
                  {t("media.details.usage.empty.description")}
                </div>
              )}
            </section>
          </div>

          {/* FOOTER */}

          <footer
            className="
              flex

              items-center
              justify-between

              gap-3

              border-t
              border-[var(--admin-border)]

              px-6
              py-4
            "
          >
            <button
              type="button"
              disabled={saving || usageLoading}
              onClick={() => setDeleteOpen(true)}
              className="
                inline-flex
                h-10

                items-center
                gap-2

                rounded-xl

                px-3

                admin-text-11
                font-medium

                text-red-600

                transition

                hover:bg-red-50
              "
            >
              <Trash2 size={14} />

              {t("media.delete.delete")}
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={onClose}
                className="
                  h-10

                  rounded-xl

                  px-4

                  admin-text-12

                  text-[var(--admin-muted)]
                "
              >
                {t("common.cancel")}
              </button>

              <button
                type="button"
                disabled={saving || loading}
                onClick={handleSave}
                className="
                  inline-flex
                  h-10

                  items-center
                  gap-2

                  rounded-xl

                  bg-[var(--company-primary)]

                  px-5

                  admin-text-12
                  font-medium

                  text-[var(--company-primary-foreground)]
                "
              >
                {saving ? (
                  <LoaderCircle size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}

                {saving ? t("common.saving") : t("common.saveChanges")}
              </button>
            </div>
          </footer>
        </aside>
      </div>

      <MediaDeleteDialog
        open={deleteOpen}
        companyId={companyId}
        media={media}
        usageData={usageData}
        usageLoading={usageLoading}
        usageError={usageError}
        onRetryUsage={loadUsage}
        onClose={() => setDeleteOpen(false)}
        onDeleted={async (deletedMediaId) => {
          setDeleteOpen(false);

          await onDeleted?.(deletedMediaId);
        }}
      />
    </>
  );
}
