export const PROJECT_STATUS = {
  DRAFT: "draft",
  REVIEW: "review",
  SCHEDULED: "scheduled",
  PUBLISHED: "published",
  ARCHIVED: "archived",
};

export const PROJECT_STATUSES = Object.values(PROJECT_STATUS);

export const PROJECT_SORT = {
  NEWEST: "newest",
  OLDEST: "oldest",
  TITLE_ASC: "title_asc",
  TITLE_DESC: "title_desc",
};

export const DEFAULT_PROJECT_SEO = {
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
