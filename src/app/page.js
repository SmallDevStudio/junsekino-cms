import PublicEntrance from "@/components/public/PublicEntrance";

import { listPublicCompanies } from "@/modules/public/public-company-directory.service";

export const metadata = {
  title: "Junsekino",

  description: "Junsekino architecture and design.",
};

export const revalidate = 300;

export default async function HomePage() {
  const companies = await listPublicCompanies();

  return <PublicEntrance companies={companies} />;
}
