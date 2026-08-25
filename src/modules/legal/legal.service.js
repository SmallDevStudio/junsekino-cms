import "server-only";

import {
  createLegalVersionRecord,
  getActiveLegalDocuments,
  getActiveLegalVersion,
  getLegalDocument,
  getLegalVersionById,
  listLegalVersions,
  publishLegalVersionRecord,
  createConsentRecord,
} from "./legal.repository";

import { serializeFirestoreDocument } from "@/utils/firestore";

import { createAuditLogSafe } from "@/modules/audit/audit.service";

export async function createLegalVersion({
  companyId,
  type,
  input,
  currentUser,
}) {
  const data = {
    type,

    title: input.title,

    content: input.content,

    changeSummary: input.changeSummary || {
      th: "",
      en: "",
    },

    effectiveAt: input.effectiveAt ? new Date(input.effectiveAt) : null,

    requireReConsent: input.requireReConsent === true,
  };

  if (!data.title.th.trim() && !data.title.en.trim()) {
    throw new Error("LEGAL_TITLE_REQUIRED");
  }

  if (!data.content.th.trim() && !data.content.en.trim()) {
    throw new Error("LEGAL_CONTENT_REQUIRED");
  }

  const record = await createLegalVersionRecord({
    companyId,
    data,

    userId: currentUser.uid,
  });

  const serialized = serializeFirestoreDocument(record);

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: "LEGAL_VERSION_CREATE",

    resource: "legalDocument",

    resourceId: record.id,

    before: null,

    after: serialized,

    metadata: {
      type,
    },
  });

  return serialized;
}

export async function getLegalVersions({ companyId, type }) {
  const items = await listLegalVersions({
    companyId,
    type,
  });

  return items.map(serializeFirestoreDocument);
}

export async function publishLegalVersion({
  companyId,
  type,
  versionId,
  currentUser,
}) {
  const before = await getLegalDocument({
    companyId,
    type,
  });

  const version = await getLegalVersionById({
    companyId,
    versionId,
  });

  if (!version) {
    throw new Error("LEGAL_VERSION_NOT_FOUND");
  }

  const result = await publishLegalVersionRecord({
    companyId,
    type,
    versionId,

    userId: currentUser.uid,
  });

  const after = await getActiveLegalVersion({
    companyId,
    type,
  });

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: "LEGAL_VERSION_PUBLISH",

    resource: "legalDocument",

    resourceId: type,

    before: serializeFirestoreDocument(before),

    after: serializeFirestoreDocument(after),

    metadata: {
      versionId,
      version: result.version,
    },
  });

  return serializeFirestoreDocument(after);
}

export async function getPublicLegalDocuments(companyId) {
  const documents = await getActiveLegalDocuments(companyId);

  const result = {};

  for (const [type, item] of Object.entries(documents)) {
    if (!item) {
      result[type] = null;

      continue;
    }

    result[type] = {
      type,

      version: item.document.version,

      versionId: item.version.id,

      requireReConsent: item.document.requireReConsent === true,

      effectiveAt: item.document.effectiveAt || null,

      title: item.version.title,

      content: item.version.content,
    };
  }

  return serializeFirestoreDocument(result);
}

export async function saveVisitorConsent({
  companyId,
  visitorHash,
  consent,
  source,
  userAgent,
}) {
  const legal = await getActiveLegalDocuments(companyId);

  const legalVersions = {
    privacy: legal.privacy?.version?.id || null,

    cookies: legal.cookies?.version?.id || null,

    terms: legal.terms?.version?.id || null,
  };

  await createConsentRecord({
    companyId,

    visitorHash,

    consent,

    legalVersions,

    source,

    userAgent,
  });

  return {
    consent,

    legalVersions,

    updatedAt: new Date().toISOString(),
  };
}
