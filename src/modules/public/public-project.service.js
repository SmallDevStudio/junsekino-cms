import "server-only";

import {
  getProjectBySlug,
  listProjectRecords,
} from "@/modules/project/project.repository";

import { listProjectCategoryRecords } from "@/modules/project/project-category.repository";

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

function mapLocalized(value) {
  return {
    th: value?.th || "",
    en: value?.en || "",
  };
}

function mapImage(image, companySlug) {
  if (!image?.mediaId) {
    return null;
  }

  return {
    mediaId: image.mediaId,

    url: createPublicMediaUrl({
      companySlug,
      mediaId: image.mediaId,
      variant: "large",
    }),

    mediumUrl: createPublicMediaUrl({
      companySlug,
      mediaId: image.mediaId,
      variant: "medium",
    }),

    thumbnailUrl: createPublicMediaUrl({
      companySlug,
      mediaId: image.mediaId,
      variant: "thumbnail",
    }),

    alt: mapLocalized(image.alt),

    caption: mapLocalized(image.caption),
  };
}

function mapGallery(gallery, companySlug) {
  if (!Array.isArray(gallery)) {
    return [];
  }

  return gallery.map((image) => mapImage(image, companySlug)).filter(Boolean);
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

function mapCategory(category) {
  if (!category) {
    return null;
  }

  return {
    id: category.id,
    slug: category.slug || "",
    name: mapLocalized(category.name),
    description: mapLocalized(category.description),
    parentId: category.parentId || null,
    sortOrder: category.sortOrder ?? 0,
  };
}

function mapCredits(credits = {}) {
  const mapCreditList = (items) => {
    if (!Array.isArray(items)) {
      return [];
    }

    return items.map((item) => ({
      th: item?.th || "",
      en: item?.en || "",
    }));
  };

  return {
    architecture: mapCreditList(credits.architecture),
    interior: mapCreditList(credits.interior),
    landscape: mapCreditList(credits.landscape),
    consultant: mapCreditList(credits.consultant),
  };
}

function mapProjectInfo(projectInfo = {}) {
  return {
    location: mapLocalized(projectInfo.location),

    designYear: projectInfo.designYear ?? null,

    completionYear: projectInfo.completionYear ?? null,

    area: {
      value: projectInfo.area?.value ?? null,
      unit: projectInfo.area?.unit || "sqm",
    },

    client: mapLocalized(projectInfo.client),

    credits: mapCredits(projectInfo.credits),
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

function matchesSearch(project, search) {
  const keyword = String(search || "")
    .trim()
    .toLowerCase();

  if (!keyword) {
    return true;
  }

  const searchable = [
    project.title?.th,
    project.title?.en,
    project.excerpt?.th,
    project.excerpt?.en,
    project.slug,
    project.projectInfo?.location?.th,
    project.projectInfo?.location?.en,
    project.projectInfo?.client?.th,
    project.projectInfo?.client?.en,
    ...(Array.isArray(project.tags) ? project.tags : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchable.includes(keyword);
}

function createCategoryMaps(categories) {
  const byId = new Map();
  const bySlug = new Map();

  for (const category of categories) {
    if (category.deletedAt || category.status !== "active") {
      continue;
    }

    byId.set(category.id, category);

    if (category.slug) {
      bySlug.set(category.slug, category);
    }
  }

  return {
    byId,
    bySlug,
  };
}

function mapPublicProject({
  project,
  companySlug,
  categoriesById,
  detail = false,
}) {
  const serialized = serializeFirestoreDocument(project);

  const category = serialized.categoryId
    ? categoriesById.get(serialized.categoryId)
    : null;

  const subCategory = serialized.subCategoryId
    ? categoriesById.get(serialized.subCategoryId)
    : null;

  const result = {
    id: serialized.id,

    slug: serialized.slug,

    title: mapLocalized(serialized.title),

    excerpt: mapLocalized(serialized.excerpt),

    category: mapCategory(category),

    subCategory: mapCategory(subCategory),

    projectInfo: mapProjectInfo(serialized.projectInfo),

    tags: Array.isArray(serialized.tags) ? serialized.tags : [],

    cover: mapImage(serialized.featuredImage, companySlug),

    featured: serialized.featured === true,

    publishedAt: serialized.publishedAt || null,

    updatedAt: serialized.updatedAt || null,
  };

  if (detail) {
    result.content = mapLocalized(serialized.content);

    result.gallery = mapGallery(serialized.gallery, companySlug);

    result.seo = mapSeo(serialized.seo);
  }

  return result;
}

export async function listPublicWebsiteProjects({
  companyId,
  companySlug,

  categorySlug = null,
  subCategorySlug = null,

  featured = null,
  search = null,

  page = 1,
  limit = DEFAULT_LIMIT,
}) {
  const [projects, categories] = await Promise.all([
    listProjectRecords({
      companyId,
    }),

    listProjectCategoryRecords(companyId),
  ]);

  const { byId: categoriesById, bySlug: categoriesBySlug } =
    createCategoryMaps(categories);

  let items = projects.filter(
    (project) =>
      !project.deletedAt &&
      project.status === "published" &&
      Boolean(project.publishedAt),
  );

  if (categorySlug) {
    const category = categoriesBySlug.get(categorySlug);

    if (!category) {
      return {
        items: [],
        pagination: {
          page: 1,
          limit: normalizeLimit(limit),
          total: 0,
          totalPages: 0,
          hasPreviousPage: false,
          hasNextPage: false,
        },
      };
    }

    items = items.filter((project) => project.categoryId === category.id);
  }

  if (subCategorySlug) {
    const subCategory = categoriesBySlug.get(subCategorySlug);

    if (!subCategory) {
      return {
        items: [],
        pagination: {
          page: 1,
          limit: normalizeLimit(limit),
          total: 0,
          totalPages: 0,
          hasPreviousPage: false,
          hasNextPage: false,
        },
      };
    }

    items = items.filter((project) => project.subCategoryId === subCategory.id);
  }

  if (featured !== null) {
    items = items.filter((project) => project.featured === featured);
  }

  if (search) {
    items = items.filter((project) => matchesSearch(project, search));
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
    items: pageItems.map((project) =>
      mapPublicProject({
        project,
        companySlug,
        categoriesById,
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

export async function getPublicWebsiteProjectBySlug({
  companyId,
  companySlug,
  slug,
}) {
  const [project, categories] = await Promise.all([
    getProjectBySlug({
      companyId,
      slug,
    }),

    listProjectCategoryRecords(companyId),
  ]);

  if (
    !project ||
    project.deletedAt ||
    project.status !== "published" ||
    !project.publishedAt
  ) {
    throw new Error("PUBLIC_PROJECT_NOT_FOUND");
  }

  const { byId: categoriesById } = createCategoryMaps(categories);

  return mapPublicProject({
    project,
    companySlug,
    categoriesById,
    detail: true,
  });
}
