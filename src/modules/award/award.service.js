import "server-only";

import { DEFAULT_AWARD_SEO } from "@/constants/award";

import {
  createAwardRecord,
  getAwardById,
  listAwardRecords,
  publishAwardRecord,
  softDeleteAwardRecord,
  unpublishAwardRecord,
  updateAwardRecord,
} from "./award.repository";

import { getProjectById } from "@/modules/project/project.repository";

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
    ...DEFAULT_AWARD_SEO,
    ...seo,

    th: {
      ...DEFAULT_AWARD_SEO.th,
      ...(seo.th || {}),
    },

    en: {
      ...DEFAULT_AWARD_SEO.en,
      ...(seo.en || {}),
    },
  };
}

async function validateProjectRelation({ companyId, projectId }) {
  if (!projectId) {
    return;
  }

  const project = await getProjectById({
    companyId,
    projectId,
  });

  if (!project || project.deletedAt) {
    throw new Error("AWARD_PROJECT_NOT_FOUND");
  }
}

function validateAward(award) {
  const hasTitle =
    Boolean(award.title?.th?.trim()) || Boolean(award.title?.en?.trim());

  if (!hasTitle) {
    throw new Error("AWARD_TITLE_REQUIRED");
  }

  const hasAwardName =
    Boolean(award.awardInfo?.name?.th?.trim()) ||
    Boolean(award.awardInfo?.name?.en?.trim());

  if (!hasAwardName) {
    throw new Error("AWARD_NAME_REQUIRED");
  }
}

function normalizeAwardInput(input) {
  return {
    ...input,

    slug: input.slug.trim().toLowerCase(),

    title: mergeLocalized({}, input.title),

    projectId: input.projectId || null,

    awardInfo: {
      name: mergeLocalized({}, input.awardInfo?.name),

      organization: mergeLocalized({}, input.awardInfo?.organization),

      year: input.awardInfo?.year ?? null,

      category: mergeLocalized({}, input.awardInfo?.category),

      level: mergeLocalized({}, input.awardInfo?.level),
    },

    excerpt: mergeLocalized({}, input.excerpt),

    content: mergeLocalized({}, input.content),

    featuredImage: input.featuredImage ?? null,

    gallery: input.gallery || [],

    featured: input.featured === true,

    seo: mergeSeo(input.seo),
  };
}

export async function listAwards({
  companyId,
  status = null,
  search = null,
  projectId = null,
  year = null,
}) {
  let items = await listAwardRecords(companyId);

  if (status) {
    items = items.filter((item) => item.status === status);
  }

  if (projectId) {
    items = items.filter((item) => item.projectId === projectId);
  }

  if (year) {
    items = items.filter(
      (item) => Number(item.awardInfo?.year) === Number(year),
    );
  }

  if (search) {
    const keyword = search.trim().toLowerCase();

    items = items.filter((item) => {
      const searchable = [
        item.title?.th,
        item.title?.en,

        item.awardInfo?.name?.th,

        item.awardInfo?.name?.en,

        item.awardInfo?.organization?.th,

        item.awardInfo?.organization?.en,

        item.awardInfo?.category?.th,

        item.awardInfo?.category?.en,

        item.slug,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(keyword);
    });
  }

  items.sort((a, b) => {
    const yearA = a.awardInfo?.year || 0;

    const yearB = b.awardInfo?.year || 0;

    if (yearA !== yearB) {
      return yearB - yearA;
    }

    const dateA = a.updatedAt?.toMillis?.() || 0;

    const dateB = b.updatedAt?.toMillis?.() || 0;

    return dateB - dateA;
  });

  return items.map(serializeFirestoreDocument);
}

export async function getAward({ companyId, awardId }) {
  const award = await getAwardById({
    companyId,
    awardId,
  });

  if (!award || award.deletedAt) {
    throw new Error("AWARD_NOT_FOUND");
  }

  return serializeFirestoreDocument(award);
}

export async function createAward({ companyId, input, currentUser }) {
  const data = normalizeAwardInput(input);

  validateAward(data);

  await validateProjectRelation({
    companyId,

    projectId: data.projectId,
  });

  const award = await createAwardRecord({
    companyId,

    data,

    userId: currentUser.uid,
  });

  const serialized = serializeFirestoreDocument(award);

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: AUDIT_ACTIONS.AWARD_CREATE,

    resource: "award",

    resourceId: award.id,

    before: null,

    after: serialized,
  });

  return serialized;
}

export async function updateAward({ companyId, awardId, input, currentUser }) {
  const existing = await getAwardById({
    companyId,
    awardId,
  });

  if (!existing || existing.deletedAt) {
    throw new Error("AWARD_NOT_FOUND");
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

  if (input.awardInfo) {
    data.awardInfo = {
      ...existing.awardInfo,
      ...input.awardInfo,

      name: input.awardInfo.name
        ? mergeLocalized(existing.awardInfo?.name, input.awardInfo?.name)
        : existing.awardInfo?.name,

      organization: input.awardInfo.organization
        ? mergeLocalized(
            existing.awardInfo?.organization,
            input.awardInfo?.organization,
          )
        : existing.awardInfo?.organization,

      category: input.awardInfo.category
        ? mergeLocalized(
            existing.awardInfo?.category,
            input.awardInfo?.category,
          )
        : existing.awardInfo?.category,

      level: input.awardInfo.level
        ? mergeLocalized(existing.awardInfo?.level, input.awardInfo?.level)
        : existing.awardInfo?.level,
    };
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

  validateAward(preview);

  await validateProjectRelation({
    companyId,

    projectId: preview.projectId,
  });

  const result = await updateAwardRecord({
    companyId,
    awardId,

    data,

    userId: currentUser.uid,
  });

  const before = serializeFirestoreDocument(result.before);

  const after = serializeFirestoreDocument(result.after);

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: AUDIT_ACTIONS.AWARD_UPDATE,

    resource: "award",

    resourceId: awardId,

    before,

    after,
  });

  return after;
}

export async function publishAward({
  companyId,
  awardId,
  scheduledAt = null,
  currentUser,
}) {
  const existing = await getAwardById({
    companyId,
    awardId,
  });

  if (!existing || existing.deletedAt) {
    throw new Error("AWARD_NOT_FOUND");
  }

  validateAward(existing);

  await validateProjectRelation({
    companyId,

    projectId: existing.projectId,
  });

  const result = await publishAwardRecord({
    companyId,
    awardId,
    scheduledAt,

    userId: currentUser.uid,
  });

  const before = serializeFirestoreDocument(result.before);

  const after = serializeFirestoreDocument(result.after);

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: scheduledAt
      ? AUDIT_ACTIONS.AWARD_SCHEDULE
      : AUDIT_ACTIONS.AWARD_PUBLISH,

    resource: "award",

    resourceId: awardId,

    before,

    after,
  });

  return after;
}

export async function unpublishAward({ companyId, awardId, currentUser }) {
  const result = await unpublishAwardRecord({
    companyId,
    awardId,

    userId: currentUser.uid,
  });

  const before = serializeFirestoreDocument(result.before);

  const after = serializeFirestoreDocument(result.after);

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: AUDIT_ACTIONS.AWARD_UNPUBLISH,

    resource: "award",

    resourceId: awardId,

    before,

    after,
  });

  return after;
}

export async function deleteAward({ companyId, awardId, currentUser }) {
  const before = await softDeleteAwardRecord({
    companyId,
    awardId,

    userId: currentUser.uid,
  });

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: AUDIT_ACTIONS.AWARD_DELETE,

    resource: "award",

    resourceId: awardId,

    before: serializeFirestoreDocument(before),

    after: {
      deleted: true,
    },
  });

  return {
    id: awardId,

    deleted: true,
  };
}
