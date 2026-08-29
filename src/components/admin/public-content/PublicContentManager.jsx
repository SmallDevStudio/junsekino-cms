"use client";

import {
  CalendarClock,
  FileText,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
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

import {
  PUBLIC_CONTENT_STATUS,
  PUBLIC_CONTENT_TYPES,
  PUBLIC_PROVIDERS,
} from "@/constants/public-content";

import { cn } from "@/utils/cn";

import PublicContentConfirmDialog from "./PublicContentConfirmDialog";
import PublicContentEditor from "./PublicContentEditor";
import PublicContentPublishDialog from "./PublicContentPublishDialog";
import PublicContentThumbnail from "./PublicContentThumbnail";

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

function getTitle(item, fallback) {
  return getLocalized(item?.title) || item?.slug || fallback;
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

/*
 * =========================================================
 * SKELETON
 * =========================================================
 */

function PublicContentListSkeleton({ density }) {
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
                    w-[38%]

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

function PublicContentStatCard({ icon: Icon, value, label, tone = "neutral" }) {
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
 * PUBLIC CONTENT MANAGER
 * =========================================================
 */

export default function PublicContentManager() {
  const {
    activeCompany,
    activeCompanyId,
    loading: companyLoading,
  } = useCompanyWorkspace();

  const { t, locale } = useAdminTranslation();

  const { actionDisplay, tooltipEnabled, tooltipDelay, density } =
    useAdminUiPreferences();

  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("");

  const [typeFilter, setTypeFilter] = useState("");

  const [providerFilter, setProviderFilter] = useState("");

  const [editorOpen, setEditorOpen] = useState(false);

  const [editingItem, setEditingItem] = useState(null);

  const [publishItem, setPublishItem] = useState(null);

  const [confirmState, setConfirmState] = useState({
    open: false,
    mode: "delete",
    item: null,
  });

  const [processingId, setProcessingId] = useState(null);

  const actionSize = density === "compact" ? "small" : "default";

  const rowPadding =
    density === "compact" ? "p-4" : density === "spacious" ? "p-6" : "p-5";

  /*
   * =======================================================
   * LABELS
   * =======================================================
   */

  function typeLabel(type) {
    const key = `publicContent.types.${type}`;

    return t(key);
  }

  function providerLabel(provider) {
    if (!provider) {
      return "";
    }

    return t(`publicContent.providers.${provider}`);
  }

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
          `/api/v1/companies/${activeCompanyId}/public-contents`,
          {
            method: "GET",

            cache: "no-store",

            credentials: "include",
          },
        );

        const payload = await readResponse(response);

        if (!response.ok || payload?.success === false) {
          throw new Error(
            payload?.message || t("publicContent.manager.errors.loadFailed"),
          );
        }

        setItems(normalizeArray(payload));
      } catch (loadError) {
        console.error("Load public content error:", loadError);

        setError(
          loadError?.message || t("publicContent.manager.errors.loadFailed"),
        );
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
   * FILTER
   * =======================================================
   */

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return items.filter((item) => {
      if (statusFilter && item.status !== statusFilter) {
        return false;
      }

      if (typeFilter && item.contentType !== typeFilter) {
        return false;
      }

      if (providerFilter && item.source?.provider !== providerFilter) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const text = [
        item.title?.th,
        item.title?.en,
        item.slug,
        item.contentType,
        item.source?.provider,
        ...(item.tags || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(keyword);
    });
  }, [items, providerFilter, search, statusFilter, typeFilter]);

  /*
   * =======================================================
   * COUNTS
   * =======================================================
   */

  const counts = useMemo(() => {
    return items.reduce(
      (result, item) => {
        result.total += 1;

        if (item.status === PUBLIC_CONTENT_STATUS.PUBLISHED) {
          result.published += 1;
        }

        if (item.status === PUBLIC_CONTENT_STATUS.DRAFT) {
          result.draft += 1;
        }

        if (item.status === PUBLIC_CONTENT_STATUS.SCHEDULED) {
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

  function handleCloseEditor() {
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
   * DIALOGS
   * =======================================================
   */

  function openPublishDialog(item) {
    setPublishItem(item);
  }

  function closePublishDialog() {
    if (processingId) {
      return;
    }

    setPublishItem(null);
  }

  function openConfirm(mode, item) {
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

  async function publishContent(item, scheduledAt = null) {
    if (!activeCompanyId || !item?.id || processingId) {
      return;
    }

    try {
      setProcessingId(item.id);

      setError(null);

      const response = await fetch(
        `/api/v1/companies/${activeCompanyId}/public-contents/${item.id}/publish`,
        {
          method: "POST",

          credentials: "include",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            scheduledAt,
          }),
        },
      );

      const payload = await readResponse(response);

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.message || t("publicContent.manager.errors.publishFailed"),
        );
      }

      setPublishItem(null);

      toast.success(
        scheduledAt
          ? t("publicContent.manager.messages.scheduled")
          : t("publicContent.manager.messages.published"),
      );

      await loadData({
        silent: true,
      });
    } catch (publishError) {
      console.error("Publish public content error:", publishError);

      toast.error(
        publishError?.message ||
          t("publicContent.manager.errors.publishFailed"),
      );
    } finally {
      setProcessingId(null);
    }
  }

  /*
   * =======================================================
   * UNPUBLISH
   * =======================================================
   */

  async function unpublishContent(item) {
    if (!activeCompanyId || !item?.id || processingId) {
      return;
    }

    try {
      setProcessingId(item.id);

      setError(null);

      const response = await fetch(
        `/api/v1/companies/${activeCompanyId}/public-contents/${item.id}/unpublish`,
        {
          method: "POST",

          credentials: "include",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({}),
        },
      );

      const payload = await readResponse(response);

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.message || t("publicContent.manager.errors.unpublishFailed"),
        );
      }

      setConfirmState({
        open: false,
        mode: "delete",
        item: null,
      });

      toast.success(
        item.status === PUBLIC_CONTENT_STATUS.SCHEDULED
          ? t("publicContent.manager.messages.scheduleCancelled")
          : t("publicContent.manager.messages.unpublished"),
      );

      await loadData({
        silent: true,
      });
    } catch (unpublishError) {
      console.error("Unpublish public content error:", unpublishError);

      toast.error(
        unpublishError?.message ||
          t("publicContent.manager.errors.unpublishFailed"),
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

  async function deleteContent(item) {
    if (!activeCompanyId || !item?.id || processingId) {
      return;
    }

    try {
      setProcessingId(item.id);

      setError(null);

      const response = await fetch(
        `/api/v1/companies/${activeCompanyId}/public-contents/${item.id}`,
        {
          method: "DELETE",

          credentials: "include",
        },
      );

      const payload = await readResponse(response);

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.message || t("publicContent.manager.errors.deleteFailed"),
        );
      }

      setConfirmState({
        open: false,
        mode: "delete",
        item: null,
      });

      toast.success(t("publicContent.manager.messages.deleted"));

      await loadData({
        silent: true,
      });
    } catch (deleteError) {
      console.error("Delete public content error:", deleteError);

      toast.error(
        deleteError?.message || t("publicContent.manager.errors.deleteFailed"),
      );
    } finally {
      setProcessingId(null);
    }
  }

  /*
   * =======================================================
   * WORKSPACE
   * =======================================================
   */

  if (companyLoading) {
    return (
      <div>
        <div
          className="
            h-8
            w-48

            animate-pulse

            rounded

            bg-[var(--admin-hover)]
          "
        />

        <div
          className="
            mt-3

            h-4
            w-[380px]
            max-w-full

            animate-pulse

            rounded

            bg-[var(--admin-hover)]
          "
        />

        <PublicContentListSkeleton density={density} />
      </div>
    );
  }

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
          {t("publicContent.manager.noCompany.title")}
        </div>

        <p
          className="
            mt-1

            admin-text-14

            text-[var(--admin-muted)]
          "
        >
          {t("publicContent.manager.noCompany.description")}
        </p>
      </div>
    );
  }

  const companyName =
    activeCompany.name ||
    activeCompany.displayName ||
    activeCompany.slug ||
    t("publicContent.manager.thisCompany");

  const statusOptions = [
    {
      value: "",
      label: t("publicContent.manager.filters.allStatuses"),
    },
    {
      value: "draft",
      label: t("status.draft"),
    },
    {
      value: "review",
      label: t("status.review"),
    },
    {
      value: "scheduled",
      label: t("status.scheduled"),
    },
    {
      value: "published",
      label: t("status.published"),
    },
    {
      value: "archived",
      label: t("status.archived"),
    },
  ];

  return (
    <div>
      {/* HEADER */}

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
            {t("publicContent.manager.sectionLabel")}
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
            {t("publicContent.title")}
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
            {t("publicContent.manager.description", {
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
            onClick={() =>
              loadData({
                silent: true,
              })
            }
          />

          <ActionButton
            icon={Plus}
            label={t("publicContent.newContent")}
            tone="primary"
            display={actionDisplay}
            tooltip={tooltipEnabled}
            tooltipDelay={tooltipDelay}
            size={actionSize}
            onClick={handleCreate}
          />
        </ActionButtonGroup>
      </div>

      {/* STATS */}

      <div
        className="
          mt-8

          grid
          grid-cols-2
          gap-3

          lg:grid-cols-4
        "
      >
        <PublicContentStatCard
          icon={FileText}
          value={counts.total}
          label={t("publicContent.manager.stats.all")}
          tone="company"
        />

        <PublicContentStatCard
          icon={Send}
          value={counts.published}
          label={t("status.published")}
          tone="success"
        />

        <PublicContentStatCard
          icon={FileText}
          value={counts.draft}
          label={t("status.draft")}
        />

        <PublicContentStatCard
          icon={CalendarClock}
          value={counts.scheduled}
          label={t("status.scheduled")}
          tone="warning"
        />
      </div>

      {/* FILTERS */}

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
            placeholder={t("publicContent.manager.searchPlaceholder")}
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
          {statusOptions.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
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
          <option value="">
            {t("publicContent.manager.filters.allTypes")}
          </option>

          {PUBLIC_CONTENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {typeLabel(type)}
            </option>
          ))}
        </select>

        <select
          value={providerFilter}
          onChange={(event) => setProviderFilter(event.target.value)}
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
          <option value="">
            {t("publicContent.manager.filters.allProviders")}
          </option>

          {PUBLIC_PROVIDERS.map((provider) => (
            <option key={provider} value={provider}>
              {providerLabel(provider)}
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
            {t("publicContent.manager.itemCount", {
              count: filteredItems.length,
            })}
          </span>
        </div>
      </div>

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

      {loading ? (
        <PublicContentListSkeleton density={density} />
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
            <FileText size={21} strokeWidth={1.7} />
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
              ? t("publicContent.manager.empty.title")
              : t("publicContent.manager.empty.searchTitle")}
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
              ? t("publicContent.manager.empty.description")
              : t("publicContent.manager.empty.searchDescription")}
          </p>
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
            const itemProcessing = processingId === item.id;

            const canDelete =
              item.status === PUBLIC_CONTENT_STATUS.DRAFT ||
              item.status === PUBLIC_CONTENT_STATUS.REVIEW;

            const canPublish =
              item.status === PUBLIC_CONTENT_STATUS.DRAFT ||
              item.status === PUBLIC_CONTENT_STATUS.REVIEW;

            const canUnpublish =
              item.status === PUBLIC_CONTENT_STATUS.PUBLISHED ||
              item.status === PUBLIC_CONTENT_STATUS.SCHEDULED;

            const title = getTitle(item, t("publicContent.manager.untitled"));

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
                <PublicContentThumbnail
                  companyId={activeCompanyId}
                  item={item}
                  alt={title}
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

                    <span
                      className="
                          rounded-full

                          border
                          border-[var(--admin-border)]

                          bg-[var(--admin-background)]

                          px-2
                          py-1

                          admin-text-9
                          font-semibold
                          uppercase
                          tracking-[0.08em]

                          text-[var(--admin-muted)]
                        "
                    >
                      {typeLabel(item.contentType)}
                    </span>

                    {item.source?.provider && (
                      <span
                        className="
                            rounded-full

                            border
                            border-[var(--admin-border)]

                            px-2
                            py-1

                            admin-text-9
                            font-semibold
                            uppercase
                            tracking-[0.08em]

                            text-[var(--admin-muted)]
                          "
                      >
                        {providerLabel(item.source.provider)}
                      </span>
                    )}

                    {item.featured && (
                      <span
                        className="
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
                        {t("publicContent.manager.featured")}
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
                    {item.status === PUBLIC_CONTENT_STATUS.SCHEDULED &&
                      item.scheduledAt && (
                        <span className="text-amber-600">
                          {t("publicContent.manager.dates.scheduled", {
                            date: formatDateTime(item.scheduledAt, locale),
                          })}
                        </span>
                      )}

                    {item.status === PUBLIC_CONTENT_STATUS.PUBLISHED &&
                      item.publishedAt && (
                        <span className="text-emerald-600">
                          {t("publicContent.manager.dates.published", {
                            date: formatDate(item.publishedAt, locale),
                          })}
                        </span>
                      )}

                    {item.updatedAt && (
                      <span>
                        {t("publicContent.manager.dates.updated", {
                          date: formatDate(item.updatedAt, locale),
                        })}
                      </span>
                    )}
                  </div>
                </div>

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
                      loading={itemProcessing}
                      disabled={Boolean(processingId) && !itemProcessing}
                      onClick={() => openPublishDialog(item)}
                    />
                  )}

                  {canUnpublish && (
                    <ActionButton
                      icon={RotateCcw}
                      label={
                        item.status === PUBLIC_CONTENT_STATUS.SCHEDULED
                          ? t("publicContent.manager.actions.cancelSchedule")
                          : t("common.unpublish")
                      }
                      tone="warning"
                      display={actionDisplay}
                      tooltip={tooltipEnabled}
                      tooltipDelay={tooltipDelay}
                      size={actionSize}
                      loading={itemProcessing}
                      disabled={Boolean(processingId) && !itemProcessing}
                      onClick={() => openConfirm("unpublish", item)}
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
                      loading={itemProcessing}
                      disabled={Boolean(processingId) && !itemProcessing}
                      onClick={() => openConfirm("delete", item)}
                    />
                  )}
                </ActionButtonGroup>
              </article>
            );
          })}
        </div>
      )}

      <PublicContentEditor
        open={editorOpen}
        companyId={activeCompanyId}
        item={editingItem}
        onClose={handleCloseEditor}
        onSaved={handleSaved}
      />

      <PublicContentPublishDialog
        open={Boolean(publishItem)}
        item={publishItem}
        loading={Boolean(publishItem?.id) && processingId === publishItem?.id}
        onClose={closePublishDialog}
        onPublishNow={() => publishContent(publishItem, null)}
        onSchedule={(scheduledAt) => publishContent(publishItem, scheduledAt)}
      />

      <PublicContentConfirmDialog
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
            deleteContent(confirmState.item);

            return;
          }

          unpublishContent(confirmState.item);
        }}
      />
    </div>
  );
}
