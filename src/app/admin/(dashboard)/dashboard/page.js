import { requireAuth } from "@/lib/auth/guards";

export const metadata = {
  title: "Dashboard",
};

export default async function AdminDashboardPage() {
  const user = await requireAuth();

  return (
    <div>
      <div>
        <p
          className="
            text-sm
            text-neutral-500
          "
        >
          Administration
        </p>

        <h1
          className="
            mt-1
            text-3xl
            font-semibold
            tracking-tight
          "
        >
          Dashboard
        </h1>
      </div>

      <div
        className="
          mt-8
          rounded-2xl
          border
          border-neutral-200
          bg-white
          p-6
        "
      >
        <p
          className="
            text-sm
            text-neutral-500
          "
        >
          Signed in as
        </p>

        <div
          className="
            mt-2
            text-lg
            font-medium
          "
        >
          {user.displayName || user.email}
        </div>

        <div
          className="
            mt-4
            inline-flex
            rounded-full
            bg-neutral-100
            px-3
            py-1
            text-xs
            font-medium
            text-neutral-600
          "
        >
          {user.isSuperAdmin ? "SUPERADMIN" : "STAFF"}
        </div>
      </div>
    </div>
  );
}
