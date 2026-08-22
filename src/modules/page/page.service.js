import "server-only";

import { DEFAULT_PAGE_SEO, PAGE_STATUS } from "@/constants/page";

import {
  createPageRecord,
  getPageById,
  listPageRecords,
  publishPageRecord,
  softDeletePageRecord,
  unpublishPageRecord,
  updatePageRecord,
} from "./page.repository";

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
    ...DEFAULT_PAGE_SEO,
    ...seo,

    th: {
      ...DEFAULT_PAGE_SEO.th,
      ...(seo.th || {}),
    },

    en: {
      ...DEFAULT_PAGE_SEO.en,
      ...(seo.en || {}),
    },
  };
}

function normalizeSections(sections = []) {
  return sections.map((section, index) => ({
    ...section,

    id: section.id || crypto.randomUUID(),

    enabled: section.enabled !== false,

    sortOrder: section.sortOrder ?? index,

    data: section.data || {},
  }));
}

function normalizePageInput(input) {
  return {
    ...input,

    slug: input.slug?.trim().toLowerCase(),

    pageType: input.pageType || "standard",

    title: mergeLocalized({}, input.title),

    excerpt: mergeLocalized({}, input.excerpt),

    content: mergeLocalized({}, input.content),

    hero: input.hero || {
      enabled: false,
    },

    sections: normalizeSections(input.sections || []),

    navigation: {
      showInNavigation: input.navigation?.showInNavigation === true,

      label: mergeLocalized({}, input.navigation?.label),

      sortOrder: input.navigation?.sortOrder ?? 0,
    },

    featuredImage: input.featuredImage ?? null,

    status: PAGE_STATUS.DRAFT,

    scheduledAt: null,

    seo: mergeSeo(input.seo),
  };
}

function validatePageTitle(page) {
  const hasThai = Boolean(page.title?.th?.trim());

  const hasEnglish = Boolean(page.title?.en?.trim());

  if (!hasThai && !hasEnglish) {
    throw new Error("PAGE_TITLE_REQUIRED");
  }
}

function validatePublishablePage(page) {
  validatePageTitle(page);

  const hasContent =
    Boolean(page.content?.th?.trim()) || Boolean(page.content?.en?.trim());

  const hasSections =
    Array.isArray(page.sections) &&
    page.sections.some((section) => section.enabled !== false);

  if (!hasContent && !hasSections) {
    throw new Error("PAGE_CONTENT_REQUIRED");
  }
}

export async function listPages({
  companyId,
  status = null,
  pageType = null,
  search = null,
}) {
  let items = await listPageRecords({
    companyId,
  });

  if (status) {
    items = items.filter((item) => item.status === status);
  }

  if (pageType) {
    items = items.filter((item) => item.pageType === pageType);
  }

  if (search) {
    const keyword = search.trim().toLowerCase();

    items = items.filter((item) => {
      const values = [item.title?.th, item.title?.en, item.slug, item.pageType]
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

export async function getPage({ companyId, pageId }) {
  const page = await getPageById({
    companyId,
    pageId,
  });

  if (!page || page.deletedAt) {
    throw new Error("PAGE_NOT_FOUND");
  }

  return serializeFirestoreDocument(page);
}

export async function createPage({ companyId, input, currentUser }) {
  const data = normalizePageInput(input);

  validatePageTitle(data);

  const page = await createPageRecord({
    companyId,

    data,

    userId: currentUser.uid,
  });

  const serializedPage = serializeFirestoreDocument(page);

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: AUDIT_ACTIONS.PAGE_CREATE,

    resource: "page",

    resourceId: page.id,

    before: null,

    after: serializedPage,
  });

  return serializedPage;
}

export async function updatePage({ companyId, pageId, input, currentUser }) {
  const existing = await getPageById({
    companyId,
    pageId,
  });

  if (!existing || existing.deletedAt) {
    throw new Error("PAGE_NOT_FOUND");
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

  if (input.sections) {
    updateData.sections = normalizeSections(input.sections);
  }

  if (input.navigation) {
    updateData.navigation = {
      ...existing.navigation,
      ...input.navigation,

      label: mergeLocalized(
        existing.navigation?.label,
        input.navigation?.label,
      ),
    };
  }

  if (input.hero) {
    updateData.hero = {
      ...existing.hero,
      ...input.hero,
    };
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

  validatePageTitle(preview);

  const result = await updatePageRecord({
    companyId,
    pageId,

    data: updateData,

    userId: currentUser.uid,
  });

  const serializedBefore = serializeFirestoreDocument(result.before);

  const serializedAfter = serializeFirestoreDocument(result.after);

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: AUDIT_ACTIONS.PAGE_UPDATE,

    resource: "page",

    resourceId: pageId,

    before: serializedBefore,

    after: serializedAfter,
  });

  return serializedAfter;
}

export async function publishPage({
  companyId,
  pageId,
  scheduledAt = null,
  currentUser,
}) {
  const existing = await getPageById({
    companyId,
    pageId,
  });

  if (!existing || existing.deletedAt) {
    throw new Error("PAGE_NOT_FOUND");
  }

  validatePublishablePage(existing);

  const result = await publishPageRecord({
    companyId,
    pageId,

    scheduledAt,

    userId: currentUser.uid,
  });

  const serializedBefore = serializeFirestoreDocument(result.before);

  const serializedAfter = serializeFirestoreDocument(result.after);

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: scheduledAt
      ? AUDIT_ACTIONS.PAGE_SCHEDULE
      : AUDIT_ACTIONS.PAGE_PUBLISH,

    resource: "page",

    resourceId: pageId,

    before: serializedBefore,

    after: serializedAfter,
  });

  return serializedAfter;
}

export async function unpublishPage({ companyId, pageId, currentUser }) {
  const result = await unpublishPageRecord({
    companyId,
    pageId,

    userId: currentUser.uid,
  });

  const serializedBefore = serializeFirestoreDocument(result.before);

  const serializedAfter = serializeFirestoreDocument(result.after);

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: AUDIT_ACTIONS.PAGE_UNPUBLISH,

    resource: "page",

    resourceId: pageId,

    before: serializedBefore,

    after: serializedAfter,
  });

  return serializedAfter;
}

export async function deletePage({ companyId, pageId, currentUser }) {
  const before = await softDeletePageRecord({
    companyId,
    pageId,

    userId: currentUser.uid,
  });

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: AUDIT_ACTIONS.PAGE_DELETE,

    resource: "page",

    resourceId: pageId,

    before: serializeFirestoreDocument(before),

    after: {
      deleted: true,
    },
  });

  return {
    id: pageId,

    deleted: true,
  };
}
