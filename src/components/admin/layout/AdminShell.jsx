import { CompanyWorkspaceProvider } from "@/components/admin/company/CompanyWorkspaceProvider";

import CompanyTheme from "@/components/admin/company/CompanyTheme";

import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

export default function AdminShell({ user, children }) {
  return (
    <CompanyWorkspaceProvider>
      <CompanyTheme />

      <div className="min-h-screen bg-[var(--admin-background)] text-[var(--admin-foreground)]">
        <AdminSidebar />

        <div className="min-h-screen lg:pl-[272px]">
          <AdminHeader user={user} />

          <main className="mx-auto w-full max-w-[1680px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8 xl:py-10">
            {children}
          </main>
        </div>
      </div>
    </CompanyWorkspaceProvider>
  );
}
