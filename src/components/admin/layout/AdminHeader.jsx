import { Bell, Search } from "lucide-react";

import AdminDisplaySettings from "./AdminDisplaySettings";
import AdminMobileNav from "./AdminMobileNav";
import AdminUserMenu from "./AdminUserMenu";

export default function AdminHeader({ user }) {
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

          {/* GLOBAL SEARCH PLACEHOLDER */}

          <button
            type="button"
            className="
              hidden

              h-10

              w-full
              max-w-[360px]

              items-center
              gap-2.5

              rounded-xl

              border
              border-[var(--admin-border)]

              bg-[var(--admin-background)]

              px-3

              text-left

              text-xs
              text-[var(--admin-muted)]

              transition

              hover:border-[var(--company-primary-border)]

              hover:bg-[var(--admin-hover)]

              md:flex
            "
          >
            <Search size={15} strokeWidth={1.7} />

            <span className="flex-1">Search settings, pages, content...</span>

            <span
              className="
                rounded-md

                border
                border-[var(--admin-border)]

                bg-[var(--admin-surface)]

                px-1.5
                py-0.5

                text-[9px]

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
          {/* NOTIFICATIONS */}

          <button
            type="button"
            aria-label="Notifications"
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

          {/* USER */}

          <AdminUserMenu user={user} />

          {/* DISPLAY SETTINGS */}

          <AdminDisplaySettings />
        </div>
      </div>
    </header>
  );
}
