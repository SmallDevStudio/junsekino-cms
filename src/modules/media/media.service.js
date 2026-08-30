import "server-only";

import crypto from "node:crypto";
import dns from "node:dns/promises";
import net from "node:net";
import path from "node:path";

import sharp from "sharp";

import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_MEDIA_FILE_SIZE,
  MEDIA_PUBLIC_URL_EXPIRES_MS,
  MEDIA_READ_URL_EXPIRES_MS,
  MEDIA_UPLOAD_URL_EXPIRES_MS,
  MEDIA_VARIANT_KEYS,
} from "@/constants/media";

import { getMediaBucket } from "@/lib/firebase/storage";

import { processMediaImage } from "./media-processor";

import {
  createMediaDocumentRef,
  createPendingMediaRecord,
  getMediaById,
  listMediaRecords,
  markMediaFailed,
  markMediaProcessing,
  markMediaReady,
  softDeleteMediaRecord,
  updateMediaRecord,
} from "./media.repository";

import {
  AUDIT_ACTIONS,
  createAuditLogSafe,
} from "@/modules/audit/audit.service";

import { serializeFirestoreDocument } from "@/utils/firestore";

const REMOTE_IMAGE_TIMEOUT_MS = 15_000;

const MAX_REMOTE_REDIRECTS = 5;

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

function calculateSha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function normalizeMimeType(value) {
  if (!value) {
    return null;
  }

  return value.split(";")[0].trim().toLowerCase();
}

function extensionForMimeType(mimeType) {
  const extensions = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/avif": ".avif",
  };

  return extensions[mimeType] || "";
}

function getRemoteFileName(url, mimeType) {
  let pathname = "";

  try {
    pathname = new URL(url).pathname;
  } catch {
    pathname = "";
  }

  let fileName = path.basename(pathname) || "remote-image";

  fileName = decodeURIComponent(fileName);

  const existingExtension = path.extname(fileName);

  if (!existingExtension) {
    fileName += extensionForMimeType(mimeType);
  }

  return sanitizeFileName(fileName);
}

function isPrivateIpv4(address) {
  const parts = address.split(".").map(Number);

  if (
    parts.length !== 4 ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return true;
  }

  const [a, b] = parts;

  if (a === 0) {
    return true;
  }

  if (a === 10) {
    return true;
  }

  if (a === 127) {
    return true;
  }

  if (a === 169 && b === 254) {
    return true;
  }

  if (a === 172 && b >= 16 && b <= 31) {
    return true;
  }

  if (a === 192 && b === 168) {
    return true;
  }

  if (a === 100 && b >= 64 && b <= 127) {
    return true;
  }

  if (a >= 224) {
    return true;
  }

  return false;
}

function isPrivateIpv6(address) {
  const normalized = address.toLowerCase();

  if (normalized === "::1" || normalized === "::") {
    return true;
  }

  if (normalized.startsWith("fc") || normalized.startsWith("fd")) {
    return true;
  }

  if (
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb")
  ) {
    return true;
  }

  if (normalized.startsWith("::ffff:")) {
    const ipv4 = normalized.slice("::ffff:".length);

    if (net.isIP(ipv4) === 4) {
      return isPrivateIpv4(ipv4);
    }
  }

  return false;
}

function isPrivateAddress(address) {
  const version = net.isIP(address);

  if (version === 4) {
    return isPrivateIpv4(address);
  }

  if (version === 6) {
    return isPrivateIpv6(address);
  }

  return true;
}

async function validateRemoteUrl(value) {
  let url;

  try {
    url = new URL(value);
  } catch {
    throw new Error("MEDIA_REMOTE_URL_INVALID");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("MEDIA_REMOTE_URL_PROTOCOL_NOT_ALLOWED");
  }

  if (url.username || url.password) {
    throw new Error("MEDIA_REMOTE_URL_CREDENTIALS_NOT_ALLOWED");
  }

  const hostname = url.hostname.toLowerCase();

  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new Error("MEDIA_REMOTE_HOST_NOT_ALLOWED");
  }

  if (net.isIP(hostname)) {
    if (isPrivateAddress(hostname)) {
      throw new Error("MEDIA_REMOTE_HOST_NOT_ALLOWED");
    }

    return url;
  }

  let addresses;

  try {
    addresses = await dns.lookup(hostname, {
      all: true,
      verbatim: true,
    });
  } catch {
    throw new Error("MEDIA_REMOTE_HOST_UNRESOLVED");
  }

  if (
    !Array.isArray(addresses) ||
    addresses.length === 0 ||
    addresses.some((entry) => isPrivateAddress(entry.address))
  ) {
    throw new Error("MEDIA_REMOTE_HOST_NOT_ALLOWED");
  }

  return url;
}

async function readResponseBuffer(response) {
  const contentLength = Number(response.headers.get("content-length") || 0);

  if (contentLength > MAX_MEDIA_FILE_SIZE) {
    throw new Error("MEDIA_FILE_TOO_LARGE");
  }

  if (!response.body) {
    throw new Error("MEDIA_REMOTE_EMPTY_RESPONSE");
  }

  const reader = response.body.getReader();

  const chunks = [];

  let total = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    if (!value) {
      continue;
    }

    total += value.byteLength;

    if (total > MAX_MEDIA_FILE_SIZE) {
      try {
        await reader.cancel();
      } catch {
        // Ignore stream cancellation errors.
      }

      throw new Error("MEDIA_FILE_TOO_LARGE");
    }

    chunks.push(Buffer.from(value));
  }

  if (total <= 0) {
    throw new Error("MEDIA_REMOTE_EMPTY_RESPONSE");
  }

  return Buffer.concat(chunks, total);
}

async function downloadRemoteImage(initialUrl) {
  let currentUrl = initialUrl;

  for (
    let redirectCount = 0;
    redirectCount <= MAX_REMOTE_REDIRECTS;
    redirectCount += 1
  ) {
    const validatedUrl = await validateRemoteUrl(currentUrl);

    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, REMOTE_IMAGE_TIMEOUT_MS);

    let response;

    try {
      response = await fetch(validatedUrl, {
        method: "GET",

        redirect: "manual",

        signal: controller.signal,

        headers: {
          Accept: ALLOWED_IMAGE_MIME_TYPES.join(", "),
          "User-Agent": "Junsekino-CMS-MediaImporter/1.0",
        },
      });
    } catch (error) {
      if (error?.name === "AbortError") {
        throw new Error("MEDIA_REMOTE_TIMEOUT");
      }

      throw new Error("MEDIA_REMOTE_DOWNLOAD_FAILED");
    } finally {
      clearTimeout(timeoutId);
    }

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");

      if (!location) {
        throw new Error("MEDIA_REMOTE_REDIRECT_INVALID");
      }

      if (redirectCount >= MAX_REMOTE_REDIRECTS) {
        throw new Error("MEDIA_REMOTE_TOO_MANY_REDIRECTS");
      }

      currentUrl = new URL(location, validatedUrl).toString();

      continue;
    }

    if (!response.ok) {
      throw new Error(`MEDIA_REMOTE_HTTP_ERROR:${response.status}`);
    }

    const mimeType = normalizeMimeType(response.headers.get("content-type"));

    validateMimeType(mimeType);

    const buffer = await readResponseBuffer(response);

    validateSize(buffer.length);

    return {
      buffer,

      mimeType,

      finalUrl: validatedUrl.toString(),
    };
  }

  throw new Error("MEDIA_REMOTE_TOO_MANY_REDIRECTS");
}

async function processUploadedBuffer({
  companyId,
  mediaId,
  buffer,
  storageMetadata,
  currentUser,
}) {
  const metadata = await sharp(buffer).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("MEDIA_INVALID_IMAGE");
  }

  const checksum = calculateSha256(buffer);

  const processing = await processMediaImage({
    companyId,
    mediaId,

    originalBuffer: buffer,
  });

  const result = await markMediaReady({
    companyId,
    mediaId,

    userId: currentUser.uid,

    data: {
      size: buffer.length,

      width: processing.original.width,

      height: processing.original.height,

      format: processing.original.format,

      orientation: processing.original.orientation,

      storageGeneration: storageMetadata?.generation || null,

      checksum,

      variants: processing.variants,
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
}

export async function createMediaUpload({ companyId, input, currentUser }) {
  validateMimeType(input.mimeType);

  validateSize(input.size);

  const ref = createMediaDocumentRef(companyId);

  const mediaId = ref.id;

  const safeFileName = sanitizeFileName(input.fileName);

  const storagePath = `companies/${companyId}/originals/${mediaId}/${safeFileName}`;

  const bucket = getMediaBucket();

  const file = bucket.file(storagePath);

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

      storagePath,

      mimeType: input.mimeType,

      expectedSize: input.size,

      size: null,

      width: null,

      height: null,

      format: null,

      storageGeneration: null,

      title: input.title || {
        th: "",
        en: "",
      },

      alt: input.alt || {
        th: "",
        en: "",
      },

      description: input.description || {
        th: "",
        en: "",
      },

      caption: input.caption || {
        th: "",
        en: "",
      },

      credit: input.credit || {
        th: "",
        en: "",
      },

      tags: Array.isArray(input.tags) ? input.tags : [],

      checksum: null,

      source: {
        type: "upload",
        url: null,
      },
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

export async function importMediaFromUrl({ companyId, input, currentUser }) {
  const downloaded = await downloadRemoteImage(input.url);

  validateMimeType(downloaded.mimeType);

  validateSize(downloaded.buffer.length);

  const imageMetadata = await sharp(downloaded.buffer).metadata();

  if (!imageMetadata.width || !imageMetadata.height) {
    throw new Error("MEDIA_INVALID_IMAGE");
  }

  const fileName = getRemoteFileName(downloaded.finalUrl, downloaded.mimeType);

  const ref = createMediaDocumentRef(companyId);

  const mediaId = ref.id;

  const storagePath = `companies/${companyId}/originals/${mediaId}/${fileName}`;

  const media = await createPendingMediaRecord({
    companyId,
    mediaId,

    userId: currentUser.uid,

    data: {
      type: "image",

      usage: input.usage,

      originalFileName: fileName,

      fileName,

      storagePath,

      mimeType: downloaded.mimeType,

      expectedSize: downloaded.buffer.length,

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

      source: {
        type: "url",
        url: downloaded.finalUrl,
      },
    },
  });

  const bucket = getMediaBucket();

  const file = bucket.file(storagePath);

  try {
    await file.save(downloaded.buffer, {
      resumable: false,

      validation: "crc32c",

      metadata: {
        contentType: downloaded.mimeType,

        cacheControl: "private,max-age=0,no-store",

        metadata: {
          mediaId,

          companyId,

          source: "url-import",
        },
      },
    });

    const [storageMetadata] = await file.getMetadata();

    await markMediaProcessing({
      companyId,
      mediaId,

      userId: currentUser.uid,
    });

    return await processUploadedBuffer({
      companyId,
      mediaId,

      buffer: downloaded.buffer,

      storageMetadata,

      currentUser,
    });
  } catch (error) {
    await markMediaFailed({
      companyId,
      mediaId,

      reason: error.message || "MEDIA_IMPORT_FAILED",

      userId: currentUser.uid,
    });

    throw error;
  }
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

  if (media.status !== "uploading" && media.status !== "failed") {
    throw new Error("MEDIA_INVALID_STATUS");
  }

  const bucket = getMediaBucket();

  const file = bucket.file(media.storagePath);

  try {
    const [exists] = await file.exists();

    if (!exists) {
      throw new Error("MEDIA_FILE_NOT_UPLOADED");
    }

    const [storageMetadata] = await file.getMetadata();

    const actualMimeType = storageMetadata.contentType || null;

    const actualSize = Number(storageMetadata.size || 0);

    validateMimeType(actualMimeType);

    validateSize(actualSize);

    if (actualMimeType !== media.mimeType) {
      throw new Error("MEDIA_MIME_MISMATCH");
    }

    if (actualSize !== media.expectedSize) {
      throw new Error("MEDIA_SIZE_MISMATCH");
    }

    await markMediaProcessing({
      companyId,
      mediaId,

      userId: currentUser.uid,
    });

    const [buffer] = await file.download();

    return await processUploadedBuffer({
      companyId,
      mediaId,

      buffer,

      storageMetadata,

      currentUser,
    });
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

/*
 * ADMIN ONLY
 *
 * Returns temporary access to the
 * private original image.
 */
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

/*
 * PUBLIC WEBSITE
 *
 * Original images are explicitly
 * forbidden.
 */
export async function createPublicMediaVariantUrl({
  companyId,
  mediaId,
  variant,
}) {
  if (!MEDIA_VARIANT_KEYS.includes(variant)) {
    throw new Error("MEDIA_VARIANT_NOT_FOUND");
  }

  const media = await getMediaById({
    companyId,
    mediaId,
  });

  if (!media || media.deletedAt || media.status !== "ready") {
    throw new Error("MEDIA_NOT_FOUND");
  }

  const variantData = media.variants?.[variant];

  if (!variantData || !variantData.storagePath) {
    throw new Error("MEDIA_VARIANT_NOT_FOUND");
  }

  const file = getMediaBucket().file(variantData.storagePath);

  const [url] = await file.getSignedUrl({
    version: "v4",

    action: "read",

    expires: Date.now() + MEDIA_PUBLIC_URL_EXPIRES_MS,
  });

  return {
    url,

    variant: {
      key: variant,

      width: variantData.width,

      height: variantData.height,

      size: variantData.size,

      mimeType: variantData.mimeType,
    },

    expiresIn: MEDIA_PUBLIC_URL_EXPIRES_MS,
  };
}

export async function deleteMedia({ companyId, mediaId, currentUser }) {
  const before = await softDeleteMediaRecord({
    companyId,
    mediaId,

    userId: currentUser.uid,
  });

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
