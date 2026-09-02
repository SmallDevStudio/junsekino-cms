"use client";

import { Cookie, LoaderCircle, ShieldCheck, X } from "lucide-react";

import { useState } from "react";

import { useConsent } from "./ConsentProvider";

/*
 * =========================================================
 * CONSTANTS
 * =========================================================
 */

const CATEGORY_KEYS = ["necessary", "analytics", "functional", "marketing"];

const FALLBACK_TEXT = {
  en: {
    title: "Cookie Preferences",

    description:
      "Choose which optional cookies this website may use. Necessary cookies cannot be disabled.",

    save: "Save Preferences",

    close: "Close cookie preferences",

    launcher: "Cookie Settings",

    necessary: {
      title: "Necessary Cookies",

      description: "Required for security and essential website functionality.",
    },

    analytics: {
      title: "Analytics Cookies",

      description: "Help us understand website usage and improve performance.",
    },

    functional: {
      title: "Functional Cookies",

      description:
        "Remember settings and provide optional website functionality.",
    },

    marketing: {
      title: "Marketing Cookies",

      description:
        "May be used for campaign measurement and personalized content.",
    },

    required: "Always active",

    optional: "Optional",

    saveFailed: "Unable to save cookie preferences. Please try again.",
  },

  th: {
    title: "ตั้งค่าคุกกี้",

    description:
      "เลือกประเภทคุกกี้ทางเลือกที่เว็บไซต์สามารถใช้งานได้ คุกกี้ที่จำเป็นไม่สามารถปิดได้",

    save: "บันทึกการตั้งค่า",

    close: "ปิดการตั้งค่าคุกกี้",

    launcher: "ตั้งค่าคุกกี้",

    necessary: {
      title: "คุกกี้ที่จำเป็น",

      description: "จำเป็นต่อความปลอดภัยและการทำงานพื้นฐานของเว็บไซต์",
    },

    analytics: {
      title: "คุกกี้เพื่อการวิเคราะห์",

      description: "ช่วยให้เราเข้าใจการใช้งานและปรับปรุงประสิทธิภาพเว็บไซต์",
    },

    functional: {
      title: "คุกกี้เพื่อการทำงาน",

      description: "จดจำการตั้งค่าและเปิดใช้งานความสามารถเพิ่มเติมของเว็บไซต์",
    },

    marketing: {
      title: "คุกกี้เพื่อการตลาด",

      description: "อาจใช้สำหรับการวัดผลแคมเปญและการนำเสนอเนื้อหาที่เหมาะสม",
    },

    required: "เปิดใช้งานเสมอ",

    optional: "ทางเลือก",

    saveFailed: "ไม่สามารถบันทึกการตั้งค่าคุกกี้ได้ กรุณาลองใหม่อีกครั้ง",
  },
};

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function resolveLocalizedText(
  value,

  language,

  fallback,
) {
  if (!value) {
    return fallback;
  }

  if (typeof value === "string") {
    return value || fallback;
  }

  return value?.[language] || value?.en || value?.th || fallback;
}

/*
 * =========================================================
 * TOGGLE
 * =========================================================
 */

function CategoryToggle({
  checked,

  disabled,

  onChange,

  label,
}) {
  return (
    <label
      className={`
        relative
        inline-flex
        shrink-0

        ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}
      `}
      aria-label={label}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />

      <span
        className="
          h-6
          w-11

          rounded-full

          bg-[var(--public-border)]

          transition-colors

          peer-checked:bg-[var(--public-primary)]

          peer-focus-visible:ring-2
          peer-focus-visible:ring-[var(--public-primary)]
          peer-focus-visible:ring-offset-2
        "
      />

      <span
        className="
          pointer-events-none

          absolute
          left-1
          top-1

          h-4
          w-4

          rounded-full

          bg-white

          shadow-sm

          transition-transform

          peer-checked:translate-x-5
        "
      />
    </label>
  );
}

/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

export default function CookiePreferences({ locale = "th" }) {
  const {
    loading,

    consent,

    showBanner,

    preferencesOpen,

    setPreferencesOpen,

    privacySettings,

    saveConsent,

    openPreferences,
  } = useConsent();

  /*
   * null means the visitor has not changed
   * anything during the current modal session.
   *
   * The current saved consent is used until the
   * first category is changed.
   */
  const [draftConsent, setDraftConsent] = useState(null);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const language = locale === "en" ? "en" : "th";

  const text = FALLBACK_TEXT[language];

  const categories = privacySettings?.categories || {};

  const banner = privacySettings?.cookieBanner?.[language] || {};

  const value = draftConsent || consent;

  const showPreferences = privacySettings?.showPreferences !== false;

  /*
   * =======================================================
   * ACTIONS
   * =======================================================
   */

  function setCategory(key, enabled) {
    setError("");

    setDraftConsent((previous) => ({
      ...(previous || consent),

      necessary: true,

      [key]: enabled,
    }));
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setDraftConsent(null);

    setError("");

    setPreferencesOpen(false);
  }

  async function handleSave() {
    if (saving) {
      return;
    }

    try {
      setSaving(true);

      setError("");

      await saveConsent(
        {
          necessary: true,

          analytics:
            value.analytics === true && categories.analytics?.enabled !== false,

          functional:
            value.functional === true &&
            categories.functional?.enabled !== false,

          marketing:
            value.marketing === true && categories.marketing?.enabled === true,
        },

        "cookie_preferences",
      );

      setDraftConsent(null);
    } catch (saveError) {
      console.error("Save cookie preferences error:", saveError);

      setError(saveError?.message || text.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  /*
   * =======================================================
   * PERSISTENT LAUNCHER
   * =======================================================
   */

  if (!preferencesOpen) {
    if (loading || showBanner || !showPreferences) {
      return null;
    }

    return (
      <button
        type="button"
        onClick={openPreferences}
        aria-label={text.launcher}
        title={text.launcher}
        className="
          fixed
          bottom-5
          left-5

          z-[9000]

          inline-flex
          h-11
          items-center
          justify-center
          gap-2

          rounded-full

          border
          border-[var(--public-border)]

          bg-[var(--public-surface)]

          px-4

          text-xs
          font-medium

          text-[var(--public-foreground)]

          shadow-lg

          transition

          hover:border-[var(--public-primary)]
          hover:text-[var(--public-primary)]

          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-[var(--public-primary)]
          focus-visible:ring-offset-2
        "
      >
        <Cookie size={16} aria-hidden="true" />

        <span className="hidden sm:inline">
          {banner.preferences || text.launcher}
        </span>
      </button>
    );
  }

  /*
   * =======================================================
   * MODAL
   * =======================================================
   */

  return (
    <div
      className="
        fixed
        inset-0

        z-[10000]

        flex
        items-center
        justify-center

        bg-black/55

        p-4

        backdrop-blur-sm
      "
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closeModal();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-preferences-title"
        aria-describedby="cookie-preferences-description"
        className="
          max-h-[90vh]
          w-full
          max-w-2xl

          overflow-y-auto

          rounded-2xl

          border
          border-[var(--public-border)]

          bg-[var(--public-surface)]

          text-[var(--public-foreground)]

          shadow-2xl
        "
      >
        {/* =================================
            HEADER
        ================================= */}

        <div
          className="
            flex
            items-start
            justify-between
            gap-4

            border-b
            border-[var(--public-border)]

            px-5
            py-5

            sm:px-6
          "
        >
          <div className="flex items-start gap-3">
            <div
              className="
                flex
                h-10
                w-10
                shrink-0

                items-center
                justify-center

                rounded-xl

                bg-[color-mix(in_srgb,var(--public-primary)_12%,transparent)]

                text-[var(--public-primary)]
              "
            >
              <ShieldCheck size={18} aria-hidden="true" />
            </div>

            <div>
              <h2
                id="cookie-preferences-title"
                className="
                  text-lg
                  font-semibold
                "
              >
                {text.title}
              </h2>

              <p
                id="cookie-preferences-description"
                className="
                  mt-1

                  text-sm
                  leading-6

                  text-[var(--public-muted-foreground)]
                "
              >
                {text.description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeModal}
            disabled={saving}
            aria-label={text.close}
            className="
              flex
              h-9
              w-9
              shrink-0

              items-center
              justify-center

              rounded-lg

              text-[var(--public-muted-foreground)]

              transition

              hover:bg-[var(--public-background)]
              hover:text-[var(--public-foreground)]

              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* =================================
            CATEGORIES
        ================================= */}

        <div
          className="
            grid
            gap-3

            px-5
            py-5

            sm:px-6
          "
        >
          {CATEGORY_KEYS.map((key) => {
            const category = categories[key];

            /*
             * Necessary cookies are always shown.
             *
             * Optional categories disabled by the
             * company are not offered to visitors.
             */
            if (
              key !== "necessary" &&
              (!category || category.enabled === false)
            ) {
              return null;
            }

            const fallbackCategory = text[key];

            const required = key === "necessary" || category?.required === true;

            const title = resolveLocalizedText(
              category?.title,

              language,

              fallbackCategory.title,
            );

            const description = resolveLocalizedText(
              category?.description,

              language,

              fallbackCategory.description,
            );

            return (
              <div
                key={key}
                className="
                  rounded-xl

                  border
                  border-[var(--public-border)]

                  bg-[var(--public-background)]

                  p-4
                "
              >
                <div
                  className="
                    flex
                    items-start
                    justify-between
                    gap-4
                  "
                >
                  <div className="min-w-0">
                    <div className="font-semibold">{title}</div>

                    <div
                      className="
                        mt-1

                        text-xs
                        font-medium

                        text-[var(--public-primary)]
                      "
                    >
                      {required ? text.required : text.optional}
                    </div>
                  </div>

                  <CategoryToggle
                    checked={required ? true : value[key] === true}
                    disabled={required}
                    onChange={(enabled) => setCategory(key, enabled)}
                    label={title}
                  />
                </div>

                <p
                  className="
                    mt-3

                    text-sm
                    leading-6

                    text-[var(--public-muted-foreground)]
                  "
                >
                  {description}
                </p>
              </div>
            );
          })}

          {error ? (
            <div
              role="alert"
              className="
                rounded-xl

                border
                border-red-300/60

                bg-red-500/10

                px-4
                py-3

                text-sm
                text-red-600
              "
            >
              {error}
            </div>
          ) : null}
        </div>

        {/* =================================
            FOOTER
        ================================= */}

        <div
          className="
            flex
            flex-col-reverse
            gap-2

            border-t
            border-[var(--public-border)]

            bg-[var(--public-background)]

            px-5
            py-4

            sm:flex-row
            sm:justify-end
            sm:px-6
          "
        >
          <button
            type="button"
            onClick={closeModal}
            disabled={saving}
            className="
              min-h-10

              rounded-lg

              border
              border-[var(--public-border)]

              px-4

              text-sm
              font-medium

              transition

              hover:bg-[var(--public-surface)]

              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {language === "th" ? "ยกเลิก" : "Cancel"}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="
              inline-flex
              min-h-10
              items-center
              justify-center
              gap-2

              rounded-lg

              bg-[var(--public-primary)]

              px-5

              text-sm
              font-semibold

              text-white

              transition

              hover:opacity-85

              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {saving ? (
              <LoaderCircle
                size={16}
                className="animate-spin"
                aria-hidden="true"
              />
            ) : null}

            {saving
              ? language === "th"
                ? "กำลังบันทึก..."
                : "Saving..."
              : banner.savePreferences || text.save}
          </button>
        </div>
      </div>
    </div>
  );
}
