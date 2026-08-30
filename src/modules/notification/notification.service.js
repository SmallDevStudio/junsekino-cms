import "server-only";

import {
  createNotificationRecord,
  listNotificationRecords,
  markNotificationReadRecord,
} from "./notification.repository";

import { serializeFirestoreDocument } from "@/utils/firestore";

/*
 * =========================================================
 * FORM SUBMISSION
 * =========================================================
 */

export async function createFormSubmissionNotification({
  companyId,
  form,
  submission,
}) {
  if (form.settings?.notifyEmployees === false) {
    return null;
  }

  const title = {
    th:
      form.type === "contact"
        ? "มีข้อความติดต่อใหม่"
        : form.type === "career"
          ? "มีใบสมัครงานใหม่"
          : form.type === "survey"
            ? "มีแบบสอบถามใหม่"
            : "มีการส่งแบบฟอร์มใหม่",

    en:
      form.type === "contact"
        ? "New contact message"
        : form.type === "career"
          ? "New job application"
          : form.type === "survey"
            ? "New survey response"
            : "New form submission",
  };

  const record = await createNotificationRecord({
    companyId,

    data: {
      type: "form_submission",

      level: "info",

      title,

      message: {
        th: form.name?.th || "แบบฟอร์ม",

        en: form.name?.en || "Form",
      },

      resource: {
        type: "formSubmission",

        id: submission.id,

        formId: form.id,
      },

      audience: {
        roles: [
          "TENANT_OWNER",
          "TENANT_ADMIN",
          "TENANT_USER",
          "SUPERADMIN",
          "ADMIN",
          "EDITOR",
        ],
      },
    },
  });

  return record;
}

/*
 * =========================================================
 * LIST
 * =========================================================
 */

export async function listCompanyNotifications({
  companyId,
  userId = null,
  limit = 50,
}) {
  const items = await listNotificationRecords({
    companyId,
    limit,
  });

  return items.map((record) => {
    const item = serializeFirestoreDocument(record);

    return {
      ...item,

      read:
        Boolean(userId) && Array.isArray(item.readBy)
          ? item.readBy.includes(userId)
          : false,
    };
  });
}

/*
 * =========================================================
 * MARK READ
 * =========================================================
 */

export async function markCompanyNotificationRead({
  companyId,
  notificationId,
  currentUser,
}) {
  if (!currentUser?.uid) {
    throw new Error("UNAUTHORIZED");
  }

  const result = await markNotificationReadRecord({
    companyId,

    notificationId,

    userId: currentUser.uid,
  });

  const serialized = serializeFirestoreDocument(result);

  return {
    ...serialized,

    read: true,
  };
}
