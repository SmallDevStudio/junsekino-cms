"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Award,
  CalendarClock,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Trash2,
} from "lucide-react";

import { useCompanyWorkspace } from "@/components/admin/company/CompanyWorkspaceProvider";
import ActionButton from "@/components/admin/ui/ActionButton";
import ActionButtonGroup from "@/components/admin/ui/ActionButtonGroup";
import StatusBadge from "@/components/admin/ui/StatusBadge";
import { useAdminUiPreferences } from "@/components/admin/ui/AdminUiPreferencesProvider";
import { cn } from "@/utils/cn";

import AwardDeleteDialog from "./AwardDeleteDialog";
import AwardEditor from "./AwardEditor";
import AwardPublishDialog from "./AwardPublishDialog";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "review", label: "Review" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

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

function getAwardTitle(award) {
  return (
    getLocalized(award?.title) ||
    getLocalized(award?.awardInfo?.name) ||
    award?.slug ||
    "Untitled award"
  );
}

function getProjectTitle(project) {
  return getLocalized(project?.title) || project?.slug || "Untitled project";
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

export default function AwardManager() {
  const {
    activeCompany,
    activeCompanyId,
    loading: companyLoading,
  } = useCompanyWorkspace();

  const { actionDisplay, tooltipEnabled, tooltipDelay, density } =
    useAdminUiPreferences();

  const [awards, setAwards] = useState([]);
  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingAward, setEditingAward] = useState(null);

  const [publishOpen, setPublishOpen] = useState(false);
  const [publishingAward, setPublishingAward] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingAward, setDeletingAward] = useState(null);

  const actionSize = density === "compact" ? "small" : "default";

  const rowPadding =
    density === "compact" ? "p-4" : density === "spacious" ? "p-6" : "p-5";

  const loadData = useCallback(
    async ({ silent = false } = {}) => {
      if (!activeCompanyId) {
        setAwards([]);
        setProjects([]);
        return;
      }

      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const [awardResponse, projectResponse] = await Promise.all([
          fetch(`/api/v1/companies/${activeCompanyId}/awards`, {
            method: "GET",
            cache: "no-store",
            credentials: "include",
          }),

          fetch(`/api/v1/companies/${activeCompanyId}/projects`, {
            method: "GET",
            cache: "no-store",
            credentials: "include",
          }),
        ]);

        const [awardPayload, projectPayload] = await Promise.all([
          awardResponse.json(),
          projectResponse.json(),
        ]);

        if (!awardResponse.ok || awardPayload?.success === false) {
          throw new Error(
            awardPayload?.message || "Unable to retrieve awards.",
          );
        }

        if (!projectResponse.ok || projectPayload?.success === false) {
          throw new Error(
            projectPayload?.message || "Unable to retrieve projects.",
          );
        }

        setAwards(normalizeArray(awardPayload));
        setProjects(normalizeArray(projectPayload));
      } catch (loadError) {
        console.error("Load awards error:", loadError);

        setError(loadError?.message || "Unable to retrieve awards.");
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

  const projectMap = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );

  const years = useMemo(() => {
    return [
      ...new Set(awards.map((award) => award.awardInfo?.year).filter(Boolean)),
    ].sort((a, b) => b - a);
  }, [awards]);

  const filteredAwards = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return awards.filter((award) => {
      if (statusFilter && award.status !== statusFilter) {
        return false;
      }

      if (yearFilter && Number(award.awardInfo?.year) !== Number(yearFilter)) {
        return false;
      }

      if (projectFilter && award.projectId !== projectFilter) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const text = [
        award.title?.th,
        award.title?.en,
        award.awardInfo?.name?.th,
        award.awardInfo?.name?.en,
        award.awardInfo?.organization?.th,
        award.awardInfo?.organization?.en,
        award.awardInfo?.category?.th,
        award.awardInfo?.category?.en,
        award.awardInfo?.level?.th,
        award.awardInfo?.level?.en,
        award.slug,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(keyword);
    });
  }, [awards, projectFilter, search, statusFilter, yearFilter]);

  const counts = useMemo(() => {
    return awards.reduce(
      (result, award) => {
        result.total += 1;

        if (award.status === "published") {
          result.published += 1;
        }

        if (award.status === "draft") {
          result.draft += 1;
        }

        if (award.status === "scheduled") {
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
  }, [awards]);

  async function handleSaved() {
    setEditorOpen(false);
    setEditingAward(null);

    await loadData({ silent: true });
  }

  async function handleLifecycleCompleted() {
    setPublishOpen(false);
    setPublishingAward(null);

    await loadData({ silent: true });
  }

  async function handleDeleteCompleted() {
    setDeleteOpen(false);
    setDeletingAward(null);

    await loadData({ silent: true });
  }

  async function handleUnpublish(award) {
    if (!activeCompanyId || !award?.id) {
      return;
    }

    try {
      setRefreshing(true);

      const response = await fetch(
        `/api/v1/companies/${activeCompanyId}/awards/${award.id}/unpublish`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        },
      );

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || "Unable to unpublish award.");
      }

      await loadData({ silent: true });
    } catch (unpublishError) {
      console.error("Unpublish award error:", unpublishError);

      setError(unpublishError?.message || "Unable to unpublish award.");
    } finally {
      setRefreshing(false);
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
          Select a workspace before managing awards.
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
            Awards
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--admin-muted)]">
            Manage awards and project recognition for{" "}
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
            onClick={() => loadData({ silent: true })}
          />

          <ActionButton
            icon={Plus}
            label="New Award"
            tone="primary"
            display={actionDisplay}
            tooltip={tooltipEnabled}
            tooltipDelay={tooltipDelay}
            size={actionSize}
            onClick={() => {
              setEditingAward(null);
              setEditorOpen(true);
            }}
          />
        </ActionButtonGroup>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["All awards", counts.total, Award],
          ["Published", counts.published, Award],
          ["Draft", counts.draft, Award],
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
            placeholder="Search awards..."
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
          value={yearFilter}
          onChange={(event) => setYearFilter(event.target.value)}
          className="h-11 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 text-sm text-[var(--admin-foreground)] outline-none focus:border-[var(--company-primary)]"
        >
          <option value="">All years</option>

          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        <select
          value={projectFilter}
          onChange={(event) => setProjectFilter(event.target.value)}
          className="h-11 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 text-sm text-[var(--admin-foreground)] outline-none focus:border-[var(--company-primary)]"
        >
          <option value="">All projects</option>

          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {getProjectTitle(project)}
            </option>
          ))}
        </select>

        <div className="xl:ml-auto">
          <span className="text-xs text-[var(--admin-muted)]">
            {filteredAwards.length}{" "}
            {filteredAwards.length === 1 ? "award" : "awards"}
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
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)]"
            />
          ))}
        </div>
      ) : filteredAwards.length === 0 ? (
        <div className="mt-6 flex min-h-[340px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)] p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--company-primary-soft)] text-[var(--company-primary)]">
            <Award size={21} strokeWidth={1.7} />
          </div>

          <div className="mt-4 text-sm font-medium text-[var(--admin-foreground)]">
            {awards.length === 0 ? "No awards yet" : "No matching awards"}
          </div>

          <p className="mt-1 max-w-sm text-xs leading-5 text-[var(--admin-muted)]">
            {awards.length === 0
              ? "Create the first award for this company."
              : "Try changing the search term or filters."}
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
          {filteredAwards.map((award, index) => {
            const project = projectMap.get(award.projectId);

            const canDelete =
              award.status === "draft" || award.status === "review";

            return (
              <article
                key={award.id}
                className={cn(
                  "flex flex-col gap-4",
                  rowPadding,
                  "lg:flex-row lg:items-center",
                  index !== filteredAwards.length - 1 &&
                    "border-b border-[var(--admin-border)]",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-sm font-semibold text-[var(--admin-foreground)]">
                      {getAwardTitle(award)}
                    </h2>

                    <StatusBadge
                      status={award.status}
                      size={density === "compact" ? "small" : "default"}
                    />

                    {award.featured && (
                      <span className="rounded-full border border-[var(--company-primary-border)] bg-[var(--company-primary-soft)] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--company-primary)]">
                        Featured
                      </span>
                    )}
                  </div>

                  <div className="mt-1 truncate text-xs text-[var(--admin-muted)]">
                    /{award.slug}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[var(--admin-muted)]">
                    {getLocalized(award.awardInfo?.name) && (
                      <span>{getLocalized(award.awardInfo.name)}</span>
                    )}

                    {getLocalized(award.awardInfo?.organization) && (
                      <span>{getLocalized(award.awardInfo.organization)}</span>
                    )}

                    {award.awardInfo?.year && (
                      <span>{award.awardInfo.year}</span>
                    )}

                    {project && <span>{getProjectTitle(project)}</span>}

                    {award.status === "scheduled" && award.scheduledAt && (
                      <span className="text-amber-600">
                        Scheduled {formatDateTime(award.scheduledAt)}
                      </span>
                    )}

                    {award.status === "published" && award.publishedAt && (
                      <span className="text-emerald-600">
                        Published {formatDate(award.publishedAt)}
                      </span>
                    )}
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
                    onClick={() => {
                      setEditingAward(award);
                      setEditorOpen(true);
                    }}
                  />

                  {(award.status === "draft" || award.status === "review") && (
                    <ActionButton
                      icon={Send}
                      label="Publish"
                      tone="primary"
                      display={actionDisplay}
                      tooltip={tooltipEnabled}
                      tooltipDelay={tooltipDelay}
                      size={actionSize}
                      onClick={() => {
                        setPublishingAward(award);
                        setPublishOpen(true);
                      }}
                    />
                  )}

                  {(award.status === "published" ||
                    award.status === "scheduled") && (
                    <ActionButton
                      icon={RotateCcw}
                      label={
                        award.status === "scheduled"
                          ? "Cancel Schedule"
                          : "Unpublish"
                      }
                      tone="warning"
                      display={actionDisplay}
                      tooltip={tooltipEnabled}
                      tooltipDelay={tooltipDelay}
                      size={actionSize}
                      onClick={() => handleUnpublish(award)}
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
                      onClick={() => {
                        setDeletingAward(award);
                        setDeleteOpen(true);
                      }}
                    />
                  )}
                </ActionButtonGroup>
              </article>
            );
          })}
        </div>
      )}

      <AwardEditor
        open={editorOpen}
        companyId={activeCompanyId}
        award={editingAward}
        projects={projects}
        onClose={() => {
          setEditorOpen(false);
          setEditingAward(null);
        }}
        onSaved={handleSaved}
      />

      <AwardPublishDialog
        open={publishOpen}
        companyId={activeCompanyId}
        award={publishingAward}
        onClose={() => {
          setPublishOpen(false);
          setPublishingAward(null);
        }}
        onCompleted={handleLifecycleCompleted}
      />

      <AwardDeleteDialog
        open={deleteOpen}
        companyId={activeCompanyId}
        award={deletingAward}
        onClose={() => {
          setDeleteOpen(false);
          setDeletingAward(null);
        }}
        onCompleted={handleDeleteCompleted}
      />
    </div>
  );
}
