import fs from "node:fs";

import { cert, getApps, initializeApp } from "firebase-admin/app";

import { FieldValue, getFirestore } from "firebase-admin/firestore";

import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
});

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;

const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
  /\\n/g,
  "\n",
);

if (!projectId) {
  throw new Error("Missing FIREBASE_ADMIN_PROJECT_ID");
}

if (!clientEmail) {
  throw new Error("Missing FIREBASE_ADMIN_CLIENT_EMAIL");
}

if (!privateKey) {
  throw new Error("Missing FIREBASE_ADMIN_PRIVATE_KEY");
}

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const db = getFirestore();

const COMPANY = {
  name: "Junsekino A+D",

  legalName: "",

  shortName: "A+D",

  slug: "junsekino-ad",

  status: "active",

  defaultLocale: "en",

  supportedLocales: ["en"],

  branding: {
    logoLight: null,
    logoDark: null,
    favicon: null,

    colors: {
      primary: "#FE9800",

      secondary: "#FFFFFF",

      accent: "#D4D4D4",

      background: "#FFFFFF",

      surface: "#F7F7F7",

      text: "#FE9800",
    },
  },

  social: {
    facebook: null,
    instagram: null,
    linkedin: null,
    youtube: null,
    x: null,
    tiktok: null,
    pinterest: null,
  },

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
      title: "Junsekino A+D",

      description: "Junsekino Architecture and Design.",

      keywords: [],

      ogTitle: "Junsekino A+D",

      ogDescription: "Junsekino Architecture and Design.",

      ogImage: null,
    },

    index: true,

    follow: true,
  },
};

const DEFAULT_NAVIGATION = [
  {
    key: "home",

    type: "page",

    label: {
      th: "หน้าหลัก",
      en: "Home",
    },

    path: "",

    enabled: true,

    sortOrder: 10,
  },

  {
    key: "about",

    type: "page",

    label: {
      th: "เกี่ยวกับเรา",
      en: "About",
    },

    path: "about",

    enabled: true,

    sortOrder: 20,
  },

  {
    key: "project",

    type: "module",

    label: {
      th: "โครงการ",
      en: "Project",
    },

    path: "projects",

    enabled: true,

    sortOrder: 30,
  },

  {
    key: "award",

    type: "module",

    label: {
      th: "รางวัล",
      en: "Award",
    },

    path: "awards",

    enabled: true,

    sortOrder: 40,
  },

  {
    key: "public",

    type: "module",

    label: {
      th: "สื่อ",
      en: "Public",
    },

    path: "public",

    enabled: true,

    sortOrder: 50,
  },

  {
    key: "news",

    type: "module",

    label: {
      th: "ข่าวสาร",
      en: "News",
    },

    path: "news",

    enabled: true,

    sortOrder: 60,
  },

  {
    key: "contact",

    type: "page",

    label: {
      th: "ติดต่อ",
      en: "Contact",
    },

    path: "contact",

    enabled: true,

    sortOrder: 70,
  },
];

const SYSTEM_PAGES = [
  {
    id: "home",

    slug: "home",

    pageType: "home",

    title: {
      th: "หน้าหลัก",
      en: "Home",
    },

    navigation: {
      enabled: false,
      sortOrder: 10,
    },
  },

  {
    id: "about",

    slug: "about",

    pageType: "about",

    title: {
      th: "เกี่ยวกับเรา",
      en: "About",
    },

    navigation: {
      enabled: true,
      sortOrder: 20,
    },
  },

  {
    id: "contact",

    slug: "contact",

    pageType: "contact",

    title: {
      th: "ติดต่อ",
      en: "Contact",
    },

    navigation: {
      enabled: true,
      sortOrder: 70,
    },
  },
];

function createPageData(page) {
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

    createdBy: "system-script",

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: "system-script",

    deletedAt: null,

    deletedBy: null,
  };
}

async function main() {
  console.log("Creating Junsekino A+D...");

  const slugRef = db.collection("companySlugs").doc(COMPANY.slug);

  const existingSlug = await slugRef.get();

  if (existingSlug.exists) {
    throw new Error(`Company slug already exists: ${COMPANY.slug}`);
  }

  const companyRef = db.collection("companies").doc();

  await db.runTransaction(async (transaction) => {
    const slugSnapshot = await transaction.get(slugRef);

    if (slugSnapshot.exists) {
      throw new Error("COMPANY_SLUG_EXISTS");
    }

    transaction.set(companyRef, {
      ...COMPANY,

      bootstrapped: true,

      bootstrappedAt: FieldValue.serverTimestamp(),

      createdAt: FieldValue.serverTimestamp(),

      createdBy: "system-script",

      updatedAt: FieldValue.serverTimestamp(),

      updatedBy: "system-script",

      deletedAt: null,

      deletedBy: null,
    });

    transaction.set(slugRef, {
      companyId: companyRef.id,

      slug: COMPANY.slug,

      status: "active",

      redirectTo: null,

      createdAt: FieldValue.serverTimestamp(),
    });
  });

  const settingsRef = companyRef.collection("settings");

  const batch = db.batch();

  batch.set(settingsRef.doc("branding"), {
    ...COMPANY.branding,

    createdAt: FieldValue.serverTimestamp(),

    createdBy: "system-script",

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: "system-script",
  });

  batch.set(settingsRef.doc("navigation"), {
    items: DEFAULT_NAVIGATION,

    createdAt: FieldValue.serverTimestamp(),

    createdBy: "system-script",

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: "system-script",
  });

  batch.set(settingsRef.doc("seo"), {
    ...COMPANY.seo,

    createdAt: FieldValue.serverTimestamp(),

    createdBy: "system-script",

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: "system-script",
  });

  batch.set(settingsRef.doc("social"), {
    ...COMPANY.social,

    createdAt: FieldValue.serverTimestamp(),

    createdBy: "system-script",

    updatedAt: FieldValue.serverTimestamp(),

    updatedBy: "system-script",
  });

  for (const page of SYSTEM_PAGES) {
    const pageRef = companyRef.collection("pages").doc(page.id);

    const pageSlugRef = companyRef.collection("pageSlugs").doc(page.slug);

    batch.set(pageRef, createPageData(page));

    batch.set(pageSlugRef, {
      pageId: page.id,

      slug: page.slug,

      system: true,

      createdAt: FieldValue.serverTimestamp(),

      createdBy: "system-script",
    });
  }

  await batch.commit();

  console.log("");
  console.log("Junsekino A+D created successfully.");

  console.log(`Company ID: ${companyRef.id}`);

  console.log(`Slug: ${COMPANY.slug}`);

  console.log("Primary color: #FE9800");

  console.log(`Public URL: http://localhost:3000/${COMPANY.slug}`);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Create A+D failed:", error);

    process.exit(1);
  });
