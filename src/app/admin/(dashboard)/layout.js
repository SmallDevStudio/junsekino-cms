import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/guards";

import AdminShell from "@/components/admin/layout/AdminShell";

export default async function AdminDashboardLayout({ children }) {
  const user = await requireAuth();

  if (user.mustChangePassword === true) {
    redirect("/admin/change-password");
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}
