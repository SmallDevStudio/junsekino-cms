"use client";

import { AlertTriangle, LoaderCircle, Trash2, X } from "lucide-react";

import { useMemo, useState } from "react";

import { toast } from "sonner";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { cn } from "@/utils/cn";

/*
 * =========================================================
 * DELETE DIALOG
 * =========================================================
 */

export default function ProjectDeleteDialog({
  open,
  companyId,
  project,
  onClose,
  onCompleted,
}) {
  const { t } = useAdminTranslation();

  const [submitting, setSubmitting] = useState(false);

  const [confirmation, setConfirmation] = useState("");

  const projectTitle = useMemo(
    () =>
      project?.title?.en?.trim() ||
      project?.title?.th?.trim() ||
      project?.slug ||
      t("project.manager.untitledProject"),
    [project, t],
  );

  if (!open || !project) {
    return null;
  }

  const canDelete = confirmation.trim().toLowerCase() === "delete";

  /*
   * =======================================================
   * DELETE
   * =======================================================
   */

  async function handleDelete() {
    if (!companyId || !project?.id || !canDelete || submitting) {
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `/api/v1/companies/${companyId}/projects/${project.id}`,
        {
          method: "DELETE",

          credentials: "include",
        },
      );

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        const messages = {
          PROJECT_NOT_FOUND: t("project.delete.errors.notFound"),

          PROJECT_ALREADY_DELETED: t("project.delete.errors.alreadyDeleted"),
        };

        throw new Error(
          messages[payload?.code || payload?.message] ||
            payload?.message ||
            t("project.delete.errors.failed"),
        );
      }

      toast.success(t("project.delete.messages.deleted"));

      setConfirmation("");

      await onCompleted?.(payload.data);
    } catch (error) {
      console.error("Delete project error:", error);

      toast.error(error?.message || t("project.delete.errors.failed"));
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    if (submitting) {
      return;
    }

    setConfirmation("");

    onClose?.();
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-[230]

        flex
        items-center
        justify-center

        p-4
      "
    >
      <button
        type="button"
        aria-label={t("common.close")}
        onClick={handleClose}
        disabled={submitting}
        className="
          absolute
          inset-0

          bg-black/45

          backdrop-blur-[2px]
        "
      />

      <div
        className={cn(
          "relative z-10",

          "w-full max-w-md",

          "overflow-hidden",

          "rounded-3xl",

          "border border-red-200",

          "bg-[var(--admin-surface)]",

          "shadow-2xl",
        )}
      >
        {/* HEADER */}

        <header
          className="
            flex
            items-start
            justify-between

            gap-4

            border-b
            border-[var(--admin-border)]

            px-6
            py-5
          "
        >
          <div>
            <div
              className="
                admin-text-11
                font-medium
                uppercase
                tracking-[0.12em]

                text-red-500
              "
            >
              {t("project.delete.sectionLabel")}
            </div>

            <h2
              className="
                mt-1

                admin-text-18
                font-semibold
                tracking-[-0.02em]

                text-[var(--admin-foreground)]
              "
            >
              {t("project.delete.title")}
            </h2>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            aria-label={t("common.close")}
            className="
              flex
              h-9
              w-9
              shrink-0

              items-center
              justify-center

              rounded-xl

              text-[var(--admin-muted)]

              transition

              hover:bg-[var(--admin-hover)]

              disabled:opacity-50
            "
          >
            <X size={17} />
          </button>
        </header>

        {/* BODY */}

        <div className="p-6">
          <div
            className="
              flex
              h-12
              w-12

              items-center
              justify-center

              rounded-2xl

              bg-red-50

              text-red-600
            "
          >
            <AlertTriangle size={21} strokeWidth={1.8} />
          </div>

          <h3
            className="
              mt-4

              admin-text-14
              font-semibold

              text-[var(--admin-foreground)]
            "
          >
            {projectTitle}
          </h3>

          {project.slug && (
            <div
              className="
                mt-1

                admin-text-12

                text-[var(--admin-muted)]
              "
            >
              /{project.slug}
            </div>
          )}

          <p
            className="
              mt-4

              admin-text-14
              leading-[1.7]

              text-[var(--admin-muted)]
            "
          >
            {t("project.delete.description")}
          </p>

          {/* STATUS WARNING */}

          {(project.status === "published" ||
            project.status === "scheduled") && (
            <div
              className="
                mt-4

                rounded-2xl

                border
                border-amber-200

                bg-amber-50

                p-4
              "
            >
              <div
                className="
                  admin-text-12
                  font-semibold

                  text-amber-800
                "
              >
                {project.status === "published"
                  ? t("project.delete.warning.published")
                  : t("project.delete.warning.scheduled")}
              </div>

              <p
                className="
                  mt-1

                  admin-text-12
                  leading-[1.6]

                  text-amber-700
                "
              >
                {t("project.delete.warning.description")}
              </p>
            </div>
          )}

          {/* SOFT DELETE */}

          <div
            className="
              mt-5

              rounded-2xl

              border
              border-[var(--admin-border)]

              bg-[var(--admin-background)]

              p-4
            "
          >
            <div
              className="
                admin-text-12
                font-medium

                text-[var(--admin-foreground)]
              "
            >
              {t("project.delete.softDelete.title")}
            </div>

            <p
              className="
                mt-1

                admin-text-12
                leading-[1.6]

                text-[var(--admin-muted)]
              "
            >
              {t("project.delete.softDelete.description")}
            </p>
          </div>

          {/* CONFIRM */}

          <label className="mt-5 block">
            <span
              className="
                admin-text-12
                font-medium

                text-[var(--admin-foreground)]
              "
            >
              {t("project.delete.confirm.prefix")}{" "}
              <span
                className="
                  font-semibold
                  text-red-600
                "
              >
                DELETE
              </span>{" "}
              {t("project.delete.confirm.suffix")}
            </span>

            <input
              type="text"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              disabled={submitting}
              autoComplete="off"
              placeholder="DELETE"
              className="
                mt-2

                h-11
                w-full

                rounded-xl

                border
                border-[var(--admin-border)]

                bg-[var(--admin-surface)]

                px-3

                admin-text-14

                text-[var(--admin-foreground)]

                outline-none

                transition

                placeholder:text-[var(--admin-muted-light)]

                focus:border-red-400

                focus:ring-2
                focus:ring-red-100

                disabled:opacity-60
              "
            />
          </label>
        </div>

        {/* FOOTER */}

        <footer
          className="
            flex
            items-center
            justify-end

            gap-2

            border-t
            border-[var(--admin-border)]

            px-6
            py-4
          "
        >
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="
              h-10

              rounded-xl

              px-4

              admin-text-14
              font-medium

              text-[var(--admin-muted)]

              transition

              hover:bg-[var(--admin-hover)]

              disabled:opacity-50
            "
          >
            {t("common.cancel")}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={!canDelete || submitting}
            className="
              inline-flex
              h-10
              min-w-32

              items-center
              justify-center
              gap-2

              rounded-xl

              bg-red-600

              px-4

              admin-text-14
              font-medium

              text-white

              transition

              hover:bg-red-700

              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            {submitting ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : (
              <Trash2 size={15} />
            )}

            {submitting
              ? t("project.delete.deleting")
              : t("project.delete.action")}
          </button>
        </footer>
      </div>
    </div>
  );
}
