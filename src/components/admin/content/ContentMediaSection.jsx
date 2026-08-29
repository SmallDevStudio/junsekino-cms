"use client";

import {
  ArrowLeft,
  ArrowRight,
  Image as ImageIcon,
  Images,
  LoaderCircle,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

import { useEffect, useState } from "react";

import MediaPicker from "@/components/admin/media/MediaPicker";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { cn } from "@/utils/cn";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function normalizeLocalized(value) {
  return {
    th: value?.th || "",

    en: value?.en || "",
  };
}

function mediaToContentImage(media) {
  if (!media?.id) {
    return null;
  }

  return {
    mediaId: media.id,

    alt: normalizeLocalized(media.alt),

    caption: normalizeLocalized(media.caption),
  };
}

/*
 * =========================================================
 * IMAGE PREVIEW
 * =========================================================
 */

function ContentImagePreview({
  companyId,
  image,
  variant = "thumbnail",
  className,
}) {
  const { t } = useAdminTranslation();

  const [previewUrl, setPreviewUrl] = useState(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(false);

  const mediaId = image?.mediaId;

  /*
   * =======================================================
   * LOAD
   * =======================================================
   */

  useEffect(() => {
    if (!companyId || !mediaId) {
      return;
    }

    let cancelled = false;

    const timeoutId = window.setTimeout(async () => {
      try {
        if (!cancelled) {
          setLoading(true);

          setError(false);

          setPreviewUrl(null);
        }

        const response = await fetch(
          `/api/v1/companies/${companyId}/media/${mediaId}/preview?variant=${variant}`,
          {
            method: "GET",

            cache: "no-store",

            credentials: "include",
          },
        );

        const payload = await response.json();

        if (!response.ok || payload?.success === false) {
          throw new Error(
            payload?.message || t("contentMedia.errors.previewUnavailable"),
          );
        }

        const url = payload?.data?.url || payload?.url || null;

        if (!url) {
          throw new Error(t("contentMedia.errors.previewUnavailable"));
        }

        if (!cancelled) {
          setPreviewUrl(url);
        }
      } catch (previewError) {
        console.error("Content media preview error:", previewError);

        if (!cancelled) {
          setError(true);
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
  }, [companyId, mediaId, variant, t]);

  return (
    <div
      className={cn(
        "relative",

        "overflow-hidden",

        "bg-[var(--admin-background)]",

        className,
      )}
    >
      {/* =================================
          SKELETON
      ================================= */}

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

      {/* =================================
          IMAGE
      ================================= */}

      {previewUrl ? (
        // Signed Admin preview URL.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt={image?.alt?.en || image?.alt?.th || ""}
          loading="lazy"
          decoding="async"
          className="
            h-full
            w-full

            object-cover

            opacity-0

            [animation:admin-image-fade-in_250ms_ease-out_forwards]
          "
        />
      ) : (
        <div
          className="
            flex
            h-full
            w-full

            items-center
            justify-center
          "
        >
          {!loading && (
            <ImageIcon
              size={24}
              strokeWidth={1.5}
              className={cn(
                error ? "text-red-400" : "text-[var(--admin-muted-light)]",
              )}
            />
          )}
        </div>
      )}
    </div>
  );
}

/*
 * =========================================================
 * EMPTY MEDIA
 * =========================================================
 */

function EmptyMedia({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div
      className="
        flex
        min-h-[220px]

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
      "
    >
      <div
        className="
          flex
          h-11
          w-11

          items-center
          justify-center

          rounded-2xl

          bg-[var(--company-primary-soft)]

          text-[var(--company-primary)]
        "
      >
        <Icon size={20} strokeWidth={1.6} />
      </div>

      <div
        className="
          mt-4

          admin-text-14
          font-medium

          text-[var(--admin-foreground)]
        "
      >
        {title}
      </div>

      <p
        className="
          mt-1

          max-w-xs

          admin-text-12
          leading-[1.65]

          text-[var(--admin-muted)]
        "
      >
        {description}
      </p>

      <button
        type="button"
        onClick={onAction}
        className={cn(
          "mt-4 inline-flex h-9",

          "items-center justify-center gap-2",

          "rounded-xl",

          "border border-[var(--admin-border)]",

          "bg-[var(--admin-surface)]",

          "px-3",

          "admin-text-12 font-medium",

          "text-[var(--admin-foreground)]",

          "transition",

          "hover:border-[var(--company-primary-border)]",

          "hover:bg-[var(--company-primary-soft)]",

          "hover:text-[var(--company-primary)]",
        )}
      >
        <Plus size={14} />

        {actionLabel}
      </button>
    </div>
  );
}

/*
 * =========================================================
 * CONTENT MEDIA SECTION
 * =========================================================
 */

export default function ContentMediaSection({
  companyId,

  featuredImage,

  gallery = [],

  onFeaturedImageChange,

  onGalleryChange,

  /*
   * Kept for backward compatibility.
   *
   * UI text now comes from i18n.
   */
  contentLabel,
}) {
  const { t } = useAdminTranslation();

  const [featuredPickerOpen, setFeaturedPickerOpen] = useState(false);

  const [galleryPickerOpen, setGalleryPickerOpen] = useState(false);

  const galleryIds = gallery.map((image) => image?.mediaId).filter(Boolean);

  /*
   * =======================================================
   * FEATURED
   * =======================================================
   */

  function handleFeaturedSelected(media) {
    onFeaturedImageChange?.(media ? mediaToContentImage(media) : null);
  }

  /*
   * =======================================================
   * GALLERY
   * =======================================================
   */

  function handleGallerySelected(mediaItems) {
    const selected = Array.isArray(mediaItems) ? mediaItems : [];

    if (selected.length === 0) {
      return;
    }

    const existingIds = new Set(galleryIds);

    const newImages = selected
      .filter((media) => media?.id && !existingIds.has(media.id))
      .map(mediaToContentImage)
      .filter(Boolean);

    if (newImages.length === 0) {
      return;
    }

    onGalleryChange?.([...gallery, ...newImages]);
  }

  function removeGalleryImage(mediaId) {
    onGalleryChange?.(gallery.filter((image) => image.mediaId !== mediaId));
  }

  function moveGalleryImage(index, direction) {
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= gallery.length) {
      return;
    }

    const nextGallery = [...gallery];

    [nextGallery[index], nextGallery[targetIndex]] = [
      nextGallery[targetIndex],
      nextGallery[index],
    ];

    onGalleryChange?.(nextGallery);
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

        <div>
          <h3
            className="
              admin-text-14
              font-semibold

              text-[var(--admin-foreground)]
            "
          >
            {t("contentMedia.title")}
          </h3>

          <p
            className="
              mt-1

              admin-text-12
              leading-[1.65]

              text-[var(--admin-muted)]
            "
          >
            {t("contentMedia.description")}
          </p>
        </div>

        {/* =================================
            COVER
        ================================= */}

        <div className="mt-5">
          <div
            className="
              flex
              items-center
              justify-between

              gap-4
            "
          >
            <div>
              <div
                className="
                  admin-text-12
                  font-medium

                  text-[var(--admin-foreground)]
                "
              >
                {t("contentMedia.cover.title")}
              </div>

              <div
                className="
                  mt-1

                  admin-text-11
                  leading-[1.6]

                  text-[var(--admin-muted)]
                "
              >
                {t("contentMedia.cover.description")}
              </div>
            </div>

            {featuredImage && (
              <button
                type="button"
                onClick={() => setFeaturedPickerOpen(true)}
                className="
                  inline-flex
                  h-9

                  items-center
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
                <RefreshCw size={13} />

                {t("common.change")}
              </button>
            )}
          </div>

          <div className="mt-3">
            {featuredImage ? (
              <div
                className="
                  overflow-hidden

                  rounded-2xl

                  border
                  border-[var(--admin-border)]

                  bg-[var(--admin-surface)]
                "
              >
                <ContentImagePreview
                  companyId={companyId}
                  image={featuredImage}
                  variant="large"
                  className="
                    aspect-[16/9]
                    w-full
                  "
                />

                <div
                  className="
                    flex
                    items-center
                    justify-between

                    gap-4

                    p-4
                  "
                >
                  <div className="min-w-0">
                    <div
                      className="
                        admin-text-12
                        font-medium

                        text-[var(--admin-foreground)]
                      "
                    >
                      {t("contentMedia.cover.selected")}
                    </div>

                    <div
                      className="
                        mt-1
                        truncate

                        admin-text-10

                        text-[var(--admin-muted)]
                      "
                    >
                      {t("contentMedia.mediaId", {
                        id: featuredImage.mediaId,
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onFeaturedImageChange?.(null)}
                    aria-label={t("contentMedia.cover.remove")}
                    title={t("contentMedia.cover.remove")}
                    className="
                      flex
                      h-9
                      w-9
                      shrink-0

                      items-center
                      justify-center

                      rounded-xl

                      text-red-500

                      transition

                      hover:bg-red-50

                      hover:text-red-600
                    "
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ) : (
              <EmptyMedia
                icon={ImageIcon}
                title={t("contentMedia.cover.emptyTitle")}
                description={t("contentMedia.cover.emptyDescription")}
                actionLabel={t("contentMedia.cover.select")}
                onAction={() => setFeaturedPickerOpen(true)}
              />
            )}
          </div>
        </div>

        {/* =================================
            GALLERY
        ================================= */}

        <div
          className="
            mt-8

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
              sm:items-center
              sm:justify-between
            "
          >
            <div>
              <div
                className="
                  admin-text-12
                  font-medium

                  text-[var(--admin-foreground)]
                "
              >
                {t("contentMedia.gallery.title")}
              </div>

              <div
                className="
                  mt-1

                  admin-text-11
                  leading-[1.6]

                  text-[var(--admin-muted)]
                "
              >
                {t("contentMedia.gallery.description")}
              </div>
            </div>

            {gallery.length > 0 && (
              <button
                type="button"
                onClick={() => setGalleryPickerOpen(true)}
                className={cn(
                  "inline-flex h-9",

                  "items-center justify-center gap-2",

                  "self-start",

                  "rounded-xl",

                  "border border-[var(--admin-border)]",

                  "bg-[var(--admin-surface)]",

                  "px-3",

                  "admin-text-12 font-medium",

                  "text-[var(--admin-foreground)]",

                  "transition",

                  "hover:border-[var(--company-primary-border)]",

                  "hover:bg-[var(--company-primary-soft)]",

                  "hover:text-[var(--company-primary)]",

                  "sm:self-auto",
                )}
              >
                <Plus size={14} />

                {t("contentMedia.gallery.add")}
              </button>
            )}
          </div>

          <div className="mt-3">
            {gallery.length === 0 ? (
              <EmptyMedia
                icon={Images}
                title={t("contentMedia.gallery.emptyTitle")}
                description={t("contentMedia.gallery.emptyDescription")}
                actionLabel={t("contentMedia.gallery.add")}
                onAction={() => setGalleryPickerOpen(true)}
              />
            ) : (
              <div
                className="
                  grid
                  grid-cols-2
                  gap-3

                  sm:grid-cols-3

                  lg:grid-cols-4
                "
              >
                {gallery.map((image, index) => (
                  <article
                    key={image.mediaId}
                    className="
                        group

                        overflow-hidden

                        rounded-2xl

                        border
                        border-[var(--admin-border)]

                        bg-[var(--admin-surface)]

                        transition

                        hover:border-[var(--company-primary-border)]
                      "
                  >
                    <div className="relative">
                      <ContentImagePreview
                        companyId={companyId}
                        image={image}
                        variant="thumbnail"
                        className="
                            aspect-square
                            w-full
                          "
                      />

                      <div
                        className="
                            absolute
                            left-2
                            top-2

                            flex
                            h-6
                            min-w-6

                            items-center
                            justify-center

                            rounded-full

                            bg-black/60

                            px-2

                            admin-text-9
                            font-semibold

                            text-white

                            backdrop-blur
                          "
                      >
                        {index + 1}
                      </div>
                    </div>

                    <div
                      className="
                          flex
                          items-center
                          justify-between

                          gap-1

                          p-2
                        "
                    >
                      <div
                        className="
                            flex
                            items-center

                            gap-1
                          "
                      >
                        <button
                          type="button"
                          onClick={() => moveGalleryImage(index, -1)}
                          disabled={index === 0}
                          aria-label={t("contentMedia.gallery.movePrevious")}
                          title={t("contentMedia.gallery.movePrevious")}
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

                              hover:text-[var(--company-primary)]

                              disabled:cursor-not-allowed
                              disabled:opacity-25
                            "
                        >
                          <ArrowLeft size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => moveGalleryImage(index, 1)}
                          disabled={index === gallery.length - 1}
                          aria-label={t("contentMedia.gallery.moveNext")}
                          title={t("contentMedia.gallery.moveNext")}
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

                              hover:text-[var(--company-primary)]

                              disabled:cursor-not-allowed
                              disabled:opacity-25
                            "
                        >
                          <ArrowRight size={14} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeGalleryImage(image.mediaId)}
                        aria-label={t("contentMedia.gallery.remove")}
                        title={t("contentMedia.gallery.remove")}
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
                          "
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =====================================
          COVER PICKER
      ===================================== */}

      <MediaPicker
        open={featuredPickerOpen}
        companyId={companyId}
        selectedIds={featuredImage?.mediaId ? [featuredImage.mediaId] : []}
        multiple={false}
        title={t("contentMedia.cover.pickerTitle")}
        onClose={() => setFeaturedPickerOpen(false)}
        onConfirm={handleFeaturedSelected}
      />

      {/* =====================================
          GALLERY PICKER
      ===================================== */}

      <MediaPicker
        open={galleryPickerOpen}
        companyId={companyId}
        selectedIds={galleryIds}
        multiple
        title={t("contentMedia.gallery.pickerTitle")}
        onClose={() => setGalleryPickerOpen(false)}
        onConfirm={handleGallerySelected}
      />
    </>
  );
}
