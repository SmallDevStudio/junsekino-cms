import DocsWorkspace from "@/components/admin/docs/DocsWorkspace";

export const metadata = {
  title: "Getting Started",

  description: "Learn how to configure and manage websites with Junsekino CMS.",

  robots: {
    index: false,

    follow: false,
  },
};

export default function DocumentationHomePage() {
  return <DocsWorkspace initialSectionId="getting-started" />;
}
