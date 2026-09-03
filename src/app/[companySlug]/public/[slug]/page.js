import { notFound, permanentRedirect } from "next/navigation";

import Image from "next/image";
import Link from "next/link";

import { ExternalLink } from "lucide-react";

import PublicContentEngagement from "@/components/public/content/PublicContentEngagement";

import PublicExpandableRichText from "@/components/public/content/PublicExpandableRichText";

import { getPublicCompany } from "@/modules/public/public-company.service";

import { getPublicContentPageBySlug } from "@/modules/public/public-content-page.service";

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function localizedText(
  value,

  locale = "en",
) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  const candidates = [value?.[locale], value?.en, value?.th];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return "";
}

function isTiptapDocument(value) {
  return value && typeof value === "object" && value.type === "doc";
}

function richTextHasContent(value) {
  if (typeof value === "string") {
    return Boolean(value.trim());
  }

  if (!isTiptapDocument(value)) {
    return false;
  }

  function nodeHasContent(node) {
    if (!node || typeof node !== "object") {
      return false;
    }

    if (
      node.type === "text" &&
      typeof node.text === "string" &&
      node.text.trim()
    ) {
      return true;
    }

    if (
      ["image", "horizontalRule", "youtube", "video", "embed"].includes(
        node.type,
      )
    ) {
      return true;
    }

    return Array.isArray(node.content) && node.content.some(nodeHasContent);
  }

  return Array.isArray(value.content) && value.content.some(nodeHasContent);
}

function localizedRichText(
  value,

  locale = "en",
) {
  if (!value) {
    return "";
  }

  /*
   * Compatibility with legacy records
   * that contain only one string.
   */
  if (typeof value === "string" || isTiptapDocument(value)) {
    return richTextHasContent(value) ? value : "";
  }

  const candidates = [value?.[locale], value?.en, value?.th];

  for (const candidate of candidates) {
    if (richTextHasContent(candidate)) {
      return candidate;
    }
  }

  return "";
}

function mediaUrl({ companySlug, mediaId }) {
  if (!companySlug || !mediaId) {
    return null;
  }

  return `/api/public/v1/companies/${encodeURIComponent(
    companySlug,
  )}/media/${encodeURIComponent(mediaId)}?variant=large`;
}

function youtubeEmbedUrl(item) {
  if (item.source?.provider !== "youtube" || !item.source?.externalId) {
    return null;
  }

  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
  });

  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(
    item.source.externalId,
  )}?${params.toString()}`;
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
    month: "long",
    year: "numeric",
  }).format(date);
}

export async function generateMetadata({ params }) {
  const resolved = await params;

  const companySlug = normalize(resolved.companySlug);

  const slug = normalize(resolved.slug);

  try {
    const company = await getPublicCompany(companySlug);

    if (company.redirect) {
      return {};
    }

    const item = await getPublicContentPageBySlug({
      companyId: company.company.id,

      slug,
    });

    return {
      title:
        item.title?.en ||
        item.title?.th ||
        item.source?.metadata?.title ||
        "Public",

      description:
        item.excerpt?.en ||
        item.excerpt?.th ||
        item.source?.metadata?.description ||
        "",
    };
  } catch {
    return {};
  }
}

export default async function PublicContentDetailPage({ params }) {
  const resolved = await params;

  const companySlug = normalize(resolved.companySlug);

  const slug = normalize(resolved.slug);

  if (!companySlug || !slug) {
    notFound();
  }

  let companyData;

  try {
    companyData = await getPublicCompany(companySlug);
  } catch (error) {
    if (error.message === "PUBLIC_COMPANY_NOT_FOUND") {
      notFound();
    }

    throw error;
  }

  if (companyData.redirect) {
    permanentRedirect(`/${companyData.redirectTo}/public/${slug}`);
  }

  let item;

  try {
    item = await getPublicContentPageBySlug({
      companyId: companyData.company.id,

      slug,
    });
  } catch (error) {
    if (error.message === "PUBLIC_CONTENT_NOT_FOUND") {
      notFound();
    }

    throw error;
  }

  const title =
    localizedText(item.title) || item.source?.metadata?.title || "Untitled";

  const content = localizedRichText(item.content);

  const provider =
    item.source?.provider ||
    (item.section === "video" ? "Video" : "Publication");

  const authorName = item.source?.metadata?.authorName || "";

  const sourceUrl = item.source?.sourceUrl || null;

  const publishedDate = formatDate(
    item.source?.metadata?.publishedAt || item.publishedAt,
  );

  const embedUrl = youtubeEmbedUrl(item);

  const localImage = item.featuredImage?.mediaId
    ? mediaUrl({
        companySlug,

        mediaId: item.featuredImage.mediaId,
      })
    : null;

  const externalImage =
    item.source?.provider === "youtube"
      ? item.source?.metadata?.thumbnailUrl || null
      : null;

  const imageUrl = localImage || externalImage;

  const categoryPath = item.section === "video" ? "video" : "publication";

  const categoryLabel = item.section === "video" ? "Video" : "Publication";

  return (
    <div
      className="
        w-full

        px-6
        pb-20

        sm:px-8
        lg:px-12
        xl:px-16
      "
    >
      <div className="mx-auto w-full max-w-[1200px]">
        {/* =====================================
            BREADCRUMB
        ===================================== */}

        <nav
          aria-label="Breadcrumb"
          className="
            flex
            flex-wrap
            items-center
            gap-2

            pt-3

            text-[10px]
            uppercase
            tracking-[0.06em]

            sm:text-[11px]
          "
        >
          <Link
            href={`/${companySlug}`}
            className="
              text-black/25

              transition-colors

              hover:text-black/55
            "
          >
            Home
          </Link>

          <span className="text-black/15">/</span>

          <Link
            href={`/${companySlug}/public`}
            className="
              text-black/25

              transition-colors

              hover:text-black/55
            "
          >
            Public
          </Link>

          <span className="text-black/15">/</span>

          <Link
            href={`/${companySlug}/public/${categoryPath}`}
            className="
              font-medium
              text-[var(--public-primary)]

              transition-opacity

              hover:opacity-60
            "
          >
            {categoryLabel}
          </Link>
        </nav>

        {/* =====================================
            MEDIA
        ===================================== */}

        {embedUrl ? (
          <div
            className="
              mx-auto

              mt-5

              w-full
              max-w-[min(900px,82vh)]

              overflow-hidden

              sm:mt-6
            "
          >
            <div
              className="
                relative
                aspect-video
                w-full
                overflow-hidden
                bg-black
              "
            >
              <iframe
                src={embedUrl}
                title={title}
                scrolling="no"
                className="
                  absolute
                  inset-0

                  block
                  h-full
                  w-full

                  overflow-hidden
                  border-0
                "
                allow="
                  accelerometer;
                  autoplay;
                  clipboard-write;
                  encrypted-media;
                  gyroscope;
                  picture-in-picture;
                  web-share
                "
                allowFullScreen
              />
            </div>
          </div>
        ) : imageUrl ? (
          <div
            className="
              mx-auto

              mt-5

              w-full
              max-w-[min(1000px,82vh)]

              sm:mt-6
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
              <Image
                src={imageUrl}
                alt={title}
                fill
                priority
                unoptimized
                draggable={false}
                sizes="
                  (max-width: 1023px) 100vw,
                  1000px
                "
                className="
                  select-none
                  object-cover
                "
              />
            </div>
          </div>
        ) : null}

        {/* =====================================
            DETAIL
        ===================================== */}

        <div
          className="
            mx-auto

            mt-5

            w-full
            max-w-[900px]

            sm:mt-8
          "
        >
          <h1
            className="
              text-[18px]
              font-semibold
              leading-[1.45]
              text-[var(--public-primary)]

              sm:text-[20px]
              lg:text-[22px]
            "
          >
            {title}
          </h1>

          {/* PROVIDER / SOURCE */}

          <div
            className="
              mt-2

              flex
              flex-wrap
              items-center

              gap-x-2
              gap-y-1

              text-[9px]
              tracking-[0.025em]
              text-black/35

              sm:text-[10px]
            "
          >
            <span className="uppercase">{provider}</span>

            {authorName && (
              <>
                <span className="text-black/15">/</span>

                <span>{authorName}</span>
              </>
            )}

            {publishedDate && (
              <>
                <span className="text-black/15">/</span>

                <span>{publishedDate}</span>
              </>
            )}

            {sourceUrl && (
              <>
                <span className="text-black/15">/</span>

                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    inline-flex
                    items-center
                    gap-1

                    transition-colors

                    hover:text-[var(--public-primary)]
                  "
                >
                  Original Source
                  <ExternalLink size={10} strokeWidth={1.2} />
                </a>
              </>
            )}
          </div>

          {/* METRICS */}

          <div className="mt-3">
            <PublicContentEngagement
              companySlug={companySlug}
              slug={item.slug}
              title={title}
              initialViews={item.engagement?.views || 0}
              initialLikes={item.engagement?.likes || 0}
              trackView
              interactiveLike
              showShare
            />
          </div>

          {/* RICH TEXT CONTENT */}

          {content && (
            <div className="mt-5">
              <PublicExpandableRichText
                value={content}
                lines={5}
                className="
                  !text-[12px]
                  !leading-[1.75]

                  !text-black/70

                  sm:!text-[13px]

                  [&_h2:first-child]:mt-0
                  [&_h3:first-child]:mt-0
                  [&_p:first-child]:mt-0
                "
              />
            </div>
          )}

          {/* TAGS */}

          {Array.isArray(item.tags) && item.tags.length > 0 && (
            <div
              className="
                mt-8

                flex
                flex-wrap

                gap-x-3
                gap-y-2

                border-t
                border-black/[0.06]

                pt-5
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
      </div>
    </div>
  );
}
