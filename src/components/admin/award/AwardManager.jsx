"use client";

import {
  Award,
  CalendarClock,
  CircleDot,
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

import { cn } from "@/utils/cn";

import AwardCoverThumbnail from "./AwardCoverThumbnail";
import AwardDeleteDialog from "./AwardDeleteDialog";
import AwardEditor from "./AwardEditor";
import AwardPublishDialog from "./AwardPublishDialog";

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

function getAwardTitle(award, fallback) {
  return (
    getLocalized(award?.title) ||
    getLocalized(award?.awardInfo?.name) ||
    award?.slug ||
    fallback
  );
}

function getProjectTitle(project, fallback) {
  return getLocalized(project?.title) || project?.slug || fallback;
}

function getProjectCoverMediaId(project) {
  return project?.featuredImage?.mediaId || project?.cover?.mediaId || null;
}

function getAwardCoverMediaId(award) {
  return award?.featuredImage?.mediaId || null;
}

/*
 * =========================================================
 * DATE
 * =========================================================
 */

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

/*
 * =========================================================
 * SKELETON
 * =========================================================
 */

function AwardListSkeleton({ density }) {
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
                    w-[34%]

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
                  w-[22%]

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
                    w-28

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

              <div
                className="
                    h-3
                    w-16

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
 * STAT
 * =========================================================
 */

function AwardStatCard({ icon: Icon, value, label, tone = "neutral" }) {
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
 * AWARD MANAGER
 * =========================================================
 */

export default function AwardManager() {
  const {
    activeCompany,
    activeCompanyId,

    loading: companyLoading,
  } = useCompanyWorkspace();

  const { t, locale } = useAdminTranslation();

  const {
    actionDisplay,

    tooltipEnabled,

    tooltipDelay,

    density,
  } = useAdminUiPreferences();

  const [awards, setAwards] = useState([]);

  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("");

  const [yearFilter, setYearFilter] = useState("");

  const [projectFilter, setProjectFilter] = useState("");

  /*
   * =======================================================
   * EDITOR
   * =======================================================
   */

  const [editorOpen, setEditorOpen] = useState(false);

  const [editingAward, setEditingAward] = useState(null);

  /*
   * =======================================================
   * PUBLISH
   * =======================================================
   */

  const [publishOpen, setPublishOpen] = useState(false);

  const [publishingAward, setPublishingAward] = useState(null);

  /*
   * =======================================================
   * DELETE
   * =======================================================
   */

  const [deleteOpen, setDeleteOpen] = useState(false);

  const [deletingAward, setDeletingAward] = useState(null);

  /*
   * =======================================================
   * ACTION BUSY
   * =======================================================
   */

  const [lifecycleAwardId, setLifecycleAwardId] = useState(null);

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
            awardPayload?.message || t("award.manager.errors.loadAwards"),
          );
        }

        if (!projectResponse.ok || projectPayload?.success === false) {
          throw new Error(
            projectPayload?.message || t("award.manager.errors.loadProjects"),
          );
        }

        setAwards(normalizeArray(awardPayload));

        setProjects(normalizeArray(projectPayload));
      } catch (loadError) {
        console.error("Load awards error:", loadError);

        setError(loadError?.message || t("award.manager.errors.loadAwards"));
      } finally {
        setLoading(false);

        setRefreshing(false);
      }
    },
    [activeCompanyId, t],
  );

  /*
   * React Compiler-safe.
   */

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
   * PROJECT MAP
   * =======================================================
   */

  const projectMap = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );

  /*
   * =======================================================
   * YEARS
   * =======================================================
   */

  const years = useMemo(() => {
    return [
      ...new Set(awards.map((award) => award.awardInfo?.year).filter(Boolean)),
    ].sort((first, second) => second - first);
  }, [awards]);

  /*
   * =======================================================
   * FILTER
   * =======================================================
   */

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

      const project = projectMap.get(award.projectId);

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

        project?.title?.en,

        project?.title?.th,

        award.slug,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(keyword);
    });
  }, [awards, projectFilter, projectMap, search, statusFilter, yearFilter]);

  /*
   * =======================================================
   * COUNTS
   * =======================================================
   */

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

  /*
   * =======================================================
   * EDITOR
   * =======================================================
   */

  function handleCreate() {
    setEditingAward(null);

    setEditorOpen(true);
  }

  function handleEdit(award) {
    setEditingAward(award);

    setEditorOpen(true);
  }

  async function handleSaved() {
    setEditorOpen(false);

    setEditingAward(null);

    await loadData({
      silent: true,
    });
  }

  /*
   * =======================================================
   * PUBLISH
   * =======================================================
   */

  function handleOpenPublish(award) {
    setPublishingAward(award);

    setPublishOpen(true);
  }

  async function handleLifecycleCompleted() {
    setPublishOpen(false);

    setPublishingAward(null);

    await loadData({
      silent: true,
    });
  }

  /*
   * =======================================================
   * UNPUBLISH
   * =======================================================
   */

  async function handleUnpublish(award) {
    if (!activeCompanyId || !award?.id || lifecycleAwardId) {
      return;
    }

    try {
      setLifecycleAwardId(award.id);

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
        throw new Error(
          payload?.message || t("award.manager.errors.unpublishFailed"),
        );
      }

      toast.success(
        award.status === "scheduled"
          ? t("award.manager.messages.scheduleCancelled")
          : t("award.manager.messages.unpublished"),
      );

      await loadData({
        silent: true,
      });
    } catch (unpublishError) {
      console.error("Unpublish award error:", unpublishError);

      toast.error(
        unpublishError?.message || t("award.manager.errors.unpublishFailed"),
      );
    } finally {
      setLifecycleAwardId(null);
    }
  }

  /*
   * =======================================================
   * DELETE
   * =======================================================
   */

  async function handleDeleteCompleted() {
    setDeleteOpen(false);

    setDeletingAward(null);

    await loadData({
      silent: true,
    });
  }

  /*
   * =======================================================
   * LOADING WORKSPACE
   * =======================================================
   */

  if (companyLoading) {
    return (
      <div
        className="
          min-h-[420px]
        "
      >
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

        <AwardListSkeleton density={density} />
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
          {t("award.manager.noCompany.title")}
        </div>

        <p
          className="
            mt-1

            admin-text-14

            text-[var(--admin-muted)]
          "
        >
          {t("award.manager.noCompany.description")}
        </p>
      </div>
    );
  }

  const companyName =
    activeCompany.name ||
    activeCompany.displayName ||
    activeCompany.slug ||
    t("award.manager.thisCompany");

  /*
   * =======================================================
   * FILTER OPTIONS
   * =======================================================
   */

  const statusOptions = [
    {
      value: "",
      label: t("award.manager.filters.allStatuses"),
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
            {t("award.manager.sectionLabel")}
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
            {t("award.title")}
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
            {t("award.manager.description", {
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
            label={t("award.newAward")}
            tone="primary"
            display={actionDisplay}
            tooltip={tooltipEnabled}
            tooltipDelay={tooltipDelay}
            size={actionSize}
            onClick={handleCreate}
          />
        </ActionButtonGroup>
      </div>

      {/* =====================================
          STATISTICS
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
        <AwardStatCard
          icon={Award}
          value={counts.total}
          label={t("award.manager.stats.all")}
          tone="company"
        />

        <AwardStatCard
          icon={CircleDot}
          value={counts.published}
          label={t("status.published")}
          tone="success"
        />

        <AwardStatCard
          icon={Award}
          value={counts.draft}
          label={t("status.draft")}
        />

        <AwardStatCard
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
            placeholder={t("award.manager.searchPlaceholder")}
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
          value={yearFilter}
          onChange={(event) => setYearFilter(event.target.value)}
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
          <option value="">{t("award.manager.filters.allYears")}</option>

          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        <select
          value={projectFilter}
          onChange={(event) => setProjectFilter(event.target.value)}
          className="
            h-11

            max-w-full

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

            xl:max-w-[260px]
          "
        >
          <option value="">{t("award.manager.filters.allProjects")}</option>

          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {getProjectTitle(
                project,

                t("award.manager.untitledProject"),
              )}
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
            {t("award.manager.awardCount", {
              count: filteredAwards.length,
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
        <AwardListSkeleton density={density} />
      ) : filteredAwards.length === 0 ? (
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
            <Award size={21} strokeWidth={1.7} />
          </div>

          <div
            className="
              mt-4

              admin-text-14
              font-medium

              text-[var(--admin-foreground)]
            "
          >
            {awards.length === 0
              ? t("award.manager.empty.title")
              : t("award.manager.empty.searchTitle")}
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
            {awards.length === 0
              ? t("award.manager.empty.description")
              : t("award.manager.empty.searchDescription")}
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
          {filteredAwards.map((award, index) => {
            const project = projectMap.get(award.projectId);

            const canDelete =
              award.status === "draft" || award.status === "review";

            const title = getAwardTitle(
              award,

              t("award.manager.untitledAward"),
            );

            const projectTitle = project
              ? getProjectTitle(
                  project,

                  t("award.manager.untitledProject"),
                )
              : null;

            const ownCoverMediaId = getAwardCoverMediaId(award);

            const projectCoverMediaId = getProjectCoverMediaId(project);

            const organization = getLocalized(award.awardInfo?.organization);

            const awardName = getLocalized(award.awardInfo?.name);

            const category = getLocalized(award.awardInfo?.category);

            const busy = lifecycleAwardId === award.id;

            return (
              <article
                key={award.id}
                className={cn(
                  "flex flex-col gap-4",

                  rowPadding,

                  "transition",

                  "hover:bg-[var(--admin-background)]/60",

                  "lg:flex-row lg:items-center",

                  index !== filteredAwards.length - 1 &&
                    "border-b border-[var(--admin-border)]",
                )}
              >
                {/* =========================
                      COVER
                  ========================= */}

                <AwardCoverThumbnail
                  companyId={activeCompanyId}
                  mediaId={ownCoverMediaId}
                  fallbackMediaId={projectCoverMediaId}
                  alt={title}
                />

                {/* =========================
                      INFORMATION
                  ========================= */}

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
                      status={award.status}
                      size={density === "compact" ? "small" : "default"}
                    />

                    {award.featured && (
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
                        {t("award.manager.featured")}
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
                    /{award.slug}
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
                    {awardName && <span>{awardName}</span>}

                    {organization && <span>{organization}</span>}

                    {category && <span>{category}</span>}

                    {award.awardInfo?.year && (
                      <span>{award.awardInfo.year}</span>
                    )}

                    {projectTitle && (
                      <span
                        className="
                            font-medium

                            text-[var(--company-primary)]
                          "
                      >
                        {t("award.manager.project", {
                          project: projectTitle,
                        })}
                      </span>
                    )}

                    {award.status === "scheduled" && award.scheduledAt && (
                      <span
                        className="
                              text-amber-600
                            "
                      >
                        {t("award.manager.dates.scheduled", {
                          date: formatDateTime(award.scheduledAt, locale),
                        })}
                      </span>
                    )}

                    {award.status === "published" && award.publishedAt && (
                      <span
                        className="
                              text-emerald-600
                            "
                      >
                        {t("award.manager.dates.published", {
                          date: formatDate(award.publishedAt, locale),
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {/* =========================
                      ACTIONS
                  ========================= */}

                <ActionButtonGroup className="shrink-0" align="end">
                  <ActionButton
                    icon={Pencil}
                    label={t("common.edit")}
                    tone="edit"
                    display={actionDisplay}
                    tooltip={tooltipEnabled}
                    tooltipDelay={tooltipDelay}
                    size={actionSize}
                    onClick={() => handleEdit(award)}
                  />

                  {(award.status === "draft" || award.status === "review") && (
                    <ActionButton
                      icon={Send}
                      label={t("common.publish")}
                      tone="primary"
                      display={actionDisplay}
                      tooltip={tooltipEnabled}
                      tooltipDelay={tooltipDelay}
                      size={actionSize}
                      onClick={() => handleOpenPublish(award)}
                    />
                  )}

                  {(award.status === "published" ||
                    award.status === "scheduled") && (
                    <ActionButton
                      icon={RotateCcw}
                      label={
                        award.status === "scheduled"
                          ? t("award.manager.actions.cancelSchedule")
                          : t("common.unpublish")
                      }
                      tone="warning"
                      display={actionDisplay}
                      tooltip={tooltipEnabled}
                      tooltipDelay={tooltipDelay}
                      size={actionSize}
                      loading={busy}
                      disabled={Boolean(lifecycleAwardId) && !busy}
                      onClick={() => handleUnpublish(award)}
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

      {/* =====================================
          EDITOR
      ===================================== */}

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

      {/* =====================================
          PUBLISH
      ===================================== */}

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

      {/* =====================================
          DELETE
      ===================================== */}

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
