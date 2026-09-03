import { notFound } from "next/navigation";

import DocsWorkspace from "@/components/admin/docs/DocsWorkspace";

import { ADMIN_DOCS } from "@/constants/admin-docs";

/*
 * =========================================================
 * SECTION
 * =========================================================
 */

function findSection(sectionId) {
  return ADMIN_DOCS.find((section) => section.id === sectionId);
}

/*
 * =========================================================
 * STATIC PARAMS
 * =========================================================
 */

export function generateStaticParams() {
  return ADMIN_DOCS.filter((section) => section.id !== "getting-started").map(
    (section) => ({
      section: section.id,
    }),
  );
}

/*
 * =========================================================
 * METADATA
 * =========================================================
 */

export async function generateMetadata({ params }) {
  const resolvedParams = await params;

  const section = findSection(resolvedParams.section);

  if (!section) {
    return {
      title: "Documentation Not Found",

      robots: {
        index: false,

        follow: false,
      },
    };
  }

  return {
    title: section.title?.en || "Documentation",

    description: section.description?.en || "Junsekino CMS documentation.",

    robots: {
      /*
       * Internal operational documentation
       * should not appear in search engines.
       */
      index: false,

      follow: false,
    },
  };
}

/*
 * =========================================================
 * PAGE
 * =========================================================
 */

export default async function DocumentationSectionPage({ params }) {
  const resolvedParams = await params;

  const sectionId = String(resolvedParams.section || "")
    .trim()
    .toLowerCase();

  const section = findSection(sectionId);

  if (!section || sectionId === "getting-started") {
    notFound();
  }

  return <DocsWorkspace initialSectionId={sectionId} />;
}
