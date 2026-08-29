"use client";

import {
  CalendarClock,
  Newspaper,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Star,
  Trash2,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";

import { toast } from "sonner";

import { useCompanyWorkspace } from "@/components/admin/company/CompanyWorkspaceProvider";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import ActionButton from "@/components/admin/ui/ActionButton";
import ActionButtonGroup from "@/components/admin/ui/ActionButtonGroup";
import StatusBadge from "@/components/admin/ui/StatusBadge";

import { useAdminUiPreferences } from "@/components/admin/ui/AdminUiPreferencesProvider";

import { NEWS_STATUS } from "@/constants/news";

import { cn } from "@/utils/cn";

import NewsConfirmDialog from "./NewsConfirmDialog";
import NewsCoverThumbnail from "./NewsCoverThumbnail";
import NewsEditor from "./NewsEditor";
import NewsPublishDialog from "./NewsPublishDialog";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function normalizeArray(payload) {
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
}

function getLocalized(value) {
  return value?.en?.trim() || value?.th?.trim() || "";
}

function getNewsTitle(item, fallback) {
  return getLocalized(item?.title) || item?.slug || fallback;
}

function getCoverMediaId(item) {
  return item?.featuredImage?.mediaId || null;
}

function formatDate(value, locale) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    dateStyle: "medium",
  }).format(date);
}

function formatDateTime(value, locale) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    dateStyle: "medium",

    timeStyle: "short",
  }).format(date);
}

async function readResponse(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function extractTagSuggestions(items) {
  const tags = new Map();

  for (const item of items) {
    if (!Array.isArray(item?.tags)) {
      continue;
    }

    for (const rawTag of item.tags) {
      const tag = String(rawTag || "")
        .trim()
        .replace(/\s+/g, " ");

      if (!tag) {
        continue;
      }

      const key = tag.toLowerCase();

      if (!tags.has(key)) {
        tags.set(key, tag);
      }
    }
  }

  return [...tags.values()].sort((first, second) =>
    first.localeCompare(second, "en", {
      sensitivity: "base",
    }),
  );
}

/*
 * =========================================================
 * SKELETON
 * =========================================================
 */

function NewsListSkeleton({ density }) {
  const rowPadding =
    density === "compact" ? "p-4" : density === "spacious" ? "p-6" : "p-5";

  return (
    <div
      className="
        mt-6

        overflow-hidden

        rounded-2xl

        border
        border-[var(--admin-border)]

        bg-[var(--admin-surface)]
      "
    >
      {Array.from({
        length: 6,
      }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "flex gap-4",

            rowPadding,

            index !== 5 && "border-b border-[var(--admin-border)]",
          )}
        >
          <div
            className="
                h-[86px]
                w-[116px]

                shrink-0

                animate-pulse

                rounded-xl

                bg-[var(--admin-hover)]
              "
          />

          <div
            className="
                min-w-0
                flex-1
              "
          >
            <div
              className="
                  flex
                  items-center
                  gap-2
                "
            >
              <div
                className="
                    h-4
                    w-[40%]

                    animate-pulse

                    rounded

                    bg-[var(--admin-hover)]
                  "
              />

              <div
                className="
                    h-5
                    w-16

                    animate-pulse

                    rounded-full

                    bg-[var(--admin-hover)]
                  "
              />
            </div>

            <div
              className="
                  mt-2

                  h-3
                  w-[24%]

                  animate-pulse

                  rounded

                  bg-[var(--admin-hover)]
                "
            />

            <div
              className="
                  mt-5

                  flex
                  gap-3
                "
            >
              <div
                className="
                    h-3
                    w-20

                    animate-pulse

                    rounded

                    bg-[var(--admin-hover)]
                  "
              />

              <div
                className="
                    h-3
                    w-24

                    animate-pulse

                    rounded

                    bg-[var(--admin-hover)]
                  "
              />
            </div>
          </div>

          <div
            className="
                hidden
                shrink-0
                gap-2

                lg:flex
              "
          >
            <div
              className="
                  h-9
                  w-20

                  animate-pulse

                  rounded-xl

                  bg-[var(--admin-hover)]
                "
            />

            <div
              className="
                  h-9
                  w-20

                  animate-pulse

                  rounded-xl

                  bg-[var(--admin-hover)]
                "
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/*
 * =========================================================
 * STAT CARD
 * =========================================================
 */

function NewsStatCard({ icon: Icon, value, label, tone = "neutral" }) {
  const iconClass = {
    neutral: "text-[var(--admin-muted)]",

    company: "text-[var(--company-primary)]",

    success: "text-emerald-600",

    warning: "text-amber-600",
  }[tone];

  return (
    <div
      className="
        rounded-2xl

        border
        border-[var(--admin-border)]

        bg-[var(--admin-surface)]

        p-4
      "
    >
      <Icon size={17} className={iconClass} />

      <div
        className="
          mt-4

          admin-text-24
          font-semibold
          tracking-[-0.04em]

          text-[var(--admin-foreground)]
        "
      >
        {value}
      </div>

      <div
        className="
          mt-1

          admin-text-12

          text-[var(--admin-muted)]
        "
      >
        {label}
      </div>
    </div>
  );
}

/*
 * =========================================================
 * NEWS MANAGER
 * =========================================================
 */

export default function NewsManager() {
  const {
    activeCompany,
    activeCompanyId,

    loading: companyLoading,
  } = useCompanyWorkspace();

  const { t, locale } = useAdminTranslation();

  const { actionDisplay, tooltipEnabled, tooltipDelay, density } =
    useAdminUiPreferences();

  /*
   * =======================================================
   * DATA
   * =======================================================
   */

  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState(null);

  /*
   * =======================================================
   * FILTER
   * =======================================================
   */

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("");

  const [categoryFilter, setCategoryFilter] = useState("");

  /*
   * =======================================================
   * EDITOR
   * =======================================================
   */

  const [editorOpen, setEditorOpen] = useState(false);

  const [editingItem, setEditingItem] = useState(null);

  /*
   * =======================================================
   * PUBLISH
   * =======================================================
   */

  const [publishItem, setPublishItem] = useState(null);

  /*
   * =======================================================
   * CONFIRM
   * =======================================================
   */

  const [confirmState, setConfirmState] = useState({
    open: false,

    mode: "delete",

    item: null,
  });

  /*
   * =======================================================
   * ACTION LOADING
   * =======================================================
   */

  const [processingId, setProcessingId] = useState(null);

  /*
   * =======================================================
   * DISPLAY
   * =======================================================
   */

  const actionSize = density === "compact" ? "small" : "default";

  const rowPadding =
    density === "compact" ? "p-4" : density === "spacious" ? "p-6" : "p-5";

  /*
   * =======================================================
   * LOAD
   * =======================================================
   */

  const loadData = useCallback(
    async ({ silent = false } = {}) => {
      if (!activeCompanyId) {
        setItems([]);

        return;
      }

      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const response = await fetch(
          `/api/v1/companies/${activeCompanyId}/news`,
          {
            method: "GET",

            cache: "no-store",

            credentials: "include",
          },
        );

        const payload = await readResponse(response);

        if (!response.ok || payload?.success === false) {
          throw new Error(
            payload?.message || t("news.manager.errors.loadFailed"),
          );
        }

        setItems(normalizeArray(payload));
      } catch (loadError) {
        console.error("Load news error:", loadError);

        setError(loadError?.message || t("news.manager.errors.loadFailed"));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeCompanyId, t],
  );

  useEffect(() => {
    if (!activeCompanyId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      loadData();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeCompanyId, loadData]);

  /*
   * =======================================================
   * CATEGORY SUGGESTIONS
   * =======================================================
   */

  const categories = useMemo(() => {
    return [
      ...new Set(items.map((item) => item.category?.trim()).filter(Boolean)),
    ].sort((first, second) =>
      first.localeCompare(second, "en", {
        sensitivity: "base",
      }),
    );
  }, [items]);

  /*
   * =======================================================
   * TAG SUGGESTIONS
   * =======================================================
   */

  const tagSuggestions = useMemo(() => extractTagSuggestions(items), [items]);

  /*
   * =======================================================
   * FILTER
   * =======================================================
   */

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return items.filter((item) => {
      if (statusFilter && item.status !== statusFilter) {
        return false;
      }

      if (categoryFilter && item.category !== categoryFilter) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const text = [
        item.title?.en,

        item.title?.th,

        item.excerpt?.en,

        item.excerpt?.th,

        item.slug,

        item.category,

        item.author,

        ...(item.tags || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(keyword);
    });
  }, [categoryFilter, items, search, statusFilter]);

  /*
   * =======================================================
   * COUNTS
   * =======================================================
   */

  const counts = useMemo(() => {
    return items.reduce(
      (result, item) => {
        result.total += 1;

        if (item.status === NEWS_STATUS.PUBLISHED) {
          result.published += 1;
        }

        if (item.status === NEWS_STATUS.DRAFT) {
          result.draft += 1;
        }

        if (item.status === NEWS_STATUS.SCHEDULED) {
          result.scheduled += 1;
        }

        return result;
      },
      {
        total: 0,

        published: 0,

        draft: 0,

        scheduled: 0,
      },
    );
  }, [items]);

  /*
   * =======================================================
   * EDITOR
   * =======================================================
   */

  function handleCreate() {
    setEditingItem(null);

    setEditorOpen(true);
  }

  function handleEdit(item) {
    setEditingItem(item);

    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);

    setEditingItem(null);
  }

  async function handleSaved() {
    setEditorOpen(false);

    setEditingItem(null);

    await loadData({
      silent: true,
    });
  }

  /*
   * =======================================================
   * PUBLISH DIALOG
   * =======================================================
   */

  function openPublish(item) {
    if (processingId) {
      return;
    }

    setPublishItem(item);
  }

  function closePublish() {
    if (processingId) {
      return;
    }

    setPublishItem(null);
  }

  /*
   * =======================================================
   * CONFIRM DIALOG
   * =======================================================
   */

  function openConfirm(mode, item) {
    if (processingId) {
      return;
    }

    setConfirmState({
      open: true,

      mode,

      item,
    });
  }

  function closeConfirm() {
    if (processingId) {
      return;
    }

    setConfirmState({
      open: false,

      mode: "delete",

      item: null,
    });
  }

  /*
   * =======================================================
   * PUBLISH
   * =======================================================
   */

  async function publishNews(item, scheduledAt = null) {
    if (!activeCompanyId || !item?.id || processingId) {
      return;
    }

    try {
      setProcessingId(item.id);

      setError(null);

      const response = await fetch(
        `/api/v1/companies/${activeCompanyId}/news/${item.id}/publish`,
        {
          method: "POST",

          credentials: "include",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            scheduledAt: scheduledAt || null,
          }),
        },
      );

      const payload = await readResponse(response);

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.message || t("news.manager.errors.publishFailed"),
        );
      }

      setPublishItem(null);

      toast.success(
        scheduledAt
          ? t("news.manager.messages.scheduled")
          : t("news.manager.messages.published"),
      );

      await loadData({
        silent: true,
      });
    } catch (publishError) {
      console.error("Publish news error:", publishError);

      toast.error(
        publishError?.message || t("news.manager.errors.publishFailed"),
      );
    } finally {
      setProcessingId(null);
    }
  }

  /*
   * =======================================================
   * UNPUBLISH / CANCEL SCHEDULE
   * =======================================================
   */

  async function unpublishNews(item) {
    if (!activeCompanyId || !item?.id || processingId) {
      return;
    }

    try {
      setProcessingId(item.id);

      setError(null);

      const response = await fetch(
        `/api/v1/companies/${activeCompanyId}/news/${item.id}/unpublish`,
        {
          method: "POST",

          credentials: "include",
        },
      );

      const payload = await readResponse(response);

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.message || t("news.manager.errors.unpublishFailed"),
        );
      }

      setConfirmState({
        open: false,

        mode: "delete",

        item: null,
      });

      toast.success(
        item.status === NEWS_STATUS.SCHEDULED
          ? t("news.manager.messages.scheduleCancelled")
          : t("news.manager.messages.unpublished"),
      );

      await loadData({
        silent: true,
      });
    } catch (unpublishError) {
      console.error("Unpublish news error:", unpublishError);

      toast.error(
        unpublishError?.message || t("news.manager.errors.unpublishFailed"),
      );
    } finally {
      setProcessingId(null);
    }
  }

  /*
   * =======================================================
   * DELETE
   * =======================================================
   */

  async function deleteNews(item) {
    if (!activeCompanyId || !item?.id || processingId) {
      return;
    }

    try {
      setProcessingId(item.id);

      setError(null);

      const response = await fetch(
        `/api/v1/companies/${activeCompanyId}/news/${item.id}`,
        {
          method: "DELETE",

          credentials: "include",
        },
      );

      const payload = await readResponse(response);

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.message || t("news.manager.errors.deleteFailed"),
        );
      }

      setConfirmState({
        open: false,

        mode: "delete",

        item: null,
      });

      toast.success(t("news.manager.messages.deleted"));

      await loadData({
        silent: true,
      });
    } catch (deleteError) {
      console.error("Delete news error:", deleteError);

      toast.error(
        deleteError?.message || t("news.manager.errors.deleteFailed"),
      );
    } finally {
      setProcessingId(null);
    }
  }

  /*
   * =======================================================
   * COMPANY LOADING
   * =======================================================
   */

  if (companyLoading) {
    return (
      <div>
        <div
          className="
            h-8
            w-40

            animate-pulse

            rounded

            bg-[var(--admin-hover)]
          "
        />

        <div
          className="
            mt-3

            h-4
            w-[360px]
            max-w-full

            animate-pulse

            rounded

            bg-[var(--admin-hover)]
          "
        />

        <NewsListSkeleton density={density} />
      </div>
    );
  }

  /*
   * =======================================================
   * NO COMPANY
   * =======================================================
   */

  if (!activeCompany) {
    return (
      <div
        className="
          rounded-2xl

          border
          border-[var(--admin-border)]

          bg-[var(--admin-surface)]

          p-8
        "
      >
        <div
          className="
            admin-text-14
            font-medium

            text-[var(--admin-foreground)]
          "
        >
          {t("news.manager.noCompany.title")}
        </div>

        <p
          className="
            mt-1

            admin-text-14

            text-[var(--admin-muted)]
          "
        >
          {t("news.manager.noCompany.description")}
        </p>
      </div>
    );
  }

  const companyName =
    activeCompany.name ||
    activeCompany.displayName ||
    activeCompany.slug ||
    t("news.manager.thisCompany");

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <div>
      {/* =====================================
          HEADER
      ===================================== */}

      <div
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
              admin-text-12
              font-medium
              uppercase
              tracking-[0.14em]

              text-[var(--company-primary)]
            "
          >
            {t("news.manager.sectionLabel")}
          </div>

          <h1
            className="
              mt-2

              admin-text-32
              font-semibold
              tracking-[-0.035em]

              text-[var(--admin-foreground)]
            "
          >
            {t("news.title")}
          </h1>

          <p
            className="
              mt-2
              max-w-2xl

              admin-text-14
              leading-[1.7]

              text-[var(--admin-muted)]
            "
          >
            {t("news.manager.description", {
              company: companyName,
            })}
          </p>
        </div>

        <ActionButtonGroup>
          <ActionButton
            icon={RefreshCw}
            label={t("common.refresh")}
            tone="neutral"
            display={actionDisplay}
            tooltip={tooltipEnabled}
            tooltipDelay={tooltipDelay}
            size={actionSize}
            loading={refreshing}
            disabled={Boolean(processingId)}
            onClick={() =>
              loadData({
                silent: true,
              })
            }
          />

          <ActionButton
            icon={Plus}
            label={t("news.newNews")}
            tone="primary"
            display={actionDisplay}
            tooltip={tooltipEnabled}
            tooltipDelay={tooltipDelay}
            size={actionSize}
            disabled={Boolean(processingId)}
            onClick={handleCreate}
          />
        </ActionButtonGroup>
      </div>

      {/* =====================================
          STATS
      ===================================== */}

      <div
        className="
          mt-8

          grid
          grid-cols-2
          gap-3

          lg:grid-cols-4
        "
      >
        <NewsStatCard
          icon={Newspaper}
          value={counts.total}
          label={t("news.manager.stats.all")}
          tone="company"
        />

        <NewsStatCard
          icon={Send}
          value={counts.published}
          label={t("status.published")}
          tone="success"
        />

        <NewsStatCard
          icon={Newspaper}
          value={counts.draft}
          label={t("status.draft")}
        />

        <NewsStatCard
          icon={CalendarClock}
          value={counts.scheduled}
          label={t("status.scheduled")}
          tone="warning"
        />
      </div>

      {/* =====================================
          FILTER
      ===================================== */}

      <div
        className="
          mt-6

          flex
          flex-col
          gap-3

          xl:flex-row
          xl:items-center
        "
      >
        <div
          className="
            relative
            flex-1

            xl:max-w-sm
          "
        >
          <Search
            size={16}
            className="
              pointer-events-none

              absolute
              left-3
              top-1/2

              -translate-y-1/2

              text-[var(--admin-muted)]
            "
          />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("news.manager.searchPlaceholder")}
            className="
              h-11
              w-full

              rounded-xl

              border
              border-[var(--admin-border)]

              bg-[var(--admin-surface)]

              pl-10
              pr-4

              admin-text-14

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

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="
            h-11

            rounded-xl

            border
            border-[var(--admin-border)]

            bg-[var(--admin-surface)]

            px-3

            admin-text-14

            text-[var(--admin-foreground)]

            outline-none

            focus:border-[var(--company-primary)]

            focus:ring-2
            focus:ring-[var(--company-primary-soft)]
          "
        >
          <option value="">{t("news.manager.filters.allStatuses")}</option>

          <option value="draft">{t("status.draft")}</option>

          <option value="review">{t("status.review")}</option>

          <option value="scheduled">{t("status.scheduled")}</option>

          <option value="published">{t("status.published")}</option>

          <option value="archived">{t("status.archived")}</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="
            h-11

            rounded-xl

            border
            border-[var(--admin-border)]

            bg-[var(--admin-surface)]

            px-3

            admin-text-14

            text-[var(--admin-foreground)]

            outline-none

            focus:border-[var(--company-primary)]

            focus:ring-2
            focus:ring-[var(--company-primary-soft)]
          "
        >
          <option value="">{t("news.manager.filters.allCategories")}</option>

          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <div className="xl:ml-auto">
          <span
            className="
              admin-text-12

              text-[var(--admin-muted)]
            "
          >
            {t("news.manager.itemCount", {
              count: filteredItems.length,
            })}
          </span>
        </div>
      </div>

      {/* =====================================
          ERROR
      ===================================== */}

      {error && (
        <div
          className="
            mt-6

            rounded-2xl

            border
            border-red-200

            bg-red-50

            p-4

            admin-text-14

            text-red-700
          "
        >
          {error}
        </div>
      )}

      {/* =====================================
          LIST
      ===================================== */}

      {loading ? (
        <NewsListSkeleton density={density} />
      ) : filteredItems.length === 0 ? (
        <div
          className="
            mt-6

            flex
            min-h-[340px]

            flex-col
            items-center
            justify-center

            rounded-2xl

            border
            border-dashed
            border-[var(--admin-border)]

            bg-[var(--admin-surface)]

            p-8

            text-center
          "
        >
          <div
            className="
              flex
              h-12
              w-12

              items-center
              justify-center

              rounded-2xl

              bg-[var(--company-primary-soft)]

              text-[var(--company-primary)]
            "
          >
            <Newspaper size={21} strokeWidth={1.7} />
          </div>

          <div
            className="
              mt-4

              admin-text-14
              font-medium

              text-[var(--admin-foreground)]
            "
          >
            {items.length === 0
              ? t("news.manager.empty.title")
              : t("news.manager.empty.searchTitle")}
          </div>

          <p
            className="
              mt-1
              max-w-sm

              admin-text-12
              leading-[1.6]

              text-[var(--admin-muted)]
            "
          >
            {items.length === 0
              ? t("news.manager.empty.description")
              : t("news.manager.empty.searchDescription")}
          </p>

          {items.length === 0 && (
            <button
              type="button"
              onClick={handleCreate}
              className="
                mt-5

                inline-flex
                h-10

                items-center
                justify-center
                gap-2

                rounded-xl

                bg-[var(--company-primary)]

                px-4

                admin-text-12
                font-medium

                text-[var(--company-primary-foreground)]

                transition

                hover:bg-[var(--company-primary-hover)]
              "
            >
              <Plus size={14} />

              {t("news.newNews")}
            </button>
          )}
        </div>
      ) : (
        <div
          className="
            mt-6

            overflow-hidden

            rounded-2xl

            border
            border-[var(--admin-border)]

            bg-[var(--admin-surface)]
          "
        >
          {filteredItems.map((item, index) => {
            const title = getNewsTitle(
              item,

              t("news.manager.untitled"),
            );

            const processing = processingId === item.id;

            const canPublish =
              item.status === NEWS_STATUS.DRAFT ||
              item.status === NEWS_STATUS.REVIEW;

            const canUnpublish =
              item.status === NEWS_STATUS.PUBLISHED ||
              item.status === NEWS_STATUS.SCHEDULED;

            const canDelete =
              item.status === NEWS_STATUS.DRAFT ||
              item.status === NEWS_STATUS.REVIEW;

            return (
              <article
                key={item.id}
                className={cn(
                  "flex flex-col gap-4",

                  rowPadding,

                  "transition",

                  "hover:bg-[var(--admin-background)]/60",

                  "lg:flex-row lg:items-center",

                  index !== filteredItems.length - 1 &&
                    "border-b border-[var(--admin-border)]",
                )}
              >
                {/* COVER */}

                <NewsCoverThumbnail
                  companyId={activeCompanyId}
                  mediaId={getCoverMediaId(item)}
                  alt={title}
                />

                {/* CONTENT */}

                <div
                  className="
                      min-w-0
                      flex-1
                    "
                >
                  <div
                    className="
                        flex
                        flex-wrap
                        items-center
                        gap-2
                      "
                  >
                    <h2
                      className="
                          truncate

                          admin-text-14
                          font-semibold

                          text-[var(--admin-foreground)]
                        "
                    >
                      {title}
                    </h2>

                    <StatusBadge
                      status={item.status}
                      size={density === "compact" ? "small" : "default"}
                    />

                    {item.featured && (
                      <span
                        className="
                            inline-flex
                            items-center
                            gap-1

                            rounded-full

                            border
                            border-[var(--company-primary-border)]

                            bg-[var(--company-primary-soft)]

                            px-2
                            py-1

                            admin-text-9
                            font-semibold
                            uppercase
                            tracking-[0.08em]

                            text-[var(--company-primary)]
                          "
                      >
                        <Star size={9} />

                        {t("news.manager.featured")}
                      </span>
                    )}
                  </div>

                  <div
                    className="
                        mt-1
                        truncate

                        admin-text-12

                        text-[var(--admin-muted)]
                      "
                  >
                    /{item.slug}
                  </div>

                  <div
                    className="
                        mt-3

                        flex
                        flex-wrap

                        gap-x-4
                        gap-y-1

                        admin-text-11

                        text-[var(--admin-muted)]
                      "
                  >
                    {item.category && (
                      <span>
                        {t("news.manager.category", {
                          category: item.category,
                        })}
                      </span>
                    )}

                    {item.author && (
                      <span>
                        {t("news.manager.author", {
                          author: item.author,
                        })}
                      </span>
                    )}

                    {item.status === NEWS_STATUS.SCHEDULED &&
                      item.scheduledAt && (
                        <span className="text-amber-600">
                          {t("news.manager.dates.scheduled", {
                            date: formatDateTime(
                              item.scheduledAt,

                              locale,
                            ),
                          })}
                        </span>
                      )}

                    {item.status === NEWS_STATUS.PUBLISHED &&
                      item.publishedAt && (
                        <span className="text-emerald-600">
                          {t("news.manager.dates.published", {
                            date: formatDate(
                              item.publishedAt,

                              locale,
                            ),
                          })}
                        </span>
                      )}

                    {item.updatedAt && (
                      <span>
                        {t("news.manager.dates.updated", {
                          date: formatDate(
                            item.updatedAt,

                            locale,
                          ),
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {/* ACTIONS */}

                <ActionButtonGroup className="shrink-0" align="end">
                  <ActionButton
                    icon={Pencil}
                    label={t("common.edit")}
                    tone="edit"
                    display={actionDisplay}
                    tooltip={tooltipEnabled}
                    tooltipDelay={tooltipDelay}
                    size={actionSize}
                    disabled={Boolean(processingId)}
                    onClick={() => handleEdit(item)}
                  />

                  {canPublish && (
                    <ActionButton
                      icon={Send}
                      label={t("common.publish")}
                      tone="primary"
                      display={actionDisplay}
                      tooltip={tooltipEnabled}
                      tooltipDelay={tooltipDelay}
                      size={actionSize}
                      loading={processing}
                      disabled={Boolean(processingId) && !processing}
                      onClick={() => openPublish(item)}
                    />
                  )}

                  {canUnpublish && (
                    <ActionButton
                      icon={RotateCcw}
                      label={
                        item.status === NEWS_STATUS.SCHEDULED
                          ? t("news.manager.actions.cancelSchedule")
                          : t("common.unpublish")
                      }
                      tone="warning"
                      display={actionDisplay}
                      tooltip={tooltipEnabled}
                      tooltipDelay={tooltipDelay}
                      size={actionSize}
                      loading={processing}
                      disabled={Boolean(processingId) && !processing}
                      onClick={() =>
                        openConfirm(
                          "unpublish",

                          item,
                        )
                      }
                    />
                  )}

                  {canDelete && (
                    <ActionButton
                      icon={Trash2}
                      label={t("common.delete")}
                      tone="danger"
                      display={actionDisplay}
                      tooltip={tooltipEnabled}
                      tooltipDelay={tooltipDelay}
                      size={actionSize}
                      loading={processing}
                      disabled={Boolean(processingId) && !processing}
                      onClick={() =>
                        openConfirm(
                          "delete",

                          item,
                        )
                      }
                    />
                  )}
                </ActionButtonGroup>
              </article>
            );
          })}
        </div>
      )}

      {/* =====================================
          EDITOR
      ===================================== */}

      <NewsEditor
        open={editorOpen}
        companyId={activeCompanyId}
        item={editingItem}
        categorySuggestions={categories}
        tagSuggestions={tagSuggestions}
        onClose={closeEditor}
        onSaved={handleSaved}
      />

      {/* =====================================
          PUBLISH
      ===================================== */}

      <NewsPublishDialog
        open={Boolean(publishItem)}
        item={publishItem}
        loading={Boolean(publishItem?.id) && processingId === publishItem?.id}
        onClose={closePublish}
        onPublishNow={() => publishNews(publishItem, null)}
        onSchedule={(scheduledAt) => publishNews(publishItem, scheduledAt)}
      />

      {/* =====================================
          CONFIRM
      ===================================== */}

      <NewsConfirmDialog
        open={confirmState.open}
        mode={confirmState.mode}
        item={confirmState.item}
        loading={
          Boolean(confirmState.item?.id) &&
          processingId === confirmState.item?.id
        }
        onClose={closeConfirm}
        onConfirm={() => {
          if (confirmState.mode === "delete") {
            deleteNews(confirmState.item);

            return;
          }

          unpublishNews(confirmState.item);
        }}
      />
    </div>
  );
}
