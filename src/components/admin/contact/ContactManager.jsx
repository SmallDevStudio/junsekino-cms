"use client";

import {
  Eye,
  FileText,
  LoaderCircle,
  Mail,
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

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { PAGE_STATUS } from "@/constants/page";

import { cn } from "@/utils/cn";

import ContactEditor from "./ContactEditor";

import ContactPreviewDialog from "./ContactPreviewDialog";

/*
 * =========================================================
 * STATUS BADGE
 * =========================================================
 */

function StatusBadge({ status, label }) {
  const published = status === PAGE_STATUS.PUBLISHED;

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1",

        "admin-text-8 font-semibold uppercase tracking-[0.08em]",

        published
          ? "bg-[var(--company-primary-soft)] text-[var(--company-primary)]"
          : "bg-[var(--admin-hover)] text-[var(--admin-muted)]",
      )}
    >
      {label}
    </span>
  );
}

/*
 * =========================================================
 * MANAGER
 * =========================================================
 */

export default function ContactManager() {
  const {
    activeCompany,
    activeCompanyId,
    loading: companyLoading,
  } = useCompanyWorkspace();

  const { t, statusLabel, errorMessage } = useAdminTranslation();

  const [items, setItems] = useState([]);

  const [contactForm, setContactForm] = useState(null);

  const [loading, setLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const [setupLoading, setSetupLoading] = useState(false);

  const [editorOpen, setEditorOpen] = useState(false);

  const [editingItem, setEditingItem] = useState(null);

  const [previewItem, setPreviewItem] = useState(null);

  const [actionId, setActionId] = useState(null);

  /*
   * =======================================================
   * CONTACT SETUP
   * =======================================================
   */

  const ensureSetup = useCallback(async () => {
    if (!activeCompanyId) {
      return null;
    }

    try {
      setSetupLoading(true);

      const response = await fetch(
        `/api/v1/companies/${activeCompanyId}/contact/setup`,
        {
          method: "POST",

          credentials: "include",
        },
      );

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || t("contact.messages.setupFailed"));
      }

      const form = payload?.data?.form || null;

      setContactForm(form);

      return form;
    } catch (error) {
      console.error("Contact setup error:", error);

      toast.error(error?.message || t("contact.messages.setupFailed"));

      return null;
    } finally {
      setSetupLoading(false);
    }
  }, [activeCompanyId, t]);

  /*
   * =======================================================
   * LOAD CONTACT PAGES
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
          `/api/v1/companies/${activeCompanyId}/pages?pageType=contact`,
          {
            method: "GET",

            cache: "no-store",

            credentials: "include",
          },
        );

        const payload = await response.json();

        if (!response.ok || payload?.success === false) {
          throw new Error(payload?.message || t("contact.messages.loadFailed"));
        }

        setItems(Array.isArray(payload?.data) ? payload.data : []);
      } catch (error) {
        console.error("Load Contact error:", error);

        toast.error(error?.message || t("contact.messages.loadFailed"));
      } finally {
        setLoading(false);

        setRefreshing(false);
      }
    },
    [activeCompanyId, t],
  );

  /*
   * =======================================================
   * INITIAL LOAD
   * =======================================================
   */

  useEffect(() => {
    if (!activeCompanyId) {
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      await Promise.all([ensureSetup(), loadItems()]);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeCompanyId, ensureSetup, loadItems]);

  /*
   * =======================================================
   * CREATE / EDIT
   * =======================================================
   */

  async function createItem() {
    let form = contactForm;

    if (!form) {
      form = await ensureSetup();
    }

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
   * REFRESH
   * =======================================================
   */

  async function refreshAll() {
    await Promise.all([
      ensureSetup(),

      loadItems({
        silent: true,
      }),
    ]);
  }

  /*
   * =======================================================
   * PUBLISH
   * =======================================================
   */

  async function publishItem(item) {
    const title = item.title?.en || t("contact.title");

    const confirmed = window.confirm(
      t("contact.confirm.publish", {
        title,
      }),
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionId(item.id);

      const response = await fetch(
        `/api/v1/companies/${activeCompanyId}/pages/${item.id}/publish`,
        {
          method: "POST",

          credentials: "include",
        },
      );

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(
          errorMessage(
            payload?.code,

            payload?.message || t("contact.messages.publishFailed"),
          ),
        );
      }

      toast.success(t("contact.messages.published"));

      await loadItems({
        silent: true,
      });
    } catch (error) {
      toast.error(error?.message || t("contact.messages.publishFailed"));
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
    if (!window.confirm(t("contact.confirm.unpublish"))) {
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
        throw new Error(
          errorMessage(
            payload?.code,

            payload?.message || t("contact.messages.unpublishFailed"),
          ),
        );
      }

      toast.success(t("contact.messages.unpublished"));

      await loadItems({
        silent: true,
      });
    } catch (error) {
      toast.error(error?.message || t("contact.messages.unpublishFailed"));
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
      toast.error(t("contact.messages.deletePublished"));

      return;
    }

    if (!window.confirm(t("contact.confirm.delete"))) {
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
        throw new Error(
          errorMessage(
            payload?.code,

            payload?.message || t("contact.messages.deleteFailed"),
          ),
        );
      }

      toast.success(t("contact.messages.deleted"));

      await loadItems({
        silent: true,
      });
    } catch (error) {
      toast.error(error?.message || t("contact.messages.deleteFailed"));
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
                admin-text-10
                font-semibold
                uppercase
                tracking-[0.14em]

                text-[var(--company-primary)]
              "
            >
              {t("contact.sectionLabel")}
            </div>

            <h1
              className="
                mt-2

                admin-text-28
                font-semibold
                tracking-[-0.03em]

                text-[var(--admin-foreground)]
              "
            >
              {t("contact.title")}
            </h1>

            <p
              className="
                mt-2

                max-w-[640px]

                admin-text-12
                leading-[1.65]

                text-[var(--admin-muted)]
              "
            >
              {t("contact.description")}
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
              onClick={refreshAll}
              disabled={refreshing || setupLoading}
              aria-label={t("common.refresh")}
              title={t("common.refresh")}
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

                hover:border-[var(--company-primary-border)]

                hover:bg-[var(--admin-hover)]

                hover:text-[var(--company-primary)]

                disabled:opacity-50
              "
            >
              <RefreshCw
                size={15}
                className={refreshing || setupLoading ? "animate-spin" : ""}
              />
            </button>

            <button
              type="button"
              onClick={createItem}
              disabled={setupLoading}
              className="
                inline-flex
                h-10

                items-center
                gap-2

                rounded-xl

                bg-[var(--company-primary)]

                px-4

                admin-text-12
                font-semibold

                text-[var(--company-primary-foreground)]

                transition

                hover:bg-[var(--company-primary-hover)]

                disabled:opacity-50
              "
            >
              <Plus size={15} />

              {t("contact.newVersion")}
            </button>
          </div>
        </div>

        {/* CONTACT FORM STATUS */}

        <div
          className="
            mt-6

            flex
            flex-col
            gap-3

            rounded-2xl

            border
            border-[var(--admin-border)]

            bg-[var(--admin-surface)]

            p-4

            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div
            className="
              flex
              min-w-0
              items-center
              gap-3
            "
          >
            <div
              className="
                flex
                h-10
                w-10
                shrink-0

                items-center
                justify-center

                rounded-xl

                bg-[var(--company-primary-soft)]

                text-[var(--company-primary)]
              "
            >
              <Mail size={17} />
            </div>

            <div className="min-w-0">
              <div
                className="
                  admin-text-12
                  font-semibold

                  text-[var(--admin-foreground)]
                "
              >
                {t("contact.form.title")}
              </div>

              <div
                className="
                  mt-0.5

                  admin-text-10

                  text-[var(--admin-muted)]
                "
              >
                {contactForm
                  ? `${contactForm.slug} · ${statusLabel(contactForm.status)}`
                  : t("contact.form.preparing")}
              </div>
            </div>
          </div>

          {contactForm && (
            <span
              className="
                inline-flex
                w-fit

                rounded-full

                bg-[var(--company-primary-soft)]

                px-2.5
                py-1

                admin-text-9
                font-semibold
                uppercase
                tracking-[0.08em]

                text-[var(--company-primary)]
              "
            >
              {t("contact.form.systemForm")}
            </span>
          )}
        </div>

        {/* LIST */}

        <div className="mt-6">
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
                className="
                  animate-spin

                  text-[var(--company-primary)]
                "
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
                className="
                  text-[var(--admin-muted-light)]
                "
              />

              <div
                className="
                  mt-4

                  admin-text-14
                  font-semibold

                  text-[var(--admin-foreground)]
                "
              >
                {t("contact.versions.emptyTitle")}
              </div>

              <div
                className="
                  mt-1

                  admin-text-12

                  text-[var(--admin-muted)]
                "
              >
                {t("contact.versions.emptyDescription")}
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

                        transition

                        hover:border-[var(--company-primary-border)]
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
                        <Mail size={20} />
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

                                admin-text-14
                                font-semibold

                                text-[var(--admin-foreground)]
                              "
                          >
                            {item.contact?.companyDisplayName?.en ||
                              item.title?.en ||
                              t("contact.title")}
                          </h2>

                          <StatusBadge
                            status={item.status}
                            label={statusLabel(item.status)}
                          />
                        </div>

                        <div
                          className="
                              mt-2

                              admin-text-10

                              text-[var(--admin-muted)]
                            "
                        >
                          {item.contact?.email ||
                            item.contact?.telephone ||
                            (item.featuredImage?.mediaId
                              ? t("contact.versions.coverSelected")
                              : t("contact.versions.noCover"))}
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

                            admin-text-10
                            font-medium

                            text-[var(--admin-muted)]

                            transition

                            hover:bg-[var(--admin-hover)]

                            hover:text-[var(--company-primary)]
                          "
                      >
                        <Eye size={14} />

                        {t("common.preview")}
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

                            admin-text-10
                            font-medium

                            text-[var(--admin-muted)]

                            transition

                            hover:bg-[var(--admin-hover)]

                            hover:text-[var(--company-primary)]
                          "
                      >
                        <Pencil size={14} />

                        {t("common.edit")}
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

                              admin-text-10
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

                          {t("common.publish")}
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

                              admin-text-10
                              font-medium

                              text-[var(--admin-muted)]

                              transition

                              hover:bg-[var(--admin-hover)]

                              disabled:opacity-40
                            "
                        >
                          <Undo2 size={14} />

                          {t("common.unpublish")}
                        </button>
                      )}

                      {!published && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => deleteItem(item)}
                          aria-label={t("common.delete")}
                          title={t("common.delete")}
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

                              disabled:opacity-40
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

      <ContactEditor
        open={editorOpen}
        companyId={activeCompanyId}
        company={activeCompany}
        page={editingItem}
        contactForm={contactForm}
        onClose={() => {
          setEditorOpen(false);

          setEditingItem(null);
        }}
        onSaved={savedItem}
      />

      {/* Temporary preview.
          We will replace this with the exact
          public Contact preview in the next step. */}

      <ContactPreviewDialog
        open={Boolean(previewItem)}
        companyId={activeCompanyId}
        companySlug={activeCompany?.slug || ""}
        value={previewItem}
        contactForm={contactForm}
        locale="en"
        onClose={() => setPreviewItem(null)}
      />
    </>
  );
}
