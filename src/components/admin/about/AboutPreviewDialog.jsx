"use client";

import { X } from "lucide-react";

import PublicRichText from "@/components/public/content/PublicRichText";

import { useCompanyLocalization } from "@/components/admin/localization/CompanyLocalizationProvider";

import { useState } from "react";

import { cn } from "@/utils/cn";

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

  const [locale, setLocale] = useState("en");

  if (!open) {
    return null;
  }

  const locales =
    Array.isArray(contentLocales) && contentLocales.length
      ? contentLocales
      : ["en"];

  const activeLocale = locales.includes(locale) ? locale : locales[0];

  const title = value?.title?.[activeLocale] || value?.title?.en || "";

  const content = value?.content?.[activeLocale] || value?.content?.en || null;

  const mediaId = value?.featuredImage?.mediaId || null;

  const mediaUrl = mediaId
    ? `/api/v1/companies/${encodeURIComponent(
        companyId,
      )}/media/${encodeURIComponent(mediaId)}?variant=large`
    : null;

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
      <button
        type="button"
        aria-label="Close preview"
        onClick={onClose}
        className="
          absolute
          inset-0

          bg-black/45

          backdrop-blur-[2px]
        "
      />

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
        {/* HEADER */}

        <div
          className="
            flex
            shrink-0

            items-center
            justify-between

            border-b
            border-black/[0.06]

            px-5
            py-3

            sm:px-7
          "
        >
          <div>
            <div
              className="
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.16em]

                text-[var(--company-primary)]
              "
            >
              Preview
            </div>

            <div
              className="
                mt-0.5

                text-[11px]

                text-black/45
              "
            >
              About page preview
            </div>
          </div>

          <div
            className="
              flex
              items-center
              gap-2
            "
          >
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

                      "text-[9px] font-semibold uppercase",

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

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
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

        {/* WEBSITE */}

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
            {mediaUrl && (
              <div
                className="
                  aspect-[16/8]
                  w-full

                  overflow-hidden

                  bg-black/[0.03]
                "
                style={{
                  backgroundImage: `url("${mediaUrl}")`,

                  backgroundSize:
                    value?.featuredImage?.presentation?.objectFit === "contain"
                      ? "contain"
                      : "cover",

                  backgroundRepeat: "no-repeat",

                  backgroundPosition: `${
                    (value?.featuredImage?.presentation?.focalPoint?.x ?? 0.5) *
                    100
                  }% ${
                    (value?.featuredImage?.presentation?.focalPoint?.y ?? 0.5) *
                    100
                  }%`,
                }}
              />
            )}

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

              <PublicRichText
                value={content}
                className="
                  text-[13px]
                  leading-[1.8]

                  sm:text-[14px]
                "
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
