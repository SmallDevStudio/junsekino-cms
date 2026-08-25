"use client";

import { useConsent } from "./ConsentProvider";

export default function CookieBanner({ locale = "th" }) {
  const {
    loading,
    showBanner,
    privacySettings,
    acceptAll,
    necessaryOnly,
    openPreferences,
  } = useConsent();

  if (loading || !showBanner) {
    return null;
  }

  const language = locale === "en" ? "en" : "th";

  const banner = privacySettings?.cookieBanner?.[language];

  if (!banner) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={banner.title}
      className="
        fixed
        bottom-0
        left-0
        right-0
        z-[9999]
        border-t
        border-neutral-200
        bg-white
        px-5
        py-5
        text-neutral-950
        shadow-2xl
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
        <div
          className="
            max-w-3xl
          "
        >
          <h2
            className="
              text-lg
              font-semibold
            "
          >
            {banner.title}
          </h2>

          <p
            className="
              mt-2
              text-sm
              leading-6
              text-neutral-600
            "
          >
            {banner.description}
          </p>
        </div>

        <div
          className="
            flex
            flex-wrap
            gap-2
          "
        >
          <button
            type="button"
            onClick={necessaryOnly}
            className="
              rounded-md
              border
              border-neutral-300
              px-4
              py-2
              text-sm
            "
          >
            {banner.rejectOptional}
          </button>

          <button
            type="button"
            onClick={openPreferences}
            className="
              rounded-md
              border
              border-neutral-300
              px-4
              py-2
              text-sm
            "
          >
            {banner.preferences}
          </button>

          <button
            type="button"
            onClick={acceptAll}
            className="
              rounded-md
              bg-black
              px-4
              py-2
              text-sm
              text-white
            "
          >
            {banner.acceptAll}
          </button>
        </div>
      </div>
    </div>
  );
}
