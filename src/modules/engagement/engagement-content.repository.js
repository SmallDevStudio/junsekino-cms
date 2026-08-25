import "server-only";

import { adminDb } from "@/lib/firebase/admin";

import { ENGAGEMENT_COLLECTIONS } from "@/constants/engagement";

export async function getPublishedEngagementContent({
  companyId,
  contentType,
  contentId,
}) {
  const collectionName = ENGAGEMENT_COLLECTIONS[contentType];

  if (!collectionName) {
    return null;
  }

  const snapshot = await adminDb
    .collection("companies")
    .doc(companyId)
    .collection(collectionName)
    .doc(contentId)
    .get();

  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data();

  if (data.deletedAt || data.status !== "published") {
    return null;
  }

  return {
    id: snapshot.id,

    ...data,
  };
}
