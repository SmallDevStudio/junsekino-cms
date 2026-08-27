import "server-only";

import {
  getAwardBySlug,
  listAwardRecords,
} from "@/modules/award/award.repository";

import { getProjectById } from "@/modules/project/project.repository";

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

function mapAwardInfo(info = {}) {
  return {
    name: mapLocalized(info.name),
    organization: mapLocalized(info.organization),
    year: info.year ?? null,
    category: mapLocalized(info.category),
    level: mapLocalized(info.level),
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

function matchesSearch(award, search) {
  const keyword = String(search || "")
    .trim()
    .toLowerCase();

  if (!keyword) {
    return true;
  }

  const values = [
    award.slug,
    award.title?.th,
    award.title?.en,
    award.excerpt?.th,
    award.excerpt?.en,
    award.awardInfo?.name?.th,
    award.awardInfo?.name?.en,
    award.awardInfo?.organization?.th,
    award.awardInfo?.organization?.en,
    award.awardInfo?.category?.th,
    award.awardInfo?.category?.en,
    award.awardInfo?.level?.th,
    award.awardInfo?.level?.en,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return values.includes(keyword);
}

async function mapRelatedProject({ companyId, projectId }) {
  if (!projectId) {
    return null;
  }

  const project = await getProjectById({
    companyId,
    projectId,
  });

  if (!project || project.deletedAt || project.status !== "published") {
    return null;
  }

  return {
    id: project.id,
    slug: project.slug,
    title: mapLocalized(project.title),
  };
}

async function mapPublicAward({
  companyId,
  companySlug,
  award,
  detail = false,
}) {
  const serialized = serializeFirestoreDocument(award);

  const result = {
    id: serialized.id,

    slug: serialized.slug,

    title: mapLocalized(serialized.title),

    excerpt: mapLocalized(serialized.excerpt),

    awardInfo: mapAwardInfo(serialized.awardInfo),

    project: await mapRelatedProject({
      companyId,
      projectId: serialized.projectId,
    }),

    cover: mapImage(serialized.featuredImage, companySlug),

    featured: serialized.featured === true,

    publishedAt: serialized.publishedAt || null,

    updatedAt: serialized.updatedAt || null,
  };

  if (detail) {
    result.content = mapLocalized(serialized.content);

    result.gallery = Array.isArray(serialized.gallery)
      ? serialized.gallery
          .map((image) => mapImage(image, companySlug))
          .filter(Boolean)
      : [];

    result.seo = mapSeo(serialized.seo);
  }

  return result;
}

export async function listPublicWebsiteAwards({
  companyId,
  companySlug,

  year = null,
  featured = null,
  search = null,

  page = 1,
  limit = DEFAULT_LIMIT,
}) {
  let items = await listAwardRecords(companyId);

  items = items.filter(
    (award) =>
      !award.deletedAt &&
      award.status === "published" &&
      Boolean(award.publishedAt),
  );

  if (year !== null && year !== "") {
    const parsedYear = Number.parseInt(year, 10);

    if (Number.isInteger(parsedYear)) {
      items = items.filter(
        (award) => Number(award.awardInfo?.year) === parsedYear,
      );
    }
  }

  if (featured !== null) {
    items = items.filter((award) => award.featured === featured);
  }

  if (search) {
    items = items.filter((award) => matchesSearch(award, search));
  }

  items.sort((a, b) => {
    const yearA = Number(a.awardInfo?.year) || 0;
    const yearB = Number(b.awardInfo?.year) || 0;

    if (yearA !== yearB) {
      return yearB - yearA;
    }

    return (
      getTimestampMillis(b.publishedAt) - getTimestampMillis(a.publishedAt)
    );
  });

  const safeLimit = normalizeLimit(limit);
  const safePage = normalizePage(page);

  const total = items.length;

  const totalPages = total > 0 ? Math.ceil(total / safeLimit) : 0;

  const offset = (safePage - 1) * safeLimit;

  const pageItems = items.slice(offset, offset + safeLimit);

  const mappedItems = await Promise.all(
    pageItems.map((award) =>
      mapPublicAward({
        companyId,
        companySlug,
        award,
      }),
    ),
  );

  return {
    items: mappedItems,

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

export async function getPublicWebsiteAwardBySlug({
  companyId,
  companySlug,
  slug,
}) {
  const award = await getAwardBySlug({
    companyId,
    slug,
  });

  if (
    !award ||
    award.deletedAt ||
    award.status !== "published" ||
    !award.publishedAt
  ) {
    throw new Error("PUBLIC_AWARD_NOT_FOUND");
  }

  return mapPublicAward({
    companyId,
    companySlug,
    award,
    detail: true,
  });
}
