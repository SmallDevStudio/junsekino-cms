import "server-only";

import { DEFAULT_NEWS_SEO, NEWS_STATUS } from "@/constants/news";

import {
  createNewsRecord,
  getNewsById,
  listNewsRecords,
  publishNewsRecord,
  softDeleteNewsRecord,
  unpublishNewsRecord,
  updateNewsRecord,
} from "./news.repository";

import {
  AUDIT_ACTIONS,
  createAuditLogSafe,
} from "@/modules/audit/audit.service";

import { serializeFirestoreDocument } from "@/utils/firestore";

function mergeLocalized(defaults = {}, value = {}) {
  return {
    th: value.th ?? defaults.th ?? "",

    en: value.en ?? defaults.en ?? "",
  };
}

function mergeSeo(seo = {}) {
  return {
    ...DEFAULT_NEWS_SEO,
    ...seo,

    th: {
      ...DEFAULT_NEWS_SEO.th,
      ...(seo.th || {}),
    },

    en: {
      ...DEFAULT_NEWS_SEO.en,
      ...(seo.en || {}),
    },
  };
}

function normalizeNewsInput(input) {
  return {
    ...input,

    slug: input.slug?.trim().toLowerCase(),

    title: mergeLocalized({}, input.title),

    excerpt: mergeLocalized({}, input.excerpt),

    content: mergeLocalized({}, input.content),

    category: input.category || null,

    tags: Array.from(new Set(input.tags || [])),

    author: input.author || null,

    featuredImage: input.featuredImage ?? null,

    featured: input.featured === true,

    status: NEWS_STATUS.DRAFT,

    scheduledAt: null,

    seo: mergeSeo(input.seo),
  };
}

function validateNewsTitle(news) {
  const hasThai = Boolean(news.title?.th?.trim());

  const hasEnglish = Boolean(news.title?.en?.trim());

  if (!hasThai && !hasEnglish) {
    throw new Error("NEWS_TITLE_REQUIRED");
  }
}

function validatePublishableNews(news) {
  validateNewsTitle(news);

  const hasContent =
    Boolean(news.content?.th?.trim()) || Boolean(news.content?.en?.trim());

  if (!hasContent) {
    throw new Error("NEWS_CONTENT_REQUIRED");
  }
}

export async function listNews({ companyId, status = null, search = null }) {
  let items = await listNewsRecords({
    companyId,
  });

  if (status) {
    items = items.filter((item) => item.status === status);
  }

  if (search) {
    const keyword = search.trim().toLowerCase();

    items = items.filter((item) => {
      const values = [
        item.title?.th,
        item.title?.en,
        item.slug,
        item.category,
        item.author,
        ...(item.tags || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return values.includes(keyword);
    });
  }

  items.sort((a, b) => {
    const aDate = a.updatedAt?.toMillis?.() || 0;

    const bDate = b.updatedAt?.toMillis?.() || 0;

    return bDate - aDate;
  });

  return items.map(serializeFirestoreDocument);
}

export async function getNews({ companyId, newsId }) {
  const news = await getNewsById({
    companyId,
    newsId,
  });

  if (!news || news.deletedAt) {
    throw new Error("NEWS_NOT_FOUND");
  }

  return serializeFirestoreDocument(news);
}

export async function createNews({ companyId, input, currentUser }) {
  const data = normalizeNewsInput(input);

  validateNewsTitle(data);

  const news = await createNewsRecord({
    companyId,

    data,

    userId: currentUser.uid,
  });

  const serializedNews = serializeFirestoreDocument(news);

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: AUDIT_ACTIONS.NEWS_CREATE,

    resource: "news",

    resourceId: news.id,

    before: null,

    after: serializedNews,
  });

  return serializedNews;
}

export async function updateNews({ companyId, newsId, input, currentUser }) {
  const existing = await getNewsById({
    companyId,
    newsId,
  });

  if (!existing || existing.deletedAt) {
    throw new Error("NEWS_NOT_FOUND");
  }

  const updateData = {
    ...input,
  };

  if (input.slug) {
    updateData.slug = input.slug.trim().toLowerCase();
  }

  if (input.title) {
    updateData.title = mergeLocalized(existing.title, input.title);
  }

  if (input.excerpt) {
    updateData.excerpt = mergeLocalized(existing.excerpt, input.excerpt);
  }

  if (input.content) {
    updateData.content = mergeLocalized(existing.content, input.content);
  }

  if (input.seo) {
    updateData.seo = mergeSeo({
      ...existing.seo,
      ...input.seo,

      th: {
        ...existing.seo?.th,
        ...input.seo?.th,
      },

      en: {
        ...existing.seo?.en,
        ...input.seo?.en,
      },
    });
  }

  /*
   * Publishing state must only be changed
   * through publish/unpublish endpoints.
   */
  delete updateData.status;
  delete updateData.scheduledAt;
  delete updateData.publishedAt;
  delete updateData.publishedBy;
  delete updateData.deletedAt;
  delete updateData.deletedBy;

  const preview = {
    ...existing,
    ...updateData,
  };

  validateNewsTitle(preview);

  const result = await updateNewsRecord({
    companyId,
    newsId,

    data: updateData,

    userId: currentUser.uid,
  });

  const serializedBefore = serializeFirestoreDocument(result.before);

  const serializedAfter = serializeFirestoreDocument(result.after);

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: AUDIT_ACTIONS.NEWS_UPDATE,

    resource: "news",

    resourceId: newsId,

    before: serializedBefore,

    after: serializedAfter,
  });

  return serializedAfter;
}

export async function publishNews({
  companyId,
  newsId,
  scheduledAt = null,
  currentUser,
}) {
  const existing = await getNewsById({
    companyId,
    newsId,
  });

  if (!existing || existing.deletedAt) {
    throw new Error("NEWS_NOT_FOUND");
  }

  validatePublishableNews(existing);

  const result = await publishNewsRecord({
    companyId,
    newsId,

    scheduledAt,

    userId: currentUser.uid,
  });

  const serializedBefore = serializeFirestoreDocument(result.before);

  const serializedAfter = serializeFirestoreDocument(result.after);

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: scheduledAt
      ? AUDIT_ACTIONS.NEWS_SCHEDULE
      : AUDIT_ACTIONS.NEWS_PUBLISH,

    resource: "news",

    resourceId: newsId,

    before: serializedBefore,

    after: serializedAfter,
  });

  return serializedAfter;
}

export async function unpublishNews({ companyId, newsId, currentUser }) {
  const result = await unpublishNewsRecord({
    companyId,
    newsId,

    userId: currentUser.uid,
  });

  const serializedBefore = serializeFirestoreDocument(result.before);

  const serializedAfter = serializeFirestoreDocument(result.after);

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: AUDIT_ACTIONS.NEWS_UNPUBLISH,

    resource: "news",

    resourceId: newsId,

    before: serializedBefore,

    after: serializedAfter,
  });

  return serializedAfter;
}

export async function deleteNews({ companyId, newsId, currentUser }) {
  const before = await softDeleteNewsRecord({
    companyId,
    newsId,

    userId: currentUser.uid,
  });

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: AUDIT_ACTIONS.NEWS_DELETE,

    resource: "news",

    resourceId: newsId,

    before: serializeFirestoreDocument(before),

    after: {
      deleted: true,
    },
  });

  return {
    id: newsId,

    deleted: true,
  };
}
