import "server-only";

import { getNewsBySlug, listNewsRecords } from "@/modules/news/news.repository";

import { serializeFirestoreDocument } from "@/utils/firestore";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

function normalizeLimit(value) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return DEFAULT_LIMIT;
  }

  return Math.min(parsed, MAX_LIMIT);
}

function normalizePage(value) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return 1;
  }

  return parsed;
}

function mapLocalized(value) {
  return {
    th: value?.th || "",
    en: value?.en || "",
  };
}

function createMediaUrl({ companySlug, mediaId, variant = "large" }) {
  if (!companySlug || !mediaId) {
    return null;
  }

  return `/api/public/v1/companies/${encodeURIComponent(
    companySlug,
  )}/media/${encodeURIComponent(mediaId)}?variant=${encodeURIComponent(
    variant,
  )}`;
}

function mapImage(image, companySlug) {
  if (!image?.mediaId) {
    return null;
  }

  return {
    mediaId: image.mediaId,

    url: createMediaUrl({
      companySlug,
      mediaId: image.mediaId,
      variant: "large",
    }),

    mediumUrl: createMediaUrl({
      companySlug,
      mediaId: image.mediaId,
      variant: "medium",
    }),

    thumbnailUrl: createMediaUrl({
      companySlug,
      mediaId: image.mediaId,
      variant: "thumbnail",
    }),

    alt: mapLocalized(image.alt),

    caption: mapLocalized(image.caption),
  };
}

function mapSeo(seo) {
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

function matchesSearch(news, search) {
  const keyword = String(search || "")
    .trim()
    .toLowerCase();

  if (!keyword) {
    return true;
  }

  const values = [
    news.slug,
    news.title?.th,
    news.title?.en,
    news.excerpt?.th,
    news.excerpt?.en,
    news.category,
    news.author,
    ...(Array.isArray(news.tags) ? news.tags : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return values.includes(keyword);
}

function mapPublicNews({ news, companySlug, detail = false }) {
  const serialized = serializeFirestoreDocument(news);

  const result = {
    id: serialized.id,

    slug: serialized.slug,

    title: mapLocalized(serialized.title),

    excerpt: mapLocalized(serialized.excerpt),

    category: serialized.category || null,

    tags: Array.isArray(serialized.tags) ? serialized.tags : [],

    author: serialized.author || null,

    cover: mapImage(serialized.featuredImage, companySlug),

    featured: serialized.featured === true,

    publishedAt: serialized.publishedAt || null,

    updatedAt: serialized.updatedAt || null,
  };

  if (detail) {
    result.content = mapLocalized(serialized.content);

    result.seo = mapSeo(serialized.seo);
  }

  return result;
}

export async function listPublicWebsiteNews({
  companyId,
  companySlug,

  category = null,
  featured = null,
  search = null,

  page = 1,
  limit = DEFAULT_LIMIT,
}) {
  let items = await listNewsRecords({
    companyId,
  });

  items = items.filter(
    (news) =>
      !news.deletedAt &&
      news.status === "published" &&
      Boolean(news.publishedAt),
  );

  if (category) {
    const normalizedCategory = category.trim().toLowerCase();

    items = items.filter(
      (news) =>
        String(news.category || "")
          .trim()
          .toLowerCase() === normalizedCategory,
    );
  }

  if (featured !== null) {
    items = items.filter((news) => news.featured === featured);
  }

  if (search) {
    items = items.filter((news) => matchesSearch(news, search));
  }

  items.sort(
    (a, b) =>
      getTimestampMillis(b.publishedAt) - getTimestampMillis(a.publishedAt),
  );

  const safeLimit = normalizeLimit(limit);
  const safePage = normalizePage(page);

  const total = items.length;

  const totalPages = total > 0 ? Math.ceil(total / safeLimit) : 0;

  const offset = (safePage - 1) * safeLimit;

  const pageItems = items.slice(offset, offset + safeLimit);

  return {
    items: pageItems.map((news) =>
      mapPublicNews({
        news,
        companySlug,
      }),
    ),

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

export async function getPublicWebsiteNewsBySlug({
  companyId,
  companySlug,
  slug,
}) {
  const news = await getNewsBySlug({
    companyId,
    slug,
  });

  if (
    !news ||
    news.deletedAt ||
    news.status !== "published" ||
    !news.publishedAt
  ) {
    throw new Error("PUBLIC_NEWS_NOT_FOUND");
  }

  return mapPublicNews({
    news,
    companySlug,
    detail: true,
  });
}
