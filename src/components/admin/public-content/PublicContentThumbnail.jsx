"use client";

import { FileText, Image as ImageIcon, PlaySquare } from "lucide-react";

import { useEffect, useState } from "react";

import { PUBLIC_CONTENT_TYPE } from "@/constants/public-content";

import { cn } from "@/utils/cn";

export default function PublicContentThumbnail({
  companyId,
  item,
  alt = "",
  className,
}) {
  const mediaId = item?.featuredImage?.mediaId || null;

  const externalThumbnail = item?.source?.metadata?.thumbnailUrl || null;

  const [previewUrl, setPreviewUrl] = useState(null);

  const [loading, setLoading] = useState(Boolean(mediaId || externalThumbnail));

  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!mediaId) {
      return;
    }

    let cancelled = false;

    const timeoutId = window.setTimeout(async () => {
      try {
        if (!cancelled) {
          setLoading(true);
          setFailed(false);
          setPreviewUrl(null);
        }

        const response = await fetch(
          `/api/v1/companies/${companyId}/media/${mediaId}/preview?variant=thumbnail`,
          {
            method: "GET",
            cache: "no-store",
            credentials: "include",
          },
        );

        const payload = await response.json();

        if (!response.ok || payload?.success === false) {
          throw new Error("PUBLIC_CONTENT_PREVIEW_FAILED");
        }

        const url = payload?.data?.url || payload?.url || null;

        if (!url) {
          throw new Error("PUBLIC_CONTENT_PREVIEW_URL_MISSING");
        }

        if (!cancelled) {
          setPreviewUrl(url);
        }
      } catch (error) {
        console.error("Public content thumbnail error:", error);

        if (!cancelled) {
          setFailed(true);
          setLoading(false);
        }
      }
    }, 0);

    return () => {
      cancelled = true;

      window.clearTimeout(timeoutId);
    };
  }, [companyId, mediaId]);

  function handleExternalLoaded() {
    setLoading(false);
    setFailed(false);
  }

  function handleExternalError() {
    setLoading(false);
    setFailed(true);
  }

  const resolvedUrl = previewUrl || (!mediaId ? externalThumbnail : null);

  const Icon =
    item?.contentType === PUBLIC_CONTENT_TYPE.ARTICLE ? FileText : PlaySquare;

  return (
    <div
      className={cn(
        "relative",
        "h-[86px] w-[116px]",
        "shrink-0",
        "overflow-hidden",
        "rounded-xl",
        "border border-[var(--admin-border)]",
        "bg-[var(--admin-background)]",
        className,
      )}
    >
      {loading && (
        <div
          className="
            absolute
            inset-0
            z-10

            animate-pulse

            bg-[var(--admin-hover)]
          "
        />
      )}

      {resolvedUrl ? (
        // Runtime signed URL or external metadata thumbnail.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolvedUrl}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={mediaId ? () => setLoading(false) : handleExternalLoaded}
          onError={handleExternalError}
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
          {failed ? (
            <ImageIcon size={20} strokeWidth={1.4} className="text-red-300" />
          ) : (
            !loading && (
              <Icon
                size={21}
                strokeWidth={1.4}
                className="
                  text-[var(--admin-muted-light)]
                "
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
