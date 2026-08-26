import {
  ArrowUpRight,
  FileText,
  FolderKanban,
  Image,
  Users,
} from "lucide-react";

import { requireAuth } from "@/lib/auth/guards";

export const metadata = {
  title: "Dashboard",
};

const stats = [
  {
    label: "Projects",
    value: "—",
    description: "Published projects",
    icon: FolderKanban,
  },
  {
    label: "Media",
    value: "—",
    description: "Media assets",
    icon: Image,
  },
  {
    label: "Content",
    value: "—",
    description: "Published content",
    icon: FileText,
  },
  {
    label: "Members",
    value: "—",
    description: "Active members",
    icon: Users,
  },
];

export default async function AdminDashboardPage() {
  const user = await requireAuth();

  return (
    <div>
      <div
        className="
          flex
          flex-col
          gap-5
          sm:flex-row
          sm:items-end
          sm:justify-between
        "
      >
        <div>
          <div
            className="
              text-xs
              font-medium
              uppercase
              tracking-[0.14em]
              text-[var(--admin-muted)]
            "
          >
            Administration
          </div>

          <h1
            className="
              mt-2
              text-3xl
              font-semibold
              tracking-[-0.035em]
              text-[var(--admin-foreground)]
              sm:text-4xl
            "
          >
            Dashboard
          </h1>

          <p
            className="
              mt-2
              max-w-2xl
              text-sm
              leading-6
              text-[var(--admin-muted)]
            "
          >
            Welcome back, {user.displayName || user.email}.
          </p>
        </div>

        <button
          type="button"
          className="
            inline-flex
            h-10
            items-center
            justify-center
            gap-2
            self-start
            rounded-xl
            bg-[var(--company-primary)]
            px-4
            text-sm
            font-medium
            text-[var(--company-primary-foreground)]
            transition
            hover:opacity-90
            sm:self-auto
          "
        >
          View website
          <ArrowUpRight size={16} />
        </button>
      </div>

      <div
        className="
          mt-8
          grid
          grid-cols-1
          gap-4
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="
                rounded-2xl
                border
                border-[var(--admin-border)]
                bg-[var(--admin-surface)]
                p-5
              "
            >
              <div
                className="
                  flex
                  items-start
                  justify-between
                  gap-4
                "
              >
                <div>
                  <div
                    className="
                      text-xs
                      font-medium
                      text-[var(--admin-muted)]
                    "
                  >
                    {item.label}
                  </div>

                  <div
                    className="
                      mt-3
                      text-3xl
                      font-semibold
                      tracking-[-0.04em]
                      text-[var(--admin-foreground)]
                    "
                  >
                    {item.value}
                  </div>
                </div>

                <div
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-xl
                    bg-[var(--company-primary-soft)]
                    text-[var(--company-primary)]
                  "
                >
                  <Icon size={18} strokeWidth={1.8} />
                </div>
              </div>

              <div
                className="
                  mt-4
                  text-xs
                  text-[var(--admin-muted)]
                "
              >
                {item.description}
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="
          mt-6
          grid
          grid-cols-1
          gap-6
          xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]
        "
      >
        <section
          className="
            min-h-[360px]
            rounded-2xl
            border
            border-[var(--admin-border)]
            bg-[var(--admin-surface)]
          "
        >
          <div
            className="
              border-b
              border-[var(--admin-border)]
              px-5
              py-4
              sm:px-6
            "
          >
            <h2
              className="
                text-sm
                font-semibold
                text-[var(--admin-foreground)]
              "
            >
              Recent activity
            </h2>

            <p
              className="
                mt-1
                text-xs
                text-[var(--admin-muted)]
              "
            >
              Latest changes across your content.
            </p>
          </div>

          <div
            className="
              flex
              min-h-[280px]
              items-center
              justify-center
              p-6
            "
          >
            <div className="text-center">
              <div
                className="
                  text-sm
                  font-medium
                  text-[var(--admin-foreground)]
                "
              >
                Activity will appear here
              </div>

              <div
                className="
                  mt-1
                  text-xs
                  text-[var(--admin-muted)]
                "
              >
                Audit log integration will be connected later.
              </div>
            </div>
          </div>
        </section>

        <section
          className="
            rounded-2xl
            border
            border-[var(--admin-border)]
            bg-[var(--admin-surface)]
          "
        >
          <div
            className="
              border-b
              border-[var(--admin-border)]
              px-5
              py-4
            "
          >
            <h2
              className="
                text-sm
                font-semibold
                text-[var(--admin-foreground)]
              "
            >
              Workspace
            </h2>

            <p
              className="
                mt-1
                text-xs
                text-[var(--admin-muted)]
              "
            >
              Current administration context.
            </p>
          </div>

          <div className="p-5">
            <div
              className="
                rounded-xl
                bg-[var(--admin-background)]
                p-4
              "
            >
              <div
                className="
                  text-[11px]
                  uppercase
                  tracking-[0.12em]
                  text-[var(--admin-muted)]
                "
              >
                Signed in as
              </div>

              <div
                className="
                  mt-2
                  break-all
                  text-sm
                  font-medium
                  text-[var(--admin-foreground)]
                "
              >
                {user.displayName || user.email}
              </div>

              <div
                className="
                  mt-3
                  inline-flex
                  rounded-full
                  border
                  border-[var(--admin-border)]
                  bg-[var(--admin-surface)]
                  px-2.5
                  py-1
                  text-[10px]
                  font-semibold
                  tracking-[0.08em]
                  text-[var(--admin-muted)]
                "
              >
                {user.isSuperAdmin ? "SUPERADMIN" : "STAFF"}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
