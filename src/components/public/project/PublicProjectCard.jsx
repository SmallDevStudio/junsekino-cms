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

export default function PublicProjectCard({
  companySlug,
  project,
  locale = "en",
}) {
  const title =
    getLocalizedValue(project?.title, locale) ||
    project?.slug ||
    "Untitled Project";

  const mediaId = project?.featuredImage?.mediaId || null;

  const imageUrl = createMediaUrl({
    companySlug,
    mediaId,
  });

  /*
   * Project detail route will be built
   * in the next step.
   */
  const href = `/${companySlug}/project-detail/${project.slug}`;

  return (
    <article>
      <Link
        href={href}
        className="
          group
          block
          text-center
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

                opacity-[0.48]

                transition-all
                duration-500
                ease-out

                group-hover:scale-[1.025]
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

        <h3
          className="
            mt-3

            text-[15px]
            font-normal
            leading-tight
            tracking-[0.01em]
            text-[#181818]

            transition-colors
            duration-300

            group-hover:text-[var(--public-primary)]

            sm:text-[16px]
            lg:text-[17px]
          "
        >
          {title}
        </h3>
      </Link>
    </article>
  );
}
