"use client";

import Image from "next/image";
import Link from "next/link";

import { LoaderCircle, LogOut, Settings2, UserRound, X } from "lucide-react";

import { useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { cn } from "@/utils/cn";

/*
 * =========================================================
 * USER HELPERS
 * =========================================================
 */

function getDisplayName(user) {
  return user?.displayName || user?.name || user?.email || "Administrator";
}

function getUserEmail(user) {
  return user?.email || "";
}

function getRoleLabel(user) {
  if (
    user?.isSuperAdmin ||
    user?.userType === "SUPERADMIN" ||
    user?.role === "SUPERADMIN"
  ) {
    return "Super Administrator";
  }

  return user?.role || "Staff";
}

function getUserAvatar(user) {
  return user?.avatar?.url || user?.avatarUrl || user?.image || null;
}

function getInitial(user) {
  const name = getDisplayName(user).trim();

  if (!name) {
    return "U";
  }

  return name.charAt(0).toUpperCase();
}

/*
 * =========================================================
 * AVATAR
 * =========================================================
 */

function UserAvatar({ user, size = 36 }) {
  const avatar = getUserAvatar(user);
  const initial = getInitial(user);

  return (
    <span
      className="
        relative
        flex
        shrink-0
        items-center
        justify-center
        overflow-hidden
        rounded-full
        border
        border-[var(--admin-border)]
        bg-[var(--admin-surface)]
        text-xs
        font-semibold
        text-[var(--admin-foreground)]
      "
      style={{
        width: size,
        height: size,
      }}
    >
      {avatar ? (
        <Image
          src={avatar}
          alt={getDisplayName(user)}
          fill
          unoptimized
          className="object-cover"
          sizes={`${size}px`}
        />
      ) : (
        initial
      )}
    </span>
  );
}

/*
 * =========================================================
 * MENU ITEM
 * =========================================================
 */

function MenuItem({
  href,
  icon: Icon,
  label,
  description,
  onClick,
  danger = false,
  loading = false,
}) {
  const content = (
    <>
      <span
        className={cn(
          "flex h-8 w-8 shrink-0",
          "items-center justify-center",
          "rounded-lg",
          danger ? "text-red-600" : "text-[var(--admin-muted)]",
        )}
      >
        {loading ? (
          <LoaderCircle size={16} strokeWidth={1.7} className="animate-spin" />
        ) : (
          <Icon size={16} strokeWidth={1.7} />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block text-[12px] font-medium",
            danger ? "text-red-600" : "text-[var(--admin-foreground)]",
          )}
        >
          {label}
        </span>

        {description && (
          <span
            className="
              mt-0.5
              block
              text-[10px]
              leading-[1.4]
              text-[var(--admin-muted)]
            "
          >
            {description}
          </span>
        )}
      </span>
    </>
  );

  const className = cn(
    "flex w-full items-center gap-2.5",
    "rounded-xl p-2",
    "text-left",
    "transition",
    danger ? "hover:bg-red-50" : "hover:bg-[var(--admin-hover)]",
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className={cn(className, loading && "cursor-not-allowed opacity-60")}
    >
      {content}
    </button>
  );
}

/*
 * =========================================================
 * USER MENU
 * =========================================================
 */

export default function AdminUserMenu({ user }) {
  const router = useRouter();

  const [open, setOpen] = useState(false);

  const [loggingOut, setLoggingOut] = useState(false);

  const containerRef = useRef(null);

  const displayName = getDisplayName(user);

  const email = getUserEmail(user);

  const roleLabel = getRoleLabel(user);

  /*
   * =======================================================
   * CLOSE MENU
   * =======================================================
   */

  useEffect(() => {
    function handlePointerDown(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);

      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  /*
   * =======================================================
   * LOGOUT
   * =======================================================
   *
   * Keep the existing Junsekino authentication flow.
   *
   * Do NOT use next-auth/react here.
   * =======================================================
   */

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      await fetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } catch (error) {
      console.error("Admin logout failed:", error);
    } finally {
      setOpen(false);

      router.replace("/admin/login");

      router.refresh();
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* =====================================
          AVATAR BUTTON
      ===================================== */}

      <button
        type="button"
        aria-label="User account"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="
          group
          relative
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-xl
          transition
          hover:bg-[var(--admin-hover)]
        "
      >
        <UserAvatar user={user} size={34} />

        <span
          className="
            absolute
            bottom-0.5
            right-0.5
            h-2
            w-2
            rounded-full
            border-2
            border-[var(--admin-surface)]
            bg-[var(--company-primary)]
          "
        />
      </button>

      {/* =====================================
          DROPDOWN
      ===================================== */}

      {open && (
        <div
          className="
            absolute
            right-0
            top-[calc(100%+10px)]
            z-[100]
            w-[290px]
            overflow-hidden
            rounded-2xl
            border
            border-[var(--admin-border)]
            bg-[var(--admin-surface)]
            shadow-[0_18px_55px_rgba(0,0,0,0.12)]
          "
        >
          {/* =================================
              USER INFO
          ================================= */}

          <div
            className="
              flex
              items-start
              gap-3
              border-b
              border-[var(--admin-border)]
              px-4
              py-4
            "
          >
            <UserAvatar user={user} size={42} />

            <div
              className="
                min-w-0
                flex-1
              "
            >
              <div
                className="
                  truncate
                  text-[13px]
                  font-semibold
                  text-[var(--admin-foreground)]
                "
              >
                {displayName}
              </div>

              {email && (
                <div
                  className="
                    mt-0.5
                    truncate
                    text-[10px]
                    text-[var(--admin-muted)]
                  "
                >
                  {email}
                </div>
              )}

              <div
                className="
                  mt-2
                  inline-flex
                  rounded-full
                  border
                  border-[var(--company-primary-border)]
                  bg-[var(--company-primary-soft)]
                  px-2
                  py-0.5
                  text-[8px]
                  font-semibold
                  uppercase
                  tracking-[0.08em]
                  text-[var(--company-primary)]
                "
              >
                {roleLabel}
              </div>
            </div>

            <button
              type="button"
              aria-label="Close user menu"
              onClick={() => setOpen(false)}
              className="
                flex
                h-7
                w-7
                items-center
                justify-center
                rounded-lg
                text-[var(--admin-muted-light)]
                transition
                hover:bg-[var(--admin-hover)]
                hover:text-[var(--admin-foreground)]
              "
            >
              <X size={13} strokeWidth={1.7} />
            </button>
          </div>

          {/* =================================
              ACCOUNT MENU
          ================================= */}

          <div className="p-2">
            <MenuItem
              href="/admin/profile"
              icon={UserRound}
              label="Profile"
              description="Account information and avatar"
            />

            <MenuItem
              href="/admin/preferences"
              icon={Settings2}
              label="Preferences"
              description="Personal administration settings"
            />
          </div>

          {/* =================================
              LOGOUT
          ================================= */}

          <div
            className="
              border-t
              border-[var(--admin-border)]
              p-2
            "
          >
            <MenuItem
              icon={LogOut}
              label={loggingOut ? "Logging out..." : "Logout"}
              description={
                loggingOut
                  ? "Ending your session..."
                  : "Sign out from Junsekino CMS"
              }
              danger
              loading={loggingOut}
              onClick={handleLogout}
            />
          </div>
        </div>
      )}
    </div>
  );
}
