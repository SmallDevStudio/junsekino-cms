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
  if (!award.title?.th?.trim() && !award.title?.en?.trim()) {
    throw new Error("AWARD_TITLE_REQUIRED");
  }

  if (
    !award.awardInfo?.name?.th?.trim() &&
    !award.awardInfo?.name?.en?.trim()
  ) {
    throw new Error("AWARD_NAME_REQUIRED");
  }
}

export async function listAwards({ companyId, status = null, search = null }) {
  let items = await listAwardRecords(companyId);

  if (status) {
    items = items.filter((item) => item.status === status);
  }

  if (search) {
    const keyword = search.toLowerCase().trim();

    items = items.filter((item) =>
      [
        item.title?.th,
        item.title?.en,

        item.awardInfo?.name?.th,

        item.awardInfo?.name?.en,

        item.awardInfo?.organization?.th,

        item.awardInfo?.organization?.en,

        item.slug,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }

  items.sort((a, b) => (b.awardInfo?.year || 0) - (a.awardInfo?.year || 0));

  return items.map(serializeFirestoreDocument);
}

export async function createAward({ companyId, input, currentUser }) {
  const data = {
    ...input,

    slug: input.slug.trim().toLowerCase(),

    title: mergeLocalized({}, input.title),

    excerpt: mergeLocalized({}, input.excerpt),

    content: mergeLocalized({}, input.content),

    projectId: input.projectId || null,

    featuredImage: input.featuredImage ?? null,

    gallery: input.gallery || [],

    featured: input.featured === true,

    seo: mergeSeo(input.seo),
  };

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

      name: mergeLocalized(
        existing.awardInfo?.name,

        input.awardInfo?.name,
      ),

      organization: mergeLocalized(
        existing.awardInfo?.organization,

        input.awardInfo?.organization,
      ),

      category: mergeLocalized(
        existing.awardInfo?.category,

        input.awardInfo?.category,
      ),

      level: mergeLocalized(
        existing.awardInfo?.level,

        input.awardInfo?.level,
      ),
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

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: AUDIT_ACTIONS.AWARD_UPDATE,

    resource: "award",

    resourceId: awardId,

    before: serializeFirestoreDocument(result.before),

    after: serializeFirestoreDocument(result.after),
  });

  return serializeFirestoreDocument(result.after);
}
