export const PUBLIC_CONTENT_STATUS = {
  DRAFT: "draft",
  REVIEW: "review",
  SCHEDULED: "scheduled",
  PUBLISHED: "published",
  ARCHIVED: "archived",
};

export const PUBLIC_CONTENT_STATUSES = Object.values(PUBLIC_CONTENT_STATUS);

export const PUBLIC_CONTENT_TYPE = {
  ARTICLE: "article",
  VIDEO: "video",
  EMBED: "embed",
};

export const PUBLIC_CONTENT_TYPES = Object.values(PUBLIC_CONTENT_TYPE);

export const PUBLIC_PROVIDER = {
  YOUTUBE: "youtube",
  FACEBOOK: "facebook",
  VIMEO: "vimeo",
  INSTAGRAM: "instagram",
  TIKTOK: "tiktok",
  OTHER: "other",
};

export const PUBLIC_PROVIDERS = Object.values(PUBLIC_PROVIDER);

export const DEFAULT_PUBLIC_SEO = {
  th: {
    title: "",
    description: "",
    keywords: [],
    ogTitle: "",
    ogDescription: "",
    ogImage: null,
  },

  en: {
    title: "",
    description: "",
    keywords: [],
    ogTitle: "",
    ogDescription: "",
    ogImage: null,
  },

  index: true,
  follow: true,
};
