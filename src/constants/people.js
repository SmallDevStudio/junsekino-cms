export const PEOPLE_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
};

export const PEOPLE_STATUSES = Object.values(PEOPLE_STATUS);

export const PEOPLE_TYPE = {
  MANAGEMENT: "management",
  ARCHITECT: "architect",
  DESIGNER: "designer",
  STAFF: "staff",
  OTHER: "other",
};

export const PEOPLE_TYPES = Object.values(PEOPLE_TYPE);

export const DEFAULT_PEOPLE_SEO = {
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
