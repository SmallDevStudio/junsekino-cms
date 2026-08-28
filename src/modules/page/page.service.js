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

/*
 * =========================================================
 * LOCALIZED
 * =========================================================
 */

function mergeLocalized(defaults = {}, value = {}) {
  return {
    en: value.en ?? defaults.en ?? "",

    th: value.th ?? defaults.th ?? "",
  };
}

/*
 * =========================================================
 * RICH TEXT
 * =========================================================
 */

function isTiptapDocument(value) {
  return value && typeof value === "object" && value.type === "doc";
}

function hasTiptapContent(document) {
  if (!isTiptapDocument(document)) {
    return false;
  }

  if (!Array.isArray(document.content)) {
    return false;
  }

  function nodeHasContent(node) {
    if (!node) {
      return false;
    }

    if (
      node.type === "text" &&
      typeof node.text === "string" &&
      node.text.trim()
    ) {
      return true;
    }

    /*
     * Non-text visual/structural node that
     * itself represents meaningful content.
     */
    if (["horizontalRule", "image"].includes(node.type)) {
      return true;
    }

    return Array.isArray(node.content) && node.content.some(nodeHasContent);
  }

  return document.content.some(nodeHasContent);
}

function hasRichTextContent(value) {
  if (typeof value === "string") {
    return Boolean(value.trim());
  }

  return hasTiptapContent(value);
}

function hasLocalizedRichText(value) {
  return hasRichTextContent(value?.en) || hasRichTextContent(value?.th);
}

/*
 * =========================================================
 * SEO
 * =========================================================
 */

function mergeSeo(seo = {}) {
  return {
    ...DEFAULT_PAGE_SEO,
    ...seo,

    en: {
      ...DEFAULT_PAGE_SEO.en,
      ...(seo.en || {}),
    },

    th: {
      ...DEFAULT_PAGE_SEO.th,
      ...(seo.th || {}),
    },
  };
}

/*
 * =========================================================
 * BLOCKS
 * =========================================================
 */

function normalizeSections(sections = []) {
  if (!Array.isArray(sections)) {
    return [];
  }

  return sections.map((section, index) => ({
    ...section,

    id: section.id || crypto.randomUUID(),

    enabled: section.enabled !== false,

    sortOrder: section.sortOrder ?? index,

    data: section.data || {},
  }));
}

/*
 * =========================================================
 * NORMALIZE INPUT
 * =========================================================
 */

function normalizePageInput(input) {
  return {
    ...input,

    slug: input.slug?.trim().toLowerCase(),

    pageType: input.pageType || "standard",

    title: mergeLocalized({}, input.title),

    excerpt: mergeLocalized({}, input.excerpt),

    /*
     * Preserve either legacy string or
     * TipTap JSON for each language.
     */
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

    /*
     * New page always starts draft.
     */
    status: PAGE_STATUS.DRAFT,

    scheduledAt: null,

    seo: mergeSeo(input.seo),
  };
}

/*
 * =========================================================
 * VALIDATION
 * =========================================================
 */

function validatePageTitle(page) {
  /*
   * New platform rule:
   * English is canonical.
   *
   * Existing Thai-only legacy page can still
   * be loaded/edited, but new publishing flow
   * should have an English title.
   */
  const hasEnglish = Boolean(page.title?.en?.trim());

  if (!hasEnglish) {
    throw new Error("PAGE_TITLE_REQUIRED");
  }
}

function validatePublishablePage(page) {
  validatePageTitle(page);

  const hasContent = hasLocalizedRichText(page.content);

  const hasSections =
    Array.isArray(page.sections) &&
    page.sections.some((section) => section.enabled !== false);

  if (!hasContent && !hasSections) {
    throw new Error("PAGE_CONTENT_REQUIRED");
  }
}

/*
 * =========================================================
 * LIST
 * =========================================================
 */

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
      const values = [item.title?.en, item.title?.th, item.slug, item.pageType]
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

/*
 * =========================================================
 * GET
 * =========================================================
 */

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

/*
 * =========================================================
 * CREATE
 * =========================================================
 */

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

/*
 * =========================================================
 * UPDATE
 * =========================================================
 */

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

      en: {
        ...existing.seo?.en,

        ...input.seo?.en,
      },

      th: {
        ...existing.seo?.th,

        ...input.seo?.th,
      },
    });
  }

  /*
   * Lifecycle fields cannot be modified
   * through normal content PATCH.
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

/*
 * =========================================================
 * PUBLISH
 * =========================================================
 */

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

/*
 * =========================================================
 * UNPUBLISH
 * =========================================================
 */

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

/*
 * =========================================================
 * DELETE
 * =========================================================
 */

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
