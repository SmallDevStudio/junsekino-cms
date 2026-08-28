import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

import { getPublicContentBySlug } from "@/modules/public-content/public-content.repository";

/*
 * Same browser counts a new view
 * after 30 minutes.
 */
const VIEW_COOLDOWN_MS = 30 * 60 * 1000;

/*
 * Prevent a double click / rapid
 * repeated share from artificially
 * inflating the share counter.
 */
const SHARE_COOLDOWN_MS = 5 * 1000;

const SHARE_CHANNELS = new Set(["facebook", "x", "linkedin", "copy", "native"]);

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function normalizeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizeVisitorId(value) {
  const normalized = String(value || "").trim();

  if (
    normalized.length < 16 ||
    normalized.length > 100 ||
    !/^[A-Za-z0-9_-]+$/.test(normalized)
  ) {
    return null;
  }

  return normalized;
}

function normalizeShareChannel(value) {
  const channel = String(value || "")
    .trim()
    .toLowerCase();

  return SHARE_CHANNELS.has(channel) ? channel : null;
}

function normalizeMetric(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return 0;
  }

  return Math.floor(number);
}

function getEngagement(data) {
  return {
    views: normalizeMetric(data?.engagement?.views),

    likes: normalizeMetric(data?.engagement?.likes),

    shares: normalizeMetric(data?.engagement?.shares),
  };
}

function getTimestampMillis(value) {
  if (!value) {
    return 0;
  }

  if (typeof value?.toMillis === "function") {
    return value.toMillis();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  const parsed = new Date(value).getTime();

  return Number.isNaN(parsed) ? 0 : parsed;
}

async function resolvePublishedContent({ companyId, slug }) {
  const normalizedSlug = normalizeSlug(slug);

  if (!normalizedSlug) {
    throw new Error("PUBLIC_CONTENT_NOT_FOUND");
  }

  const content = await getPublicContentBySlug({
    companyId,

    slug: normalizedSlug,
  });

  if (
    !content ||
    content.deletedAt ||
    content.status !== "published" ||
    !content.publishedAt
  ) {
    throw new Error("PUBLIC_CONTENT_NOT_FOUND");
  }

  return content;
}

function getContentRef({ companyId, contentId }) {
  return adminDb
    .collection("companies")
    .doc(companyId)
    .collection("publicContents")
    .doc(contentId);
}

/*
 * =========================================================
 * VIEW
 * =========================================================
 */

export async function recordPublicContentView({ companyId, slug, visitorId }) {
  const safeVisitorId = normalizeVisitorId(visitorId);

  if (!safeVisitorId) {
    throw new Error("INVALID_VISITOR_ID");
  }

  const content = await resolvePublishedContent({
    companyId,
    slug,
  });

  const contentRef = getContentRef({
    companyId,

    contentId: content.id,
  });

  const viewerRef = contentRef.collection("viewers").doc(safeVisitorId);

  const likeRef = contentRef.collection("likes").doc(safeVisitorId);

  return adminDb.runTransaction(async (transaction) => {
    /*
     * Reads must happen before writes.
     */
    const contentSnapshot = await transaction.get(contentRef);

    const viewerSnapshot = await transaction.get(viewerRef);

    const likeSnapshot = await transaction.get(likeRef);

    if (!contentSnapshot.exists) {
      throw new Error("PUBLIC_CONTENT_NOT_FOUND");
    }

    const currentData = contentSnapshot.data();

    if (
      currentData.deletedAt ||
      currentData.status !== "published" ||
      !currentData.publishedAt
    ) {
      throw new Error("PUBLIC_CONTENT_NOT_FOUND");
    }

    const currentEngagement = getEngagement(currentData);

    const lastViewedAt = viewerSnapshot.exists
      ? getTimestampMillis(viewerSnapshot.data()?.lastViewedAt)
      : 0;

    const now = Date.now();

    const shouldCount = !lastViewedAt || now - lastViewedAt >= VIEW_COOLDOWN_MS;

    let views = currentEngagement.views;

    if (shouldCount) {
      views += 1;

      transaction.set(
        viewerRef,
        {
          lastViewedAt: FieldValue.serverTimestamp(),

          updatedAt: FieldValue.serverTimestamp(),
        },
        {
          merge: true,
        },
      );

      transaction.update(contentRef, {
        "engagement.views": views,

        "engagement.likes": currentEngagement.likes,

        "engagement.shares": currentEngagement.shares,

        "engagement.updatedAt": FieldValue.serverTimestamp(),
      });
    }

    return {
      engagement: {
        ...currentEngagement,

        views,
      },

      liked: likeSnapshot.exists,

      counted: shouldCount,
    };
  });
}

/*
 * =========================================================
 * LIKE / UNLIKE
 * =========================================================
 */

export async function togglePublicContentLike({ companyId, slug, visitorId }) {
  const safeVisitorId = normalizeVisitorId(visitorId);

  if (!safeVisitorId) {
    throw new Error("INVALID_VISITOR_ID");
  }

  const content = await resolvePublishedContent({
    companyId,
    slug,
  });

  const contentRef = getContentRef({
    companyId,

    contentId: content.id,
  });

  const likeRef = contentRef.collection("likes").doc(safeVisitorId);

  return adminDb.runTransaction(async (transaction) => {
    const contentSnapshot = await transaction.get(contentRef);

    const likeSnapshot = await transaction.get(likeRef);

    if (!contentSnapshot.exists) {
      throw new Error("PUBLIC_CONTENT_NOT_FOUND");
    }

    const currentData = contentSnapshot.data();

    if (
      currentData.deletedAt ||
      currentData.status !== "published" ||
      !currentData.publishedAt
    ) {
      throw new Error("PUBLIC_CONTENT_NOT_FOUND");
    }

    const currentEngagement = getEngagement(currentData);

    const currentlyLiked = likeSnapshot.exists;

    const nextLiked = !currentlyLiked;

    const nextLikes = nextLiked
      ? currentEngagement.likes + 1
      : Math.max(
          0,

          currentEngagement.likes - 1,
        );

    if (nextLiked) {
      transaction.set(likeRef, {
        createdAt: FieldValue.serverTimestamp(),
      });
    } else {
      transaction.delete(likeRef);
    }

    transaction.update(contentRef, {
      "engagement.views": currentEngagement.views,

      "engagement.likes": nextLikes,

      "engagement.shares": currentEngagement.shares,

      "engagement.updatedAt": FieldValue.serverTimestamp(),
    });

    return {
      engagement: {
        ...currentEngagement,

        likes: nextLikes,
      },

      liked: nextLiked,
    };
  });
}

/*
 * =========================================================
 * SHARE
 * =========================================================
 *
 * Counts:
 *
 * Facebook
 * X
 * LinkedIn
 * Copy Link
 * Native Share (future)
 *
 * One browser/channel combination
 * is throttled for 5 seconds.
 * =========================================================
 */

export async function recordPublicContentShare({
  companyId,
  slug,
  visitorId,
  channel,
}) {
  const safeVisitorId = normalizeVisitorId(visitorId);

  if (!safeVisitorId) {
    throw new Error("INVALID_VISITOR_ID");
  }

  const safeChannel = normalizeShareChannel(channel);

  if (!safeChannel) {
    throw new Error("INVALID_SHARE_CHANNEL");
  }

  const content = await resolvePublishedContent({
    companyId,
    slug,
  });

  const contentRef = getContentRef({
    companyId,

    contentId: content.id,
  });

  const shareEventRef = contentRef
    .collection("shareEvents")
    .doc(`${safeVisitorId}_${safeChannel}`);

  return adminDb.runTransaction(async (transaction) => {
    const contentSnapshot = await transaction.get(contentRef);

    const eventSnapshot = await transaction.get(shareEventRef);

    if (!contentSnapshot.exists) {
      throw new Error("PUBLIC_CONTENT_NOT_FOUND");
    }

    const currentData = contentSnapshot.data();

    if (
      currentData.deletedAt ||
      currentData.status !== "published" ||
      !currentData.publishedAt
    ) {
      throw new Error("PUBLIC_CONTENT_NOT_FOUND");
    }

    const currentEngagement = getEngagement(currentData);

    const lastSharedAt = eventSnapshot.exists
      ? getTimestampMillis(eventSnapshot.data()?.lastSharedAt)
      : 0;

    const now = Date.now();

    const shouldCount =
      !lastSharedAt || now - lastSharedAt >= SHARE_COOLDOWN_MS;

    let shares = currentEngagement.shares;

    if (shouldCount) {
      shares += 1;

      transaction.set(
        shareEventRef,
        {
          channel: safeChannel,

          lastSharedAt: FieldValue.serverTimestamp(),

          updatedAt: FieldValue.serverTimestamp(),
        },
        {
          merge: true,
        },
      );

      transaction.update(contentRef, {
        "engagement.views": currentEngagement.views,

        "engagement.likes": currentEngagement.likes,

        "engagement.shares": shares,

        "engagement.updatedAt": FieldValue.serverTimestamp(),
      });
    }

    return {
      engagement: {
        ...currentEngagement,

        shares,
      },

      channel: safeChannel,

      counted: shouldCount,
    };
  });
}
