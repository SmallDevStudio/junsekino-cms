import { notFound, permanentRedirect } from "next/navigation";

import PublicProjectCategory from "@/components/public/project/PublicProjectCategory";
import PublicProjectDetail from "@/components/public/project/PublicProjectDetail";

import { getPublicCompany } from "@/modules/public/public-company.service";

import {
  getPublicProjectsByCategory,
  getPublicWebsiteProjectBySlug,
} from "@/modules/public/public-project.service";

function normalizeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

async function resolvePublicProjectRoute({ companyId, companySlug, slug }) {
  /*
   * 1. Try Category first.
   */
  try {
    const category = await getPublicProjectsByCategory({
      companyId,
      categorySlug: slug,
    });

    return {
      type: "category",
      data: category,
    };
  } catch (error) {
    if (error.message !== "PUBLIC_PROJECT_CATEGORY_NOT_FOUND") {
      throw error;
    }
  }

  /*
   * 2. Then try Project.
   */
  try {
    const project = await getPublicWebsiteProjectBySlug({
      companyId,
      companySlug,
      slug,
    });

    return {
      type: "project",
      data: project,
    };
  } catch (error) {
    if (error.message !== "PUBLIC_PROJECT_NOT_FOUND") {
      throw error;
    }
  }

  return null;
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;

  const companySlug = normalizeSlug(resolvedParams.companySlug);

  const slug = normalizeSlug(resolvedParams.slug);

  try {
    const companyData = await getPublicCompany(companySlug);

    if (companyData.redirect) {
      return {};
    }

    const resolved = await resolvePublicProjectRoute({
      companyId: companyData.company.id,

      companySlug,

      slug,
    });

    if (!resolved) {
      return {};
    }

    if (resolved.type === "category") {
      const category = resolved.data.category;

      const title = category.name?.en || category.name?.th || "Project";

      return {
        title,

        description: `${title} projects by ${
          companyData.company?.name || "Junsekino"
        }.`,
      };
    }

    const project = resolved.data;

    const title =
      project.seo?.en?.title ||
      project.title?.en ||
      project.title?.th ||
      "Project";

    const description =
      project.seo?.en?.description ||
      project.excerpt?.en ||
      project.excerpt?.th ||
      "";

    return {
      title,
      description,
    };
  } catch {
    return {};
  }
}

export default async function PublicProjectDynamicPage({ params }) {
  const resolvedParams = await params;

  const companySlug = normalizeSlug(resolvedParams.companySlug);

  const slug = normalizeSlug(resolvedParams.slug);

  if (!companySlug || !slug) {
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
    permanentRedirect(`/${companyData.redirectTo}/project/${slug}`);
  }

  const resolved = await resolvePublicProjectRoute({
    companyId: companyData.company.id,

    companySlug,

    slug,
  });

  if (!resolved) {
    notFound();
  }

  if (resolved.type === "category") {
    return (
      <PublicProjectCategory
        companySlug={companySlug}
        category={resolved.data.category}
        projects={resolved.data.projects}
        locale="en"
      />
    );
  }

  return (
    <PublicProjectDetail
      companySlug={companySlug}
      project={resolved.data}
      locale="en"
    />
  );
}
