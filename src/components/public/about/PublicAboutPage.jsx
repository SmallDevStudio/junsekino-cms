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

function PublicAboutImage({
  image,
  locale,
  className,
  sizes,
  priority = false,
}) {
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
      priority={priority}
      sizes={sizes || "(max-width: 968px) 100vw, 920px"}
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
    narrow: "max-w-[560px]",

    medium: "max-w-[680px]",

    wide: "max-w-[920px]",

    full: "max-w-[920px]",
  }[width];

  const align = section.data?.textAlign || "left";

  return (
    <section
      className={cn(
        "w-full",

        widthClass,

        align === "left" && "mr-auto text-left",

        align === "center" && "mx-auto text-center",

        align === "right" && "ml-auto text-right",
      )}
    >
      <PublicRichText
        value={content}
        className="
          text-[12px]
          leading-[1.7]
          text-black/80

          sm:text-[13px]
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
    medium: "max-w-[680px]",

    wide: "max-w-[920px]",

    full: "max-w-[920px]",
  }[width];

  const caption = getLocalizedValue(image.caption, locale);

  return (
    <section className={cn("mx-auto w-full", widthClass)}>
      <div
        className="
          relative
          aspect-[2/1]
          w-full
          overflow-hidden
          bg-black/[0.04]
        "
      >
        <PublicAboutImage image={image} locale={locale} />
      </div>

      {section.data?.showCaption && caption && (
        <p className="mt-1.5 text-[10px] leading-[1.5] text-black/45">
          {caption}
        </p>
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

  if (!image?.largeUrl) {
    return (
      <RichTextSection
        section={{
          ...section,

          data: {
            ...section.data,

            width: "medium",
          },
        }}
        locale={locale}
      />
    );
  }

  const imageRight = section.data?.imagePosition === "right";

  const imageWidth = section.data?.imageWidth || "50";

  const verticalAlign = section.data?.verticalAlign || "center";

  let gridTemplateColumns = "minmax(0, 1fr) minmax(0, 1fr)";

  if (imageRight) {
    if (imageWidth === "40") {
      gridTemplateColumns = "minmax(0, 1.5fr) minmax(0, 1fr)";
    }

    if (imageWidth === "60") {
      gridTemplateColumns = "minmax(0, 1fr) minmax(0, 1.5fr)";
    }
  } else {
    if (imageWidth === "40") {
      gridTemplateColumns = "minmax(0, 1fr) minmax(0, 1.5fr)";
    }

    if (imageWidth === "60") {
      gridTemplateColumns = "minmax(0, 1.5fr) minmax(0, 1fr)";
    }
  }

  const imageElement = (
    <div className="relative aspect-[2/1] w-full overflow-hidden bg-black/[0.04]">
      <PublicAboutImage
        image={image}
        locale={locale}
        sizes="(max-width: 767px) 100vw, 50vw"
      />
    </div>
  );

  const textElement = content ? (
    <div
      className={cn(
        "flex min-w-0",

        verticalAlign === "start"
          ? "items-start"
          : verticalAlign === "end"
            ? "items-end"
            : "items-center",
      )}
    >
      <PublicRichText
        value={content}
        className="
          w-full
          text-right
          text-[12px]
          leading-[1.7]
          text-black/80

          sm:text-[13px]
        "
      />
    </div>
  ) : (
    <div aria-hidden="true" />
  );

  return (
    <section className="mx-auto w-full max-w-[920px]">
      <div className="grid gap-5 md:hidden">
        {imageElement}

        {textElement}
      </div>

      <div
        className="hidden gap-5 md:grid"
        style={{
          gridTemplateColumns,
        }}
      >
        {imageRight ? (
          <>
            {textElement}

            {imageElement}
          </>
        ) : (
          <>
            {imageElement}

            {textElement}
          </>
        )}
      </div>
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

  const gapClass = {
    small: "gap-2",

    medium: "gap-4",

    large: "gap-6",
  }[section.data?.gap || "medium"];

  return (
    <section className="mx-auto w-full max-w-[920px]">
      <div className={cn("grid grid-cols-1", gridClass, gapClass)}>
        {images.map((image, index) => (
          <div
            key={image.mediaId || index}
            className="relative aspect-[4/3] overflow-hidden bg-black/[0.04]"
          >
            <PublicAboutImage
              image={image}
              locale={locale}
              sizes="(max-width: 767px) 100vw, 33vw"
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
    small: "h-3 sm:h-4",

    medium: "h-5 sm:h-6",

    large: "h-8 sm:h-10",

    xlarge: "h-12 sm:h-16",
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
  const content = getLocalizedRichText(page.content, locale);

  const sections = Array.isArray(page.sections) ? page.sections : [];

  const hasCover = Boolean(page.featuredImage?.largeUrl);

  return (
    <div className="w-full flex-1 text-black">
      <div
        className="
          mx-auto
          w-full
          max-w-[968px]

          px-5
          pb-16
          pt-2

          sm:px-6
          sm:pb-20
        "
      >
        <div className="mx-auto w-full max-w-[920px]">
          {/* =================================
              COVER
          ================================= */}

          {hasCover && (
            <div className="relative aspect-[17/10] w-full overflow-hidden bg-black/[0.04]">
              <PublicAboutImage
                image={page.featuredImage}
                locale={locale}
                sizes="(max-width: 968px) 100vw, 920px"
                priority
              />
            </div>
          )}

          {/* =================================
              PRIMARY CONTENT
          ================================= */}

          {content && (
            <section
              className={cn(
                "w-full",

                hasCover ? "mt-6" : "mt-8",
              )}
            >
              <PublicRichText
                value={content}
                className="
                  text-[12px]
                  leading-[1.7]
                  text-black/80

                  sm:text-[13px]
                "
              />
            </section>
          )}

          {/* =================================
              PAGE BUILDER SECTIONS
          ================================= */}

          {sections.length > 0 && (
            <div
              className={cn(
                "space-y-5",

                content || hasCover ? "mt-5" : "mt-8",
              )}
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
    </div>
  );
}
