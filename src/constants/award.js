export const AWARD_STATUS = {
  DRAFT: "draft",
  REVIEW: "review",
  SCHEDULED: "scheduled",
  PUBLISHED: "published",
  ARCHIVED: "archived",
};

export const AWARD_STATUSES = Object.values(AWARD_STATUS);

export const DEFAULT_AWARD_SEO = {
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
