import Image from "next/image";

import Link from "next/link";

import { Play } from "lucide-react";

import PublicContentEngagement from "./PublicContentEngagement";

import PublicExpandableDescription from "./PublicExpandableDescription";

function localized(
  value,

  locale,
) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  return (
    value?.[locale]?.trim() || value?.en?.trim() || value?.th?.trim() || ""
  );
}

function mediaUrl({
  companySlug,

  mediaId,
}) {
  if (!companySlug || !mediaId) {
    return null;
  }

  return `/api/public/v1/companies/${encodeURIComponent(
    companySlug,
  )}/media/${encodeURIComponent(mediaId)}?variant=medium`;
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",

    month: "short",

    year: "numeric",
  }).format(date);
}

function getProvider(item) {
  if (item.source?.provider) {
    return String(item.source.provider).toLowerCase();
  }

  if (item.contentType === "article") {
    return "article";
  }

  return item.section === "video" ? "video" : "publication";
}

function getProviderLabel(provider) {
  const labels = {
    youtube: "YouTube",

    facebook: "Facebook",

    instagram: "Instagram",

    tiktok: "TikTok",

    vimeo: "Vimeo",

    article: "Article",

    publication: "Publication",

    video: "Video",

    embed: "Embed",

    other: "External",
  };

  return labels[provider] || provider;
}

function getProviderBadgeClass(provider) {
  const neutralClass = `
    border-[var(--public-border)]
    bg-[var(--public-surface)]
    text-[var(--public-muted-foreground)]
  `;

  const styles = {
    youtube: "border-[#ff0000]/20 bg-[#ff0000]/[0.07] text-[#d60000]",

    facebook: "border-[#1877f2]/20 bg-[#1877f2]/[0.07] text-[#1877f2]",

    instagram: "border-[#c13584]/20 bg-[#c13584]/[0.07] text-[#b52c79]",

    tiktok: neutralClass,

    vimeo: "border-[#1ab7ea]/25 bg-[#1ab7ea]/[0.08] text-[#129ac8]",

    article: neutralClass,

    publication: neutralClass,

    video: neutralClass,

    embed: neutralClass,

    other: neutralClass,
  };

  return styles[provider] || styles.other;
}

export default function PublicContentCard({
  companySlug,

  item,

  locale = "en",
}) {
  const title =
    localized(
      item.title,

      locale,
    ) ||
    item.source?.metadata?.title ||
    "Untitled";

  const excerpt =
    localized(
      item.excerpt,

      locale,
    ) ||
    item.source?.metadata?.description ||
    "";

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

  const provider = getProvider(item);

  const providerLabel = getProviderLabel(provider);

  const createdDate = formatDate(item.createdAt || item.publishedAt);

  return (
    <article
      className="
        grid
        grid-cols-1
        gap-5
        text-[var(--public-foreground)]
        md:grid-cols-[minmax(280px,420px)_minmax(0,1fr)]
        md:items-start
        md:gap-10
        lg:grid-cols-[minmax(320px,440px)_minmax(0,1fr)]
        lg:gap-[clamp(3rem,5vw,5.5rem)]
      "
    >
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
                (max-width: 767px) 100vw,
                (max-width: 1199px) 420px,
                440px
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
                text-[var(--public-muted-foreground)]
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
                h-8
                w-8
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
              <Play size={13} strokeWidth={1.2} fill="currentColor" />
            </div>
          )}
        </div>
      </Link>

      <div
        className="
          flex
          min-w-0
          flex-col
          items-start
          justify-start
        "
      >
        <Link
          href={href}
          className="
            max-w-[720px]
            text-[16px]
            font-semibold
            leading-[1.4]
            text-[var(--public-primary)]
            transition-opacity
            duration-200
            hover:opacity-65
            sm:text-[17px]
            lg:text-[18px]
          "
        >
          {title}
        </Link>

        <div
          className="
            mt-3
            flex
            flex-wrap
            items-center
            gap-2
          "
        >
          <span
            className={`
              inline-flex
              items-center
              rounded-full
              border
              px-2.5
              py-1
              text-[8px]
              font-medium
              uppercase
              tracking-[0.07em]
              ${getProviderBadgeClass(provider)}
            `}
          >
            {providerLabel}
          </span>

          {createdDate && (
            <span
              className="
                text-[9px]
                tracking-[0.025em]
                text-[var(--public-muted-foreground)]
              "
            >
              {createdDate}
            </span>
          )}
        </div>

        <div className="mt-3">
          <PublicContentEngagement
            companySlug={companySlug}
            slug={item.slug}
            title={title}
            initialViews={item.engagement?.views || 0}
            initialLikes={item.engagement?.likes || 0}
            trackView={false}
            interactiveLike
            showShare
          />
        </div>

        {excerpt && (
          <PublicExpandableDescription
            lines={5}
            className="
              mt-4
              max-w-[680px]
              text-[11px]
              leading-[1.65]
              text-[var(--public-muted-foreground)]
              sm:text-[12px]
            "
          >
            {excerpt}
          </PublicExpandableDescription>
        )}

        {Array.isArray(item.tags) && item.tags.length > 0 && (
          <div
            className="
                mt-4
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
                      text-[var(--public-muted-foreground)]
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
