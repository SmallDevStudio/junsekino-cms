import { redirect } from "next/navigation";

export const metadata = {
  title: "Documentation | Junsekino CMS",
};

export default function LegacyAdminDocsPage() {
  redirect("/docs");
}
