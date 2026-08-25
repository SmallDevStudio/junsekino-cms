import "server-only";

import { getFormById, getFormBySlug } from "./form.repository";

import {
  checkSubmissionRateLimit,
  createSubmissionRecord,
  getSubmissionById,
  listSubmissionRecords,
  updateSubmissionStatusRecord,
} from "./form-submission.repository";

import { getActiveLegalDocuments } from "@/modules/legal/legal.repository";

import { createFormSubmissionNotification } from "@/modules/notification/notification.service";

import { sendFormSubmissionEmail } from "@/modules/email/email.service";

import { serializeFirestoreDocument } from "@/utils/firestore";

import { createAuditLogSafe } from "@/modules/audit/audit.service";

function isEmptyValue(value) {
  if (value === undefined || value === null) {
    return true;
  }

  if (typeof value === "string") {
    return value.trim() === "";
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  return false;
}

function validateText({ field, value }) {
  if (typeof value !== "string") {
    throw new Error(`FORM_FIELD_INVALID:${field.id}`);
  }

  const validation = field.validation || {};

  if (validation.minLength != null && value.length < validation.minLength) {
    throw new Error(`FORM_FIELD_TOO_SHORT:${field.id}`);
  }

  if (validation.maxLength != null && value.length > validation.maxLength) {
    throw new Error(`FORM_FIELD_TOO_LONG:${field.id}`);
  }

  if (validation.pattern) {
    try {
      const regex = new RegExp(validation.pattern);

      if (!regex.test(value)) {
        throw new Error(`FORM_FIELD_PATTERN_INVALID:${field.id}`);
      }
    } catch (error) {
      if (error.message?.startsWith("FORM_FIELD_")) {
        throw error;
      }

      throw new Error(`FORM_FIELD_CONFIGURATION_INVALID:${field.id}`);
    }
  }
}

function validateEmail({ field, value }) {
  validateText({
    field,
    value,
  });

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  if (!valid) {
    throw new Error(`FORM_FIELD_EMAIL_INVALID:${field.id}`);
  }
}

function validateNumber({ field, value }) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`FORM_FIELD_NUMBER_INVALID:${field.id}`);
  }

  const validation = field.validation || {};

  if (validation.min != null && value < validation.min) {
    throw new Error(`FORM_FIELD_NUMBER_MIN:${field.id}`);
  }

  if (validation.max != null && value > validation.max) {
    throw new Error(`FORM_FIELD_NUMBER_MAX:${field.id}`);
  }
}

function validateOption({ field, value }) {
  const validValues = new Set(
    (field.options || []).map((option) => option.value),
  );

  if (!validValues.has(value)) {
    throw new Error(`FORM_FIELD_OPTION_INVALID:${field.id}`);
  }
}

function validateFormValues({ form, values }) {
  const cleaned = {};

  for (const field of form.fields || []) {
    if (field.enabled === false) {
      continue;
    }

    if (["heading", "paragraph"].includes(field.type)) {
      continue;
    }

    const value = values[field.id];

    if (field.required && isEmptyValue(value)) {
      throw new Error(`FORM_FIELD_REQUIRED:${field.id}`);
    }

    if (isEmptyValue(value)) {
      cleaned[field.id] = null;

      continue;
    }

    switch (field.type) {
      case "text":
      case "textarea":
      case "phone":
      case "date":
        validateText({
          field,
          value,
        });
        break;

      case "email":
        validateEmail({
          field,
          value,
        });
        break;

      case "number":
        validateNumber({
          field,
          value,
        });
        break;

      case "select":
      case "radio":
        if (typeof value !== "string") {
          throw new Error(`FORM_FIELD_INVALID:${field.id}`);
        }

        validateOption({
          field,
          value,
        });
        break;

      case "checkbox":
        if (typeof value !== "boolean" && !Array.isArray(value)) {
          throw new Error(`FORM_FIELD_INVALID:${field.id}`);
        }

        if (Array.isArray(value)) {
          for (const selected of value) {
            validateOption({
              field,
              value: selected,
            });
          }
        }

        break;

      case "consent":
        if (value !== true) {
          throw new Error(`FORM_FIELD_CONSENT_REQUIRED:${field.id}`);
        }
        break;

      case "file":
        /*
         * File uploads will use
         * a separate private signed
         * upload workflow.
         */
        throw new Error("FORM_FILE_UPLOAD_NOT_READY");

      default:
        throw new Error(`FORM_FIELD_TYPE_UNSUPPORTED:${field.id}`);
    }

    cleaned[field.id] = value;
  }

  return cleaned;
}

function resolveLegalVersions(legal) {
  return {
    privacy: legal.privacy?.version?.id || null,

    cookies: legal.cookies?.version?.id || null,

    terms: legal.terms?.version?.id || null,
  };
}

function validatePrivacyRequirement({ form, legal }) {
  if (form.settings?.requirePrivacyConsent !== true) {
    return;
  }

  if (!legal.privacy?.version?.id) {
    throw new Error("FORM_PRIVACY_NOTICE_NOT_PUBLISHED");
  }

  const privacyFields = (form.fields || []).filter(
    (field) =>
      field.type === "consent" &&
      field.consent?.legalDocument === "privacy" &&
      field.enabled !== false,
  );

  if (privacyFields.length === 0) {
    throw new Error("FORM_PRIVACY_CONSENT_FIELD_REQUIRED");
  }
}

export async function submitPublicForm({
  companyId,
  formSlug,
  input,
  visitorHash,
  userAgent,
}) {
  const form = await getFormBySlug({
    companyId,

    slug: formSlug,
  });

  if (!form || form.deletedAt || form.status !== "published") {
    throw new Error("FORM_NOT_FOUND");
  }

  /*
   * Honeypot.
   *
   * Return fake success at route
   * level instead of revealing bot
   * detection.
   */
  if (input.website?.trim()) {
    throw new Error("FORM_HONEYPOT_TRIGGERED");
  }

  const rate = await checkSubmissionRateLimit({
    companyId,

    formId: form.id,

    visitorHash,

    limit: 5,
  });

  if (!rate.allowed) {
    throw new Error("FORM_RATE_LIMITED");
  }

  const legal = await getActiveLegalDocuments(companyId);

  validatePrivacyRequirement({
    form,
    legal,
  });

  const values = validateFormValues({
    form,

    values: input.values,
  });

  const legalVersions = resolveLegalVersions(legal);

  const submission = await createSubmissionRecord({
    companyId,

    data: {
      formId: form.id,

      formSlug: form.slug,

      formType: form.type,

      formName: form.name,

      /*
       * Snapshot of form version
       * semantics at submission
       * time.
       */
      fieldsSnapshot: form.fields,

      values,

      legalVersions,

      visitorHash,

      source: {
        pagePath: input.source?.pagePath || null,

        popupId: input.source?.popupId || null,

        referrer: input.source?.referrer || null,
      },

      userAgent: userAgent || null,
    },
  });

  const serialized = serializeFirestoreDocument(submission);

  /*
   * Notifications should never make
   * a valid visitor submission fail.
   */

  try {
    await createFormSubmissionNotification({
      companyId,
      form,
      submission: serialized,
    });
  } catch (error) {
    console.error("Create form notification failed:", error);
  }

  let email = {
    sent: false,
  };

  try {
    email = await sendFormSubmissionEmail({
      form,

      submission: serialized,
    });
  } catch (error) {
    console.error("Form email notification failed:", error);

    email = {
      sent: false,
      error: error.message,
    };
  }

  return {
    submission: {
      id: serialized.id,

      status: serialized.status,

      createdAt: serialized.createdAt,
    },

    message: form.settings?.successMessage || {
      th: "ส่งข้อมูลเรียบร้อยแล้ว",

      en: "Submission received.",
    },

    email: {
      sent: email.sent === true,
    },
  };
}

export async function listFormSubmissions({
  companyId,
  formId = null,
  status = null,
}) {
  const items = await listSubmissionRecords({
    companyId,
    formId,
    status,
  });

  items.sort(
    (a, b) =>
      (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0),
  );

  return items.map(serializeFirestoreDocument);
}

export async function getFormSubmission({ companyId, submissionId }) {
  const item = await getSubmissionById({
    companyId,
    submissionId,
  });

  if (!item || item.deletedAt) {
    throw new Error("FORM_SUBMISSION_NOT_FOUND");
  }

  return serializeFirestoreDocument(item);
}

export async function updateFormSubmissionStatus({
  companyId,
  submissionId,
  status,
  currentUser,
}) {
  const result = await updateSubmissionStatusRecord({
    companyId,
    submissionId,
    status,

    userId: currentUser.uid,
  });

  const before = serializeFirestoreDocument(result.before);

  const after = serializeFirestoreDocument(result.after);

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: "FORM_SUBMISSION_STATUS_UPDATE",

    resource: "formSubmission",

    resourceId: submissionId,

    before,

    after,
  });

  return after;
}
