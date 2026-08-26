import { Bell } from "lucide-react";

import CompanySwitcher from "@/components/admin/company/CompanySwitcher";

import AdminMobileNav from "./AdminMobileNav";
import AdminUserMenu from "./AdminUserMenu";

export default function AdminHeader({ user }) {
  return (
    <header className="sticky top-0 z-30 h-[72px] border-b border-[var(--admin-border)] bg-[var(--admin-surface)]/95 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6 xl:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <AdminMobileNav />

          <CompanySwitcher />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[var(--admin-muted)] transition hover:bg-[var(--admin-hover)] hover:text-[var(--admin-foreground)]"
          >
            <Bell size={18} strokeWidth={1.8} />

            <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-[var(--company-primary)]" />
          </button>

          <div className="mx-1 hidden h-6 w-px bg-[var(--admin-border)] sm:block" />

          <AdminUserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
