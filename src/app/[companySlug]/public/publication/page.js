import { notFound, permanentRedirect } from "next/navigation";

import PublicContentIndex from "@/components/public/content/PublicContentIndex";

import { getPublicCompany } from "@/modules/public/public-company.service";

import { getPublicContentPageData } from "@/modules/public/public-content-page.service";

function normalizeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;

  const companySlug = normalizeSlug(resolvedParams.companySlug);

  try {
    const data = await getPublicCompany(companySlug);

    if (data.redirect) {
      return {};
    }

    return {
      title: "Publication",

      description: `Publications from ${data.company?.name || "Junsekino"}.`,
    };
  } catch {
    return {};
  }
}

export default async function PublicPublicationPage({ params }) {
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

  if (companyData.redirect) {
    permanentRedirect(`/${companyData.redirectTo}/public/publication`);
  }

  const data = await getPublicContentPageData({
    companyId: companyData.company.id,
  });

  return (
    <PublicContentIndex
      companySlug={companySlug}
      items={data.publications}
      providers={data.providers}
      tags={data.tags}
      locale="en"
    />
  );
}
