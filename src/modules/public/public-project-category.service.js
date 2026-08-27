import "server-only";

import { listProjectCategoryRecords } from "@/modules/project/project-category.repository";

import { serializeFirestoreDocument } from "@/utils/firestore";

function mapLocalized(value) {
  return {
    th: value?.th || "",
    en: value?.en || "",
  };
}

function compareCategories(a, b) {
  const order = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);

  if (order !== 0) {
    return order;
  }

  const nameA = a.name?.en || a.name?.th || a.slug || "";

  const nameB = b.name?.en || b.name?.th || b.slug || "";

  return nameA.localeCompare(nameB);
}

function mapCategory(category) {
  const serialized = serializeFirestoreDocument(category);

  return {
    id: serialized.id,

    slug: serialized.slug,

    name: mapLocalized(serialized.name),

    description: mapLocalized(serialized.description),

    parentId: serialized.parentId || null,

    sortOrder: serialized.sortOrder ?? 0,
  };
}

function createCategoryTree(categories) {
  const categoryMap = new Map();

  /*
   * Create independent nodes first.
   */
  for (const category of categories) {
    categoryMap.set(category.id, {
      ...category,

      children: [],
    });
  }

  const roots = [];

  for (const category of categoryMap.values()) {
    if (category.parentId && categoryMap.has(category.parentId)) {
      categoryMap.get(category.parentId).children.push(category);
    } else {
      /*
       * A category without parent is a root.
       *
       * If an old/broken parent reference exists,
       * we intentionally promote the category to
       * root instead of hiding it from the website.
       */
      roots.push(category);
    }
  }

  function sortTree(items) {
    items.sort(compareCategories);

    for (const item of items) {
      if (item.children.length > 0) {
        sortTree(item.children);
      }
    }

    return items;
  }

  return sortTree(roots);
}

export async function listPublicProjectCategories({ companyId, tree = true }) {
  let items = await listProjectCategoryRecords(companyId);

  /*
   * Public website must never expose
   * inactive categories.
   */
  items = items.filter(
    (category) => !category.deletedAt && category.status === "active",
  );

  items.sort(compareCategories);

  const categories = items.map(mapCategory);

  if (!tree) {
    return {
      items: categories,
    };
  }

  return {
    items: createCategoryTree(categories),
  };
}
