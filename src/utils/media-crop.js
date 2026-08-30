/*
 * =========================================================
 * MEDIA CROP CORE
 * =========================================================
 *
 * Important:
 *
 * Crop metadata describes HOW the media should be displayed.
 * We do not create another physical image every time a user
 * changes the crop.
 *
 * Original Media
 *      ↓
 * crop metadata
 *      ↓
 * Admin / Public renderer
 *
 * This keeps Media reusable and avoids duplicated files.
 * =========================================================
 */

export const MEDIA_CROP_SHAPE = Object.freeze({
  RECTANGLE: "rectangle",
  CIRCLE: "circle",
});

export const MEDIA_CROP_MODE = Object.freeze({
  COVER: "cover",
  SQUARE: "square",
  AVATAR: "avatar",
  FREE: "free",
});

export const MEDIA_CROP_ASPECT = Object.freeze({
  COVER: 16 / 9,
  LANDSCAPE: 4 / 3,
  SQUARE: 1,
  PORTRAIT: 4 / 5,
  AVATAR: 1,
});

/*
 * =========================================================
 * PRESETS
 * =========================================================
 */

export const MEDIA_CROP_PRESETS = Object.freeze({
  cover: {
    mode: MEDIA_CROP_MODE.COVER,
    shape: MEDIA_CROP_SHAPE.RECTANGLE,
    aspect: MEDIA_CROP_ASPECT.COVER,
    label: "16:9",
  },

  "about-cover": {
    mode: MEDIA_CROP_MODE.COVER,
    shape: MEDIA_CROP_SHAPE.RECTANGLE,
    aspect: 4,
    label: "4:1",
  },

  landscape: {
    mode: MEDIA_CROP_MODE.COVER,
    shape: MEDIA_CROP_SHAPE.RECTANGLE,
    aspect: MEDIA_CROP_ASPECT.LANDSCAPE,
    label: "4:3",
  },

  square: {
    mode: MEDIA_CROP_MODE.SQUARE,
    shape: MEDIA_CROP_SHAPE.RECTANGLE,
    aspect: MEDIA_CROP_ASPECT.SQUARE,
    label: "1:1",
  },

  portrait: {
    mode: MEDIA_CROP_MODE.COVER,
    shape: MEDIA_CROP_SHAPE.RECTANGLE,
    aspect: MEDIA_CROP_ASPECT.PORTRAIT,
    label: "4:5",
  },

  avatar: {
    mode: MEDIA_CROP_MODE.AVATAR,
    shape: MEDIA_CROP_SHAPE.CIRCLE,
    aspect: MEDIA_CROP_ASPECT.AVATAR,
    label: "1:1",
  },
});

/*
 * =========================================================
 * DEFAULT
 * =========================================================
 */

export function createDefaultCropMetadata({ preset = "cover" } = {}) {
  const configuration = MEDIA_CROP_PRESETS[preset] || MEDIA_CROP_PRESETS.cover;

  return {
    mode: configuration.mode,

    shape: configuration.shape,

    aspect: configuration.aspect,

    crop: {
      x: 0,
      y: 0,
    },

    zoom: 1,

    rotation: 0,

    croppedArea: null,

    croppedAreaPixels: null,
  };
}

/*
 * =========================================================
 * NORMALIZE NUMBER
 * =========================================================
 */

function normalizeNumber(value, fallback) {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}

/*
 * =========================================================
 * NORMALIZE AREA
 * =========================================================
 */

function normalizeArea(value) {
  if (!value) {
    return null;
  }

  const x = normalizeNumber(value.x, null);

  const y = normalizeNumber(value.y, null);

  const width = normalizeNumber(value.width, null);

  const height = normalizeNumber(value.height, null);

  if (x === null || y === null || width === null || height === null) {
    return null;
  }

  return {
    x,
    y,
    width,
    height,
  };
}

/*
 * =========================================================
 * NORMALIZE CROP
 * =========================================================
 */

export function normalizeCropMetadata(value, { preset = "cover" } = {}) {
  const defaults = createDefaultCropMetadata({
    preset,
  });

  if (!value) {
    return defaults;
  }

  return {
    mode: value.mode || defaults.mode,

    shape: value.shape || defaults.shape,

    aspect: normalizeNumber(value.aspect, defaults.aspect),

    crop: {
      x: normalizeNumber(value.crop?.x, 0),

      y: normalizeNumber(value.crop?.y, 0),
    },

    zoom: Math.max(1, normalizeNumber(value.zoom, 1)),

    rotation: normalizeNumber(value.rotation, 0),

    croppedArea: normalizeArea(value.croppedArea),

    croppedAreaPixels: normalizeArea(value.croppedAreaPixels),
  };
}

/*
 * =========================================================
 * CREATE MEDIA REFERENCE
 * =========================================================
 *
 * Shared structure used by:
 *
 * featuredImage
 * cover
 * avatar
 * OG image (future)
 * etc.
 * =========================================================
 */

export function createCroppedMediaReference(
  media,
  crop,
  { preset = "cover" } = {},
) {
  if (!media?.id) {
    return null;
  }

  return {
    mediaId: media.id,

    alt: {
      th: media.alt?.th || "",

      en: media.alt?.en || "",
    },

    caption: {
      th: media.caption?.th || "",

      en: media.caption?.en || "",
    },

    crop: normalizeCropMetadata(crop, {
      preset,
    }),
  };
}

/*
 * =========================================================
 * CSS OBJECT POSITION
 * =========================================================
 *
 * Useful as a lightweight fallback when a component only
 * needs focal positioning and not pixel-perfect server crop.
 *
 * react-easy-crop uses a centered coordinate system.
 * We convert the resulting percentage area to a sensible
 * CSS focal point.
 * =========================================================
 */

export function cropMetadataToObjectPosition(cropMetadata) {
  const area = cropMetadata?.croppedArea;

  if (!area) {
    return "50% 50%";
  }

  const centerX = area.x + area.width / 2;

  const centerY = area.y + area.height / 2;

  const x = Math.max(0, Math.min(100, centerX));

  const y = Math.max(0, Math.min(100, centerY));

  return `${x}% ${y}%`;
}
