import "server-only";

import { listProjectRecords } from "@/modules/project/project.repository";

import { serializeFirestoreDocument } from "@/utils/firestore";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function localized(value) {
  return {
    th: value?.th || "",
    en: value?.en || "",
  };
}

function isPublishedProject(project) {
  return (
    !project.deletedAt &&
    project.status === "published" &&
    Boolean(project.publishedAt)
  );
}

function getTimestampMillis(value) {
  if (!value) {
    return 0;
  }

  if (typeof value?.toMillis === "function") {
    return value.toMillis();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  const parsed = new Date(value).getTime();

  return Number.isNaN(parsed) ? 0 : parsed;
}

function sortProjects(a, b) {
  return getTimestampMillis(b.publishedAt) - getTimestampMillis(a.publishedAt);
}

function normalizeSearchProject(project) {
  const serialized = serializeFirestoreDocument(project);

  return {
    id: serialized.id,

    slug: serialized.slug || "",

    title: localized(serialized.title),

    excerpt: localized(serialized.excerpt),

    projectInfo: {
      location: localized(serialized.projectInfo?.location),

      client: localized(serialized.projectInfo?.client),

      designYear: serialized.projectInfo?.designYear ?? null,

      completionYear: serialized.projectInfo?.completionYear ?? null,
    },

    tags: Array.isArray(serialized.tags) ? serialized.tags : [],

    featuredImage: serialized.featuredImage || null,

    featured: serialized.featured === true,

    publishedAt: serialized.publishedAt || null,
  };
}

/*
 * =========================================================
 * PUBLIC PROJECT SEARCH DATA
 * =========================================================
 *
 * This dataset contains every published project.
 *
 * The main Project page uses it for:
 *
 * - showing every project
 * - sorting by published date
 * - searching every project
 *
 * Category-specific pages continue using
 * the category service.
 * =========================================================
 */

export async function getPublicProjectSearchData({ companyId }) {
  const projectRecords = await listProjectRecords({
    companyId,
  });

  return projectRecords
    .filter(isPublishedProject)
    .sort(sortProjects)
    .map(normalizeSearchProject);
}
