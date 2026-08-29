"use client";

import { CalendarX2, LoaderCircle, RotateCcw, X } from "lucide-react";

import { useMemo, useState } from "react";

import { toast } from "sonner";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { cn } from "@/utils/cn";

export default function ProjectUnpublishDialog({
  open,
  companyId,
  project,
  onClose,
  onCompleted,
}) {
  const { t } = useAdminTranslation();

  const [submitting, setSubmitting] = useState(false);

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

  const scheduled = project.status === "scheduled";

  /*
   * =======================================================
   * CONFIRM
   * =======================================================
   */

  async function handleConfirm() {
    if (!companyId || !project?.id || submitting) {
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `/api/v1/companies/${companyId}/projects/${project.id}/unpublish`,
        {
          method: "POST",

          credentials: "include",
        },
      );

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.message ||
            (scheduled
              ? t("project.unpublish.errors.cancelScheduleFailed")
              : t("project.unpublish.errors.unpublishFailed")),
        );
      }

      toast.success(
        scheduled
          ? t("project.unpublish.messages.scheduleCancelled")
          : t("project.unpublish.messages.unpublished"),
      );

      await onCompleted?.(payload.data);
    } catch (error) {
      console.error("Unpublish project error:", error);

      toast.error(
        error?.message ||
          (scheduled
            ? t("project.unpublish.errors.cancelScheduleFailed")
            : t("project.unpublish.errors.unpublishFailed")),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    if (submitting) {
      return;
    }

    onClose?.();
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-[220]

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

          bg-black/40

          backdrop-blur-[2px]
        "
      />

      <div
        className={cn(
          "relative z-10",

          "w-full max-w-md",

          "overflow-hidden",

          "rounded-3xl",

          "border border-[var(--admin-border)]",

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

                text-[var(--company-primary)]
              "
            >
              {t("project.publish.sectionLabel")}
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
              {scheduled
                ? t("project.unpublish.cancelScheduleTitle")
                : t("project.unpublish.title")}
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
            className={cn(
              "flex h-11 w-11",

              "items-center justify-center",

              "rounded-2xl",

              scheduled
                ? "bg-amber-50 text-amber-600"
                : "bg-[var(--company-primary-soft)] text-[var(--company-primary)]",
            )}
          >
            {scheduled ? <CalendarX2 size={20} /> : <RotateCcw size={20} />}
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
            {scheduled
              ? t("project.unpublish.cancelScheduleDescription")
              : t("project.unpublish.description")}
          </p>

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
                admin-text-11
                font-medium

                text-[var(--admin-foreground)]
              "
            >
              {t("project.unpublish.contentSafe.title")}
            </div>

            <p
              className="
                mt-1

                admin-text-11
                leading-[1.65]

                text-[var(--admin-muted)]
              "
            >
              {t("project.unpublish.contentSafe.description")}
            </p>
          </div>
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
            {t("project.unpublish.keepStatus")}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className={cn(
              "inline-flex h-10",

              "items-center justify-center gap-2",

              "rounded-xl",

              "px-4",

              "admin-text-14 font-medium",

              scheduled
                ? "bg-amber-500 text-white"
                : "bg-[var(--company-primary)] text-[var(--company-primary-foreground)]",

              "transition",

              scheduled
                ? "hover:bg-amber-600"
                : "hover:bg-[var(--company-primary-hover)]",

              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {submitting ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : scheduled ? (
              <CalendarX2 size={15} />
            ) : (
              <RotateCcw size={15} />
            )}

            {submitting
              ? t("common.processing")
              : scheduled
                ? t("project.unpublish.cancelScheduleAction")
                : t("project.unpublish.action")}
          </button>
        </footer>
      </div>
    </div>
  );
}
