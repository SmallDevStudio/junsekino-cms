"use client";

import { Image as ImageIcon, Newspaper } from "lucide-react";

import { useEffect, useState } from "react";

import { cn } from "@/utils/cn";

export default function NewsCoverThumbnail({
  companyId,
  mediaId,
  alt = "",
  className,
}) {
  const [previewUrl, setPreviewUrl] = useState(null);

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
          setPreviewUrl(null);
          setLoading(true);
          setFailed(false);
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
          throw new Error("NEWS_COVER_PREVIEW_FAILED");
        }

        const url = payload?.data?.url || payload?.url || null;

        if (!url) {
          throw new Error("NEWS_COVER_URL_MISSING");
        }

        if (!cancelled) {
          setPreviewUrl(url);
        }
      } catch (error) {
        console.error("News cover preview error:", error);

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

      {previewUrl ? (
        // Runtime signed Admin preview URL.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setFailed(true);
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
        <div
          className="
            flex
            h-full
            w-full

            items-center
            justify-center
          "
        >
          {!loading &&
            (failed ? (
              <ImageIcon size={20} strokeWidth={1.4} className="text-red-300" />
            ) : (
              <Newspaper
                size={20}
                strokeWidth={1.4}
                className="
                  text-[var(--admin-muted-light)]
                "
              />
            ))}
        </div>
      )}
    </div>
  );
}
