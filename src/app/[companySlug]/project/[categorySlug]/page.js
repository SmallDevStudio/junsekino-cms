import { notFound, permanentRedirect } from "next/navigation";

import PublicProjectCategory from "@/components/public/project/PublicProjectCategory";

import { getPublicCompany } from "@/modules/public/public-company.service";

import { getPublicProjectsByCategory } from "@/modules/public/public-project.service";

function normalizeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;

  const companySlug = normalizeSlug(resolvedParams.companySlug);

  const categorySlug = normalizeSlug(resolvedParams.categorySlug);

  try {
    const companyData = await getPublicCompany(companySlug);

    if (companyData.redirect) {
      return {};
    }

    const data = await getPublicProjectsByCategory({
      companyId: companyData.company.id,

      categorySlug,
    });

    const title =
      data.category?.name?.en || data.category?.name?.th || "Project";

    return {
      title,

      description: `${title} projects by ${companyData.company?.name || "Junsekino"}.`,
    };
  } catch {
    return {};
  }
}

export default async function PublicProjectCategoryPage({ params }) {
  const resolvedParams = await params;

  const companySlug = normalizeSlug(resolvedParams.companySlug);

  const categorySlug = normalizeSlug(resolvedParams.categorySlug);

  if (!companySlug || !categorySlug) {
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

  if (companyData.redirect) {
    permanentRedirect(`/${companyData.redirectTo}/project/${categorySlug}`);
  }

  let data;

  try {
    data = await getPublicProjectsByCategory({
      companyId: companyData.company.id,

      categorySlug,
    });
  } catch (error) {
    if (error.message === "PUBLIC_PROJECT_CATEGORY_NOT_FOUND") {
      notFound();
    }

    throw error;
  }

  return (
    <PublicProjectCategory
      companySlug={companySlug}
      category={data.category}
      projects={data.projects}
      locale="en"
    />
  );
}
