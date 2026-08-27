import "server-only";

import { listProjectCategoryRecords } from "@/modules/project/project-category.repository";
import { listProjectRecords } from "@/modules/project/project.repository";

import { serializeFirestoreDocument } from "@/utils/firestore";

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

function isActiveRootCategory(category) {
  return (
    !category.deletedAt && category.status === "active" && !category.parentId
  );
}

function sortCategories(a, b) {
  const sortOrder = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);

  if (sortOrder !== 0) {
    return sortOrder;
  }

  const nameA = a.name?.en || a.name?.th || a.slug || "";

  const nameB = b.name?.en || b.name?.th || b.slug || "";

  return nameA.localeCompare(nameB, "en", {
    sensitivity: "base",
  });
}

function getTimestampMillis(value) {
  if (!value) {
    return 0;
  }

  if (typeof value?.toMillis === "function") {
    return value.toMillis();
  }

  const parsed = new Date(value).getTime();

  return Number.isNaN(parsed) ? 0 : parsed;
}

function sortProjects(a, b) {
  if (a.featured !== b.featured) {
    return a.featured ? -1 : 1;
  }

  return getTimestampMillis(b.publishedAt) - getTimestampMillis(a.publishedAt);
}

function normalizeProject(project) {
  const serialized = serializeFirestoreDocument(project);

  return {
    id: serialized.id,

    slug: serialized.slug || "",

    title: localized(serialized.title),

    categoryId: serialized.categoryId || null,

    subCategoryId: serialized.subCategoryId || null,

    projectInfo: {
      location: localized(serialized.projectInfo?.location),

      designYear: serialized.projectInfo?.designYear ?? null,

      completionYear: serialized.projectInfo?.completionYear ?? null,
    },

    tags: Array.isArray(serialized.tags) ? serialized.tags : [],

    featuredImage: serialized.featuredImage || null,

    featured: serialized.featured === true,

    publishedAt: serialized.publishedAt || null,
  };
}

export async function getPublicProjectFilterData({ companyId }) {
  const [categoryRecords, projectRecords] = await Promise.all([
    listProjectCategoryRecords(companyId),

    listProjectRecords({
      companyId,
    }),
  ]);

  const categories = categoryRecords
    .filter(isActiveRootCategory)
    .sort(sortCategories)
    .map((category) => ({
      id: category.id,

      slug: category.slug || "",

      name: localized(category.name),

      sortOrder: category.sortOrder ?? 0,
    }));

  const projects = projectRecords
    .filter(isPublishedProject)
    .sort(sortProjects)
    .map(normalizeProject);

  /*
   * Only expose categories which
   * actually contain published projects.
   */
  const activeCategoryIds = new Set(
    projects.map((project) => project.categoryId).filter(Boolean),
  );

  const visibleCategories = categories.filter((category) =>
    activeCategoryIds.has(category.id),
  );

  /*
   * Collect available years.
   *
   * Completion year is preferred,
   * but design year is also included
   * so older/incomplete records remain
   * discoverable.
   */
  const years = Array.from(
    new Set(
      projects.flatMap((project) => {
        const values = [];

        if (Number.isInteger(project.projectInfo?.completionYear)) {
          values.push(project.projectInfo.completionYear);
        }

        if (Number.isInteger(project.projectInfo?.designYear)) {
          values.push(project.projectInfo.designYear);
        }

        return values;
      }),
    ),
  ).sort((a, b) => b - a);

  return {
    projects,
    categories: visibleCategories,
    years,
  };
}
