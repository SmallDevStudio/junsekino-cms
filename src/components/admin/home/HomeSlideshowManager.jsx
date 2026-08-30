"use client";

import { Image as ImageIcon, Plus, RefreshCw } from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";

import { toast } from "sonner";

import { useCompanyWorkspace } from "@/components/admin/company/CompanyWorkspaceProvider";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { cn } from "@/utils/cn";

import SlideshowCard from "./SlideshowCard";
import SlideshowEditor from "./SlideshowEditor";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function normalizeSlideshowResponse(payload) {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (Array.isArray(payload.slideshows)) {
    return payload.slideshows;
  }

  if (Array.isArray(payload.data?.slideshows)) {
    return payload.data.slideshows;
  }

  return [];
}

async function readResponse(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getTimestamp(value) {
  if (!value) {
    return 0;
  }

  /*
   * Firestore serialized timestamp can sometimes
   * arrive as an ISO string or an object.
   *
   * Handle common formats safely.
   */

  if (typeof value === "string" || typeof value === "number") {
    const timestamp = new Date(value).getTime();

    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "object") {
    /*
     * Firestore Timestamp serialized forms.
     */

    if (Number.isFinite(value.seconds)) {
      return value.seconds * 1000;
    }

    if (Number.isFinite(value._seconds)) {
      return value._seconds * 1000;
    }
  }

  return 0;
}

/*
 * =========================================================
 * SKELETON CARD
 * =========================================================
 */

function SlideshowCardSkeleton() {
  return (
    <div
      className="
        overflow-hidden

        rounded-3xl

        border
        border-[var(--admin-border)]

        bg-[var(--admin-surface)]
      "
    >
      <div
        className="
          grid
          grid-cols-4

          gap-px

          bg-[var(--admin-border)]
        "
      >
        {Array.from({
          length: 4,
        }).map((_, index) => (
          <div
            key={index}
            className="
              aspect-[4/3]

              animate-pulse

              bg-[var(--admin-hover)]
            "
          />
        ))}
      </div>

      <div className="p-5 sm:p-6">
        <div
          className="
            h-5
            w-[48%]

            animate-pulse

            rounded

            bg-[var(--admin-hover)]
          "
        />

        <div
          className="
            mt-2

            h-3
            w-[30%]

            animate-pulse

            rounded

            bg-[var(--admin-hover)]
          "
        />

        <div
          className="
            mt-5

            grid
            grid-cols-2

            gap-3
          "
        >
          <div
            className="
              h-[78px]

              animate-pulse

              rounded-2xl

              bg-[var(--admin-hover)]
            "
          />

          <div
            className="
              h-[78px]

              animate-pulse

              rounded-2xl

              bg-[var(--admin-hover)]
            "
          />
        </div>

        <div
          className="
            mt-5

            h-10

            animate-pulse

            rounded-xl

            bg-[var(--admin-hover)]
          "
        />
      </div>
    </div>
  );
}

/*
 * =========================================================
 * MANAGER
 * =========================================================
 */

export default function HomeSlideshowManager() {
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

  const [editorOpen, setEditorOpen] = useState(false);

  const [editingItem, setEditingItem] = useState(null);

  const [actionId, setActionId] = useState(null);

  /*
   * =======================================================
   * LOAD
   * =======================================================
   */

  const loadSlideshows = useCallback(
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
          `/api/v1/companies/${activeCompanyId}/home-slideshows`,
          {
            method: "GET",
            cache: "no-store",
            credentials: "include",
          },
        );

        const payload = await readResponse(response);

        if (!response.ok || payload?.success === false) {
          throw new Error(
            payload?.message || t("homeSlideshow.manager.errors.loadFailed"),
          );
        }

        setItems(normalizeSlideshowResponse(payload));
      } catch (loadError) {
        console.error("Load home slideshows error:", loadError);

        const message =
          loadError?.message || t("homeSlideshow.manager.errors.loadFailed");

        setError(message);

        if (silent) {
          toast.error(message);
        }
      } finally {
        setLoading(false);

        setRefreshing(false);
      }
    },
    [activeCompanyId, t],
  );

  /*
   * =======================================================
   * INITIAL LOAD / COMPANY CHANGE
   * =======================================================
   */

  useEffect(() => {
    if (!activeCompanyId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      loadSlideshows();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeCompanyId, loadSlideshows]);

  /*
   * =======================================================
   * SORTED ITEMS
   * =======================================================
   *
   * Sorting rules:
   *
   * 1. Published slideshow always appears first.
   * 2. Remaining items are ordered by latest activity.
   * 3. updatedAt takes priority over createdAt.
   *
   * Example:
   *
   * Published  27 Aug  -> first
   * Draft      30 Aug
   * Draft      29 Aug
   * Draft      25 Aug
   * =======================================================
   */

  const sortedItems = useMemo(() => {
    return [...items].sort((first, second) => {
      const firstPublished = first?.status === "published";

      const secondPublished = second?.status === "published";

      if (firstPublished && !secondPublished) {
        return -1;
      }

      if (!firstPublished && secondPublished) {
        return 1;
      }

      const firstTimestamp =
        getTimestamp(first?.updatedAt) || getTimestamp(first?.createdAt);

      const secondTimestamp =
        getTimestamp(second?.updatedAt) || getTimestamp(second?.createdAt);

      return secondTimestamp - firstTimestamp;
    });
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

  function handleEditorClose() {
    setEditorOpen(false);

    setEditingItem(null);
  }

  async function handleSaved() {
    handleEditorClose();

    await loadSlideshows({
      silent: true,
    });
  }

  /*
   * =======================================================
   * PUBLISH
   * =======================================================
   */

  async function handlePublish(item) {
    if (!activeCompanyId || !item?.id || actionId) {
      return;
    }

    const name =
      item.name?.en || item.name?.th || t("homeSlideshow.card.untitled");

    const confirmed = window.confirm(
      t("homeSlideshow.manager.publishConfirm", {
        name,
      }),
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionId(item.id);

      const response = await fetch(
        `/api/v1/companies/${activeCompanyId}/home-slideshows/${item.id}/publish`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      const payload = await readResponse(response);

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.message || t("homeSlideshow.manager.errors.publishFailed"),
        );
      }

      toast.success(t("homeSlideshow.manager.messages.published"));

      await loadSlideshows({
        silent: true,
      });
    } catch (publishError) {
      console.error("Publish home slideshow error:", publishError);

      toast.error(
        publishError?.message ||
          t("homeSlideshow.manager.errors.publishFailed"),
      );
    } finally {
      setActionId(null);
    }
  }

  /*
   * =======================================================
   * DELETE
   * =======================================================
   */

  async function handleDelete(item) {
    if (!activeCompanyId || !item?.id || actionId) {
      return;
    }

    if (item.status === "published") {
      toast.error(t("homeSlideshow.manager.errors.publishedDelete"));

      return;
    }

    const name =
      item.name?.en || item.name?.th || t("homeSlideshow.card.untitled");

    const confirmed = window.confirm(
      t("homeSlideshow.manager.deleteConfirm", {
        name,
      }),
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionId(item.id);

      const response = await fetch(
        `/api/v1/companies/${activeCompanyId}/home-slideshows/${item.id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      const payload = await readResponse(response);

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.message || t("homeSlideshow.manager.errors.deleteFailed"),
        );
      }

      toast.success(t("homeSlideshow.manager.messages.deleted"));

      await loadSlideshows({
        silent: true,
      });
    } catch (deleteError) {
      console.error("Delete home slideshow error:", deleteError);

      toast.error(
        deleteError?.message || t("homeSlideshow.manager.errors.deleteFailed"),
      );
    } finally {
      setActionId(null);
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
            w-28

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
            gap-4

            xl:grid-cols-2
          "
        >
          <SlideshowCardSkeleton />

          <SlideshowCardSkeleton />
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
          {t("homeSlideshow.manager.noCompany.title")}
        </div>

        <p
          className="
            mt-1

            admin-text-14

            text-[var(--admin-muted)]
          "
        >
          {t("homeSlideshow.manager.noCompany.description")}
        </p>
      </div>
    );
  }

  const companyName =
    activeCompany.name ||
    activeCompany.displayName ||
    activeCompany.slug ||
    t("homeSlideshow.manager.thisCompany");

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <>
      <div>
        {/* =================================
            HEADER
        ================================= */}

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
              {t("homeSlideshow.manager.sectionLabel")}
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
              {t("homeSlideshow.manager.title")}
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
              {t("homeSlideshow.manager.description", {
                company: companyName,
              })}
            </p>
          </div>

          <div
            className="
              flex
              flex-wrap

              gap-2
            "
          >
            <button
              type="button"
              onClick={() =>
                loadSlideshows({
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
              onClick={handleCreate}
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
              <Plus size={16} />

              {t("homeSlideshow.manager.newSlideshow")}
            </button>
          </div>
        </div>

        {/* =================================
            ERROR
        ================================= */}

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
            <div className="font-medium">
              {t("homeSlideshow.manager.errors.loadTitle")}
            </div>

            <div className="mt-1">{error}</div>
          </div>
        )}

        {/* =================================
            CONTENT
        ================================= */}

        <div className="mt-8">
          {loading ? (
            <div
              className="
                grid
                gap-4

                xl:grid-cols-2
              "
            >
              <SlideshowCardSkeleton />

              <SlideshowCardSkeleton />
            </div>
          ) : items.length === 0 ? (
            <div
              className="
                flex
                min-h-[360px]

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
                  h-14
                  w-14

                  items-center
                  justify-center

                  rounded-2xl

                  bg-[var(--company-primary-soft)]

                  text-[var(--company-primary)]
                "
              >
                <ImageIcon size={23} strokeWidth={1.7} />
              </div>

              <div
                className="
                  mt-5

                  admin-text-14
                  font-medium

                  text-[var(--admin-foreground)]
                "
              >
                {t("homeSlideshow.manager.empty.title")}
              </div>

              <p
                className="
                  mt-2
                  max-w-sm

                  admin-text-12
                  leading-[1.7]

                  text-[var(--admin-muted)]
                "
              >
                {t("homeSlideshow.manager.empty.description")}
              </p>

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
                <Plus size={16} />

                {t("homeSlideshow.manager.createSlideshow")}
              </button>
            </div>
          ) : (
            <div
              className="
                grid
                gap-4

                xl:grid-cols-2
              "
            >
              {sortedItems.map((item) => (
                <SlideshowCard
                  key={item.id}
                  companyId={activeCompanyId}
                  item={item}
                  busy={actionId === item.id}
                  onEdit={() => handleEdit(item)}
                  onPublish={() => handlePublish(item)}
                  onDelete={() => handleDelete(item)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* =================================
          EDITOR
      ================================= */}

      <SlideshowEditor
        open={editorOpen}
        companyId={activeCompanyId}
        item={editingItem}
        onClose={handleEditorClose}
        onSaved={handleSaved}
      />
    </>
  );
}
