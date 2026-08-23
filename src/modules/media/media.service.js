import "server-only";

import crypto from "node:crypto";
import path from "node:path";

import sharp from "sharp";

import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_MEDIA_FILE_SIZE,
  MEDIA_READ_URL_EXPIRES_MS,
  MEDIA_UPLOAD_URL_EXPIRES_MS,
} from "@/constants/media";

import { getMediaBucket } from "@/lib/firebase/storage";

import {
  createMediaDocumentRef,
  createPendingMediaRecord,
  getMediaById,
  listMediaRecords,
  markMediaFailed,
  markMediaReady,
  softDeleteMediaRecord,
  updateMediaRecord,
} from "./media.repository";

import {
  AUDIT_ACTIONS,
  createAuditLogSafe,
} from "@/modules/audit/audit.service";

import { serializeFirestoreDocument } from "@/utils/firestore";

function sanitizeFileName(fileName) {
  const extension = path.extname(fileName).toLowerCase();

  const baseName = path
    .basename(fileName, extension)
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);

  const safeBase = baseName || "image";

  return `${safeBase}${extension}`;
}

function validateMimeType(mimeType) {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(mimeType)) {
    throw new Error("MEDIA_TYPE_NOT_ALLOWED");
  }
}

function validateSize(size) {
  if (!Number.isInteger(size) || size <= 0) {
    throw new Error("MEDIA_INVALID_SIZE");
  }

  if (size > MAX_MEDIA_FILE_SIZE) {
    throw new Error("MEDIA_FILE_TOO_LARGE");
  }
}

export async function createMediaUpload({ companyId, input, currentUser }) {
  validateMimeType(input.mimeType);

  validateSize(input.size);

  const ref = createMediaDocumentRef(companyId);

  const mediaId = ref.id;

  const safeFileName = sanitizeFileName(input.fileName);

  const objectPath = `companies/${companyId}/originals/${mediaId}/${safeFileName}`;

  const bucket = getMediaBucket();

  const file = bucket.file(objectPath);

  const [uploadUrl] = await file.getSignedUrl({
    version: "v4",

    action: "write",

    expires: Date.now() + MEDIA_UPLOAD_URL_EXPIRES_MS,

    contentType: input.mimeType,
  });

  const media = await createPendingMediaRecord({
    companyId,
    mediaId,

    userId: currentUser.uid,

    data: {
      type: "image",

      usage: input.usage,

      originalFileName: input.fileName,

      fileName: safeFileName,

      storagePath: objectPath,

      mimeType: input.mimeType,

      expectedSize: input.size,

      size: null,

      width: null,

      height: null,

      format: null,

      storageGeneration: null,

      alt: input.alt || {
        th: "",
        en: "",
      },

      caption: input.caption || {
        th: "",
        en: "",
      },

      checksum: null,
    },
  });

  return {
    media: serializeFirestoreDocument(media),

    upload: {
      url: uploadUrl,

      method: "PUT",

      headers: {
        "Content-Type": input.mimeType,
      },

      expiresIn: MEDIA_UPLOAD_URL_EXPIRES_MS,
    },
  };
}

export async function finalizeMedia({ companyId, mediaId, currentUser }) {
  const media = await getMediaById({
    companyId,
    mediaId,
  });

  if (!media || media.deletedAt) {
    throw new Error("MEDIA_NOT_FOUND");
  }

  if (media.status === "ready") {
    return serializeFirestoreDocument(media);
  }

  if (media.status !== "uploading") {
    throw new Error("MEDIA_INVALID_STATUS");
  }

  const bucket = getMediaBucket();

  const file = bucket.file(media.storagePath);

  try {
    const [exists] = await file.exists();

    if (!exists) {
      throw new Error("MEDIA_FILE_NOT_UPLOADED");
    }

    const [metadata] = await file.getMetadata();

    const actualMimeType = metadata.contentType || null;

    const actualSize = Number(metadata.size || 0);

    validateMimeType(actualMimeType);

    validateSize(actualSize);

    if (actualMimeType !== media.mimeType) {
      throw new Error("MEDIA_MIME_MISMATCH");
    }

    if (actualSize !== media.expectedSize) {
      throw new Error("MEDIA_SIZE_MISMATCH");
    }

    const [buffer] = await file.download();

    const imageMetadata = await sharp(buffer).metadata();

    if (!imageMetadata.width || !imageMetadata.height) {
      throw new Error("MEDIA_INVALID_IMAGE");
    }

    const checksum = crypto.createHash("sha256").update(buffer).digest("hex");

    const result = await markMediaReady({
      companyId,
      mediaId,

      userId: currentUser.uid,

      data: {
        size: actualSize,

        width: imageMetadata.width,

        height: imageMetadata.height,

        format: imageMetadata.format || null,

        storageGeneration: metadata.generation || null,

        checksum,

        failureReason: null,
      },
    });

    const serializedAfter = serializeFirestoreDocument(result.after);

    await createAuditLogSafe({
      userId: currentUser.uid,

      companyId,

      action: AUDIT_ACTIONS.MEDIA_UPLOAD,

      resource: "media",

      resourceId: mediaId,

      before: serializeFirestoreDocument(result.before),

      after: serializedAfter,
    });

    return serializedAfter;
  } catch (error) {
    await markMediaFailed({
      companyId,
      mediaId,

      reason: error.message || "MEDIA_FINALIZE_FAILED",

      userId: currentUser.uid,
    });

    throw error;
  }
}

export async function listMedia({ companyId, usage = null, search = null }) {
  let items = await listMediaRecords({
    companyId,
  });

  items = items.filter((item) => item.status === "ready");

  if (usage) {
    items = items.filter((item) => item.usage === usage);
  }

  if (search) {
    const keyword = search.trim().toLowerCase();

    items = items.filter((item) => {
      const searchable = [
        item.originalFileName,
        item.fileName,
        item.alt?.th,
        item.alt?.en,
        item.caption?.th,
        item.caption?.en,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(keyword);
    });
  }

  items.sort((a, b) => {
    const dateA = a.createdAt?.toMillis?.() || 0;

    const dateB = b.createdAt?.toMillis?.() || 0;

    return dateB - dateA;
  });

  return items.map(serializeFirestoreDocument);
}

export async function getMedia({ companyId, mediaId }) {
  const media = await getMediaById({
    companyId,
    mediaId,
  });

  if (!media || media.deletedAt) {
    throw new Error("MEDIA_NOT_FOUND");
  }

  return serializeFirestoreDocument(media);
}

export async function updateMedia({ companyId, mediaId, input, currentUser }) {
  const result = await updateMediaRecord({
    companyId,
    mediaId,

    data: input,

    userId: currentUser.uid,
  });

  const before = serializeFirestoreDocument(result.before);

  const after = serializeFirestoreDocument(result.after);

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: AUDIT_ACTIONS.MEDIA_UPDATE,

    resource: "media",

    resourceId: mediaId,

    before,

    after,
  });

  return after;
}

export async function createTemporaryMediaReadUrl({ companyId, mediaId }) {
  const media = await getMediaById({
    companyId,
    mediaId,
  });

  if (!media || media.deletedAt || media.status !== "ready") {
    throw new Error("MEDIA_NOT_FOUND");
  }

  const file = getMediaBucket().file(media.storagePath);

  const [url] = await file.getSignedUrl({
    version: "v4",

    action: "read",

    expires: Date.now() + MEDIA_READ_URL_EXPIRES_MS,
  });

  return {
    url,

    expiresIn: MEDIA_READ_URL_EXPIRES_MS,
  };
}

export async function deleteMedia({ companyId, mediaId, currentUser }) {
  const before = await softDeleteMediaRecord({
    companyId,
    mediaId,

    userId: currentUser.uid,
  });

  /*
   * Original file is intentionally
   * retained for now.
   *
   * A later cleanup job can permanently
   * delete archived files after a
   * retention period.
   */

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: AUDIT_ACTIONS.MEDIA_DELETE,

    resource: "media",

    resourceId: mediaId,

    before: serializeFirestoreDocument(before),

    after: {
      deleted: true,
    },
  });

  return {
    id: mediaId,

    deleted: true,
  };
}
