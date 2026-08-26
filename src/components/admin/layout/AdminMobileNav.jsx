"use client";

import { useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Menu, X } from "lucide-react";

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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        className={cn(
          "flex h-10 w-10 items-center justify-center",
          "rounded-xl border border-[var(--admin-border)]",
          "bg-[var(--admin-surface)]",
          "text-[var(--admin-foreground)]",
          "transition hover:bg-[var(--admin-hover)]",
          "lg:hidden",
        )}
      >
        <Menu size={19} />
      </button>

      {open && (
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
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex min-h-11 items-center gap-3",
                              "rounded-xl px-3 py-2.5",
                              "text-sm font-medium",
                              active
                                ? "bg-[var(--company-primary-soft)] text-[var(--company-primary)]"
                                : "text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-foreground)]",
                            )}
                          >
                            <Icon size={18} strokeWidth={1.8} />

                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
