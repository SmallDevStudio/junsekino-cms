/*
 * =========================================================
 * CONTENT COVER PRESETS
 * =========================================================
 *
 * Shared visual presentation rules.
 *
 * Media originals are never physically cropped.
 * These presets control usage-level presentation only.
 * =========================================================
 */

export const CONTENT_COVER_PRESET = Object.freeze({
  PAGE: {
    key: "page",

    /*
     * Contact reference is approximately 1.7 : 1.
     *
     * About and Contact intentionally share this
     * same visual proportion.
     */
    aspectRatio: 1.7,

    aspectClass: "aspect-[17/10]",

    objectFit: "cover",

    cropShape: "rect",
  },

  PROJECT: {
    key: "project",

    aspectRatio: 1,

    aspectClass: "aspect-square",

    objectFit: "cover",

    cropShape: "rect",
  },

  AVATAR: {
    key: "avatar",

    aspectRatio: 1,

    aspectClass: "aspect-square",

    objectFit: "cover",

    cropShape: "circle",
  },
});

export function getContentCoverPreset(key = "page") {
  const normalized = String(key).toUpperCase();

  return CONTENT_COVER_PRESET[normalized] || CONTENT_COVER_PRESET.PAGE;
}
