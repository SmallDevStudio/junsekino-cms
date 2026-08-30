"use client";

import { ExternalLink, FileImage, LoaderCircle, Trash2 } from "lucide-react";

import { useEffect, useState } from "react";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { cn } from "@/utils/cn";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function formatBytes(bytes) {
  const value = Number(bytes);

  if (!Number.isFinite(value)) {
    return null;
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
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
 * CARD
 * =========================================================
 */

export default function MediaCard({
  companyId,

  media,

  title,

  onOpen,

  onDelete,
}) {
  const { t, statusLabel } = useAdminTranslation();

  const [previewUrl, setPreviewUrl] = useState(null);

  const [loadingPreview, setLoadingPreview] = useState(false);

  const [previewError, setPreviewError] = useState(false);

  const mediaId = media?.id;

  const mediaStatus = media?.status;

  /*
   * =======================================================
   * PREVIEW
   * =======================================================
   */

  useEffect(() => {
    if (!companyId || !mediaId || mediaStatus !== "ready") {
      return;
    }

    let cancelled = false;

    const timeoutId = window.setTimeout(async () => {
      try {
        if (!cancelled) {
          setLoadingPreview(true);

          setPreviewError(false);
        }

        const response = await fetch(
          `/api/v1/companies/${companyId}/media/${mediaId}/preview?variant=thumbnail`,
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
          setLoadingPreview(false);
        }
      }
    }, 0);

    return () => {
      cancelled = true;

      window.clearTimeout(timeoutId);
    };
  }, [companyId, mediaId, mediaStatus]);

  /*
   * =======================================================
   * EVENTS
   * =======================================================
   */

  function handleOpen() {
    onOpen?.(media);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();

      handleOpen();
    }
  }

  function handleDelete(event) {
    event.stopPropagation();

    onDelete?.(media);
  }

  function handleOpenPreview(event) {
    event.stopPropagation();

    if (!previewUrl) {
      return;
    }

    window.open(previewUrl, "_blank", "noopener,noreferrer");
  }

  const size = formatBytes(media?.size);

  const displayTitle = media?.title?.en || media?.title?.th || title;

  const translatedStatus = mediaStatus
    ? statusLabel(mediaStatus)
    : t("media.card.statusUnknown");

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
      className="
        group
        cursor-pointer

        overflow-hidden

        rounded-2xl

        border
        border-[var(--admin-border)]

        bg-[var(--admin-surface)]

        outline-none

        transition

        hover:border-[var(--company-primary-border)]

        hover:shadow-[0_10px_34px_rgba(0,0,0,0.055)]

        focus-visible:border-[var(--company-primary)]

        focus-visible:ring-2
        focus-visible:ring-[var(--company-primary-soft)]
      "
    >
      {/* PREVIEW */}

      <div
        className="
          relative

          aspect-[4/3]

          overflow-hidden

          bg-[var(--admin-background)]
        "
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={media?.alt?.en || media?.alt?.th || displayTitle || ""}
            loading="lazy"
            decoding="async"
            className="
              h-full
              w-full

              object-cover

              transition
              duration-300

              group-hover:scale-[1.02]
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
            {loadingPreview ? (
              <LoaderCircle
                size={20}
                className="
                  animate-spin

                  text-[var(--company-primary)]
                "
              />
            ) : (
              <FileImage
                size={24}
                strokeWidth={1.4}
                className={
                  previewError
                    ? "text-red-300"
                    : "text-[var(--admin-muted-light)]"
                }
              />
            )}
          </div>
        )}

        <span
          className={cn(
            "absolute left-3 top-3",

            "inline-flex rounded-full border",

            "px-2 py-1",

            "admin-text-9 font-semibold uppercase tracking-[0.08em]",

            mediaStatus === "ready"
              ? "border-emerald-200 bg-emerald-50/95 text-emerald-700"
              : "border-amber-200 bg-amber-50/95 text-amber-700",
          )}
        >
          {translatedStatus}
        </span>

        {previewUrl && (
          <button
            type="button"
            onClick={handleOpenPreview}
            title={t("media.card.openPreview")}
            className="
              absolute
              right-3
              top-3

              flex
              h-8
              w-8

              items-center
              justify-center

              rounded-lg

              bg-black/55

              text-white

              opacity-0

              backdrop-blur

              transition

              group-hover:opacity-100

              focus:opacity-100
            "
          >
            <ExternalLink size={13} />
          </button>
        )}
      </div>

      {/* INFO */}

      <div
        className="
          flex
          min-h-[84px]

          items-end

          gap-3

          px-4
          py-3.5
        "
      >
        <div className="min-w-0 flex-1">
          <div
            className="
              truncate

              admin-text-12
              font-medium

              text-[var(--admin-foreground)]
            "
            title={displayTitle}
          >
            {displayTitle}
          </div>

          <div
            className="
              mt-1

              flex
              min-w-0
              items-center

              gap-2

              admin-text-9

              text-[var(--admin-muted)]
            "
          >
            {media?.mimeType && (
              <span className="truncate">{media.mimeType}</span>
            )}

            {media?.mimeType && size && <span>•</span>}

            {size && <span className="shrink-0">{size}</span>}
          </div>
        </div>

        <button
          type="button"
          onClick={handleDelete}
          title={t("media.delete.delete")}
          aria-label={t("media.delete.delete")}
          className="
            flex
            h-8
            w-8
            shrink-0

            items-center
            justify-center

            rounded-lg

            text-black/25

            transition

            hover:bg-red-50

            hover:text-red-600

            focus:bg-red-50

            focus:text-red-600
          "
        >
          <Trash2 size={14} strokeWidth={1.7} />
        </button>
      </div>
    </article>
  );
}
