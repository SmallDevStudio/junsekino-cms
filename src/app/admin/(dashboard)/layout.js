import { requireAuth } from "@/lib/auth/guards";

import AdminShell from "@/components/admin/layout/AdminShell";

export default async function AdminDashboardLayout({ children }) {
  const user = await requireAuth();

  return <AdminShell user={user}>{children}</AdminShell>;
}
