"use client";

import {
  Archive,
  CheckCircle2,
  Clock3,
  ExternalLink,
  LoaderCircle,
  Mail,
  RotateCcw,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";

import { useState } from "react";

import { toast } from "sonner";

import { FORM_SUBMISSION_STATUS } from "@/constants/form";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import MessageReaderAvatars from "./MessageReaderAvatars";
import MessagePermanentDeleteDialog from "./MessagePermanentDeleteDialog";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function localized(value, locale) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (locale === "th") {
    return value.th || value.en || "";
  }

  return value.en || value.th || "";
}

function formatDate(value, locale) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    day: "2-digit",

    month: "long",

    year: "numeric",

    hour: "2-digit",

    minute: "2-digit",
  }).format(date);
}

function displayValue(value, t) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? t("common.yes") : t("common.no");
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return String(value);
}

/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

export default function MessageDetailDrawer({
  open,
  companyId,
  submission,
  onClose,
  onUpdated,
  onRemoved,
}) {
  const { t, locale, statusLabel } = useAdminTranslation();

  const [updating, setUpdating] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [deleting, setDeleting] = useState(false);

  if (!open || !submission) {
    return null;
  }

  const inTrash = Boolean(submission.deletedAt);

  const fields = Array.isArray(submission.fieldsSnapshot)
    ? submission.fieldsSnapshot.filter(
        (field) =>
          field?.enabled !== false &&
          !["heading", "paragraph"].includes(field?.type),
      )
    : [];

  const actions = [
    {
      status: FORM_SUBMISSION_STATUS.IN_PROGRESS,

      label: t("messages.actions.inProgress"),

      icon: Clock3,
    },

    {
      status: FORM_SUBMISSION_STATUS.RESOLVED,

      label: t("messages.actions.resolved"),

      icon: CheckCircle2,
    },

    {
      status: FORM_SUBMISSION_STATUS.ARCHIVED,

      label: t("messages.actions.archive"),

      icon: Archive,
    },

    {
      status: FORM_SUBMISSION_STATUS.SPAM,

      label: t("messages.actions.spam"),

      icon: ShieldAlert,
    },
  ];

  /*
   * =======================================================
   * REQUEST
   * =======================================================
   */

  async function patchSubmission(body) {
    const response = await fetch(
      `/api/v1/companies/${companyId}/form-submissions/${submission.id}`,
      {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        credentials: "include",

        body: JSON.stringify(body),
      },
    );

    let payload = null;

    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok || payload?.success === false) {
      throw new Error(payload?.message || t("messages.errors.updateFailed"));
    }

    return payload.data;
  }

  /*
   * =======================================================
   * STATUS
   * =======================================================
   */

  async function updateStatus(status) {
    if (updating || inTrash) {
      return;
    }

    try {
      setUpdating(true);

      const updated = await patchSubmission({
        status,
      });

      onUpdated?.(updated);

      toast.success(t("messages.messages.statusUpdated"));
    } catch (error) {
      console.error("Update message status error:", error);

      toast.error(error?.message || t("messages.errors.updateFailed"));
    } finally {
      setUpdating(false);
    }
  }

  /*
   * =======================================================
   * TRASH
   * =======================================================
   */

  async function moveToTrash() {
    if (updating) {
      return;
    }

    try {
      setUpdating(true);

      await patchSubmission({
        action: "trash",
      });

      toast.success(t("messages.messages.movedToTrash"));

      onRemoved?.(submission.id);

      onClose?.();
    } catch (error) {
      console.error("Move message to trash error:", error);

      toast.error(error?.message || t("messages.errors.trashFailed"));
    } finally {
      setUpdating(false);
    }
  }

  /*
   * =======================================================
   * RESTORE
   * =======================================================
   */

  async function restore() {
    if (updating) {
      return;
    }

    try {
      setUpdating(true);

      const updated = await patchSubmission({
        action: "restore",
      });

      toast.success(t("messages.messages.restored"));

      onRemoved?.(submission.id);

      onUpdated?.(updated);

      onClose?.();
    } catch (error) {
      console.error("Restore message error:", error);

      toast.error(error?.message || t("messages.errors.restoreFailed"));
    } finally {
      setUpdating(false);
    }
  }

  /*
   * =======================================================
   * DELETE PERMANENT
   * =======================================================
   */

  async function deletePermanently() {
    if (deleting) {
      return;
    }

    try {
      setDeleting(true);

      const response = await fetch(
        `/api/v1/companies/${companyId}/form-submissions/${submission.id}`,
        {
          method: "DELETE",

          credentials: "include",
        },
      );

      let payload = null;

      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || t("messages.errors.deleteFailed"));
      }

      toast.success(t("messages.messages.deleted"));

      setDeleteDialogOpen(false);

      onRemoved?.(submission.id);

      onClose?.();
    } catch (error) {
      console.error("Permanent delete message error:", error);

      toast.error(error?.message || t("messages.errors.deleteFailed"));
    } finally {
      setDeleting(false);
    }
  }

  /*
   * =======================================================
   * OPEN WINDOW
   * =======================================================
   */

  function openWindow() {
    window.open(
      `/admin/messages/${encodeURIComponent(submission.id)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <>
      <div
        className="
          fixed
          inset-0
          z-[220]

          flex
          justify-end
        "
      >
        <button
          type="button"
          onClick={updating ? undefined : onClose}
          aria-label={t("messages.close")}
          className="
            absolute
            inset-0

            bg-black/30

            backdrop-blur-[1px]
          "
        />

        <aside
          className="
            relative
            z-10

            flex
            h-full
            w-full
            max-w-[720px]

            flex-col

            bg-[var(--admin-surface)]

            shadow-2xl
          "
        >
          {/* HEADER */}

          <header
            className="
              flex
              min-h-20
              shrink-0

              items-center
              justify-between
              gap-4

              border-b
              border-[var(--admin-border)]

              px-5
              py-4

              sm:px-7
            "
          >
            <div className="min-w-0">
              <div
                className="
                  admin-text-9
                  font-semibold
                  uppercase
                  tracking-[0.14em]

                  text-[var(--company-primary)]
                "
              >
                {t("messages.drawer.sectionLabel")}
              </div>

              <h2
                className="
                  mt-1
                  truncate

                  admin-text-18
                  font-semibold
                  tracking-[-0.02em]

                  text-[var(--admin-foreground)]
                "
              >
                {localized(submission.formName, locale) ||
                  t("messages.fallbackMessage")}
              </h2>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                title={t("messages.actions.openWindow")}
                onClick={openWindow}
                className="
                  flex
                  h-9
                  w-9

                  items-center
                  justify-center

                  rounded-xl

                  text-[var(--admin-muted)]

                  transition

                  hover:bg-[var(--admin-hover)]
                  hover:text-[var(--company-primary)]
                "
              >
                <ExternalLink size={15} />
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={updating}
                aria-label={t("common.close")}
                className="
                  flex
                  h-9
                  w-9

                  items-center
                  justify-center

                  rounded-xl

                  text-[var(--admin-muted)]

                  transition

                  hover:bg-[var(--admin-hover)]
                  hover:text-[var(--admin-foreground)]
                "
              >
                <X size={17} />
              </button>
            </div>
          </header>

          {/* BODY */}

          <div
            className="
              admin-sidebar-scrollbar-hide

              min-h-0
              flex-1

              overflow-y-auto

              px-5
              py-6

              sm:px-7
            "
          >
            {/* STATUS */}

            <div
              className="
                flex
                flex-wrap
                items-center
                justify-between
                gap-4
              "
            >
              <div className="flex flex-wrap gap-2">
                <span
                  className="
                    inline-flex

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
                  {statusLabel(submission.status || "new")}
                </span>

                {inTrash && (
                  <span
                    className="
                      inline-flex

                      rounded-full

                      bg-red-50

                      px-2.5
                      py-1

                      admin-text-9
                      font-semibold

                      text-red-600
                    "
                  >
                    {t("messages.folders.trash")}
                  </span>
                )}

                <span
                  className="
                    inline-flex

                    rounded-full

                    bg-[var(--admin-hover)]

                    px-2.5
                    py-1

                    admin-text-9

                    text-[var(--admin-muted)]
                  "
                >
                  {formatDate(submission.createdAt, locale)}
                </span>
              </div>

              <MessageReaderAvatars
                readBy={submission.readBy}
                max={3}
                size="md"
              />
            </div>

            {/* FORM DATA */}

            <section className="mt-7">
              <div className="flex items-center gap-2">
                <Mail size={15} className="text-[var(--company-primary)]" />

                <h3
                  className="
                    admin-text-13
                    font-semibold

                    text-[var(--admin-foreground)]
                  "
                >
                  {t("messages.drawer.messageInformation")}
                </h3>
              </div>

              <div
                className="
                  mt-4

                  divide-y
                  divide-[var(--admin-border)]

                  rounded-2xl

                  border
                  border-[var(--admin-border)]
                "
              >
                {fields.map((field) => {
                  const value = submission.values?.[field.id];

                  return (
                    <div
                      key={field.id}
                      className="
                          grid
                          gap-2

                          px-4
                          py-4

                          sm:grid-cols-[150px_1fr]
                        "
                    >
                      <div
                        className="
                            admin-text-10
                            font-medium

                            text-[var(--admin-muted)]
                          "
                      >
                        {localized(field.label, locale) || field.id}
                      </div>

                      <div
                        className="
                            whitespace-pre-wrap
                            break-words

                            admin-text-11
                            leading-[1.7]

                            text-[var(--admin-foreground)]
                          "
                      >
                        {displayValue(value, t)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* SOURCE */}

            <section className="mt-8">
              <h3
                className="
                  admin-text-13
                  font-semibold

                  text-[var(--admin-foreground)]
                "
              >
                {t("messages.drawer.submissionDetails")}
              </h3>

              <div
                className="
                  mt-4

                  space-y-3

                  rounded-2xl

                  bg-[var(--admin-background)]

                  p-4
                "
              >
                {[
                  [t("messages.drawer.form"), submission.formSlug || "—"],

                  [
                    t("messages.drawer.page"),

                    submission.source?.pagePath || "—",
                  ],

                  [
                    t("messages.drawer.referrer"),

                    submission.source?.referrer || "—",
                  ],

                  [
                    t("messages.drawer.received"),

                    formatDate(submission.createdAt, locale),
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="
                        grid
                        gap-1

                        sm:grid-cols-[110px_1fr]
                      "
                  >
                    <span
                      className="
                          admin-text-9

                          text-[var(--admin-muted)]
                        "
                    >
                      {label}
                    </span>

                    <span
                      className="
                          break-all

                          admin-text-10

                          text-[var(--admin-foreground)]
                        "
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* FOOTER */}

          <footer
            className="
              shrink-0

              border-t
              border-[var(--admin-border)]

              bg-[var(--admin-surface)]

              px-5
              py-4

              sm:px-7
            "
          >
            {!inTrash ? (
              <div
                className="
                  flex
                  flex-wrap
                  items-center
                  justify-between
                  gap-3
                "
              >
                <button
                  type="button"
                  disabled={updating}
                  onClick={moveToTrash}
                  className="
                    inline-flex
                    h-9

                    items-center
                    gap-2

                    rounded-xl

                    px-3

                    admin-text-10
                    font-medium

                    text-red-500

                    transition

                    hover:bg-red-50
                    hover:text-red-700

                    disabled:opacity-40
                  "
                >
                  <Trash2 size={13} />

                  {t("messages.actions.trash")}
                </button>

                <div className="flex flex-wrap justify-end gap-2">
                  {actions.map((action) => {
                    const Icon = action.icon;

                    const active = submission.status === action.status;

                    return (
                      <button
                        key={action.status}
                        type="button"
                        disabled={updating || active}
                        onClick={() => updateStatus(action.status)}
                        className={`
                            inline-flex
                            h-9

                            items-center
                            gap-2

                            rounded-xl

                            px-3

                            admin-text-10
                            font-medium

                            transition

                            disabled:opacity-40

                            ${
                              active
                                ? "bg-[var(--company-primary-soft)] text-[var(--company-primary)]"
                                : "text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-foreground)]"
                            }
                          `}
                      >
                        {updating ? (
                          <LoaderCircle size={13} className="animate-spin" />
                        ) : (
                          <Icon size={13} />
                        )}

                        {action.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-3
                "
              >
                <button
                  type="button"
                  disabled={updating}
                  onClick={restore}
                  className="
                    inline-flex
                    h-9

                    items-center
                    gap-2

                    rounded-xl

                    px-3

                    admin-text-10
                    font-semibold

                    text-[var(--company-primary)]

                    hover:bg-[var(--company-primary-soft)]

                    disabled:opacity-40
                  "
                >
                  <RotateCcw size={13} />

                  {t("messages.actions.restore")}
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="
                    inline-flex
                    h-9

                    items-center
                    gap-2

                    rounded-xl

                    bg-red-600

                    px-3

                    admin-text-10
                    font-semibold

                    text-white

                    hover:bg-red-700
                  "
                >
                  <Trash2 size={13} />

                  {t("messages.actions.deletePermanently")}
                </button>
              </div>
            )}
          </footer>
        </aside>
      </div>

      <MessagePermanentDeleteDialog
        open={deleteDialogOpen}
        deleting={deleting}
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={deletePermanently}
      />
    </>
  );
}
