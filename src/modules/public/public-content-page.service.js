import "server-only";

import { listPublicContentRecords } from "@/modules/public-content/public-content.repository";

import { serializeFirestoreDocument } from "@/utils/firestore";

function localized(value) {
  return {
    th: value?.th || "",
    en: value?.en || "",
  };
}

function normalizeMetric(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return 0;
  }

  return Math.floor(number);
}

function isPublished(item) {
  return (
    !item.deletedAt && item.status === "published" && Boolean(item.publishedAt)
  );
}

function getTimestampMillis(value) {
  if (!value) {
    return 0;
  }

  if (typeof value?.toMillis === "function") {
    return value.toMillis();
  }

  const parsed = new Date(value).getTime();

  return Number.isNaN(parsed) ? 0 : parsed;
}

/*
 * =========================================================
 * SORT
 * =========================================================
 *
 * Public feed requirement:
 *
 * newest added content first
 *
 * createdAt DESC
 *
 * Older records without createdAt fall
 * back to publishedAt.
 * =========================================================
 */

function sortContents(a, b) {
  const aDate =
    getTimestampMillis(a.createdAt) || getTimestampMillis(a.publishedAt);

  const bDate =
    getTimestampMillis(b.createdAt) || getTimestampMillis(b.publishedAt);

  return bDate - aDate;
}

function getPublicSection(item) {
  if (item.contentType === "video" || item.contentType === "embed") {
    return "video";
  }

  return "publication";
}

function normalizeSource(source) {
  if (!source) {
    return null;
  }

  return {
    provider: source.provider || null,

    sourceUrl: source.sourceUrl || null,

    externalId: source.externalId || null,

    metadata: source.metadata
      ? {
          title: source.metadata.title || "",

          description: source.metadata.description || "",

          authorName: source.metadata.authorName || "",

          authorUrl: source.metadata.authorUrl || null,

          thumbnailUrl: source.metadata.thumbnailUrl || null,

          thumbnailWidth: source.metadata.thumbnailWidth ?? null,

          thumbnailHeight: source.metadata.thumbnailHeight ?? null,

          publishedAt: source.metadata.publishedAt || null,

          duration: source.metadata.duration || null,

          statistics: source.metadata.statistics || null,
        }
      : null,
  };
}

function normalizeContent(item) {
  const serialized = serializeFirestoreDocument(item);

  return {
    id: serialized.id,

    slug: serialized.slug || "",

    section: getPublicSection(serialized),

    contentType: serialized.contentType,

    title: localized(serialized.title),

    excerpt: localized(serialized.excerpt),

    content: localized(serialized.content),

    source: normalizeSource(serialized.source),

    featuredImage: serialized.featuredImage?.mediaId
      ? {
          mediaId: serialized.featuredImage.mediaId,

          alt: localized(serialized.featuredImage.alt),
        }
      : null,

    gallery: Array.isArray(serialized.gallery)
      ? serialized.gallery
          .filter((image) => image?.mediaId)
          .map((image) => ({
            mediaId: image.mediaId,

            alt: localized(image.alt),
          }))
      : [],

    tags: Array.isArray(serialized.tags) ? serialized.tags : [],

    featured: serialized.featured === true,

    /*
     * Used by public feed sorting.
     */
    createdAt: serialized.createdAt || null,

    publishedAt: serialized.publishedAt || null,

    updatedAt: serialized.updatedAt || null,

    engagement: {
      views: normalizeMetric(serialized.engagement?.views),

      likes: normalizeMetric(serialized.engagement?.likes),

      shares: normalizeMetric(serialized.engagement?.shares),
    },
  };
}

export async function getPublicContentPageData({ companyId }) {
  const records = await listPublicContentRecords(companyId);

  const items = records
    .filter(isPublished)
    .sort(sortContents)
    .map(normalizeContent);

  const videos = items.filter((item) => item.section === "video");

  const publications = items.filter((item) => item.section === "publication");

  const tags = Array.from(new Set(items.flatMap((item) => item.tags)))
    .filter(Boolean)
    .sort((a, b) =>
      a.localeCompare(b, "en", {
        sensitivity: "base",
      }),
    );

  const providers = Array.from(
    new Set(items.map((item) => item.source?.provider).filter(Boolean)),
  ).sort();

  return {
    items,
    videos,
    publications,
    tags,
    providers,
  };
}

export async function getPublicContentPageBySlug({ companyId, slug }) {
  const records = await listPublicContentRecords(companyId);

  const item =
    records.find((record) => isPublished(record) && record.slug === slug) ||
    null;

  if (!item) {
    throw new Error("PUBLIC_CONTENT_NOT_FOUND");
  }

  return normalizeContent(item);
}
