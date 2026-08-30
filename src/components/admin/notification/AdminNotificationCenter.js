"use client";

import { Bell, Inbox, LoaderCircle, Mail, RefreshCw } from "lucide-react";

import { useCallback, useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { useCompanyWorkspace } from "@/components/admin/company/CompanyWorkspaceProvider";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function localized(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return value.en || value.th || "";
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/*
 * =========================================================
 * CENTER
 * =========================================================
 */

export default function AdminNotificationCenter({ label = "Notifications" }) {
  const router = useRouter();

  const { activeCompanyId } = useCompanyWorkspace();

  const wrapperRef = useRef(null);

  const [open, setOpen] = useState(false);

  const [items, setItems] = useState([]);

  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(false);

  /*
   * =======================================================
   * LOAD
   * =======================================================
   */

  const loadNotifications = useCallback(async () => {
    if (!activeCompanyId) {
      setItems([]);

      setUnreadCount(0);

      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `/api/v1/companies/${activeCompanyId}/notifications?limit=20`,
        {
          method: "GET",

          cache: "no-store",

          credentials: "include",
        },
      );

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || "Unable to load notifications.");
      }

      setItems(Array.isArray(payload?.data) ? payload.data : []);

      setUnreadCount(Number(payload?.meta?.unreadCount) || 0);
    } catch (error) {
      console.error("Load notifications error:", error);
    } finally {
      setLoading(false);
    }
  }, [activeCompanyId]);

  /*
   * Initial load.
   */

  useEffect(() => {
    if (!activeCompanyId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      loadNotifications();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeCompanyId, loadNotifications]);

  /*
   * Refresh periodically.
   *
   * 60 seconds is sufficient for
   * Admin notification UX without
   * introducing realtime listeners yet.
   */

  useEffect(() => {
    if (!activeCompanyId) {
      return;
    }

    const intervalId = window.setInterval(() => {
      loadNotifications();
    }, 60000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeCompanyId, loadNotifications]);

  /*
   * Close when clicking outside.
   */

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleMouseDown(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [open]);

  /*
   * =======================================================
   * OPEN NOTIFICATION
   * =======================================================
   */

  async function handleNotificationClick(notification) {
    if (!activeCompanyId || !notification) {
      return;
    }

    /*
     * Optimistic read state.
     */

    if (notification.read !== true) {
      setItems((current) =>
        current.map((item) =>
          item.id === notification.id
            ? {
                ...item,

                read: true,
              }
            : item,
        ),
      );

      setUnreadCount((current) => Math.max(0, current - 1));

      try {
        await fetch(
          `/api/v1/companies/${activeCompanyId}/notifications/${notification.id}/read`,
          {
            method: "POST",

            credentials: "include",
          },
        );
      } catch (error) {
        console.error("Mark notification read error:", error);
      }
    }

    setOpen(false);

    /*
     * Form submission → Messages.
     */

    if (
      notification.resource?.type === "formSubmission" &&
      notification.resource?.id
    ) {
      router.push(
        `/admin/messages?submission=${encodeURIComponent(
          notification.resource.id,
        )}`,
      );

      return;
    }

    router.push("/admin/messages");
  }

  return (
    <div ref={wrapperRef} className="relative">
      {/* BELL */}

      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={() => {
          setOpen((current) => !current);

          if (!open) {
            loadNotifications();
          }
        }}
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

        {unreadCount > 0 && (
          <span
            className="
              absolute
              right-1.5
              top-1.5

              flex
              min-h-[16px]
              min-w-[16px]

              items-center
              justify-center

              rounded-full

              border-2
              border-[var(--admin-surface)]

              bg-[var(--company-primary)]

              px-1

              text-[8px]
              font-semibold
              leading-none

              text-[var(--company-primary-foreground)]
            "
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* POPOVER */}

      {open && (
        <div
          className="
            absolute
            right-0
            top-[48px]

            z-50

            w-[360px]
            max-w-[calc(100vw-24px)]

            overflow-hidden

            rounded-2xl

            border
            border-[var(--admin-border)]

            bg-[var(--admin-surface)]

            shadow-[0_20px_60px_rgba(0,0,0,0.16)]
          "
        >
          {/* HEADER */}

          <div
            className="
              flex
              items-center
              justify-between

              border-b
              border-[var(--admin-border)]

              px-4
              py-3
            "
          >
            <div>
              <div
                className="
                  admin-text-12
                  font-semibold

                  text-[var(--admin-foreground)]
                "
              >
                Notifications
              </div>

              <div
                className="
                  mt-0.5

                  admin-text-9

                  text-[var(--admin-muted)]
                "
              >
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : "You're all caught up"}
              </div>
            </div>

            <button
              type="button"
              onClick={loadNotifications}
              disabled={loading}
              className="
                flex
                h-8
                w-8

                items-center
                justify-center

                rounded-lg

                text-[var(--admin-muted)]

                transition

                hover:bg-[var(--admin-hover)]

                hover:text-[var(--company-primary)]
              "
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* LIST */}

          <div
            className="
              max-h-[430px]

              overflow-y-auto
            "
          >
            {loading && items.length === 0 ? (
              <div
                className="
                  flex
                  min-h-[180px]

                  items-center
                  justify-center
                "
              >
                <LoaderCircle
                  size={18}
                  className="
                    animate-spin

                    text-[var(--company-primary)]
                  "
                />
              </div>
            ) : items.length === 0 ? (
              <div
                className="
                  flex
                  min-h-[190px]

                  flex-col
                  items-center
                  justify-center

                  px-5

                  text-center
                "
              >
                <Inbox
                  size={22}
                  strokeWidth={1.4}
                  className="
                    text-[var(--admin-muted-light)]
                  "
                />

                <div
                  className="
                    mt-3

                    admin-text-11
                    font-medium

                    text-[var(--admin-foreground)]
                  "
                >
                  No notifications
                </div>

                <div
                  className="
                    mt-1

                    admin-text-9

                    text-[var(--admin-muted)]
                  "
                >
                  New website activity will appear here.
                </div>
              </div>
            ) : (
              <div
                className="
                  divide-y
                  divide-[var(--admin-border)]
                "
              >
                {items.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className={`
                        flex
                        w-full
                        gap-3

                        px-4
                        py-3.5

                        text-left

                        transition

                        hover:bg-[var(--admin-hover)]

                        ${
                          notification.read
                            ? "bg-[var(--admin-surface)]"
                            : "bg-[var(--company-primary-soft)]/35"
                        }
                      `}
                  >
                    <div
                      className="
                          mt-0.5

                          flex
                          h-8
                          w-8
                          shrink-0

                          items-center
                          justify-center

                          rounded-xl

                          bg-[var(--company-primary-soft)]

                          text-[var(--company-primary)]
                        "
                    >
                      <Mail size={14} />
                    </div>

                    <div
                      className="
                          min-w-0
                          flex-1
                        "
                    >
                      <div
                        className="
                            flex
                            items-start
                            gap-2
                          "
                      >
                        <div
                          className={`
                              min-w-0
                              flex-1
                              truncate

                              admin-text-10

                              text-[var(--admin-foreground)]

                              ${
                                notification.read
                                  ? "font-medium"
                                  : "font-semibold"
                              }
                            `}
                        >
                          {localized(notification.title) || "Notification"}
                        </div>

                        {!notification.read && (
                          <span
                            className="
                                mt-1.5
                                h-1.5
                                w-1.5
                                shrink-0

                                rounded-full

                                bg-[var(--company-primary)]
                              "
                          />
                        )}
                      </div>

                      <div
                        className="
                            mt-1
                            truncate

                            admin-text-9

                            text-[var(--admin-muted)]
                          "
                      >
                        {localized(notification.message)}
                      </div>

                      <div
                        className="
                            mt-1.5

                            admin-text-8

                            text-[var(--admin-muted-light)]
                          "
                      >
                        {formatDate(notification.createdAt)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* FOOTER */}

          <button
            type="button"
            onClick={() => {
              setOpen(false);

              router.push("/admin/messages");
            }}
            className="
              flex
              h-11
              w-full

              items-center
              justify-center

              border-t
              border-[var(--admin-border)]

              admin-text-9
              font-semibold
              uppercase
              tracking-[0.08em]

              text-[var(--admin-muted)]

              transition

              hover:bg-[var(--admin-hover)]

              hover:text-[var(--company-primary)]
            "
          >
            View all messages
          </button>
        </div>
      )}
    </div>
  );
}
