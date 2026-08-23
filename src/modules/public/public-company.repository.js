import "server-only";

import { adminDb } from "@/lib/firebase/admin";

export async function getPublicCompanyBySlug(companySlug) {
  const snapshot = await adminDb
    .collection("companies")
    .where("slug", "==", companySlug)
    .where("status", "==", "active")
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const document = snapshot.docs[0];

  const data = document.data();

  if (data.deletedAt) {
    return null;
  }

  return {
    id: document.id,

    ...data,
  };
}

export async function getPublicCompanySettings(companyId) {
  const settingsRef = adminDb
    .collection("companies")
    .doc(companyId)
    .collection("settings");

  const [navigation, branding, seo, social] = await Promise.all([
    settingsRef.doc("navigation").get(),

    settingsRef.doc("branding").get(),

    settingsRef.doc("seo").get(),

    settingsRef.doc("social").get(),
  ]);

  return {
    navigation: navigation.exists ? navigation.data() : null,

    branding: branding.exists ? branding.data() : null,

    seo: seo.exists ? seo.data() : null,

    social: social.exists ? social.data() : null,
  };
}
