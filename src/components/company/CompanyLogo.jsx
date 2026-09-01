"use client";

import Image from "next/image";

import { useMemo, useState } from "react";

import { cn } from "@/utils/cn";

function normalizeText(value) {
  return String(value || "").trim();
}

function resolveCompanySuffix(company) {
  const shortName = normalizeText(company?.shortName);

  if (shortName) {
    return shortName.replace(/^junsekino\s*/i, "").trim();
  }

  return normalizeText(company?.name)
    .replace(/^junsekino\s*/i, "")
    .trim();
}

function resolveTextLogo(company) {
  const branding = company?.branding || {};

  const textLogo = branding.textLogo || {};

  const text =
    normalizeText(textLogo.text) ||
    normalizeText(company?.brandName) ||
    "JUNSEKINO";

  const highlight =
    normalizeText(textLogo.highlight) ||
    normalizeText(company?.brandSuffix) ||
    resolveCompanySuffix(company);

  const separator =
    textLogo.separator !== undefined ? String(textLogo.separator) : " ";

  return {
    text,

    highlight,

    separator,
  };
}

function resolveMediaId(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value.trim() || null;
  }

  return value.mediaId || value.id || null;
}

function resolveMediaReference(company, variant) {
  const branding = company?.branding || {};

  const lightLogo = branding.logoLight || null;

  const darkLogo = branding.logoDark || null;

  const preferred =
    variant === "dark" ? darkLogo || lightLogo : lightLogo || darkLogo;

  if (!preferred) {
    return null;
  }

  return {
    value: preferred,

    mediaId: resolveMediaId(preferred),
  };
}

function resolveLocalized(value, locale = "en") {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return value?.[locale] || value?.en || value?.th || "";
}

function createPublicMediaUrl({
  companySlug,

  mediaId,

  variant = "large",
}) {
  if (!companySlug || !mediaId) {
    return null;
  }

  return `/api/public/v1/companies/${encodeURIComponent(
    companySlug,
  )}/media/${encodeURIComponent(
    mediaId,
  )}?variant=${encodeURIComponent(variant)}`;
}

export default function CompanyLogo({
  company,

  companySlug = "",

  variant = "light",

  locale = "en",

  imageUrl = null,

  imageVariant = "large",

  className,

  imageClassName,

  textClassName,

  mainTextClassName,

  highlightClassName,

  fallback = true,

  priority = false,
}) {
  const branding = company?.branding || {};

  const logoMode = ["auto", "image", "text"].includes(branding.logoMode)
    ? branding.logoMode
    : "auto";

  const mediaReference = useMemo(
    () => resolveMediaReference(company, variant),
    [company, variant],
  );

  const resolvedImageUrl =
    imageUrl ||
    createPublicMediaUrl({
      companySlug,

      mediaId: mediaReference?.mediaId,

      variant: imageVariant,
    });

  const textLogo = useMemo(() => resolveTextLogo(company), [company]);

  const [failedImageUrl, setFailedImageUrl] = useState(null);

  const imageFailed =
    Boolean(resolvedImageUrl) && failedImageUrl === resolvedImageUrl;

  const useTextLogo = logoMode === "text" || !resolvedImageUrl || imageFailed;

  const imageAlt =
    resolveLocalized(mediaReference?.value?.alt, locale) ||
    company?.name ||
    textLogo.text ||
    "Company logo";

  if (!useTextLogo) {
    return (
      <span
        className={cn(
          `
            relative
            inline-flex
            h-8
            max-w-[260px]
            items-end
          `,

          className,
        )}
      >
        <Image
          src={resolvedImageUrl}
          alt={imageAlt}
          width={360}
          height={96}
          sizes="260px"
          unoptimized
          priority={priority}
          onError={() => {
            setFailedImageUrl(resolvedImageUrl);
          }}
          className={cn(
            `
              h-full
              w-auto
              max-w-full
              object-contain
              object-left-bottom
            `,

            imageClassName,
          )}
        />
      </span>
    );
  }

  if (!fallback) {
    return null;
  }

  return (
    <span
      className={cn(
        `
          inline-flex
          items-baseline
          whitespace-nowrap
          leading-none
        `,

        textClassName,

        className,
      )}
      aria-label={
        [textLogo.text, textLogo.highlight]
          .filter(Boolean)
          .join(textLogo.separator || " ") ||
        company?.name ||
        "Company"
      }
    >
      {textLogo.text ? (
        <span
          className={cn(
            `
              inline-block
              font-normal
              tracking-[0.085em]
              text-[#111111]
              pr-1
            `,

            mainTextClassName,
          )}
        >
          {textLogo.text}
        </span>
      ) : null}

      {textLogo.highlight ? (
        <>
          {textLogo.separator ? (
            <span aria-hidden="true" className="inline-block text-[#111111]">
              {textLogo.separator}
            </span>
          ) : null}

          <span
            className={cn(
              `
                inline-block
                font-semibold
                tracking-[-0.035em]
                text-[var(--public-primary,var(--company-primary,#111111))]
              `,

              highlightClassName,
            )}
          >
            {textLogo.highlight}
          </span>
        </>
      ) : null}
    </span>
  );
}
