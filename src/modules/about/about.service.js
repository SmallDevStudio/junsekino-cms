import "server-only";

import { adminDb } from "@/lib/firebase/admin";

import { createAuditLogSafe } from "@/modules/audit/audit.service";

import { serializeFirestoreDocument } from "@/utils/firestore";

import {
  createAboutPageRecord,
  deleteAboutPageRecord,
  getAboutPageById,
  getPublishedAboutPage,
  listAboutPageRecords,
  publishAboutPageRecord,
  unpublishAboutPageRecord,
  updateAboutPageRecord,
} from "./about.repository";

/*
 * =========================================================
 * LOCALIZED
 * =========================================================
 */

function normalizeLocalized(value = {}) {
  return {
    th: value?.th || "",

    en: value?.en || "",
  };
}

function normalizeMedia(media) {
  if (!media?.mediaId) {
    return null;
  }

  return {
    mediaId: media.mediaId,

    alt: normalizeLocalized(media.alt),
  };
}

/*
 * =========================================================
 * BLOCKS
 * =========================================================
 */

function normalizeBlocks(blocks = []) {
  const ids = new Set();

  return blocks.map((block) => {
    if (ids.has(block.id)) {
      throw new Error("ABOUT_BLOCK_ID_DUPLICATE");
    }

    ids.add(block.id);

    if (block.type === "richText") {
      return {
        ...block,

        content: {
          th: block.content?.th || null,

          en: block.content?.en || null,
        },
      };
    }

    if (block.type === "imageText") {
      return {
        ...block,

        image: normalizeMedia(block.image),

        content: {
          th: block.content?.th || null,

          en: block.content?.en || null,
        },
      };
    }

    if (block.type === "image") {
      return {
        ...block,

        image: normalizeMedia(block.image),
      };
    }

    return {
      ...block,
    };
  });
}

/*
 * =========================================================
 * MEDIA VALIDATION
 * =========================================================
 */

function collectMediaIds({ cover, blocks }) {
  const mediaIds = new Set();

  if (cover?.mediaId) {
    mediaIds.add(cover.mediaId);
  }

  for (const block of blocks || []) {
    if (block.image?.mediaId) {
      mediaIds.add(block.image.mediaId);
    }
  }

  return [...mediaIds];
}

async function validateMedia({ companyId, cover, blocks }) {
  const mediaIds = collectMediaIds({
    cover,
    blocks,
  });

  if (mediaIds.length === 0) {
    return;
  }

  const refs = mediaIds.map((mediaId) =>
    adminDb
      .collection("companies")
      .doc(companyId)
      .collection("media")
      .doc(mediaId),
  );

  const snapshots = await adminDb.getAll(...refs);

  for (let index = 0; index < snapshots.length; index += 1) {
    const snapshot = snapshots[index];

    const mediaId = mediaIds[index];

    if (!snapshot.exists) {
      throw new Error(`ABOUT_MEDIA_NOT_FOUND:${mediaId}`);
    }

    const media = snapshot.data();

    if (media.deletedAt) {
      throw new Error(`ABOUT_MEDIA_NOT_FOUND:${mediaId}`);
    }

    if (media.status && !["ready", "active"].includes(media.status)) {
      throw new Error(`ABOUT_MEDIA_NOT_READY:${mediaId}`);
    }
  }
}

/*
 * =========================================================
 * VALIDATION
 * =========================================================
 */

function validateAboutPage(page, { publishing = false } = {}) {
  const hasName =
    Boolean(page.name?.th?.trim()) || Boolean(page.name?.en?.trim());

  if (!hasName) {
    throw new Error("ABOUT_PAGE_NAME_REQUIRED");
  }

  if (!Array.isArray(page.blocks)) {
    throw new Error("ABOUT_PAGE_BLOCKS_INVALID");
  }

  /*
   * Draft may be empty while user
   * is still designing the page.
   *
   * Publishing requires actual
   * content.
   */

  if (publishing) {
    if (!page.cover?.mediaId) {
      throw new Error("ABOUT_PAGE_COVER_REQUIRED");
    }

    if (page.blocks.length === 0) {
      throw new Error("ABOUT_PAGE_BLOCK_REQUIRED");
    }
  }
}

/*
 * =========================================================
 * LIST
 * =========================================================
 */

export async function listAboutPages({ companyId }) {
  const items = await listAboutPageRecords(companyId);

  items.sort(
    (a, b) =>
      (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0),
  );

  return items.map(serializeFirestoreDocument);
}

/*
 * =========================================================
 * GET
 * =========================================================
 */

export async function getAboutPage({ companyId, aboutPageId }) {
  const item = await getAboutPageById({
    companyId,

    aboutPageId,
  });

  if (!item || item.deletedAt) {
    throw new Error("ABOUT_PAGE_NOT_FOUND");
  }

  return serializeFirestoreDocument(item);
}

/*
 * =========================================================
 * CREATE
 * =========================================================
 */

export async function createAboutPage({ companyId, input, currentUser }) {
  const data = {
    name: normalizeLocalized(input.name),

    cover: normalizeMedia(input.cover),

    blocks: normalizeBlocks(input.blocks || []),

    seo: input.seo || null,
  };

  validateAboutPage(data);

  await validateMedia({
    companyId,

    cover: data.cover,

    blocks: data.blocks,
  });

  const record = await createAboutPageRecord({
    companyId,

    data,

    userId: currentUser.uid,
  });

  const serialized = serializeFirestoreDocument(record);

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: "ABOUT_PAGE_CREATE",

    resource: "aboutPage",

    resourceId: record.id,

    before: null,

    after: serialized,
  });

  return serialized;
}

/*
 * =========================================================
 * UPDATE
 * =========================================================
 */

export async function updateAboutPage({
  companyId,
  aboutPageId,
  input,
  currentUser,
}) {
  const existing = await getAboutPageById({
    companyId,

    aboutPageId,
  });

  if (!existing || existing.deletedAt) {
    throw new Error("ABOUT_PAGE_NOT_FOUND");
  }

  const data = {
    ...input,
  };

  if (input.name) {
    data.name = {
      ...existing.name,

      ...input.name,
    };
  }

  if (Object.prototype.hasOwnProperty.call(input, "cover")) {
    data.cover = normalizeMedia(input.cover);
  }

  if (input.blocks) {
    data.blocks = normalizeBlocks(input.blocks);
  }

  /*
   * Workflow fields cannot be
   * edited from normal Update.
   */

  delete data.status;
  delete data.publishedAt;
  delete data.publishedBy;
  delete data.deletedAt;
  delete data.deletedBy;
  delete data.createdAt;
  delete data.createdBy;

  const preview = {
    ...existing,

    ...data,
  };

  validateAboutPage(preview);

  await validateMedia({
    companyId,

    cover: preview.cover,

    blocks: preview.blocks || [],
  });

  const result = await updateAboutPageRecord({
    companyId,

    aboutPageId,

    data,

    userId: currentUser.uid,
  });

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: "ABOUT_PAGE_UPDATE",

    resource: "aboutPage",

    resourceId: aboutPageId,

    before: serializeFirestoreDocument(result.before),

    after: serializeFirestoreDocument(result.after),
  });

  return serializeFirestoreDocument(result.after);
}

/*
 * =========================================================
 * PUBLISH
 * =========================================================
 */

export async function publishAboutPage({
  companyId,
  aboutPageId,
  currentUser,
}) {
  const existing = await getAboutPageById({
    companyId,

    aboutPageId,
  });

  if (!existing || existing.deletedAt) {
    throw new Error("ABOUT_PAGE_NOT_FOUND");
  }

  validateAboutPage(existing, {
    publishing: true,
  });

  await validateMedia({
    companyId,

    cover: existing.cover,

    blocks: existing.blocks || [],
  });

  const result = await publishAboutPageRecord({
    companyId,

    aboutPageId,

    userId: currentUser.uid,
  });

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: "ABOUT_PAGE_PUBLISH",

    resource: "aboutPage",

    resourceId: aboutPageId,

    before: serializeFirestoreDocument(result.before),

    after: serializeFirestoreDocument(result.after),
  });

  return serializeFirestoreDocument(result.after);
}

/*
 * =========================================================
 * UNPUBLISH
 * =========================================================
 */

export async function unpublishAboutPage({
  companyId,
  aboutPageId,
  currentUser,
}) {
  const result = await unpublishAboutPageRecord({
    companyId,

    aboutPageId,

    userId: currentUser.uid,
  });

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: "ABOUT_PAGE_UNPUBLISH",

    resource: "aboutPage",

    resourceId: aboutPageId,

    before: serializeFirestoreDocument(result.before),

    after: serializeFirestoreDocument(result.after),
  });

  return serializeFirestoreDocument(result.after);
}

/*
 * =========================================================
 * DELETE
 * =========================================================
 */

export async function deleteAboutPage({ companyId, aboutPageId, currentUser }) {
  const before = await deleteAboutPageRecord({
    companyId,

    aboutPageId,

    userId: currentUser.uid,
  });

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: "ABOUT_PAGE_DELETE",

    resource: "aboutPage",

    resourceId: aboutPageId,

    before: serializeFirestoreDocument(before),

    after: {
      deleted: true,
    },
  });

  return {
    id: aboutPageId,

    deleted: true,
  };
}

/*
 * =========================================================
 * PUBLIC
 * =========================================================
 */

export async function getPublicAboutPage({ companyId }) {
  const item = await getPublishedAboutPage(companyId);

  if (!item) {
    throw new Error("ABOUT_PAGE_NOT_FOUND");
  }

  return serializeFirestoreDocument(item);
}
