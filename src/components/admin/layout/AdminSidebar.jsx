"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ADMIN_NAVIGATION } from "@/constants/admin-navigation";
import { cn } from "@/utils/cn";

function isActivePath(pathname, href) {
  if (href === "/admin/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden",
        "w-[272px] border-r border-[var(--admin-border)]",
        "bg-[var(--admin-sidebar)]",
        "lg:flex lg:flex-col",
      )}
    >
      <div
        className={cn(
          "flex h-[72px] shrink-0 items-center",
          "border-b border-[var(--admin-border)]",
          "px-6",
        )}
      >
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center",
              "rounded-xl bg-[var(--company-primary)]",
              "text-xs font-semibold",
              "text-[var(--company-primary-foreground)]",
            )}
          >
            J
          </div>

          <div>
            <div className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--admin-foreground)]">
              Junsekino
            </div>

            <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--admin-muted)]">
              Content Management
            </div>
          </div>
        </Link>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
        <div className="space-y-7">
          {ADMIN_NAVIGATION.map((section) => (
            <div key={section.id}>
              <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--admin-muted-light)]">
                {section.label}
              </div>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActivePath(pathname, item.href);

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={cn(
                        "group flex min-h-10 items-center gap-3",
                        "rounded-xl px-3 py-2",
                        "text-[13px] font-medium transition",
                        active
                          ? "bg-[var(--company-primary-soft)] text-[var(--company-primary)]"
                          : "text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-foreground)]",
                      )}
                    >
                      <Icon
                        size={17}
                        strokeWidth={1.8}
                        className={cn(
                          active
                            ? "text-[var(--company-primary)]"
                            : "text-[var(--admin-icon)] group-hover:text-[var(--admin-foreground)]",
                        )}
                      />

                      <span>{item.label}</span>

                      {active && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--company-primary)]" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t border-[var(--admin-border)] px-6 py-4">
        <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--admin-muted-light)]">
          Junsekino CMS
        </div>

        <div className="mt-1 text-xs text-[var(--admin-muted)]">
          Platform Administration
        </div>
      </div>
    </aside>
  );
}
