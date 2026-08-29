"use client";

import Image from "next/image";
import Link from "next/link";

import {
  Check,
  Languages,
  LoaderCircle,
  LogOut,
  Settings2,
  UserRound,
  X,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { ADMIN_LOCALE } from "@/constants/admin-ui";

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

function getRole(user) {
  if (
    user?.isSuperAdmin ||
    user?.userType === "SUPERADMIN" ||
    user?.role === "SUPERADMIN"
  ) {
    return "SUPERADMIN";
  }

  return user?.role || "STAFF";
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

        admin-text-12
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
            "block",

            "admin-text-12 font-medium",

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

              admin-text-10
              leading-[1.5]

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
      className={cn(
        className,

        loading && "cursor-not-allowed opacity-60",
      )}
    >
      {content}
    </button>
  );
}

/*
 * =========================================================
 * LANGUAGE OPTION
 * =========================================================
 */

function LanguageOption({ active, code, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-9 w-full items-center",

        "gap-2.5",

        "rounded-lg",

        "px-2.5 py-1.5",

        "text-left",

        "transition",

        active
          ? "bg-[var(--company-primary-soft)]"
          : "hover:bg-[var(--admin-hover)]",
      )}
    >
      <span
        className={cn(
          "flex h-6 w-8 shrink-0",

          "items-center justify-center",

          "rounded-md",

          "border",

          "admin-text-9 font-semibold uppercase",

          active
            ? "border-[var(--company-primary-border)] text-[var(--company-primary)]"
            : "border-[var(--admin-border)] text-[var(--admin-muted)]",
        )}
      >
        {code}
      </span>

      <span
        className={cn(
          "min-w-0 flex-1",

          "admin-text-11 font-medium",

          active
            ? "text-[var(--company-primary)]"
            : "text-[var(--admin-foreground)]",
        )}
      >
        {label}
      </span>

      {active && (
        <Check
          size={14}
          strokeWidth={2}
          className="
            shrink-0

            text-[var(--company-primary)]
          "
        />
      )}
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

  const { t, locale, setLocale } = useAdminTranslation();

  const [open, setOpen] = useState(false);

  const [languageOpen, setLanguageOpen] = useState(false);

  const [loggingOut, setLoggingOut] = useState(false);

  const containerRef = useRef(null);

  const displayName = getDisplayName(user);

  const email = getUserEmail(user);

  const role = getRole(user);

  /*
   * =======================================================
   * ROLE LABEL
   * =======================================================
   */

  const roleLabel =
    role === "SUPERADMIN"
      ? t("user.roles.superAdministrator")
      : role === "ADMIN"
        ? t("user.roles.administrator")
        : role === "EDITOR"
          ? t("user.roles.editor")
          : t("user.roles.staff");

  /*
   * =======================================================
   * CLOSE
   * =======================================================
   */

  useEffect(() => {
    function handlePointerDown(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
        setLanguageOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
        setLanguageOpen(false);
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
   * LANGUAGE
   * =======================================================
   */

  function handleLanguageChange(nextLocale) {
    if (nextLocale === locale) {
      return;
    }

    setLocale(nextLocale);
  }

  /*
   * =======================================================
   * LOGOUT
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

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <div ref={containerRef} className="relative">
      {/* =====================================
          AVATAR BUTTON
      ===================================== */}

      <button
        type="button"
        aria-label={t("user.account")}
        title={t("user.account")}
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

            w-[310px]
            max-w-[calc(100vw-24px)]

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

            <div className="min-w-0 flex-1">
              <div
                className="
                  truncate

                  admin-text-13
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

                    admin-text-10

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

                  admin-text-8
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
              aria-label={t("common.close")}
              title={t("common.close")}
              onClick={() => {
                setOpen(false);

                setLanguageOpen(false);
              }}
              className="
                flex
                h-7
                w-7

                shrink-0

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
              ACCOUNT
          ================================= */}

          <div className="p-2">
            <MenuItem
              href="/admin/profile"
              icon={UserRound}
              label={t("header.profile")}
              description={t("user.profileDescription")}
            />

            <MenuItem
              href="/admin/preferences"
              icon={Settings2}
              label={t("header.preferences")}
              description={t("user.preferencesDescription")}
            />
          </div>

          {/* =================================
              LANGUAGE
          ================================= */}

          <div
            className="
              border-t
              border-[var(--admin-border)]

              p-2
            "
          >
            <button
              type="button"
              aria-expanded={languageOpen}
              onClick={() => setLanguageOpen((current) => !current)}
              className="
                flex
                w-full

                items-center
                gap-2.5

                rounded-xl

                p-2

                text-left

                transition

                hover:bg-[var(--admin-hover)]
              "
            >
              <span
                className="
                  flex
                  h-8
                  w-8
                  shrink-0

                  items-center
                  justify-center

                  rounded-lg

                  text-[var(--admin-muted)]
                "
              >
                <Languages size={16} strokeWidth={1.7} />
              </span>

              <span className="min-w-0 flex-1">
                <span
                  className="
                    block

                    admin-text-12
                    font-medium

                    text-[var(--admin-foreground)]
                  "
                >
                  {t("preferences.language.title")}
                </span>

                <span
                  className="
                    mt-0.5
                    block

                    admin-text-10

                    text-[var(--admin-muted)]
                  "
                >
                  {locale === ADMIN_LOCALE.TH
                    ? t("preferences.language.thai")
                    : t("preferences.language.english")}
                </span>
              </span>

              <span
                className="
                  rounded-md

                  border
                  border-[var(--company-primary-border)]

                  bg-[var(--company-primary-soft)]

                  px-1.5
                  py-0.5

                  admin-text-8
                  font-semibold
                  uppercase

                  text-[var(--company-primary)]
                "
              >
                {locale}
              </span>
            </button>

            {languageOpen && (
              <div
                className="
                  mt-1
                  space-y-1

                  rounded-xl

                  bg-[var(--admin-background)]

                  p-1.5
                "
              >
                <LanguageOption
                  code="EN"
                  label={t("preferences.language.english")}
                  active={locale === ADMIN_LOCALE.EN}
                  onClick={() => handleLanguageChange(ADMIN_LOCALE.EN)}
                />

                <LanguageOption
                  code="TH"
                  label={t("preferences.language.thai")}
                  active={locale === ADMIN_LOCALE.TH}
                  onClick={() => handleLanguageChange(ADMIN_LOCALE.TH)}
                />
              </div>
            )}
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
              label={loggingOut ? t("user.loggingOut") : t("header.logout")}
              description={
                loggingOut
                  ? t("user.loggingOutDescription")
                  : t("user.logoutDescription")
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
