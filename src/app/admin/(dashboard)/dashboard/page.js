import DashboardWorkspace from "@/components/admin/dashboard/DashboardWorkspace";

import { requireAuth } from "@/lib/auth/guards";

export const metadata = {
  title: "Dashboard | Junsekino CMS",
};

export default async function AdminDashboardPage() {
  const user = await requireAuth();

  return (
    <DashboardWorkspace
      userName={user.displayName || user.email || "Administrator"}
    />
  );
}
