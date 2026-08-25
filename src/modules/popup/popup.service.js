import "server-only";

import {
  createPopupRecord,
  deletePopupRecord,
  getPopupById,
  listActivePublicPopups,
  listPopupRecords,
  publishPopupRecord,
  unpublishPopupRecord,
  updatePopupRecord,
} from "./popup.repository";

import { getFormById } from "@/modules/form/form.repository";

import { serializeFirestoreDocument } from "@/utils/firestore";

import { createAuditLogSafe } from "@/modules/audit/audit.service";

function normalizeSchedule(schedule = {}) {
  return {
    startAt: schedule.startAt ? new Date(schedule.startAt) : null,

    endAt: schedule.endAt ? new Date(schedule.endAt) : null,
  };
}

async function validatePopupForm({ companyId, popup }) {
  const formId = popup.action?.formId;

  if (popup.type !== "form" && popup.action?.type !== "form") {
    return;
  }

  if (!formId) {
    throw new Error("POPUP_FORM_REQUIRED");
  }

  const form = await getFormById({
    companyId,
    formId,
  });

  if (!form || form.deletedAt) {
    throw new Error("POPUP_FORM_NOT_FOUND");
  }

  if (popup.status === "published" && form.status !== "published") {
    throw new Error("POPUP_FORM_NOT_PUBLISHED");
  }
}

function validateSchedule(schedule) {
  if (schedule.startAt && schedule.endAt && schedule.startAt > schedule.endAt) {
    throw new Error("POPUP_SCHEDULE_INVALID");
  }
}

function normalizePopup(input) {
  return {
    ...input,

    content: {
      title: {
        th: "",
        en: "",
      },

      subtitle: {
        th: "",
        en: "",
      },

      body: {
        th: "",
        en: "",
      },

      imageMediaId: null,

      ...input.content,
    },

    action: {
      type: "none",

      label: {
        th: "",
        en: "",
      },

      url: null,

      formId: null,

      newTab: false,

      ...input.action,
    },

    targeting: {
      pages: ["*"],

      languages: ["th", "en"],

      ...input.targeting,
    },

    behavior: {
      trigger: "immediate",

      delaySeconds: 0,

      scrollPercent: 50,

      frequency: "once_per_session",

      closeOnBackdrop: true,

      showCloseButton: true,

      ...input.behavior,
    },

    schedule: normalizeSchedule(input.schedule),

    priority: input.priority ?? 100,
  };
}

export async function listPopups({ companyId, status = null }) {
  let items = await listPopupRecords(companyId);

  if (status) {
    items = items.filter((item) => item.status === status);
  }

  items.sort((a, b) => {
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }

    return (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0);
  });

  return items.map(serializeFirestoreDocument);
}

export async function getPopup({ companyId, popupId }) {
  const popup = await getPopupById({
    companyId,
    popupId,
  });

  if (!popup || popup.deletedAt) {
    throw new Error("POPUP_NOT_FOUND");
  }

  return serializeFirestoreDocument(popup);
}

export async function createPopup({ companyId, input, currentUser }) {
  const data = normalizePopup(input);

  validateSchedule(data.schedule);

  await validatePopupForm({
    companyId,
    popup: data,
  });

  const popup = await createPopupRecord({
    companyId,

    data,

    userId: currentUser.uid,
  });

  const serialized = serializeFirestoreDocument(popup);

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: "POPUP_CREATE",

    resource: "popup",

    resourceId: popup.id,

    before: null,

    after: serialized,
  });

  return serialized;
}

export async function updatePopup({ companyId, popupId, input, currentUser }) {
  const existing = await getPopupById({
    companyId,
    popupId,
  });

  if (!existing || existing.deletedAt) {
    throw new Error("POPUP_NOT_FOUND");
  }

  const data = {
    ...input,
  };

  if (input.content) {
    data.content = {
      ...existing.content,
      ...input.content,
    };
  }

  if (input.action) {
    data.action = {
      ...existing.action,
      ...input.action,
    };
  }

  if (input.targeting) {
    data.targeting = {
      ...existing.targeting,
      ...input.targeting,
    };
  }

  if (input.behavior) {
    data.behavior = {
      ...existing.behavior,
      ...input.behavior,
    };
  }

  if (input.schedule) {
    data.schedule = normalizeSchedule({
      ...existing.schedule,
      ...input.schedule,
    });
  }

  delete data.status;
  delete data.publishedAt;
  delete data.publishedBy;
  delete data.deletedAt;
  delete data.deletedBy;

  const preview = {
    ...existing,
    ...data,
  };

  validateSchedule(preview.schedule);

  await validatePopupForm({
    companyId,
    popup: preview,
  });

  const result = await updatePopupRecord({
    companyId,
    popupId,

    data,

    userId: currentUser.uid,
  });

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: "POPUP_UPDATE",

    resource: "popup",

    resourceId: popupId,

    before: serializeFirestoreDocument(result.before),

    after: serializeFirestoreDocument(result.after),
  });

  return serializeFirestoreDocument(result.after);
}

export async function publishPopup({ companyId, popupId, currentUser }) {
  const existing = await getPopupById({
    companyId,
    popupId,
  });

  if (!existing || existing.deletedAt) {
    throw new Error("POPUP_NOT_FOUND");
  }

  await validatePopupForm({
    companyId,

    popup: {
      ...existing,
      status: "published",
    },
  });

  validateSchedule(existing.schedule || {});

  const result = await publishPopupRecord({
    companyId,
    popupId,

    userId: currentUser.uid,
  });

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: "POPUP_PUBLISH",

    resource: "popup",

    resourceId: popupId,

    before: serializeFirestoreDocument(result.before),

    after: serializeFirestoreDocument(result.after),
  });

  return serializeFirestoreDocument(result.after);
}

export async function unpublishPopup({ companyId, popupId, currentUser }) {
  const result = await unpublishPopupRecord({
    companyId,
    popupId,

    userId: currentUser.uid,
  });

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: "POPUP_UNPUBLISH",

    resource: "popup",

    resourceId: popupId,

    before: serializeFirestoreDocument(result.before),

    after: serializeFirestoreDocument(result.after),
  });

  return serializeFirestoreDocument(result.after);
}

export async function deletePopup({ companyId, popupId, currentUser }) {
  const before = await deletePopupRecord({
    companyId,
    popupId,

    userId: currentUser.uid,
  });

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: "POPUP_DELETE",

    resource: "popup",

    resourceId: popupId,

    before: serializeFirestoreDocument(before),

    after: {
      deleted: true,
    },
  });

  return {
    id: popupId,

    deleted: true,
  };
}

export async function getPublicPopups({ companyId, pagePath, locale }) {
  let items = await listActivePublicPopups({
    companyId,
  });

  items = items.filter((popup) => {
    const pages = popup.targeting?.pages || ["*"];

    const languages = popup.targeting?.languages || ["th", "en"];

    const pageMatch = pages.includes("*") || pages.includes(pagePath);

    const languageMatch = languages.includes(locale);

    return pageMatch && languageMatch;
  });

  items.sort((a, b) => (b.priority || 0) - (a.priority || 0));

  return items.map((popup) => ({
    id: popup.id,

    type: popup.type,

    content: popup.content,

    action: popup.action,

    behavior: popup.behavior,

    priority: popup.priority,
  }));
}
