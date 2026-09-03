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
import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

const RANGE_OPTIONS = [
  {
    value: "today",
    labelKey: "dashboard.ranges.today",
  },
  {
    value: "7d",
    labelKey: "dashboard.ranges.sevenDays",
  },
  {
    value: "30d",
    labelKey: "dashboard.ranges.thirtyDays",
  },
  {
    value: "month",
    labelKey: "dashboard.ranges.thisMonth",
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

function resolveIntlLocale(locale) {
  return locale === "th" ? "th-TH-u-ca-gregory" : "en-GB";
}

function formatNumber(
  value,

  locale = "en",
) {
  return new Intl.NumberFormat(
    resolveIntlLocale(locale),

    {
      notation: Number(value) >= 10000 ? "compact" : "standard",

      maximumFractionDigits: 1,
    },
  ).format(Number(value) || 0);
}

function formatDate(
  value,

  locale = "en",

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
    resolveIntlLocale(locale),

    formatOptions,
  ).format(date);
}

function getLocalizedText(
  value,

  locale = "en",

  fallback = "",
) {
  if (!value) {
    return fallback;
  }

  if (typeof value === "string") {
    return value;
  }

  return value?.[locale] || value?.en || value?.th || fallback;
}

function getActivityDate(
  value,

  locale = "en",

  fallback = "",
) {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat(
    resolveIntlLocale(locale),

    {
      timeZone: "Asia/Bangkok",

      day: "2-digit",

      month: "short",

      hour: "2-digit",

      minute: "2-digit",
    },
  ).format(date);
}

/*
 * =========================================================
 * METRIC CARD
 * =========================================================
 */

function MetricCard({ label, value, description, icon: Icon, tone, locale }) {
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
            {formatNumber(
              value,

              locale,
            )}
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

function TrafficChart({ rows, locale, t }) {
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

          {t("dashboard.chart.views")}
        </span>

        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />

          {t("dashboard.chart.uniqueVisitors")}
        </span>
      </div>

      <div className="mt-5 max-w-full overflow-x-auto overscroll-x-contain">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="
              h-[200px]
              min-w-[620px]
              w-full

              sm:h-[230px]
            "
          role="img"
          aria-label={t("dashboard.chart.ariaLabel")}
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

                locale,

                {
                  year: false,
                },
              )
            : t("dashboard.chart.noData")}
        </span>

        <span>
          {rows.length
            ? formatDate(
                rows[rows.length - 1].date,

                locale,

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
    t,

    locale,

    statusLabel,
  } = useAdminTranslation();

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

            credentials: "same-origin",

            signal,
          },
        );

        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload?.success) {
          throw new Error(payload?.message || t("dashboard.errors.load"));
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

          setError(loadError.message || t("dashboard.errors.load"));
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },

    [activeCompanyId, range, t],
  );

  useEffect(() => {
    const controller = new AbortController();

    const timeoutId = window.setTimeout(
      () => {
        loadDashboard(controller.signal);
      },

      0,
    );

    return () => {
      window.clearTimeout(timeoutId);

      controller.abort();
    };
  }, [loadDashboard]);

  const cards = useMemo(
    () => [
      {
        label: t("dashboard.metrics.views.title"),

        value: data.overview.views,

        description: t("dashboard.metrics.views.description"),

        icon: Eye,

        tone: "blue",
      },

      {
        label: t("dashboard.metrics.uniqueVisitors.title"),

        value: data.overview.uniqueVisitors,

        description: t("dashboard.metrics.uniqueVisitors.description"),

        icon: Users,

        tone: "violet",
      },

      {
        label: t("dashboard.metrics.likes.title"),

        value: data.overview.likes,

        description: t("dashboard.metrics.likes.description"),

        icon: Heart,

        tone: "rose",
      },

      {
        label: t("dashboard.metrics.shares.title"),

        value: data.overview.shares,

        description: t("dashboard.metrics.shares.description"),

        icon: Share2,

        tone: "emerald",
      },

      {
        label: t("dashboard.metrics.submissions.title"),

        value: data.overview.submissions,

        description: t(
          "dashboard.metrics.submissions.description",

          {
            count: formatNumber(
              data.overview.newSubmissions,

              locale,
            ),
          },
        ),

        icon: FileText,

        tone: "amber",
      },

      {
        label: t("dashboard.metrics.notifications.title"),

        value: data.overview.notifications,

        description: t("dashboard.metrics.notifications.description"),

        icon: Bell,

        tone: "company",
      },
    ],

    [data.overview, locale, t],
  );

  const formCards = useMemo(
    () => [
      {
        key: "contact",

        label: t("dashboard.forms.contact"),

        value: data.forms?.contact,

        color: "bg-blue-500",
      },

      {
        key: "survey",

        label: t("dashboard.forms.survey"),

        value: data.forms?.survey,

        color: "bg-violet-500",
      },

      {
        key: "career",

        label: t("dashboard.forms.career"),

        value: data.forms?.career,

        color: "bg-emerald-500",
      },

      {
        key: "custom",

        label: t("dashboard.forms.custom"),

        value: data.forms?.custom,

        color: "bg-amber-500",
      },
    ],

    [data.forms, t],
  );

  const websiteSlug = activeCompany?.slug || activeCompany?.companySlug;

  const companyName = activeCompany?.name || t("dashboard.selectedCompany");

  return (
    <div>
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

            {t("dashboard.eyebrow")}
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
            {t("dashboard.title")}
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
            {t(
              "dashboard.welcome",

              {
                user: userName,

                company: companyName,
              },
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={range}
            onChange={(event) => setRange(event.target.value)}
            disabled={loading || companyLoading}
            aria-label={t("dashboard.actions.dateRange")}
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
                {t(option.labelKey)}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => loadDashboard()}
            disabled={loading || !activeCompanyId}
            aria-label={t("dashboard.actions.refresh")}
            title={t("dashboard.actions.refresh")}
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
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>

          {websiteSlug && (
            <a
              href={`/${websiteSlug}`}
              target="_blank"
              rel="noopener noreferrer"
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

                !text-white
                [&_svg]:!text-white

                transition

                hover:opacity-90
              "
            >
              {t("dashboard.actions.viewWebsite")}

              <ArrowUpRight size={15} />
            </a>
          )}
        </div>
      </header>

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

            <p className="mt-3 admin-text-11">{t("dashboard.loading")}</p>
          </div>
        </div>
      ) : (
        <>
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
              <MetricCard key={card.label} {...card} locale={locale} />
            ))}
          </section>

          <section
            className="
              mt-6

              grid
              min-w-0
              grid-cols-1
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
                    {t("dashboard.traffic.title")}
                  </h2>

                  <p
                    className="
                      mt-1

                      admin-text-10

                      text-[var(--admin-muted)]
                    "
                  >
                    {t("dashboard.traffic.description")}
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

                  {formatDate(
                    data.period?.from,

                    locale,
                  )}

                  {" — "}

                  {formatDate(
                    data.period?.to,

                    locale,
                  )}
                </span>
              </div>

              <div className="min-w-0 overflow-hidden p-4 sm:p-6">
                <TrafficChart rows={data.chart || []} locale={locale} t={t} />
              </div>
            </article>

            <article
              className="
                min-w-0
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
                "
              >
                <h2
                  className="
                    admin-text-12
                    font-semibold

                    text-[var(--admin-foreground)]
                  "
                >
                  {t("dashboard.forms.title")}
                </h2>

                <p
                  className="
                    mt-1

                    admin-text-10

                    text-[var(--admin-muted)]
                  "
                >
                  {t("dashboard.forms.description")}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-5">
                {formCards.map((item) => (
                  <div
                    key={item.key}
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

                          ${item.color}
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
                      {formatNumber(
                        item.value,

                        locale,
                      )}
                    </p>

                    <p
                      className="
                          mt-1

                          admin-text-9

                          text-[var(--admin-muted)]
                        "
                    >
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </section>

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
                  {t("dashboard.topContent.title")}
                </h2>

                <p
                  className="
                    mt-1

                    admin-text-10

                    text-[var(--admin-muted)]
                  "
                >
                  {t("dashboard.topContent.description")}
                </p>
              </div>

              {!data.topContent?.length ? (
                <EmptyState>{t("dashboard.topContent.empty")}</EmptyState>
              ) : (
                <div className="divide-y divide-[var(--admin-border)]">
                  {data.topContent.slice(0, 6).map(
                    (
                      item,

                      index,
                    ) => (
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
                            {getLocalizedText(
                              item.title,

                              locale,

                              t("dashboard.untitled"),
                            )}
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

                            {formatNumber(
                              item.views,

                              locale,
                            )}
                          </span>

                          <span className="inline-flex items-center gap-1">
                            <Heart size={12} />

                            {formatNumber(
                              item.likes,

                              locale,
                            )}
                          </span>

                          <span className="inline-flex items-center gap-1">
                            <Share2 size={12} />

                            {formatNumber(
                              item.shares,

                              locale,
                            )}
                          </span>
                        </div>
                      </div>
                    ),
                  )}
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
                  {t("dashboard.activity.title")}
                </h2>

                <p
                  className="
                    mt-1

                    admin-text-10

                    text-[var(--admin-muted)]
                  "
                >
                  {t("dashboard.activity.description")}
                </p>
              </div>

              {!data.recentActivity?.length ? (
                <EmptyState>{t("dashboard.activity.empty")}</EmptyState>
              ) : (
                <div className="divide-y divide-[var(--admin-border)]">
                  {data.recentActivity.slice(0, 6).map(
                    (
                      item,

                      index,
                    ) => {
                      const submission = item.type === "form_submission";

                      const Icon = submission ? Mail : Activity;

                      const activityType = submission
                        ? t(
                            "dashboard.activity.submission",

                            {
                              status:
                                statusLabel(item.status) ||
                                t("dashboard.activity.newStatus"),
                            },
                          )
                        : item.level || t("dashboard.activity.notification");

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
                              {getLocalizedText(
                                item.title,

                                locale,

                                t("dashboard.untitled"),
                              )}
                            </p>

                            <p
                              className="
                                  mt-1

                                  admin-text-9

                                  text-[var(--admin-muted)]
                                "
                            >
                              {activityType}
                            </p>
                          </div>

                          <time
                            className="
                                shrink-0

                                admin-text-9

                                text-[var(--admin-muted)]
                              "
                          >
                            {getActivityDate(
                              item.createdAt,

                              locale,

                              t("dashboard.activity.recently"),
                            )}
                          </time>
                        </div>
                      );
                    },
                  )}
                </div>
              )}
            </article>
          </section>
        </>
      )}
    </div>
  );
}
