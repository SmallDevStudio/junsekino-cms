import "server-only";

import { updateLegalDraftRecord } from "./legal-draft.repository";

import { createAuditLogSafe } from "@/modules/audit/audit.service";

import { serializeFirestoreDocument } from "@/utils/firestore";

/*
 * =========================================================
 * NORMALIZE
 * =========================================================
 */

function normalizeLocalized(value = {}) {
  return {
    th: String(value?.th || ""),

    en: String(value?.en || ""),
  };
}

function createDraftData(input) {
  const title = normalizeLocalized(input.title);

  const content = normalizeLocalized(input.content);

  if (!title.th.trim() && !title.en.trim()) {
    throw new Error("LEGAL_TITLE_REQUIRED");
  }

  if (!content.th.trim() && !content.en.trim()) {
    throw new Error("LEGAL_CONTENT_REQUIRED");
  }

  return {
    title,

    content,

    changeSummary: normalizeLocalized(input.changeSummary),

    effectiveAt: input.effectiveAt ? new Date(input.effectiveAt) : null,

    requireReConsent: input.requireReConsent === true,
  };
}

/*
 * =========================================================
 * UPDATE
 * =========================================================
 */

export async function updateLegalDraft({
  companyId,

  type,

  versionId,

  input,

  currentUser,
}) {
  if (!companyId) {
    throw new Error("COMPANY_ID_REQUIRED");
  }

  if (!versionId) {
    throw new Error("LEGAL_VERSION_ID_REQUIRED");
  }

  if (!currentUser?.uid) {
    throw new Error("CURRENT_USER_REQUIRED");
  }

  const data = createDraftData(input);

  const result = await updateLegalDraftRecord({
    companyId,

    type,

    versionId,

    data,

    userId: currentUser.uid,
  });

  const before = serializeFirestoreDocument(result.before);

  const after = serializeFirestoreDocument(result.after);

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: "LEGAL_VERSION_UPDATE",

    resource: "legalDocument",

    resourceId: versionId,

    before,

    after,

    metadata: {
      type,
    },
  });

  return after;
}
