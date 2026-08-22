import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

export const AUDIT_ACTIONS = {
  COMPANY_CREATE: "COMPANY_CREATE",
  COMPANY_UPDATE: "COMPANY_UPDATE",
  COMPANY_DELETE: "COMPANY_DELETE",

  USER_CREATE: "USER_CREATE",
  USER_UPDATE: "USER_UPDATE",
  USER_DELETE: "USER_DELETE",

  CONTENT_CREATE: "CONTENT_CREATE",
  CONTENT_UPDATE: "CONTENT_UPDATE",
  CONTENT_DELETE: "CONTENT_DELETE",
  CONTENT_PUBLISH: "CONTENT_PUBLISH",

  MEDIA_UPLOAD: "MEDIA_UPLOAD",
  MEDIA_UPDATE: "MEDIA_UPDATE",
  MEDIA_DELETE: "MEDIA_DELETE",
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
