import Image from "next/image";
import Link from "next/link";

function getLocalizedValue(value, locale = "en") {
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

function createMediaUrl({ companySlug, mediaId }) {
  if (!companySlug || !mediaId) {
    return null;
  }

  return `/api/public/v1/companies/${encodeURIComponent(
    companySlug,
  )}/media/${encodeURIComponent(mediaId)}?variant=medium`;
}

function InfoRow({ label, value }) {
  if (!value) {
    return null;
  }

  return (
    <div
      className="
        grid
        grid-cols-[86px_minmax(0,1fr)]
        gap-3

        text-[11px]
        leading-[1.35]

        sm:grid-cols-[100px_minmax(0,1fr)]
        sm:text-[12px]

        lg:grid-cols-[108px_minmax(0,1fr)]
        lg:text-[13px]
      "
    >
      <dt
        className="
          text-black/40
        "
      >
        {label}
      </dt>

      <dd
        className="
          min-w-0
          text-black/75
        "
      >
        {value}
      </dd>
    </div>
  );
}

export default function PublicAwardCard({ companySlug, award, locale = "en" }) {
  const awardName = getLocalizedValue(award.awardName, locale) || "Award";

  const projectName =
    getLocalizedValue(award.project?.title, locale) ||
    award.project?.slug ||
    "";

  const categoryName = getLocalizedValue(award.category?.name, locale);

  const imageAlt =
    getLocalizedValue(award.thumbnail?.alt, locale) || projectName || awardName;

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

          sm:gap-7

          lg:grid-cols-[minmax(0,0.9fr)_minmax(280px,1.1fr)]
          lg:items-start
          lg:gap-[clamp(3rem,6vw,7rem)]
        "
      >
        {/* =====================================
            THUMBNAIL
        ===================================== */}

        <div
          className="
            relative

            aspect-[4/3]
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
                (max-width: 1023px) 100vw,
                42vw
              "
              className="
                select-none
                object-cover

                opacity-[0.55]

                transition-all
                duration-500
                ease-out

                group-hover:scale-[1.02]
                group-hover:opacity-100
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
                text-black/20
              "
            >
              No Image
            </div>
          )}
        </div>

        {/* =====================================
            INFORMATION
        ===================================== */}

        <div
          className="
            flex
            h-full
            min-w-0

            flex-col
            justify-start

            pt-1

            lg:pt-2
          "
        >
          <dl
            className="
              space-y-1
            "
          >
            <InfoRow label="Award" value={awardName} />

            <InfoRow label="Project" value={projectName} />

            <InfoRow label="Category" value={categoryName} />
          </dl>

          <div
            className="
              mt-6
              h-px
              w-0

              bg-[var(--public-primary)]

              transition-all
              duration-500

              group-hover:w-12

              lg:mt-8
            "
          />

          <span
            className="
              mt-3

              text-[9px]
              uppercase
              tracking-[0.08em]

              text-black/0

              transition-colors
              duration-300

              group-hover:text-black/30
            "
          >
            View Project
          </span>
        </div>
      </Link>
    </article>
  );
}
