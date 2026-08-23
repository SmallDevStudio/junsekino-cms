import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

export const AUDIT_ACTIONS = {
  // COMPANY
  COMPANY_CREATE: "COMPANY_CREATE",

  COMPANY_UPDATE: "COMPANY_UPDATE",

  COMPANY_DELETE: "COMPANY_DELETE",

  // USER
  USER_CREATE: "USER_CREATE",

  USER_UPDATE: "USER_UPDATE",

  USER_DELETE: "USER_DELETE",

  // PROJECT
  PROJECT_CREATE: "PROJECT_CREATE",

  PROJECT_UPDATE: "PROJECT_UPDATE",

  PROJECT_DELETE: "PROJECT_DELETE",

  PROJECT_PUBLISH: "PROJECT_PUBLISH",

  PROJECT_SCHEDULE: "PROJECT_SCHEDULE",

  PROJECT_UNPUBLISH: "PROJECT_UNPUBLISH",

  // NEWS
  NEWS_CREATE: "NEWS_CREATE",

  NEWS_UPDATE: "NEWS_UPDATE",

  NEWS_DELETE: "NEWS_DELETE",

  NEWS_PUBLISH: "NEWS_PUBLISH",

  NEWS_SCHEDULE: "NEWS_SCHEDULE",

  NEWS_UNPUBLISH: "NEWS_UNPUBLISH",

  // PAGE
  PAGE_CREATE: "PAGE_CREATE",

  PAGE_UPDATE: "PAGE_UPDATE",

  PAGE_DELETE: "PAGE_DELETE",

  PAGE_PUBLISH: "PAGE_PUBLISH",

  PAGE_SCHEDULE: "PAGE_SCHEDULE",

  PAGE_UNPUBLISH: "PAGE_UNPUBLISH",

  // PEOPLE
  PEOPLE_CREATE: "PEOPLE_CREATE",

  PEOPLE_UPDATE: "PEOPLE_UPDATE",

  PEOPLE_DELETE: "PEOPLE_DELETE",

  PEOPLE_PUBLISH: "PEOPLE_PUBLISH",

  PEOPLE_UNPUBLISH: "PEOPLE_UNPUBLISH",

  // AWARD
  AWARD_CREATE: "AWARD_CREATE",

  AWARD_UPDATE: "AWARD_UPDATE",

  AWARD_DELETE: "AWARD_DELETE",

  AWARD_PUBLISH: "AWARD_PUBLISH",

  AWARD_SCHEDULE: "AWARD_SCHEDULE",

  AWARD_UNPUBLISH: "AWARD_UNPUBLISH",

  // PUBLIC CONTENT
  PUBLIC_CREATE: "PUBLIC_CREATE",

  PUBLIC_UPDATE: "PUBLIC_UPDATE",

  PUBLIC_DELETE: "PUBLIC_DELETE",

  PUBLIC_PUBLISH: "PUBLIC_PUBLISH",

  PUBLIC_SCHEDULE: "PUBLIC_SCHEDULE",

  PUBLIC_UNPUBLISH: "PUBLIC_UNPUBLISH",

  // MEDIA
  MEDIA_UPLOAD: "MEDIA_UPLOAD",

  MEDIA_UPDATE: "MEDIA_UPDATE",

  MEDIA_DELETE: "MEDIA_DELETE",

  // SYSTEM
  SYSTEM_SCHEDULED_PUBLISH: "SYSTEM_SCHEDULED_PUBLISH",

  SYSTEM_SCHEDULED_PUBLISH_FAILED: "SYSTEM_SCHEDULED_PUBLISH_FAILED",
};

export async function createAuditLog({
  userId,
  companyId = null,

  action,

  resource,
  resourceId,

  before = null,
  after = null,

  metadata = null,
}) {
  if (!userId) {
    throw new Error("Audit log requires userId.");
  }

  if (!action) {
    throw new Error("Audit log requires action.");
  }

  if (!resource) {
    throw new Error("Audit log requires resource.");
  }

  if (!resourceId) {
    throw new Error("Audit log requires resourceId.");
  }

  const auditRef = adminDb.collection("auditLogs").doc();

  await auditRef.set({
    userId,

    companyId,

    action,

    resource,

    resourceId,

    before,

    after,

    metadata,

    createdAt: FieldValue.serverTimestamp(),
  });

  return auditRef.id;
}

export async function createAuditLogSafe(payload) {
  try {
    return await createAuditLog(payload);
  } catch (error) {
    console.error("Audit log failed:", {
      action: payload?.action || null,

      resource: payload?.resource || null,

      resourceId: payload?.resourceId || null,

      companyId: payload?.companyId || null,

      error,
    });

    return null;
  }
}
