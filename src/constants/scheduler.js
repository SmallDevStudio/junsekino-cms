export const SYSTEM_CRON_USER_ID = "system:cron";

export const SCHEDULED_CONTENT = {
  PROJECT: {
    key: "project",

    collectionGroup: "projects",
  },

  AWARD: {
    key: "award",

    collectionGroup: "awards",
  },

  PUBLIC: {
    key: "publicContent",

    collectionGroup: "publicContents",
  },

  PAGE: {
    key: "page",

    collectionGroup: "pages",
  },

  NEWS: {
    key: "news",

    collectionGroup: "news",
  },
};

export const SCHEDULED_CONTENT_TYPES = Object.values(SCHEDULED_CONTENT);

export const SCHEDULER_BATCH_LIMIT = 100;
