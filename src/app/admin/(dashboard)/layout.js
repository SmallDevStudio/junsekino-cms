import { requireAuth } from "@/lib/auth/guards";

import LogoutButton from "@/components/admin/auth/LogoutButton";

export default async function AdminDashboardLayout({ children }) {
  const user = await requireAuth();

  return (
    <div
      className="
        min-h-screen
        bg-neutral-50
        text-neutral-950
      "
    >
      <header
        className="
          sticky
          top-0
          z-40
          border-b
          border-neutral-200
          bg-white/95
          backdrop-blur
        "
      >
        <div
          className="
            mx-auto
            flex
            h-16
            max-w-[1600px]
            items-center
            justify-between
            px-4
            sm:px-6
            lg:px-8
          "
        >
          <div className="flex items-center gap-4">
            <div
              className="
                text-base
                font-semibold
                tracking-tight
              "
            >
              Junsekino
            </div>

            <div
              className="
                hidden
                h-4
                w-px
                bg-neutral-200
                sm:block
              "
            />

            <div
              className="
                hidden
                text-xs
                uppercase
                tracking-[0.18em]
                text-neutral-400
                sm:block
              "
            >
              CMS
            </div>
          </div>

          <div
            className="
              flex
              items-center
              gap-4
            "
          >
            <div
              className="
                hidden
                text-right
                sm:block
              "
            >
              <div
                className="
                  text-sm
                  font-medium
                "
              >
                {user.displayName || user.email}
              </div>

              <div
                className="
                  text-xs
                  text-neutral-400
                "
              >
                {user.isSuperAdmin ? "Super Administrator" : "Staff"}
              </div>
            </div>

            <LogoutButton />
          </div>
        </div>
      </header>

      <main
        className="
          mx-auto
          max-w-[1600px]
          px-4
          py-8
          sm:px-6
          lg:px-8
        "
      >
        {children}
      </main>
    </div>
  );
}
