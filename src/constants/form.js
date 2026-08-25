export const FORM_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
};

export const FORM_STATUSES = Object.values(FORM_STATUS);

export const FORM_TYPE = {
  CONTACT: "contact",
  SURVEY: "survey",
  CAREER: "career",
  CUSTOM: "custom",
};

export const FORM_TYPES = Object.values(FORM_TYPE);

export const FORM_FIELD_TYPE = {
  TEXT: "text",
  TEXTAREA: "textarea",
  EMAIL: "email",
  PHONE: "phone",
  NUMBER: "number",

  SELECT: "select",
  RADIO: "radio",
  CHECKBOX: "checkbox",

  DATE: "date",

  FILE: "file",

  HEADING: "heading",
  PARAGRAPH: "paragraph",

  CONSENT: "consent",
};

export const FORM_FIELD_TYPES = Object.values(FORM_FIELD_TYPE);

export const FORM_SUBMISSION_STATUS = {
  NEW: "new",
  READ: "read",
  IN_PROGRESS: "in_progress",
  RESOLVED: "resolved",
  SPAM: "spam",
  ARCHIVED: "archived",
};

export const FORM_SUBMISSION_STATUSES = Object.values(FORM_SUBMISSION_STATUS);

export const FORM_FILE_ACCEPT = {
  RESUME: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],

  IMAGE: ["image/jpeg", "image/png", "image/webp"],
};

export const FORM_MAX_FIELDS = 100;

export const FORM_MAX_OPTIONS = 100;
