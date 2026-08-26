"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Archive,
  CalendarClock,
  CircleDot,
  FolderKanban,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";

import { useCompanyWorkspace } from "@/components/admin/company/CompanyWorkspaceProvider";
import { cn } from "@/utils/cn";

import ProjectEditor from "./ProjectEditor";

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

function StatusBadge({ status }) {
  const styles = {
    draft: "border-neutral-200 bg-neutral-50 text-neutral-600",
    review: "border-blue-200 bg-blue-50 text-blue-700",
    scheduled: "border-amber-200 bg-amber-50 text-amber-700",
    published: "border-emerald-200 bg-emerald-50 text-emerald-700",
    archived: "border-neutral-200 bg-neutral-100 text-neutral-500",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border",
        "px-2.5 py-1",
        "text-[10px] font-semibold uppercase tracking-[0.08em]",
        styles[status] || "border-neutral-200 bg-neutral-50 text-neutral-500",
      )}
    >
      {status || "unknown"}
    </span>
  );
}

export default function ProjectManager() {
  const {
    activeCompany,
    activeCompanyId,
    loading: companyLoading,
  } = useCompanyWorkspace();

  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

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
          Page Header
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

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              loadData({
                silent: true,
              })
            }
            disabled={refreshing}
            className={cn(
              "inline-flex h-10 items-center justify-center gap-2",
              "rounded-xl",
              "border border-[var(--admin-border)]",
              "bg-[var(--admin-surface)] px-4",
              "text-sm font-medium text-[var(--admin-foreground)]",
              "transition hover:bg-[var(--admin-hover)]",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            <RefreshCw size={15} className={cn(refreshing && "animate-spin")} />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleCreateProject}
            className={cn(
              "inline-flex h-10 items-center justify-center gap-2",
              "rounded-xl",
              "bg-[var(--company-primary)] px-4",
              "text-sm font-medium",
              "text-[var(--company-primary-foreground)]",
              "transition hover:opacity-90",
            )}
          >
            <Plus size={16} />
            New Project
          </button>
        </div>
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

            return (
              <article
                key={project.id}
                className={cn(
                  "flex flex-col gap-4 p-5",
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

                    <StatusBadge status={project.status} />

                    {project.featured && (
                      <span className="rounded-full bg-[var(--company-primary-soft)] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--company-primary)]">
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

                    {project.updatedAt && (
                      <span>Updated {formatDate(project.updatedAt)}</span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditProject(project)}
                    className="h-9 rounded-xl border border-[var(--admin-border)] px-3 text-xs font-medium text-[var(--admin-foreground)] transition hover:bg-[var(--admin-hover)]"
                  >
                    Edit
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* =========================================================
          Project Editor
          One editor instance for both Create and Edit.
      ========================================================= */}

      <ProjectEditor
        open={editorOpen}
        companyId={activeCompanyId}
        project={editingProject}
        categories={categories}
        onClose={handleCloseEditor}
        onSaved={handleProjectSaved}
      />
    </div>
  );
}
