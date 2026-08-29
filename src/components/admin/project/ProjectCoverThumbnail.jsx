"use client";

import { Image as ImageIcon } from "lucide-react";

import { useEffect, useState } from "react";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { cn } from "@/utils/cn";

/*
 * =========================================================
 * PROJECT COVER THUMBNAIL
 * =========================================================
 *
 * Admin image behavior:
 *
 * loading
 *    ↓
 * skeleton + subtle pulse
 *    ↓
 * signed preview URL
 *    ↓
 * image fade-in
 *
 * If preview fails:
 * fallback placeholder remains visible.
 *
 * This prevents layout shifting and prevents
 * users from seeing an unexplained blank box.
 * =========================================================
 */

export default function ProjectCoverThumbnail({
  companyId,
  mediaId,
  alt = "",
  className,
}) {
  const { t } = useAdminTranslation();

  const [previewUrl, setPreviewUrl] = useState(null);

  const [loading, setLoading] = useState(false);

  const [failed, setFailed] = useState(false);

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
          setLoading(true);
          setFailed(false);
        }

        const response = await fetch(
          `/api/v1/companies/${companyId}/media/${mediaId}/preview?variant=thumbnail`,
          {
            cache: "no-store",

            credentials: "include",
          },
        );

        const payload = await response.json();

        if (!response.ok || payload?.success === false) {
          throw new Error("PROJECT_COVER_PREVIEW_FAILED");
        }

        const url = payload?.data?.url || payload?.url || null;

        if (!url) {
          throw new Error("PROJECT_COVER_URL_MISSING");
        }

        if (!cancelled) {
          setPreviewUrl(url);
        }
      } catch (error) {
        console.error("Project cover preview error:", error);

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

  /*
   * =======================================================
   * NO COVER
   * =======================================================
   */

  if (!mediaId) {
    return (
      <div
        title={t("project.cover.noCover")}
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
        <ImageIcon
          size={20}
          strokeWidth={1.4}
          className="
            text-[var(--admin-muted-light)]
          "
        />
      </div>
    );
  }

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
          FALLBACK
      ================================= */}

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
          <ImageIcon
            size={20}
            strokeWidth={1.4}
            className={cn(
              "transition",

              failed ? "text-red-300" : "text-[var(--admin-muted-light)]",
            )}
          />
        </div>
      )}

      {/* =================================
          IMAGE
      ================================= */}

      {previewUrl && (
        // Signed Admin preview URL is generated at runtime.
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

            transition
            duration-300

            [animation:admin-image-fade-in_250ms_ease-out_forwards]
          "
        />
      )}
    </div>
  );
}
