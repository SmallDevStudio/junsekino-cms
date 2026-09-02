"use client";

import {
  Activity,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Eye,
  FileText,
  Heart,
  LoaderCircle,
  Mail,
  RefreshCw,
  Share2,
  Sparkles,
  Users,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useCompanyWorkspace } from "@/components/admin/company/CompanyWorkspaceProvider";

const RANGE_OPTIONS = [
  {
    value: "today",
    label: "Today",
  },
  {
    value: "7d",
    label: "7 days",
  },
  {
    value: "30d",
    label: "30 days",
  },
  {
    value: "month",
    label: "This month",
  },
];

const EMPTY_DATA = {
  period: {
    from: null,
    to: null,
  },

  overview: {
    views: 0,
    uniqueVisitors: 0,
    likes: 0,
    shares: 0,
    submissions: 0,
    newSubmissions: 0,
    notifications: 0,
  },

  chart: [],

  forms: {
    contact: 0,
    survey: 0,
    career: 0,
    custom: 0,
  },

  topContent: [],

  recentActivity: [],
};

const CARD_STYLES = {
  blue: {
    panel: "border-blue-500/20 bg-blue-500/[0.08]",
    icon: "bg-blue-500 text-white shadow-blue-500/25",
    accent: "text-blue-600 dark:text-blue-400",
  },

  violet: {
    panel: "border-violet-500/20 bg-violet-500/[0.08]",
    icon: "bg-violet-500 text-white shadow-violet-500/25",
    accent: "text-violet-600 dark:text-violet-400",
  },

  rose: {
    panel: "border-rose-500/20 bg-rose-500/[0.08]",
    icon: "bg-rose-500 text-white shadow-rose-500/25",
    accent: "text-rose-600 dark:text-rose-400",
  },

  emerald: {
    panel: "border-emerald-500/20 bg-emerald-500/[0.08]",
    icon: "bg-emerald-500 text-white shadow-emerald-500/25",
    accent: "text-emerald-600 dark:text-emerald-400",
  },

  amber: {
    panel: "border-amber-500/20 bg-amber-500/[0.08]",
    icon: "bg-amber-500 text-white shadow-amber-500/25",
    accent: "text-amber-600 dark:text-amber-400",
  },

  company: {
    panel: "border-[var(--company-primary)] bg-[var(--company-primary-soft)]",

    icon: "bg-[var(--company-primary)] text-[var(--company-primary-foreground)] shadow-lg",

    accent: "text-[var(--company-primary)]",
  },
};

function formatNumber(value) {
  return new Intl.NumberFormat("en-US", {
    notation: Number(value) >= 10000 ? "compact" : "standard",

    maximumFractionDigits: 1,
  }).format(Number(value) || 0);
}

function formatDate(
  value,

  options = {},
) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const {
    year = true,

    ...dateOptions
  } = options;

  const formatOptions = {
    timeZone: "Asia/Bangkok",

    day: "2-digit",

    month: "short",

    ...dateOptions,
  };

  if (year !== false) {
    formatOptions.year = "numeric";
  }

  return new Intl.DateTimeFormat(
    "en-GB",

    formatOptions,
  ).format(date);
}

function getLocalizedText(value) {
  if (!value) {
    return "Untitled";
  }

  if (typeof value === "string") {
    return value;
  }

  return value.en || value.th || "Untitled";
}

function getActivityDate(value) {
  if (!value) {
    return "Recently";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",

    day: "2-digit",

    month: "short",

    hour: "2-digit",

    minute: "2-digit",
  }).format(date);
}

/*
 * =========================================================
 * METRIC CARD
 * =========================================================
 */

function MetricCard({
  label,

  value,

  description,

  icon: Icon,

  tone,
}) {
  const style = CARD_STYLES[tone];

  return (
    <article
      className={`
        relative
        overflow-hidden

        rounded-2xl

        border

        p-5

        ${style.panel}
      `}
    >
      <div
        className="
          relative

          flex
          items-start
          justify-between
          gap-4
        "
      >
        <div className="min-w-0">
          <p
            className="
              admin-text-10
              font-semibold
              uppercase
              tracking-[0.12em]

              text-[var(--admin-muted)]
            "
          >
            {label}
          </p>

          <p
            className={`
              mt-3

              text-3xl
              font-semibold
              tracking-[-0.04em]

              ${style.accent}
            `}
          >
            {formatNumber(value)}
          </p>

          <p
            className="
              mt-2

              admin-text-10

              text-[var(--admin-muted)]
            "
          >
            {description}
          </p>
        </div>

        <span
          className={`
            flex
            h-11
            w-11
            shrink-0

            items-center
            justify-center

            rounded-2xl

            shadow-lg

            ${style.icon}
          `}
        >
          <Icon size={19} strokeWidth={1.8} />
        </span>
      </div>
    </article>
  );
}

/*
 * =========================================================
 * TRAFFIC CHART
 * =========================================================
 */

function TrafficChart({ rows }) {
  const width = 760;

  const height = 230;

  const paddingX = 24;

  const paddingY = 24;

  const maxValue = Math.max(
    1,

    ...rows.flatMap((row) => [row.views || 0, row.uniqueVisitors || 0]),
  );

  function createPoints(key) {
    if (!rows.length) {
      return "";
    }

    return rows
      .map((row, index) => {
        const x =
          rows.length === 1
            ? width / 2
            : paddingX + (index / (rows.length - 1)) * (width - paddingX * 2);

        const y =
          height -
          paddingY -
          ((Number(row[key]) || 0) / maxValue) * (height - paddingY * 2);

        return `${x},${y}`;
      })
      .join(" ");
  }

  const viewPoints = createPoints("views");

  const visitorPoints = createPoints("uniqueVisitors");

  return (
    <div>
      <div
        className="
          flex
          flex-wrap
          items-center
          gap-4

          admin-text-10

          text-[var(--admin-muted)]
        "
      >
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          Views
        </span>

        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
          Unique visitors
        </span>
      </div>

      <div className="mt-5 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="
            h-[230px]
            min-w-[620px]
            w-full
          "
          role="img"
          aria-label="Website traffic chart"
        >
          {[0, 1, 2, 3, 4].map((line) => {
            const y = paddingY + (line / 4) * (height - paddingY * 2);

            return (
              <line
                key={line}
                x1={paddingX}
                x2={width - paddingX}
                y1={y}
                y2={y}
                stroke="var(--admin-border)"
                strokeWidth="1"
              />
            );
          })}

          {viewPoints && (
            <polyline
              points={viewPoints}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {visitorPoints && (
            <polyline
              points={visitorPoints}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </div>

      <div
        className="
          mt-1

          flex
          justify-between

          admin-text-9

          text-[var(--admin-muted)]
        "
      >
        <span>
          {rows.length
            ? formatDate(
                rows[0].date,

                {
                  year: false,
                },
              )
            : "No data"}
        </span>

        <span>
          {rows.length
            ? formatDate(
                rows[rows.length - 1].date,

                {
                  year: false,
                },
              )
            : ""}
        </span>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * EMPTY STATE
 * =========================================================
 */

function EmptyState({ children }) {
  return (
    <div
      className="
        flex
        min-h-[190px]

        items-center
        justify-center

        px-5
        py-10

        text-center

        admin-text-11

        text-[var(--admin-muted)]
      "
    >
      {children}
    </div>
  );
}

/*
 * =========================================================
 * DASHBOARD WORKSPACE
 * =========================================================
 */

export default function DashboardWorkspace({ userName }) {
  const {
    activeCompany,

    activeCompanyId,

    loading: companyLoading,
  } = useCompanyWorkspace();

  const [range, setRange] = useState("7d");

  const [data, setData] = useState(EMPTY_DATA);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const loadDashboard = useCallback(
    async (signal) => {
      if (!activeCompanyId) {
        setData(EMPTY_DATA);

        setLoading(false);

        return;
      }

      setLoading(true);

      setError("");

      try {
        const response = await fetch(
          `/api/v1/companies/${encodeURIComponent(
            activeCompanyId,
          )}/dashboard?range=${encodeURIComponent(range)}`,

          {
            cache: "no-store",

            signal,
          },
        );

        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload?.success) {
          throw new Error(payload?.message || "Unable to load dashboard.");
        }

        setData({
          ...EMPTY_DATA,

          ...payload.data,

          overview: {
            ...EMPTY_DATA.overview,

            ...(payload.data?.overview || {}),
          },

          forms: {
            ...EMPTY_DATA.forms,

            ...(payload.data?.forms || {}),
          },
        });
      } catch (loadError) {
        if (loadError.name !== "AbortError") {
          console.error(
            "Load dashboard error:",

            loadError,
          );

          setError(loadError.message || "Unable to load dashboard.");
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },

    [activeCompanyId, range],
  );

  useEffect(() => {
    const controller = new AbortController();

    const timeoutId = window.setTimeout(() => {
      loadDashboard(controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);

      controller.abort();
    };
  }, [loadDashboard]);

  const cards = useMemo(
    () => [
      {
        label: "Page views",

        value: data.overview.views,

        description: "Consent-based visits",

        icon: Eye,

        tone: "blue",
      },

      {
        label: "Unique visitors",

        value: data.overview.uniqueVisitors,

        description: "Anonymous visitors",

        icon: Users,

        tone: "violet",
      },

      {
        label: "Likes",

        value: data.overview.likes,

        description: "Content reactions",

        icon: Heart,

        tone: "rose",
      },

      {
        label: "Shares",

        value: data.overview.shares,

        description: "Content shared",

        icon: Share2,

        tone: "emerald",
      },

      {
        label: "Submissions",

        value: data.overview.submissions,

        description: `${formatNumber(
          data.overview.newSubmissions,
        )} new messages`,

        icon: FileText,

        tone: "amber",
      },

      {
        label: "Notifications",

        value: data.overview.notifications,

        description: "Workspace activity",

        icon: Bell,

        tone: "company",
      },
    ],

    [data.overview],
  );

  const websiteSlug = activeCompany?.slug || activeCompany?.companySlug;

  return (
    <div>
      {/* =================================
          HEADER
      ================================= */}

      <header
        className="
          flex
          flex-col
          gap-5

          lg:flex-row
          lg:items-end
          lg:justify-between
        "
      >
        <div>
          <div
            className="
              flex
              items-center
              gap-2

              admin-text-10
              font-semibold
              uppercase
              tracking-[0.14em]

              text-[var(--company-primary)]
            "
          >
            <Sparkles size={14} />
            Company overview
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
            Dashboard
          </h1>

          <p
            className="
              mt-22
              max-w-[720px]

              admin-text-12
              leading-[1.65]

              text-[var(--admin-muted)]
            "
          >
            Welcome back, {userName}. Monitor website traffic, engagement and
            incoming messages for{" "}
            {activeCompany?.name || "the selected company"}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={range}
            onChange={(event) => setRange(event.target.value)}
            disabled={loading || companyLoading}
            aria-label="Dashboard date range"
            className="
              h-10

              rounded-xl

              border
              border-[var(--admin-border)]

              bg-[var(--admin-surface)]

              px-3

              admin-text-11

              text-[var(--admin-foreground)]

              outline-none

              transition

              focus:border-[var(--company-primary)]
            "
          >
            {RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => loadDashboard()}
            disabled={loading || !activeCompanyId}
            className="
              inline-flex
              h-10
              w-10

              items-center
              justify-center

              rounded-xl

              border
              border-[var(--admin-border)]

              bg-[var(--admin-surface)]

              text-[var(--admin-muted)]

              transition

              hover:bg-[var(--admin-hover)]
              hover:text-[var(--admin-foreground)]

              disabled:cursor-not-allowed
              disabled:opacity-50
            "
            aria-label="Refresh dashboard"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>

          {websiteSlug && (
            <a
              href={`/${websiteSlug}`}
              target="_blank"
              rel="noreferrer"
              className="
                inline-flex
                h-10

                items-center
                justify-center
                gap-2

                rounded-xl

                bg-[var(--company-primary)]

                px-4

                admin-text-11
                font-semibold

                text-[var(--company-primary-foreground)]

                transition

                hover:opacity-90
              "
            >
              View website
              <ArrowUpRight size={15} />
            </a>
          )}
        </div>
      </header>

      {/* =================================
          ERROR
      ================================= */}

      {error && (
        <div
          role="alert"
          className="
            mt-6

            rounded-2xl

            border
            border-red-500/25

            bg-red-500/10

            px-4
            py-3

            admin-text-11

            text-red-600

            dark:text-red-400
          "
        >
          {error}
        </div>
      )}

      {/* =================================
          LOADING
      ================================= */}

      {loading && !data.chart.length ? (
        <div
          className="
            mt-8

            flex
            min-h-[420px]

            items-center
            justify-center

            rounded-2xl

            border
            border-[var(--admin-border)]

            bg-[var(--admin-surface)]
          "
        >
          <div className="text-center text-[var(--admin-muted)]">
            <LoaderCircle className="mx-auto animate-spin" size={24} />

            <p className="mt-3 admin-text-11">Loading dashboard…</p>
          </div>
        </div>
      ) : (
        <>
          {/* =============================
              METRIC CARDS
          ============================= */}

          <section
            className="
              mt-8

              grid
              grid-cols-1
              gap-4

              sm:grid-cols-2

              xl:grid-cols-3

              2xl:grid-cols-6
            "
          >
            {cards.map((card) => (
              <MetricCard key={card.label} {...card} />
            ))}
          </section>

          {/* =============================
              TRAFFIC + FORMS
          ============================= */}

          <section
            className="
              mt-6

              grid
              gap-6

              xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.75fr)]
            "
          >
            <article
              className="
                rounded-2xl

                border
                border-[var(--admin-border)]

                bg-[var(--admin-surface)]
              "
            >
              <div
                className="
                  flex
                  flex-wrap
                  items-center
                  justify-between
                  gap-3

                  border-b
                  border-[var(--admin-border)]

                  px-5
                  py-4

                  sm:px-6
                "
              >
                <div>
                  <h2
                    className="
                      admin-text-12
                      font-semibold

                      text-[var(--admin-foreground)]
                    "
                  >
                    Website traffic
                  </h2>

                  <p
                    className="
                      mt-1

                      admin-text-10

                      text-[var(--admin-muted)]
                    "
                  >
                    Views and consent-based unique visitors.
                  </p>
                </div>

                <span
                  className="
                    inline-flex
                    items-center
                    gap-2

                    rounded-full

                    bg-[var(--admin-background)]

                    px-3
                    py-1.5

                    admin-text-9

                    text-[var(--admin-muted)]
                  "
                >
                  <CalendarDays size={13} />
                  {formatDate(data.period?.from)} —{" "}
                  {formatDate(data.period?.to)}
                </span>
              </div>

              <div className="p-5 sm:p-6">
                <TrafficChart rows={data.chart || []} />
              </div>
            </article>

            <article
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
                    admin-text-12
                    font-semibold

                    text-[var(--admin-foreground)]
                  "
                >
                  Message summary
                </h2>

                <p
                  className="
                    mt-1

                    admin-text-10

                    text-[var(--admin-muted)]
                  "
                >
                  Form submissions in this period.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-5">
                {[
                  ["Contact", data.forms?.contact, "bg-blue-500"],

                  ["Survey", data.forms?.survey, "bg-violet-500"],

                  ["Career", data.forms?.career, "bg-emerald-500"],

                  ["Custom", data.forms?.custom, "bg-amber-500"],
                ].map(([label, value, color]) => (
                  <div
                    key={label}
                    className="
                      rounded-xl

                      bg-[var(--admin-background)]

                      p-4
                    "
                  >
                    <span
                      className={`
                        block
                        h-2
                        w-8

                        rounded-full

                        ${color}
                      `}
                    />

                    <p
                      className="
                        mt-3

                        text-xl
                        font-semibold

                        text-[var(--admin-foreground)]
                      "
                    >
                      {formatNumber(value)}
                    </p>

                    <p
                      className="
                        mt-1

                        admin-text-9

                        text-[var(--admin-muted)]
                      "
                    >
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </section>

          {/* =============================
              TOP CONTENT + ACTIVITY
          ============================= */}

          <section
            className="
              mt-6

              grid
              gap-6

              xl:grid-cols-2
            "
          >
            <article
              className="
                overflow-hidden

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
                    admin-text-12
                    font-semibold

                    text-[var(--admin-foreground)]
                  "
                >
                  Top content
                </h2>

                <p
                  className="
                    mt-1

                    admin-text-10

                    text-[var(--admin-muted)]
                  "
                >
                  Ranked by views, likes and shares.
                </p>
              </div>

              {!data.topContent?.length ? (
                <EmptyState>
                  Content performance will appear after visitors interact with
                  the website.
                </EmptyState>
              ) : (
                <div className="divide-y divide-[var(--admin-border)]">
                  {data.topContent.slice(0, 6).map((item, index) => (
                    <div
                      key={`${item.contentType}-${item.contentId}`}
                      className="
                          flex
                          items-center
                          gap-4

                          px-5
                          py-4

                          sm:px-6
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

                            rounded-xl

                            bg-[var(--company-primary-soft)]

                            admin-text-10
                            font-semibold

                            text-[var(--company-primary)]
                          "
                      >
                        {index + 1}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p
                          className="
                              truncate

                              admin-text-11
                              font-semibold

                              text-[var(--admin-foreground)]
                            "
                        >
                          {getLocalizedText(item.title)}
                        </p>

                        <p
                          className="
                              mt-1

                              admin-text-9
                              uppercase
                              tracking-[0.1em]

                              text-[var(--admin-muted)]
                            "
                        >
                          {item.contentType}
                        </p>
                      </div>

                      <div
                        className="
                            hidden
                            items-center
                            gap-3

                            admin-text-9

                            text-[var(--admin-muted)]

                            sm:flex
                          "
                      >
                        <span className="inline-flex items-center gap-1">
                          <Eye size={12} />

                          {formatNumber(item.views)}
                        </span>

                        <span className="inline-flex items-center gap-1">
                          <Heart size={12} />

                          {formatNumber(item.likes)}
                        </span>

                        <span className="inline-flex items-center gap-1">
                          <Share2 size={12} />

                          {formatNumber(item.shares)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article
              className="
                overflow-hidden

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
                    admin-text-12
                    font-semibold

                    text-[var(--admin-foreground)]
                  "
                >
                  Recent activity
                </h2>

                <p
                  className="
                    mt-1

                    admin-text-10

                    text-[var(--admin-muted)]
                  "
                >
                  Latest messages and system notifications.
                </p>
              </div>

              {!data.recentActivity?.length ? (
                <EmptyState>New activity will appear here.</EmptyState>
              ) : (
                <div className="divide-y divide-[var(--admin-border)]">
                  {data.recentActivity.slice(0, 6).map((item, index) => {
                    const submission = item.type === "form_submission";

                    const Icon = submission ? Mail : Activity;

                    return (
                      <div
                        key={`${item.type}-${item.id}-${index}`}
                        className="
                            flex
                            items-start
                            gap-3

                            px-5
                            py-4

                            sm:px-6
                          "
                      >
                        <span
                          className={`
                              flex
                              h-9
                              w-9
                              shrink-0

                              items-center
                              justify-center

                              rounded-xl

                              ${
                                submission
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                              }
                            `}
                        >
                          <Icon size={15} />
                        </span>

                        <div className="min-w-0 flex-1">
                          <p
                            className="
                                truncate

                                admin-text-11
                                font-semibold

                                text-[var(--admin-foreground)]
                              "
                          >
                            {getLocalizedText(item.title)}
                          </p>

                          <p
                            className="
                                mt-1

                                admin-text-9

                                text-[var(--admin-muted)]
                              "
                          >
                            {submission
                              ? `Submission · ${item.status || "new"}`
                              : item.level || "Notification"}
                          </p>
                        </div>

                        <time
                          className="
                              shrink-0

                              admin-text-9

                              text-[var(--admin-muted)]
                            "
                        >
                          {getActivityDate(item.createdAt)}
                        </time>
                      </div>
                    );
                  })}
                </div>
              )}
            </article>
          </section>
        </>
      )}
    </div>
  );
}
