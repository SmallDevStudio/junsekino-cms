"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import Image from "next/image";
import Link from "next/link";

import { useCallback, useEffect, useMemo, useState } from "react";

const AUTOPLAY_INTERVAL = 5000;

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

function createMediaUrl({ companySlug, mediaId, variant = "large" }) {
  if (!companySlug || !mediaId) {
    return "";
  }

  return `/api/public/v1/companies/${encodeURIComponent(
    companySlug,
  )}/media/${encodeURIComponent(
    mediaId,
  )}?variant=${encodeURIComponent(variant)}`;
}

function normalizeSlides({ slides, companySlug }) {
  if (!Array.isArray(slides)) {
    return [];
  }

  return slides
    .filter((slide) => slide?.enabled !== false && Boolean(slide?.mediaId))
    .map((slide, index) => ({
      ...slide,

      id: slide.id || `${slide.mediaId}-${index}`,

      largeUrl: createMediaUrl({
        companySlug,
        mediaId: slide.mediaId,
        variant: "large",
      }),

      thumbnailUrl: createMediaUrl({
        companySlug,
        mediaId: slide.mediaId,
        variant: "thumbnail",
      }),
    }));
}

function SlideImage({ slide, priority = false }) {
  const alt =
    getLocalizedValue(slide?.alt, "en") ||
    getLocalizedValue(slide?.caption, "en") ||
    "Junsekino project";

  const image = (
    <Image
      src={slide.largeUrl}
      alt={alt}
      width={1600}
      height={1000}
      priority={priority}
      unoptimized
      draggable={false}
      className="
        block
        max-h-[min(64vh,680px)]
        w-full
        select-none
        object-contain
      "
    />
  );

  if (slide?.link?.enabled && slide?.link?.url) {
    const external = /^https?:\/\//i.test(slide.link.url);

    if (external) {
      return (
        <a
          href={slide.link.url}
          target={slide.link.newTab ? "_blank" : undefined}
          rel={slide.link.newTab ? "noreferrer" : undefined}
          className="
            flex
            w-full
            items-center
            justify-center
          "
        >
          {image}
        </a>
      );
    }

    return (
      <Link
        href={slide.link.url}
        className="
          flex
          w-full
          items-center
          justify-center
        "
      >
        {image}
      </Link>
    );
  }

  return image;
}

export default function PublicHomeSlideshow({ companySlug, slideshow }) {
  const slides = useMemo(
    () =>
      normalizeSlides({
        slides: slideshow?.slides || [],
        companySlug,
      }),
    [slideshow?.slides, companySlug],
  );

  const [activeIndex, setActiveIndex] = useState(0);

  /*
   * Used only for restarting autoplay
   * after manual interaction.
   */
  const [interactionKey, setInteractionKey] = useState(0);

  const slideCount = slides.length;

  const currentIndex =
    slideCount > 0 ? Math.min(activeIndex, slideCount - 1) : 0;

  const activeSlide = slides[currentIndex] || null;

  /*
   * Restart autoplay countdown whenever
   * the user manually changes a slide.
   */
  const restartAutoplay = useCallback(() => {
    setInteractionKey((current) => current + 1);
  }, []);

  const goPrevious = useCallback(() => {
    if (slideCount <= 1) {
      return;
    }

    setActiveIndex((current) => {
      const safeCurrent = Math.min(current, slideCount - 1);

      return safeCurrent === 0 ? slideCount - 1 : safeCurrent - 1;
    });
  }, [slideCount]);

  const goNext = useCallback(() => {
    if (slideCount <= 1) {
      return;
    }

    setActiveIndex((current) => {
      const safeCurrent = Math.min(current, slideCount - 1);

      return safeCurrent >= slideCount - 1 ? 0 : safeCurrent + 1;
    });
  }, [slideCount]);

  /*
   * Manual navigation.
   */

  const handlePrevious = useCallback(() => {
    goPrevious();
    restartAutoplay();
  }, [goPrevious, restartAutoplay]);

  const handleNext = useCallback(() => {
    goNext();
    restartAutoplay();
  }, [goNext, restartAutoplay]);

  const handleSelectSlide = useCallback(
    (index) => {
      setActiveIndex(index);
      restartAutoplay();
    },
    [restartAutoplay],
  );

  /*
   * Keyboard navigation.
   */

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
  }, [handleNext, handlePrevious]);

  /*
   * Autoplay.
   *
   * Every 5 seconds.
   *
   * interactionKey causes the timer
   * to restart after manual navigation.
   */

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
  }, [currentIndex, slideCount, goNext, interactionKey]);

  if (!slideCount) {
    return (
      <section
        className="
          flex
          min-h-0
          flex-1
          items-center
          justify-center
          px-6
        "
      >
        <div
          className="
            text-[11px]
            uppercase
            tracking-[0.08em]
            text-[var(--public-muted-foreground)]
          "
        >
          No slideshow available
        </div>
      </section>
    );
  }

  return (
    <section
      className="
        flex
        min-h-0
        flex-1
        flex-col
        items-center
        overflow-hidden

        px-5
        pb-5

        sm:px-8
        sm:pb-7

        lg:px-12
        lg:pb-8
      "
    >
      {/* ======================================
          MAIN IMAGE
      ====================================== */}

      <div
        className="
          relative
          flex
          w-full
          max-w-[1040px]
          items-center
          justify-center
        "
      >
        <div
          className="
            relative
            grid
            w-full
            max-w-[1040px]
            overflow-hidden
          "
        >
          {slides.map((slide, index) => {
            const active = index === currentIndex;

            return (
              <div
                key={slide.id}
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
                <SlideImage slide={slide} priority={index === 0} />
              </div>
            );
          })}

          {/* ==================================
              PREVIOUS / NEXT
          ================================== */}

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

                  text-[var(--public-muted-foreground)]

                  opacity-60

                  transition-all
                  duration-200

                  hover:text-[var(--public-foreground)]
                  hover:opacity-100

                  focus-visible:text-[var(--public-foreground)]
                  focus-visible:opacity-100
                  focus-visible:outline-none

                  sm:left-2

                  lg:left-3
                  lg:h-14
                  lg:w-12
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

                  text-[var(--public-muted-foreground)]

                  opacity-60

                  transition-all
                  duration-200

                  hover:text-[var(--public-foreground)]
                  hover:opacity-100

                  focus-visible:text-[var(--public-foreground)]
                  focus-visible:opacity-100
                  focus-visible:outline-none

                  sm:right-2

                  lg:right-3
                  lg:h-14
                  lg:w-12
                "
              >
                <ChevronRight size={30} strokeWidth={1} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ======================================
          DOT NAVIGATION
      ====================================== */}

      {slideCount > 1 && (
        <div
          className="
            mt-3

            flex
            shrink-0

            items-center
            justify-center

            gap-3

            lg:mt-4
          "
        >
          {slides.map((slide, index) => {
            const active = index === currentIndex;

            return (
              <button
                key={slide.id}
                type="button"
                aria-label={`Show slide ${index + 1}`}
                aria-current={active ? "true" : undefined}
                onClick={() => handleSelectSlide(index)}
                className="
                  flex
                  h-3
                  w-3

                  items-center
                  justify-center

                  focus-visible:outline-none
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
                        ? "h-[7px] w-[7px] opacity-60"
                        : "h-[6px] w-[6px] bg-[var(--public-muted-foreground)] opacity-25 hover:opacity-55"
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

      {/* ======================================
          THUMBNAILS
      ====================================== */}

      {slideCount > 1 && (
        <div
          className="
            mt-5

            flex
            w-full
            shrink-0

            justify-center

            overflow-x-auto

            pb-1

            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden

            lg:mt-6
          "
        >
          <div
            className="
              flex
              min-w-max

              items-center
              justify-center

              gap-3

              sm:gap-4
            "
          >
            {slides.map((slide, index) => {
              const active = index === currentIndex;

              const alt =
                getLocalizedValue(slide?.alt, "en") || `Slide ${index + 1}`;

              return (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`Show ${alt}`}
                  aria-current={active ? "true" : undefined}
                  onClick={() => handleSelectSlide(index)}
                  className="
                    relative

                    h-[54px]
                    w-[86px]

                    shrink-0

                    overflow-hidden

                    border-[2px]
                    border-transparent

                    bg-[var(--public-surface)]

                    transition-all
                    duration-300

                    hover:opacity-75

                    focus-visible:outline-none

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
                    sizes="
                      (max-width: 639px) 86px,
                      (max-width: 1023px) 100px,
                      116px
                    "
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

      {/* ======================================
          OPTIONAL CAPTION
      ====================================== */}

      {getLocalizedValue(activeSlide?.caption, "en") && (
        <div
          className="
            mt-3
            shrink-0

            text-center
            text-[11px]
            tracking-[0.02em]
            text-[var(--public-muted-foreground)]

            sm:text-[12px]
          "
        >
          {getLocalizedValue(activeSlide.caption, "en")}
        </div>
      )}
    </section>
  );
}
