import { notFound, permanentRedirect } from "next/navigation";

import PublicAwardIndex from "@/components/public/award/PublicAwardIndex";

import { getPublicAwardIndex } from "@/modules/public/public-award.service";

import { getPublicCompany } from "@/modules/public/public-company.service";

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
      title: "Award",

      description: `Selected awards and recognized projects by ${companyName}.`,
    };
  } catch {
    return {};
  }
}

export default async function PublicAwardPage({ params }) {
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
    permanentRedirect(`/${companyData.redirectTo}/award`);
  }

  const data = await getPublicAwardIndex({
    companyId: companyData.company.id,
  });

  return (
    <PublicAwardIndex
      companySlug={companySlug}
      awards={data.awards}
      categories={data.categories}
      tags={data.tags}
      locale="en"
    />
  );
}
