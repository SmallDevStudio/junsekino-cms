"use client";

import {
  ArrowUpDown,
  File,
  FileImage,
  Image as ImageIcon,
  ListFilter,
  RefreshCw,
  Search,
  Upload,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useCompanyWorkspace } from "@/components/admin/company/CompanyWorkspaceProvider";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { cn } from "@/utils/cn";

import MediaCard from "./MediaCard";
import MediaDeleteDialog from "./MediaDeleteDialog";
import MediaDetailDrawer from "./MediaDetailDrawer";
import MediaUploadDialog from "./MediaUploadDialog";

/*
 * =========================================================
 * CONSTANTS
 * =========================================================
 */

const FILTER = Object.freeze({
  ALL: "all",
  IMAGE: "image",
  DOCUMENT: "document",
  OTHER: "other",
});

const SORT = Object.freeze({
  NEWEST: "newest",
  OLDEST: "oldest",
  NAME_ASC: "name-asc",
  NAME_DESC: "name-desc",
  SIZE_DESC: "size-desc",
  SIZE_ASC: "size-asc",
});

const DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",

  "application/msword",

  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  "application/vnd.ms-excel",

  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

  "application/vnd.ms-powerpoint",

  "application/vnd.openxmlformats-officedocument.presentationml.presentation",

  "text/plain",

  "text/csv",
]);

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function normalizeMediaResponse(payload) {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (Array.isArray(payload.media)) {
    return payload.media;
  }

  if (Array.isArray(payload.data?.media)) {
    return payload.data.media;
  }

  return [];
}

function getMediaName(media, fallback = "") {
  return (
    media?.title?.en ||
    media?.title?.th ||
    media?.originalFileName ||
    media?.fileName ||
    media?.name ||
    media?.id ||
    fallback
  );
}

function getMediaCategory(media) {
  const mimeType = String(media?.mimeType || "").toLowerCase();

  if (mimeType.startsWith("image/")) {
    return FILTER.IMAGE;
  }

  if (DOCUMENT_MIME_TYPES.has(mimeType)) {
    return FILTER.DOCUMENT;
  }

  return FILTER.OTHER;
}

function getTimestamp(value) {
  if (!value) {
    return 0;
  }

  if (typeof value === "string" || typeof value === "number") {
    const result = new Date(value).getTime();

    return Number.isFinite(result) ? result : 0;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (Number.isFinite(value?.seconds)) {
    return value.seconds * 1000;
  }

  if (Number.isFinite(value?._seconds)) {
    return value._seconds * 1000;
  }

  return 0;
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

function MediaCardSkeleton() {
  return (
    <div
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
          aspect-[4/3]

          animate-pulse

          bg-[var(--admin-hover)]
        "
      />

      <div className="p-4">
        <div
          className="
            h-3.5
            w-3/4

            animate-pulse

            rounded

            bg-[var(--admin-hover)]
          "
        />

        <div
          className="
            mt-2

            h-2.5
            w-1/2

            animate-pulse

            rounded

            bg-[var(--admin-hover)]
          "
        />
      </div>
    </div>
  );
}

/*
 * =========================================================
 * SUMMARY CARD
 * =========================================================
 */

function SummaryCard({
  active,

  icon,

  label,

  count,

  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-w-0 items-center gap-3",

        "rounded-2xl border",

        "px-4 py-4",

        "text-left",

        "transition",

        active
          ? "border-[var(--company-primary-border)] bg-[var(--company-primary-soft)]"
          : "border-[var(--admin-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-hover)]",
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",

          active
            ? "bg-white text-[var(--company-primary)]"
            : "bg-[var(--admin-background)] text-[var(--admin-muted)]",
        )}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <div
          className="
            admin-text-10

            text-[var(--admin-muted)]
          "
        >
          {label}
        </div>

        <div
          className="
            mt-0.5

            admin-text-20
            font-semibold
            tracking-[-0.035em]

            text-[var(--admin-foreground)]
          "
        >
          {count}
        </div>
      </div>
    </button>
  );
}

/*
 * =========================================================
 * MANAGER
 * =========================================================
 */

export default function MediaManager() {
  const {
    activeCompany,
    activeCompanyId,
    loading: companyLoading,
  } = useCompanyWorkspace();

  const { t } = useAdminTranslation();

  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");

  const [filter, setFilter] = useState(FILTER.ALL);

  const [sort, setSort] = useState(SORT.NEWEST);

  const [uploadOpen, setUploadOpen] = useState(false);

  const [selectedMedia, setSelectedMedia] = useState(null);

  /*
   * DELETE
   */

  const [deleteMedia, setDeleteMedia] = useState(null);

  const [deleteUsage, setDeleteUsage] = useState(null);

  const [deleteUsageLoading, setDeleteUsageLoading] = useState(false);

  const [deleteUsageError, setDeleteUsageError] = useState(null);

  /*
   * =======================================================
   * LOAD MEDIA
   * =======================================================
   */

  const loadMedia = useCallback(
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
          `/api/v1/companies/${activeCompanyId}/media`,
          {
            method: "GET",

            cache: "no-store",

            credentials: "include",
          },
        );

        const payload = await readResponse(response);

        if (!response.ok || payload?.success === false) {
          throw new Error(
            payload?.message || t("media.manager.errors.loadFailed"),
          );
        }

        setItems(
          normalizeMediaResponse(payload).filter((item) => !item?.deletedAt),
        );
      } catch (loadError) {
        console.error("Load media error:", loadError);

        setError(loadError?.message || t("media.manager.errors.loadFailed"));
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
      loadMedia();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeCompanyId, loadMedia]);

  /*
   * =======================================================
   * SUMMARY
   * =======================================================
   */

  const summary = useMemo(() => {
    const result = {
      all: items.length,

      image: 0,

      document: 0,

      other: 0,
    };

    items.forEach((media) => {
      const category = getMediaCategory(media);

      result[category] += 1;
    });

    return result;
  }, [items]);

  /*
   * =======================================================
   * FILTER / SEARCH / SORT
   * =======================================================
   */

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    let result = items.filter((media) => {
      if (filter !== FILTER.ALL && getMediaCategory(media) !== filter) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const text = [
        media.id,

        media.originalFileName,

        media.fileName,

        media.mimeType,

        media.type,

        media.usage,

        media.status,

        media.title?.en,

        media.title?.th,

        media.alt?.en,

        media.alt?.th,

        media.caption?.en,

        media.caption?.th,

        media.description?.en,

        media.description?.th,

        ...(Array.isArray(media.tags) ? media.tags : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(keyword);
    });

    result = [...result].sort((first, second) => {
      switch (sort) {
        case SORT.OLDEST:
          return (
            getTimestamp(first?.createdAt) - getTimestamp(second?.createdAt)
          );

        case SORT.NAME_ASC:
          return getMediaName(first).localeCompare(getMediaName(second));

        case SORT.NAME_DESC:
          return getMediaName(second).localeCompare(getMediaName(first));

        case SORT.SIZE_DESC:
          return Number(second?.size || 0) - Number(first?.size || 0);

        case SORT.SIZE_ASC:
          return Number(first?.size || 0) - Number(second?.size || 0);

        case SORT.NEWEST:
        default:
          return (
            (getTimestamp(second?.updatedAt) ||
              getTimestamp(second?.createdAt)) -
            (getTimestamp(first?.updatedAt) || getTimestamp(first?.createdAt))
          );
      }
    });

    return result;
  }, [items, search, filter, sort]);

  /*
   * =======================================================
   * UPLOAD
   * =======================================================
   */

  async function handleUploaded() {
    await loadMedia({
      silent: true,
    });
  }

  /*
   * =======================================================
   * DELETE USAGE
   * =======================================================
   */

  async function loadDeleteUsage(media) {
    if (!activeCompanyId || !media?.id) {
      return;
    }

    try {
      setDeleteUsageLoading(true);

      setDeleteUsageError(null);

      const response = await fetch(
        `/api/v1/companies/${activeCompanyId}/media/${media.id}/usage`,
        {
          method: "GET",

          cache: "no-store",

          credentials: "include",
        },
      );

      const payload = await readResponse(response);

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.message || t("media.details.usage.errors.loadFailed"),
        );
      }

      setDeleteUsage({
        usageCount: payload?.data?.usageCount || 0,

        modules: payload?.data?.modules || {},

        usages: Array.isArray(payload?.data?.usages) ? payload.data.usages : [],
      });
    } catch (usageError) {
      console.error("Load delete media usage error:", usageError);

      setDeleteUsageError(
        usageError?.message || t("media.details.usage.errors.loadFailed"),
      );
    } finally {
      setDeleteUsageLoading(false);
    }
  }

  function handleOpenDelete(media) {
    setDeleteMedia(media);

    setDeleteUsage(null);

    setDeleteUsageError(null);

    loadDeleteUsage(media);
  }

  function handleCloseDelete() {
    if (deleteUsageLoading) {
      return;
    }

    setDeleteMedia(null);

    setDeleteUsage(null);

    setDeleteUsageError(null);
  }

  async function handleDeleted(mediaId) {
    /*
     * Remove immediately from Manager.
     */

    setItems((current) => current.filter((item) => item.id !== mediaId));

    /*
     * Close Detail Drawer if same Media.
     */

    setSelectedMedia((current) => (current?.id === mediaId ? null : current));

    setDeleteMedia(null);

    setDeleteUsage(null);

    setDeleteUsageError(null);

    /*
     * Server reconciliation.
     */

    await loadMedia({
      silent: true,
    });
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
            w-32

            animate-pulse

            rounded

            bg-[var(--admin-hover)]
          "
        />

        <div
          className="
            mt-3

            h-4
            w-[420px]
            max-w-full

            animate-pulse

            rounded

            bg-[var(--admin-hover)]
          "
        />

        <div
          className="
            mt-8

            grid
            grid-cols-2
            gap-4

            sm:grid-cols-3

            lg:grid-cols-4

            2xl:grid-cols-5
          "
        >
          {Array.from({
            length: 10,
          }).map((_, index) => (
            <MediaCardSkeleton key={index} />
          ))}
        </div>
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
          {t("media.manager.noCompany.title")}
        </div>

        <p
          className="
            mt-1

            admin-text-14

            text-[var(--admin-muted)]
          "
        >
          {t("media.manager.noCompany.description")}
        </p>
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
        {/* HEADER */}

        <div
          className="
            flex
            flex-col

            gap-5

            xl:flex-row
            xl:items-end
            xl:justify-between
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
              {t("media.manager.sectionLabel")}
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
              {t("media.manager.title")}
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
              {t("media.manager.description")}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                loadMedia({
                  silent: true,
                })
              }
              disabled={refreshing}
              className="
                inline-flex
                h-10

                items-center
                justify-center
                gap-2

                rounded-xl

                border
                border-[var(--admin-border)]

                bg-[var(--admin-surface)]

                px-4

                admin-text-12
                font-medium

                text-[var(--admin-foreground)]

                transition

                hover:bg-[var(--admin-hover)]

                disabled:opacity-60
              "
            >
              <RefreshCw
                size={15}
                className={cn(refreshing && "animate-spin")}
              />

              {t("common.refresh")}
            </button>

            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              className="
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
              <Upload size={15} />

              {t("media.manager.upload")}
            </button>
          </div>
        </div>

        {/* SUMMARY */}

        <div
          className="
            mt-7

            grid
            grid-cols-2
            gap-3

            xl:grid-cols-4
          "
        >
          <SummaryCard
            active={filter === FILTER.ALL}
            icon={<File size={18} />}
            label={t("media.manager.summary.all")}
            count={summary.all}
            onClick={() => setFilter(FILTER.ALL)}
          />

          <SummaryCard
            active={filter === FILTER.IMAGE}
            icon={<ImageIcon size={18} />}
            label={t("media.manager.summary.images")}
            count={summary.image}
            onClick={() => setFilter(FILTER.IMAGE)}
          />

          <SummaryCard
            active={filter === FILTER.DOCUMENT}
            icon={<FileImage size={18} />}
            label={t("media.manager.summary.documents")}
            count={summary.document}
            onClick={() => setFilter(FILTER.DOCUMENT)}
          />

          <SummaryCard
            active={filter === FILTER.OTHER}
            icon={<File size={18} />}
            label={t("media.manager.summary.other")}
            count={summary.other}
            onClick={() => setFilter(FILTER.OTHER)}
          />
        </div>

        {/* SEARCH / FILTER / SORT */}

        <div
          className="
            mt-6

            flex
            flex-col

            gap-3

            lg:flex-row
            lg:items-center
            lg:justify-between
          "
        >
          <div
            className="
              relative

              w-full

              lg:max-w-[420px]
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
              placeholder={t("media.manager.searchPlaceholder")}
              className="
                h-11
                w-full

                rounded-xl

                border
                border-[var(--admin-border)]

                bg-[var(--admin-surface)]

                pl-10
                pr-4

                admin-text-13

                text-[var(--admin-foreground)]

                outline-none

                transition

                focus:border-[var(--company-primary)]

                focus:ring-2
                focus:ring-[var(--company-primary-soft)]
              "
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <ListFilter
                size={14}
                className="
                  pointer-events-none

                  absolute
                  left-3
                  top-1/2

                  -translate-y-1/2

                  text-[var(--admin-muted)]
                "
              />

              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="
                  h-10

                  appearance-none

                  rounded-xl

                  border
                  border-[var(--admin-border)]

                  bg-[var(--admin-surface)]

                  pl-9
                  pr-8

                  admin-text-11
                  font-medium

                  text-[var(--admin-foreground)]

                  outline-none
                "
              >
                <option value={FILTER.ALL}>
                  {t("media.manager.filters.all")}
                </option>

                <option value={FILTER.IMAGE}>
                  {t("media.manager.filters.images")}
                </option>

                <option value={FILTER.DOCUMENT}>
                  {t("media.manager.filters.documents")}
                </option>

                <option value={FILTER.OTHER}>
                  {t("media.manager.filters.other")}
                </option>
              </select>
            </div>

            <div className="relative">
              <ArrowUpDown
                size={14}
                className="
                  pointer-events-none

                  absolute
                  left-3
                  top-1/2

                  -translate-y-1/2

                  text-[var(--admin-muted)]
                "
              />

              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="
                  h-10

                  appearance-none

                  rounded-xl

                  border
                  border-[var(--admin-border)]

                  bg-[var(--admin-surface)]

                  pl-9
                  pr-8

                  admin-text-11
                  font-medium

                  text-[var(--admin-foreground)]

                  outline-none
                "
              >
                <option value={SORT.NEWEST}>
                  {t("media.manager.sort.newest")}
                </option>

                <option value={SORT.OLDEST}>
                  {t("media.manager.sort.oldest")}
                </option>

                <option value={SORT.NAME_ASC}>
                  {t("media.manager.sort.nameAsc")}
                </option>

                <option value={SORT.NAME_DESC}>
                  {t("media.manager.sort.nameDesc")}
                </option>

                <option value={SORT.SIZE_DESC}>
                  {t("media.manager.sort.largest")}
                </option>

                <option value={SORT.SIZE_ASC}>
                  {t("media.manager.sort.smallest")}
                </option>
              </select>
            </div>

            <div
              className="
                ml-1

                admin-text-10

                text-[var(--admin-muted)]
              "
            >
              {t("media.manager.assetCount", {
                count: filteredItems.length,
              })}
            </div>
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div
            className="
              mt-6

              rounded-2xl

              border
              border-red-200

              bg-red-50

              p-4

              admin-text-12

              text-red-700
            "
          >
            {error}
          </div>
        )}

        {/* GRID */}

        {loading ? (
          <div
            className="
              mt-6

              grid
              grid-cols-2
              gap-4

              sm:grid-cols-3

              lg:grid-cols-4

              2xl:grid-cols-5
            "
          >
            {Array.from({
              length: 10,
            }).map((_, index) => (
              <MediaCardSkeleton key={index} />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div
            className="
              mt-6

              flex
              min-h-[300px]

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
              <ImageIcon size={21} />
            </div>

            <div
              className="
                mt-4

                admin-text-14
                font-medium

                text-[var(--admin-foreground)]
              "
            >
              {t("media.manager.empty.searchTitle")}
            </div>
          </div>
        ) : (
          <div
            className="
              mt-6

              grid
              grid-cols-2
              gap-4

              sm:grid-cols-3

              lg:grid-cols-4

              2xl:grid-cols-5
            "
          >
            {filteredItems.map((media) => (
              <MediaCard
                key={media.id}
                companyId={activeCompanyId}
                media={media}
                title={getMediaName(media, t("media.manager.untitled"))}
                onOpen={setSelectedMedia}
                onDelete={handleOpenDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* UPLOAD */}

      <MediaUploadDialog
        open={uploadOpen}
        companyId={activeCompanyId}
        onClose={() => setUploadOpen(false)}
        onUploaded={handleUploaded}
      />

      {/* DETAIL */}

      <MediaDetailDrawer
        open={Boolean(selectedMedia)}
        companyId={activeCompanyId}
        media={selectedMedia}
        onClose={() => setSelectedMedia(null)}
        onDeleted={handleDeleted}
        onSaved={async (updatedMedia) => {
          setItems((current) =>
            current.map((item) =>
              item.id === updatedMedia.id
                ? {
                    ...item,
                    ...updatedMedia,
                  }
                : item,
            ),
          );

          await loadMedia({
            silent: true,
          });
        }}
      />

      {/* DELETE */}

      <MediaDeleteDialog
        open={Boolean(deleteMedia)}
        companyId={activeCompanyId}
        media={deleteMedia}
        usageData={deleteUsage}
        usageLoading={deleteUsageLoading}
        usageError={deleteUsageError}
        onRetryUsage={() => {
          if (deleteMedia) {
            loadDeleteUsage(deleteMedia);
          }
        }}
        onClose={handleCloseDelete}
        onDeleted={handleDeleted}
      />
    </>
  );
}
