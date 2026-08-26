"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  CalendarClock,
  FileText,
  LoaderCircle,
  Pencil,
  PlaySquare,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Trash2,
} from "lucide-react";

import { toast } from "sonner";

import { useCompanyWorkspace } from "@/components/admin/company/CompanyWorkspaceProvider";

import ActionButton from "@/components/admin/ui/ActionButton";
import ActionButtonGroup from "@/components/admin/ui/ActionButtonGroup";
import StatusBadge from "@/components/admin/ui/StatusBadge";
import { useAdminUiPreferences } from "@/components/admin/ui/AdminUiPreferencesProvider";

import {
  PUBLIC_CONTENT_STATUS,
  PUBLIC_CONTENT_TYPE,
  PUBLIC_CONTENT_TYPES,
  PUBLIC_PROVIDERS,
} from "@/constants/public-content";

import { cn } from "@/utils/cn";

import PublicContentConfirmDialog from "./PublicContentConfirmDialog";
import PublicContentEditor from "./PublicContentEditor";
import PublicContentPublishDialog from "./PublicContentPublishDialog";

const STATUS_OPTIONS = [
  {
    value: "",
    label: "All statuses",
  },
  {
    value: "draft",
    label: "Draft",
  },
  {
    value: "review",
    label: "Review",
  },
  {
    value: "scheduled",
    label: "Scheduled",
  },
  {
    value: "published",
    label: "Published",
  },
  {
    value: "archived",
    label: "Archived",
  },
];

const TYPE_LABELS = {
  article: "Article",
  video: "Video",
  embed: "Embed",
};

const PROVIDER_LABELS = {
  youtube: "YouTube",
  facebook: "Facebook",
  vimeo: "Vimeo",
  instagram: "Instagram",
  tiktok: "TikTok",
  other: "Other",
};

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

function getTitle(item) {
  return getLocalized(item?.title) || item?.slug || "Untitled content";
}

function formatDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
}

function formatDateTime(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getTypeIcon(type) {
  if (type === PUBLIC_CONTENT_TYPE.ARTICLE) {
    return FileText;
  }

  return PlaySquare;
}

async function readResponse(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export default function PublicContentManager() {
  const {
    activeCompany,
    activeCompanyId,
    loading: companyLoading,
  } = useCompanyWorkspace();

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
            payload?.message || "Unable to retrieve public content.",
          );
        }

        setItems(normalizeArray(payload));
      } catch (loadError) {
        console.error("Load public content error:", loadError);

        setError(loadError?.message || "Unable to retrieve public content.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeCompanyId],
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
          payload?.message || "Unable to publish public content.",
        );
      }

      setPublishItem(null);

      toast.success(
        scheduledAt
          ? "Public content scheduled successfully."
          : "Public content published successfully.",
      );

      await loadData({
        silent: true,
      });
    } catch (publishError) {
      console.error("Publish public content error:", publishError);

      toast.error(publishError?.message || "Unable to publish public content.");
    } finally {
      setProcessingId(null);
    }
  }

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
          payload?.message || "Unable to unpublish public content.",
        );
      }

      setConfirmState({
        open: false,
        mode: "delete",
        item: null,
      });

      toast.success(
        item.status === PUBLIC_CONTENT_STATUS.SCHEDULED
          ? "Scheduled publish cancelled."
          : "Public content unpublished.",
      );

      await loadData({
        silent: true,
      });
    } catch (unpublishError) {
      console.error("Unpublish public content error:", unpublishError);

      toast.error(
        unpublishError?.message || "Unable to unpublish public content.",
      );
    } finally {
      setProcessingId(null);
    }
  }

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
        throw new Error(payload?.message || "Unable to delete public content.");
      }

      setConfirmState({
        open: false,
        mode: "delete",
        item: null,
      });

      toast.success("Public content deleted.");

      await loadData({
        silent: true,
      });
    } catch (deleteError) {
      console.error("Delete public content error:", deleteError);

      toast.error(deleteError?.message || "Unable to delete public content.");
    } finally {
      setProcessingId(null);
    }
  }

  if (companyLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-[var(--admin-muted)]">
          <LoaderCircle size={16} className="animate-spin" />
          Loading workspace...
        </div>
      </div>
    );
  }

  if (!activeCompany) {
    return (
      <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-8">
        <div className="text-sm font-medium text-[var(--admin-foreground)]">
          No company selected
        </div>

        <p className="mt-1 text-sm text-[var(--admin-muted)]">
          Select a workspace before managing public content.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--admin-muted)]">
            Content Management
          </div>

          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-[var(--admin-foreground)] sm:text-4xl">
            Public Content
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--admin-muted)]">
            Manage articles, videos and external media for{" "}
            <span className="font-medium text-[var(--admin-foreground)]">
              {activeCompany.name ||
                activeCompany.displayName ||
                activeCompany.slug ||
                "this company"}
            </span>
            .
          </p>
        </div>

        <ActionButtonGroup>
          <ActionButton
            icon={RefreshCw}
            label="Refresh"
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
            label="New Content"
            tone="primary"
            display={actionDisplay}
            tooltip={tooltipEnabled}
            tooltipDelay={tooltipDelay}
            size={actionSize}
            onClick={handleCreate}
          />
        </ActionButtonGroup>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["All content", counts.total, FileText],
          ["Published", counts.published, Send],
          ["Draft", counts.draft, FileText],
          ["Scheduled", counts.scheduled, CalendarClock],
        ].map(([label, value, Icon]) => (
          <div
            key={label}
            className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4"
          >
            <Icon size={17} className="text-[var(--admin-muted)]" />

            <div className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--admin-foreground)]">
              {value}
            </div>

            <div className="mt-1 text-xs text-[var(--admin-muted)]">
              {label}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative flex-1 xl:max-w-sm">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-muted)]"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search public content..."
            className={cn(
              "h-11 w-full rounded-xl",
              "border border-[var(--admin-border)]",
              "bg-[var(--admin-surface)] pl-10 pr-4",
              "text-sm text-[var(--admin-foreground)]",
              "outline-none transition",
              "placeholder:text-[var(--admin-muted-light)]",
              "focus:border-[var(--company-primary)]",
              "focus:ring-2 focus:ring-[var(--company-primary-soft)]",
            )}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-11 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 text-sm text-[var(--admin-foreground)] outline-none focus:border-[var(--company-primary)]"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          className="h-11 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 text-sm text-[var(--admin-foreground)] outline-none focus:border-[var(--company-primary)]"
        >
          <option value="">All types</option>

          {PUBLIC_CONTENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {TYPE_LABELS[type] || type}
            </option>
          ))}
        </select>

        <select
          value={providerFilter}
          onChange={(event) => setProviderFilter(event.target.value)}
          className="h-11 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 text-sm text-[var(--admin-foreground)] outline-none focus:border-[var(--company-primary)]"
        >
          <option value="">All providers</option>

          {PUBLIC_PROVIDERS.map((provider) => (
            <option key={provider} value={provider}>
              {PROVIDER_LABELS[provider] || provider}
            </option>
          ))}
        </select>

        <div className="xl:ml-auto">
          <span className="text-xs text-[var(--admin-muted)]">
            {filteredItems.length}{" "}
            {filteredItems.length === 1 ? "item" : "items"}
          </span>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-6 space-y-3">
          {Array.from({
            length: 6,
          }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)]"
            />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="mt-6 flex min-h-[340px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)] p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--company-primary-soft)] text-[var(--company-primary)]">
            <FileText size={21} strokeWidth={1.7} />
          </div>

          <div className="mt-4 text-sm font-medium text-[var(--admin-foreground)]">
            {items.length === 0
              ? "No public content yet"
              : "No matching content"}
          </div>

          <p className="mt-1 max-w-sm text-xs leading-5 text-[var(--admin-muted)]">
            {items.length === 0
              ? "Create the first public content item for this company."
              : "Try changing the search term or filters."}
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
          {filteredItems.map((item, index) => {
            const Icon = getTypeIcon(item.contentType);

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

            return (
              <article
                key={item.id}
                className={cn(
                  "flex flex-col gap-4",
                  rowPadding,
                  "lg:flex-row lg:items-center",
                  index !== filteredItems.length - 1 &&
                    "border-b border-[var(--admin-border)]",
                )}
              >
                <div className="flex min-w-0 flex-1 gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-background)] text-[var(--admin-muted)]">
                    <Icon size={17} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-sm font-semibold text-[var(--admin-foreground)]">
                        {getTitle(item)}
                      </h2>

                      <StatusBadge
                        status={item.status}
                        size={density === "compact" ? "small" : "default"}
                      />

                      <span className="rounded-full border border-[var(--admin-border)] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--admin-muted)]">
                        {TYPE_LABELS[item.contentType] || item.contentType}
                      </span>

                      {item.featured && (
                        <span className="rounded-full border border-[var(--company-primary-border)] bg-[var(--company-primary-soft)] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--company-primary)]">
                          Featured
                        </span>
                      )}
                    </div>

                    <div className="mt-1 truncate text-xs text-[var(--admin-muted)]">
                      /{item.slug}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[var(--admin-muted)]">
                      {item.source?.provider && (
                        <span>
                          {PROVIDER_LABELS[item.source.provider] ||
                            item.source.provider}
                        </span>
                      )}

                      {item.status === PUBLIC_CONTENT_STATUS.SCHEDULED &&
                        item.scheduledAt && (
                          <span className="text-amber-600">
                            Scheduled {formatDateTime(item.scheduledAt)}
                          </span>
                        )}

                      {item.status === PUBLIC_CONTENT_STATUS.PUBLISHED &&
                        item.publishedAt && (
                          <span className="text-emerald-600">
                            Published {formatDate(item.publishedAt)}
                          </span>
                        )}

                      {item.updatedAt && (
                        <span>Updated {formatDate(item.updatedAt)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <ActionButtonGroup className="shrink-0" align="end">
                  <ActionButton
                    icon={Pencil}
                    label="Edit"
                    tone="edit"
                    display={actionDisplay}
                    tooltip={tooltipEnabled}
                    tooltipDelay={tooltipDelay}
                    size={actionSize}
                    disabled={Boolean(processingId) || itemProcessing}
                    onClick={() => handleEdit(item)}
                  />

                  {canPublish && (
                    <ActionButton
                      icon={Send}
                      label="Publish"
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
                          ? "Cancel Schedule"
                          : "Unpublish"
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
                      label="Delete"
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
