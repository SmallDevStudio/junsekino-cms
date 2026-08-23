import "server-only";

import { getStorage } from "firebase-admin/storage";

export function getMediaBucket() {
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET;

  if (!bucketName) {
    throw new Error("FIREBASE_STORAGE_BUCKET is not configured.");
  }

  return getStorage().bucket(bucketName);
}
