import Image from "next/image";

import PublicRichText from "@/components/public/content/PublicRichText";

import { cn } from "@/utils/cn";

/*
 * =========================================================
 * LOCALIZATION
 * =========================================================
 */

function getLocalizedValue(value, locale = "en") {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  const preferred = value?.[locale];

  if (typeof preferred === "string" && preferred.trim()) {
    return preferred;
  }

  if (typeof value?.en === "string" && value.en.trim()) {
    return value.en;
  }

  if (typeof value?.th === "string" && value.th.trim()) {
    return value.th;
  }

  return "";
}

/*
 * =========================================================
 * RICH TEXT
 * =========================================================
 */

function getLocalizedRichText(value, locale = "en") {
  if (!value) {
    return null;
  }

  if (typeof value === "string" || value?.type === "doc") {
    return value;
  }

  const preferred = value?.[locale];

  if (
    preferred &&
    (typeof preferred === "string" || preferred?.type === "doc")
  ) {
    return preferred;
  }

  if (value?.en && (typeof value.en === "string" || value.en?.type === "doc")) {
    return value.en;
  }

  if (value?.th && (typeof value.th === "string" || value.th?.type === "doc")) {
    return value.th;
  }

  return null;
}

/*
 * =========================================================
 * PUBLIC IMAGE
 * =========================================================
 */

function PublicAboutImage({ image, locale, className, sizes }) {
  if (!image?.largeUrl) {
    return null;
  }

  const alt = getLocalizedValue(image.alt, locale);

  const focalX = Math.max(
    0,
    Math.min(1, image.presentation?.focalPoint?.x ?? 0.5),
  );

  const focalY = Math.max(
    0,
    Math.min(1, image.presentation?.focalPoint?.y ?? 0.5),
  );

  const objectFit =
    image.presentation?.objectFit === "contain"
      ? "object-contain"
      : "object-cover";

  return (
    <Image
      src={image.largeUrl}
      alt={alt}
      fill
      unoptimized
      sizes={sizes || "(max-width: 1024px) 100vw, 80vw"}
      className={cn(objectFit, className)}
      style={{
        objectPosition: `${focalX * 100}% ${focalY * 100}%`,
      }}
    />
  );
}

/*
 * =========================================================
 * RICH TEXT SECTION
 * =========================================================
 */

function RichTextSection({ section, locale }) {
  const content = getLocalizedRichText(section.data?.content, locale);

  if (!content) {
    return null;
  }

  const width = section.data?.width || "medium";

  const widthClass = {
    narrow: "max-w-[680px]",

    medium: "max-w-[880px]",

    wide: "max-w-[1180px]",

    full: "max-w-none",
  }[width];

  const align = section.data?.textAlign || "left";

  return (
    <section
      className={cn(
        "mx-auto w-full",

        widthClass,

        align === "center" && "text-center",

        align === "right" && "text-right",
      )}
    >
      <PublicRichText
        value={content}
        className="
          text-[13px]
          leading-[1.8]

          sm:text-[14px]
        "
      />
    </section>
  );
}

/*
 * =========================================================
 * IMAGE SECTION
 * =========================================================
 */

function ImageSection({ section, locale }) {
  const image = section.data?.image;

  if (!image?.largeUrl) {
    return null;
  }

  const width = section.data?.width || "wide";

  const widthClass = {
    medium: "max-w-[880px]",

    wide: "max-w-[1240px]",

    full: "max-w-none",
  }[width];

  const caption = getLocalizedValue(image.caption, locale);

  return (
    <section
      className={cn(
        "mx-auto w-full",

        widthClass,
      )}
    >
      <div
        className="
          relative
          aspect-[16/9]
          w-full

          overflow-hidden

          bg-black/[0.03]
        "
      >
        <PublicAboutImage image={image} locale={locale} />
      </div>

      {section.data?.showCaption && caption && (
        <div
          className="
              mt-2

              text-[10px]
              leading-5

              text-black/40
            "
        >
          {caption}
        </div>
      )}
    </section>
  );
}

/*
 * =========================================================
 * IMAGE + TEXT SECTION
 * =========================================================
 */

function ImageTextSection({ section, locale }) {
  const image = section.data?.image;

  const content = getLocalizedRichText(section.data?.content, locale);

  if (!image?.largeUrl && !content) {
    return null;
  }

  const imageRight = section.data?.imagePosition === "right";

  const verticalAlign = section.data?.verticalAlign || "center";

  return (
    <section
      className="
        mx-auto
        grid
        w-full
        max-w-[1380px]

        gap-7

        lg:grid-cols-2
        lg:gap-12
      "
    >
      {image?.largeUrl && (
        <div
          className={cn(
            "relative",

            "aspect-[4/3]",

            "overflow-hidden",

            "bg-black/[0.03]",

            imageRight && "lg:order-2",
          )}
        >
          <PublicAboutImage
            image={image}
            locale={locale}
            sizes="
              (max-width: 1024px)
              100vw,
              50vw
            "
          />
        </div>
      )}

      {content && (
        <div
          className={cn(
            "flex",

            verticalAlign === "start"
              ? "items-start"
              : verticalAlign === "end"
                ? "items-end"
                : "items-center",

            imageRight && "lg:order-1",
          )}
        >
          <PublicRichText
            value={content}
            className="
              text-[13px]
              leading-[1.8]

              sm:text-[14px]
            "
          />
        </div>
      )}
    </section>
  );
}

/*
 * =========================================================
 * GALLERY
 * =========================================================
 */

function GallerySection({ section, locale }) {
  const images = Array.isArray(section.data?.images) ? section.data.images : [];

  if (images.length === 0) {
    return null;
  }

  const columns = Math.max(1, Math.min(4, Number(section.data?.columns || 3)));

  const gridClass = {
    1: "md:grid-cols-1",

    2: "md:grid-cols-2",

    3: "md:grid-cols-3",

    4: "md:grid-cols-4",
  }[columns];

  return (
    <section
      className="
        mx-auto
        w-full
        max-w-[1500px]
      "
    >
      <div
        className={cn(
          "grid grid-cols-1 gap-4",

          gridClass,
        )}
      >
        {images.map((image, index) => (
          <div
            key={image.mediaId || index}
            className="
                relative
                aspect-[4/3]

                overflow-hidden

                bg-black/[0.03]
              "
          >
            <PublicAboutImage
              image={image}
              locale={locale}
              sizes="
                  (max-width: 768px)
                  100vw,
                  33vw
                "
            />
          </div>
        ))}
      </div>
    </section>
  );
}

/*
 * =========================================================
 * SPACER
 * =========================================================
 */

function SpacerSection({ section }) {
  const size = section.data?.size || "medium";

  const className = {
    small: "h-6 sm:h-8",

    medium: "h-10 sm:h-14",

    large: "h-16 sm:h-20",

    xlarge: "h-24 sm:h-32",
  }[size];

  return <div aria-hidden="true" className={className} />;
}

/*
 * =========================================================
 * SECTION
 * =========================================================
 */

function AboutSection({ section, locale }) {
  switch (section.type) {
    case "richText":
      return <RichTextSection section={section} locale={locale} />;

    case "image":
      return <ImageSection section={section} locale={locale} />;

    case "imageText":
      return <ImageTextSection section={section} locale={locale} />;

    case "gallery":
      return <GallerySection section={section} locale={locale} />;

    case "spacer":
      return <SpacerSection section={section} />;

    default:
      return null;
  }
}

/*
 * =========================================================
 * PUBLIC ABOUT PAGE
 * =========================================================
 */

export default function PublicAboutPage({ page, locale = "en" }) {
  const title = getLocalizedValue(page.title, locale) || "About";

  const content = getLocalizedRichText(page.content, locale);

  const sections = Array.isArray(page.sections) ? page.sections : [];

  return (
    <div
      className="
        w-full

        px-5
        pb-16

        sm:px-8

        lg:px-12
        lg:pb-24

        xl:px-16
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-[1680px]
        "
      >
        {/* =================================
            PAGE TITLE
        ================================= */}

        <div
          className="
            pt-5

            sm:pt-7

            lg:pt-9
          "
        >
          <h1
            className="
              text-[11px]
              font-semibold
              uppercase
              tracking-[0.16em]

              text-[var(--public-primary)]
            "
          >
            {title}
          </h1>
        </div>

        {/* =================================
            COVER
        ================================= */}

        {page.featuredImage?.largeUrl && (
          <div
            className="
              relative

              mt-7

              aspect-[16/8]
              w-full

              overflow-hidden

              bg-black/[0.03]

              sm:mt-9

              lg:mt-10
            "
          >
            <PublicAboutImage
              image={page.featuredImage}
              locale={locale}
              sizes="100vw"
            />
          </div>
        )}

        {/* =================================
            LEGACY / PRIMARY CONTENT
        ================================= */}

        {content && (
          <div
            className="
              mx-auto

              max-w-[900px]

              pt-10

              sm:pt-14

              lg:pt-16
            "
          >
            <PublicRichText
              value={content}
              className="
                text-[13px]
                leading-[1.85]

                text-black/75

                sm:text-[14px]
              "
            />
          </div>
        )}

        {/* =================================
            PAGE BUILDER SECTIONS
        ================================= */}

        {sections.length > 0 && (
          <div
            className="
              mt-12
              space-y-12

              sm:mt-16
              sm:space-y-16

              lg:mt-20
              lg:space-y-20
            "
          >
            {sections.map((section, index) => (
              <AboutSection
                key={section.id || `${section.type}-${index}`}
                section={section}
                locale={locale}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
