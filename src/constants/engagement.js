export const ENGAGEMENT_CONTENT_TYPE = {
  PUBLIC: "public",
  PROJECT: "project",
  AWARD: "award",
  PAGE: "page",
  NEWS: "news",
};

export const ENGAGEMENT_CONTENT_TYPES = Object.values(ENGAGEMENT_CONTENT_TYPE);

export const ENGAGEMENT_COLLECTIONS = {
  public: "publicContents",
  project: "projects",
  award: "awards",
  page: "pages",
  news: "news",
};

export const ENGAGEMENT_REACTION = {
  LIKE: "like",
};

export const VISITOR_COOKIE_NAME = "jsk_vid";

export const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const CONSENT_COOKIE_NAME = "jsk_consent";

export const CONSENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 180;
