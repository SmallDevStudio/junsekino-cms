import "server-only";

import { adminDb } from "@/lib/firebase/admin";

import { listPublicCompanies } from "@/modules/public/public-company-directory.service";

function isPublished(item) {
  return (
    !item.deletedAt &&
    item.status === "published" &&
    Boolean(item.publishedAt) &&
    item.seo?.index !== false &&
    Boolean(item.slug)
  );
}

function resolveDate(value) {
  if (!value) {
    return new Date();
  }

  if (typeof value.toDate === "function") {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function createEntry({ url, lastModified, changeFrequency, priority }) {
  return {
    url,

    lastModified: resolveDate(lastModified),

    changeFrequency,

    priority,
  };
}

async function getCompanyContent(companyId) {
  const companyRef = adminDb.collection("companies").doc(companyId);

  const [projectsSnapshot, publicContentsSnapshot] = await Promise.all([
    companyRef.collection("projects").get(),

    companyRef.collection("publicContents").get(),
  ]);

  return {
    projects: projectsSnapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    })),

    publicContents: publicContentsSnapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    })),
  };
}

export async function createPublicSitemap(siteUrl) {
  const companies = await listPublicCompanies();

  const entries = [
    createEntry({
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    }),
  ];

  for (const company of companies) {
    const companyUrl = `${siteUrl}/${encodeURIComponent(company.slug)}`;

    entries.push(
      createEntry({
        url: companyUrl,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 1,
      }),

      createEntry({
        url: `${companyUrl}/about`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.8,
      }),

      createEntry({
        url: `${companyUrl}/project`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.9,
      }),

      createEntry({
        url: `${companyUrl}/awards`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.7,
      }),

      createEntry({
        url: `${companyUrl}/public`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      }),

      createEntry({
        url: `${companyUrl}/public/publication`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      }),

      createEntry({
        url: `${companyUrl}/public/video`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      }),

      createEntry({
        url: `${companyUrl}/contact`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.7,
      }),
    );

    try {
      const content = await getCompanyContent(company.id);

      for (const project of content.projects) {
        if (!isPublished(project)) {
          continue;
        }

        entries.push(
          createEntry({
            url: `${companyUrl}/project/` + encodeURIComponent(project.slug),

            lastModified: project.updatedAt || project.publishedAt,

            changeFrequency: "monthly",

            priority: 0.8,
          }),
        );
      }

      for (const item of content.publicContents) {
        if (!isPublished(item)) {
          continue;
        }

        entries.push(
          createEntry({
            url: `${companyUrl}/public/` + encodeURIComponent(item.slug),

            lastModified: item.updatedAt || item.publishedAt,

            changeFrequency: "monthly",

            priority: 0.7,
          }),
        );
      }
    } catch (error) {
      console.error(
        `Unable to build sitemap for company ${company.id}:`,

        error,
      );
    }
  }

  const uniqueEntries = new Map();

  for (const entry of entries) {
    uniqueEntries.set(entry.url, entry);
  }

  return [...uniqueEntries.values()];
}
