import "server-only";

import { adminDb } from "@/lib/firebase/admin";

const SLUG_COLLECTIONS = Object.freeze({
  project: "projectSlugs",
  award: "awardSlugs",
});

function normalizeSlug(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function removeNumericSuffix(slug) {
  return slug.replace(/-\d+$/, "");
}

function getSlugCollection({ companyId, contentType }) {
  const collectionName = SLUG_COLLECTIONS[contentType];

  if (!collectionName) {
    throw new Error("UNSUPPORTED_SLUG_CONTENT_TYPE");
  }

  return adminDb
    .collection("companies")
    .doc(companyId)
    .collection(collectionName);
}

export async function findAvailableSlug({
  companyId,
  contentType,
  slug,
  excludeContentId = null,
  maxAttempts = 1000,
}) {
  const normalizedSlug = normalizeSlug(slug);

  if (!normalizedSlug) {
    return null;
  }

  const collectionRef = getSlugCollection({
    companyId,
    contentType,
  });

  const baseSlug = removeNumericSuffix(normalizedSlug);

  for (let index = 0; index <= maxAttempts; index += 1) {
    const candidate = index === 0 ? normalizedSlug : `${baseSlug}-${index}`;

    const snapshot = await collectionRef.doc(candidate).get();

    if (!snapshot.exists) {
      return candidate;
    }

    if (excludeContentId) {
      const data = snapshot.data();

      const ownerId = data?.projectId || data?.awardId || null;

      if (ownerId === excludeContentId) {
        return candidate;
      }
    }
  }

  throw new Error("SLUG_SUGGESTION_LIMIT_REACHED");
}
