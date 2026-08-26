import "server-only";

import { adminDb } from "@/lib/firebase/admin";

const SLUG_COLLECTIONS = Object.freeze({
  project: "projectSlugs",
  award: "awardSlugs",
  publicContent: "publicContentSlugs",
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

function getOwnerId(data) {
  return data?.projectId || data?.awardId || data?.contentId || null;
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
      const ownerId = getOwnerId(snapshot.data());

      if (ownerId === excludeContentId) {
        return candidate;
      }
    }
  }

  throw new Error("SLUG_SUGGESTION_LIMIT_REACHED");
}
