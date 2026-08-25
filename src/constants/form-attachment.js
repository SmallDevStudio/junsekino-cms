export const FORM_ATTACHMENT_STATUS = {
  UPLOADING: "uploading",
  READY: "ready",
  ATTACHED: "attached",
  FAILED: "failed",
  DELETED: "deleted",
};

export const FORM_ATTACHMENT_ALLOWED_MIME_TYPES = [
  "application/pdf",

  "application/msword",

  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  "image/jpeg",
  "image/png",
  "image/webp",
];

export const FORM_ATTACHMENT_MAX_SIZE = 15 * 1024 * 1024;

export const FORM_ATTACHMENT_UPLOAD_EXPIRES_MS = 10 * 60 * 1000;

export const FORM_ATTACHMENT_READ_EXPIRES_MS = 5 * 60 * 1000;
