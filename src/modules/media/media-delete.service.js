import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

import { softDeleteMediaRecord } from "./media.repository";

import { findMediaUsages } from "./media-relations.service";

/*
 * =========================================================
 * COLLECTION MAP
 * =========================================================
 */

const MODULE_COLLECTION = Object.freeze({
  project: "projects",

  award: "awards",

  "home-slideshow": "homeSlideshows",

  page: "pages",

  "public-content": "publicContents",
});

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function companyDocument(companyId, collectionName, contentId) {
  return adminDb
    .collection("companies")
    .doc(companyId)
    .collection(collectionName)
    .doc(contentId);
}

function sameMedia(value, mediaId) {
  return value?.mediaId === mediaId;
}

function removeMediaFromArray(items, mediaId) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.filter((item) => !sameMedia(item, mediaId));
}

/*
 * =========================================================
 * PROJECT / AWARD / PUBLIC CONTENT
 * =========================================================
 */

function detachStandardContent(data, mediaId) {
  const next = {
    ...data,
  };

  if (sameMedia(next.featuredImage, mediaId)) {
    next.featuredImage = null;
  }

  if (Array.isArray(next.gallery)) {
    next.gallery = removeMediaFromArray(next.gallery, mediaId);
  }

  return next;
}

/*
 * =========================================================
 * HOME SLIDESHOW
 * =========================================================
 */

function detachHomeSlideshow(data, mediaId) {
  const slides = Array.isArray(data?.slides) ? data.slides : [];

  const nextSlides = slides
    .filter((slide) => slide?.mediaId !== mediaId)
    .map((slide, index) => ({
      ...slide,

      sortOrder: index * 10,
    }));

  return {
    ...data,

    slides: nextSlides,
  };
}

/*
 * =========================================================
 * PAGE
 * =========================================================
 */

function detachPage(data, mediaId) {
  const next = {
    ...data,
  };

  /*
   * Cover / featured image.
   */

  if (sameMedia(next.featuredImage, mediaId)) {
    next.featuredImage = null;
  }

  /*
   * Hero.
   *
   * Keep the hero configuration,
   * remove only the Media reference.
   */

  if (sameMedia(next?.hero?.media, mediaId)) {
    next.hero = {
      ...next.hero,

      media: null,
    };
  }

  /*
   * Page Builder / About Sections.
   */

  if (Array.isArray(next.sections)) {
    next.sections = next.sections.map((section) => {
      if (!section) {
        return section;
      }

      /*
       * Image / Image + Text
       */

      if (
        (section.type === "image" || section.type === "imageText") &&
        sameMedia(section?.data?.image, mediaId)
      ) {
        return {
          ...section,

          data: {
            ...section.data,

            image: null,
          },
        };
      }

      /*
       * Gallery block
       */

      if (section.type === "gallery") {
        return {
          ...section,

          data: {
            ...section.data,

            images: removeMediaFromArray(section?.data?.images, mediaId),
          },
        };
      }

      return section;
    });
  }

  return next;
}

/*
 * =========================================================
 * DETACH DOCUMENT
 * =========================================================
 */

function detachDocument({
  module,

  data,

  mediaId,
}) {
  switch (module) {
    case "project":
    case "award":
    case "public-content":
      return detachStandardContent(data, mediaId);

    case "home-slideshow":
      return detachHomeSlideshow(data, mediaId);

    case "page":
      return detachPage(data, mediaId);

    default:
      return data;
  }
}

/*
 * =========================================================
 * UNIQUE CONTENT REFERENCES
 * =========================================================
 *
 * A single Project may reference the same image
 * in both cover and gallery.
 *
 * We update that document once only.
 * =========================================================
 */

function uniqueReferencedDocuments(usages) {
  const result = new Map();

  for (const usage of usages) {
    const collectionName = MODULE_COLLECTION[usage.module];

    if (!collectionName || !usage.contentId) {
      continue;
    }

    const key = `${usage.module}:${usage.contentId}`;

    if (!result.has(key)) {
      result.set(key, {
        module: usage.module,

        collectionName,

        contentId: usage.contentId,
      });
    }
  }

  return [...result.values()];
}

/*
 * =========================================================
 * DETACH MEDIA REFERENCES
 * =========================================================
 */

export async function detachMediaReferences({
  companyId,

  mediaId,

  currentUser,
}) {
  const usage = await findMediaUsages({
    companyId,

    mediaId,
  });

  if (usage.usageCount === 0) {
    return {
      detachedCount: 0,

      affectedDocuments: 0,

      before: usage,

      after: usage,
    };
  }

  const references = uniqueReferencedDocuments(usage.usages);

  const batch = adminDb.batch();

  let affectedDocuments = 0;

  for (const reference of references) {
    const ref = companyDocument(
      companyId,

      reference.collectionName,

      reference.contentId,
    );

    const snapshot = await ref.get();

    if (!snapshot.exists) {
      continue;
    }

    const current = snapshot.data();

    if (current?.deletedAt) {
      continue;
    }

    const next = detachDocument({
      module: reference.module,

      data: current,

      mediaId,
    });

    batch.update(ref, {
      ...next,

      updatedAt: FieldValue.serverTimestamp(),

      updatedBy: currentUser.uid,
    });

    affectedDocuments += 1;
  }

  if (affectedDocuments > 0) {
    await batch.commit();
  }

  /*
   * =======================================================
   * VERIFY
   * =======================================================
   *
   * Never delete Media blindly.
   *
   * Scan again after detach and make sure
   * no tracked reference remains.
   * =======================================================
   */

  const after = await findMediaUsages({
    companyId,

    mediaId,
  });

  if (after.usageCount > 0) {
    const error = new Error("MEDIA_REFERENCES_REMAIN");

    error.usage = after;

    throw error;
  }

  return {
    detachedCount: usage.usageCount,

    affectedDocuments,

    before: usage,

    after,
  };
}

/*
 * =========================================================
 * SAFE DELETE
 * =========================================================
 */

export async function safeDeleteMedia({
  companyId,

  mediaId,

  detachReferences = false,

  currentUser,
}) {
  /*
   * Always re-check current usage.
   */

  const usage = await findMediaUsages({
    companyId,

    mediaId,
  });

  /*
   * If references exist and the user
   * did not explicitly approve detach,
   * stop here.
   */

  if (usage.usageCount > 0 && !detachReferences) {
    const error = new Error("MEDIA_IN_USE");

    error.usage = usage;

    throw error;
  }

  let detachResult = null;

  if (usage.usageCount > 0 && detachReferences) {
    detachResult = await detachMediaReferences({
      companyId,

      mediaId,

      currentUser,
    });
  }

  /*
   * Final check immediately before
   * soft deleting the Media record.
   */

  const finalUsage = await findMediaUsages({
    companyId,

    mediaId,
  });

  if (finalUsage.usageCount > 0) {
    const error = new Error("MEDIA_REFERENCES_REMAIN");

    error.usage = finalUsage;

    throw error;
  }

  const deleted = await softDeleteMediaRecord({
    companyId,

    mediaId,

    userId: currentUser.uid,
  });

  return {
    mediaId,

    deleted: true,

    detachedReferences: detachResult?.detachedCount || 0,

    affectedDocuments: detachResult?.affectedDocuments || 0,

    media: deleted,
  };
}
