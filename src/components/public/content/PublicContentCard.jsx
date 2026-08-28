import Image from "next/image";
import Link from "next/link";

import { Play } from "lucide-react";

import PublicContentEngagement from "./PublicContentEngagement";

function localized(value, locale) {
  return (
    value?.[locale]?.trim() || value?.en?.trim() || value?.th?.trim() || ""
  );
}

function mediaUrl({ companySlug, mediaId }) {
  return `/api/public/v1/companies/${encodeURIComponent(
    companySlug,
  )}/media/${encodeURIComponent(mediaId)}?variant=medium`;
}

export default function PublicContentCard({
  companySlug,
  item,
  locale = "en",
}) {
  const title =
    localized(item.title, locale) || item.source?.metadata?.title || "Untitled";

  const excerpt =
    localized(item.excerpt, locale) || item.source?.metadata?.description || "";

  const localImage = item.featuredImage?.mediaId
    ? mediaUrl({
        companySlug,

        mediaId: item.featuredImage.mediaId,
      })
    : null;

  const externalImage =
    item.source?.provider === "youtube"
      ? item.source?.metadata?.thumbnailUrl
      : null;

  const imageUrl = localImage || externalImage;

  const isVideo = item.section === "video";

  const href = `/${companySlug}/public/${item.slug}`;

  return (
    <article
      className="
        grid
        grid-cols-1

        gap-5

        lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]
        lg:items-start
        lg:gap-[clamp(3rem,6vw,7rem)]
      "
    >
      {/* =====================================
          THUMBNAIL
      ===================================== */}

      <Link
        href={href}
        className="
          group
          block
        "
      >
        <div
          className="
            relative

            aspect-video
            w-full

            overflow-hidden

            bg-[var(--public-surface)]
          "
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              unoptimized
              draggable={false}
              sizes="
                (max-width: 1023px) 100vw,
                44vw
              "
              className="
                select-none
                object-cover

                transition-transform
                duration-500
                ease-out

                group-hover:scale-[1.015]
              "
            />
          ) : (
            <div
              className="
                flex
                h-full
                items-center
                justify-center

                text-[9px]
                uppercase
                tracking-[0.08em]

                text-black/20
              "
            >
              No Image
            </div>
          )}

          {isVideo && (
            <div
              className="
                absolute
                bottom-3
                right-3

                flex
                h-9
                w-9

                items-center
                justify-center

                rounded-full

                border
                border-white/70

                bg-black/20

                text-white/90

                backdrop-blur-[2px]

                transition-all
                duration-300

                group-hover:scale-105
                group-hover:bg-black/35
              "
            >
              <Play size={14} strokeWidth={1.2} fill="currentColor" />
            </div>
          )}
        </div>
      </Link>

      {/* =====================================
          INFORMATION
      ===================================== */}

      <div
        className="
          flex
          min-w-0
          flex-col

          items-stretch
          justify-start
        "
      >
        <div
          className="
            min-w-0
          "
        >
          <Link
            href={href}
            className="
              text-[14px]
              font-medium
              leading-[1.45]

              text-[var(--public-primary)]

              transition-opacity

              hover:opacity-65

              sm:text-[15px]
            "
          >
            {title}
          </Link>

          <p
            className="
              mt-2

              text-[9px]
              uppercase
              tracking-[0.06em]

              text-black/35

              sm:text-[10px]
            "
          >
            {item.source?.provider || (isVideo ? "Video" : "Publication")}
          </p>
        </div>

        {/* WEBSITE METRICS */}

        <div className="mt-3">
          <PublicContentEngagement
            companySlug={companySlug}
            slug={item.slug}
            title={title}
            initialViews={item.engagement?.views || 0}
            initialLikes={item.engagement?.likes || 0}
            trackView={false}
            interactiveLike={false}
            showShare
          />
        </div>

        {excerpt && (
          <p
            className="
              mt-4

              line-clamp-6

              max-w-[680px]

              whitespace-pre-line

              text-[11px]
              leading-[1.6]

              text-black/55

              sm:text-[12px]
            "
          >
            {excerpt}
          </p>
        )}

        {Array.isArray(item.tags) && item.tags.length > 0 && (
          <div
            className="
                mt-5

                flex
                flex-wrap

                gap-x-3
                gap-y-1
              "
          >
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="
                      text-[9px]
                      tracking-[0.03em]

                      text-black/25
                    "
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
