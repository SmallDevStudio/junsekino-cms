"use client";

import { Bell, Search } from "lucide-react";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import AdminDisplaySettings from "./AdminDisplaySettings";
import AdminMobileNav from "./AdminMobileNav";
import AdminUserMenu from "./AdminUserMenu";

/*
 * =========================================================
 * HEADER
 * =========================================================
 */

export default function AdminHeader({ user }) {
  const { t } = useAdminTranslation();

  return (
    <header
      className="
        sticky
        top-0
        z-30

        h-[72px]

        border-b
        border-[var(--admin-border)]

        bg-[var(--admin-surface)]/95

        backdrop-blur-xl
      "
    >
      <div
        className="
          flex
          h-full

          items-center
          justify-between

          gap-4

          px-4

          sm:px-6

          xl:px-8
        "
      >
        {/* =====================================
            LEFT
        ===================================== */}

        <div
          className="
            flex
            min-w-0
            flex-1

            items-center
            gap-3
          "
        >
          <AdminMobileNav />

          {/* =================================
              GLOBAL SEARCH
          ================================= */}

          <button
            type="button"
            aria-label={t("common.search")}
            title={t("common.search")}
            className="
              hidden

              h-10

              w-full
              max-w-[390px]

              items-center
              gap-2.5

              rounded-xl

              border
              border-[var(--admin-border)]

              bg-[var(--admin-background)]

              px-3

              text-left

              admin-text-12
              text-[var(--admin-muted)]

              transition

              hover:border-[var(--company-primary-border)]

              hover:bg-[var(--admin-hover)]

              md:flex
            "
          >
            <Search size={15} strokeWidth={1.7} className="shrink-0" />

            <span
              className="
                min-w-0
                flex-1
                truncate
              "
            >
              {t("header.searchPlaceholder")}
            </span>

            <span
              className="
                shrink-0

                rounded-md

                border
                border-[var(--admin-border)]

                bg-[var(--admin-surface)]

                px-1.5
                py-0.5

                admin-text-9

                text-[var(--admin-muted-light)]
              "
            >
              /
            </span>
          </button>
        </div>

        {/* =====================================
            RIGHT
        ===================================== */}

        <div
          className="
            flex
            shrink-0

            items-center
            gap-1
          "
        >
          {/* =================================
              NOTIFICATIONS
          ================================= */}

          <button
            type="button"
            aria-label={t("header.notifications")}
            title={t("header.notifications")}
            className="
              relative

              flex
              h-10
              w-10

              items-center
              justify-center

              rounded-xl

              text-[var(--admin-muted)]

              transition

              hover:bg-[var(--admin-hover)]

              hover:text-[var(--company-primary)]
            "
          >
            <Bell size={18} strokeWidth={1.7} />

            <span
              className="
                absolute
                right-2.5
                top-2.5

                h-1.5
                w-1.5

                rounded-full

                border
                border-[var(--admin-surface)]

                bg-[var(--company-primary)]
              "
            />
          </button>

          {/* =================================
              USER
          ================================= */}

          <AdminUserMenu user={user} />

          {/* =================================
              DISPLAY SETTINGS
          ================================= */}

          <AdminDisplaySettings />
        </div>
      </div>
    </header>
  );
}
