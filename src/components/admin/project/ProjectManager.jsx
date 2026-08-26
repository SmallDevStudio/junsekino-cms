"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Archive,
  CalendarClock,
  CalendarX2,
  CircleDot,
  FolderKanban,
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

import ProjectDeleteDialog from "./ProjectDeleteDialog";
import ProjectEditor from "./ProjectEditor";
import ProjectPublishDialog from "./ProjectPublishDialog";
import ProjectUnpublishDialog from "./ProjectUnpublishDialog";

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

function normalizeArray(payload) {
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
}

function getLocalizedName(value) {
  return value?.en?.trim() || value?.th?.trim() || "";
}

function getProjectTitle(project) {
  return (
    project?.title?.en?.trim() ||
    project?.title?.th?.trim() ||
    project?.slug ||
    "Untitled project"
  );
}

function getCategoryName(category) {
  return (
    category?.name?.en?.trim() ||
    category?.name?.th?.trim() ||
    category?.slug ||
    "Untitled category"
  );
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

export default function ProjectManager() {
  const {
    activeCompany,
    activeCompanyId,
    loading: companyLoading,
  } = useCompanyWorkspace();

  const { actionDisplay, tooltipEnabled, tooltipDelay, density } =
    useAdminUiPreferences();

  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  /*
   * ------------------------------------------------
   * Editor
   * ------------------------------------------------
   */

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  /*
   * ------------------------------------------------
   * Publish
   * ------------------------------------------------
   */

  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishingProject, setPublishingProject] = useState(null);

  /*
   * ------------------------------------------------
   * Unpublish / Cancel Schedule
   * ------------------------------------------------
   */

  const [unpublishDialogOpen, setUnpublishDialogOpen] = useState(false);
  const [unpublishingProject, setUnpublishingProject] = useState(null);

  /*
   * ------------------------------------------------
   * Delete
   * ------------------------------------------------
   */

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState(null);

  /*
   * ------------------------------------------------
   * UI Preference
   * ------------------------------------------------
   */

  const actionSize = density === "compact" ? "small" : "default";

  const rowPadding =
    density === "compact" ? "p-4" : density === "spacious" ? "p-6" : "p-5";

  /*
   * ------------------------------------------------
   * Load
   * ------------------------------------------------
   */

  const loadData = useCallback(
    async ({ silent = false } = {}) => {
      if (!activeCompanyId) {
        setProjects([]);
        setCategories([]);

        return;
      }

      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const [projectsResponse, categoriesResponse] = await Promise.all([
          fetch(`/api/v1/companies/${activeCompanyId}/projects`, {
            method: "GET",
            cache: "no-store",
            credentials: "include",
          }),

          fetch(`/api/v1/companies/${activeCompanyId}/project-categories`, {
            method: "GET",
            cache: "no-store",
            credentials: "include",
          }),
        ]);

        const [projectsPayload, categoriesPayload] = await Promise.all([
          projectsResponse.json(),
          categoriesResponse.json(),
        ]);

        if (!projectsResponse.ok || projectsPayload?.success === false) {
          throw new Error(
            projectsPayload?.message || "Unable to retrieve projects.",
          );
        }

        if (!categoriesResponse.ok || categoriesPayload?.success === false) {
          throw new Error(
            categoriesPayload?.message ||
              "Unable to retrieve project categories.",
          );
        }

        setProjects(normalizeArray(projectsPayload));
        setCategories(normalizeArray(categoriesPayload));
      } catch (loadError) {
        console.error("Load projects error:", loadError);

        setError(loadError?.message || "Unable to retrieve projects.");
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

  /*
   * ------------------------------------------------
   * Derived Data
   * ------------------------------------------------
   */

  const categoryMap = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category]));
  }, [categories]);

  const rootCategories = useMemo(() => {
    return categories.filter(
      (category) =>
        !category.parentId &&
        category.status === "active" &&
        !category.deletedAt,
    );
  }, [categories]);

  const filteredProjects = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return projects.filter((project) => {
      if (statusFilter && project.status !== statusFilter) {
        return false;
      }

      if (categoryFilter && project.categoryId !== categoryFilter) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const text = [
        project.title?.th,
        project.title?.en,
        project.slug,

        project.excerpt?.th,
        project.excerpt?.en,

        project.projectInfo?.location?.th,
        project.projectInfo?.location?.en,

        project.projectInfo?.client?.th,
        project.projectInfo?.client?.en,

        ...(project.tags || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(keyword);
    });
  }, [projects, search, statusFilter, categoryFilter]);

  const counts = useMemo(() => {
    return projects.reduce(
      (result, project) => {
        result.total += 1;

        if (project.status === "published") {
          result.published += 1;
        }

        if (project.status === "draft") {
          result.draft += 1;
        }

        if (project.status === "scheduled") {
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
  }, [projects]);

  /*
   * ------------------------------------------------
   * Editor Handlers
   * ------------------------------------------------
   */

  function handleCreateProject() {
    setEditingProject(null);
    setEditorOpen(true);
  }

  function handleEditProject(project) {
    setEditingProject(project);
    setEditorOpen(true);
  }

  function handleCloseEditor() {
    setEditorOpen(false);
    setEditingProject(null);
  }

  async function handleProjectSaved() {
    setEditorOpen(false);
    setEditingProject(null);

    await loadData({
      silent: true,
    });
  }

  /*
   * ------------------------------------------------
   * Publish Handlers
   * ------------------------------------------------
   */

  function handleOpenPublish(project) {
    setPublishingProject(project);
    setPublishDialogOpen(true);
  }

  function handleClosePublish() {
    setPublishDialogOpen(false);
    setPublishingProject(null);
  }

  /*
   * ------------------------------------------------
   * Unpublish Handlers
   * ------------------------------------------------
   */

  function handleOpenUnpublish(project) {
    setUnpublishingProject(project);
    setUnpublishDialogOpen(true);
  }

  function handleCloseUnpublish() {
    setUnpublishDialogOpen(false);
    setUnpublishingProject(null);
  }

  /*
   * ------------------------------------------------
   * Publish / Unpublish Completed
   * ------------------------------------------------
   */

  async function handleLifecycleCompleted() {
    setPublishDialogOpen(false);
    setPublishingProject(null);

    setUnpublishDialogOpen(false);
    setUnpublishingProject(null);

    await loadData({
      silent: true,
    });
  }

  /*
   * ------------------------------------------------
   * Delete Handlers
   * ------------------------------------------------
   */

  function handleOpenDelete(project) {
    if (project.status === "published" || project.status === "scheduled") {
      return;
    }

    setDeletingProject(project);
    setDeleteDialogOpen(true);
  }

  function handleCloseDelete() {
    setDeleteDialogOpen(false);
    setDeletingProject(null);
  }

  async function handleDeleteCompleted() {
    setDeleteDialogOpen(false);
    setDeletingProject(null);

    await loadData({
      silent: true,
    });
  }

  /*
   * ------------------------------------------------
   * Workspace States
   * ------------------------------------------------
   */

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
          Select a workspace before managing projects.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* =========================================================
          Header
      ========================================================= */}

      <div
        className={cn(
          "flex flex-col gap-5",
          "lg:flex-row lg:items-end lg:justify-between",
        )}
      >
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--admin-muted)]">
            Content Management
          </div>

          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-[var(--admin-foreground)] sm:text-4xl">
            Projects
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--admin-muted)]">
            Manage architecture and design projects for{" "}
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
            label="New Project"
            tone="primary"
            display={actionDisplay}
            tooltip={tooltipEnabled}
            tooltipDelay={tooltipDelay}
            size={actionSize}
            onClick={handleCreateProject}
          />
        </ActionButtonGroup>
      </div>

      {/* =========================================================
          Statistics
      ========================================================= */}

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4">
          <FolderKanban size={17} className="text-[var(--admin-muted)]" />

          <div className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--admin-foreground)]">
            {counts.total}
          </div>

          <div className="mt-1 text-xs text-[var(--admin-muted)]">
            All projects
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4">
          <CircleDot size={17} className="text-emerald-600" />

          <div className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--admin-foreground)]">
            {counts.published}
          </div>

          <div className="mt-1 text-xs text-[var(--admin-muted)]">
            Published
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4">
          <Archive size={17} className="text-[var(--admin-muted)]" />

          <div className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--admin-foreground)]">
            {counts.draft}
          </div>

          <div className="mt-1 text-xs text-[var(--admin-muted)]">Draft</div>
        </div>

        <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4">
          <CalendarClock size={17} className="text-amber-600" />

          <div className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--admin-foreground)]">
            {counts.scheduled}
          </div>

          <div className="mt-1 text-xs text-[var(--admin-muted)]">
            Scheduled
          </div>
        </div>
      </div>

      {/* =========================================================
          Search / Filters
      ========================================================= */}

      <div
        className={cn(
          "mt-6 flex flex-col gap-3",
          "lg:flex-row lg:items-center",
        )}
      >
        <div className="relative flex-1 lg:max-w-sm">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-muted)]"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search projects..."
            className={cn(
              "h-11 w-full rounded-xl",
              "border border-[var(--admin-border)]",
              "bg-[var(--admin-surface)]",
              "pl-10 pr-4",
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
          className={cn(
            "h-11 rounded-xl",
            "border border-[var(--admin-border)]",
            "bg-[var(--admin-surface)] px-3",
            "text-sm text-[var(--admin-foreground)]",
            "outline-none",
            "focus:border-[var(--company-primary)]",
            "focus:ring-2 focus:ring-[var(--company-primary-soft)]",
          )}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className={cn(
            "h-11 rounded-xl",
            "border border-[var(--admin-border)]",
            "bg-[var(--admin-surface)] px-3",
            "text-sm text-[var(--admin-foreground)]",
            "outline-none",
            "focus:border-[var(--company-primary)]",
            "focus:ring-2 focus:ring-[var(--company-primary-soft)]",
          )}
        >
          <option value="">All categories</option>

          {rootCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {getCategoryName(category)}
            </option>
          ))}
        </select>

        <div className="lg:ml-auto">
          <span className="text-xs text-[var(--admin-muted)]">
            {filteredProjects.length}{" "}
            {filteredProjects.length === 1 ? "project" : "projects"}
          </span>
        </div>
      </div>

      {/* =========================================================
          Error
      ========================================================= */}

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* =========================================================
          Projects
      ========================================================= */}

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
      ) : filteredProjects.length === 0 ? (
        <div className="mt-6 flex min-h-[340px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)] p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--company-primary-soft)] text-[var(--company-primary)]">
            <FolderKanban size={21} strokeWidth={1.7} />
          </div>

          <div className="mt-4 text-sm font-medium text-[var(--admin-foreground)]">
            {projects.length === 0 ? "No projects yet" : "No matching projects"}
          </div>

          <p className="mt-1 max-w-sm text-xs leading-5 text-[var(--admin-muted)]">
            {projects.length === 0
              ? "Create the first project for this company."
              : "Try changing the search term or filters."}
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
          {filteredProjects.map((project, index) => {
            const category = categoryMap.get(project.categoryId);

            const subCategory = categoryMap.get(project.subCategoryId);

            const location = getLocalizedName(project.projectInfo?.location);

            const canDelete =
              project.status === "draft" || project.status === "review";

            return (
              <article
                key={project.id}
                className={cn(
                  "flex flex-col gap-4",
                  rowPadding,
                  "lg:flex-row lg:items-center",
                  index !== filteredProjects.length - 1 &&
                    "border-b border-[var(--admin-border)]",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-sm font-semibold text-[var(--admin-foreground)]">
                      {getProjectTitle(project)}
                    </h2>

                    <StatusBadge
                      status={project.status}
                      size={density === "compact" ? "small" : "default"}
                    />

                    {project.featured && (
                      <span className="rounded-full border border-[var(--company-primary-border)] bg-[var(--company-primary-soft)] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--company-primary)]">
                        Featured
                      </span>
                    )}
                  </div>

                  <div className="mt-1 truncate text-xs text-[var(--admin-muted)]">
                    /{project.slug}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[var(--admin-muted)]">
                    {category && (
                      <span>
                        {getCategoryName(category)}

                        {subCategory
                          ? ` / ${getCategoryName(subCategory)}`
                          : ""}
                      </span>
                    )}

                    {location && <span>{location}</span>}

                    {project.projectInfo?.completionYear && (
                      <span>{project.projectInfo.completionYear}</span>
                    )}

                    {project.status === "scheduled" && project.scheduledAt && (
                      <span className="text-amber-600">
                        Scheduled {formatDateTime(project.scheduledAt)}
                      </span>
                    )}

                    {project.status === "published" && project.publishedAt && (
                      <span className="text-emerald-600">
                        Published {formatDate(project.publishedAt)}
                      </span>
                    )}

                    {project.updatedAt && (
                      <span>Updated {formatDate(project.updatedAt)}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}

                <ActionButtonGroup className="shrink-0" align="end">
                  <ActionButton
                    icon={Pencil}
                    label="Edit"
                    tone="edit"
                    display={actionDisplay}
                    tooltip={tooltipEnabled}
                    tooltipDelay={tooltipDelay}
                    size={actionSize}
                    onClick={() => handleEditProject(project)}
                  />

                  {(project.status === "draft" ||
                    project.status === "review") && (
                    <ActionButton
                      icon={Send}
                      label="Publish"
                      tone="primary"
                      display={actionDisplay}
                      tooltip={tooltipEnabled}
                      tooltipDelay={tooltipDelay}
                      size={actionSize}
                      onClick={() => handleOpenPublish(project)}
                    />
                  )}

                  {project.status === "scheduled" && (
                    <ActionButton
                      icon={CalendarX2}
                      label="Cancel Schedule"
                      tone="warning"
                      display={actionDisplay}
                      tooltip={tooltipEnabled}
                      tooltipDelay={tooltipDelay}
                      size={actionSize}
                      onClick={() => handleOpenUnpublish(project)}
                    />
                  )}

                  {project.status === "published" && (
                    <ActionButton
                      icon={RotateCcw}
                      label="Unpublish"
                      tone="warning"
                      display={actionDisplay}
                      tooltip={tooltipEnabled}
                      tooltipDelay={tooltipDelay}
                      size={actionSize}
                      onClick={() => handleOpenUnpublish(project)}
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
                      onClick={() => handleOpenDelete(project)}
                    />
                  )}
                </ActionButtonGroup>
              </article>
            );
          })}
        </div>
      )}

      {/* =========================================================
          Project Editor
      ========================================================= */}

      <ProjectEditor
        open={editorOpen}
        companyId={activeCompanyId}
        project={editingProject}
        categories={categories}
        onClose={handleCloseEditor}
        onSaved={handleProjectSaved}
      />

      {/* =========================================================
          Publish / Schedule
      ========================================================= */}

      <ProjectPublishDialog
        open={publishDialogOpen}
        companyId={activeCompanyId}
        project={publishingProject}
        onClose={handleClosePublish}
        onCompleted={handleLifecycleCompleted}
      />

      {/* =========================================================
          Unpublish / Cancel Schedule
      ========================================================= */}

      <ProjectUnpublishDialog
        open={unpublishDialogOpen}
        companyId={activeCompanyId}
        project={unpublishingProject}
        onClose={handleCloseUnpublish}
        onCompleted={handleLifecycleCompleted}
      />

      {/* =========================================================
          Delete
      ========================================================= */}

      <ProjectDeleteDialog
        open={deleteDialogOpen}
        companyId={activeCompanyId}
        project={deletingProject}
        onClose={handleCloseDelete}
        onCompleted={handleDeleteCompleted}
      />
    </div>
  );
}
