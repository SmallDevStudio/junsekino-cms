import "server-only";

import {
  createProjectCategoryRecord,
  listProjectCategoryRecords,
  updateProjectCategoryRecord,
} from "./project-category.repository";

import { serializeFirestoreDocument } from "@/utils/firestore";

function validateName(category) {
  if (!category.name?.th?.trim() && !category.name?.en?.trim()) {
    throw new Error("PROJECT_CATEGORY_NAME_REQUIRED");
  }
}

export async function listProjectCategories({ companyId }) {
  const items = await listProjectCategoryRecords(companyId);

  items.sort((a, b) => {
    const order = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);

    if (order !== 0) {
      return order;
    }

    return (a.name?.en || a.name?.th || "").localeCompare(
      b.name?.en || b.name?.th || "",
    );
  });

  return items.map(serializeFirestoreDocument);
}

export async function createProjectCategory({ companyId, input, currentUser }) {
  const data = {
    ...input,

    slug: input.slug.trim().toLowerCase(),

    parentId: input.parentId || null,
  };

  validateName(data);

  const category = await createProjectCategoryRecord({
    companyId,

    data,

    userId: currentUser.uid,
  });

  return serializeFirestoreDocument(category);
}

export async function updateProjectCategory({
  companyId,
  categoryId,
  input,
  currentUser,
}) {
  const data = {
    ...input,
  };

  if (input.slug) {
    data.slug = input.slug.trim().toLowerCase();
  }

  if (input.name) {
    validateName({
      name: input.name,
    });
  }

  const result = await updateProjectCategoryRecord({
    companyId,
    categoryId,

    data,

    userId: currentUser.uid,
  });

  return serializeFirestoreDocument(result.after);
}
