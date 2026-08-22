import "server-only";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login");
  }

  return user;
}

export async function requireGuest() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/admin/dashboard");
  }

  return null;
}

export async function requireSuperAdmin() {
  const user = await requireAuth();

  if (!user.isSuperAdmin) {
    redirect("/admin/dashboard");
  }

  return user;
}
