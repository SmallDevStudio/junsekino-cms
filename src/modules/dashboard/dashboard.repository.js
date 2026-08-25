import "server-only";

import { adminDb } from "@/lib/firebase/admin";

function getCompanyRef(companyId) {
  return adminDb.collection("companies").doc(companyId);
}

export async function getAnalyticsDailyRecords({ companyId, dateKeys }) {
  if (!dateKeys.length) {
    return [];
  }

  const snapshot = await getCompanyRef(companyId)
    .collection("analyticsDaily")
    .get();

  const allowed = new Set(dateKeys);

  return snapshot.docs
    .map((document) => ({
      id: document.id,

      ...document.data(),
    }))
    .filter((item) => allowed.has(item.date));
}

export async function getContentStatsRecords(companyId) {
  const snapshot = await getCompanyRef(companyId)
    .collection("contentStats")
    .get();

  return snapshot.docs.map((document) => ({
    id: document.id,

    ...document.data(),
  }));
}

export async function getSubmissionRecords(companyId) {
  const snapshot = await getCompanyRef(companyId)
    .collection("formSubmissions")
    .get();

  return snapshot.docs
    .map((document) => ({
      id: document.id,

      ...document.data(),
    }))
    .filter((item) => !item.deletedAt);
}

export async function getNotificationRecords(companyId) {
  const snapshot = await getCompanyRef(companyId)
    .collection("notifications")
    .get();

  return snapshot.docs
    .map((document) => ({
      id: document.id,

      ...document.data(),
    }))
    .filter((item) => !item.deletedAt);
}

export async function getContentRecord({ companyId, contentType, contentId }) {
  const collectionMap = {
    public: "publicContents",

    project: "projects",

    award: "awards",

    page: "pages",

    news: "news",
  };

  const collectionName = collectionMap[contentType];

  if (!collectionName) {
    return null;
  }

  const snapshot = await getCompanyRef(companyId)
    .collection(collectionName)
    .doc(contentId)
    .get();

  if (!snapshot.exists) {
    return null;
  }

  return {
    id: snapshot.id,

    ...snapshot.data(),
  };
}
