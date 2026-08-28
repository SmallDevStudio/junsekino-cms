import { notFound, permanentRedirect } from "next/navigation";

import Image from "next/image";
import Link from "next/link";

import { ExternalLink } from "lucide-react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import PublicContentEngagement from "@/components/public/content/PublicContentEngagement";

import { getPublicCompany } from "@/modules/public/public-company.service";

import { getPublicContentPageBySlug } from "@/modules/public/public-content-page.service";

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function localized(value, locale = "en") {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return (
    value?.[locale]?.trim() || value?.en?.trim() || value?.th?.trim() || ""
  );
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
    localized(item.title) || item.source?.metadata?.title || "Untitled";

  const excerpt = localized(item.excerpt);

  const externalDescription = String(
    item.source?.metadata?.description || "",
  ).trim();

  const description = excerpt || externalDescription;

  const content = localized(item.content);

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
      <div
        className="
          mx-auto
          w-full
          max-w-[1200px]
        "
      >
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
          /*
           * Video intentionally smaller
           * than full page content.
           *
           * overflow-hidden + scrolling=no
           * prevents visual scrollbars
           * around the iframe.
           */
          <div
            className="
              mx-auto

              mt-8

              w-full
              max-w-[900px]

              overflow-hidden

              sm:mt-10
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

              mt-8

              w-full
              max-w-[1000px]

              sm:mt-10
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

            mt-7

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

          {/* ===================================
              PROVIDER / SOURCE
          =================================== */}

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

          {/* ===================================
              METRICS
          =================================== */}

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

          {/* ===================================
              DESCRIPTION
          =================================== */}

          {description && (
            <p
              className="
                mt-5

                whitespace-pre-line

                text-[12px]
                leading-[1.7]

                text-black/60

                sm:text-[13px]
              "
            >
              {description}
            </p>
          )}

          {/* ===================================
              CONTENT
          =================================== */}

          {content && (
            <div
              className="
                mt-8

                text-[12px]
                leading-[1.75]

                text-black/70

                sm:text-[13px]

                [&_a]:text-[var(--public-primary)]
                [&_a]:underline
                [&_a]:underline-offset-2

                [&_blockquote]:my-6
                [&_blockquote]:border-l
                [&_blockquote]:border-black/15
                [&_blockquote]:pl-4

                [&_h2]:mb-3
                [&_h2]:mt-8
                [&_h2]:text-[15px]
                [&_h2]:font-semibold

                [&_h3]:mb-3
                [&_h3]:mt-7
                [&_h3]:text-[14px]
                [&_h3]:font-semibold

                [&_li]:mb-1

                [&_ol]:my-5
                [&_ol]:list-decimal
                [&_ol]:pl-5

                [&_p]:mb-5

                [&_strong]:font-semibold

                [&_ul]:my-5
                [&_ul]:list-disc
                [&_ul]:pl-5
              "
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
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
