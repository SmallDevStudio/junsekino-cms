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

import { createAuditLogSafe } from "@/modules/audit/audit.service";

function getCompanyRef(companyId) {
  return adminDb.collection("companies").doc(companyId);
}

function createDefaultPageData({ page, userId }) {
  return {
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
}

export async function bootstrapCompany({ companyId, currentUser }) {
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
  };

  await adminDb.runTransaction(async (transaction) => {
    /*
     * IMPORTANT:
     * Perform all reads before
     * any transaction writes.
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

      ...pageRefs.flatMap(({ pageRef, slugRef }) => [pageRef, slugRef]),
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
        ...DEFAULT_COMPANY_BRANDING,

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
        ...DEFAULT_COMPANY_SEO,

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
        ...DEFAULT_COMPANY_SOCIAL,

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

    for (const { page, pageRef, slugRef } of pageRefs) {
      const pageSnapshot = getSnapshot(pageRef);

      const slugSnapshot = getSnapshot(slugRef);

      let pageCreated = false;

      let slugCreated = false;

      if (!pageSnapshot?.exists) {
        transaction.set(
          pageRef,
          createDefaultPageData({
            page,

            userId: currentUser.uid,
          }),
        );

        pageCreated = true;
      }

      /*
       * If page already existed
       * but slug reservation did
       * not, repair only the slug
       * reservation.
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
     * Mark company as bootstrapped.
     *
     * This does NOT prevent future
     * repair runs.
     */

    transaction.update(companyRef, {
      bootstrapped: true,

      bootstrappedAt: now(),

      updatedAt: now(),

      updatedBy: currentUser.uid,
    });
  });

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
