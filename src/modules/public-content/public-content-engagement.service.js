import "server-only";

import { getPublicContentBySlug } from "@/modules/public-content/public-content.repository";

import {
  getContentEngagement,
  likeContent,
  shareContent,
  unlikeContent,
  viewContent,
} from "@/modules/engagement/engagement.service";

const CONTENT_TYPE = "public";

const SHARE_CHANNELS = new Set(["facebook", "x", "linkedin", "copy", "native"]);

function normalizeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizeVisitorHash(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  return /^[0-9a-f]{64}$/.test(normalized) ? normalized : null;
}

function normalizeShareChannel(value) {
  const channel = String(value || "")
    .trim()
    .toLowerCase();

  return SHARE_CHANNELS.has(channel) ? channel : null;
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

function formatResult(data, extra = {}) {
  return {
    engagement: {
      views: Number(data?.views) || 0,

      likes: Number(data?.likes) || 0,

      shares: Number(data?.shares) || 0,
    },

    liked: data?.liked === true,

    ...extra,
  };
}

export async function getPublicContentEngagement({
  companyId,

  slug,

  visitorHash = null,
}) {
  const safeVisitorHash = visitorHash
    ? normalizeVisitorHash(visitorHash)
    : null;

  if (visitorHash && !safeVisitorHash) {
    throw new Error("INVALID_VISITOR_HASH");
  }

  const content = await resolvePublishedContent({
    companyId,

    slug,
  });

  const data = await getContentEngagement({
    companyId,

    contentType: CONTENT_TYPE,

    contentId: content.id,

    visitorHash: safeVisitorHash,
  });

  return formatResult(data, {
    counted: false,

    analyticsConsent: false,
  });
}

export async function recordPublicContentView({
  companyId,

  slug,

  visitorHash = null,

  analyticsConsent = false,
}) {
  const safeVisitorHash = visitorHash
    ? normalizeVisitorHash(visitorHash)
    : null;

  if (analyticsConsent && !safeVisitorHash) {
    throw new Error("INVALID_VISITOR_HASH");
  }

  const content = await resolvePublishedContent({
    companyId,

    slug,
  });

  const data = await viewContent({
    companyId,

    contentType: CONTENT_TYPE,

    contentId: content.id,

    visitorHash: safeVisitorHash,

    analyticsConsent,
  });

  const current = await getContentEngagement({
    companyId,

    contentType: CONTENT_TYPE,

    contentId: content.id,

    visitorHash: safeVisitorHash,
  });

  return formatResult(current, {
    counted: data.counted === true,

    unique: data.unique === true,

    analyticsConsent,
  });
}

export async function togglePublicContentLike({
  companyId,

  slug,

  visitorHash,
}) {
  const safeVisitorHash = normalizeVisitorHash(visitorHash);

  if (!safeVisitorHash) {
    throw new Error("INVALID_VISITOR_HASH");
  }

  const content = await resolvePublishedContent({
    companyId,

    slug,
  });

  const current = await getContentEngagement({
    companyId,

    contentType: CONTENT_TYPE,

    contentId: content.id,

    visitorHash: safeVisitorHash,
  });

  const data = current.liked
    ? await unlikeContent({
        companyId,

        contentType: CONTENT_TYPE,

        contentId: content.id,

        visitorHash: safeVisitorHash,
      })
    : await likeContent({
        companyId,

        contentType: CONTENT_TYPE,

        contentId: content.id,

        visitorHash: safeVisitorHash,
      });

  return formatResult(data);
}

export async function recordPublicContentShare({
  companyId,

  slug,

  visitorHash,

  channel,
}) {
  if (!normalizeVisitorHash(visitorHash)) {
    throw new Error("INVALID_VISITOR_HASH");
  }

  const safeChannel = normalizeShareChannel(channel);

  if (!safeChannel) {
    throw new Error("INVALID_SHARE_CHANNEL");
  }

  const content = await resolvePublishedContent({
    companyId,

    slug,
  });

  const data = await shareContent({
    companyId,

    contentType: CONTENT_TYPE,

    contentId: content.id,

    channel: safeChannel,
  });

  return formatResult(data, {
    channel: safeChannel,

    counted: true,
  });
}
