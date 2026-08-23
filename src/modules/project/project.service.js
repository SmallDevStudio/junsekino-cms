import "server-only";

import { DEFAULT_PROJECT_SEO, PROJECT_STATUS } from "@/constants/project";

import {
  createProjectRecord,
  getProjectById,
  listProjectRecords,
  publishProjectRecord,
  softDeleteProjectRecord,
  unpublishProjectRecord,
  updateProjectRecord,
} from "./project.repository";

import { getProjectCategoryById } from "./project-category.repository";

import {
  AUDIT_ACTIONS,
  createAuditLogSafe,
} from "@/modules/audit/audit.service";

import { serializeFirestoreDocument } from "@/utils/firestore";

function mergeLocalized(defaults = {}, value = {}) {
  return {
    th: value?.th ?? defaults?.th ?? "",

    en: value?.en ?? defaults?.en ?? "",
  };
}

function normalizeLocalizedArray(items = []) {
  return items.map((item) => mergeLocalized({}, item));
}

function mergeSeo(seo = {}) {
  return {
    ...DEFAULT_PROJECT_SEO,
    ...seo,

    th: {
      ...DEFAULT_PROJECT_SEO.th,
      ...(seo.th || {}),
    },

    en: {
      ...DEFAULT_PROJECT_SEO.en,
      ...(seo.en || {}),
    },
  };
}

function normalizeProjectInfo(projectInfo = {}) {
  return {
    location: mergeLocalized({}, projectInfo.location),

    designYear: projectInfo.designYear ?? null,

    completionYear: projectInfo.completionYear ?? null,

    area: {
      value: projectInfo.area?.value ?? null,

      unit: projectInfo.area?.unit || "sqm",
    },

    client: mergeLocalized({}, projectInfo.client),

    credits: {
      architecture: normalizeLocalizedArray(
        projectInfo.credits?.architecture || [],
      ),

      interior: normalizeLocalizedArray(projectInfo.credits?.interior || []),

      landscape: normalizeLocalizedArray(projectInfo.credits?.landscape || []),

      consultant: normalizeLocalizedArray(
        projectInfo.credits?.consultant || [],
      ),
    },
  };
}

function mergeProjectInfo(existing = {}, incoming = {}) {
  return {
    location: incoming.location
      ? mergeLocalized(existing.location, incoming.location)
      : existing.location || mergeLocalized(),

    designYear:
      incoming.designYear !== undefined
        ? incoming.designYear
        : (existing.designYear ?? null),

    completionYear:
      incoming.completionYear !== undefined
        ? incoming.completionYear
        : (existing.completionYear ?? null),

    area: incoming.area
      ? {
          value:
            incoming.area.value !== undefined
              ? incoming.area.value
              : (existing.area?.value ?? null),

          unit: incoming.area.unit || existing.area?.unit || "sqm",
        }
      : existing.area || {
          value: null,
          unit: "sqm",
        },

    client: incoming.client
      ? mergeLocalized(existing.client, incoming.client)
      : existing.client || mergeLocalized(),

    credits: {
      architecture:
        incoming.credits?.architecture !== undefined
          ? normalizeLocalizedArray(incoming.credits.architecture)
          : existing.credits?.architecture || [],

      interior:
        incoming.credits?.interior !== undefined
          ? normalizeLocalizedArray(incoming.credits.interior)
          : existing.credits?.interior || [],

      landscape:
        incoming.credits?.landscape !== undefined
          ? normalizeLocalizedArray(incoming.credits.landscape)
          : existing.credits?.landscape || [],

      consultant:
        incoming.credits?.consultant !== undefined
          ? normalizeLocalizedArray(incoming.credits.consultant)
          : existing.credits?.consultant || [],
    },
  };
}

function normalizeProjectInput(input) {
  return {
    ...input,

    slug: input.slug?.trim().toLowerCase(),

    title: mergeLocalized({}, input.title),

    excerpt: mergeLocalized({}, input.excerpt),

    content: mergeLocalized({}, input.content),

    categoryId: input.categoryId || null,

    subCategoryId: input.subCategoryId || null,

    projectInfo: normalizeProjectInfo(input.projectInfo),

    tags: Array.from(new Set(input.tags || [])),

    featuredImage: input.featuredImage ?? null,

    gallery: input.gallery || [],

    featured: input.featured === true,

    status: PROJECT_STATUS.DRAFT,

    scheduledAt: null,

    seo: mergeSeo(input.seo),
  };
}

function validateProjectTitle(project) {
  const hasThai = Boolean(project.title?.th?.trim());

  const hasEnglish = Boolean(project.title?.en?.trim());

  if (!hasThai && !hasEnglish) {
    throw new Error("PROJECT_TITLE_REQUIRED");
  }
}

function validatePublishableProject(project) {
  validateProjectTitle(project);

  const hasContent =
    Boolean(project.content?.th?.trim()) ||
    Boolean(project.content?.en?.trim());

  if (!hasContent) {
    throw new Error("PROJECT_CONTENT_REQUIRED");
  }
}

async function validateProjectCategories({
  companyId,
  categoryId,
  subCategoryId,
}) {
  if (!categoryId) {
    if (subCategoryId) {
      throw new Error("PROJECT_CATEGORY_REQUIRED");
    }

    return;
  }

  const category = await getProjectCategoryById({
    companyId,

    categoryId,
  });

  if (!category || category.deletedAt || category.status !== "active") {
    throw new Error("PROJECT_CATEGORY_NOT_FOUND");
  }

  if (!subCategoryId) {
    return;
  }

  const subCategory = await getProjectCategoryById({
    companyId,

    categoryId: subCategoryId,
  });

  if (
    !subCategory ||
    subCategory.deletedAt ||
    subCategory.status !== "active"
  ) {
    throw new Error("PROJECT_SUBCATEGORY_NOT_FOUND");
  }

  if (subCategory.parentId !== categoryId) {
    throw new Error("PROJECT_SUBCATEGORY_INVALID_PARENT");
  }
}

export async function listProjects({
  companyId,
  status = null,
  search = null,
  categoryId = null,
  subCategoryId = null,
}) {
  let projects = await listProjectRecords({
    companyId,
  });

  if (status) {
    projects = projects.filter((project) => project.status === status);
  }

  if (categoryId) {
    projects = projects.filter((project) => project.categoryId === categoryId);
  }

  if (subCategoryId) {
    projects = projects.filter(
      (project) => project.subCategoryId === subCategoryId,
    );
  }

  if (search) {
    const keyword = search.trim().toLowerCase();

    projects = projects.filter((project) => {
      const values = [
        project.title?.th,
        project.title?.en,

        project.slug,

        project.projectInfo?.location?.th,

        project.projectInfo?.location?.en,

        project.projectInfo?.client?.th,

        project.projectInfo?.client?.en,

        ...(project.tags || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return values.includes(keyword);
    });
  }

  projects.sort((a, b) => {
    const aDate = a.updatedAt?.toMillis?.() || 0;

    const bDate = b.updatedAt?.toMillis?.() || 0;

    return bDate - aDate;
  });

  return projects.map(serializeFirestoreDocument);
}

export async function getProject({ companyId, projectId }) {
  const project = await getProjectById({
    companyId,
    projectId,
  });

  if (!project || project.deletedAt) {
    throw new Error("PROJECT_NOT_FOUND");
  }

  return serializeFirestoreDocument(project);
}

export async function createProject({ companyId, input, currentUser }) {
  const data = normalizeProjectInput(input);

  validateProjectTitle(data);

  await validateProjectCategories({
    companyId,

    categoryId: data.categoryId,

    subCategoryId: data.subCategoryId,
  });

  const project = await createProjectRecord({
    companyId,

    data,

    userId: currentUser.uid,
  });

  const serialized = serializeFirestoreDocument(project);

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: AUDIT_ACTIONS.PROJECT_CREATE,

    resource: "project",

    resourceId: project.id,

    before: null,

    after: serialized,
  });

  return serialized;
}

export async function updateProject({
  companyId,
  projectId,
  input,
  currentUser,
}) {
  const existing = await getProjectById({
    companyId,
    projectId,
  });

  if (!existing || existing.deletedAt) {
    throw new Error("PROJECT_NOT_FOUND");
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

  if (input.projectInfo) {
    updateData.projectInfo = mergeProjectInfo(
      existing.projectInfo,
      input.projectInfo,
    );
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

  if (input.tags) {
    updateData.tags = Array.from(new Set(input.tags));
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

  validateProjectTitle(preview);

  await validateProjectCategories({
    companyId,

    categoryId: preview.categoryId,

    subCategoryId: preview.subCategoryId,
  });

  const result = await updateProjectRecord({
    companyId,
    projectId,

    data: updateData,

    userId: currentUser.uid,
  });

  const before = serializeFirestoreDocument(result.before);

  const after = serializeFirestoreDocument(result.after);

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: AUDIT_ACTIONS.PROJECT_UPDATE,

    resource: "project",

    resourceId: projectId,

    before,

    after,
  });

  return after;
}

export async function publishProject({
  companyId,
  projectId,
  scheduledAt = null,
  currentUser,
}) {
  const existing = await getProjectById({
    companyId,
    projectId,
  });

  if (!existing || existing.deletedAt) {
    throw new Error("PROJECT_NOT_FOUND");
  }

  validatePublishableProject(existing);

  await validateProjectCategories({
    companyId,

    categoryId: existing.categoryId,

    subCategoryId: existing.subCategoryId,
  });

  const result = await publishProjectRecord({
    companyId,
    projectId,
    scheduledAt,

    userId: currentUser.uid,
  });

  const before = serializeFirestoreDocument(result.before);

  const after = serializeFirestoreDocument(result.after);

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: scheduledAt
      ? AUDIT_ACTIONS.PROJECT_SCHEDULE
      : AUDIT_ACTIONS.PROJECT_PUBLISH,

    resource: "project",

    resourceId: projectId,

    before,

    after,
  });

  return after;
}

export async function unpublishProject({ companyId, projectId, currentUser }) {
  const result = await unpublishProjectRecord({
    companyId,
    projectId,

    userId: currentUser.uid,
  });

  const before = serializeFirestoreDocument(result.before);

  const after = serializeFirestoreDocument(result.after);

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: AUDIT_ACTIONS.PROJECT_UNPUBLISH,

    resource: "project",

    resourceId: projectId,

    before,

    after,
  });

  return after;
}

export async function deleteProject({ companyId, projectId, currentUser }) {
  const before = await softDeleteProjectRecord({
    companyId,
    projectId,

    userId: currentUser.uid,
  });

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: AUDIT_ACTIONS.PROJECT_DELETE,

    resource: "project",

    resourceId: projectId,

    before: serializeFirestoreDocument(before),

    after: {
      deleted: true,
    },
  });

  return {
    id: projectId,

    deleted: true,
  };
}
