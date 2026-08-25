import "server-only";

import path from "node:path";

import {
  FORM_ATTACHMENT_ALLOWED_MIME_TYPES,
  FORM_ATTACHMENT_MAX_SIZE,
  FORM_ATTACHMENT_READ_EXPIRES_MS,
  FORM_ATTACHMENT_UPLOAD_EXPIRES_MS,
} from "@/constants/form-attachment";

import { getMediaBucket } from "@/lib/firebase/storage";

import {
  createAttachmentRef,
  createPendingAttachment,
  getAttachmentById,
  markAttachmentFailed,
  markAttachmentReady,
} from "./form-attachment.repository";

import { getFormBySlug } from "./form.repository";

import { serializeFirestoreDocument } from "@/utils/firestore";

function sanitizeFileName(fileName) {
  const extension = path.extname(fileName).toLowerCase();

  const base =
    path
      .basename(fileName, extension)
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 100) || "attachment";

  return `${base}${extension}`;
}

function validateMimeType(mimeType) {
  if (!FORM_ATTACHMENT_ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error("FORM_ATTACHMENT_TYPE_NOT_ALLOWED");
  }
}

function validateFileSize(size) {
  if (!Number.isInteger(size) || size <= 0) {
    throw new Error("FORM_ATTACHMENT_INVALID_SIZE");
  }

  if (size > FORM_ATTACHMENT_MAX_SIZE) {
    throw new Error("FORM_ATTACHMENT_TOO_LARGE");
  }
}

function validateFormField({ form, fieldId, mimeType, size }) {
  const field = (form.fields || []).find(
    (item) => item.id === fieldId && item.enabled !== false,
  );

  if (!field || field.type !== "file") {
    throw new Error("FORM_ATTACHMENT_FIELD_NOT_FOUND");
  }

  const allowed = field.validation?.allowedMimeTypes || [];

  if (allowed.length > 0 && !allowed.includes(mimeType)) {
    throw new Error("FORM_ATTACHMENT_TYPE_NOT_ALLOWED");
  }

  const fieldMax = field.validation?.maxFileSize;

  if (fieldMax && size > fieldMax) {
    throw new Error("FORM_ATTACHMENT_TOO_LARGE");
  }

  return field;
}

export async function createPublicFormAttachmentUpload({
  companyId,
  formSlug,
  input,
  visitorHash,
}) {
  validateMimeType(input.mimeType);

  validateFileSize(input.size);

  const form = await getFormBySlug({
    companyId,
    slug: formSlug,
  });

  if (!form || form.deletedAt || form.status !== "published") {
    throw new Error("FORM_NOT_FOUND");
  }

  validateFormField({
    form,
    fieldId: input.fieldId,

    mimeType: input.mimeType,

    size: input.size,
  });

  const ref = createAttachmentRef(companyId);

  const attachmentId = ref.id;

  const safeFileName = sanitizeFileName(input.fileName);

  const storagePath = `companies/${companyId}/private-form-files/${form.id}/${attachmentId}/${safeFileName}`;

  const file = getMediaBucket().file(storagePath);

  const [uploadUrl] = await file.getSignedUrl({
    version: "v4",

    action: "write",

    expires: Date.now() + FORM_ATTACHMENT_UPLOAD_EXPIRES_MS,

    contentType: input.mimeType,
  });

  const attachment = await createPendingAttachment({
    companyId,
    attachmentId,

    data: {
      formId: form.id,

      formSlug: form.slug,

      fieldId: input.fieldId,

      visitorHash,

      originalFileName: input.fileName,

      fileName: safeFileName,

      storagePath,

      mimeType: input.mimeType,

      expectedSize: input.size,

      size: null,

      storageGeneration: null,

      failureReason: null,
    },
  });

  return {
    attachment: serializeFirestoreDocument(attachment),

    upload: {
      url: uploadUrl,

      method: "PUT",

      headers: {
        "Content-Type": input.mimeType,
      },

      expiresIn: FORM_ATTACHMENT_UPLOAD_EXPIRES_MS,
    },
  };
}

export async function finalizePublicFormAttachment({
  companyId,
  formSlug,
  attachmentId,
  visitorHash,
}) {
  const attachment = await getAttachmentById({
    companyId,
    attachmentId,
  });

  if (!attachment || attachment.deletedAt) {
    throw new Error("FORM_ATTACHMENT_NOT_FOUND");
  }

  if (
    attachment.formSlug !== formSlug ||
    attachment.visitorHash !== visitorHash
  ) {
    throw new Error("FORM_ATTACHMENT_NOT_FOUND");
  }

  if (attachment.status === "ready") {
    return serializeFirestoreDocument(attachment);
  }

  if (attachment.status !== "uploading" && attachment.status !== "failed") {
    throw new Error("FORM_ATTACHMENT_INVALID_STATUS");
  }

  try {
    const file = getMediaBucket().file(attachment.storagePath);

    const [exists] = await file.exists();

    if (!exists) {
      throw new Error("FORM_ATTACHMENT_FILE_NOT_UPLOADED");
    }

    const [metadata] = await file.getMetadata();

    const actualMimeType = metadata.contentType || null;

    const actualSize = Number(metadata.size || 0);

    validateMimeType(actualMimeType);

    validateFileSize(actualSize);

    if (actualMimeType !== attachment.mimeType) {
      throw new Error("FORM_ATTACHMENT_MIME_MISMATCH");
    }

    if (actualSize !== attachment.expectedSize) {
      throw new Error("FORM_ATTACHMENT_SIZE_MISMATCH");
    }

    const ready = await markAttachmentReady({
      companyId,
      attachmentId,

      data: {
        size: actualSize,

        storageGeneration: metadata.generation || null,
      },
    });

    return serializeFirestoreDocument(ready);
  } catch (error) {
    await markAttachmentFailed({
      companyId,
      attachmentId,

      reason: error.message || "FORM_ATTACHMENT_FINALIZE_FAILED",
    });

    throw error;
  }
}

export async function createPrivateAttachmentReadUrl({
  companyId,
  attachmentId,
}) {
  const attachment = await getAttachmentById({
    companyId,
    attachmentId,
  });

  if (
    !attachment ||
    attachment.deletedAt ||
    !["ready", "attached"].includes(attachment.status)
  ) {
    throw new Error("FORM_ATTACHMENT_NOT_FOUND");
  }

  const file = getMediaBucket().file(attachment.storagePath);

  const [url] = await file.getSignedUrl({
    version: "v4",

    action: "read",

    expires: Date.now() + FORM_ATTACHMENT_READ_EXPIRES_MS,
  });

  return {
    url,

    fileName: attachment.originalFileName,

    mimeType: attachment.mimeType,

    expiresIn: FORM_ATTACHMENT_READ_EXPIRES_MS,
  };
}
