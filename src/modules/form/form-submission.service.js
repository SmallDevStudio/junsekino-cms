import "server-only";

import { getFormBySlug } from "./form.repository";

import {
  checkSubmissionRateLimit,
  createSubmissionRecord,
  getSubmissionById,
  listExpiredSubmissionRecords,
  listSubmissionRecords,
  markSubmissionCleanupFailed,
  markSubmissionCleanupStarted,
  markSubmissionReadRecord,
  permanentlyDeleteSubmissionRecord,
  restoreSubmissionRecord,
  trashSubmissionRecord,
  updateSubmissionStatusRecord,
} from "./form-submission.repository";

import { deleteSubmissionAttachments } from "./form-attachment.service";

import { getActiveLegalDocuments } from "@/modules/legal/legal.repository";

import { getCompanyPrivacySettings } from "@/modules/legal/privacy-settings.service";

import { createFormSubmissionNotification } from "@/modules/notification/notification.service";

import { sendFormSubmissionEmail } from "@/modules/email/email.service";

import { serializeFirestoreDocument } from "@/utils/firestore";

import { createAuditLogSafe } from "@/modules/audit/audit.service";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

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

function createRetentionExpiration(days) {
  const safeDays = Number.isInteger(days)
    ? Math.max(
        30,

        Math.min(3650, days),
      )
    : 730;

  return new Date(Date.now() + safeDays * 24 * 60 * 60 * 1000);
}

function createDeletionAuditSummary({
  submission,
  attachmentCount = 0,
  reason,
}) {
  return {
    id: submission.id,

    formId: submission.formId || null,

    formSlug: submission.formSlug || null,

    formType: submission.formType || null,

    status: submission.status || null,

    createdAt:
      serializeFirestoreDocument({
        value: submission.createdAt,
      })?.value || null,

    attachmentCount,

    deletionReason: reason,

    /*
     * Do not copy fieldsSnapshot, values,
     * visitorHash, source or technical data
     * into the deletion audit record.
     */
    personalDataRemoved: true,
  };
}

/*
 * =========================================================
 * FIELD VALIDATION
 * =========================================================
 */

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
    let regex;

    try {
      regex = new RegExp(validation.pattern);
    } catch {
      throw new Error(`FORM_FIELD_CONFIGURATION_INVALID:${field.id}`);
    }

    if (!regex.test(value)) {
      throw new Error(`FORM_FIELD_PATTERN_INVALID:${field.id}`);
    }
  }
}

function validateEmail({ field, value }) {
  validateText({
    field,

    value,
  });

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
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

/*
 * =========================================================
 * FORM VALUES
 * =========================================================
 */

function validateFormValues({ form, values }) {
  const cleaned = {};

  const attachmentBindings = [];

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
        if (typeof value !== "string" || !value.trim()) {
          throw new Error(`FORM_FIELD_FILE_INVALID:${field.id}`);
        }

        attachmentBindings.push({
          fieldId: field.id,

          attachmentId: value.trim(),
        });
        break;

      default:
        throw new Error(`FORM_FIELD_TYPE_UNSUPPORTED:${field.id}`);
    }

    cleaned[field.id] = value;
  }

  return {
    values: cleaned,

    attachmentBindings,
  };
}

/*
 * =========================================================
 * LEGAL
 * =========================================================
 */

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

/*
 * =========================================================
 * SUBMIT PUBLIC FORM
 * =========================================================
 */

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

  const [legal, privacySettings] = await Promise.all([
    getActiveLegalDocuments(companyId),

    getCompanyPrivacySettings(companyId),
  ]);

  validatePrivacyRequirement({
    form,

    legal,
  });

  const validated = validateFormValues({
    form,

    values: input.values,
  });

  const legalVersions = resolveLegalVersions(legal);

  const retentionDays = privacySettings.retention?.formSubmissionDays || 730;

  const retentionExpiresAt = createRetentionExpiration(retentionDays);

  const submission = await createSubmissionRecord({
    companyId,

    visitorHash,

    attachmentBindings: validated.attachmentBindings,

    data: {
      formId: form.id,

      formSlug: form.slug,

      formType: form.type,

      formName: form.name,

      fieldsSnapshot: form.fields,

      values: validated.values,

      attachmentIds: validated.attachmentBindings.map(
        (item) => item.attachmentId,
      ),

      legalVersions,

      visitorHash,

      retentionExpiresAt,

      source: {
        pagePath: input.source?.pagePath || null,

        popupId: input.source?.popupId || null,

        referrer: input.source?.referrer || null,

        /*
         * The route now sends only an
         * irreversible HMAC value.
         */
        userAgentHash: userAgent || null,
      },
    },
  });

  const serialized = serializeFirestoreDocument(submission);

  try {
    await createFormSubmissionNotification({
      companyId,

      form,

      submission: serialized,
    });
  } catch (error) {
    console.error(
      "Create form notification failed:",

      error,
    );
  }

  let email = {
    sent: false,
  };

  try {
    email = await sendFormSubmissionEmail({
      companyId,

      form,

      submission: serialized,
    });
  } catch (error) {
    console.error(
      "Form email notification failed:",

      error,
    );

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

/*
 * =========================================================
 * LIST SUBMISSIONS
 * =========================================================
 */

export async function listFormSubmissions({
  companyId,
  formId = null,
  status = null,
  folder = "inbox",
  currentUser = null,
  unreadOnly = false,
}) {
  const items = await listSubmissionRecords({
    companyId,

    formId,

    status,

    folder,
  });

  items.sort(
    (a, b) =>
      (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0),
  );

  let result = items;

  if (unreadOnly && currentUser?.uid) {
    result = result.filter((item) => {
      const readBy =
        item.readBy && typeof item.readBy === "object" ? item.readBy : {};

      return !readBy[currentUser.uid];
    });
  }

  return result.map((item) => {
    const serialized = serializeFirestoreDocument(item);

    const readBy =
      serialized.readBy && typeof serialized.readBy === "object"
        ? serialized.readBy
        : {};

    return {
      ...serialized,

      readBy,

      readerCount: Object.keys(readBy).length,

      readByCurrentUser: currentUser?.uid
        ? Boolean(readBy[currentUser.uid])
        : false,
    };
  });
}

/*
 * =========================================================
 * GET SUBMISSION
 * =========================================================
 */

export async function getFormSubmission({
  companyId,
  submissionId,
  includeDeleted = false,
  currentUser = null,
}) {
  const item = await getSubmissionById({
    companyId,

    submissionId,
  });

  if (!item || (!includeDeleted && item.deletedAt)) {
    throw new Error("FORM_SUBMISSION_NOT_FOUND");
  }

  const serialized = serializeFirestoreDocument(item);

  const readBy =
    serialized.readBy && typeof serialized.readBy === "object"
      ? serialized.readBy
      : {};

  return {
    ...serialized,

    readBy,

    readerCount: Object.keys(readBy).length,

    readByCurrentUser: currentUser?.uid
      ? Boolean(readBy[currentUser.uid])
      : false,
  };
}

/*
 * =========================================================
 * UPDATE WORKFLOW STATUS
 * =========================================================
 */

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

/*
 * =========================================================
 * MARK READ
 * =========================================================
 */

export async function markFormSubmissionRead({
  companyId,
  submissionId,
  currentUser,
}) {
  const result = await markSubmissionReadRecord({
    companyId,

    submissionId,

    reader: {
      uid: currentUser.uid,

      displayName: currentUser.displayName || null,

      email: currentUser.email || null,

      avatarUrl: currentUser.avatarUrl || null,
    },
  });

  const before = serializeFirestoreDocument(result.before);

  const after = serializeFirestoreDocument(result.after);

  if (!before?.readBy?.[currentUser.uid]) {
    await createAuditLogSafe({
      userId: currentUser.uid,

      companyId,

      action: "FORM_SUBMISSION_READ",

      resource: "formSubmission",

      resourceId: submissionId,

      before,

      after,
    });
  }

  return {
    ...after,

    readByCurrentUser: true,

    readerCount: Object.keys(after.readBy || {}).length,
  };
}

/*
 * =========================================================
 * TRASH
 * =========================================================
 */

export async function trashFormSubmission({
  companyId,
  submissionId,
  currentUser,
}) {
  const result = await trashSubmissionRecord({
    companyId,

    submissionId,

    userId: currentUser.uid,
  });

  const before = serializeFirestoreDocument(result.before);

  const after = serializeFirestoreDocument(result.after);

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: "FORM_SUBMISSION_TRASH",

    resource: "formSubmission",

    resourceId: submissionId,

    before,

    after,
  });

  return after;
}

/*
 * =========================================================
 * RESTORE
 * =========================================================
 */

export async function restoreFormSubmission({
  companyId,
  submissionId,
  currentUser,
}) {
  const result = await restoreSubmissionRecord({
    companyId,

    submissionId,

    userId: currentUser.uid,
  });

  const before = serializeFirestoreDocument(result.before);

  const after = serializeFirestoreDocument(result.after);

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: "FORM_SUBMISSION_RESTORE",

    resource: "formSubmission",

    resourceId: submissionId,

    before,

    after,
  });

  return after;
}

/*
 * =========================================================
 * PERMANENT DELETE
 * =========================================================
 */

export async function permanentlyDeleteFormSubmission({
  companyId,
  submissionId,
  currentUser,
}) {
  const existing = await getSubmissionById({
    companyId,

    submissionId,
  });

  if (!existing) {
    throw new Error("FORM_SUBMISSION_NOT_FOUND");
  }

  if (!existing.deletedAt) {
    throw new Error("FORM_SUBMISSION_NOT_IN_TRASH");
  }

  await markSubmissionCleanupStarted({
    companyId,

    submissionId,
  });

  try {
    const attachments = await deleteSubmissionAttachments({
      companyId,

      submissionId,
    });

    const result = await permanentlyDeleteSubmissionRecord({
      companyId,

      submissionId,
    });

    const auditSummary = createDeletionAuditSummary({
      submission: result.before,

      attachmentCount: attachments.count,

      reason: "manual_permanent_delete",
    });

    await createAuditLogSafe({
      userId: currentUser.uid,

      companyId,

      action: "FORM_SUBMISSION_PERMANENT_DELETE",

      resource: "formSubmission",

      resourceId: submissionId,

      before: auditSummary,

      after: {
        id: submissionId,

        deleted: true,

        personalDataRemoved: true,
      },
    });

    return {
      id: submissionId,

      deleted: true,

      attachmentCount: attachments.count,
    };
  } catch (error) {
    await markSubmissionCleanupFailed({
      companyId,

      submissionId,

      error: error.message || "FORM_SUBMISSION_CLEANUP_FAILED",
    });

    throw error;
  }
}

/*
 * =========================================================
 * AUTOMATED RETENTION CLEANUP
 * =========================================================
 */

export async function cleanupExpiredFormSubmissions({ companyId, limit = 50 }) {
  const submissions = await listExpiredSubmissionRecords({
    companyId,

    limit,
  });

  const result = {
    processed: 0,

    deleted: 0,

    failed: 0,

    attachmentCount: 0,

    errors: [],
  };

  for (const submission of submissions) {
    result.processed += 1;

    await markSubmissionCleanupStarted({
      companyId,

      submissionId: submission.id,
    });

    try {
      const attachments = await deleteSubmissionAttachments({
        companyId,

        submissionId: submission.id,
      });

      await permanentlyDeleteSubmissionRecord({
        companyId,

        submissionId: submission.id,

        allowExpired: true,
      });

      result.deleted += 1;

      result.attachmentCount += attachments.count;

      const auditSummary = createDeletionAuditSummary({
        submission,

        attachmentCount: attachments.count,

        reason: "retention_expired",
      });

      await createAuditLogSafe({
        userId: "system:retention",

        companyId,

        action: "FORM_SUBMISSION_RETENTION_DELETE",

        resource: "formSubmission",

        resourceId: submission.id,

        before: auditSummary,

        after: {
          id: submission.id,

          deleted: true,

          personalDataRemoved: true,
        },

        metadata: {
          automated: true,
        },
      });
    } catch (error) {
      result.failed += 1;

      result.errors.push({
        submissionId: submission.id,

        message: error.message || "FORM_SUBMISSION_CLEANUP_FAILED",
      });

      await markSubmissionCleanupFailed({
        companyId,

        submissionId: submission.id,

        error: error.message || "FORM_SUBMISSION_CLEANUP_FAILED",
      });
    }
  }

  return result;
}
