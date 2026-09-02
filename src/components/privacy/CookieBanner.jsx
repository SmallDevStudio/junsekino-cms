"use client";

import { useState } from "react";

import { usePathname } from "next/navigation";

import { LoaderCircle } from "lucide-react";

import { useConsent } from "./ConsentProvider";

/*
 * =========================================================
 * FALLBACK
 * =========================================================
 */

const FALLBACK_BANNER = {
  en: {
    title: "We value your privacy",

    description:
      "This website uses necessary cookies and optional technologies to provide functionality, analyze usage and improve your experience.",

    acceptAll: "Accept All",

    rejectOptional: "Necessary Only",

    preferences: "Cookie Settings",

    privacyLink: "Privacy Notice",

    cookieLink: "Cookie Policy",
  },

  th: {
    title: "เราให้ความสำคัญกับความเป็นส่วนตัวของคุณ",

    description:
      "เว็บไซต์นี้ใช้คุกกี้ที่จำเป็นและเทคโนโลยีทางเลือกเพื่อให้บริการ วิเคราะห์การใช้งาน และปรับปรุงประสบการณ์ของคุณ",

    acceptAll: "ยอมรับทั้งหมด",

    rejectOptional: "เฉพาะที่จำเป็น",

    preferences: "ตั้งค่าคุกกี้",

    privacyLink: "ประกาศความเป็นส่วนตัว",

    cookieLink: "นโยบายคุกกี้",
  },
};

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function getCompanySlug(pathname) {
  const value = String(pathname || "")
    .split("/")
    .filter(Boolean)[0];

  if (!value) {
    return null;
  }

  return value;
}

function createLegalHref({
  companySlug,

  type,

  language,
}) {
  if (!companySlug) {
    return null;
  }

  const query = language === "th" ? "?lang=th" : "";

  return `/${encodeURIComponent(
    companySlug,
  )}/legal/${encodeURIComponent(type)}${query}`;
}

/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

export default function CookieBanner({ locale = "th" }) {
  const pathname = usePathname();

  const {
    loading,

    showBanner,

    privacySettings,

    acceptAll,

    necessaryOnly,

    openPreferences,
  } = useConsent();

  const [savingAction, setSavingAction] = useState(null);

  if (loading || !showBanner) {
    return null;
  }

  const language = locale === "en" ? "en" : "th";

  const banner = {
    ...FALLBACK_BANNER[language],

    ...(privacySettings?.cookieBanner?.[language] || {}),
  };

  const companySlug = getCompanySlug(pathname);

  const privacyHref = createLegalHref({
    companySlug,

    type: "privacy",

    language,
  });

  const cookieHref = createLegalHref({
    companySlug,

    type: "cookies",

    language,
  });

  const allowRejectOptional = privacySettings?.allowRejectOptional !== false;

  const showPreferences = privacySettings?.showPreferences !== false;

  async function handleAction(action, callback) {
    if (savingAction) {
      return;
    }

    try {
      setSavingAction(action);

      await callback();
    } catch (error) {
      console.error("Save cookie consent error:", error);
    } finally {
      setSavingAction(null);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={banner.title}
      className="
        fixed
        bottom-0
        left-0
        right-0

        z-[9999]

        border-t
        border-[var(--public-border)]

        bg-[var(--public-surface)]

        px-5
        py-5

        text-[var(--public-foreground)]

        shadow-[0_-12px_40px_rgba(0,0,0,0.12)]
      "
    >
      <div
        className="
          mx-auto

          flex
          max-w-7xl
          flex-col
          gap-5

          lg:flex-row
          lg:items-end
          lg:justify-between
        "
      >
        <div className="max-w-3xl">
          <h2 className="text-lg font-semibold">{banner.title}</h2>

          <p
            className="
              mt-2

              text-sm
              leading-6

              text-[var(--public-muted-foreground)]
            "
          >
            {banner.description}
          </p>

          {(privacyHref || cookieHref) && (
            <div
              className="
                mt-3

                flex
                flex-wrap
                items-center
                gap-x-4
                gap-y-2

                text-[11px]
                font-medium
              "
            >
              {privacyHref && (
                <a
                  href={privacyHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    underline
                    decoration-[var(--public-border)]
                    underline-offset-4

                    transition-colors

                    hover:text-[var(--public-primary)]
                    hover:decoration-[var(--public-primary)]

                    focus-visible:outline-2
                    focus-visible:outline-offset-2
                    focus-visible:outline-[var(--public-primary)]
                  "
                >
                  {banner.privacyLink}
                </a>
              )}

              {cookieHref && (
                <a
                  href={cookieHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    underline
                    decoration-[var(--public-border)]
                    underline-offset-4

                    transition-colors

                    hover:text-[var(--public-primary)]
                    hover:decoration-[var(--public-primary)]

                    focus-visible:outline-2
                    focus-visible:outline-offset-2
                    focus-visible:outline-[var(--public-primary)]
                  "
                >
                  {banner.cookieLink}
                </a>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {allowRejectOptional ? (
            <button
              type="button"
              disabled={Boolean(savingAction)}
              onClick={() =>
                handleAction(
                  "necessary",

                  necessaryOnly,
                )
              }
              className="
                inline-flex
                min-h-10
                items-center
                justify-center
                gap-2

                rounded-lg

                border
                border-[var(--public-border)]

                px-4

                text-sm
                font-medium

                transition

                hover:bg-[var(--public-background)]

                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {savingAction === "necessary" ? (
                <LoaderCircle size={15} className="animate-spin" />
              ) : null}

              {banner.rejectOptional}
            </button>
          ) : null}

          {showPreferences ? (
            <button
              type="button"
              disabled={Boolean(savingAction)}
              onClick={openPreferences}
              className="
                min-h-10

                rounded-lg

                border
                border-[var(--public-border)]

                px-4

                text-sm
                font-medium

                transition

                hover:bg-[var(--public-background)]

                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {banner.preferences}
            </button>
          ) : null}

          <button
            type="button"
            disabled={Boolean(savingAction)}
            onClick={() =>
              handleAction(
                "accept",

                acceptAll,
              )
            }
            className="
              inline-flex
              min-h-10
              items-center
              justify-center
              gap-2

              rounded-lg

              bg-[var(--public-primary)]

              px-4

              text-sm
              font-semibold

              text-white

              transition

              hover:opacity-85

              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {savingAction === "accept" ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : null}

            {banner.acceptAll}
          </button>
        </div>
      </div>
    </div>
  );
}
