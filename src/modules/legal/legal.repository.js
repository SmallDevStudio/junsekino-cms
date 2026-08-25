import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

function getCompanyRef(companyId) {
  return adminDb.collection("companies").doc(companyId);
}

function getLegalDocumentsCollection(companyId) {
  return getCompanyRef(companyId).collection("legalDocuments");
}

function getLegalVersionsCollection(companyId) {
  return getCompanyRef(companyId).collection("legalDocumentVersions");
}

function getConsentCollection(companyId) {
  return getCompanyRef(companyId).collection("consentRecords");
}

export async function getLegalDocument({ companyId, type }) {
  const snapshot = await getLegalDocumentsCollection(companyId).doc(type).get();

  if (!snapshot.exists) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

export async function getLegalVersionById({ companyId, versionId }) {
  const snapshot = await getLegalVersionsCollection(companyId)
    .doc(versionId)
    .get();

  if (!snapshot.exists) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

export async function listLegalVersions({ companyId, type }) {
  const snapshot = await getLegalVersionsCollection(companyId)
    .where("type", "==", type)
    .get();

  const items = snapshot.docs.map((document) => ({
    id: document.id,

    ...document.data(),
  }));

  items.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || 0;

    const bTime = b.createdAt?.toMillis?.() || 0;

    return bTime - aTime;
  });

  return items;
}

export async function createLegalVersionRecord({ companyId, data, userId }) {
  const ref = getLegalVersionsCollection(companyId).doc();

  await ref.set({
    ...data,

    status: "draft",

    version: null,

    publishedAt: null,

    publishedBy: null,

    createdAt: FieldValue.serverTimestamp(),

    createdBy: userId,

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: userId,
  });

  return getLegalVersionById({
    companyId,
    versionId: ref.id,
  });
}

export async function publishLegalVersionRecord({
  companyId,
  type,
  versionId,
  userId,
}) {
  const documentRef = getLegalDocumentsCollection(companyId).doc(type);

  const versionRef = getLegalVersionsCollection(companyId).doc(versionId);

  let result = null;

  await adminDb.runTransaction(async (transaction) => {
    const [documentSnapshot, versionSnapshot] = await transaction.getAll(
      documentRef,
      versionRef,
    );

    if (!versionSnapshot.exists) {
      throw new Error("LEGAL_VERSION_NOT_FOUND");
    }

    const versionData = versionSnapshot.data();

    if (versionData.type !== type) {
      throw new Error("LEGAL_VERSION_TYPE_MISMATCH");
    }

    const previousVersion = documentSnapshot.exists
      ? documentSnapshot.data().version || 0
      : 0;

    const previousActiveId = documentSnapshot.exists
      ? documentSnapshot.data().activeVersionId || null
      : null;

    const nextVersion = previousVersion + 1;

    /*
     * Archive previous active version.
     */
    if (previousActiveId && previousActiveId !== versionId) {
      const previousRef =
        getLegalVersionsCollection(companyId).doc(previousActiveId);

      transaction.set(
        previousRef,
        {
          status: "archived",

          updatedAt: FieldValue.serverTimestamp(),

          updatedBy: userId,
        },
        {
          merge: true,
        },
      );
    }

    transaction.update(versionRef, {
      status: "published",

      version: nextVersion,

      publishedAt: FieldValue.serverTimestamp(),

      publishedBy: userId,

      updatedAt: FieldValue.serverTimestamp(),

      updatedBy: userId,
    });

    transaction.set(
      documentRef,
      {
        type,

        status: "published",

        activeVersionId: versionId,

        version: nextVersion,

        requireReConsent: versionData.requireReConsent === true,

        effectiveAt: versionData.effectiveAt || null,

        updatedAt: FieldValue.serverTimestamp(),

        updatedBy: userId,

        createdAt: documentSnapshot.exists
          ? documentSnapshot.data().createdAt
          : FieldValue.serverTimestamp(),

        createdBy: documentSnapshot.exists
          ? documentSnapshot.data().createdBy
          : userId,
      },
      {
        merge: true,
      },
    );

    result = {
      previousActiveId,
      activeVersionId: versionId,
      version: nextVersion,
    };
  });

  return result;
}

export async function getActiveLegalVersion({ companyId, type }) {
  const document = await getLegalDocument({
    companyId,
    type,
  });

  if (
    !document ||
    document.status !== "published" ||
    !document.activeVersionId
  ) {
    return null;
  }

  const version = await getLegalVersionById({
    companyId,

    versionId: document.activeVersionId,
  });

  if (!version || version.status !== "published") {
    return null;
  }

  return {
    document,
    version,
  };
}

export async function getActiveLegalDocuments(companyId) {
  const types = ["privacy", "cookies", "terms"];

  const items = await Promise.all(
    types.map(async (type) => [
      type,
      await getActiveLegalVersion({
        companyId,
        type,
      }),
    ]),
  );

  return Object.fromEntries(items);
}

export async function createConsentRecord({
  companyId,
  visitorHash,
  consent,
  legalVersions,
  source,
  userAgent = null,
}) {
  const ref = getConsentCollection(companyId).doc();

  await ref.set({
    visitorHash,

    consent,

    legalVersions,

    source,

    userAgent,

    createdAt: FieldValue.serverTimestamp(),
  });

  return {
    id: ref.id,
  };
}
