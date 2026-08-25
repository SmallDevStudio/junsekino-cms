import "server-only";

import {
  createTagRecord,
  deleteTagRecord,
  getTagById,
  getTagBySlug,
  listTagRecords,
  updateTagRecord,
} from "./tag.repository";

import { createAuditLogSafe } from "@/modules/audit/audit.service";

import { serializeFirestoreDocument } from "@/utils/firestore";

function normalizeName(value = {}) {
  return {
    th: value.th?.trim() || "",

    en: value.en?.trim() || "",
  };
}

function normalizeAliases(aliases = []) {
  return [
    ...new Set(
      aliases.map((value) => value.trim().toLowerCase()).filter(Boolean),
    ),
  ];
}

function createSlug(value) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9ก-๙]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resolveSlug(name) {
  const source = name.en || name.th;

  return createSlug(source);
}

function validateName(name) {
  if (!name.th && !name.en) {
    throw new Error("TAG_NAME_REQUIRED");
  }
}

export async function listTags({ companyId, search = "" }) {
  let items = await listTagRecords(companyId);

  const keyword = search.trim().toLowerCase();

  if (keyword) {
    items = items.filter((item) => {
      const values = [
        item.name?.th,
        item.name?.en,
        item.slug,
        ...(item.aliases || []),
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

      return values.some((value) => value.includes(keyword));
    });
  }

  items.sort((a, b) => {
    const aUsage = a.usageCount || 0;

    const bUsage = b.usageCount || 0;

    if (bUsage !== aUsage) {
      return bUsage - aUsage;
    }

    return (a.name?.en || a.name?.th || "").localeCompare(
      b.name?.en || b.name?.th || "",
    );
  });

  return items.slice(0, 20).map(serializeFirestoreDocument);
}

export async function getTag({ companyId, tagId }) {
  const item = await getTagById({
    companyId,
    tagId,
  });

  if (!item || item.deletedAt) {
    throw new Error("TAG_NOT_FOUND");
  }

  return serializeFirestoreDocument(item);
}

export async function createTag({ companyId, input, currentUser }) {
  const name = normalizeName(input.name);

  validateName(name);

  const slug = resolveSlug(name);

  if (!slug) {
    throw new Error("TAG_SLUG_INVALID");
  }

  const existing = await getTagBySlug({
    companyId,
    slug,
  });

  if (existing && !existing.deletedAt) {
    throw new Error("TAG_SLUG_EXISTS");
  }

  const record = await createTagRecord({
    companyId,

    userId: currentUser.uid,

    data: {
      name,

      slug,

      aliases: normalizeAliases(input.aliases),
    },
  });

  const data = serializeFirestoreDocument(record);

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: "TAG_CREATE",

    resource: "tag",

    resourceId: record.id,

    before: null,
    after: data,
  });

  return data;
}

export async function updateTag({ companyId, tagId, input, currentUser }) {
  const existing = await getTagById({
    companyId,
    tagId,
  });

  if (!existing || existing.deletedAt) {
    throw new Error("TAG_NOT_FOUND");
  }

  const data = {};

  if (input.name) {
    const name = {
      ...normalizeName(existing.name),

      ...normalizeName(input.name),
    };

    validateName(name);

    const slug = resolveSlug(name);

    const duplicate = await getTagBySlug({
      companyId,
      slug,
    });

    if (duplicate && duplicate.id !== tagId && !duplicate.deletedAt) {
      throw new Error("TAG_SLUG_EXISTS");
    }

    data.name = name;
    data.slug = slug;
  }

  if (input.aliases) {
    data.aliases = normalizeAliases(input.aliases);
  }

  if (input.status) {
    data.status = input.status;
  }

  const result = await updateTagRecord({
    companyId,
    tagId,
    data,

    userId: currentUser.uid,
  });

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: "TAG_UPDATE",

    resource: "tag",

    resourceId: tagId,

    before: serializeFirestoreDocument(result.before),

    after: serializeFirestoreDocument(result.after),
  });

  return serializeFirestoreDocument(result.after);
}

export async function deleteTag({ companyId, tagId, currentUser }) {
  const before = await deleteTagRecord({
    companyId,
    tagId,

    userId: currentUser.uid,
  });

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: "TAG_DELETE",

    resource: "tag",

    resourceId: tagId,

    before: serializeFirestoreDocument(before),

    after: {
      deleted: true,
    },
  });

  return {
    id: tagId,
    deleted: true,
  };
}
