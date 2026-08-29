"use client";

import { Award, Image as ImageIcon } from "lucide-react";

import { useEffect, useState } from "react";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { cn } from "@/utils/cn";

/*
 * =========================================================
 * AWARD COVER THUMBNAIL
 * =========================================================
 *
 * Loading behavior:
 *
 * signed preview request
 *        ↓
 * image skeleton
 *        ↓
 * fade-in image
 *
 * If Award has no own cover, caller may pass the
 * linked Project cover as fallbackMediaId.
 * =========================================================
 */

export default function AwardCoverThumbnail({
  companyId,

  mediaId,

  fallbackMediaId,

  alt = "",

  className,
}) {
  const { t } = useAdminTranslation();

  const resolvedMediaId = mediaId || fallbackMediaId || null;

  const [previewUrl, setPreviewUrl] = useState(null);

  const [loading, setLoading] = useState(false);

  const [failed, setFailed] = useState(false);

  /*
   * =======================================================
   * PREVIEW
   * =======================================================
   */

  useEffect(() => {
    if (!companyId || !resolvedMediaId) {
      return;
    }

    let cancelled = false;

    const timeoutId = window.setTimeout(async () => {
      try {
        if (!cancelled) {
          setPreviewUrl(null);

          setLoading(true);

          setFailed(false);
        }

        const response = await fetch(
          `/api/v1/companies/${companyId}/media/${resolvedMediaId}/preview?variant=thumbnail`,
          {
            method: "GET",

            cache: "no-store",

            credentials: "include",
          },
        );

        const payload = await response.json();

        if (!response.ok || payload?.success === false) {
          throw new Error("AWARD_COVER_PREVIEW_FAILED");
        }

        const url = payload?.data?.url || payload?.url || null;

        if (!url) {
          throw new Error("AWARD_COVER_URL_MISSING");
        }

        if (!cancelled) {
          setPreviewUrl(url);
        }
      } catch (error) {
        console.error("Award cover preview error:", error);

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
  }, [companyId, resolvedMediaId]);

  /*
   * =======================================================
   * EMPTY
   * =======================================================
   */

  if (!resolvedMediaId) {
    return (
      <div
        title={t("award.cover.noCover")}
        className={cn(
          "relative",

          "flex",

          "h-[86px]",
          "w-[116px]",

          "shrink-0",

          "items-center",
          "justify-center",

          "overflow-hidden",

          "rounded-xl",

          "border",
          "border-[var(--admin-border)]",

          "bg-[var(--admin-background)]",

          className,
        )}
      >
        <Award
          size={20}
          strokeWidth={1.4}
          className="
            text-[var(--admin-muted-light)]
          "
        />
      </div>
    );
  }

  /*
   * =======================================================
   * IMAGE
   * =======================================================
   */

  return (
    <div
      className={cn(
        "relative",

        "h-[86px]",
        "w-[116px]",

        "shrink-0",

        "overflow-hidden",

        "rounded-xl",

        "border",
        "border-[var(--admin-border)]",

        "bg-[var(--admin-background)]",

        className,
      )}
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

      {!previewUrl && (
        <div
          className="
            absolute
            inset-0

            flex
            items-center
            justify-center
          "
        >
          {failed ? (
            <ImageIcon size={20} strokeWidth={1.4} className="text-red-300" />
          ) : (
            !loading && (
              <Award
                size={20}
                strokeWidth={1.4}
                className="
                  text-[var(--admin-muted-light)]
                "
              />
            )
          )}
        </div>
      )}

      {previewUrl && (
        // Signed Admin preview URL is runtime-generated.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt={alt}
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
      )}
    </div>
  );
}
