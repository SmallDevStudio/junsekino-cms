"use client";

import { useEffect, useState } from "react";

import { createPortal } from "react-dom";

import Link from "next/link";

import { usePathname } from "next/navigation";

import { ExternalLink, Menu, X } from "lucide-react";

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

function MobileDrawer({
  pathname,

  canAccessAdminItems,

  onClose,

  t,
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;

      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="
        fixed
        inset-0
        z-[200]
        lg:hidden
      "
    >
      <button
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
        className="
          absolute
          inset-0

          bg-black/35

          backdrop-blur-[2px]
        "
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Admin navigation"
        className="
          absolute
          inset-y-0
          left-0

          flex
          h-dvh
          w-[min(86vw,320px)]
          flex-col

          overflow-hidden

          border-r
          border-[var(--admin-border)]

          bg-[var(--admin-sidebar)]

          shadow-2xl
        "
      >
        <div
          className="
            flex
            h-[72px]
            shrink-0
            items-center
            justify-between

            border-b
            border-[var(--admin-border)]

            px-5
          "
        >
          <Link
            href="/admin/dashboard"
            onClick={onClose}
            className="
              flex
              min-w-0
              items-center
              gap-3
            "
          >
            <div
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center

                rounded-xl

                bg-[var(--company-primary)]

                text-xs
                font-semibold

                text-[var(--company-primary-foreground)]
              "
            >
              J
            </div>

            <div className="min-w-0">
              <div
                className="
                  truncate

                  text-sm
                  font-semibold

                  text-[var(--admin-foreground)]
                "
              >
                Junsekino
              </div>

              <div
                className="
                  text-[10px]
                  uppercase
                  tracking-[0.16em]

                  text-[var(--admin-muted)]
                "
              >
                CMS
              </div>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center

              rounded-xl

              text-[var(--admin-muted)]

              transition

              hover:bg-[var(--admin-hover)]
              hover:text-[var(--admin-foreground)]
            "
          >
            <X size={19} />
          </button>
        </div>

        <nav
          className="
            admin-sidebar-scrollbar-hide

            min-h-0
            flex-1

            overflow-y-auto
            overscroll-contain

            px-3
            py-5

            [-webkit-overflow-scrolling:touch]
          "
        >
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
                  <div
                    className="
                      mb-2
                      px-3

                      text-[10px]
                      font-semibold
                      uppercase
                      tracking-[0.16em]

                      text-[var(--admin-muted-light)]
                    "
                  >
                    {t(section.labelKey)}
                  </div>

                  <div className="space-y-1">
                    {visibleItems.map((item) => {
                      const Icon = item.icon;

                      const active = isActivePath(
                        pathname,

                        item.href,
                      );

                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          target={item.newWindow ? "_blank" : undefined}
                          rel={
                            item.newWindow ? "noopener noreferrer" : undefined
                          }
                          onClick={onClose}
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
                            aria-hidden="true"
                            className="shrink-0"
                          />

                          <span
                            className="
                              min-w-0
                              flex-1
                              truncate
                            "
                          >
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
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </nav>

        <div
          className="
            shrink-0

            border-t
            border-[var(--admin-border)]

            px-6
            py-4
          "
        >
          <div
            className="
              text-[9px]
              uppercase
              tracking-[0.14em]

              text-[var(--admin-muted-light)]
            "
          >
            Junsekino CMS
          </div>

          <div
            className="
              mt-1

              text-[11px]

              text-[var(--admin-muted)]
            "
          >
            {t("navigation.platformAdministration")}
          </div>
        </div>
      </aside>
    </div>
  );
}

export default function AdminMobileNav() {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);

  const { t } = useAdminTranslation();

  const {
    activeCompany,

    isSuperAdmin,
  } = useCompanyWorkspace();

  const activeRole = activeCompany?.membership?.role || null;

  const canAccessAdminItems = isSuperAdmin || activeRole === "ADMIN";

  function closeNavigation() {
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        aria-expanded={open}
        className="
          flex
          h-10
          w-10
          items-center
          justify-center

          rounded-xl

          border
          border-[var(--admin-border)]

          bg-[var(--admin-surface)]

          text-[var(--admin-foreground)]

          transition

          hover:bg-[var(--admin-hover)]

          lg:hidden
        "
      >
        <Menu size={19} />
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <MobileDrawer
              pathname={pathname}
              canAccessAdminItems={canAccessAdminItems}
              onClose={closeNavigation}
              t={t}
            />,

            document.body,
          )
        : null}
    </>
  );
}
