export const PAGE_STATUS = {
  DRAFT: "draft",
  REVIEW: "review",
  SCHEDULED: "scheduled",
  PUBLISHED: "published",
  ARCHIVED: "archived",
};

export const PAGE_STATUSES = Object.values(PAGE_STATUS);

export const PAGE_TYPE = {
  STANDARD: "standard",
  ABOUT: "about",
  CONTACT: "contact",
  SERVICES: "services",
  STUDIO: "studio",
  AWARDS: "awards",
  CUSTOM: "custom",
};

export const PAGE_TYPES = Object.values(PAGE_TYPE);

export const DEFAULT_PAGE_SEO = {
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
