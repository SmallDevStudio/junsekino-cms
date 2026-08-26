"use client";

import {
  Check,
  Image as ImageIcon,
  LoaderCircle,
  Search,
  X,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import { cn } from "@/utils/cn";

function normalizeMedia(payload) {
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
}

function getMediaName(media) {
  return (
    media?.originalFileName || media?.fileName || media?.id || "Untitled image"
  );
}

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

function MediaThumbnail({ companyId, media }) {
  const [url, setUrl] = useState(null);

  const [loading, setLoading] = useState(false);

  const mediaId = media?.id;

  useEffect(() => {
    if (!companyId || !mediaId) {
      return;
    }

    let cancelled = false;

    const timeoutId = window.setTimeout(async () => {
      try {
        if (!cancelled) {
          setLoading(true);
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
          throw new Error(payload?.message || "Preview unavailable.");
        }

        const previewUrl = payload?.data?.url || payload?.url || null;

        if (!previewUrl) {
          throw new Error("Preview URL missing.");
        }

        if (!cancelled) {
          setUrl(previewUrl);
        }
      } catch (error) {
        console.error("Media picker preview error:", error);
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

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <LoaderCircle
          size={18}
          className="animate-spin text-[var(--admin-muted)]"
        />
      </div>
    );
  }

  if (!url) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <ImageIcon
          size={22}
          strokeWidth={1.5}
          className="text-[var(--admin-muted-light)]"
        />
      </div>
    );
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={media?.alt?.en || ""}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
      />
    </>
  );
}

export default function MediaPicker({
  open,
  companyId,
  selectedIds = [],
  multiple = true,
  title = "Select media",
  onClose,
  onConfirm,
}) {
  const [items, setItems] = useState([]);

  const [selection, setSelection] = useState([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSelection(Array.isArray(selectedIds) ? selectedIds : []);

      setSearch("");
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [open, selectedIds]);

  useEffect(() => {
    if (!open || !companyId) {
      return;
    }

    let cancelled = false;

    const timeoutId = window.setTimeout(async () => {
      try {
        if (!cancelled) {
          setLoading(true);
          setError(null);
        }

        const response = await fetch(`/api/v1/companies/${companyId}/media`, {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });

        const payload = await response.json();

        if (!response.ok || payload?.success === false) {
          throw new Error(payload?.message || "Unable to load media.");
        }

        const media = normalizeMedia(payload).filter(
          (item) =>
            item?.status === "ready" &&
            item?.type === "image" &&
            !item?.deletedAt,
        );

        if (!cancelled) {
          setItems(media);
        }
      } catch (loadError) {
        console.error("Media picker error:", loadError);

        if (!cancelled) {
          setError(loadError?.message || "Unable to load media.");
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
  }, [open, companyId]);

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return items;
    }

    return items.filter((media) => {
      const searchable = [
        media?.originalFileName,
        media?.fileName,
        media?.alt?.th,
        media?.alt?.en,
        media?.caption?.th,
        media?.caption?.en,
        media?.format,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(keyword);
    });
  }, [items, search]);

  function toggleMedia(mediaId) {
    if (!multiple) {
      setSelection([mediaId]);
      return;
    }

    setSelection((current) => {
      if (current.includes(mediaId)) {
        return current.filter((id) => id !== mediaId);
      }

      return [...current, mediaId];
    });
  }

  function handleConfirm() {
    const selectedMedia = selection
      .map((id) => items.find((item) => item.id === id))
      .filter(Boolean);

    onConfirm?.(multiple ? selectedMedia : selectedMedia[0] || null);

    onClose?.();
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close media picker"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-10",
          "flex max-h-[88vh] w-full max-w-5xl flex-col",
          "overflow-hidden rounded-3xl",
          "border border-[var(--admin-border)]",
          "bg-[var(--admin-surface)]",
          "shadow-[0_30px_100px_rgba(0,0,0,0.25)]",
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--admin-border)] px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-[var(--admin-foreground)]">
              {title}
            </h2>

            <p className="mt-1 text-xs text-[var(--admin-muted)]">
              {multiple ? "Select one or more images." : "Select an image."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--admin-muted)] transition hover:bg-[var(--admin-hover)] hover:text-[var(--admin-foreground)]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="shrink-0 border-b border-[var(--admin-border)] p-4 sm:px-6">
          <div className="relative max-w-md">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-muted)]"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search images..."
              className={cn(
                "h-10 w-full rounded-xl",
                "border border-[var(--admin-border)]",
                "bg-[var(--admin-background)]",
                "pl-10 pr-4",
                "text-sm text-[var(--admin-foreground)]",
                "outline-none transition",
                "placeholder:text-[var(--admin-muted-light)]",
                "focus:border-[var(--company-primary)]",
                "focus:ring-2 focus:ring-[var(--company-primary-soft)]",
              )}
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <LoaderCircle
                size={22}
                className="animate-spin text-[var(--company-primary)]"
              />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--admin-background)] text-[var(--admin-muted)]">
                <ImageIcon size={21} />
              </div>

              <div className="mt-4 text-sm font-medium text-[var(--admin-foreground)]">
                No images found
              </div>

              <p className="mt-1 text-xs text-[var(--admin-muted)]">
                Upload images in Media first.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredItems.map((media) => {
                const selected = selection.includes(media.id);

                return (
                  <button
                    key={media.id}
                    type="button"
                    onClick={() => toggleMedia(media.id)}
                    className={cn(
                      "group overflow-hidden rounded-2xl border text-left transition",
                      selected
                        ? "border-[var(--company-primary)] ring-2 ring-[var(--company-primary-soft)]"
                        : "border-[var(--admin-border)] hover:border-[var(--admin-muted-light)]",
                    )}
                  >
                    <div className="relative aspect-square overflow-hidden bg-[var(--admin-background)]">
                      <MediaThumbnail companyId={companyId} media={media} />

                      <span
                        className={cn(
                          "absolute right-2 top-2",
                          "flex h-6 w-6 items-center justify-center",
                          "rounded-full border",
                          selected
                            ? "border-[var(--company-primary)] bg-[var(--company-primary)] text-[var(--company-primary-foreground)]"
                            : "border-white/80 bg-black/30 text-transparent backdrop-blur",
                        )}
                      >
                        <Check size={13} strokeWidth={3} />
                      </span>
                    </div>

                    <div className="p-3">
                      <div className="truncate text-xs font-medium text-[var(--admin-foreground)]">
                        {getMediaName(media)}
                      </div>

                      <div className="mt-1 text-[10px] text-[var(--admin-muted)]">
                        {media.width && media.height
                          ? `${media.width} × ${media.height}`
                          : "Image"}

                        {formatBytes(media.size)
                          ? ` • ${formatBytes(media.size)}`
                          : ""}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-[var(--admin-border)] px-5 py-4 sm:px-6">
          <div className="text-xs text-[var(--admin-muted)]">
            {selection.length} selected
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-xl px-4 text-sm font-medium text-[var(--admin-muted)] transition hover:bg-[var(--admin-hover)] hover:text-[var(--admin-foreground)]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={selection.length === 0}
              className={cn(
                "h-10 rounded-xl px-5",
                "bg-[var(--company-primary)]",
                "text-sm font-medium",
                "text-[var(--company-primary-foreground)]",
                "transition",
                "disabled:cursor-not-allowed disabled:opacity-40",
              )}
            >
              {multiple
                ? `Add ${selection.length} ${
                    selection.length === 1 ? "image" : "images"
                  }`
                : "Select image"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
