"use client";

import { useState } from "react";

import { useConsent } from "./ConsentProvider";

export default function CookiePreferences({ locale = "th" }) {
  const {
    consent,
    preferencesOpen,
    setPreferencesOpen,
    privacySettings,
    saveConsent,
  } = useConsent();

  /*
   * null = ยังไม่ได้แก้ preference ใน modal
   * เมื่อ modal เปิด จะ fallback ไปใช้ consent ปัจจุบัน
   *
   * แบบนี้ไม่ต้อง sync state ผ่าน useEffect
   */
  const [draftConsent, setDraftConsent] = useState(null);

  if (!preferencesOpen) {
    return null;
  }

  const language = locale === "en" ? "en" : "th";

  const categories = privacySettings?.categories || {};

  const banner = privacySettings?.cookieBanner?.[language];

  const value = draftConsent || consent;

  const setCategory = (key, enabled) => {
    setDraftConsent((previous) => ({
      ...(previous || consent),

      [key]: enabled,
    }));
  };

  const closeModal = () => {
    setDraftConsent(null);

    setPreferencesOpen(false);
  };

  const handleSave = async () => {
    await saveConsent(value, "cookie_preferences");

    setDraftConsent(null);
  };

  return (
    <div
      className="
        fixed
        inset-0
        z-[10000]
        flex
        items-center
        justify-center
        bg-black/50
        p-4
      "
    >
      <div
        role="dialog"
        aria-modal="true"
        className="
          max-h-[90vh]
          w-full
          max-w-2xl
          overflow-y-auto
          rounded-xl
          bg-white
          p-6
          text-black
          shadow-2xl
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
          <h2
            className="
              text-xl
              font-semibold
            "
          >
            {language === "th" ? "ตั้งค่าคุกกี้" : "Cookie Preferences"}
          </h2>

          <button type="button" onClick={closeModal} aria-label="Close">
            ✕
          </button>
        </div>

        <div
          className="
            mt-6
            space-y-4
          "
        >
          {["necessary", "analytics", "functional", "marketing"].map((key) => {
            const category = categories[key];

            if (!category) {
              return null;
            }

            const required = category.required === true;

            return (
              <div
                key={key}
                className="
                    rounded-lg
                    border
                    border-neutral-200
                    p-4
                  "
              >
                <div
                  className="
                      flex
                      items-center
                      justify-between
                      gap-4
                    "
                >
                  <strong>{category.title?.[language]}</strong>

                  <input
                    type="checkbox"
                    checked={required ? true : value[key] === true}
                    disabled={required}
                    onChange={(event) => setCategory(key, event.target.checked)}
                  />
                </div>

                <p
                  className="
                      mt-2
                      text-sm
                      leading-6
                      text-neutral-600
                    "
                >
                  {category.description?.[language]}
                </p>
              </div>
            );
          })}
        </div>

        <div
          className="
            mt-6
            flex
            justify-end
          "
        >
          <button
            type="button"
            onClick={handleSave}
            className="
              rounded-md
              bg-black
              px-5
              py-2.5
              text-sm
              text-white
            "
          >
            {banner?.savePreferences ||
              (language === "th" ? "บันทึกการตั้งค่า" : "Save Preferences")}
          </button>
        </div>
      </div>
    </div>
  );
}
