import Image from "next/image";

import Link from "next/link";

function getLocalizedValue(
  value,

  locale = "en",
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

function createMediaUrl({
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

export default function PublicProjectCard({
  companySlug,

  project,

  locale = "en",
}) {
  const title =
    getLocalizedValue(
      project?.title,

      locale,
    ) ||
    project?.slug ||
    "Untitled Project";

  const location = getLocalizedValue(
    project?.projectInfo?.location,

    locale,
  );

  const mediaId = project?.featuredImage?.mediaId || null;

  const imageUrl = createMediaUrl({
    companySlug,

    mediaId,
  });

  const href = `/${companySlug}/project/${project.slug}`;

  const linkLabel = location ? `${title}, ${location}` : title;

  return (
    <article className="w-full">
      <Link
        href={href}
        aria-label={linkLabel}
        className="
          group
          block
          w-full
          outline-none
        "
      >
        <div
          className="
            relative
            aspect-square
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
                (max-width: 639px) 88vw,
                (max-width: 1023px) 44vw,
                30vw
              "
              className="
                select-none
                object-cover
                grayscale
                transition-[transform,filter]
                duration-500
                ease-out
                group-hover:scale-[1.055]
                group-hover:grayscale-0
                group-focus-visible:scale-[1.055]
                group-focus-visible:grayscale-0
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
                text-[9px]
                uppercase
                tracking-[0.08em]
                text-[var(--public-muted-foreground)]
              "
            >
              No Image
            </div>
          )}

          <div
            className="
              pointer-events-none
              absolute
              inset-0
              flex
              items-end
              bg-gradient-to-t
              from-black/70
              via-black/10
              to-transparent
              p-4
              opacity-0
              transition-opacity
              duration-300
              ease-out
              group-hover:opacity-100
              group-focus-visible:opacity-100
              sm:p-5
            "
          >
            <div
              className="
                w-full
                translate-y-2
                text-left
                text-white
                opacity-0
                transition-all
                delay-75
                duration-300
                ease-out
                group-hover:translate-y-0
                group-hover:opacity-100
                group-focus-visible:translate-y-0
                group-focus-visible:opacity-100
              "
            >
              <h3
                className="
                  text-[14px]
                  font-medium
                  leading-[1.35]
                  tracking-[0.01em]
                  sm:text-[15px]
                  lg:text-[16px]
                "
              >
                {title}
              </h3>

              {location && (
                <p
                  className="
                    mt-1
                    text-[10px]
                    font-normal
                    leading-[1.45]
                    tracking-[0.02em]
                    text-white/80
                    sm:text-[11px]
                  "
                >
                  {location}
                </p>
              )}
            </div>
          </div>

          <span
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              inset-0
              border-2
              border-transparent
              transition-colors
              group-focus-visible:border-[var(--public-primary)]
            "
          />
        </div>
      </Link>
    </article>
  );
}
