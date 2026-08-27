import PublicHomeSlideshow from "@/components/public/home/PublicHomeSlideshow";

import { resolvePublicCompany } from "@/modules/company/company-slug.service";

import { getPublicHomeSlideshow } from "@/modules/home-slideshow/home-slideshow.service";

async function loadHomeSlideshow(companySlug) {
  try {
    const resolved = await resolvePublicCompany(companySlug);

    if (!resolved || resolved.redirect || !resolved.company) {
      return null;
    }

    return await getPublicHomeSlideshow({
      companyId: resolved.company.id,
    });
  } catch (error) {
    if (error.message === "HOME_SLIDESHOW_NOT_FOUND") {
      return null;
    }

    throw error;
  }
}

export default async function CompanyHomePage({ params }) {
  const resolvedParams = await params;

  const companySlug = String(resolvedParams.companySlug || "")
    .trim()
    .toLowerCase();

  const slideshow = await loadHomeSlideshow(companySlug);

  return (
    <PublicHomeSlideshow companySlug={companySlug} slideshow={slideshow} />
  );
}
