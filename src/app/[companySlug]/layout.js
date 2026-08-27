import { notFound, permanentRedirect } from "next/navigation";

import PublicSiteShell from "@/components/public/PublicSiteShell";

import { getPublicCompany } from "@/modules/public/public-company.service";

import { listPublicCompanies } from "@/modules/public/public-company-directory.service";

import { getPublicNavigationData } from "@/modules/public/public-navigation.service";

function normalizeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function resolveSeo(data) {
  const company = data?.company;

  const seo = data?.settings?.seo || company?.seo;

  const english = seo?.en || {};

  const siteName =
    english.siteName || english.title || company?.name || "Junsekino";

  return {
    title: siteName,

    description: english.description || "Junsekino architecture and design.",
  };
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;

  const companySlug = normalizeSlug(resolvedParams.companySlug);

  if (!companySlug) {
    return {};
  }

  try {
    const data = await getPublicCompany(companySlug);

    if (data.redirect) {
      return {};
    }

    const seo = resolveSeo(data);

    return {
      title: {
        default: seo.title,

        template: `%s | ${seo.title}`,
      },

      description: seo.description,
    };
  } catch {
    return {};
  }
}

export default async function CompanyLayout({ children, params }) {
  const resolvedParams = await params;

  const companySlug = normalizeSlug(resolvedParams.companySlug);

  if (!companySlug) {
    notFound();
  }

  let data;

  try {
    data = await getPublicCompany(companySlug);
  } catch (error) {
    if (error.message === "PUBLIC_COMPANY_NOT_FOUND") {
      notFound();
    }

    throw error;
  }

  /*
   * Preserve company slug history.
   *
   * Example:
   * old-company-slug
   * ->
   * new-company-slug
   */
  if (data.redirect) {
    permanentRedirect(`/${data.redirectTo}`);
  }

  /*
   * After company resolution we can
   * safely load data which requires
   * the real Firestore companyId.
   */
  const [companies, navigationData] = await Promise.all([
    listPublicCompanies(),

    getPublicNavigationData({
      companyId: data.company.id,
    }),
  ]);

  return (
    <PublicSiteShell
      company={data.company}
      settings={data.settings}
      companySlug={companySlug}
      companies={companies}
      projectCategories={navigationData.projectCategories}
    >
      {children}
    </PublicSiteShell>
  );
}
