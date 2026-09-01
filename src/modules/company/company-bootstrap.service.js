import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

import {
  COMPANY_SETTING_KEYS,
  DEFAULT_COMPANY_BRANDING,
  DEFAULT_COMPANY_NAVIGATION,
  DEFAULT_COMPANY_SEO,
  DEFAULT_COMPANY_SOCIAL,
  DEFAULT_SYSTEM_PAGES,
} from "@/constants/company-defaults";

import { ensureContactForm } from "@/modules/form/contact-form.service";

import { createAuditLogSafe } from "@/modules/audit/audit.service";

/*
 * =========================================================
 * REFERENCES
 * =========================================================
 */

function getCompanyRef(companyId) {
  return adminDb.collection("companies").doc(companyId);
}

/*
 * =========================================================
 * MERGE
 * =========================================================
 */

function mergeBranding(companyData = {}) {
  const branding = companyData.branding || {};

  const colors = {
    ...DEFAULT_COMPANY_BRANDING.colors,

    ...(companyData.colors || {}),

    ...(branding.colors || {}),
  };

  return {
    ...DEFAULT_COMPANY_BRANDING,

    ...branding,

    colors,

    /*
     * Legacy settings compatibility.
     */
    logoMediaId:
      typeof branding.logoLight === "string"
        ? branding.logoLight
        : branding.logoLight?.mediaId || null,

    logoDarkMediaId:
      typeof branding.logoDark === "string"
        ? branding.logoDark
        : branding.logoDark?.mediaId || null,

    faviconMediaId:
      typeof branding.favicon === "string"
        ? branding.favicon
        : branding.favicon?.mediaId || null,

    primaryColor: colors.primary,

    secondaryColor: colors.secondary,

    accentColor: colors.accent,

    backgroundColor: colors.background,

    textColor: colors.text,
  };
}

function mergeSeo(companyData = {}) {
  const seo = companyData.seo || {};

  const index =
    typeof seo.index === "boolean" ? seo.index : DEFAULT_COMPANY_SEO.index;

  const follow =
    typeof seo.follow === "boolean" ? seo.follow : DEFAULT_COMPANY_SEO.follow;

  return {
    ...DEFAULT_COMPANY_SEO,

    ...seo,

    th: {
      ...DEFAULT_COMPANY_SEO.th,

      ...(seo.th || {}),
    },

    en: {
      ...DEFAULT_COMPANY_SEO.en,

      ...(seo.en || {}),
    },

    index,

    follow,

    robots: {
      index,

      follow,
    },
  };
}

function mergeSocial(companyData = {}) {
  return {
    ...DEFAULT_COMPANY_SOCIAL,

    ...(companyData.social || {}),
  };
}

/*
 * =========================================================
 * PAGE
 * =========================================================
 */

function createContactConfig(companyData = {}) {
  const profile = companyData.profile || {};

  const companyAddress = profile.address || companyData.address || {};

  return {
    coverCaption: {
      th: "",

      en: "",
    },

    establishedYear: "",

    companyDisplayName: {
      th: "",

      en: companyData.legalName || companyData.name || "",
    },

    /*
     * Snapshot for compatibility.
     *
     * Company Profile remains canonical.
     */
    address: {
      th: companyAddress?.th || "",

      en:
        typeof companyAddress === "string"
          ? companyAddress
          : companyAddress?.en || "",
    },

    telephone: profile.phone || companyData.phone || "",

    email: profile.email || companyData.email || "",

    form: {
      enabled: true,

      formId: null,

      formSlug: "contact",
    },
  };
}

function createDefaultPageData({
  page,

  companyData,

  userId,
}) {
  const data = {
    slug: page.slug,

    pageType: page.pageType,

    title: page.title,

    excerpt: {
      th: "",

      en: "",
    },

    content: {
      th: "",

      en: "",
    },

    hero: {
      enabled: false,

      title: {
        th: "",

        en: "",
      },

      subtitle: {
        th: "",

        en: "",
      },

      media: null,
    },

    sections: [],

    navigation: page.navigation,

    featuredImage: null,

    status: "draft",

    scheduledAt: null,

    publishedAt: null,

    publishedBy: null,

    seo: {
      th: {
        title: "",

        description: "",

        keywords: [],

        ogTitle: "",

        ogDescription: "",

        ogImage: null,
      },

      en: {
        title: "",

        description: "",

        keywords: [],

        ogTitle: "",

        ogDescription: "",

        ogImage: null,
      },

      index: true,

      follow: true,
    },

    createdAt: FieldValue.serverTimestamp(),

    createdBy: userId,

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: userId,

    deletedAt: null,

    deletedBy: null,
  };

  if (page.pageType === "contact") {
    data.contact = createContactConfig(companyData);
  }

  return data;
}

/*
 * =========================================================
 * BOOTSTRAP
 * =========================================================
 */

export async function bootstrapCompany({
  companyId,

  currentUser,
}) {
  if (!companyId) {
    throw new Error("COMPANY_ID_REQUIRED");
  }

  if (!currentUser?.uid) {
    throw new Error("CURRENT_USER_REQUIRED");
  }

  const companyRef = getCompanyRef(companyId);

  const settingsRef = companyRef.collection("settings");

  const navigationRef = settingsRef.doc(COMPANY_SETTING_KEYS.NAVIGATION);

  const brandingRef = settingsRef.doc(COMPANY_SETTING_KEYS.BRANDING);

  const seoRef = settingsRef.doc(COMPANY_SETTING_KEYS.SEO);

  const socialRef = settingsRef.doc(COMPANY_SETTING_KEYS.SOCIAL);

  const pageRefs = DEFAULT_SYSTEM_PAGES.map((page) => ({
    page,

    pageRef: companyRef.collection("pages").doc(page.id),

    slugRef: companyRef.collection("pageSlugs").doc(page.slug),
  }));

  const result = {
    settings: {
      navigation: false,

      branding: false,

      seo: false,

      social: false,
    },

    pages: [],

    contactForm: {
      created: false,

      id: null,

      status: null,
    },
  };

  /*
   * =======================================================
   * SETTINGS AND PAGES TRANSACTION
   * =======================================================
   */

  await adminDb.runTransaction(async (transaction) => {
    /*
     * All reads must occur before writes.
     */

    const companySnapshot = await transaction.get(companyRef);

    if (!companySnapshot.exists) {
      throw new Error("COMPANY_NOT_FOUND");
    }

    const companyData = companySnapshot.data();

    if (companyData.deletedAt) {
      throw new Error("COMPANY_NOT_FOUND");
    }

    const documentRefs = [
      navigationRef,

      brandingRef,

      seoRef,

      socialRef,

      ...pageRefs.flatMap(
        ({
          pageRef,

          slugRef,
        }) => [pageRef, slugRef],
      ),
    ];

    const snapshots = await transaction.getAll(...documentRefs);

    const snapshotByPath = new Map(
      snapshots.map((snapshot) => [snapshot.ref.path, snapshot]),
    );

    const now = () => FieldValue.serverTimestamp();

    const getSnapshot = (ref) => snapshotByPath.get(ref.path);

    /*
     * Navigation
     */

    if (!getSnapshot(navigationRef)?.exists) {
      transaction.set(navigationRef, {
        items: DEFAULT_COMPANY_NAVIGATION,

        createdAt: now(),

        createdBy: currentUser.uid,

        updatedAt: now(),

        updatedBy: currentUser.uid,
      });

      result.settings.navigation = true;
    }

    /*
     * Branding
     */

    if (!getSnapshot(brandingRef)?.exists) {
      transaction.set(brandingRef, {
        ...mergeBranding(companyData),

        createdAt: now(),

        createdBy: currentUser.uid,

        updatedAt: now(),

        updatedBy: currentUser.uid,
      });

      result.settings.branding = true;
    }

    /*
     * SEO
     */

    if (!getSnapshot(seoRef)?.exists) {
      transaction.set(seoRef, {
        ...mergeSeo(companyData),

        createdAt: now(),

        createdBy: currentUser.uid,

        updatedAt: now(),

        updatedBy: currentUser.uid,
      });

      result.settings.seo = true;
    }

    /*
     * Social
     */

    if (!getSnapshot(socialRef)?.exists) {
      transaction.set(socialRef, {
        ...mergeSocial(companyData),

        createdAt: now(),

        createdBy: currentUser.uid,

        updatedAt: now(),

        updatedBy: currentUser.uid,
      });

      result.settings.social = true;
    }

    /*
     * System Pages
     */

    for (const {
      page,

      pageRef,

      slugRef,
    } of pageRefs) {
      const pageSnapshot = getSnapshot(pageRef);

      const slugSnapshot = getSnapshot(slugRef);

      let pageCreated = false;

      let slugCreated = false;

      if (!pageSnapshot?.exists) {
        transaction.set(
          pageRef,

          createDefaultPageData({
            page,

            companyData,

            userId: currentUser.uid,
          }),
        );

        pageCreated = true;
      }

      /*
       * Repair a missing slug reservation
       * without replacing an existing page.
       */
      if (!slugSnapshot?.exists) {
        transaction.set(slugRef, {
          pageId: page.id,

          slug: page.slug,

          system: true,

          createdAt: now(),

          createdBy: currentUser.uid,
        });

        slugCreated = true;
      }

      result.pages.push({
        id: page.id,

        slug: page.slug,

        pageCreated,

        slugCreated,
      });
    }

    /*
     * Mark bootstrapped.
     *
     * This flag does not block repair runs.
     */
    transaction.update(companyRef, {
      bootstrapped: true,

      bootstrappedAt: companyData.bootstrappedAt || now(),

      bootstrapUpdatedAt: now(),

      updatedAt: now(),

      updatedBy: currentUser.uid,
    });
  });

  /*
   * =======================================================
   * CONTACT FORM
   * =======================================================
   *
   * Form Service performs its own writes and audit,
   * so it must run outside the transaction.
   * =======================================================
   */

  const contactResult = await ensureContactForm({
    companyId,

    currentUser,

    publish: true,
  });

  result.contactForm = {
    created: contactResult.created === true,

    id: contactResult.form?.id || null,

    status: contactResult.form?.status || null,
  };

  /*
   * Contact Page and Form are now prepared.
   */
  await companyRef.update({
    "setup.completedSteps.contact": true,

    bootstrapUpdatedAt: FieldValue.serverTimestamp(),

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: currentUser.uid,
  });

  /*
   * =======================================================
   * AUDIT
   * =======================================================
   */

  await createAuditLogSafe({
    userId: currentUser.uid,

    companyId,

    action: "COMPANY_BOOTSTRAP",

    resource: "company",

    resourceId: companyId,

    before: null,

    after: result,
  });

  return result;
}
