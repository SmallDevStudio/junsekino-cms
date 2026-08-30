"use client";

import {
  Crop,
  Image as ImageIcon,
  LoaderCircle,
  RefreshCw,
  Trash2,
} from "lucide-react";

import { useEffect, useState } from "react";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { cropMetadataToObjectPosition } from "@/utils/media-crop";

import { cn } from "@/utils/cn";

import MediaPicker from "./MediaPicker";

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

/*
 * =========================================================
 * MEDIA → REFERENCE
 * =========================================================
 */

function mediaToReference(media, previousValue = null) {
  if (!media?.id) {
    return null;
  }

  return {
    mediaId: media.id,

    alt: normalizeLocalized(media.alt || previousValue?.alt),

    caption: normalizeLocalized(media.caption || previousValue?.caption),

    /*
     * Important:
     *
     * Crop comes from MediaPicker → ImageCropDialog.
     *
     * If the user selects the same image and edits crop,
     * the new crop replaces the previous one.
     */
    crop: media.crop || previousValue?.crop || null,
  };
}

/*
 * =========================================================
 * COVER IMAGE FIELD
 * =========================================================
 */

export default function CoverImageField({
  companyId,

  value,

  onChange,

  /*
   * Crop preset:
   *
   * cover
   * avatar
   * square
   * portrait
   * landscape
   */
  cropPreset = "cover",

  /*
   * Visual layout only.
   *
   * Crop aspect itself comes from cropPreset.
   */
  previewClassName = "aspect-[16/9]",

  /*
   * Optional labels.
   *
   * Useful for About Cover, Project Cover,
   * User Avatar, etc.
   */
  title,

  description,

  emptyTitle,

  emptyDescription,

  selectLabel,

  pickerTitle,

  disabled = false,

  /*
   * When true the user can remove the image.
   */
  removable = true,

  className,
}) {
  const { t } = useAdminTranslation();

  const [pickerOpen, setPickerOpen] = useState(false);

  const [previewUrl, setPreviewUrl] = useState(null);

  const [previewLoading, setPreviewLoading] = useState(false);

  const [previewError, setPreviewError] = useState(false);

  const mediaId = value?.mediaId || null;

  /*
   * =======================================================
   * LABELS
   * =======================================================
   */

  const resolvedTitle = title || t("coverImage.title");

  const resolvedDescription = description || t("coverImage.description");

  const resolvedEmptyTitle = emptyTitle || t("coverImage.emptyTitle");

  const resolvedEmptyDescription =
    emptyDescription || t("coverImage.emptyDescription");

  const resolvedSelectLabel = selectLabel || t("coverImage.select");

  const resolvedPickerTitle = pickerTitle || t("coverImage.pickerTitle");

  /*
   * =======================================================
   * LOAD PREVIEW
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
          setPreviewLoading(true);

          setPreviewError(false);

          setPreviewUrl(null);
        }

        const response = await fetch(
          `/api/v1/companies/${companyId}/media/${mediaId}/preview?variant=large`,
          {
            method: "GET",

            cache: "no-store",

            credentials: "include",
          },
        );

        const payload = await response.json();

        if (!response.ok || payload?.success === false) {
          throw new Error(
            payload?.message || t("coverImage.errors.previewFailed"),
          );
        }

        const url = payload?.data?.url || payload?.url || null;

        if (!url) {
          throw new Error(t("coverImage.errors.previewFailed"));
        }

        if (!cancelled) {
          setPreviewUrl(url);
        }
      } catch (error) {
        console.error("Cover image preview error:", error);

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
  }, [companyId, mediaId, t]);

  /*
   * =======================================================
   * CLEAR PREVIEW WHEN IMAGE REMOVED
   * =======================================================
   */

  useEffect(() => {
    if (mediaId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPreviewUrl(null);

      setPreviewError(false);

      setPreviewLoading(false);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [mediaId]);

  /*
   * =======================================================
   * SELECT
   * =======================================================
   */

  function handleSelected(media) {
    if (!media) {
      return;
    }

    const nextValue = mediaToReference(media, value);

    onChange?.(nextValue);
  }

  /*
   * =======================================================
   * REMOVE
   * =======================================================
   */

  function handleRemove() {
    if (disabled) {
      return;
    }

    setPreviewUrl(null);

    setPreviewError(false);

    onChange?.(null);
  }

  /*
   * =======================================================
   * PREVIEW POSITION
   * =======================================================
   */

  const objectPosition = cropMetadataToObjectPosition(value?.crop);

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <>
      <div className={cn(className)}>
        {/* =================================
            LABEL
        ================================= */}

        <div
          className="
            flex
            flex-col
            gap-3

            sm:flex-row
            sm:items-start
            sm:justify-between
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
              {resolvedTitle}
            </div>

            {resolvedDescription && (
              <p
                className="
                  mt-1

                  max-w-2xl

                  admin-text-11
                  leading-[1.65]

                  text-[var(--admin-muted)]
                "
              >
                {resolvedDescription}
              </p>
            )}
          </div>

          {mediaId && (
            <div
              className="
                flex
                shrink-0

                items-center
                gap-2
              "
            >
              {/* REPOSITION */}

              <button
                type="button"
                disabled={disabled}
                onClick={() => setPickerOpen(true)}
                className="
                  inline-flex
                  h-9

                  items-center
                  justify-center
                  gap-2

                  rounded-xl

                  border
                  border-[var(--admin-border)]

                  bg-[var(--admin-surface)]

                  px-3

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
                <Crop size={13} />

                {t("coverImage.adjust")}
              </button>

              {/* CHANGE */}

              <button
                type="button"
                disabled={disabled}
                onClick={() => setPickerOpen(true)}
                className="
                  inline-flex
                  h-9

                  items-center
                  justify-center
                  gap-2

                  rounded-xl

                  border
                  border-[var(--admin-border)]

                  bg-[var(--admin-surface)]

                  px-3

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
                <RefreshCw size={13} />

                {t("common.change")}
              </button>
            </div>
          )}
        </div>

        {/* =================================
            IMAGE
        ================================= */}

        <div className="mt-3">
          {mediaId ? (
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
                className={cn(
                  "relative",

                  "w-full",

                  "overflow-hidden",

                  "bg-[var(--admin-background)]",

                  previewClassName,
                )}
              >
                {/* SKELETON */}

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

                {/* IMAGE */}

                {previewUrl ? (
                  // Signed runtime Admin preview.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt={value?.alt?.en || value?.alt?.th || ""}
                    loading="lazy"
                    decoding="async"
                    style={{
                      objectPosition,
                    }}
                    className="
                      h-full
                      w-full

                      object-cover

                      opacity-0

                      [animation:admin-image-fade-in_250ms_ease-out_forwards]
                    "
                  />
                ) : (
                  !previewLoading && (
                    <div
                      className="
                        flex
                        h-full
                        w-full

                        items-center
                        justify-center
                      "
                    >
                      <ImageIcon
                        size={26}
                        strokeWidth={1.4}
                        className={
                          previewError
                            ? "text-red-400"
                            : "text-[var(--admin-muted-light)]"
                        }
                      />
                    </div>
                  )
                )}

                {/* CROP INDICATOR */}

                {value?.crop && (
                  <div
                    className="
                      absolute
                      bottom-3
                      left-3

                      inline-flex
                      h-7

                      items-center
                      gap-1.5

                      rounded-lg

                      bg-black/55

                      px-2.5

                      admin-text-9
                      font-medium

                      text-white

                      backdrop-blur-sm
                    "
                  >
                    <Crop size={11} />

                    {t("coverImage.cropped")}
                  </div>
                )}
              </div>

              {/* FOOTER */}

              <div
                className="
                  flex
                  flex-col
                  gap-3

                  border-t
                  border-[var(--admin-border)]

                  p-4

                  sm:flex-row
                  sm:items-center
                  sm:justify-between
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
                    {t("coverImage.selected")}
                  </div>

                  <div
                    className="
                      mt-1
                      truncate

                      admin-text-10

                      text-[var(--admin-muted)]
                    "
                  >
                    {t("coverImage.mediaId", {
                      id: mediaId,
                    })}
                  </div>
                </div>

                {removable && (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={handleRemove}
                    aria-label={t("coverImage.remove")}
                    title={t("coverImage.remove")}
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

                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* ===============================
               EMPTY
            =============================== */

            <button
              type="button"
              disabled={disabled}
              onClick={() => setPickerOpen(true)}
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

                disabled:cursor-not-allowed
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
                <ImageIcon size={21} strokeWidth={1.5} />
              </div>

              <div
                className="
                  mt-4

                  admin-text-14
                  font-medium

                  text-[var(--admin-foreground)]
                "
              >
                {resolvedEmptyTitle}
              </div>

              <p
                className="
                  mt-1
                  max-w-sm

                  admin-text-12
                  leading-[1.65]

                  text-[var(--admin-muted)]
                "
              >
                {resolvedEmptyDescription}
              </p>

              <span
                className="
                  mt-4

                  inline-flex
                  h-9

                  items-center
                  justify-center
                  gap-2

                  rounded-xl

                  border
                  border-[var(--admin-border)]

                  bg-[var(--admin-surface)]

                  px-3

                  admin-text-12
                  font-medium

                  text-[var(--admin-foreground)]
                "
              >
                <ImageIcon size={14} />

                {resolvedSelectLabel}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* =====================================
          MEDIA PICKER + CROP CORE
      ===================================== */}

      <MediaPicker
        open={pickerOpen}
        companyId={companyId}
        selectedIds={mediaId ? [mediaId] : []}
        multiple={false}
        cropPreset={cropPreset}
        initialCrop={value?.crop || null}
        title={resolvedPickerTitle}
        onClose={() => setPickerOpen(false)}
        onConfirm={(media) => {
          handleSelected(media);

          setPickerOpen(false);
        }}
      />
    </>
  );
}
