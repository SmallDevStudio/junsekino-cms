import { notFound, permanentRedirect } from "next/navigation";

import PublicProjectIndex from "@/components/public/project/PublicProjectIndex";

import { getPublicCompany } from "@/modules/public/public-company.service";

import { getPublicProjectSearchData } from "@/modules/public/public-project-search.service";

import { getPublicProjectIndex } from "@/modules/public/public-project.service";

function normalizeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

/*
 * =========================================================
 * METADATA
 * =========================================================
 */

export async function generateMetadata({ params }) {
  const resolvedParams = await params;

  const companySlug = normalizeSlug(resolvedParams.companySlug);

  try {
    const data = await getPublicCompany(companySlug);

    if (data.redirect) {
      return {};
    }

    const companyName = data.company?.name || "Junsekino";

    return {
      title: "Project",

      description: `Selected architecture and design projects by ${companyName}.`,
    };
  } catch {
    return {};
  }
}

/*
 * =========================================================
 * PROJECT PAGE
 * =========================================================
 */

export default async function PublicProjectPage({ params }) {
  const resolvedParams = await params;

  const companySlug = normalizeSlug(resolvedParams.companySlug);

  if (!companySlug) {
    notFound();
  }

  let companyData;

  try {
    companyData = await getPublicCompany(companySlug);
  } catch (error) {
    if (error.message === "PUBLIC_COMPANY_NOT_FOUND") {
      notFound();
    }

    throw error;
  }

  /*
   * Handle legacy / previous company slug.
   */
  if (companyData.redirect) {
    permanentRedirect(`/${companyData.redirectTo}/project`);
  }

  const companyId = companyData.company.id;

  /*
   * Load both datasets in parallel:
   *
   * 1. Project Index
   *    - grouped by category
   *    - maximum 6 projects/category
   *
   * 2. Search Dataset
   *    - every published project
   */
  const [projectIndex, searchProjects] = await Promise.all([
    getPublicProjectIndex({
      companyId,

      limitPerCategory: 6,
    }),

    getPublicProjectSearchData({
      companyId,
    }),
  ]);

  return (
    <PublicProjectIndex
      companySlug={companySlug}
      sections={projectIndex.sections}
      searchProjects={searchProjects}
      locale="en"
    />
  );
}
