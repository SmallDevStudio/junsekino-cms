import { notFound, permanentRedirect } from "next/navigation";

import PublicAboutPage from "@/components/public/about/PublicAboutPage";

import { getPublicAboutPage } from "@/modules/public/public-about.service";

import { getPublicCompany } from "@/modules/public/public-company.service";

/*
 * =========================================================
 * SLUG
 * =========================================================
 */

function normalizeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

/*
 * =========================================================
 * LOCALIZED META
 * =========================================================
 */

function getLocalizedString(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return value.en || value.th || "";
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
    const companyData = await getPublicCompany(companySlug);

    if (companyData.redirect) {
      return {};
    }

    const page = await getPublicAboutPage({
      companyId: companyData.company.id,

      companySlug,
    });

    if (!page) {
      return {
        title: "About",

        robots: {
          index: false,
        },
      };
    }

    const seo = page.seo?.en || {};

    const pageTitle = seo.title || getLocalizedString(page.title) || "About";

    const companyName = companyData.company?.name || "Junsekino";

    const description =
      seo.description ||
      getLocalizedString(page.excerpt) ||
      `About ${companyName}.`;

    return {
      title: pageTitle,

      description,

      robots: {
        index: page.seo?.index !== false,

        follow: page.seo?.follow !== false,
      },
    };
  } catch {
    return {};
  }
}

/*
 * =========================================================
 * PAGE
 * =========================================================
 */

export default async function AboutPage({ params }) {
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
   * Canonical company slug.
   */
  if (companyData.redirect) {
    permanentRedirect(`/${companyData.redirectTo}/about`);
  }

  const page = await getPublicAboutPage({
    companyId: companyData.company.id,

    companySlug,
  });

  /*
   * About exists publicly only
   * when one version is published.
   */
  if (!page) {
    notFound();
  }

  return <PublicAboutPage page={page} locale="en" />;
}
