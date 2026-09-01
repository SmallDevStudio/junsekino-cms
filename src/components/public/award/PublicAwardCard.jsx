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
    return value;
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

function InfoRow({
  label,

  value,

  highlight = false,
}) {
  if (!value) {
    return null;
  }

  return (
    <div
      className="
        grid
        grid-cols-[78px_minmax(0,1fr)]
        gap-x-5
        text-[11px]
        leading-[1.45]
        sm:grid-cols-[88px_minmax(0,1fr)]
        sm:text-[12px]
        lg:grid-cols-[92px_minmax(0,1fr)]
      "
    >
      <dt
        className="
          text-[var(--public-muted-foreground)]
        "
      >
        {label}
      </dt>

      <dd
        className={`
          min-w-0

          ${
            highlight
              ? "font-semibold text-[var(--public-primary)]"
              : "font-normal text-[var(--public-foreground)]"
          }
        `}
      >
        {value}
      </dd>
    </div>
  );
}

export default function PublicAwardCard({
  companySlug,

  award,

  locale = "en",
}) {
  const awardName =
    getLocalizedValue(
      award.awardName,

      locale,
    ) || "Award";

  const projectName =
    getLocalizedValue(
      award.project?.title,

      locale,
    ) ||
    award.project?.slug ||
    "";

  const categoryName = getLocalizedValue(
    award.category?.name,

    locale,
  );

  const imageAlt =
    getLocalizedValue(
      award.thumbnail?.alt,

      locale,
    ) ||
    projectName ||
    awardName;

  const imageUrl = createMediaUrl({
    companySlug,

    mediaId: award.thumbnail?.mediaId,
  });

  const href = `/${companySlug}/project/${award.project.slug}`;

  return (
    <article>
      <Link
        href={href}
        className="
          group
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
              alt={imageAlt}
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
        </div>

        <div
          className="
            flex
            min-w-0
            flex-col
            items-start
            justify-start
            pt-0
          "
        >
          <dl className="space-y-1.5">
            <InfoRow label="Award" value={awardName} highlight />

            <InfoRow label="Project" value={projectName} />

            <InfoRow label="Category" value={categoryName} />
          </dl>
        </div>
      </Link>
    </article>
  );
}
