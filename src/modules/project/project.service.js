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

import { createAuditLog } from "@/modules/audit/audit.service";

import { serializeFirestoreDocument } from "@/utils/firestore";

function mergeLocalized(defaults = {}, value = {}) {
  return {
    th: value.th ?? defaults.th ?? "",

    en: value.en ?? defaults.en ?? "",
  };
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

function normalizeProjectInput(input) {
  return {
    ...input,

    slug: input.slug?.trim().toLowerCase(),

    title: mergeLocalized({}, input.title),

    excerpt: mergeLocalized({}, input.excerpt),

    content: mergeLocalized({}, input.content),

    location: mergeLocalized({}, input.location),

    client: input.client || "",

    projectType: input.projectType || "",

    categories: input.categories || [],

    tags: Array.from(new Set(input.tags || [])),

    architects: input.architects || [],

    featuredImage: input.featuredImage ?? null,

    gallery: input.gallery || [],

    featured: input.featured === true,

    status: input.status || PROJECT_STATUS.DRAFT,

    scheduledAt: input.scheduledAt ?? null,

    seo: mergeSeo(input.seo),
  };
}

function validateProjectLanguages(project) {
  const hasThai = Boolean(project.title?.th?.trim());

  const hasEnglish = Boolean(project.title?.en?.trim());

  if (!hasThai && !hasEnglish) {
    throw new Error("PROJECT_TITLE_REQUIRED");
  }
}

function validatePublishableProject(project) {
  validateProjectLanguages(project);

  const hasAnyContent =
    Boolean(project.content?.th?.trim()) ||
    Boolean(project.content?.en?.trim());

  if (!hasAnyContent) {
    throw new Error("PROJECT_CONTENT_REQUIRED");
  }
}

export async function listProjects({
  companyId,
  status = null,
  search = null,
}) {
  let projects = await listProjectRecords({
    companyId,
  });

  if (status) {
    projects = projects.filter((project) => project.status === status);
  }

  if (search) {
    const keyword = search.trim().toLowerCase();

    projects = projects.filter((project) => {
      const values = [
        project.title?.th,
        project.title?.en,
        project.slug,
        project.client,
        project.projectType,
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
  const projectData = normalizeProjectInput(input);

  validateProjectLanguages(projectData);

  /*
   * Content should not become
   * published directly from
   * the regular create endpoint.
   */

  projectData.status = PROJECT_STATUS.DRAFT;

  projectData.scheduledAt = null;

  const project = await createProjectRecord({
    companyId,

    data: projectData,

    userId: currentUser.uid,
  });

  await createAuditLog({
    userId: currentUser.uid,

    companyId,

    action: "PROJECT_CREATE",

    resource: "project",

    resourceId: project.id,

    before: null,

    after: serializeFirestoreDocument(project),
  });

  return serializeFirestoreDocument(project);
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

  if (input.location) {
    updateData.location = mergeLocalized(existing.location, input.location);
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
   * Publishing state is controlled
   * only by dedicated endpoints.
   */

  delete updateData.status;
  delete updateData.scheduledAt;
  delete updateData.publishedAt;
  delete updateData.publishedBy;

  const preview = {
    ...existing,
    ...updateData,
  };

  validateProjectLanguages(preview);

  const result = await updateProjectRecord({
    companyId,
    projectId,

    data: updateData,

    userId: currentUser.uid,
  });

  await createAuditLog({
    userId: currentUser.uid,

    companyId,

    action: "PROJECT_UPDATE",

    resource: "project",

    resourceId: projectId,

    before: serializeFirestoreDocument(result.before),

    after: serializeFirestoreDocument(result.after),
  });

  return serializeFirestoreDocument(result.after);
}

export async function publishProject({
  companyId,
  projectId,
  scheduledAt = null,
  currentUser,
}) {
  const project = await getProjectById({
    companyId,
    projectId,
  });

  if (!project || project.deletedAt) {
    throw new Error("PROJECT_NOT_FOUND");
  }

  validatePublishableProject(project);

  const result = await publishProjectRecord({
    companyId,
    projectId,

    scheduledAt,

    userId: currentUser.uid,
  });

  await createAuditLog({
    userId: currentUser.uid,

    companyId,

    action: scheduledAt ? "PROJECT_SCHEDULE" : "PROJECT_PUBLISH",

    resource: "project",

    resourceId: projectId,

    before: serializeFirestoreDocument(result.before),

    after: serializeFirestoreDocument(result.after),
  });

  return serializeFirestoreDocument(result.after);
}

export async function unpublishProject({ companyId, projectId, currentUser }) {
  const result = await unpublishProjectRecord({
    companyId,
    projectId,

    userId: currentUser.uid,
  });

  await createAuditLog({
    userId: currentUser.uid,

    companyId,

    action: "PROJECT_UNPUBLISH",

    resource: "project",

    resourceId: projectId,

    before: serializeFirestoreDocument(result.before),

    after: serializeFirestoreDocument(result.after),
  });

  return serializeFirestoreDocument(result.after);
}

export async function deleteProject({ companyId, projectId, currentUser }) {
  const before = await softDeleteProjectRecord({
    companyId,
    projectId,

    userId: currentUser.uid,
  });

  await createAuditLog({
    userId: currentUser.uid,

    companyId,

    action: "PROJECT_DELETE",

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
