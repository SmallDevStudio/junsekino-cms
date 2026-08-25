import "server-only";

import {
  createFormRecord,
  getFormById,
  getFormBySlug,
  listFormRecords,
  publishFormRecord,
  softDeleteFormRecord,
  unpublishFormRecord,
  updateFormRecord,
} from "./form.repository";

import { serializeFirestoreDocument } from "@/utils/firestore";

import { createAuditLogSafe } from "@/modules/audit/audit.service";

function normalizeLocalized(input = {}) {
  return {
    th: input.th || "",

    en: input.en || "",
  };
}

function normalizeFields(fields = []) {
  const ids = new Set();

  const normalized = fields.map((field, index) => {
    if (ids.has(field.id)) {
      throw new Error("FORM_FIELD_ID_DUPLICATE");
    }

    ids.add(field.id);

    return {
      ...field,

      label: normalizeLocalized(field.label),

      placeholder: normalizeLocalized(field.placeholder),

      helpText: normalizeLocalized(field.helpText),

      sortOrder: field.sortOrder ?? index,

      enabled: field.enabled !== false,
    };
  });

  normalized.sort((a, b) => a.sortOrder - b.sortOrder);

  return normalized;
}

function validateForm(form) {
  const hasName =
    Boolean(form.name?.th?.trim()) || Boolean(form.name?.en?.trim());

  if (!hasName) {
    throw new Error("FORM_NAME_REQUIRED");
  }

  if (!Array.isArray(form.fields)) {
    throw new Error("FORM_FIELDS_INVALID");
  }

  for (const field of form.fields) {
    if (field.type === "consent" && !field.consent?.legalDocument) {
      throw new Error("FORM_CONSENT_LEGAL_DOCUMENT_REQUIRED");
    }

    if (
      ["select", "radio"].includes(field.type) &&
      (!field.options || field.options.length === 0)
    ) {
      throw new Error("FORM_FIELD_OPTIONS_REQUIRED");
    }
  }
}

function normalizeForm(input) {
  return {
    ...input,

    slug: input.slug.trim().toLowerCase(),

    name: normalizeLocalized(input.name),

    description: normalizeLocalized(input.description),

    fields: normalizeFields(input.fields),

    settings: {
      submitLabel: {
        th: "ส่งข้อมูล",

        en: "Submit",
      },

      successTitle: {
        th: "ส่งข้อมูลเรียบร้อยแล้ว",

        en: "Submission received",
      },

      successMessage: {
        th: "ขอบคุณสำหรับข้อมูล เราจะติดต่อกลับตามความเหมาะสม",

        en: "Thank you. We have received your submission.",
      },

      allowMultipleSubmissions: true,

      requirePrivacyConsent: true,

      notifyEmployees: true,

      sendEmailNotification: false,

      notificationEmails: [],

      ...input.settings,
    },
  };
}

export async function listForms({
  companyId,
  status = null,
  type = null,
  search = null,
}) {
  let items = await listFormRecords(companyId);

  if (status) {
    items = items.filter((item) => item.status === status);
  }

  if (type) {
    items = items.filter((item) => item.type === type);
  }

  if (search) {
    const keyword = search.trim().toLowerCase();

    items = items.filter((item) =>
      [item.name?.th, item.name?.en, item.slug, item.type]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }

  items.sort(
    (a, b) =>
      (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0),
  );

  return items.map(serializeFirestoreDocument);
}

export async function getForm({ companyId, formId }) {
  const form = await getFormById({
    companyId,
    formId,
  });

  if (!form || form.deletedAt) {
    throw new Error("FORM_NOT_FOUND");
  }

  return serializeFirestoreDocument(form);
}

export async function createForm({ companyId, input, currentUser }) {
  const data = normalizeForm(input);

  validateForm(data);

  const form = await createFormRecord({
    companyId,

    data,

    userId: currentUser.uid,
  });

  const serialized = serializeFirestoreDocument(form);

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: "FORM_CREATE",

    resource: "form",

    resourceId: form.id,

    before: null,

    after: serialized,
  });

  return serialized;
}

export async function updateForm({ companyId, formId, input, currentUser }) {
  const existing = await getFormById({
    companyId,
    formId,
  });

  if (!existing || existing.deletedAt) {
    throw new Error("FORM_NOT_FOUND");
  }

  const data = {
    ...input,
  };

  if (input.slug) {
    data.slug = input.slug.trim().toLowerCase();
  }

  if (input.name) {
    data.name = {
      ...existing.name,
      ...input.name,
    };
  }

  if (input.description) {
    data.description = {
      ...existing.description,
      ...input.description,
    };
  }

  if (input.fields) {
    data.fields = normalizeFields(input.fields);
  }

  if (input.settings) {
    data.settings = {
      ...existing.settings,
      ...input.settings,

      submitLabel: {
        ...existing.settings?.submitLabel,

        ...input.settings?.submitLabel,
      },

      successTitle: {
        ...existing.settings?.successTitle,

        ...input.settings?.successTitle,
      },

      successMessage: {
        ...existing.settings?.successMessage,

        ...input.settings?.successMessage,
      },
    };
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

  validateForm(preview);

  const result = await updateFormRecord({
    companyId,
    formId,
    data,

    userId: currentUser.uid,
  });

  const before = serializeFirestoreDocument(result.before);

  const after = serializeFirestoreDocument(result.after);

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: "FORM_UPDATE",

    resource: "form",

    resourceId: formId,

    before,

    after,
  });

  return after;
}

export async function publishForm({ companyId, formId, currentUser }) {
  const existing = await getFormById({
    companyId,
    formId,
  });

  if (!existing || existing.deletedAt) {
    throw new Error("FORM_NOT_FOUND");
  }

  validateForm(existing);

  const result = await publishFormRecord({
    companyId,
    formId,

    userId: currentUser.uid,
  });

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: "FORM_PUBLISH",

    resource: "form",

    resourceId: formId,

    before: serializeFirestoreDocument(result.before),

    after: serializeFirestoreDocument(result.after),
  });

  return serializeFirestoreDocument(result.after);
}

export async function unpublishForm({ companyId, formId, currentUser }) {
  const result = await unpublishFormRecord({
    companyId,
    formId,

    userId: currentUser.uid,
  });

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: "FORM_UNPUBLISH",

    resource: "form",

    resourceId: formId,

    before: serializeFirestoreDocument(result.before),

    after: serializeFirestoreDocument(result.after),
  });

  return serializeFirestoreDocument(result.after);
}

export async function deleteForm({ companyId, formId, currentUser }) {
  const before = await softDeleteFormRecord({
    companyId,
    formId,

    userId: currentUser.uid,
  });

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: "FORM_DELETE",

    resource: "form",

    resourceId: formId,

    before: serializeFirestoreDocument(before),

    after: {
      deleted: true,
    },
  });

  return {
    id: formId,

    deleted: true,
  };
}

export async function getPublishedFormBySlug({ companyId, slug }) {
  const form = await getFormBySlug({
    companyId,
    slug,
  });

  if (!form || form.deletedAt || form.status !== "published") {
    throw new Error("FORM_NOT_FOUND");
  }

  return serializeFirestoreDocument(form);
}
