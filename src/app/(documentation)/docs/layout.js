import { redirect } from "next/navigation";

import DocsProviders from "@/components/docs/DocsProviders";

import DocsShell from "@/components/docs/DocsShell";

import { requireAuth } from "@/lib/auth/guards";

export const metadata = {
  title: {
    default: "Documentation | Junsekino CMS",

    template: "%s | Junsekino CMS Documentation",
  },

  description: "Documentation and operational guides for Junsekino CMS.",

  robots: {
    index: false,

    follow: false,

    nocache: true,
  },
};

export default async function DocumentationLayout({ children }) {
  const user = await requireAuth();

  if (user.mustChangePassword === true) {
    redirect("/admin/change-password");
  }

  return (
    <DocsProviders user={user}>
      <DocsShell user={user}>{children}</DocsShell>
    </DocsProviders>
  );
}
