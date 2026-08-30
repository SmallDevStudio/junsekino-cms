import { notFound, permanentRedirect } from "next/navigation";

import ContactPageContent from "@/components/public/contact/ContactPageContent";

import { getPublicContactPage } from "@/modules/public/public-contact.service";

import { getPublicCompany } from "@/modules/public/public-company.service";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function normalizeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function localized(value) {
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

    const page = await getPublicContactPage({
      companyId: companyData.company.id,

      companySlug,
    });

    if (!page) {
      return {
        title: "Contact",

        robots: {
          index: false,
        },
      };
    }

    const seo = page.seo?.en || {};

    const title = seo.title || localized(page.title) || "Contact";

    const description =
      seo.description ||
      localized(page.excerpt) ||
      `Contact ${companyData.company?.name || "Junsekino"}.`;

    return {
      title,

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

export default async function ContactPage({ params }) {
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
    permanentRedirect(`/${companyData.redirectTo}/contact`);
  }

  const page = await getPublicContactPage({
    companyId: companyData.company.id,

    companySlug,
  });

  if (!page) {
    notFound();
  }

  return (
    <ContactPageContent companySlug={companySlug} page={page} locale="en" />
  );
}
