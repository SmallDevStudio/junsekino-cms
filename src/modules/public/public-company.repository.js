import "server-only";

import { adminDb } from "@/lib/firebase/admin";

import { resolveCompanyBySlug } from "@/modules/company/company-slug.repository";

export async function getPublicCompanyBySlug(companySlug) {
  return resolveCompanyBySlug(companySlug);
}

export async function getPublicCompanySettings(companyId) {
  const settingsRef = adminDb
    .collection("companies")
    .doc(companyId)
    .collection("settings");

  const [navigation, branding, seo, social, analytics, contact, privacy] =
    await Promise.all([
      settingsRef.doc("navigation").get(),

      settingsRef.doc("branding").get(),

      settingsRef.doc("seo").get(),

      settingsRef.doc("social").get(),

      settingsRef.doc("analytics").get(),

      settingsRef.doc("contact").get(),

      settingsRef.doc("privacy").get(),
    ]);

  return {
    navigation: navigation.exists ? navigation.data() : null,

    branding: branding.exists ? branding.data() : null,

    seo: seo.exists ? seo.data() : null,

    social: social.exists ? social.data() : null,

    analytics: analytics.exists ? analytics.data() : null,

    contact: contact.exists ? contact.data() : null,

    privacy: privacy.exists ? privacy.data() : null,
  };
}
