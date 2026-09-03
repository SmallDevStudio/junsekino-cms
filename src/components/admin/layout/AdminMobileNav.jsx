"use client";

import { useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Menu, X, ExternalLink } from "lucide-react";

import { useCompanyWorkspace } from "@/components/admin/company/CompanyWorkspaceProvider";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { ADMIN_NAVIGATION } from "@/constants/admin-navigation";

import { cn } from "@/utils/cn";

function isActivePath(pathname, href) {
  if (href === "/admin/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminMobileNav() {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);

  const { t } = useAdminTranslation();

  const { activeCompany, isSuperAdmin } = useCompanyWorkspace();

  const activeRole = activeCompany?.membership?.role || null;

  const canAccessAdminItems = isSuperAdmin || activeRole === "ADMIN";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        className={cn(
          "flex h-10 w-10 items-center justify-center",

          "rounded-xl",

          "border border-[var(--admin-border)]",

          "bg-[var(--admin-surface)]",

          "text-[var(--admin-foreground)]",

          "transition",

          "hover:bg-[var(--admin-hover)]",

          "lg:hidden",
        )}
      >
        <Menu size={19} />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
          />

          <aside
            className={cn(
              "absolute inset-y-0 left-0",

              "flex w-[min(86vw,320px)] flex-col",

              "bg-[var(--admin-sidebar)]",

              "shadow-2xl",
            )}
          >
            <div
              className={cn(
                "flex h-[72px] shrink-0 items-center justify-between",

                "border-b border-[var(--admin-border)]",

                "px-5",
              )}
            >
              <Link
                href="/admin/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3"
              >
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center",

                    "rounded-xl",

                    "bg-[var(--company-primary)]",

                    "text-xs font-semibold",

                    "text-[var(--company-primary-foreground)]",
                  )}
                >
                  J
                </div>

                <div>
                  <div className="text-sm font-semibold text-[var(--admin-foreground)]">
                    Junsekino
                  </div>

                  <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--admin-muted)]">
                    CMS
                  </div>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className={cn(
                  "flex h-9 w-9 items-center justify-center",

                  "rounded-xl",

                  "text-[var(--admin-muted)]",

                  "transition",

                  "hover:bg-[var(--admin-hover)]",

                  "hover:text-[var(--admin-foreground)]",
                )}
              >
                <X size={19} />
              </button>
            </div>

            <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
              <div className="space-y-7">
                {ADMIN_NAVIGATION.map((section) => {
                  const visibleItems = section.items.filter(
                    (item) => !item.adminOnly || canAccessAdminItems,
                  );

                  if (!visibleItems.length) {
                    return null;
                  }

                  return (
                    <div key={section.id}>
                      <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--admin-muted-light)]">
                        {t(section.labelKey)}
                      </div>

                      <div className="space-y-1">
                        {visibleItems.map((item) => {
                          const Icon = item.icon;

                          const active = isActivePath(pathname, item.href);

                          return (
                            <Link
                              key={item.id}
                              href={item.href}
                              target={item.newWindow ? "_blank" : undefined}
                              rel={
                                item.newWindow
                                  ? "noopener noreferrer"
                                  : undefined
                              }
                              onClick={() => setOpen(false)}
                              className={cn(
                                "flex min-h-11 items-center gap-3",

                                "rounded-xl px-3 py-2.5",

                                "text-sm font-medium",

                                "transition-colors",

                                active
                                  ? "bg-[var(--company-primary-soft)] text-[var(--company-primary)]"
                                  : "text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-foreground)]",
                              )}
                            >
                              <Icon
                                size={18}
                                strokeWidth={1.8}
                                className="shrink-0"
                              />

                              <span className="min-w-0 flex-1">
                                {t(item.labelKey)}
                              </span>

                              {item.newWindow ? (
                                <ExternalLink
                                  size={13}
                                  aria-hidden="true"
                                  className="
                                    ml-auto
                                    shrink-0
                                    opacity-50
     "
                                />
                              ) : null}

                              {t(item.labelKey)}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </nav>
          </aside>
        </div>
      ) : null}
    </>
  );
}
