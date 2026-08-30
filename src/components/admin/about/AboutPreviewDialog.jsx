"use client";

import { X } from "lucide-react";

import { useState } from "react";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { useCompanyLocalization } from "@/components/admin/localization/CompanyLocalizationProvider";

import PublicRichText from "@/components/public/content/PublicRichText";

import { cn } from "@/utils/cn";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function getLocalizedValue(value, locale) {
  if (!value) {
    return null;
  }

  return value?.[locale] || value?.en || value?.th || null;
}

function getMediaUrl(companyId, mediaId, variant = "large") {
  if (!companyId || !mediaId) {
    return null;
  }

  return `/api/v1/companies/${encodeURIComponent(
    companyId,
  )}/media/${encodeURIComponent(mediaId)}?variant=${variant}`;
}

function getCropPosition(image) {
  /*
   * =======================================================
   * NEW MEDIA CROP CORE
   * =======================================================
   *
   * react-easy-crop stores crop as translation values.
   * We should not use image.crop.x/y directly as CSS
   * object-position percentages.
   *
   * If croppedArea exists, use the center of that area
   * for the Admin Preview.
   * =======================================================
   */

  const croppedArea = image?.crop?.croppedArea;

  if (
    croppedArea &&
    Number.isFinite(croppedArea.x) &&
    Number.isFinite(croppedArea.y) &&
    Number.isFinite(croppedArea.width) &&
    Number.isFinite(croppedArea.height)
  ) {
    const x = Math.max(0, Math.min(100, croppedArea.x + croppedArea.width / 2));

    const y = Math.max(
      0,
      Math.min(100, croppedArea.y + croppedArea.height / 2),
    );

    return {
      x,
      y,
    };
  }

  /*
   * =======================================================
   * LEGACY PRESENTATION
   * =======================================================
   *
   * Keep old About records working while Media Crop Core
   * gradually replaces the old presentation structure.
   * =======================================================
   */

  const focalPoint = image?.presentation?.focalPoint;

  if (focalPoint) {
    return {
      x: (focalPoint.x ?? 0.5) * 100,

      y: (focalPoint.y ?? 0.5) * 100,
    };
  }

  return {
    x: 50,

    y: 50,
  };
}

/*
 * =========================================================
 * PREVIEW IMAGE
 * =========================================================
 */

function PreviewImage({ companyId, image, className }) {
  const mediaId = image?.mediaId;

  const mediaUrl = getMediaUrl(companyId, mediaId, "large");

  if (!mediaUrl) {
    return null;
  }

  const position = getCropPosition(image);

  const objectFit =
    image?.presentation?.objectFit === "contain" ? "contain" : "cover";

  return (
    <div
      className={cn(
        "overflow-hidden",

        "bg-black/[0.03]",

        className,
      )}
    >
      {/*
       * Admin preview uses the protected Media endpoint.
       *
       * We intentionally use img here because this URL is
       * an authenticated API route and not a static image
       * URL that should be optimized by next/image.
       */}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={mediaUrl}
        alt=""
        className="
          h-full
          w-full
        "
        style={{
          objectFit,

          objectPosition: `${position.x}% ${position.y}%`,
        }}
      />
    </div>
  );
}

/*
 * =========================================================
 * TEXT SECTION
 * =========================================================
 */

function TextSection({ section, locale }) {
  const content = getLocalizedValue(section?.data?.content, locale);

  if (!content) {
    return null;
  }

  return (
    <section
      className="
        mx-auto
        w-full
        max-w-[900px]
      "
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
 * IMAGE + TEXT SECTION
 * =========================================================
 */

function ImageTextSection({ companyId, section, locale }) {
  const content = getLocalizedValue(section?.data?.content, locale);

  const image = section?.data?.image || null;

  const imagePosition =
    section?.data?.imagePosition === "right" ? "right" : "left";

  const imageWidth = section?.data?.imageWidth || "50";

  /*
   * =======================================================
   * GRID WIDTH
   * =======================================================
   *
   * imageWidth describes the width allocated to the image.
   *
   * 40 = image 40 / text 60
   * 50 = image 50 / text 50
   * 60 = image 60 / text 40
   * =======================================================
   */

  let gridTemplateColumns = "minmax(0, 1fr) minmax(0, 1fr)";

  if (imagePosition === "left") {
    if (imageWidth === "40") {
      gridTemplateColumns = "minmax(0, 0.8fr) minmax(0, 1.2fr)";
    }

    if (imageWidth === "60") {
      gridTemplateColumns = "minmax(0, 1.2fr) minmax(0, 0.8fr)";
    }
  } else {
    if (imageWidth === "40") {
      gridTemplateColumns = "minmax(0, 1.2fr) minmax(0, 0.8fr)";
    }

    if (imageWidth === "60") {
      gridTemplateColumns = "minmax(0, 0.8fr) minmax(0, 1.2fr)";
    }
  }

  /*
   * =======================================================
   * DRAFT WITHOUT IMAGE
   * =======================================================
   *
   * Image + Text blocks are allowed to temporarily have
   * no image while editing.
   *
   * Preview them as text-only instead of showing a broken
   * image area.
   * =======================================================
   */

  if (!image?.mediaId) {
    return <TextSection section={section} locale={locale} />;
  }

  /*
   * =======================================================
   * IMAGE
   * =======================================================
   */

  const imageElement = (
    <PreviewImage
      companyId={companyId}
      image={image}
      className="
        aspect-[4/3]
        w-full
      "
    />
  );

  /*
   * =======================================================
   * TEXT
   * =======================================================
   */

  const textElement = (
    <div
      className="
        flex
        min-w-0
        items-center
      "
    >
      {content && (
        <PublicRichText
          value={content}
          className="
            w-full

            text-[13px]
            leading-[1.8]

            sm:text-[14px]
          "
        />
      )}
    </div>
  );

  return (
    <section
      className="
        mx-auto
        w-full
        max-w-[1180px]
      "
    >
      {/* =================================
          MOBILE
      ================================= */}

      <div
        className="
          grid
          gap-6

          md:hidden
        "
      >
        {imageElement}

        {textElement}
      </div>

      {/* =================================
          DESKTOP
      ================================= */}

      <div
        className="
          hidden
          gap-10

          md:grid

          lg:gap-14
        "
        style={{
          gridTemplateColumns,
        }}
      >
        {imagePosition === "left" ? (
          <>
            {imageElement}

            {textElement}
          </>
        ) : (
          <>
            {textElement}

            {imageElement}
          </>
        )}
      </div>
    </section>
  );
}

/*
 * =========================================================
 * ABOUT SECTION
 * =========================================================
 */

function AboutSection({ companyId, section, locale }) {
  if (!section || section.enabled === false) {
    return null;
  }

  /*
   * =======================================================
   * TEXT ONLY
   * =======================================================
   */

  if (section.type === "richText") {
    return <TextSection section={section} locale={locale} />;
  }

  /*
   * =======================================================
   * IMAGE + TEXT
   * =======================================================
   */

  if (section.type === "imageText") {
    return (
      <ImageTextSection
        companyId={companyId}
        section={section}
        locale={locale}
      />
    );
  }

  /*
   * About Admin currently exposes only:
   *
   * - richText
   * - imageText
   *
   * Ignore unsupported Page Builder block types instead
   * of breaking the whole Preview.
   */

  return null;
}

/*
 * =========================================================
 * PREVIEW
 * =========================================================
 */

export default function AboutPreviewDialog({
  open,
  companyId,
  value,
  onClose,
}) {
  const { contentLocales } = useCompanyLocalization();

  const { t } = useAdminTranslation();

  const [locale, setLocale] = useState("en");

  /*
   * =======================================================
   * LOCALES
   * =======================================================
   *
   * Do not synchronize locale state through useEffect.
   *
   * activeLocale already provides a safe derived fallback
   * when the currently selected locale is not available.
   *
   * Example:
   *
   * locale = "en"
   * contentLocales = ["th"]
   *
   * activeLocale becomes "th" automatically.
   * =======================================================
   */

  const locales =
    Array.isArray(contentLocales) && contentLocales.length
      ? contentLocales
      : ["en"];

  const activeLocale = locales.includes(locale) ? locale : locales[0];

  /*
   * =======================================================
   * CLOSED
   * =======================================================
   */

  if (!open) {
    return null;
  }

  /*
   * =======================================================
   * CONTENT
   * =======================================================
   */

  const title = getLocalizedValue(value?.title, activeLocale) || "";

  const content = getLocalizedValue(value?.content, activeLocale);

  const featuredImage = value?.featuredImage || null;

  /*
   * =======================================================
   * SECTIONS
   * =======================================================
   *
   * Clone before sort so Preview never mutates form state.
   * =======================================================
   */

  const sections = Array.isArray(value?.sections)
    ? [...value.sections]
        .filter((section) => section?.enabled !== false)
        .sort(
          (first, second) => (first?.sortOrder ?? 0) - (second?.sortOrder ?? 0),
        )
    : [];

  return (
    <div
      className="
        fixed
        inset-0
        z-[240]

        flex
        items-center
        justify-center

        p-4

        sm:p-6
      "
    >
      {/* =================================
          BACKDROP
      ================================= */}

      <button
        type="button"
        aria-label={t("common.close")}
        onClick={onClose}
        className="
          absolute
          inset-0

          bg-black/45

          backdrop-blur-[2px]
        "
      />

      {/* =================================
          DIALOG
      ================================= */}

      <div
        className="
          relative
          z-10

          flex
          max-h-[92vh]
          w-full
          max-w-[1440px]
          flex-col

          overflow-hidden

          rounded-3xl

          bg-white

          shadow-[0_30px_100px_rgba(0,0,0,0.3)]
        "
      >
        {/* =================================
            ADMIN PREVIEW HEADER
        ================================= */}

        <div
          className="
            flex
            shrink-0

            items-center
            justify-between

            gap-3

            border-b
            border-black/[0.06]

            px-5
            py-3

            sm:px-7
          "
        >
          <div className="min-w-0">
            <div
              className="
                admin-text-10
                font-semibold
                uppercase
                tracking-[0.16em]

                text-[var(--company-primary)]
              "
            >
              {t("about.preview.title")}
            </div>

            <div
              className="
                mt-0.5

                admin-text-11

                text-black/45
              "
            >
              {t("about.preview.description")}
            </div>
          </div>

          <div
            className="
              flex
              shrink-0

              items-center
              gap-2
            "
          >
            {/* ===============================
                LANGUAGE
            =============================== */}

            {locales.length > 1 && (
              <div
                className="
                  flex
                  items-center

                  rounded-xl

                  bg-black/[0.035]

                  p-1
                "
              >
                {locales.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setLocale(item)}
                    className={cn(
                      "rounded-lg px-3 py-1.5",

                      "admin-text-9 font-semibold uppercase",

                      "transition",

                      activeLocale === item
                        ? "bg-white text-[var(--company-primary)] shadow-sm"
                        : "text-black/40 hover:text-black/70",
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}

            {/* ===============================
                CLOSE
            =============================== */}

            <button
              type="button"
              onClick={onClose}
              aria-label={t("common.close")}
              className="
                flex
                h-9
                w-9

                items-center
                justify-center

                rounded-xl

                text-black/45

                transition

                hover:bg-black/[0.04]
                hover:text-black
              "
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* =================================
            PUBLIC WEBSITE PREVIEW

            IMPORTANT:
            Do not apply Admin font scaling here.

            This Preview represents Public content,
            therefore Small / Medium / Large Admin
            display settings must not affect it.
        ================================= */}

        <div
          className="
            min-h-0
            flex-1

            overflow-y-auto

            bg-white
          "
        >
          <div
            className="
              mx-auto
              w-full
              max-w-[1500px]

              px-5
              py-8

              sm:px-8

              lg:px-14
              lg:py-12
            "
          >
            {/* ===============================
                ABOUT COVER
                4 : 1
            =============================== */}

            {featuredImage?.mediaId && (
              <PreviewImage
                companyId={companyId}
                image={featuredImage}
                className="
                  aspect-[4/1]
                  w-full
                "
              />
            )}

            {/* ===============================
                MAIN CONTENT
            =============================== */}

            <div
              className="
                mx-auto
                max-w-[900px]

                py-10

                sm:py-14
              "
            >
              {title && (
                <h1
                  className="
                    mb-8

                    text-[26px]
                    font-normal
                    tracking-[0.01em]

                    text-[var(--company-primary)]

                    sm:text-[30px]
                  "
                >
                  {title}
                </h1>
              )}

              {content && (
                <PublicRichText
                  value={content}
                  className="
                    text-[13px]
                    leading-[1.8]

                    sm:text-[14px]
                  "
                />
              )}
            </div>

            {/* ===============================
                ADDITIONAL SECTIONS
            =============================== */}

            {sections.length > 0 && (
              <div
                className="
                  space-y-12

                  pb-10

                  sm:space-y-16
                  sm:pb-14

                  lg:space-y-20
                "
              >
                {sections.map((section, index) => (
                  <AboutSection
                    key={section.id || index}
                    companyId={companyId}
                    section={section}
                    locale={activeLocale}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
