"use client";

import { CompanyWorkspaceProvider } from "@/components/admin/company/CompanyWorkspaceProvider";

import CompanyTheme from "@/components/admin/company/CompanyTheme";

import { CompanyLocalizationProvider } from "@/components/admin/localization/CompanyLocalizationProvider";

import {
  AdminUiPreferencesProvider,
  useAdminUiPreferences,
} from "@/components/admin/ui/AdminUiPreferencesProvider";

import { AdminI18nProvider } from "@/components/admin/i18n/AdminI18nProvider";

import { cn } from "@/utils/cn";

import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import AdminTypography from "@/components/admin/ui/AdminTypography";

/*
 * =========================================================
 * SHELL CONTENT
 * =========================================================
 */

function AdminShellContent({ user, children }) {
  const { sidebarCollapsed } = useAdminUiPreferences();

  return (
    <>
      <CompanyTheme />
      <AdminTypography />

      <div
        className="
          min-h-screen

          bg-[var(--admin-background)]

          text-[var(--admin-foreground)]
        "
      >
        <AdminSidebar />

        <div
          className={cn(
            "min-h-screen",

            "transition-[padding] duration-200 ease-out",

            sidebarCollapsed ? "lg:pl-[76px]" : "lg:pl-[272px]",
          )}
        >
          <AdminHeader user={user} />

          <main
            className="
              mx-auto

              w-full
              max-w-[1680px]

              px-4
              py-6

              sm:px-6
              sm:py-8

              xl:px-8
              xl:py-10
            "
          >
            {children}
          </main>
        </div>
      </div>
    </>
  );
}

/*
 * =========================================================
 * ROOT
 * =========================================================
 *
 * Provider dependency order:
 *
 * CompanyWorkspace
 *       ↓
 * CompanyLocalization
 *
 * AdminUiPreferences
 *       ↓
 * AdminI18n
 *
 * AdminI18n MUST be inside
 * AdminUiPreferences because locale
 * comes from the current user's
 * preferences.
 * =========================================================
 */

export default function AdminShell({ user, children }) {
  return (
    <CompanyWorkspaceProvider>
      <CompanyLocalizationProvider>
        <AdminUiPreferencesProvider user={user}>
          <AdminI18nProvider>
            <AdminShellContent user={user}>{children}</AdminShellContent>
          </AdminI18nProvider>
        </AdminUiPreferencesProvider>
      </CompanyLocalizationProvider>
    </CompanyWorkspaceProvider>
  );
}
