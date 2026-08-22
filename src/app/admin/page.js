import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login");
  }

  redirect("/admin/dashboard");
}
