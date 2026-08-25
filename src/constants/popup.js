export const POPUP_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
};

export const POPUP_STATUSES = Object.values(POPUP_STATUS);

export const POPUP_TYPE = {
  ANNOUNCEMENT: "announcement",

  PROMOTION: "promotion",

  IMAGE: "image",

  CTA: "cta",

  FORM: "form",
};

export const POPUP_TYPES = Object.values(POPUP_TYPE);

export const POPUP_TRIGGER = {
  IMMEDIATE: "immediate",

  DELAY: "delay",

  SCROLL: "scroll",

  EXIT_INTENT: "exit_intent",
};

export const POPUP_TRIGGERS = Object.values(POPUP_TRIGGER);

export const POPUP_FREQUENCY = {
  EVERY_VISIT: "every_visit",

  ONCE_PER_SESSION: "once_per_session",

  ONCE_PER_DAY: "once_per_day",

  ONCE_EVER: "once_ever",
};

export const POPUP_FREQUENCIES = Object.values(POPUP_FREQUENCY);

export const POPUP_ACTION_TYPE = {
  NONE: "none",
  LINK: "link",
  FORM: "form",
};

export const POPUP_ACTION_TYPES = Object.values(POPUP_ACTION_TYPE);
