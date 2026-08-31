import { requireAuth } from "@/lib/auth/guards";

import AdminShell from "@/components/admin/layout/AdminShell";

import ChangePasswordForm from "@/components/admin/auth/ChangePasswordForm";

export default async function ChangePasswordPage() {
  const user = await requireAuth();

  return (
    <AdminShell user={user}>
      <ChangePasswordForm
        email={user.email}
        forced={user.mustChangePassword === true}
      />
    </AdminShell>
  );
}
