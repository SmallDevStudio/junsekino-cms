import "server-only";

import {
  createConsentRecord,
  createLegalVersionRecord,
  getActiveLegalDocuments,
  getActiveLegalVersion,
  getLegalDocument,
  getLegalVersionById,
  listLegalVersions,
  publishLegalVersionRecord,
} from "./legal.repository";

import { hashVisitorTechnicalValue } from "@/lib/visitor/visitor";

import { getCompanyPrivacySettings } from "@/modules/legal/privacy-settings.service";

import { serializeFirestoreDocument } from "@/utils/firestore";

import { createAuditLogSafe } from "@/modules/audit/audit.service";

function resolveConsentDecision(consent) {
  const optionalValues = [
    consent.analytics,

    consent.functional,

    consent.marketing,
  ];

  if (optionalValues.every((value) => value === true)) {
    return "accepted_all";
  }

  if (optionalValues.every((value) => value !== true)) {
    return "necessary_only";
  }

  return "customized";
}

function createExpirationDate(days) {
  const safeDays = Number.isInteger(days)
    ? Math.max(30, Math.min(3650, days))
    : 730;

  return new Date(Date.now() + safeDays * 24 * 60 * 60 * 1000);
}

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
  const [legal, privacySettings] = await Promise.all([
    getActiveLegalDocuments(companyId),

    getCompanyPrivacySettings(companyId),
  ]);

  const normalizedConsent = {
    necessary: true,

    analytics: consent.analytics === true,

    functional: consent.functional === true,

    marketing: consent.marketing === true,
  };

  const legalVersions = {
    privacy: legal.privacy?.version?.id || null,

    cookies: legal.cookies?.version?.id || null,

    terms: legal.terms?.version?.id || null,
  };

  const consentVersion = privacySettings.consentManagement?.version || 1;

  const recordProof = privacySettings.consentManagement?.recordProof !== false;

  if (recordProof) {
    const retentionDays = privacySettings.retention?.consentRecordDays || 730;

    const userAgentHash =
      userAgent &&
      privacySettings.consentManagement?.anonymizeTechnicalData !== false
        ? hashVisitorTechnicalValue(
            userAgent,

            companyId,
          )
        : null;

    await createConsentRecord({
      companyId,

      visitorHash,

      consent: normalizedConsent,

      consentVersion,

      legalVersions,

      source,

      decision: resolveConsentDecision(normalizedConsent),

      userAgentHash,

      expiresAt: createExpirationDate(retentionDays),
    });
  }

  return {
    consent: normalizedConsent,

    consentVersion,

    legalVersions,

    updatedAt: new Date().toISOString(),
  };
}
