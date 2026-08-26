import "server-only";

import {
  DEFAULT_PUBLIC_SEO,
  PUBLIC_CONTENT_TYPE,
} from "@/constants/public-content";

import {
  createPublicContentRecord,
  getPublicContentById,
  listPublicContentRecords,
  publishPublicContentRecord,
  softDeletePublicContentRecord,
  unpublishPublicContentRecord,
  updatePublicContentRecord,
} from "./public-content.repository";

import {
  AUDIT_ACTIONS,
  createAuditLogSafe,
} from "@/modules/audit/audit.service";

import { serializeFirestoreDocument } from "@/utils/firestore";

function mergeLocalized(existing = {}, incoming = {}) {
  return {
    th: incoming?.th ?? existing?.th ?? "",
    en: incoming?.en ?? existing?.en ?? "",
  };
}

function mergeSeo(seo = {}) {
  return {
    ...DEFAULT_PUBLIC_SEO,
    ...seo,

    th: {
      ...DEFAULT_PUBLIC_SEO.th,
      ...(seo.th || {}),
    },

    en: {
      ...DEFAULT_PUBLIC_SEO.en,
      ...(seo.en || {}),
    },
  };
}

function normalizeExternalMetadata(metadata = null) {
  if (!metadata) {
    return null;
  }

  return {
    title: metadata.title || "",

    description: metadata.description || "",

    authorName: metadata.authorName || "",

    authorUrl: metadata.authorUrl || null,

    thumbnailUrl: metadata.thumbnailUrl || null,

    thumbnailWidth: metadata.thumbnailWidth ?? null,

    thumbnailHeight: metadata.thumbnailHeight ?? null,

    publishedAt: metadata.publishedAt || null,

    duration: metadata.duration || null,
  };
}

function validateContent(item) {
  const hasTitle =
    Boolean(item.title?.th?.trim()) || Boolean(item.title?.en?.trim());

  if (!hasTitle) {
    throw new Error("PUBLIC_TITLE_REQUIRED");
  }

  if (item.contentType === PUBLIC_CONTENT_TYPE.ARTICLE) {
    const hasArticle =
      Boolean(item.content?.th?.trim()) || Boolean(item.content?.en?.trim());

    if (!hasArticle) {
      throw new Error("PUBLIC_ARTICLE_CONTENT_REQUIRED");
    }
  }

  if (
    item.contentType === PUBLIC_CONTENT_TYPE.VIDEO ||
    item.contentType === PUBLIC_CONTENT_TYPE.EMBED
  ) {
    if (!item.source?.provider || !item.source?.sourceUrl) {
      throw new Error("PUBLIC_SOURCE_REQUIRED");
    }
  }
}

function normalizeInput(input) {
  return {
    ...input,

    slug: input.slug.trim().toLowerCase(),

    title: mergeLocalized({}, input.title),

    excerpt: mergeLocalized({}, input.excerpt),

    content: mergeLocalized({}, input.content),

    source: {
      provider: input.source?.provider || null,

      sourceUrl: input.source?.sourceUrl || null,

      externalId: input.source?.externalId || null,

      metadata: normalizeExternalMetadata(input.source?.metadata),
    },

    featuredImage: input.featuredImage ?? null,

    gallery: input.gallery || [],

    tags: Array.from(new Set(input.tags || [])),

    featured: input.featured === true,

    seo: mergeSeo(input.seo),
  };
}

export async function listPublicContents({
  companyId,
  status = null,
  contentType = null,
  provider = null,
  search = null,
}) {
  let items = await listPublicContentRecords(companyId);

  if (status) {
    items = items.filter((item) => item.status === status);
  }

  if (contentType) {
    items = items.filter((item) => item.contentType === contentType);
  }

  if (provider) {
    items = items.filter((item) => item.source?.provider === provider);
  }

  if (search) {
    const keyword = search.trim().toLowerCase();

    items = items.filter((item) =>
      [
        item.title?.th,
        item.title?.en,
        item.slug,
        item.source?.provider,
        item.source?.metadata?.title,
        item.source?.metadata?.authorName,
        ...(item.tags || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }

  items.sort(
    (a, b) =>
      (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0),
  );

  return items.map(serializeFirestoreDocument);
}

export async function getPublicContent({ companyId, contentId }) {
  const item = await getPublicContentById({
    companyId,
    contentId,
  });

  if (!item || item.deletedAt) {
    throw new Error("PUBLIC_CONTENT_NOT_FOUND");
  }

  return serializeFirestoreDocument(item);
}

export async function createPublicContent({ companyId, input, currentUser }) {
  const data = normalizeInput(input);

  validateContent(data);

  const item = await createPublicContentRecord({
    companyId,
    data,

    userId: currentUser.uid,
  });

  const serialized = serializeFirestoreDocument(item);

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: AUDIT_ACTIONS.PUBLIC_CREATE,

    resource: "publicContent",

    resourceId: item.id,

    before: null,

    after: serialized,
  });

  return serialized;
}

export async function updatePublicContent({
  companyId,
  contentId,
  input,
  currentUser,
}) {
  const existing = await getPublicContentById({
    companyId,
    contentId,
  });

  if (!existing || existing.deletedAt) {
    throw new Error("PUBLIC_CONTENT_NOT_FOUND");
  }

  const data = {
    ...input,
  };

  if (input.slug) {
    data.slug = input.slug.trim().toLowerCase();
  }

  if (input.title) {
    data.title = mergeLocalized(existing.title, input.title);
  }

  if (input.excerpt) {
    data.excerpt = mergeLocalized(existing.excerpt, input.excerpt);
  }

  if (input.content) {
    data.content = mergeLocalized(existing.content, input.content);
  }

  if (input.source) {
    data.source = {
      provider: input.source.provider ?? existing.source?.provider ?? null,

      sourceUrl: input.source.sourceUrl ?? existing.source?.sourceUrl ?? null,

      externalId:
        input.source.externalId ?? existing.source?.externalId ?? null,

      metadata:
        input.source.metadata === null
          ? null
          : normalizeExternalMetadata(
              input.source.metadata ?? existing.source?.metadata,
            ),
    };
  }

  if (input.tags) {
    data.tags = Array.from(new Set(input.tags));
  }

  if (input.seo) {
    data.seo = mergeSeo({
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

  delete data.status;
  delete data.scheduledAt;
  delete data.publishedAt;
  delete data.publishedBy;
  delete data.deletedAt;
  delete data.deletedBy;

  const preview = {
    ...existing,
    ...data,
  };

  validateContent(preview);

  const result = await updatePublicContentRecord({
    companyId,
    contentId,
    data,

    userId: currentUser.uid,
  });

  const before = serializeFirestoreDocument(result.before);

  const after = serializeFirestoreDocument(result.after);

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: AUDIT_ACTIONS.PUBLIC_UPDATE,

    resource: "publicContent",

    resourceId: contentId,

    before,

    after,
  });

  return after;
}

export async function publishPublicContent({
  companyId,
  contentId,
  scheduledAt = null,
  currentUser,
}) {
  const existing = await getPublicContentById({
    companyId,
    contentId,
  });

  if (!existing || existing.deletedAt) {
    throw new Error("PUBLIC_CONTENT_NOT_FOUND");
  }

  validateContent(existing);

  const result = await publishPublicContentRecord({
    companyId,
    contentId,
    scheduledAt,

    userId: currentUser.uid,
  });

  const before = serializeFirestoreDocument(result.before);

  const after = serializeFirestoreDocument(result.after);

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: scheduledAt
      ? AUDIT_ACTIONS.PUBLIC_SCHEDULE
      : AUDIT_ACTIONS.PUBLIC_PUBLISH,

    resource: "publicContent",

    resourceId: contentId,

    before,

    after,
  });

  return after;
}

export async function unpublishPublicContent({
  companyId,
  contentId,
  currentUser,
}) {
  const result = await unpublishPublicContentRecord({
    companyId,
    contentId,

    userId: currentUser.uid,
  });

  const before = serializeFirestoreDocument(result.before);

  const after = serializeFirestoreDocument(result.after);

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: AUDIT_ACTIONS.PUBLIC_UNPUBLISH,

    resource: "publicContent",

    resourceId: contentId,

    before,

    after,
  });

  return after;
}

export async function deletePublicContent({
  companyId,
  contentId,
  currentUser,
}) {
  const before = await softDeletePublicContentRecord({
    companyId,
    contentId,

    userId: currentUser.uid,
  });

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: AUDIT_ACTIONS.PUBLIC_DELETE,

    resource: "publicContent",

    resourceId: contentId,

    before: serializeFirestoreDocument(before),

    after: {
      deleted: true,
    },
  });

  return {
    id: contentId,

    deleted: true,
  };
}
