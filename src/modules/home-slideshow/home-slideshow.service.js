import "server-only";

import {
  createHomeSlideshowRecord,
  deleteHomeSlideshowRecord,
  getHomeSlideshowById,
  getPublishedHomeSlideshow,
  listHomeSlideshowRecords,
  publishHomeSlideshowRecord,
  updateHomeSlideshowRecord,
} from "./home-slideshow.repository";

import { adminDb } from "@/lib/firebase/admin";

import { createAuditLogSafe } from "@/modules/audit/audit.service";

import { serializeFirestoreDocument } from "@/utils/firestore";

function normalizeLocalized(value = {}) {
  return {
    th: value.th || "",

    en: value.en || "",
  };
}

function normalizeSlides(slides = []) {
  const ids = new Set();

  const mediaIds = new Set();

  const normalized = slides.map((slide, index) => {
    if (ids.has(slide.id)) {
      throw new Error("HOME_SLIDE_ID_DUPLICATE");
    }

    ids.add(slide.id);

    /*
     * เราอนุญาต media เดิมซ้ำได้
     * technically แต่ป้องกันไว้ก่อน
     * เพื่อไม่ให้ Admin เผลอใส่รูปเดิม
     * ซ้ำใน slideshow เดียว
     */
    if (mediaIds.has(slide.mediaId)) {
      throw new Error("HOME_SLIDE_MEDIA_DUPLICATE");
    }

    mediaIds.add(slide.mediaId);

    return {
      ...slide,

      alt: normalizeLocalized(slide.alt),

      caption: normalizeLocalized(slide.caption),

      link: {
        enabled: false,

        url: null,

        newTab: false,

        ...slide.link,
      },

      sortOrder: slide.sortOrder ?? index * 10,

      enabled: slide.enabled !== false,
    };
  });

  normalized.sort((a, b) => a.sortOrder - b.sortOrder);

  return normalized;
}

async function validateMedia({ companyId, slides }) {
  const uniqueIds = [...new Set(slides.map((slide) => slide.mediaId))];

  if (uniqueIds.length === 0) {
    return;
  }

  const refs = uniqueIds.map((mediaId) =>
    adminDb
      .collection("companies")
      .doc(companyId)
      .collection("media")
      .doc(mediaId),
  );

  const snapshots = await adminDb.getAll(...refs);

  for (let index = 0; index < snapshots.length; index += 1) {
    const snapshot = snapshots[index];

    const mediaId = uniqueIds[index];

    if (!snapshot.exists) {
      throw new Error(`HOME_SLIDE_MEDIA_NOT_FOUND:${mediaId}`);
    }

    const media = snapshot.data();

    if (media.deletedAt) {
      throw new Error(`HOME_SLIDE_MEDIA_NOT_FOUND:${mediaId}`);
    }

    /*
     * หาก Media module ของคุณมี status
     * เป็น ready ให้ตรวจตรงนี้ด้วย
     */
    if (media.status && !["ready", "active"].includes(media.status)) {
      throw new Error(`HOME_SLIDE_MEDIA_NOT_READY:${mediaId}`);
    }
  }
}

function validateHomeSlideshow(slideshow) {
  const hasName =
    Boolean(slideshow.name?.th?.trim()) || Boolean(slideshow.name?.en?.trim());

  if (!hasName) {
    throw new Error("HOME_SLIDESHOW_NAME_REQUIRED");
  }

  if (!Array.isArray(slideshow.slides)) {
    throw new Error("HOME_SLIDESHOW_SLIDES_INVALID");
  }
}

export async function listHomeSlideshows({ companyId }) {
  const items = await listHomeSlideshowRecords(companyId);

  items.sort(
    (a, b) =>
      (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0),
  );

  return items.map(serializeFirestoreDocument);
}

export async function getHomeSlideshow({ companyId, slideshowId }) {
  const item = await getHomeSlideshowById({
    companyId,
    slideshowId,
  });

  if (!item || item.deletedAt) {
    throw new Error("HOME_SLIDESHOW_NOT_FOUND");
  }

  return serializeFirestoreDocument(item);
}

export async function createHomeSlideshow({ companyId, input, currentUser }) {
  const data = {
    name: normalizeLocalized(input.name),

    description: normalizeLocalized(input.description),

    slides: normalizeSlides(input.slides),
  };

  validateHomeSlideshow(data);

  await validateMedia({
    companyId,

    slides: data.slides,
  });

  const record = await createHomeSlideshowRecord({
    companyId,
    data,

    userId: currentUser.uid,
  });

  const serialized = serializeFirestoreDocument(record);

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: "HOME_SLIDESHOW_CREATE",

    resource: "homeSlideshow",

    resourceId: record.id,

    before: null,

    after: serialized,
  });

  return serialized;
}

export async function updateHomeSlideshow({
  companyId,
  slideshowId,
  input,
  currentUser,
}) {
  const existing = await getHomeSlideshowById({
    companyId,
    slideshowId,
  });

  if (!existing || existing.deletedAt) {
    throw new Error("HOME_SLIDESHOW_NOT_FOUND");
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

  if (input.description) {
    data.description = {
      ...existing.description,
      ...input.description,
    };
  }

  if (input.slides) {
    data.slides = normalizeSlides(input.slides);

    await validateMedia({
      companyId,

      slides: data.slides,
    });
  }

  const preview = {
    ...existing,
    ...data,
  };

  validateHomeSlideshow(preview);

  delete data.status;
  delete data.publishedAt;
  delete data.publishedBy;
  delete data.deletedAt;
  delete data.deletedBy;

  const result = await updateHomeSlideshowRecord({
    companyId,
    slideshowId,
    data,

    userId: currentUser.uid,
  });

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: "HOME_SLIDESHOW_UPDATE",

    resource: "homeSlideshow",

    resourceId: slideshowId,

    before: serializeFirestoreDocument(result.before),

    after: serializeFirestoreDocument(result.after),
  });

  return serializeFirestoreDocument(result.after);
}

export async function publishHomeSlideshow({
  companyId,
  slideshowId,
  currentUser,
}) {
  const existing = await getHomeSlideshowById({
    companyId,
    slideshowId,
  });

  if (!existing || existing.deletedAt) {
    throw new Error("HOME_SLIDESHOW_NOT_FOUND");
  }

  const enabledSlides = (existing.slides || []).filter(
    (slide) => slide.enabled !== false,
  );

  /*
   * Published Home ต้องมีอย่างน้อย 1 รูป
   */
  if (enabledSlides.length === 0) {
    throw new Error("HOME_SLIDESHOW_REQUIRES_SLIDE");
  }

  await validateMedia({
    companyId,

    slides: enabledSlides,
  });

  const result = await publishHomeSlideshowRecord({
    companyId,
    slideshowId,

    userId: currentUser.uid,
  });

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: "HOME_SLIDESHOW_PUBLISH",

    resource: "homeSlideshow",

    resourceId: slideshowId,

    before: serializeFirestoreDocument(result.before),

    after: serializeFirestoreDocument(result.after),
  });

  return serializeFirestoreDocument(result.after);
}

export async function deleteHomeSlideshow({
  companyId,
  slideshowId,
  currentUser,
}) {
  const before = await deleteHomeSlideshowRecord({
    companyId,
    slideshowId,

    userId: currentUser.uid,
  });

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: "HOME_SLIDESHOW_DELETE",

    resource: "homeSlideshow",

    resourceId: slideshowId,

    before: serializeFirestoreDocument(before),

    after: {
      deleted: true,
    },
  });

  return {
    id: slideshowId,

    deleted: true,
  };
}

export async function getPublicHomeSlideshow({ companyId }) {
  const item = await getPublishedHomeSlideshow(companyId);

  if (!item) {
    throw new Error("HOME_SLIDESHOW_NOT_FOUND");
  }

  const slides = (item.slides || [])
    .filter((slide) => slide.enabled !== false)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return serializeFirestoreDocument({
    id: item.id,

    name: item.name,

    slides,
  });
}
