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
import { cn } from "@/utils/cn";

function normalizeLocalized(value) {
  return {
    th: value?.th || "",
    en: value?.en || "",
  };
}

function mediaToProjectImage(media) {
  if (!media?.id) {
    return null;
  }

  return {
    mediaId: media.id,

    alt: normalizeLocalized(media.alt),

    caption: normalizeLocalized(media.caption),
  };
}

function ProjectImagePreview({
  companyId,
  image,
  variant = "thumbnail",
  className,
}) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const mediaId = image?.mediaId;

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
          throw new Error(payload?.message || "Preview unavailable.");
        }

        const url = payload?.data?.url || payload?.url || null;

        if (!url) {
          throw new Error("Preview URL missing.");
        }

        if (!cancelled) {
          setPreviewUrl(url);
        }
      } catch (previewError) {
        console.error("Project media preview error:", previewError);

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
  }, [companyId, mediaId, variant]);

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-[var(--admin-background)]",
        className,
      )}
    >
      {previewUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={image?.alt?.en || image?.alt?.th || ""}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          {loading ? (
            <LoaderCircle
              size={20}
              className="animate-spin text-[var(--admin-muted)]"
            />
          ) : (
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

function EmptyMedia({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-background)] p-6 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--admin-surface)] text-[var(--admin-muted)]">
        <Icon size={20} strokeWidth={1.6} />
      </div>

      <div className="mt-4 text-sm font-medium text-[var(--admin-foreground)]">
        {title}
      </div>

      <p className="mt-1 max-w-xs text-xs leading-5 text-[var(--admin-muted)]">
        {description}
      </p>

      <button
        type="button"
        onClick={onAction}
        className={cn(
          "mt-4 inline-flex h-9 items-center justify-center gap-2",
          "rounded-xl",
          "border border-[var(--admin-border)]",
          "bg-[var(--admin-surface)] px-3",
          "text-xs font-medium text-[var(--admin-foreground)]",
          "transition hover:bg-[var(--admin-hover)]",
        )}
      >
        <Plus size={14} />

        {actionLabel}
      </button>
    </div>
  );
}

export default function ProjectMediaSection({
  companyId,
  featuredImage,
  gallery = [],
  onFeaturedImageChange,
  onGalleryChange,
}) {
  const [featuredPickerOpen, setFeaturedPickerOpen] = useState(false);
  const [galleryPickerOpen, setGalleryPickerOpen] = useState(false);

  const galleryIds = gallery.map((image) => image?.mediaId).filter(Boolean);

  function handleFeaturedSelected(media) {
    onFeaturedImageChange?.(media ? mediaToProjectImage(media) : null);
  }

  function handleGallerySelected(mediaItems) {
    const selected = Array.isArray(mediaItems) ? mediaItems : [];

    if (selected.length === 0) {
      return;
    }

    const existingIds = new Set(galleryIds);

    const newImages = selected
      .filter((media) => media?.id && !existingIds.has(media.id))
      .map(mediaToProjectImage)
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

  return (
    <>
      <section className="mt-10">
        <div>
          <h3 className="text-sm font-semibold text-[var(--admin-foreground)]">
            Project Media
          </h3>

          <p className="mt-1 text-xs leading-5 text-[var(--admin-muted)]">
            Select the cover image and gallery images from the company media
            library.
          </p>
        </div>

        {/* Featured Image */}

        <div className="mt-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-medium text-[var(--admin-foreground)]">
                Cover Image
              </div>

              <div className="mt-1 text-[11px] text-[var(--admin-muted)]">
                Used as the primary image for project listings and previews.
              </div>
            </div>

            {featuredImage && (
              <button
                type="button"
                onClick={() => setFeaturedPickerOpen(true)}
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-[var(--admin-border)] px-3 text-xs font-medium text-[var(--admin-foreground)] transition hover:bg-[var(--admin-hover)]"
              >
                <RefreshCw size={13} />
                Change
              </button>
            )}
          </div>

          <div className="mt-3">
            {featuredImage ? (
              <div className="overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
                <ProjectImagePreview
                  companyId={companyId}
                  image={featuredImage}
                  variant="large"
                  className="aspect-[16/9] w-full"
                />

                <div className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-[var(--admin-foreground)]">
                      Project cover
                    </div>

                    <div className="mt-1 truncate text-[10px] text-[var(--admin-muted)]">
                      Media ID: {featuredImage.mediaId}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onFeaturedImageChange?.(null)}
                    aria-label="Remove cover image"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-red-500 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ) : (
              <EmptyMedia
                icon={ImageIcon}
                title="No cover image"
                description="Select an image from Media Library to represent this project."
                actionLabel="Select cover image"
                onAction={() => setFeaturedPickerOpen(true)}
              />
            )}
          </div>
        </div>

        {/* Gallery */}

        <div className="mt-8 border-t border-[var(--admin-border)] pt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-medium text-[var(--admin-foreground)]">
                Project Gallery
              </div>

              <div className="mt-1 text-[11px] text-[var(--admin-muted)]">
                Images are displayed in the order shown below.
              </div>
            </div>

            {gallery.length > 0 && (
              <button
                type="button"
                onClick={() => setGalleryPickerOpen(true)}
                className={cn(
                  "inline-flex h-9 items-center justify-center gap-2",
                  "self-start rounded-xl",
                  "border border-[var(--admin-border)]",
                  "bg-[var(--admin-surface)] px-3",
                  "text-xs font-medium text-[var(--admin-foreground)]",
                  "transition hover:bg-[var(--admin-hover)]",
                  "sm:self-auto",
                )}
              >
                <Plus size={14} />
                Add Images
              </button>
            )}
          </div>

          <div className="mt-3">
            {gallery.length === 0 ? (
              <EmptyMedia
                icon={Images}
                title="No gallery images"
                description="Add one or more images from Media Library to build the project gallery."
                actionLabel="Add gallery images"
                onAction={() => setGalleryPickerOpen(true)}
              />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {gallery.map((image, index) => (
                  <article
                    key={image.mediaId}
                    className="group overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)]"
                  >
                    <div className="relative">
                      <ProjectImagePreview
                        companyId={companyId}
                        image={image}
                        variant="thumbnail"
                        className="aspect-square w-full"
                      />

                      <div className="absolute left-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-black/60 px-2 text-[10px] font-semibold text-white backdrop-blur">
                        {index + 1}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-1 p-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveGalleryImage(index, -1)}
                          disabled={index === 0}
                          aria-label="Move image left"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--admin-muted)] transition hover:bg-[var(--admin-hover)] hover:text-[var(--admin-foreground)] disabled:cursor-not-allowed disabled:opacity-25"
                        >
                          <ArrowLeft size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => moveGalleryImage(index, 1)}
                          disabled={index === gallery.length - 1}
                          aria-label="Move image right"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--admin-muted)] transition hover:bg-[var(--admin-hover)] hover:text-[var(--admin-foreground)] disabled:cursor-not-allowed disabled:opacity-25"
                        >
                          <ArrowRight size={14} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeGalleryImage(image.mediaId)}
                        aria-label="Remove image"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 hover:text-red-600"
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

      <MediaPicker
        open={featuredPickerOpen}
        companyId={companyId}
        selectedIds={featuredImage?.mediaId ? [featuredImage.mediaId] : []}
        multiple={false}
        title="Select project cover"
        onClose={() => setFeaturedPickerOpen(false)}
        onConfirm={handleFeaturedSelected}
      />

      <MediaPicker
        open={galleryPickerOpen}
        companyId={companyId}
        selectedIds={galleryIds}
        multiple
        title="Select project gallery"
        onClose={() => setGalleryPickerOpen(false)}
        onConfirm={handleGallerySelected}
      />
    </>
  );
}
