export const NEWS_STATUS = {
  DRAFT: "draft",
  REVIEW: "review",
  SCHEDULED: "scheduled",
  PUBLISHED: "published",
  ARCHIVED: "archived",
};

export const NEWS_STATUSES = Object.values(NEWS_STATUS);

export const DEFAULT_NEWS_SEO = {
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
