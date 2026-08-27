import "server-only";

import { getPublicContentBySlug } from "@/modules/public-content/public-content.repository";

import { adminDb } from "@/lib/firebase/admin";

import { serializeFirestoreDocument } from "@/utils/firestore";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

function getCollection(companyId) {
  return adminDb
    .collection("companies")
    .doc(companyId)
    .collection("publicContents");
}

function normalizeLimit(value) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return DEFAULT_LIMIT;
  }

  return Math.min(parsed, MAX_LIMIT);
}

function createPublicMediaUrl({ companySlug, mediaId, variant = "large" }) {
  if (!companySlug || !mediaId) {
    return null;
  }

  return `/api/public/v1/companies/${encodeURIComponent(
    companySlug,
  )}/media/${encodeURIComponent(mediaId)}?variant=${encodeURIComponent(
    variant,
  )}`;
}

function resolveCover(item, companySlug) {
  /*
   * Priority 1
   *
   * Custom cover selected from Media Library.
   */
  if (item.featuredImage?.mediaId) {
    return {
      type: "media",

      mediaId: item.featuredImage.mediaId,

      url: createPublicMediaUrl({
        companySlug,

        mediaId: item.featuredImage.mediaId,

        variant: "large",
      }),

      thumbnailUrl: createPublicMediaUrl({
        companySlug,

        mediaId: item.featuredImage.mediaId,

        variant: "thumbnail",
      }),

      alt: {
        th: item.featuredImage.alt?.th || "",
        en: item.featuredImage.alt?.en || "",
      },

      caption: {
        th: item.featuredImage.caption?.th || "",
        en: item.featuredImage.caption?.en || "",
      },
    };
  }

  /*
   * Priority 2
   *
   * External provider thumbnail.
   * YouTube metadata is the primary use case.
   */
  const externalThumbnail = item.source?.metadata?.thumbnailUrl;

  if (externalThumbnail) {
    return {
      type: "external",

      mediaId: null,

      url: externalThumbnail,

      thumbnailUrl: externalThumbnail,

      alt: {
        th: item.title?.th || item.source?.metadata?.title || "",
        en: item.title?.en || item.source?.metadata?.title || "",
      },

      caption: {
        th: "",
        en: "",
      },
    };
  }

  return null;
}

function mapSource(source = null) {
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
        }
      : null,
  };
}

function mapSeo(seo = null) {
  if (!seo) {
    return null;
  }

  return {
    th: {
      title: seo.th?.title || "",

      description: seo.th?.description || "",

      keywords: Array.isArray(seo.th?.keywords) ? seo.th.keywords : [],

      ogTitle: seo.th?.ogTitle || "",

      ogDescription: seo.th?.ogDescription || "",

      ogImage: seo.th?.ogImage || null,
    },

    en: {
      title: seo.en?.title || "",

      description: seo.en?.description || "",

      keywords: Array.isArray(seo.en?.keywords) ? seo.en.keywords : [],

      ogTitle: seo.en?.ogTitle || "",

      ogDescription: seo.en?.ogDescription || "",

      ogImage: seo.en?.ogImage || null,
    },

    index: seo.index !== false,

    follow: seo.follow !== false,
  };
}

function mapGallery(gallery = [], companySlug) {
  if (!Array.isArray(gallery)) {
    return [];
  }

  return gallery
    .filter((image) => image?.mediaId)
    .map((image) => ({
      mediaId: image.mediaId,

      url: createPublicMediaUrl({
        companySlug,

        mediaId: image.mediaId,

        variant: "large",
      }),

      thumbnailUrl: createPublicMediaUrl({
        companySlug,

        mediaId: image.mediaId,

        variant: "thumbnail",
      }),

      alt: {
        th: image.alt?.th || "",
        en: image.alt?.en || "",
      },

      caption: {
        th: image.caption?.th || "",
        en: image.caption?.en || "",
      },
    }));
}

function mapPublicContent(item, companySlug, { detail = false } = {}) {
  const serialized = serializeFirestoreDocument(item);

  const result = {
    id: serialized.id,

    slug: serialized.slug,

    contentType: serialized.contentType,

    title: {
      th: serialized.title?.th || "",
      en: serialized.title?.en || "",
    },

    excerpt: {
      th: serialized.excerpt?.th || "",
      en: serialized.excerpt?.en || "",
    },

    source: mapSource(serialized.source),

    cover: resolveCover(serialized, companySlug),

    tags: Array.isArray(serialized.tags) ? serialized.tags : [],

    featured: serialized.featured === true,

    publishedAt: serialized.publishedAt || null,

    updatedAt: serialized.updatedAt || null,
  };

  /*
   * Heavy fields are only returned
   * from the detail endpoint.
   */
  if (detail) {
    result.content = {
      th: serialized.content?.th || "",
      en: serialized.content?.en || "",
    };

    result.gallery = mapGallery(serialized.gallery, companySlug);

    result.seo = mapSeo(serialized.seo);
  }

  return result;
}

function matchesSearch(item, search) {
  if (!search) {
    return true;
  }

  const keyword = search.trim().toLowerCase();

  if (!keyword) {
    return true;
  }

  const searchable = [
    item.title?.th,
    item.title?.en,
    item.excerpt?.th,
    item.excerpt?.en,
    item.slug,
    item.source?.provider,
    item.source?.metadata?.title,
    item.source?.metadata?.authorName,
    ...(Array.isArray(item.tags) ? item.tags : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchable.includes(keyword);
}

function getTimestampMillis(value) {
  if (!value) {
    return 0;
  }

  if (typeof value.toMillis === "function") {
    return value.toMillis();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  const parsed = new Date(value).getTime();

  return Number.isNaN(parsed) ? 0 : parsed;
}

export async function listPublicWebsiteContents({
  companyId,
  companySlug,

  contentType = null,
  provider = null,
  featured = null,
  search = null,

  page = 1,
  limit = DEFAULT_LIMIT,
}) {
  const snapshot = await getCollection(companyId)
    .where("status", "==", "published")
    .get();

  let items = snapshot.docs
    .map((document) => ({
      id: document.id,
      ...document.data(),
    }))
    .filter((item) => !item.deletedAt);

  /*
   * Defensive check.
   *
   * A scheduled document must never leak
   * through this endpoint.
   */
  items = items.filter(
    (item) => item.status === "published" && Boolean(item.publishedAt),
  );

  if (contentType) {
    items = items.filter((item) => item.contentType === contentType);
  }

  if (provider) {
    items = items.filter((item) => item.source?.provider === provider);
  }

  if (featured !== null) {
    items = items.filter((item) => item.featured === featured);
  }

  if (search) {
    items = items.filter((item) => matchesSearch(item, search));
  }

  items.sort(
    (a, b) =>
      getTimestampMillis(b.publishedAt) - getTimestampMillis(a.publishedAt),
  );

  const safeLimit = normalizeLimit(limit);

  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);

  const total = items.length;

  const totalPages = total === 0 ? 0 : Math.ceil(total / safeLimit);

  const offset = (safePage - 1) * safeLimit;

  const paginatedItems = items.slice(offset, offset + safeLimit);

  return {
    items: paginatedItems.map((item) => mapPublicContent(item, companySlug)),

    pagination: {
      page: safePage,

      limit: safeLimit,

      total,

      totalPages,

      hasPreviousPage: safePage > 1,

      hasNextPage: totalPages > 0 && safePage < totalPages,
    },
  };
}

export async function getPublicWebsiteContentBySlug({
  companyId,
  companySlug,
  slug,
}) {
  const item = await getPublicContentBySlug({
    companyId,
    slug,
  });

  if (
    !item ||
    item.deletedAt ||
    item.status !== "published" ||
    !item.publishedAt
  ) {
    throw new Error("PUBLIC_CONTENT_NOT_FOUND");
  }

  return mapPublicContent(item, companySlug, {
    detail: true,
  });
}
