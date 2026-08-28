"use client";

import { CompanyWorkspaceProvider } from "@/components/admin/company/CompanyWorkspaceProvider";

import CompanyTheme from "@/components/admin/company/CompanyTheme";

import { CompanyLocalizationProvider } from "@/components/admin/localization/CompanyLocalizationProvider";

import {
  AdminUiPreferencesProvider,
  useAdminUiPreferences,
} from "@/components/admin/ui/AdminUiPreferencesProvider";

import { cn } from "@/utils/cn";

import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

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
 * Provider responsibilities:
 *
 * CompanyWorkspaceProvider
 *   - active company
 *   - company switcher
 *
 * CompanyLocalizationProvider
 *   - public content languages
 *   - EN / TH availability
 *
 * AdminUiPreferencesProvider
 *   - admin interface language
 *   - sidebar
 *   - density
 *   - tooltips
 *
 * These are intentionally separate.
 * =========================================================
 */

export default function AdminShell({ user, children }) {
  return (
    <CompanyWorkspaceProvider>
      <CompanyLocalizationProvider>
        <AdminUiPreferencesProvider user={user}>
          <AdminShellContent user={user}>{children}</AdminShellContent>
        </AdminUiPreferencesProvider>
      </CompanyLocalizationProvider>
    </CompanyWorkspaceProvider>
  );
}
