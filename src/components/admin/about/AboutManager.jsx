"use client";

import {
  Eye,
  FileText,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  Undo2,
} from "lucide-react";

import { useCallback, useEffect, useState } from "react";

import { toast } from "sonner";

import { useCompanyWorkspace } from "@/components/admin/company/CompanyWorkspaceProvider";

import { PAGE_STATUS } from "@/constants/page";

import { cn } from "@/utils/cn";

import AboutEditor from "./AboutEditor";
import AboutPreviewDialog from "./AboutPreviewDialog";

/*
 * =========================================================
 * STATUS
 * =========================================================
 */

function StatusBadge({ status }) {
  const published = status === PAGE_STATUS.PUBLISHED;

  return (
    <span
      className={cn(
        "inline-flex",

        "rounded-full",

        "px-2.5 py-1",

        "text-[8px] font-semibold uppercase tracking-[0.08em]",

        published
          ? "bg-[var(--company-primary-soft)] text-[var(--company-primary)]"
          : "bg-[var(--admin-hover)] text-[var(--admin-muted)]",
      )}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}

/*
 * =========================================================
 * MANAGER
 * =========================================================
 */

export default function AboutManager() {
  const {
    activeCompany,
    activeCompanyId,
    loading: companyLoading,
  } = useCompanyWorkspace();

  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const [editorOpen, setEditorOpen] = useState(false);

  const [editingItem, setEditingItem] = useState(null);

  const [previewItem, setPreviewItem] = useState(null);

  const [actionId, setActionId] = useState(null);

  /*
   * =======================================================
   * LOAD
   * =======================================================
   */

  const loadItems = useCallback(
    async ({ silent = false } = {}) => {
      if (!activeCompanyId) {
        return;
      }

      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await fetch(
          `/api/v1/companies/${activeCompanyId}/pages?pageType=about`,
          {
            method: "GET",

            cache: "no-store",

            credentials: "include",
          },
        );

        const payload = await response.json();

        if (!response.ok || payload?.success === false) {
          throw new Error(
            payload?.message || "Unable to retrieve About versions.",
          );
        }

        setItems(Array.isArray(payload.data) ? payload.data : []);
      } catch (error) {
        console.error("Load About error:", error);

        toast.error(error?.message || "Unable to retrieve About versions.");
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
      loadItems();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeCompanyId, loadItems]);

  /*
   * =======================================================
   * EDITOR
   * =======================================================
   */

  function createItem() {
    setEditingItem(null);

    setEditorOpen(true);
  }

  function editItem(item) {
    setEditingItem(item);

    setEditorOpen(true);
  }

  async function savedItem() {
    setEditorOpen(false);

    setEditingItem(null);

    await loadItems({
      silent: true,
    });
  }

  /*
   * =======================================================
   * PUBLISH
   * =======================================================
   */

  async function publishItem(item) {
    const confirmed = window.confirm(
      `Publish "${item.title?.en || "About"}"?\n\n` +
        "The currently published About version will automatically return to Draft.",
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionId(item.id);

      const response = await fetch(
        `/api/v1/companies/${activeCompanyId}/about-pages/${item.id}/publish`,
        {
          method: "POST",

          credentials: "include",
        },
      );

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || "Unable to publish About.");
      }

      toast.success("About page published.");

      await loadItems({
        silent: true,
      });
    } catch (error) {
      toast.error(error?.message || "Unable to publish About.");
    } finally {
      setActionId(null);
    }
  }

  /*
   * =======================================================
   * UNPUBLISH
   * =======================================================
   */

  async function unpublishItem(item) {
    if (!window.confirm("Return this About version to Draft?")) {
      return;
    }

    try {
      setActionId(item.id);

      const response = await fetch(
        `/api/v1/companies/${activeCompanyId}/pages/${item.id}/unpublish`,
        {
          method: "POST",

          credentials: "include",
        },
      );

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || "Unable to unpublish About.");
      }

      toast.success("About returned to Draft.");

      await loadItems({
        silent: true,
      });
    } catch (error) {
      toast.error(error?.message || "Unable to unpublish About.");
    } finally {
      setActionId(null);
    }
  }

  /*
   * =======================================================
   * DELETE
   * =======================================================
   */

  async function deleteItem(item) {
    if (item.status === PAGE_STATUS.PUBLISHED) {
      toast.error("Unpublish this About version before deleting it.");

      return;
    }

    if (!window.confirm("Delete this About version?")) {
      return;
    }

    try {
      setActionId(item.id);

      const response = await fetch(
        `/api/v1/companies/${activeCompanyId}/pages/${item.id}`,
        {
          method: "DELETE",

          credentials: "include",
        },
      );

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || "Unable to delete About.");
      }

      toast.success("About version deleted.");

      await loadItems({
        silent: true,
      });
    } catch (error) {
      toast.error(error?.message || "Unable to delete About.");
    } finally {
      setActionId(null);
    }
  }

  /*
   * =======================================================
   * LOADING
   * =======================================================
   */

  if (companyLoading || !activeCompany) {
    return (
      <div
        className="
          flex
          min-h-[320px]

          items-center
          justify-center
        "
      >
        <LoaderCircle
          size={20}
          className="
            animate-spin

            text-[var(--company-primary)]
          "
        />
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
            gap-4

            sm:flex-row
            sm:items-end
            sm:justify-between
          "
        >
          <div>
            <div
              className="
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.14em]

                text-[var(--company-primary)]
              "
            >
              Content
            </div>

            <h1
              className="
                mt-2

                text-[28px]
                font-semibold
                tracking-[-0.03em]

                text-[var(--admin-foreground)]
              "
            >
              About
            </h1>

            <p
              className="
                mt-2
                max-w-[620px]

                text-xs
                leading-5

                text-[var(--admin-muted)]
              "
            >
              Create and preview multiple About versions. Only one version can
              be published at a time.
            </p>
          </div>

          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            <button
              type="button"
              onClick={() =>
                loadItems({
                  silent: true,
                })
              }
              disabled={refreshing}
              className="
                flex
                h-10
                w-10

                items-center
                justify-center

                rounded-xl

                border
                border-[var(--admin-border)]

                text-[var(--admin-muted)]

                transition

                hover:bg-[var(--admin-hover)]
              "
            >
              <RefreshCw
                size={15}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>

            <button
              type="button"
              onClick={createItem}
              className="
                inline-flex
                h-10

                items-center
                gap-2

                rounded-xl

                bg-[var(--company-primary)]

                px-4

                text-xs
                font-semibold

                text-[var(--company-primary-foreground)]

                transition

                hover:bg-[var(--company-primary-hover)]
              "
            >
              <Plus size={15} />
              New Version
            </button>
          </div>
        </div>

        {/* LIST */}

        <div className="mt-8">
          {loading ? (
            <div
              className="
                flex
                min-h-[280px]

                items-center
                justify-center
              "
            >
              <LoaderCircle
                size={20}
                className="animate-spin text-[var(--company-primary)]"
              />
            </div>
          ) : items.length === 0 ? (
            <div
              className="
                flex
                min-h-[300px]

                flex-col
                items-center
                justify-center

                rounded-3xl

                border
                border-dashed
                border-[var(--admin-border)]

                text-center
              "
            >
              <FileText
                size={25}
                strokeWidth={1.4}
                className="text-[var(--admin-muted-light)]"
              />

              <div
                className="
                  mt-4

                  text-sm
                  font-semibold

                  text-[var(--admin-foreground)]
                "
              >
                No About versions
              </div>

              <div
                className="
                  mt-1

                  text-xs

                  text-[var(--admin-muted)]
                "
              >
                Create the first About page version.
              </div>
            </div>
          ) : (
            <div
              className="
                grid
                gap-4

                xl:grid-cols-2
              "
            >
              {items.map((item) => {
                const busy = actionId === item.id;

                const published = item.status === PAGE_STATUS.PUBLISHED;

                return (
                  <article
                    key={item.id}
                    className="
                        rounded-2xl

                        border
                        border-[var(--admin-border)]

                        bg-[var(--admin-surface)]

                        p-5
                      "
                  >
                    <div
                      className="
                          flex
                          items-start
                          gap-4
                        "
                    >
                      <div
                        className="
                            flex
                            h-14
                            w-14

                            shrink-0

                            items-center
                            justify-center

                            rounded-2xl

                            bg-[var(--company-primary-soft)]

                            text-[var(--company-primary)]
                          "
                      >
                        <FileText size={20} />
                      </div>

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
                          <h2
                            className="
                                truncate

                                text-sm
                                font-semibold

                                text-[var(--admin-foreground)]
                              "
                          >
                            {item.title?.en || "About"}
                          </h2>

                          <StatusBadge status={item.status} />
                        </div>

                        <div
                          className="
                              mt-2

                              text-[10px]

                              text-[var(--admin-muted)]
                            "
                        >
                          {item.featuredImage?.mediaId
                            ? "Cover image selected"
                            : "No cover image"}
                        </div>
                      </div>
                    </div>

                    <div
                      className="
                          mt-5

                          flex
                          flex-wrap
                          items-center
                          gap-1

                          border-t
                          border-[var(--admin-border)]

                          pt-4
                        "
                    >
                      <button
                        type="button"
                        onClick={() => setPreviewItem(item)}
                        className="
                            inline-flex
                            h-9

                            items-center
                            gap-2

                            rounded-xl

                            px-3

                            text-[10px]
                            font-medium

                            text-[var(--admin-muted)]

                            transition

                            hover:bg-[var(--admin-hover)]
                            hover:text-[var(--company-primary)]
                          "
                      >
                        <Eye size={14} />
                        Preview
                      </button>

                      <button
                        type="button"
                        onClick={() => editItem(item)}
                        className="
                            inline-flex
                            h-9

                            items-center
                            gap-2

                            rounded-xl

                            px-3

                            text-[10px]
                            font-medium

                            text-[var(--admin-muted)]

                            transition

                            hover:bg-[var(--admin-hover)]
                            hover:text-[var(--company-primary)]
                          "
                      >
                        <Pencil size={14} />
                        Edit
                      </button>

                      {!published ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => publishItem(item)}
                          className="
                              inline-flex
                              h-9

                              items-center
                              gap-2

                              rounded-xl

                              px-3

                              text-[10px]
                              font-medium

                              text-[var(--company-primary)]

                              transition

                              hover:bg-[var(--company-primary-soft)]

                              disabled:opacity-40
                            "
                        >
                          {busy ? (
                            <LoaderCircle size={14} className="animate-spin" />
                          ) : (
                            <Send size={14} />
                          )}
                          Publish
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => unpublishItem(item)}
                          className="
                              inline-flex
                              h-9

                              items-center
                              gap-2

                              rounded-xl

                              px-3

                              text-[10px]
                              font-medium

                              text-[var(--admin-muted)]

                              transition

                              hover:bg-[var(--admin-hover)]

                              disabled:opacity-40
                            "
                        >
                          <Undo2 size={14} />
                          Unpublish
                        </button>
                      )}

                      {!published && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => deleteItem(item)}
                          className="
                              ml-auto

                              flex
                              h-9
                              w-9

                              items-center
                              justify-center

                              rounded-xl

                              text-red-400

                              transition

                              hover:bg-red-50
                              hover:text-red-600
                            "
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AboutEditor
        open={editorOpen}
        companyId={activeCompanyId}
        page={editingItem}
        onClose={() => {
          setEditorOpen(false);

          setEditingItem(null);
        }}
        onSaved={savedItem}
      />

      <AboutPreviewDialog
        open={Boolean(previewItem)}
        companyId={activeCompanyId}
        value={previewItem}
        onClose={() => setPreviewItem(null)}
      />
    </>
  );
}
