"use client";

import { ExternalLink, FileImage, LoaderCircle } from "lucide-react";

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

/*
 * =========================================================
 * PREVIEW
 * =========================================================
 */

async function fetchPreviewUrl({ companyId, mediaId }) {
  const response = await fetch(
    `/api/v1/companies/${companyId}/media/${mediaId}/preview`,
    {
      cache: "no-store",

      credentials: "include",
    },
  );

  const payload = await response.json();

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || "MEDIA_PREVIEW_FAILED");
  }

  const url = payload?.data?.url || payload?.url || null;

  if (!url) {
    throw new Error("MEDIA_PREVIEW_URL_MISSING");
  }

  return url;
}

/*
 * =========================================================
 * CARD
 * =========================================================
 */

export default function MediaCard({ companyId, media, title }) {
  const { t, statusLabel } = useAdminTranslation();

  const [previewUrl, setPreviewUrl] = useState(null);

  const [loadingPreview, setLoadingPreview] = useState(false);

  const [previewError, setPreviewError] = useState(false);

  const mediaId = media?.id;

  const mediaStatus = media?.status;

  /*
   * =======================================================
   * LOAD PREVIEW
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

        const url = await fetchPreviewUrl({
          companyId,
          mediaId,
        });

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
   * RETRY
   * =======================================================
   */

  async function handleRetryPreview() {
    if (!companyId || !mediaId) {
      return;
    }

    try {
      setLoadingPreview(true);

      setPreviewError(false);

      const url = await fetchPreviewUrl({
        companyId,
        mediaId,
      });

      setPreviewUrl(url);
    } catch (error) {
      console.error("Media preview retry error:", error);

      setPreviewError(true);
    } finally {
      setLoadingPreview(false);
    }
  }

  /*
   * =======================================================
   * OPEN ORIGINAL PREVIEW
   * =======================================================
   */

  function handleOpenPreview() {
    if (!previewUrl) {
      return;
    }

    window.open(previewUrl, "_blank", "noopener,noreferrer");
  }

  const size = formatBytes(media?.size);

  const translatedStatus = mediaStatus
    ? statusLabel(mediaStatus)
    : t("media.card.statusUnknown");

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <article
      className={cn(
        "group overflow-hidden",

        "rounded-2xl",

        "border border-[var(--admin-border)]",

        "bg-[var(--admin-surface)]",

        "transition",

        "hover:border-[var(--company-primary-border)]",

        "hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)]",
      )}
    >
      {/* =====================================
          IMAGE
      ===================================== */}

      <div
        className="
          relative

          aspect-[4/3]

          overflow-hidden

          bg-[var(--admin-background)]
        "
      >
        {previewUrl ? (
          // Signed Admin preview URL.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={title || ""}
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
                strokeWidth={1.5}
                className="text-[var(--admin-muted-light)]"
              />
            )}
          </div>
        )}

        {/* =================================
            STATUS
        ================================= */}

        <div
          className="
            absolute
            left-3
            top-3
          "
        >
          <span
            className={cn(
              "inline-flex",

              "rounded-full",

              "border",

              "px-2 py-1",

              "admin-text-9 font-semibold",

              "uppercase tracking-[0.08em]",

              mediaStatus === "ready"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700",
            )}
          >
            {translatedStatus}
          </span>
        </div>

        {/* =================================
            OPEN PREVIEW
        ================================= */}

        {previewUrl && (
          <button
            type="button"
            onClick={handleOpenPreview}
            aria-label={t("media.card.openPreview")}
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

              bg-black/60

              text-white

              opacity-0

              backdrop-blur

              transition

              group-hover:opacity-100

              focus:opacity-100
            "
          >
            <ExternalLink size={14} />
          </button>
        )}
      </div>

      {/* =====================================
          INFORMATION
      ===================================== */}

      <div className="p-4">
        <div
          title={title}
          className="
            truncate

            admin-text-13
            font-medium

            text-[var(--admin-foreground)]
          "
        >
          {title}
        </div>

        <div
          className="
            mt-2

            flex
            items-center
            gap-2

            admin-text-10

            text-[var(--admin-muted)]
          "
        >
          {media?.mimeType && (
            <span
              className="
                truncate
              "
            >
              {media.mimeType}
            </span>
          )}

          {media?.mimeType && size && <span>•</span>}

          {size && (
            <span
              className="
                shrink-0
              "
            >
              {size}
            </span>
          )}
        </div>

        {/* =================================
            PREVIEW ERROR
        ================================= */}

        {previewError && (
          <div
            className="
              mt-3

              rounded-xl

              bg-red-50

              px-3
              py-2
            "
          >
            <div
              className="
                admin-text-10
                leading-[1.5]

                text-red-600
              "
            >
              {t("media.card.previewFailed")}
            </div>

            <button
              type="button"
              onClick={handleRetryPreview}
              disabled={loadingPreview}
              className="
                mt-1

                admin-text-11
                font-medium

                text-[var(--company-primary)]

                transition

                hover:underline

                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {loadingPreview
                ? t("media.card.loadingPreview")
                : t("media.card.retryPreview")}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
