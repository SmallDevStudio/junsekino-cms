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
  /*
   * Featured projects first.
   */
  if (a.featured !== b.featured) {
    return a.featured ? -1 : 1;
  }

  /*
   * Newest published project first.
   */
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
 * Important:
 *
 * The normal /project page displays only
 * the first 6 projects inside each category.
 *
 * Search must therefore load ALL published
 * projects rather than searching only the
 * currently visible 6-item sections.
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
