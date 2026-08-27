import { notFound, permanentRedirect } from "next/navigation";

import PublicProjectIndex from "@/components/public/project/PublicProjectIndex";

import { getPublicCompany } from "@/modules/public/public-company.service";

import { getPublicProjectIndex } from "@/modules/public/public-project.service";

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

    const companyName = data.company?.name || "Junsekino";

    return {
      title: "Project",

      description: `Selected architecture and design projects by ${companyName}.`,
    };
  } catch {
    return {};
  }
}

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

  if (companyData.redirect) {
    permanentRedirect(`/${companyData.redirectTo}/project`);
  }

  const data = await getPublicProjectIndex({
    companyId: companyData.company.id,

    limitPerCategory: 6,
  });

  return (
    <PublicProjectIndex
      companySlug={companySlug}
      sections={data.sections}
      locale="en"
    />
  );
}
