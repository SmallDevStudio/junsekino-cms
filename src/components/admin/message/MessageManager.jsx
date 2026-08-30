"use client";

import {
  Archive,
  CheckCircle2,
  Clock3,
  Inbox,
  LoaderCircle,
  MailOpen,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useSearchParams } from "next/navigation";

import { toast } from "sonner";

import { useCompanyWorkspace } from "@/components/admin/company/CompanyWorkspaceProvider";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { FORM_SUBMISSION_STATUS } from "@/constants/form";

import { cn } from "@/utils/cn";

import MessageDetailDrawer from "./MessageDetailDrawer";
import MessageReaderAvatars from "./MessageReaderAvatars";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function localized(value, locale) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (locale === "th") {
    return value.th || value.en || "";
  }

  return value.en || value.th || "";
}

function getDateValue(value) {
  if (!value) {
    return 0;
  }

  if (typeof value === "number") {
    return value;
  }

  const result = new Date(value).getTime();

  return Number.isNaN(result) ? 0 : result;
}

function formatDate(value, locale) {
  const timestamp = getDateValue(value);

  if (!timestamp) {
    return "—";
  }

  const date = new Date(timestamp);

  const now = new Date();

  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
      hour: "2-digit",

      minute: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    day: "2-digit",

    month: "short",

    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  }).format(date);
}

function findField(submission, types = [], words = [], locale = "en") {
  const fields = Array.isArray(submission?.fieldsSnapshot)
    ? submission.fieldsSnapshot
    : [];

  for (const field of fields) {
    if (field?.enabled === false) {
      continue;
    }

    const label = localized(field?.label, locale).toLowerCase();

    const matchType = types.includes(field?.type);

    const matchWord = words.some((word) => label.includes(word));

    if (!matchType && !matchWord) {
      continue;
    }

    const value = submission?.values?.[field.id];

    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value);
    }
  }

  return "";
}

function getSenderName(submission, locale) {
  return (
    findField(
      submission,

      ["text"],

      ["name", "surname", "ชื่อ", "นามสกุล"],

      locale,
    ) ||
    localized(submission?.formName, locale) ||
    "Website visitor"
  );
}

function getSenderEmail(submission, locale) {
  return findField(
    submission,

    ["email"],

    ["email", "e-mail", "อีเมล"],

    locale,
  );
}

function getMessagePreview(submission, locale) {
  return findField(
    submission,

    ["textarea"],

    ["message", "information", "detail", "ข้อความ", "รายละเอียด"],

    locale,
  );
}

/*
 * =========================================================
 * MANAGER
 * =========================================================
 */

export default function MessageManager() {
  const {
    activeCompany,
    activeCompanyId,
    loading: companyLoading,
  } = useCompanyWorkspace();

  const { t, locale } = useAdminTranslation();

  const searchParams = useSearchParams();

  const requestedSubmissionId = searchParams.get("submission");

  const [folder, setFolder] = useState("inbox");

  const [view, setView] = useState("all");

  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState(null);

  const [actingId, setActingId] = useState(null);

  /*
   * =======================================================
   * QUERY
   * =======================================================
   */

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    params.set("folder", folder);

    if (folder === "inbox") {
      if (view === "unread") {
        params.set("unread", "1");
      }

      if (view === "in_progress") {
        params.set("status", FORM_SUBMISSION_STATUS.IN_PROGRESS);
      }

      if (view === "resolved") {
        params.set("status", FORM_SUBMISSION_STATUS.RESOLVED);
      }

      if (view === "archived") {
        params.set("status", FORM_SUBMISSION_STATUS.ARCHIVED);
      }
    }

    return params.toString();
  }, [folder, view]);

  /*
   * =======================================================
   * LOAD
   * =======================================================
   */

  const loadItems = useCallback(
    async ({ silent = false } = {}) => {
      if (!activeCompanyId) {
        return;
      }

      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await fetch(
          `/api/v1/companies/${activeCompanyId}/form-submissions?${queryString}`,
          {
            method: "GET",

            cache: "no-store",

            credentials: "include",
          },
        );

        let payload = null;

        try {
          payload = await response.json();
        } catch {
          payload = null;
        }

        if (!response.ok || payload?.success === false) {
          throw new Error(
            payload?.message || t("messages.errors.loadFailed"),
          );
        }

        const loadedItems = Array.isArray(payload?.data) ? payload.data : [];

        setItems(loadedItems);

        /*
         * Notification deep-link.
         */

        if (requestedSubmissionId) {
          const requested = loadedItems.find(
            (item) => item.id === requestedSubmissionId,
          );

          if (requested) {
            setSelected(requested);
          }
        }
      } catch (error) {
        console.error("Load messages error:", error);

        toast.error(error?.message || t("messages.errors.loadFailed"));
      } finally {
        setLoading(false);

        setRefreshing(false);
      }
    },
    [activeCompanyId, queryString, requestedSubmissionId, setSelected, t],
  );

  useEffect(() => {
    if (!activeCompanyId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      loadItems();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeCompanyId, loadItems]);

  /*
   * =======================================================
   * SEARCH
   * =======================================================
   */

  const visibleItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return items;
    }

    return items.filter((item) => {
      const sender = getSenderName(item, locale);

      const email = getSenderEmail(item, locale);

      const message = getMessagePreview(item, locale);

      const formName = localized(item.formName, locale);

      return [sender, email, message, formName, item.formSlug]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [items, locale, search]);

  /*
   * =======================================================
   * MARK READ
   * =======================================================
   */

  async function markRead(item) {
    if (!item?.id || item.readByCurrentUser) {
      return item;
    }

    try {
      const response = await fetch(
        `/api/v1/companies/${activeCompanyId}/form-submissions/${item.id}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            action: "mark_read",
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        return item;
      }

      setItems((current) =>
        current.map((currentItem) =>
          currentItem.id === item.id ? payload.data : currentItem,
        ),
      );

      return payload.data;
    } catch (error) {
      console.error("Mark message read error:", error);

      return item;
    }
  }

  /*
   * =======================================================
   * SINGLE CLICK
   * =======================================================
   */

  async function openMessage(item) {
    setSelected(item);

    const updated = await markRead(item);

    setSelected(updated);
  }

  /*
   * =======================================================
   * DOUBLE CLICK
   * =======================================================
   */

  function openMessageWindow(item) {
    if (!item?.id) {
      return;
    }

    window.open(
      `/admin/messages/${encodeURIComponent(item.id)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  /*
   * =======================================================
   * TRASH
   * =======================================================
   */

  async function moveToTrash(item) {
    if (!item?.id || actingId) {
      return;
    }

    try {
      setActingId(item.id);

      const response = await fetch(
        `/api/v1/companies/${activeCompanyId}/form-submissions/${item.id}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            action: "trash",
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || t("messages.errors.trashFailed"));
      }

      setItems((current) =>
        current.filter((currentItem) => currentItem.id !== item.id),
      );

      if (selected?.id === item.id) {
        setSelected(null);
      }

      toast.success(t("messages.messages.movedToTrash"));
    } catch (error) {
      console.error("Move message to trash error:", error);

      toast.error(error?.message || t("messages.errors.trashFailed"));
    } finally {
      setActingId(null);
    }
  }

  /*
   * =======================================================
   * RESTORE
   * =======================================================
   */

  async function restoreMessage(item) {
    if (!item?.id || actingId) {
      return;
    }

    try {
      setActingId(item.id);

      const response = await fetch(
        `/api/v1/companies/${activeCompanyId}/form-submissions/${item.id}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            action: "restore",
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.message || t("messages.errors.restoreFailed"),
        );
      }

      setItems((current) =>
        current.filter((currentItem) => currentItem.id !== item.id),
      );

      toast.success(t("messages.messages.restored"));
    } catch (error) {
      console.error("Restore message error:", error);

      toast.error(error?.message || t("messages.errors.restoreFailed"));
    } finally {
      setActingId(null);
    }
  }

  /*
   * =======================================================
   * UPDATED FROM DRAWER
   * =======================================================
   */

  function handleUpdated(updated) {
    if (!updated?.id) {
      return;
    }

    setItems((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );

    setSelected(updated);
  }

  /*
   * =======================================================
   * NAV ITEMS
   * =======================================================
   */

  const navigation = [
    {
      id: "all",

      label: t("messages.folders.inbox"),

      icon: Inbox,
    },

    {
      id: "unread",

      label: t("messages.folders.unread"),

      icon: MailOpen,
    },

    {
      id: "in_progress",

      label: t("messages.folders.in_progress"),

      icon: Clock3,
    },

    {
      id: "resolved",

      label: t("messages.folders.resolved"),

      icon: CheckCircle2,
    },

    {
      id: "archived",

      label: t("messages.folders.archived"),

      icon: Archive,
    },
  ];

  /*
   * =======================================================
   * LOADING COMPANY
   * =======================================================
   */

  if (companyLoading) {
    return (
      <div
        className="
          flex
          min-h-[320px]

          items-center
          justify-center
        "
      >
        <LoaderCircle
          size={20}
          className="
            animate-spin

            text-[var(--company-primary)]
          "
        />
      </div>
    );
  }

  if (!activeCompany || !activeCompanyId) {
    return (
      <div
        className="
          flex
          min-h-[320px]

          flex-col
          items-center
          justify-center

          text-center
        "
      >
        <Inbox
          size={28}
          strokeWidth={1.4}
          className="
            text-[var(--admin-muted-light)]
          "
        />

        <div
          className="
            mt-4

            admin-text-14
            font-semibold

            text-[var(--admin-foreground)]
          "
        >
          {t("messages.noCompany.title")}
        </div>

        <div
          className="
            mt-1

            admin-text-11

            text-[var(--admin-muted)]
          "
        >
          {t("messages.noCompany.description")}
        </div>
      </div>
    );
  }

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <>
      <div>
        {/* =================================
            HEADER
        ================================= */}

        <div
          className="
            flex
            flex-col
            gap-4

            sm:flex-row
            sm:items-end
            sm:justify-between
          "
        >
          <div>
            <div
              className="
                admin-text-10
                font-semibold
                uppercase
                tracking-[0.14em]

                text-[var(--company-primary)]
              "
            >
              {t("messages.sectionLabel")}
            </div>

            <h1
              className="
                mt-2

                admin-text-28
                font-semibold
                tracking-[-0.03em]

                text-[var(--admin-foreground)]
              "
            >
              {t("messages.title")}
            </h1>

            <p
              className="
                mt-2
                max-w-[720px]

                admin-text-12
                leading-[1.65]

                text-[var(--admin-muted)]
              "
            >
              {t("messages.description")}
            </p>
          </div>

          <button
            type="button"
            aria-label={t("common.refresh")}
            title={t("common.refresh")}
            onClick={() =>
              loadItems({
                silent: true,
              })
            }
            disabled={refreshing}
            className="
              flex
              h-10
              w-10

              items-center
              justify-center

              rounded-xl

              border
              border-[var(--admin-border)]

              text-[var(--admin-muted)]

              transition

              hover:border-[var(--company-primary-border)]

              hover:bg-[var(--admin-hover)]

              hover:text-[var(--company-primary)]

              disabled:opacity-50
            "
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>

        {/* =================================
            MAIL CLIENT
        ================================= */}

        <div
          className="
            mt-7

            grid

            min-h-[620px]

            overflow-hidden

            rounded-2xl

            border
            border-[var(--admin-border)]

            bg-[var(--admin-surface)]

            lg:grid-cols-[210px_minmax(0,1fr)]
          "
        >
          {/* =============================
              LEFT FOLDERS
          ============================= */}

          <aside
            className="
              border-b
              border-[var(--admin-border)]

              bg-[var(--admin-background)]

              p-3

              lg:border-b-0
              lg:border-r
            "
          >
            <div
              className="
                flex
                gap-1

                overflow-x-auto

                lg:block
                lg:space-y-1
              "
            >
              {navigation.map((item) => {
                const Icon = item.icon;

                const active = folder === "inbox" && view === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setFolder("inbox");

                      setView(item.id);
                    }}
                    className={cn(
                      "flex shrink-0 items-center gap-3",

                      "rounded-xl",

                      "px-3 py-2.5",

                      "admin-text-10 font-medium",

                      "transition",

                      "lg:w-full",

                      active
                        ? "bg-[var(--company-primary-soft)] text-[var(--company-primary)]"
                        : "text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-foreground)]",
                    )}
                  >
                    <Icon size={14} />

                    <span>{item.label}</span>
                  </button>
                );
              })}

              <div
                className="
                  hidden

                  my-2

                  border-t
                  border-[var(--admin-border)]

                  lg:block
                "
              />

              <button
                type="button"
                onClick={() => {
                  setFolder("trash");

                  setView("all");
                }}
                className={cn(
                  "flex shrink-0 items-center gap-3",

                  "rounded-xl",

                  "px-3 py-2.5",

                  "admin-text-10 font-medium",

                  "transition",

                  "lg:w-full",

                  folder === "trash"
                    ? "bg-red-50 text-red-600"
                    : "text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-red-500",
                )}
              >
                <Trash2 size={14} />

                <span>{t("messages.folders.trash")}</span>
              </button>
            </div>
          </aside>

          {/* =============================
              RIGHT CONTENT
          ============================= */}

          <section className="min-w-0">
            {/* TOOLBAR */}

            <div
              className="
                flex
                flex-col
                gap-3

                border-b
                border-[var(--admin-border)]

                px-4
                py-3

                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <div
                className="
                  relative

                  w-full

                  sm:max-w-[420px]
                "
              >
                <Search
                  size={14}
                  className="
                    pointer-events-none

                    absolute
                    left-3
                    top-1/2

                    -translate-y-1/2

                    text-[var(--admin-muted-light)]
                  "
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t("messages.searchPlaceholder")}
                  className="
                    h-10
                    w-full

                    rounded-xl

                    border
                    border-[var(--admin-border)]

                    bg-[var(--admin-background)]

                    pl-9
                    pr-3

                    admin-text-10

                    text-[var(--admin-foreground)]

                    outline-none

                    placeholder:text-[var(--admin-muted-light)]

                    focus:border-[var(--company-primary)]

                    focus:ring-2
                    focus:ring-[var(--company-primary-soft)]
                  "
                />
              </div>

              <div
                className="
                  admin-text-9

                  text-[var(--admin-muted)]
                "
              >
                {t("messages.resultCount", {
                  count: visibleItems.length,
                })}
              </div>
            </div>

            {/* MESSAGE LIST */}

            {loading ? (
              <div
                className="
                  flex
                  min-h-[480px]

                  items-center
                  justify-center
                "
              >
                <LoaderCircle
                  size={20}
                  className="
                    animate-spin

                    text-[var(--company-primary)]
                  "
                />
              </div>
            ) : visibleItems.length === 0 ? (
              <div
                className="
                  flex
                  min-h-[480px]

                  flex-col
                  items-center
                  justify-center

                  px-5

                  text-center
                "
              >
                {folder === "trash" ? (
                  <Trash2
                    size={27}
                    strokeWidth={1.4}
                    className="
                      text-[var(--admin-muted-light)]
                    "
                  />
                ) : (
                  <Inbox
                    size={27}
                    strokeWidth={1.4}
                    className="
                      text-[var(--admin-muted-light)]
                    "
                  />
                )}

                <div
                  className="
                    mt-4

                    admin-text-13
                    font-semibold

                    text-[var(--admin-foreground)]
                  "
                >
                  {folder === "trash"
                    ? t("messages.empty.trashTitle")
                    : t("messages.empty.title")}
                </div>

                <div
                  className="
                    mt-1

                    admin-text-10

                    text-[var(--admin-muted)]
                  "
                >
                  {folder === "trash"
                    ? t("messages.empty.trashDescription")
                    : t("messages.empty.description")}
                </div>
              </div>
            ) : (
              <div>
                {visibleItems.map((item) => {
                  const sender = getSenderName(item, locale);

                  const email = getSenderEmail(item, locale);

                  const preview = getMessagePreview(item, locale);

                  const unread = item.readByCurrentUser !== true;

                  const acting = actingId === item.id;

                  return (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openMessage(item)}
                      onDoubleClick={() => openMessageWindow(item)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          openMessage(item);
                        }
                      }}
                      className={cn(
                        "group",

                        "grid",

                        "cursor-pointer",

                        "gap-3",

                        "border-b border-[var(--admin-border)]",

                        "px-4 py-3.5",

                        "transition",

                        "last:border-b-0",

                        "hover:bg-[var(--admin-hover)]",

                        "md:grid-cols-[8px_minmax(145px,0.8fr)_minmax(240px,1.8fr)_auto_auto]",

                        "md:items-center",

                        unread
                          ? "bg-[var(--company-primary-soft)]/20"
                          : "bg-[var(--admin-surface)]",
                      )}
                    >
                      {/* UNREAD DOT */}

                      <div>
                        <span
                          className={cn(
                            "block",

                            "h-2 w-2",

                            "rounded-full",

                            unread
                              ? "bg-[var(--company-primary)]"
                              : "bg-transparent",
                          )}
                        />
                      </div>

                      {/* SENDER */}

                      <div className="min-w-0">
                        <div
                          className={cn(
                            "truncate",

                            "admin-text-10",

                            unread
                              ? "font-semibold text-[var(--admin-foreground)]"
                              : "font-medium text-[var(--admin-foreground)]",
                          )}
                        >
                          {sender}
                        </div>

                        <div
                          className="
                              mt-0.5
                              truncate

                              admin-text-8

                              text-[var(--admin-muted)]
                            "
                        >
                          {email ||
                            localized(item.formName, locale) ||
                            item.formSlug}
                        </div>
                      </div>

                      {/* SUBJECT + PREVIEW */}

                      <div className="min-w-0">
                        <div
                          className={cn(
                            "truncate",

                            "admin-text-10",

                            unread
                              ? "font-semibold text-[var(--admin-foreground)]"
                              : "font-medium text-[var(--admin-foreground)]",
                          )}
                        >
                          {localized(item.formName, locale) ||
                            t("messages.fallbackSubject")}
                        </div>

                        <div
                          className="
                              mt-0.5
                              truncate

                              admin-text-9

                              text-[var(--admin-muted)]
                            "
                        >
                          {preview || t("messages.fallbackPreview")}
                        </div>
                      </div>

                      {/* READERS */}

                      <div onClick={(event) => event.stopPropagation()}>
                        <MessageReaderAvatars
                          readBy={item.readBy}
                          max={3}
                          compact
                        />
                      </div>

                      {/* DATE + ACTION */}

                      <div
                        className="
                            flex
                            items-center
                            justify-end
                            gap-1
                          "
                      >
                        <span
                          className="
                              whitespace-nowrap

                              admin-text-8

                              text-[var(--admin-muted-light)]
                            "
                        >
                          {formatDate(item.createdAt, locale)}
                        </span>

                        {folder === "trash" ? (
                          <button
                            type="button"
                            title={t("messages.actions.restore")}
                            disabled={acting}
                            onClick={(event) => {
                              event.stopPropagation();

                              restoreMessage(item);
                            }}
                            className="
                                ml-1

                                flex
                                h-8
                                w-8

                                items-center
                                justify-center

                                rounded-lg

                                text-[var(--admin-muted-light)]

                                opacity-0

                                transition

                                group-hover:opacity-100

                                hover:bg-[var(--admin-surface)]

                                hover:text-[var(--company-primary)]

                                disabled:opacity-30
                              "
                          >
                            {acting ? (
                              <LoaderCircle
                                size={13}
                                className="animate-spin"
                              />
                            ) : (
                              <RotateCcw size={13} />
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            title={t("messages.actions.trash")}
                            disabled={acting}
                            onClick={(event) => {
                              event.stopPropagation();

                              moveToTrash(item);
                            }}
                            className="
                                ml-1

                                flex
                                h-8
                                w-8

                                items-center
                                justify-center

                                rounded-lg

                                text-[var(--admin-muted-light)]

                                opacity-0

                                transition

                                group-hover:opacity-100

                                hover:bg-red-50

                                hover:text-red-500

                                disabled:opacity-30
                              "
                          >
                            {acting ? (
                              <LoaderCircle
                                size={13}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2 size={13} />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* =================================
          EXISTING DRAWER
      ================================= */}

      <MessageDetailDrawer
        open={Boolean(selected)}
        companyId={activeCompanyId}
        submission={selected}
        onClose={() => setSelected(null)}
        onUpdated={handleUpdated}
      />
    </>
  );
}
