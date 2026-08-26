"use client";

import { useCallback, useEffect, useState } from "react";

import {
  Image as ImageIcon,
  LoaderCircle,
  Plus,
  RefreshCw,
} from "lucide-react";

import { toast } from "sonner";

import { useCompanyWorkspace } from "@/components/admin/company/CompanyWorkspaceProvider";
import { cn } from "@/utils/cn";

import SlideshowCard from "./SlideshowCard";
import SlideshowEditor from "./SlideshowEditor";

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

export default function HomeSlideshowManager() {
  const {
    activeCompany,
    activeCompanyId,
    loading: companyLoading,
  } = useCompanyWorkspace();

  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [actionId, setActionId] = useState(null);

  /*
   * ------------------------------------------------
   * LOAD
   * ------------------------------------------------
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

        const payload = await response.json();

        if (!response.ok || payload?.success === false) {
          throw new Error(
            payload?.message || "Unable to retrieve home slideshows.",
          );
        }

        setItems(normalizeSlideshowResponse(payload));
      } catch (loadError) {
        console.error("Load home slideshows error:", loadError);

        const message =
          loadError?.message || "Unable to retrieve home slideshows.";

        setError(message);

        if (silent) {
          toast.error(message);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeCompanyId],
  );

  /*
   * ------------------------------------------------
   * COMPANY CHANGE / INITIAL LOAD
   * ------------------------------------------------
   *
   * Same pattern as MediaManager.
   *
   * setTimeout prevents synchronous setState
   * inside the effect body and keeps React
   * Compiler / ESLint happy.
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
   * ------------------------------------------------
   * EDITOR
   * ------------------------------------------------
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
   * ------------------------------------------------
   * PUBLISH
   * ------------------------------------------------
   */

  async function handlePublish(item) {
    if (!activeCompanyId || !item?.id) {
      return;
    }

    const name = item.name?.en || item.name?.th || "this slideshow";

    const confirmed = window.confirm(
      `Publish "${name}" as the homepage slideshow?\n\n` +
        "The currently published slideshow will automatically return to Draft.",
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

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || "Unable to publish slideshow.");
      }

      toast.success("Homepage slideshow published.");

      await loadSlideshows({
        silent: true,
      });
    } catch (publishError) {
      console.error("Publish home slideshow error:", publishError);

      toast.error(publishError?.message || "Unable to publish slideshow.");
    } finally {
      setActionId(null);
    }
  }

  /*
   * ------------------------------------------------
   * DELETE
   * ------------------------------------------------
   */

  async function handleDelete(item) {
    if (!activeCompanyId || !item?.id) {
      return;
    }

    if (item.status === "published") {
      toast.error(
        "Published slideshow cannot be deleted. Publish another slideshow first.",
      );

      return;
    }

    const name = item.name?.en || item.name?.th || "this slideshow";

    const confirmed = window.confirm(
      `Delete "${name}"?\n\nThis action will remove the slideshow from the CMS.`,
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

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || "Unable to delete slideshow.");
      }

      toast.success("Slideshow deleted.");

      await loadSlideshows({
        silent: true,
      });
    } catch (deleteError) {
      console.error("Delete home slideshow error:", deleteError);

      toast.error(deleteError?.message || "Unable to delete slideshow.");
    } finally {
      setActionId(null);
    }
  }

  /*
   * ------------------------------------------------
   * WORKSPACE LOADING
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

  /*
   * ------------------------------------------------
   * NO COMPANY
   * ------------------------------------------------
   */

  if (!activeCompany) {
    return (
      <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-8">
        <div className="text-sm font-medium text-[var(--admin-foreground)]">
          No company selected
        </div>

        <p className="mt-1 text-sm text-[var(--admin-muted)]">
          Select a workspace before managing homepage content.
        </p>
      </div>
    );
  }

  /*
   * ------------------------------------------------
   * UI
   * ------------------------------------------------
   */

  return (
    <>
      <div>
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
              Home
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--admin-muted)]">
              Manage homepage slideshow sets for{" "}
              <span className="font-medium text-[var(--admin-foreground)]">
                {activeCompany.name ||
                  activeCompany.displayName ||
                  activeCompany.slug ||
                  "this company"}
              </span>
              . Only one slideshow can be published at a time.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                loadSlideshows({
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
              <RefreshCw
                size={15}
                className={cn(refreshing && "animate-spin")}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={handleCreate}
              className={cn(
                "inline-flex h-10 items-center justify-center gap-2",
                "rounded-xl",
                "bg-[var(--company-primary)] px-4",
                "text-sm font-medium",
                "text-[var(--company-primary-foreground)]",
                "transition",
                "hover:opacity-90",
              )}
            >
              <Plus size={16} />
              New Slideshow
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="font-medium">Unable to load homepage content</div>

            <div className="mt-1">{error}</div>
          </div>
        )}

        <div className="mt-8">
          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
              <div className="flex items-center gap-2 text-sm text-[var(--admin-muted)]">
                <LoaderCircle size={18} className="animate-spin" />
                Loading slideshows...
              </div>
            </div>
          ) : items.length === 0 ? (
            <div
              className={cn(
                "flex min-h-[360px] flex-col",
                "items-center justify-center",
                "rounded-2xl",
                "border border-dashed border-[var(--admin-border)]",
                "bg-[var(--admin-surface)]",
                "p-8 text-center",
              )}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--company-primary-soft)] text-[var(--company-primary)]">
                <ImageIcon size={23} strokeWidth={1.7} />
              </div>

              <div className="mt-5 text-sm font-medium text-[var(--admin-foreground)]">
                No homepage slideshow yet
              </div>

              <p className="mt-2 max-w-sm text-xs leading-5 text-[var(--admin-muted)]">
                Create the first slideshow and select images from the
                company&apos;s Media Library.
              </p>

              <button
                type="button"
                onClick={handleCreate}
                className={cn(
                  "mt-5 inline-flex h-10",
                  "items-center justify-center gap-2",
                  "rounded-xl",
                  "bg-[var(--company-primary)] px-4",
                  "text-sm font-medium",
                  "text-[var(--company-primary-foreground)]",
                  "transition hover:opacity-90",
                )}
              >
                <Plus size={16} />
                Create Slideshow
              </button>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {items.map((item) => (
                <SlideshowCard
                  key={item.id}
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
