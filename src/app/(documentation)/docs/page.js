import DocsOverview from "@/components/docs/DocsOverview";

export const metadata = {
  title: "Overview",

  description:
    "Overview of Junsekino CMS, its capabilities and recommended operating workflow.",

  robots: {
    index: false,

    follow: false,
  },
};

export default function DocumentationHomePage() {
  return <DocsOverview />;
}
