"use client";

import { AdminI18nProvider } from "@/components/admin/i18n/AdminI18nProvider";

import { AdminUiPreferencesProvider } from "@/components/admin/ui/AdminUiPreferencesProvider";

import AdminTypography from "@/components/admin/ui/AdminTypography";

export default function DocsProviders({
  user,

  children,
}) {
  return (
    <AdminUiPreferencesProvider user={user}>
      <AdminI18nProvider>
        <AdminTypography />

        {children}
      </AdminI18nProvider>
    </AdminUiPreferencesProvider>
  );
}
