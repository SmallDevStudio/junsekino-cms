"use client";

import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  ImagePlus,
  LoaderCircle,
  Trash2,
  X,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import { toast } from "sonner";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { useCompanyLocalization } from "@/components/admin/localization/CompanyLocalizationProvider";

import MediaPicker from "@/components/admin/media/MediaPicker";

import { cn } from "@/utils/cn";

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

function createSlide(media, index) {
  return {
    id: crypto.randomUUID(),

    mediaId: media.id,

    /*
     * Temporary client-only Media object.
     *
     * We keep this so a newly-selected image can
     * immediately display its metadata in the editor.
     *
     * preparePayload() intentionally removes it.
     */
    media,

    sortOrder: index * 10,

    alt: {
      en: media?.alt?.en || "",

      th: media?.alt?.th || "",
    },

    caption: {
      en: media?.caption?.en || "",

      th: media?.caption?.th || "",
    },

    link: {
      enabled: false,

      url: null,

      newTab: false,
    },

    enabled: true,
  };
}

function normalizeItem(item) {
  if (!item) {
    return {
      name: emptyLocalized(),

      description: emptyLocalized(),

      slides: [],
    };
  }

  return {
    name: {
      en: item?.name?.en || "",

      th: item?.name?.th || "",
    },

    description: {
      en: item?.description?.en || "",

      th: item?.description?.th || "",
    },

    slides: Array.isArray(item?.slides)
      ? [...item.slides]
          .sort(
            (first, second) => (first.sortOrder || 0) - (second.sortOrder || 0),
          )
          .map((slide) => ({
            ...slide,

            alt: {
              en: slide?.alt?.en || "",

              th: slide?.alt?.th || "",
            },

            caption: {
              en: slide?.caption?.en || "",

              th: slide?.caption?.th || "",
            },

            link: {
              enabled: slide?.link?.enabled === true,

              url: slide?.link?.url || null,

              newTab: slide?.link?.newTab === true,
            },

            enabled: slide?.enabled !== false,
          }))
      : [],
  };
}

function preparePayload(form) {
  return {
    name: form.name,

    description: form.description,

    slides: form.slides.map((slide, index) => ({
      id: slide.id,

      mediaId: slide.mediaId,

      sortOrder: index * 10,

      alt: slide.alt,

      caption: slide.caption,

      link: {
        enabled: slide.link?.enabled === true,

        url: slide.link?.enabled && slide.link?.url ? slide.link.url : null,

        newTab: slide.link?.enabled === true && slide.link?.newTab === true,
      },

      enabled: slide.enabled !== false,
    })),
  };
}

async function readResponse(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/*
 * =========================================================
 * SLIDE THUMBNAIL
 * =========================================================
 */

function SlideThumbnail({ companyId, mediaId, alt = "" }) {
  const [url, setUrl] = useState(null);

  const [loading, setLoading] = useState(Boolean(mediaId));

  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!companyId || !mediaId) {
      return;
    }

    let cancelled = false;

    const timeoutId = window.setTimeout(async () => {
      try {
        if (!cancelled) {
          setLoading(true);

          setFailed(false);

          setUrl(null);
        }

        const response = await fetch(
          `/api/v1/companies/${companyId}/media/${mediaId}/preview?variant=thumbnail`,
          {
            method: "GET",

            cache: "no-store",

            credentials: "include",
          },
        );

        const payload = await readResponse(response);

        if (!response.ok || payload?.success === false) {
          throw new Error("SLIDE_PREVIEW_FAILED");
        }

        const previewUrl = payload?.data?.url || payload?.url || null;

        if (!previewUrl) {
          throw new Error("SLIDE_PREVIEW_URL_MISSING");
        }

        if (!cancelled) {
          setUrl(previewUrl);
        }
      } catch (error) {
        console.error("Slideshow thumbnail error:", error);

        if (!cancelled) {
          setFailed(true);
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
  }, [companyId, mediaId]);

  return (
    <div
      className="
        relative

        aspect-[16/10]
        w-full

        overflow-hidden

        bg-[var(--admin-background)]
      "
    >
      {loading && (
        <div
          className="
            absolute
            inset-0

            animate-pulse

            bg-[var(--admin-hover)]
          "
        />
      )}

      {url ? (
        // Runtime signed Admin preview.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="
            h-full
            w-full

            object-cover
          "
        />
      ) : (
        !loading && (
          <div
            className="
              flex
              h-full
              w-full

              items-center
              justify-center
            "
          >
            <ImagePlus
              size={20}
              strokeWidth={1.4}
              className={
                failed ? "text-red-300" : "text-[var(--admin-muted-light)]"
              }
            />
          </div>
        )
      )}
    </div>
  );
}

/*
 * =========================================================
 * LOCALIZED INPUT
 * =========================================================
 */

function LocalizedInput({
  label,
  value,
  locales,
  multiline = false,
  onChange,
}) {
  const inputClass = `
      mt-2
      w-full

      rounded-xl

      border
      border-[var(--admin-border)]

      bg-[var(--admin-surface)]

      px-3

      admin-text-12

      text-[var(--admin-foreground)]

      outline-none

      transition

      placeholder:text-[var(--admin-muted-light)]

      focus:border-[var(--company-primary)]

      focus:ring-2
      focus:ring-[var(--company-primary-soft)]
    `;

  return (
    <div
      className="
        grid
        gap-4

        sm:grid-cols-2
      "
    >
      {locales.map((language) => (
        <label key={language}>
          <span
            className="
                admin-text-11
                font-medium

                text-[var(--admin-muted)]
              "
          >
            {label} — {language.toUpperCase()}
          </span>

          {multiline ? (
            <textarea
              value={value?.[language] || ""}
              rows={3}
              onChange={(event) => onChange(language, event.target.value)}
              className={cn(inputClass, "min-h-[88px] resize-y py-3")}
            />
          ) : (
            <input
              value={value?.[language] || ""}
              onChange={(event) => onChange(language, event.target.value)}
              className={cn(inputClass, "h-10")}
            />
          )}
        </label>
      ))}
    </div>
  );
}

/*
 * =========================================================
 * SLIDESHOW EDITOR
 * =========================================================
 */

export default function SlideshowEditor({
  open,
  companyId,
  item,
  onClose,
  onSaved,
}) {
  const { t } = useAdminTranslation();

  const { contentLocales } = useCompanyLocalization();

  const locales =
    Array.isArray(contentLocales) && contentLocales.length
      ? contentLocales
      : ["en"];

  const [form, setForm] = useState(() => normalizeItem(item));

  const [saving, setSaving] = useState(false);

  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  /*
   * =======================================================
   * RESET
   * =======================================================
   */

  useEffect(() => {
    if (!open) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setForm(normalizeItem(item));

      setMediaPickerOpen(false);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [open, item]);

  /*
   * =======================================================
   * SELECTED IDS
   * =======================================================
   */

  const selectedMediaIds = useMemo(
    () => form.slides.map((slide) => slide.mediaId).filter(Boolean),
    [form.slides],
  );

  if (!open) {
    return null;
  }

  /*
   * =======================================================
   * UPDATE LOCALIZED
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
  }

  /*
   * =======================================================
   * UPDATE SLIDE
   * =======================================================
   */

  function updateSlide(index, updater) {
    setForm((current) => ({
      ...current,

      slides: current.slides.map((slide, slideIndex) =>
        slideIndex === index ? updater(slide) : slide,
      ),
    }));
  }

  /*
   * =======================================================
   * REMOVE
   * =======================================================
   */

  function removeSlide(index) {
    setForm((current) => ({
      ...current,

      slides: current.slides.filter((_, slideIndex) => slideIndex !== index),
    }));
  }

  /*
   * =======================================================
   * MOVE
   * =======================================================
   */

  function moveSlide(index, direction) {
    setForm((current) => {
      const target = index + direction;

      if (target < 0 || target >= current.slides.length) {
        return current;
      }

      const slides = [...current.slides];

      [slides[index], slides[target]] = [slides[target], slides[index]];

      return {
        ...current,

        slides,
      };
    });
  }

  /*
   * =======================================================
   * MEDIA
   * =======================================================
   */

  function handleMediaSelected(mediaItems) {
    const selected = Array.isArray(mediaItems) ? mediaItems : [];

    setForm((current) => {
      const existing = new Set(current.slides.map((slide) => slide.mediaId));

      const additions = selected
        .filter((media) => media?.id && !existing.has(media.id))
        .map((media, index) =>
          createSlide(media, current.slides.length + index),
        );

      return {
        ...current,

        slides: [...current.slides, ...additions],
      };
    });
  }

  /*
   * =======================================================
   * SAVE
   * =======================================================
   */

  async function handleSave() {
    /*
     * English remains canonical in the new Admin Core.
     */
    if (!form.name?.en?.trim()) {
      toast.error(t("homeSlideshow.editor.validation.nameRequired"));

      return;
    }

    if (form.slides.length === 0) {
      toast.error(t("homeSlideshow.editor.validation.slideRequired"));

      return;
    }

    try {
      setSaving(true);

      const editing = Boolean(item?.id);

      const url = editing
        ? `/api/v1/companies/${companyId}/home-slideshows/${item.id}`
        : `/api/v1/companies/${companyId}/home-slideshows`;

      const response = await fetch(url, {
        method: editing ? "PATCH" : "POST",

        headers: {
          "Content-Type": "application/json",
        },

        credentials: "include",

        body: JSON.stringify(preparePayload(form)),
      });

      const payload = await readResponse(response);

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.message || t("homeSlideshow.editor.errors.saveFailed"),
        );
      }

      toast.success(
        editing
          ? t("homeSlideshow.editor.messages.updated")
          : t("homeSlideshow.editor.messages.created"),
      );

      await onSaved?.(payload?.data);
    } catch (error) {
      console.error("Save slideshow:", error);

      toast.error(
        error?.message || t("homeSlideshow.editor.errors.saveFailed"),
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

  function handleClose() {
    if (saving) {
      return;
    }

    onClose?.();
  }

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <>
      <div
        className="
          fixed
          inset-0
          z-[180]

          flex
          justify-end
        "
      >
        {/* =================================
            BACKDROP
        ================================= */}

        <button
          type="button"
          aria-label={t("common.close")}
          disabled={saving}
          onClick={handleClose}
          className="
            absolute
            inset-0

            bg-black/30

            backdrop-blur-[1px]
          "
        />

        {/* =================================
            PANEL
        ================================= */}

        <div
          className="
            relative
            z-10

            flex
            h-full
            w-full
            max-w-[1180px]
            flex-col

            bg-[var(--admin-surface)]

            shadow-2xl
          "
        >
          {/* ===============================
              HEADER
          =============================== */}

          <header
            className="
              flex
              min-h-20
              shrink-0

              items-center
              justify-between

              gap-4

              border-b
              border-[var(--admin-border)]

              px-5
              py-4

              sm:px-8
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
                {t("homeSlideshow.editor.sectionLabel")}
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
                  ? t("homeSlideshow.editor.editTitle")
                  : t("homeSlideshow.editor.newTitle")}
              </h2>

              <p
                className="
                  mt-1

                  admin-text-12

                  text-[var(--admin-muted)]
                "
              >
                {t("homeSlideshow.editor.description")}
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

          {/* ===============================
              BODY
          =============================== */}

          <div
            className="
              admin-sidebar-scrollbar-hide

              min-h-0
              flex-1

              overflow-y-auto

              px-5
              py-6

              sm:px-8
              sm:py-8
            "
          >
            {/* =============================
                INFORMATION
            ============================= */}

            <section>
              <h3
                className="
                  admin-text-14
                  font-semibold

                  text-[var(--admin-foreground)]
                "
              >
                {t("homeSlideshow.editor.information.title")}
              </h3>

              <p
                className="
                  mt-1

                  admin-text-12

                  text-[var(--admin-muted)]
                "
              >
                {t("homeSlideshow.editor.information.description")}
              </p>

              <div className="mt-5">
                <LocalizedInput
                  label={t("homeSlideshow.editor.fields.name")}
                  value={form.name}
                  locales={locales}
                  onChange={(language, value) =>
                    updateLocalized("name", language, value)
                  }
                />
              </div>

              <div className="mt-5">
                <LocalizedInput
                  label={t("homeSlideshow.editor.fields.description")}
                  value={form.description}
                  locales={locales}
                  multiline
                  onChange={(language, value) =>
                    updateLocalized("description", language, value)
                  }
                />
              </div>
            </section>

            {/* =============================
                SLIDES
            ============================= */}

            <section
              className="
                mt-10

                border-t
                border-[var(--admin-border)]

                pt-8
              "
            >
              <div
                className="
                  flex
                  flex-col
                  gap-3

                  sm:flex-row
                  sm:items-end
                  sm:justify-between
                "
              >
                <div>
                  <h3
                    className="
                      admin-text-14
                      font-semibold

                      text-[var(--admin-foreground)]
                    "
                  >
                    {t("homeSlideshow.editor.slides.title")}
                  </h3>

                  <p
                    className="
                      mt-1

                      admin-text-12

                      text-[var(--admin-muted)]
                    "
                  >
                    {t("homeSlideshow.editor.slides.count", {
                      count: form.slides.length,
                    })}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setMediaPickerOpen(true)}
                  className="
                    inline-flex
                    h-10

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

                    disabled:opacity-50
                  "
                >
                  <ImagePlus size={15} />

                  {t("homeSlideshow.editor.slides.add")}
                </button>
              </div>

              {/* ===========================
                  EMPTY
              =========================== */}

              {form.slides.length === 0 ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setMediaPickerOpen(true)}
                  className="
                    mt-5

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

                    disabled:opacity-50
                  "
                >
                  <div
                    className="
                      flex
                      h-12
                      w-12

                      items-center
                      justify-center

                      rounded-2xl

                      bg-[var(--company-primary-soft)]

                      text-[var(--company-primary)]
                    "
                  >
                    <ImagePlus size={21} />
                  </div>

                  <div
                    className="
                      mt-4

                      admin-text-14
                      font-medium

                      text-[var(--admin-foreground)]
                    "
                  >
                    {t("homeSlideshow.editor.slides.emptyTitle")}
                  </div>

                  <p
                    className="
                      mt-1

                      admin-text-12

                      text-[var(--admin-muted)]
                    "
                  >
                    {t("homeSlideshow.editor.slides.emptyDescription")}
                  </p>
                </button>
              ) : (
                /* ===========================
                   SLIDE CARDS
                =========================== */

                <div
                  className="
                    mt-5

                    space-y-4
                  "
                >
                  {form.slides.map((slide, index) => (
                    <article
                      key={slide.id}
                      className={cn(
                        "overflow-hidden",

                        "rounded-2xl",

                        "border",

                        slide.enabled !== false
                          ? "border-[var(--admin-border)]"
                          : "border-[var(--admin-border)] opacity-60",

                        "bg-[var(--admin-surface)]",
                      )}
                    >
                      <div
                        className="
                            grid

                            lg:grid-cols-[220px_minmax(0,1fr)]
                          "
                      >
                        {/* =================
                              THUMBNAIL
                          ================= */}

                        <div
                          className="
                              border-b
                              border-[var(--admin-border)]

                              lg:border-b-0
                              lg:border-r
                            "
                        >
                          <SlideThumbnail
                            companyId={companyId}
                            mediaId={slide.mediaId}
                            alt={slide?.alt?.en || slide?.alt?.th || ""}
                          />

                          <div
                            className="
                                flex
                                items-center
                                justify-between

                                gap-2

                                border-t
                                border-[var(--admin-border)]

                                px-3
                                py-2
                              "
                          >
                            <div
                              className="
                                  admin-text-10
                                  font-semibold
                                  uppercase
                                  tracking-[0.08em]

                                  text-[var(--company-primary)]
                                "
                            >
                              {t("homeSlideshow.editor.slides.slide", {
                                number: index + 1,
                              })}
                            </div>

                            <span
                              className={cn(
                                "h-2 w-2 rounded-full",

                                slide.enabled !== false
                                  ? "bg-emerald-500"
                                  : "bg-[var(--admin-muted-light)]",
                              )}
                            />
                          </div>
                        </div>

                        {/* =================
                              DETAILS
                          ================= */}

                        <div className="p-4 sm:p-5">
                          {/* ACTIONS */}

                          <div
                            className="
                                flex
                                items-center
                                justify-between

                                gap-4
                              "
                          >
                            <label
                              className="
                                  inline-flex
                                  items-center

                                  gap-2

                                  admin-text-11

                                  text-[var(--admin-muted)]
                                "
                            >
                              <input
                                type="checkbox"
                                checked={slide.enabled !== false}
                                disabled={saving}
                                onChange={(event) =>
                                  updateSlide(index, (current) => ({
                                    ...current,

                                    enabled: event.target.checked,
                                  }))
                                }
                                className="
                                    accent-[var(--company-primary)]
                                  "
                              />

                              {t("homeSlideshow.editor.slides.active")}
                            </label>

                            <div
                              className="
                                  flex
                                  items-center
                                  gap-1
                                "
                            >
                              <button
                                type="button"
                                disabled={saving || index === 0}
                                onClick={() => moveSlide(index, -1)}
                                title={t("homeSlideshow.editor.slides.moveUp")}
                                className="
                                    flex
                                    h-8
                                    w-8

                                    items-center
                                    justify-center

                                    rounded-lg

                                    text-[var(--admin-muted)]

                                    transition

                                    hover:bg-[var(--admin-hover)]

                                    hover:text-[var(--admin-foreground)]

                                    disabled:opacity-20
                                  "
                              >
                                <ArrowUp size={14} />
                              </button>

                              <button
                                type="button"
                                disabled={
                                  saving || index === form.slides.length - 1
                                }
                                onClick={() => moveSlide(index, 1)}
                                title={t(
                                  "homeSlideshow.editor.slides.moveDown",
                                )}
                                className="
                                    flex
                                    h-8
                                    w-8

                                    items-center
                                    justify-center

                                    rounded-lg

                                    text-[var(--admin-muted)]

                                    transition

                                    hover:bg-[var(--admin-hover)]

                                    hover:text-[var(--admin-foreground)]

                                    disabled:opacity-20
                                  "
                              >
                                <ArrowDown size={14} />
                              </button>

                              <button
                                type="button"
                                disabled={saving}
                                onClick={() => removeSlide(index)}
                                title={t("homeSlideshow.editor.slides.remove")}
                                className="
                                    flex
                                    h-8
                                    w-8

                                    items-center
                                    justify-center

                                    rounded-lg

                                    text-red-500

                                    transition

                                    hover:bg-red-50

                                    hover:text-red-600

                                    disabled:opacity-50
                                  "
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          {/* ALT */}

                          <div className="mt-5">
                            <LocalizedInput
                              label={t("homeSlideshow.editor.fields.alt")}
                              value={slide.alt}
                              locales={locales}
                              onChange={(language, value) =>
                                updateSlide(index, (current) => ({
                                  ...current,

                                  alt: {
                                    ...current.alt,

                                    [language]: value,
                                  },
                                }))
                              }
                            />
                          </div>

                          {/* CAPTION */}

                          <div className="mt-5">
                            <LocalizedInput
                              label={t("homeSlideshow.editor.fields.caption")}
                              value={slide.caption}
                              locales={locales}
                              onChange={(language, value) =>
                                updateSlide(index, (current) => ({
                                  ...current,

                                  caption: {
                                    ...current.caption,

                                    [language]: value,
                                  },
                                }))
                              }
                            />
                          </div>

                          {/* LINK */}

                          <div
                            className="
                                mt-5

                                border-t
                                border-[var(--admin-border)]

                                pt-4
                              "
                          >
                            <label
                              className="
                                  inline-flex
                                  items-center

                                  gap-2

                                  admin-text-11

                                  text-[var(--admin-muted)]
                                "
                            >
                              <input
                                type="checkbox"
                                checked={slide.link?.enabled === true}
                                disabled={saving}
                                onChange={(event) =>
                                  updateSlide(index, (current) => ({
                                    ...current,

                                    link: {
                                      ...current.link,

                                      enabled: event.target.checked,
                                    },
                                  }))
                                }
                                className="
                                    accent-[var(--company-primary)]
                                  "
                              />

                              <ExternalLink size={13} />

                              {t("homeSlideshow.editor.slides.enableLink")}
                            </label>

                            {slide.link?.enabled && (
                              <div
                                className="
                                    mt-3

                                    rounded-xl

                                    bg-[var(--admin-background)]

                                    p-4
                                  "
                              >
                                <label>
                                  <span
                                    className="
                                        admin-text-11
                                        font-medium

                                        text-[var(--admin-muted)]
                                      "
                                  >
                                    {t("homeSlideshow.editor.fields.url")}
                                  </span>

                                  <input
                                    value={slide.link?.url || ""}
                                    disabled={saving}
                                    onChange={(event) =>
                                      updateSlide(index, (current) => ({
                                        ...current,

                                        link: {
                                          ...current.link,

                                          url: event.target.value,
                                        },
                                      }))
                                    }
                                    placeholder="https://..."
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
                                </label>

                                <label
                                  className="
                                      mt-3

                                      inline-flex
                                      items-center

                                      gap-2

                                      admin-text-11

                                      text-[var(--admin-muted)]
                                    "
                                >
                                  <input
                                    type="checkbox"
                                    checked={slide.link?.newTab === true}
                                    disabled={saving}
                                    onChange={(event) =>
                                      updateSlide(index, (current) => ({
                                        ...current,

                                        link: {
                                          ...current.link,

                                          newTab: event.target.checked,
                                        },
                                      }))
                                    }
                                    className="
                                        accent-[var(--company-primary)]
                                      "
                                  />

                                  {t("homeSlideshow.editor.slides.newTab")}
                                </label>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* ===============================
              FOOTER
          =============================== */}

          <footer
            className="
              flex
              shrink-0

              items-center
              justify-end

              gap-2

              border-t
              border-[var(--admin-border)]

              bg-[var(--admin-surface)]

              px-5
              py-4

              sm:px-8
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

                transition

                hover:bg-[var(--admin-hover)]

                disabled:opacity-50
              "
            >
              {t("common.cancel")}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
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

                transition

                hover:bg-[var(--company-primary-hover)]

                disabled:opacity-50
              "
            >
              {saving ? (
                <LoaderCircle size={15} className="animate-spin" />
              ) : null}

              {saving
                ? t("common.saving")
                : item
                  ? t("common.saveChanges")
                  : t("homeSlideshow.editor.createAction")}
            </button>
          </footer>
        </div>
      </div>

      {/* =================================
          MEDIA PICKER
      ================================= */}

      <MediaPicker
        open={mediaPickerOpen}
        companyId={companyId}
        selectedIds={selectedMediaIds}
        multiple
        cropPreset={null}
        title={t("homeSlideshow.editor.slides.pickerTitle")}
        onClose={() => setMediaPickerOpen(false)}
        onConfirm={(mediaItems) => {
          handleMediaSelected(mediaItems);

          setMediaPickerOpen(false);
        }}
      />
    </>
  );
}
