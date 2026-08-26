import LogoutButton from "@/components/admin/auth/LogoutButton";

export default function AdminUserMenu({ user }) {
  const displayName = user?.displayName || user?.email || "Administrator";

  const roleLabel = user?.isSuperAdmin ? "Super Administrator" : "Staff";

  const initial = displayName.trim().charAt(0).toUpperCase();

  return (
    <div
      className="
        flex
        items-center
        gap-3
      "
    >
      <div
        className="
          hidden
          text-right
          md:block
        "
      >
        <div
          className="
            max-w-44
            truncate
            text-[13px]
            font-medium
            text-[var(--admin-foreground)]
          "
        >
          {displayName}
        </div>

        <div
          className="
            mt-0.5
            text-[11px]
            text-[var(--admin-muted)]
          "
        >
          {roleLabel}
        </div>
      </div>

      <div
        className="
          flex
          h-9
          w-9
          shrink-0
          items-center
          justify-center
          rounded-full
          border
          border-[var(--admin-border)]
          bg-[var(--admin-surface)]
          text-xs
          font-semibold
          text-[var(--admin-foreground)]
        "
      >
        {initial}
      </div>

      <LogoutButton />
    </div>
  );
}
