"use client";

import {
  Edit3,
  Image as ImageIcon,
  LoaderCircle,
  Send,
  Trash2,
} from "lucide-react";

import { useEffect, useState } from "react";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { cn } from "@/utils/cn";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function displayName(item, fallback) {
  return item?.name?.en?.trim() || item?.name?.th?.trim() || fallback;
}

function formatDate(value, locale) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    dateStyle: "medium",

    timeStyle: "short",
  }).format(date);
}

/*
 * =========================================================
 * THUMBNAIL
 * =========================================================
 */

function SlideshowThumbnail({ companyId, mediaId, alt = "" }) {
  const [url, setUrl] = useState(null);

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
          setLoading(true);

          setFailed(false);

          setUrl(null);
        }

        const response = await fetch(
          `/api/v1/companies/${companyId}/media/${mediaId}/preview?variant=thumbnail`,
          {
            method: "GET",

            cache: "no-store",

            credentials: "include",
          },
        );

        let payload = null;

        try {
          payload = await response.json();
        } catch {
          payload = null;
        }

        if (!response.ok || payload?.success === false) {
          throw new Error("SLIDESHOW_THUMBNAIL_FAILED");
        }

        const previewUrl = payload?.data?.url || payload?.url || null;

        if (!previewUrl) {
          throw new Error("SLIDESHOW_THUMBNAIL_URL_MISSING");
        }

        if (!cancelled) {
          setUrl(previewUrl);
        }
      } catch (error) {
        console.error("Home slideshow thumbnail error:", error);

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
      className="
        relative

        aspect-[4/3]
        w-full

        overflow-hidden

        bg-[var(--admin-background)]
      "
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

      {url ? (
        // Runtime signed Admin preview.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="
            h-full
            w-full

            object-cover
          "
        />
      ) : (
        !loading && (
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
              size={18}
              strokeWidth={1.4}
              className={
                failed ? "text-red-300" : "text-[var(--admin-muted-light)]"
              }
            />
          </div>
        )
      )}
    </div>
  );
}

/*
 * =========================================================
 * CARD
 * =========================================================
 */

export default function SlideshowCard({
  companyId,

  item,

  busy = false,

  onEdit,

  onPublish,

  onDelete,
}) {
  const { t, locale } = useAdminTranslation();

  const published = item?.status === "published";

  const slides = Array.isArray(item?.slides)
    ? [...item.slides].sort(
        (first, second) => (first?.sortOrder ?? 0) - (second?.sortOrder ?? 0),
      )
    : [];

  const enabledSlides = slides.filter(
    (slide) => slide?.enabled !== false,
  ).length;

  const thumbnails = slides.filter((slide) => slide?.mediaId).slice(0, 4);

  const remaining = Math.max(0, slides.length - thumbnails.length);

  const name = displayName(item, t("homeSlideshow.card.untitled"));

  const secondaryName = locale === "th" ? item?.name?.en : item?.name?.th;

  return (
    <article
      className="
        overflow-hidden

        rounded-3xl

        border
        border-[var(--admin-border)]

        bg-[var(--admin-surface)]

        transition

        hover:border-[var(--company-primary-border)]

        hover:shadow-[0_14px_40px_rgba(0,0,0,0.04)]
      "
    >
      {/* =====================================
          THUMBNAILS
      ===================================== */}

      <div
        className="
          relative

          grid
          grid-cols-4

          gap-px

          bg-[var(--admin-border)]
        "
      >
        {thumbnails.length > 0 ? (
          thumbnails.map((slide, index) => (
            <div
              key={slide.id || `${slide.mediaId}-${index}`}
              className="
                  relative

                  bg-[var(--admin-surface)]
                "
            >
              <SlideshowThumbnail
                companyId={companyId}
                mediaId={slide.mediaId}
                alt={slide?.alt?.en || slide?.alt?.th || ""}
              />

              {index === thumbnails.length - 1 && remaining > 0 && (
                <div
                  className="
                        absolute
                        inset-0

                        flex
                        items-center
                        justify-center

                        bg-black/45

                        text-sm
                        font-semibold

                        text-white

                        backdrop-blur-[1px]
                      "
                >
                  +{remaining}
                </div>
              )}
            </div>
          ))
        ) : (
          <div
            className="
              col-span-4

              flex
              aspect-[16/4]

              items-center
              justify-center

              bg-[var(--admin-background)]
            "
          >
            <ImageIcon
              size={22}
              strokeWidth={1.4}
              className="
                text-[var(--admin-muted-light)]
              "
            />
          </div>
        )}

        {/* STATUS */}

        <div
          className="
            absolute
            right-3
            top-3
          "
        >
          <span
            className={cn(
              "inline-flex",

              "items-center",

              "rounded-full",

              "px-2.5 py-1",

              "admin-text-9 font-semibold uppercase tracking-[0.08em]",

              published
                ? "bg-emerald-50/95 text-emerald-700"
                : "bg-white/90 text-[var(--admin-muted)] shadow-sm backdrop-blur-sm",
            )}
          >
            {published ? t("status.published") : t("status.draft")}
          </span>
        </div>
      </div>

      {/* =====================================
          CONTENT
      ===================================== */}

      <div className="p-5 sm:p-6">
        <div
          className="
            flex
            items-start
            justify-between

            gap-4
          "
        >
          <div className="min-w-0">
            <h2
              className="
                truncate

                admin-text-16
                font-semibold
                tracking-[-0.02em]

                text-[var(--admin-foreground)]
              "
            >
              {name}
            </h2>

            {secondaryName && secondaryName !== name && (
              <div
                className="
                    mt-1
                    truncate

                    admin-text-11

                    text-[var(--admin-muted)]
                  "
              >
                {secondaryName}
              </div>
            )}
          </div>

          {published && (
            <span
              className="
                mt-1
                h-2
                w-2
                shrink-0

                rounded-full

                bg-[var(--company-primary)]
              "
              title={t("homeSlideshow.card.currentHomepage")}
            />
          )}
        </div>

        {/* =================================
            STATS
        ================================= */}

        <div
          className="
            mt-5

            grid
            grid-cols-2

            gap-3
          "
        >
          <div
            className="
              rounded-2xl

              bg-[var(--admin-background)]

              p-4
            "
          >
            <div
              className="
                admin-text-24
                font-semibold
                tracking-[-0.04em]

                text-[var(--admin-foreground)]
              "
            >
              {slides.length}
            </div>

            <div
              className="
                mt-1

                admin-text-11

                text-[var(--admin-muted)]
              "
            >
              {t("homeSlideshow.card.totalImages")}
            </div>
          </div>

          <div
            className="
              rounded-2xl

              bg-[var(--admin-background)]

              p-4
            "
          >
            <div
              className="
                admin-text-24
                font-semibold
                tracking-[-0.04em]

                text-[var(--admin-foreground)]
              "
            >
              {enabledSlides}
            </div>

            <div
              className="
                mt-1

                admin-text-11

                text-[var(--admin-muted)]
              "
            >
              {t("homeSlideshow.card.activeImages")}
            </div>
          </div>
        </div>

        {/* =================================
            UPDATED
        ================================= */}

        {item?.updatedAt && (
          <div
            className="
              mt-4

              admin-text-10

              text-[var(--admin-muted)]
            "
          >
            {t("homeSlideshow.card.updated", {
              date: formatDate(item.updatedAt, locale),
            })}
          </div>
        )}

        {/* =================================
            ACTIONS
        ================================= */}

        <div
          className="
            mt-5

            flex
            flex-wrap

            items-center

            gap-2

            border-t
            border-[var(--admin-border)]

            pt-4
          "
        >
          <button
            type="button"
            onClick={onEdit}
            disabled={busy}
            className="
              inline-flex
              h-9

              items-center
              justify-center
              gap-2

              rounded-xl

              border
              border-[var(--admin-border)]

              px-3

              admin-text-12
              font-medium

              text-[var(--admin-foreground)]

              transition

              hover:border-[var(--company-primary-border)]

              hover:bg-[var(--company-primary-soft)]

              hover:text-[var(--company-primary)]

              disabled:opacity-50
            "
          >
            <Edit3 size={14} />

            {t("common.edit")}
          </button>

          {!published && (
            <button
              type="button"
              onClick={onPublish}
              disabled={busy}
              className="
                inline-flex
                h-9

                items-center
                justify-center
                gap-2

                rounded-xl

                bg-[var(--company-primary)]

                px-3

                admin-text-12
                font-medium

                text-[var(--company-primary-foreground)]

                transition

                hover:bg-[var(--company-primary-hover)]

                disabled:opacity-50
              "
            >
              {busy ? (
                <LoaderCircle size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}

              {t("common.publish")}
            </button>
          )}

          {!published && (
            <button
              type="button"
              onClick={onDelete}
              disabled={busy}
              className="
                ml-auto

                inline-flex
                h-9

                items-center
                justify-center
                gap-2

                rounded-xl

                px-3

                admin-text-12
                font-medium

                text-red-600

                transition

                hover:bg-red-50

                disabled:opacity-50
              "
            >
              <Trash2 size={14} />

              {t("common.delete")}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
