import "server-only";

import {
  DEFAULT_COMPANY_NAVIGATION,
  SYSTEM_NAVIGATION_KEYS,
} from "@/constants/navigation";

import { createAuditLogSafe } from "@/modules/audit/audit.service";

import { serializeFirestoreDocument } from "@/utils/firestore";

import {
  getNavigationSettingsRecord,
  updateNavigationSettingsRecord,
} from "./navigation.repository";

const SYSTEM_KEYS = new Set(Object.values(SYSTEM_NAVIGATION_KEYS));

const RESERVED_PATHS = new Set([
  "admin",
  "api",
  "legal",
  "p",
  "privacy",
  "cookies",
  "terms",
]);

function normalizePath(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

function normalizeLabel(value = {}) {
  return {
    th: String(value.th || "").trim(),

    en: String(value.en || "").trim(),
  };
}

function getDefaultItem(key) {
  return DEFAULT_COMPANY_NAVIGATION.find((item) => item.key === key) || null;
}

function normalizeSystemItem(item) {
  const defaultItem = getDefaultItem(item.key);

  if (!defaultItem) {
    throw new Error("INVALID_SYSTEM_NAVIGATION_ITEM");
  }

  return {
    ...defaultItem,

    label: normalizeLabel(item.label),

    enabled: item.enabled !== false,

    openInNewTab: false,

    sortOrder: Number(item.sortOrder) || 0,
  };
}

function normalizeExternalItem(item) {
  if (SYSTEM_KEYS.has(item.key)) {
    throw new Error("NAVIGATION_KEY_RESERVED");
  }

  let url;

  try {
    url = new URL(String(item.url || "").trim());
  } catch {
    throw new Error("INVALID_NAVIGATION_URL");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("INVALID_NAVIGATION_URL");
  }

  return {
    key: item.key,

    type: "external",

    label: normalizeLabel(item.label),

    path: "",

    url: url.toString(),

    enabled: item.enabled !== false,

    openInNewTab: item.openInNewTab === true,

    sortOrder: Number(item.sortOrder) || 0,
  };
}

function validateLabel(item) {
  if (!item.label.en) {
    throw new Error("NAVIGATION_ENGLISH_LABEL_REQUIRED");
  }
}

function normalizeItems(items) {
  if (!Array.isArray(items)) {
    throw new Error("INVALID_NAVIGATION_ITEMS");
  }

  const keys = new Set();

  const paths = new Set();

  const receivedSystemKeys = new Set();

  const normalized = items.map((item) => {
    if (keys.has(item.key)) {
      throw new Error("NAVIGATION_KEY_DUPLICATE");
    }

    keys.add(item.key);

    let result;

    if (SYSTEM_KEYS.has(item.key)) {
      receivedSystemKeys.add(item.key);

      result = normalizeSystemItem(item);
    } else {
      /*
       * Phase 1 allows user-created external links.
       *
       * Custom page navigation will be enabled
       * after Page Management is complete.
       */
      if (item.type !== "external") {
        throw new Error("CUSTOM_PAGE_NAVIGATION_NOT_AVAILABLE");
      }

      result = normalizeExternalItem(item);
    }

    validateLabel(result);

    const path = normalizePath(result.path);

    if (path) {
      const rootPath = path.split("/")[0];

      if (RESERVED_PATHS.has(rootPath)) {
        throw new Error("NAVIGATION_PATH_RESERVED");
      }

      if (paths.has(path)) {
        throw new Error("NAVIGATION_PATH_DUPLICATE");
      }

      paths.add(path);
    }

    return result;
  });

  for (const key of SYSTEM_KEYS) {
    if (!receivedSystemKeys.has(key)) {
      throw new Error("SYSTEM_NAVIGATION_ITEM_REQUIRED");
    }
  }

  return normalized
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item, index) => ({
      ...item,

      sortOrder: (index + 1) * 10,
    }));
}

function createDefaultItems() {
  return DEFAULT_COMPANY_NAVIGATION.map((item, index) => ({
    ...item,

    label: normalizeLabel(item.label),

    url: "",

    openInNewTab: false,

    sortOrder: (index + 1) * 10,
  }));
}

function normalizeSettings(settings = {}) {
  const storedItems = Array.isArray(settings.items) ? settings.items : null;

  if (!storedItems?.length) {
    return {
      items: createDefaultItems(),
    };
  }

  try {
    return {
      items: normalizeItems(storedItems),
    };
  } catch {
    /*
     * Invalid legacy settings must not
     * break the public website or admin.
     */
    return {
      items: createDefaultItems(),
    };
  }
}

export async function getCompanyNavigation(companyId) {
  if (!companyId) {
    throw new Error("COMPANY_ID_REQUIRED");
  }

  const existing = await getNavigationSettingsRecord(companyId);

  return serializeFirestoreDocument(normalizeSettings(existing || {}));
}

async function saveNavigation({
  companyId,

  items,

  currentUser,

  action,
}) {
  if (!companyId) {
    throw new Error("COMPANY_ID_REQUIRED");
  }

  if (!currentUser?.uid) {
    throw new Error("CURRENT_USER_REQUIRED");
  }

  const normalizedItems = normalizeItems(items);

  const result = await updateNavigationSettingsRecord({
    companyId,

    data: {
      items: normalizedItems,
    },

    userId: currentUser.uid,
  });

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action,

    resource: "companySettings",

    resourceId: "navigation",

    before: serializeFirestoreDocument(result.before),

    after: serializeFirestoreDocument(result.after),
  });

  return serializeFirestoreDocument({
    items: normalizedItems,
  });
}

export async function updateCompanyNavigation({
  companyId,

  input,

  currentUser,
}) {
  return saveNavigation({
    companyId,

    items: input.items,

    currentUser,

    action: "NAVIGATION_UPDATE",
  });
}

export async function resetCompanyNavigation({
  companyId,

  currentUser,
}) {
  return saveNavigation({
    companyId,

    items: createDefaultItems(),

    currentUser,

    action: "NAVIGATION_RESET",
  });
}
