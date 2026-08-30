"use client";

import {
  Archive,
  CheckCircle2,
  Circle,
  Clock3,
  Inbox,
  LoaderCircle,
  Mail,
  RefreshCw,
  Search,
  ShieldAlert,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useSearchParams } from "next/navigation";

import { toast } from "sonner";

import { useCompanyWorkspace } from "@/components/admin/company/CompanyWorkspaceProvider";

import { FORM_SUBMISSION_STATUS } from "@/constants/form";

import MessageDetailDrawer from "./MessageDetailDrawer";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

const FILTERS = [
  {
    value: "all",
    label: "All",
  },
  {
    value: FORM_SUBMISSION_STATUS.NEW,
    label: "New",
  },
  {
    value: FORM_SUBMISSION_STATUS.READ,
    label: "Read",
  },
  {
    value: FORM_SUBMISSION_STATUS.IN_PROGRESS,
    label: "In Progress",
  },
  {
    value: FORM_SUBMISSION_STATUS.RESOLVED,
    label: "Resolved",
  },
  {
    value: FORM_SUBMISSION_STATUS.ARCHIVED,
    label: "Archived",
  },
];

/*
 * =========================================================
 * DATE
 * =========================================================
 */

function getDateValue(value) {
  if (!value) {
    return 0;
  }

  if (typeof value === "string") {
    const result = new Date(value).getTime();

    return Number.isNaN(result) ? 0 : result;
  }

  if (typeof value === "number") {
    return value;
  }

  return 0;
}

function formatDate(value) {
  const timestamp = getDateValue(value);

  if (!timestamp) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

/*
 * =========================================================
 * LOCALIZED VALUE
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

/*
 * =========================================================
 * FIELD HELPERS
 * =========================================================
 */

function findField(submission, types = [], words = []) {
  const fields = Array.isArray(submission?.fieldsSnapshot)
    ? submission.fieldsSnapshot
    : [];

  for (const field of fields) {
    if (field?.enabled === false) {
      continue;
    }

    const label = localized(field?.label).toLowerCase();

    const matchType = types.includes(field?.type);

    const matchWord = words.some((word) => label.includes(word));

    if (matchType || matchWord) {
      const value = submission?.values?.[field.id];

      if (value !== undefined && value !== null && String(value).trim()) {
        return String(value);
      }
    }
  }

  return "";
}

function getSenderName(submission) {
  return (
    findField(submission, ["text"], ["name", "surname", "ชื่อ", "นามสกุล"]) ||
    localized(submission?.formName) ||
    "Website visitor"
  );
}

function getSenderEmail(submission) {
  return findField(submission, ["email"], ["email", "e-mail", "อีเมล"]);
}

function getMessagePreview(submission) {
  return findField(
    submission,
    ["textarea"],
    ["message", "information", "detail", "ข้อความ", "รายละเอียด"],
  );
}

/*
 * =========================================================
 * STATUS ICON
 * =========================================================
 */

function StatusIcon({ status }) {
  if (status === FORM_SUBMISSION_STATUS.NEW) {
    return <Circle size={12} fill="currentColor" />;
  }

  if (status === FORM_SUBMISSION_STATUS.IN_PROGRESS) {
    return <Clock3 size={14} />;
  }

  if (status === FORM_SUBMISSION_STATUS.RESOLVED) {
    return <CheckCircle2 size={14} />;
  }

  if (status === FORM_SUBMISSION_STATUS.ARCHIVED) {
    return <Archive size={14} />;
  }

  if (status === FORM_SUBMISSION_STATUS.SPAM) {
    return <ShieldAlert size={14} />;
  }

  return <Mail size={14} />;
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

  const searchParams = useSearchParams();

  const requestedSubmissionId = searchParams.get("submission");

  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const [filter, setFilter] = useState("all");

  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState(null);

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
          `/api/v1/companies/${activeCompanyId}/form-submissions`,
          {
            method: "GET",

            cache: "no-store",

            credentials: "include",
          },
        );

        const payload = await response.json();

        if (!response.ok || payload?.success === false) {
          throw new Error(payload?.message || "Unable to retrieve messages.");
        }

        const loadedItems = Array.isArray(payload?.data) ? payload.data : [];

        /*
         * Store loaded submissions.
         */

        setItems(loadedItems);

        /*
         * Deep-link support.
         *
         * Notification Center sends:
         *
         * /admin/messages?submission=SUBMISSION_ID
         *
         * Select that submission immediately after
         * loading the inbox.
         *
         * Do not use another effect watching `items`.
         * That could repeatedly reopen the drawer when
         * the selected submission is updated.
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

        toast.error(error?.message || "Unable to retrieve messages.");
      } finally {
        setLoading(false);

        setRefreshing(false);
      }
    },
    [activeCompanyId, requestedSubmissionId],
  );

  /*
   * =======================================================
   * INITIAL LOAD
   * =======================================================
   */

  useEffect(() => {
    if (!activeCompanyId) {
      return;
    }

    /*
     * Schedule outside the effect body so React Compiler
     * does not flag synchronous state changes triggered
     * indirectly by loadItems().
     */

    const timeoutId = window.setTimeout(() => {
      loadItems();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeCompanyId, loadItems]);

  /*
   * =======================================================
   * SUMMARY
   * =======================================================
   */

  const summary = useMemo(() => {
    const result = {
      all: items.length,

      new: 0,

      inProgress: 0,

      resolved: 0,
    };

    for (const item of items) {
      if (item.status === FORM_SUBMISSION_STATUS.NEW) {
        result.new += 1;
      }

      if (item.status === FORM_SUBMISSION_STATUS.IN_PROGRESS) {
        result.inProgress += 1;
      }

      if (item.status === FORM_SUBMISSION_STATUS.RESOLVED) {
        result.resolved += 1;
      }
    }

    return result;
  }, [items]);

  /*
   * =======================================================
   * FILTER + SEARCH
   * =======================================================
   */

  const visibleItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return items.filter((item) => {
      /*
       * Status filter.
       */

      if (filter !== "all" && item.status !== filter) {
        return false;
      }

      /*
       * No search term.
       */

      if (!keyword) {
        return true;
      }

      const sender = getSenderName(item);

      const email = getSenderEmail(item);

      const message = getMessagePreview(item);

      const formName = localized(item.formName);

      return [sender, email, message, formName, item.formSlug]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [filter, items, search]);

  /*
   * =======================================================
   * OPEN MESSAGE
   * =======================================================
   */

  async function openMessage(item) {
    if (!item) {
      return;
    }

    /*
     * Open immediately.
     */

    setSelected(item);

    /*
     * Already read / processed.
     */

    if (item.status !== FORM_SUBMISSION_STATUS.NEW) {
      return;
    }

    /*
     * Mark NEW message as READ.
     *
     * Drawer opens without waiting for the API.
     */

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
            status: FORM_SUBMISSION_STATUS.READ,
          }),
        },
      );

      let payload = null;

      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok || payload?.success === false) {
        console.error("Unable to mark message as read:", payload?.message);

        return;
      }

      if (!payload?.data) {
        return;
      }

      /*
       * Update Inbox.
       */

      setItems((current) =>
        current.map((currentItem) =>
          currentItem.id === item.id ? payload.data : currentItem,
        ),
      );

      /*
       * Update Drawer.
       */

      setSelected(payload.data);
    } catch (error) {
      /*
       * Do not block opening the message if
       * marking it as read fails.
       */

      console.error("Mark message read error:", error);
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
   * CLOSE DRAWER
   * =======================================================
   */

  function handleCloseDrawer() {
    setSelected(null);
  }

  /*
   * =======================================================
   * COMPANY LOADING
   * =======================================================
   */

  if (companyLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <LoaderCircle
          size={20}
          className="animate-spin text-[var(--company-primary)]"
        />
      </div>
    );
  }

  /*
   * =======================================================
   * NO COMPANY
   * =======================================================
   */

  if (!activeCompany || !activeCompanyId) {
    return (
      <div
        className="
          flex
          min-h-[320px]
          flex-col
          items-center
          justify-center
          px-5
          text-center
        "
      >
        <Inbox
          size={28}
          strokeWidth={1.4}
          className="text-[var(--admin-muted-light)]"
        />

        <div className="mt-4 admin-text-14 font-semibold text-[var(--admin-foreground)]">
          No company selected
        </div>

        <div className="mt-1 admin-text-11 text-[var(--admin-muted)]">
          Select a workspace before viewing messages.
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
              Communication
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
              Messages
            </h1>

            <p
              className="
                mt-2
                max-w-[680px]

                admin-text-12
                leading-[1.65]

                text-[var(--admin-muted)]
              "
            >
              View and manage enquiries submitted through website forms.
            </p>
          </div>

          {/* REFRESH */}

          <button
            type="button"
            aria-label="Refresh messages"
            title="Refresh messages"
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

              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>

        {/* =================================
            SUMMARY
        ================================= */}

        <div
          className="
            mt-7
            grid
            gap-3

            sm:grid-cols-2

            xl:grid-cols-4
          "
        >
          {[
            {
              label: "All Messages",
              value: summary.all,
              icon: Inbox,
            },
            {
              label: "New",
              value: summary.new,
              icon: Circle,
            },
            {
              label: "In Progress",
              value: summary.inProgress,
              icon: Clock3,
            },
            {
              label: "Resolved",
              value: summary.resolved,
              icon: CheckCircle2,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="
                  rounded-2xl

                  border
                  border-[var(--admin-border)]

                  bg-[var(--admin-surface)]

                  p-4
                "
              >
                <div className="flex items-center justify-between">
                  <span
                    className="
                      admin-text-10
                      font-medium

                      text-[var(--admin-muted)]
                    "
                  >
                    {item.label}
                  </span>

                  <Icon size={15} className="text-[var(--company-primary)]" />
                </div>

                <div
                  className="
                    mt-3

                    admin-text-24
                    font-semibold
                    tracking-[-0.03em]

                    text-[var(--admin-foreground)]
                  "
                >
                  {item.value}
                </div>
              </div>
            );
          })}
        </div>

        {/* =================================
            TOOLBAR
        ================================= */}

        <div
          className="
            mt-6

            flex
            flex-col
            gap-3

            xl:flex-row
            xl:items-center
            xl:justify-between
          "
        >
          {/* SEARCH */}

          <div className="relative w-full xl:max-w-[420px]">
            <Search
              size={15}
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
              placeholder="Search name, email or message..."
              className="
                h-10
                w-full

                rounded-xl

                border
                border-[var(--admin-border)]

                bg-[var(--admin-surface)]

                pl-9
                pr-3

                admin-text-11

                text-[var(--admin-foreground)]

                outline-none

                transition

                placeholder:text-[var(--admin-muted-light)]

                focus:border-[var(--company-primary)]

                focus:ring-2
                focus:ring-[var(--company-primary-soft)]
              "
            />
          </div>

          {/* FILTER */}

          <div
            className="
              flex
              flex-wrap
              items-center
              gap-1

              rounded-xl

              bg-[var(--admin-hover)]

              p-1
            "
          >
            {FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={`
                  rounded-lg

                  px-3
                  py-1.5

                  admin-text-9
                  font-semibold

                  transition

                  ${
                    filter === item.value
                      ? "bg-[var(--admin-surface)] text-[var(--company-primary)] shadow-sm"
                      : "text-[var(--admin-muted)] hover:text-[var(--admin-foreground)]"
                  }
                `}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* =================================
            LIST
        ================================= */}

        <div
          className="
            mt-5

            overflow-hidden

            rounded-2xl

            border
            border-[var(--admin-border)]

            bg-[var(--admin-surface)]
          "
        >
          {/* LOADING */}

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <LoaderCircle
                size={20}
                className="animate-spin text-[var(--company-primary)]"
              />
            </div>
          ) : visibleItems.length === 0 ? (
            /* EMPTY */

            <div
              className="
                flex
                min-h-[300px]

                flex-col
                items-center
                justify-center

                px-5

                text-center
              "
            >
              <Inbox
                size={27}
                strokeWidth={1.4}
                className="text-[var(--admin-muted-light)]"
              />

              <div
                className="
                  mt-4

                  admin-text-14
                  font-semibold

                  text-[var(--admin-foreground)]
                "
              >
                No messages found
              </div>

              <div
                className="
                  mt-1

                  admin-text-11

                  text-[var(--admin-muted)]
                "
              >
                Website form submissions will appear here.
              </div>
            </div>
          ) : (
            /* ITEMS */

            <div className="divide-y divide-[var(--admin-border)]">
              {visibleItems.map((item) => {
                const sender = getSenderName(item);

                const email = getSenderEmail(item);

                const preview = getMessagePreview(item);

                const isNew = item.status === FORM_SUBMISSION_STATUS.NEW;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openMessage(item)}
                    className="
                      grid
                      w-full
                      gap-3

                      px-4
                      py-4

                      text-left

                      transition

                      hover:bg-[var(--admin-hover)]

                      sm:grid-cols-[18px_minmax(150px,0.8fr)_minmax(180px,1fr)_minmax(220px,1.5fr)_150px]
                      sm:items-center
                      sm:px-5
                    "
                  >
                    {/* STATUS */}

                    <span
                      className={
                        isNew
                          ? "text-[var(--company-primary)]"
                          : "text-[var(--admin-muted-light)]"
                      }
                    >
                      <StatusIcon status={item.status} />
                    </span>

                    {/* SENDER */}

                    <div className="min-w-0">
                      <div
                        className={`
                          truncate

                          admin-text-11

                          ${
                            isNew
                              ? "font-semibold text-[var(--admin-foreground)]"
                              : "font-medium text-[var(--admin-foreground)]"
                          }
                        `}
                      >
                        {sender}
                      </div>

                      <div
                        className="
                          mt-0.5
                          truncate

                          admin-text-9

                          text-[var(--admin-muted)]
                        "
                      >
                        {localized(item.formName) || item.formSlug}
                      </div>
                    </div>

                    {/* EMAIL */}

                    <div
                      className="
                        truncate

                        admin-text-10

                        text-[var(--admin-muted)]
                      "
                    >
                      {email || "—"}
                    </div>

                    {/* MESSAGE */}

                    <div
                      className={`
                        truncate

                        admin-text-10

                        ${
                          isNew
                            ? "font-medium text-[var(--admin-foreground)]"
                            : "text-[var(--admin-muted)]"
                        }
                      `}
                    >
                      {preview || "Form submission"}
                    </div>

                    {/* DATE */}

                    <div
                      className="
                        admin-text-9

                        text-[var(--admin-muted-light)]

                        sm:text-right
                      "
                    >
                      {formatDate(item.createdAt)}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* =================================
          MESSAGE DETAIL
      ================================= */}

      <MessageDetailDrawer
        open={Boolean(selected)}
        companyId={activeCompanyId}
        submission={selected}
        onClose={handleCloseDrawer}
        onUpdated={handleUpdated}
      />
    </>
  );
}
