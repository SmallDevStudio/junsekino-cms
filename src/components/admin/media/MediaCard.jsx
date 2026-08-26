"use client";

import { ExternalLink, FileImage, LoaderCircle } from "lucide-react";

import { useEffect, useState } from "react";

import { cn } from "@/utils/cn";

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
    throw new Error(payload?.message || "Preview unavailable.");
  }

  const url = payload?.data?.url || payload?.url || null;

  if (!url) {
    throw new Error("Preview URL missing.");
  }

  return url;
}

export default function MediaCard({ companyId, media, title }) {
  const [previewUrl, setPreviewUrl] = useState(null);

  const [loadingPreview, setLoadingPreview] = useState(false);

  const [previewError, setPreviewError] = useState(false);

  const mediaId = media?.id;
  const mediaStatus = media?.status;

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

  function handleOpenPreview() {
    if (!previewUrl) {
      return;
    }

    window.open(previewUrl, "_blank", "noopener,noreferrer");
  }

  const size = formatBytes(media?.size);

  return (
    <article
      className={cn(
        "group overflow-hidden",
        "rounded-2xl",
        "border border-[var(--admin-border)]",
        "bg-[var(--admin-surface)]",
        "transition",
        "hover:border-[var(--admin-muted-light)]",
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--admin-background)]">
        {previewUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={title || ""}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            />
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            {loadingPreview ? (
              <LoaderCircle
                size={20}
                className="animate-spin text-[var(--admin-muted)]"
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

        <div className="absolute left-3 top-3">
          <span
            className={cn(
              "inline-flex rounded-full",
              "border px-2 py-1",
              "text-[9px] font-semibold uppercase tracking-[0.08em]",
              mediaStatus === "ready"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700",
            )}
          >
            {mediaStatus || "unknown"}
          </span>
        </div>

        {previewUrl && (
          <button
            type="button"
            onClick={handleOpenPreview}
            aria-label="Open preview"
            className={cn(
              "absolute right-3 top-3",
              "flex h-8 w-8 items-center justify-center",
              "rounded-lg",
              "bg-black/60 text-white",
              "opacity-0 backdrop-blur",
              "transition",
              "group-hover:opacity-100",
            )}
          >
            <ExternalLink size={14} />
          </button>
        )}
      </div>

      <div className="p-4">
        <div
          title={title}
          className="truncate text-[13px] font-medium text-[var(--admin-foreground)]"
        >
          {title}
        </div>

        <div className="mt-2 flex items-center gap-2 text-[10px] text-[var(--admin-muted)]">
          {media?.mimeType && (
            <span className="truncate">{media.mimeType}</span>
          )}

          {size && (
            <>
              <span>•</span>
              <span>{size}</span>
            </>
          )}
        </div>

        {previewError && (
          <button
            type="button"
            onClick={handleRetryPreview}
            disabled={loadingPreview}
            className={cn(
              "mt-3 text-[11px] font-medium",
              "text-[var(--company-primary)]",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {loadingPreview ? "Loading..." : "Retry preview"}
          </button>
        )}
      </div>
    </article>
  );
}
