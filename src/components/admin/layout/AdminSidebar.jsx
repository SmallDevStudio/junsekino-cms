"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import Link from "next/link";

import { useState } from "react";

import { createPortal } from "react-dom";

import { usePathname } from "next/navigation";

import CompanySwitcher from "@/components/admin/company/CompanySwitcher";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { useAdminUiPreferences } from "@/components/admin/ui/AdminUiPreferencesProvider";

import { ADMIN_NAVIGATION } from "@/constants/admin-navigation";

import { cn } from "@/utils/cn";

import { useCompanyWorkspace } from "@/components/admin/company/CompanyWorkspaceProvider";

/*
 * =========================================================
 * ACTIVE PATH
 * =========================================================
 */

function isActivePath(pathname, href) {
  if (href === "/admin/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

/*
 * =========================================================
 * TOOLTIP POSITION
 * =========================================================
 */

function getTooltipPosition(element) {
  const rect = element.getBoundingClientRect();

  return {
    top: rect.top + rect.height / 2,

    left: rect.right + 10,
  };
}

/*
 * =========================================================
 * TOOLTIP
 * =========================================================
 *
 * React 19 / React Compiler safe.
 *
 * No ref.current access during render.
 * =========================================================
 */

function SidebarTooltip({ tooltip }) {
  if (!tooltip || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      role="tooltip"
      className="
        pointer-events-none
        fixed
        z-[9999]

        -translate-y-1/2

        whitespace-nowrap

        rounded-lg

        bg-[#18181b]

        px-2.5
        py-1.5

        admin-text-10
        font-medium
        text-white

        shadow-[0_6px_18px_rgba(0,0,0,0.16)]
      "
      style={{
        top: tooltip.top,

        left: tooltip.left,
      }}
    >
      {tooltip.label}

      <span
        className="
          absolute
          right-full
          top-1/2

          -translate-y-1/2

          border-y-[4px]
          border-r-[4px]

          border-y-transparent
          border-r-[#18181b]
        "
      />
    </div>,
    document.body,
  );
}

/*
 * =========================================================
 * COLLAPSED ITEM
 * =========================================================
 */

function CollapsedNavItem({ item, active, label }) {
  const Icon = item.icon;

  const [tooltip, setTooltip] = useState(null);

  function showTooltip(event) {
    const position = getTooltipPosition(event.currentTarget);

    setTooltip({
      ...position,
      label,
    });
  }

  function hideTooltip() {
    setTooltip(null);
  }

  return (
    <>
      <Link
        href={item.href}
        aria-label={label}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className={cn(
          "group relative",

          "flex min-h-10 items-center",

          "justify-center",

          "rounded-xl",

          "px-2 py-2",

          "transition-all duration-150",

          active
            ? "bg-[var(--company-primary-soft)]"
            : "text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-foreground)]",
        )}
        style={
          active
            ? {
                color: "var(--company-primary)",
              }
            : undefined
        }
      >
        <Icon
          size={18}
          strokeWidth={active ? 2 : 1.8}
          className={cn(
            "shrink-0",

            !active &&
              "text-[var(--admin-icon)] group-hover:text-[var(--admin-foreground)]",
          )}
          style={
            active
              ? {
                  color: "var(--company-primary)",
                }
              : undefined
          }
        />

        {active && (
          <span
            className="
              absolute
              right-1.5
              top-1/2

              h-1
              w-1

              -translate-y-1/2

              rounded-full
            "
            style={{
              backgroundColor: "var(--company-primary)",
            }}
          />
        )}
      </Link>

      <SidebarTooltip tooltip={tooltip} />
    </>
  );
}

/*
 * =========================================================
 * EXPANDED ITEM
 * =========================================================
 */

function ExpandedNavItem({ item, active, label }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-label={label}
      className={cn(
        "group relative",

        "flex min-h-10 items-center",

        "gap-3",

        "rounded-xl",

        "px-3 py-2",

        "admin-text-13 font-medium",

        "transition-all duration-150",

        active
          ? "bg-[var(--company-primary-soft)]"
          : "text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-foreground)]",
      )}
      style={
        active
          ? {
              color: "var(--company-primary)",
            }
          : undefined
      }
    >
      <Icon
        size={18}
        strokeWidth={active ? 2 : 1.8}
        className={cn(
          "shrink-0",

          !active &&
            "text-[var(--admin-icon)] group-hover:text-[var(--admin-foreground)]",
        )}
        style={
          active
            ? {
                color: "var(--company-primary)",
              }
            : undefined
        }
      />

      <span
        className={cn(
          "min-w-0 truncate",

          active && "font-semibold",
        )}
      >
        {label}
      </span>

      {active && (
        <span
          className="
            ml-auto

            h-1.5
            w-1.5

            shrink-0

            rounded-full
          "
          style={{
            backgroundColor: "var(--company-primary)",
          }}
        />
      )}
    </Link>
  );
}

/*
 * =========================================================
 * SIDEBAR TOGGLE
 * =========================================================
 */

function SidebarToggle({ collapsed, onClick, label }) {
  const [tooltip, setTooltip] = useState(null);

  function showTooltip(event) {
    const position = getTooltipPosition(event.currentTarget);

    setTooltip({
      ...position,
      label,
    });
  }

  function hideTooltip() {
    setTooltip(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        aria-label={label}
        className="
          group

          absolute
          right-[-15px]
          top-1/2
          z-[100]

          flex
          h-[30px]
          w-[30px]

          -translate-y-1/2

          items-center
          justify-center

          rounded-full

          border
          border-[var(--admin-border)]

          bg-[var(--admin-surface)]

          text-[var(--admin-muted)]

          shadow-[0_3px_12px_rgba(0,0,0,0.08)]

          transition-all
          duration-150

          hover:border-[var(--company-primary-border)]

          hover:bg-[var(--company-primary)]

          hover:text-[var(--company-primary-foreground)]

          hover:shadow-[0_5px_18px_rgba(0,0,0,0.12)]
        "
      >
        {collapsed ? (
          <PanelLeftOpen size={15} strokeWidth={1.7} />
        ) : (
          <PanelLeftClose size={15} strokeWidth={1.7} />
        )}
      </button>

      <SidebarTooltip tooltip={tooltip} />
    </>
  );
}

/*
 * =========================================================
 * SIDEBAR
 * =========================================================
 */

export default function AdminSidebar() {
  const pathname = usePathname();

  const { sidebarCollapsed, toggleSidebar } = useAdminUiPreferences();

  const { t } = useAdminTranslation();

  const { activeCompany, isSuperAdmin } = useCompanyWorkspace();

  const activeRole = activeCompany?.membership?.role || null;

  const canAccessAdminItems = isSuperAdmin || activeRole === "ADMIN";

  const toggleLabel = sidebarCollapsed
    ? t("navigation.expandSidebar")
    : t("navigation.collapseSidebar");

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden",

        "border-r border-[var(--admin-border)]",

        "bg-[var(--admin-sidebar)]",

        "transition-[width] duration-200 ease-out",

        "lg:flex lg:flex-col",

        sidebarCollapsed ? "w-[76px]" : "w-[272px]",
      )}
    >
      {/* =====================================
          COMPANY WORKSPACE
      ===================================== */}

      <div
        className={cn(
          "relative",

          "flex min-h-[72px] shrink-0 items-center",

          "border-b border-[var(--admin-border)]",

          sidebarCollapsed ? "justify-center px-2" : "px-3 pr-5",
        )}
      >
        <div
          className={cn(
            "min-w-0",

            sidebarCollapsed ? "w-auto" : "w-full",
          )}
        >
          <CompanySwitcher compact={sidebarCollapsed} />
        </div>

        <SidebarToggle
          collapsed={sidebarCollapsed}
          onClick={toggleSidebar}
          label={toggleLabel}
        />
      </div>

      {/* =====================================
          NAVIGATION
      ===================================== */}

      <nav
        className={cn(
          "admin-sidebar-scrollbar-hide",

          "min-h-0 flex-1 overflow-y-auto",

          sidebarCollapsed ? "px-2 py-4" : "px-3 py-5",
        )}
      >
        <div className={cn(sidebarCollapsed ? "space-y-4" : "space-y-7")}>
          {ADMIN_NAVIGATION.map((section) => {
            const visibleItems = section.items.filter(
              (item) => !item.adminOnly || canAccessAdminItems,
            );

            if (!visibleItems.length) {
              return null;
            }

            const sectionLabel = t(section.labelKey);

            return (
              <div key={section.id}>
                {!sidebarCollapsed ? (
                  <div className="mb-2 px-3 admin-text-10 font-semibold uppercase tracking-[0.16em] text-[var(--admin-muted-light)]">
                    {sectionLabel}
                  </div>
                ) : (
                  <div className="mx-auto mb-2 h-px w-6 bg-[var(--admin-border)]" />
                )}

                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const active = isActivePath(pathname, item.href);

                    const label = t(item.labelKey);

                    if (sidebarCollapsed) {
                      return (
                        <CollapsedNavItem
                          key={item.id}
                          item={item}
                          active={active}
                          label={label}
                        />
                      );
                    }

                    return (
                      <ExpandedNavItem
                        key={item.id}
                        item={item}
                        active={active}
                        label={label}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </nav>

      {/* =====================================
          FOOTER
      ===================================== */}

      {!sidebarCollapsed && (
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
              admin-text-9
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

              admin-text-11

              text-[var(--admin-muted)]
            "
          >
            {t("navigation.platformAdministration")}
          </div>
        </div>
      )}
    </aside>
  );
}
