import "server-only";

import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";

import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function getFirebaseAdminApp() {
  if (getApps().length > 0) {
    return getApp();
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;

  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  );

  if (!projectId) {
    throw new Error("Missing FIREBASE_ADMIN_PROJECT_ID environment variable.");
  }

  if (!clientEmail) {
    throw new Error(
      "Missing FIREBASE_ADMIN_CLIENT_EMAIL environment variable.",
    );
  }

  if (!privateKey) {
    throw new Error("Missing FIREBASE_ADMIN_PRIVATE_KEY environment variable.");
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),

    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

const firebaseAdminApp = getFirebaseAdminApp();

const adminAuth = getAuth(firebaseAdminApp);

const adminDb = getFirestore(firebaseAdminApp);

const adminStorage = getStorage(firebaseAdminApp);

export { firebaseAdminApp, adminAuth, adminDb, adminStorage };
