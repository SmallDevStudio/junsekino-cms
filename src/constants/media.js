export const MEDIA_STATUS = {
  UPLOADING: "uploading",
  PROCESSING: "processing",
  READY: "ready",
  FAILED: "failed",
  ARCHIVED: "archived",
};

export const MEDIA_TYPE = {
  IMAGE: "image",
};

export const MEDIA_USAGE = {
  GENERAL: "general",
  LOGO: "logo",
  BRANDING: "branding",
  PAGE: "page",
  PROJECT: "project",
  AWARD: "award",
  PUBLIC: "public",
  PEOPLE: "people",
};

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

export const MAX_MEDIA_FILE_SIZE = 25 * 1024 * 1024;

export const MEDIA_UPLOAD_URL_EXPIRES_MS = 10 * 60 * 1000;

export const MEDIA_READ_URL_EXPIRES_MS = 5 * 60 * 1000;

/*
 * Public website variants.
 *
 * Original images are never exposed
 * through the public media endpoint.
 */
export const MEDIA_VARIANTS = {
  THUMBNAIL: {
    key: "thumbnail",
    width: 400,
    quality: 78,
  },

  MEDIUM: {
    key: "medium",
    width: 1200,
    quality: 82,
  },

  LARGE: {
    key: "large",
    width: 2000,
    quality: 84,
  },
};

export const MEDIA_VARIANT_KEYS = Object.values(MEDIA_VARIANTS).map(
  (variant) => variant.key,
);

export const MEDIA_PUBLIC_URL_EXPIRES_MS = 15 * 60 * 1000;
