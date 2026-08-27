"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import Image from "next/image";

import { useCallback, useEffect, useMemo, useState } from "react";

const AUTOPLAY_INTERVAL = 5000;

function createMediaUrl({ companySlug, mediaId, variant = "large" }) {
  if (!companySlug || !mediaId) {
    return null;
  }

  return `/api/public/v1/companies/${encodeURIComponent(
    companySlug,
  )}/media/${encodeURIComponent(mediaId)}?variant=${encodeURIComponent(
    variant,
  )}`;
}

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

function normalizeSlides({ project, companySlug, locale }) {
  const items = [];

  function addImage(image) {
    if (!image?.mediaId) {
      return;
    }

    if (items.some((item) => item.mediaId === image.mediaId)) {
      return;
    }

    items.push({
      mediaId: image.mediaId,

      alt:
        getLocalizedValue(image.alt, locale) ||
        getLocalizedValue(project?.title, locale) ||
        "Project image",

      largeUrl:
        image.url ||
        createMediaUrl({
          companySlug,
          mediaId: image.mediaId,
          variant: "large",
        }),

      thumbnailUrl:
        image.thumbnailUrl ||
        createMediaUrl({
          companySlug,
          mediaId: image.mediaId,
          variant: "thumbnail",
        }),
    });
  }

  /*
   * Detail API maps the featured image
   * to project.cover.
   */
  addImage(project?.cover);

  for (const image of project?.gallery || []) {
    addImage(image);
  }

  return items;
}

export default function PublicProjectSlideshow({
  companySlug,
  project,
  locale = "en",
}) {
  const slides = useMemo(
    () =>
      normalizeSlides({
        project,
        companySlug,
        locale,
      }),
    [project, companySlug, locale],
  );

  const [activeIndex, setActiveIndex] = useState(0);

  const [interactionKey, setInteractionKey] = useState(0);

  const slideCount = slides.length;

  const currentIndex =
    slideCount > 0 ? Math.min(activeIndex, slideCount - 1) : 0;

  const restartAutoplay = useCallback(() => {
    setInteractionKey((current) => current + 1);
  }, []);

  const goPrevious = useCallback(() => {
    if (slideCount <= 1) {
      return;
    }

    setActiveIndex((current) => {
      const safe = Math.min(current, slideCount - 1);

      return safe === 0 ? slideCount - 1 : safe - 1;
    });
  }, [slideCount]);

  const goNext = useCallback(() => {
    if (slideCount <= 1) {
      return;
    }

    setActiveIndex((current) => {
      const safe = Math.min(current, slideCount - 1);

      return safe >= slideCount - 1 ? 0 : safe + 1;
    });
  }, [slideCount]);

  function handlePrevious() {
    goPrevious();
    restartAutoplay();
  }

  function handleNext() {
    goNext();
    restartAutoplay();
  }

  function handleSelect(index) {
    setActiveIndex(index);
    restartAutoplay();
  }

  useEffect(() => {
    if (slideCount <= 1) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      goNext();
    }, AUTOPLAY_INTERVAL);

    return () => {
      window.clearTimeout(timer);
    };
  }, [currentIndex, slideCount, interactionKey, goNext]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "ArrowLeft") {
        handlePrevious();
      }

      if (event.key === "ArrowRight") {
        handleNext();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  });

  if (!slideCount) {
    return (
      <div
        className="
          flex
          aspect-[4/3]
          w-full
          items-center
          justify-center

          bg-[var(--public-surface)]

          text-[10px]
          uppercase
          tracking-[0.08em]
          text-black/20
        "
      >
        No project images
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* MAIN IMAGE */}

      <div
        className="
          relative
          grid
          w-full
          overflow-hidden
        "
      >
        {slides.map((slide, index) => {
          const active = index === currentIndex;

          return (
            <div
              key={slide.mediaId}
              aria-hidden={!active}
              className={`
                  col-start-1
                  row-start-1

                  flex
                  w-full
                  items-center
                  justify-center

                  transition-opacity
                  duration-700
                  ease-in-out

                  ${
                    active
                      ? "pointer-events-auto opacity-100"
                      : "pointer-events-none opacity-0"
                  }
                `}
            >
              <Image
                src={slide.largeUrl}
                alt={slide.alt}
                width={1800}
                height={1250}
                priority={index === 0}
                unoptimized
                draggable={false}
                className="
                    block
                    max-h-[min(62vh,720px)]
                    w-full
                    select-none
                    object-contain
                  "
              />
            </div>
          );
        })}

        {slideCount > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={handlePrevious}
              className="
                absolute
                left-1
                top-1/2
                z-10

                flex
                h-12
                w-10

                -translate-y-1/2

                items-center
                justify-center

                text-black/25

                transition-colors
                duration-200

                hover:text-black/55

                sm:left-2
                lg:left-3
              "
            >
              <ChevronLeft size={30} strokeWidth={1} />
            </button>

            <button
              type="button"
              aria-label="Next image"
              onClick={handleNext}
              className="
                absolute
                right-1
                top-1/2
                z-10

                flex
                h-12
                w-10

                -translate-y-1/2

                items-center
                justify-center

                text-black/25

                transition-colors
                duration-200

                hover:text-black/55

                sm:right-2
                lg:right-3
              "
            >
              <ChevronRight size={30} strokeWidth={1} />
            </button>
          </>
        )}
      </div>

      {/* DOTS */}

      {slideCount > 1 && (
        <div
          className="
            mt-4
            flex
            items-center
            justify-center
            gap-3
          "
        >
          {slides.map((slide, index) => {
            const active = index === currentIndex;

            return (
              <button
                key={slide.mediaId}
                type="button"
                aria-label={`Show image ${index + 1}`}
                onClick={() => handleSelect(index)}
                className="
                    flex
                    h-3
                    w-3
                    items-center
                    justify-center
                  "
              >
                <span
                  className={`
                      block
                      rounded-full
                      transition-all
                      duration-300

                      ${
                        active
                          ? "h-[7px] w-[7px] opacity-50"
                          : "h-[6px] w-[6px] bg-black/10 hover:bg-black/20"
                      }
                    `}
                  style={
                    active
                      ? {
                          backgroundColor: "var(--public-primary)",
                        }
                      : undefined
                  }
                />
              </button>
            );
          })}
        </div>
      )}

      {/* THUMBNAILS */}

      {slideCount > 1 && (
        <div
          className="
            mt-6
            overflow-x-auto
            pb-1

            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
          "
        >
          <div
            className="
              flex
              min-w-max
              items-center
              justify-start
              gap-3

              sm:gap-4
            "
          >
            {slides.map((slide, index) => {
              const active = index === currentIndex;

              return (
                <button
                  key={slide.mediaId}
                  type="button"
                  onClick={() => handleSelect(index)}
                  className="
                      relative

                      h-[54px]
                      w-[86px]

                      shrink-0
                      overflow-hidden

                      border-2
                      border-transparent

                      transition-opacity
                      duration-300

                      hover:opacity-75

                      sm:h-[62px]
                      sm:w-[100px]

                      lg:h-[72px]
                      lg:w-[116px]
                    "
                  style={
                    active
                      ? {
                          borderColor: "var(--public-primary)",
                        }
                      : undefined
                  }
                >
                  <Image
                    src={slide.thumbnailUrl}
                    alt=""
                    fill
                    unoptimized
                    draggable={false}
                    className="
                        select-none
                        object-cover
                      "
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
