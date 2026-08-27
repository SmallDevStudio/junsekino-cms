import "server-only";

import { listProjectCategoryRecords } from "@/modules/project/project-category.repository";

import { listProjectRecords } from "@/modules/project/project.repository";

function mapLocalized(value) {
  return {
    th: value?.th || "",
    en: value?.en || "",
  };
}

function compareCategory(a, b) {
  const orderA = a.sortOrder ?? 0;
  const orderB = b.sortOrder ?? 0;

  if (orderA !== orderB) {
    return orderA - orderB;
  }

  const nameA = a.name?.en || a.name?.th || a.slug || "";

  const nameB = b.name?.en || b.name?.th || b.slug || "";

  return nameA.localeCompare(nameB, "en", {
    sensitivity: "base",
  });
}

export async function getPublicNavigationData({ companyId }) {
  const [categories, projects] = await Promise.all([
    listProjectCategoryRecords(companyId),

    listProjectRecords({
      companyId,
    }),
  ]);

  /*
   * Public navigation must only consider
   * content that is actually published.
   */
  const publishedProjects = projects.filter(
    (project) =>
      !project.deletedAt &&
      project.status === "published" &&
      Boolean(project.publishedAt),
  );

  /*
   * Store every category/sub-category
   * referenced by a published project.
   */
  const usedCategoryIds = new Set();

  for (const project of publishedProjects) {
    if (project.categoryId) {
      usedCategoryIds.add(project.categoryId);
    }

    if (project.subCategoryId) {
      usedCategoryIds.add(project.subCategoryId);
    }
  }

  const categoryById = new Map(
    categories.map((category) => [category.id, category]),
  );

  /*
   * If only a sub-category was used,
   * ensure its root parent is visible
   * in the horizontal navigation.
   */
  for (const categoryId of [...usedCategoryIds]) {
    const category = categoryById.get(categoryId);

    if (category?.parentId) {
      usedCategoryIds.add(category.parentId);
    }
  }

  /*
   * Main dropdown only displays
   * root categories.
   *
   * Example:
   * Commercial
   * Residential
   * Hospitality
   * Other
   */
  const projectCategories = categories
    .filter(
      (category) =>
        !category.deletedAt &&
        category.status === "active" &&
        !category.parentId &&
        usedCategoryIds.has(category.id),
    )
    .sort(compareCategory)
    .map((category) => ({
      id: category.id,

      slug: category.slug,

      name: mapLocalized(category.name),

      description: mapLocalized(category.description),

      sortOrder: category.sortOrder ?? 0,
    }));

  return {
    projectCategories,
  };
}
