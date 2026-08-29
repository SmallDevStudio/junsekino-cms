"use client";

import { CalendarClock, LoaderCircle, Send, X } from "lucide-react";

import { useMemo, useState } from "react";

import { toast } from "sonner";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { cn } from "@/utils/cn";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function pad(value) {
  return String(value).padStart(2, "0");
}

function toDateTimeLocalValue(date) {
  return [
    date.getFullYear(),
    "-",
    pad(date.getMonth() + 1),
    "-",
    pad(date.getDate()),
    "T",
    pad(date.getHours()),
    ":",
    pad(date.getMinutes()),
  ].join("");
}

function getDefaultScheduleValue() {
  const date = new Date();

  date.setMinutes(date.getMinutes() + 30);

  return toDateTimeLocalValue(date);
}

/*
 * =========================================================
 * PUBLISH DIALOG
 * =========================================================
 */

export default function ProjectPublishDialog({
  open,
  companyId,
  project,
  onClose,
  onCompleted,
}) {
  const { t } = useAdminTranslation();

  const [mode, setMode] = useState("now");

  const [scheduledAt, setScheduledAt] = useState(() =>
    getDefaultScheduleValue(),
  );

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

  /*
   * =======================================================
   * RESET
   * =======================================================
   */

  function resetForm() {
    setMode("now");

    setScheduledAt(getDefaultScheduleValue());
  }

  function handleClose() {
    if (submitting) {
      return;
    }

    resetForm();

    onClose?.();
  }

  /*
   * =======================================================
   * ERROR MESSAGE
   * =======================================================
   */

  function getPublishErrorMessage(code) {
    const map = {
      PROJECT_TITLE_REQUIRED: "project.publish.errors.titleRequired",

      PROJECT_CONTENT_REQUIRED: "project.publish.errors.contentRequired",

      PROJECT_CATEGORY_REQUIRED: "project.publish.errors.categoryRequired",

      PROJECT_CATEGORY_NOT_FOUND: "project.publish.errors.categoryNotFound",

      PROJECT_SUBCATEGORY_NOT_FOUND:
        "project.publish.errors.subCategoryNotFound",

      PROJECT_SUBCATEGORY_INVALID_PARENT:
        "project.publish.errors.invalidSubCategory",

      INVALID_SCHEDULE_DATE: "project.publish.errors.invalidSchedule",

      SCHEDULE_MUST_BE_FUTURE: "project.publish.errors.scheduleFuture",
    };

    const key = map[code];

    return key ? t(key) : null;
  }

  /*
   * =======================================================
   * CONFIRM
   * =======================================================
   */

  async function handleConfirm() {
    if (!companyId || !project?.id || submitting) {
      return;
    }

    let normalizedScheduledAt = null;

    if (mode === "schedule") {
      if (!scheduledAt) {
        toast.error(t("project.publish.errors.selectSchedule"));

        return;
      }

      const date = new Date(scheduledAt);

      if (Number.isNaN(date.getTime())) {
        toast.error(t("project.publish.errors.invalidSchedule"));

        return;
      }

      if (date.getTime() <= Date.now()) {
        toast.error(t("project.publish.errors.scheduleFuture"));

        return;
      }

      normalizedScheduledAt = date.toISOString();
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `/api/v1/companies/${companyId}/projects/${project.id}/publish`,
        {
          method: "POST",

          credentials: "include",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            scheduledAt: normalizedScheduledAt,
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        const mapped = getPublishErrorMessage(
          payload?.code || payload?.message,
        );

        throw new Error(
          mapped ||
            payload?.message ||
            (mode === "schedule"
              ? t("project.publish.errors.scheduleFailed")
              : t("project.publish.errors.publishFailed")),
        );
      }

      toast.success(
        mode === "schedule"
          ? t("project.publish.messages.scheduled")
          : t("project.publish.messages.published"),
      );

      resetForm();

      await onCompleted?.(payload.data);
    } catch (error) {
      console.error("Publish project error:", error);

      toast.error(
        error?.message ||
          (mode === "schedule"
            ? t("project.publish.errors.scheduleFailed")
            : t("project.publish.errors.publishFailed")),
      );
    } finally {
      setSubmitting(false);
    }
  }

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

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

          "w-full max-w-lg",

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
              {t("project.publish.title")}
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
              h-11
              w-11

              items-center
              justify-center

              rounded-2xl

              bg-[var(--company-primary-soft)]

              text-[var(--company-primary)]
            "
          >
            {mode === "schedule" ? (
              <CalendarClock size={20} />
            ) : (
              <Send size={20} />
            )}
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
            {t("project.publish.description")}
          </p>

          {/* MODE */}

          <div
            className="
              mt-6

              grid
              gap-3

              sm:grid-cols-2
            "
          >
            <button
              type="button"
              disabled={submitting}
              onClick={() => setMode("now")}
              className={cn(
                "rounded-2xl",

                "border",

                "p-4",

                "text-left",

                "transition",

                mode === "now"
                  ? [
                      "border-[var(--company-primary)]",

                      "bg-[var(--company-primary-soft)]",

                      "ring-1 ring-[var(--company-primary)]",
                    ]
                  : [
                      "border-[var(--admin-border)]",

                      "hover:bg-[var(--admin-hover)]",
                    ],
              )}
            >
              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >
                <Send
                  size={16}
                  className={
                    mode === "now"
                      ? "text-[var(--company-primary)]"
                      : "text-[var(--admin-muted)]"
                  }
                />

                <span
                  className="
                    admin-text-14
                    font-semibold

                    text-[var(--admin-foreground)]
                  "
                >
                  {t("project.publish.now.title")}
                </span>
              </div>

              <p
                className="
                  mt-2

                  admin-text-12
                  leading-[1.6]

                  text-[var(--admin-muted)]
                "
              >
                {t("project.publish.now.description")}
              </p>
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => setMode("schedule")}
              className={cn(
                "rounded-2xl",

                "border",

                "p-4",

                "text-left",

                "transition",

                mode === "schedule"
                  ? [
                      "border-[var(--company-primary)]",

                      "bg-[var(--company-primary-soft)]",

                      "ring-1 ring-[var(--company-primary)]",
                    ]
                  : [
                      "border-[var(--admin-border)]",

                      "hover:bg-[var(--admin-hover)]",
                    ],
              )}
            >
              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >
                <CalendarClock
                  size={16}
                  className={
                    mode === "schedule"
                      ? "text-[var(--company-primary)]"
                      : "text-[var(--admin-muted)]"
                  }
                />

                <span
                  className="
                    admin-text-14
                    font-semibold

                    text-[var(--admin-foreground)]
                  "
                >
                  {t("project.publish.schedule.title")}
                </span>
              </div>

              <p
                className="
                  mt-2

                  admin-text-12
                  leading-[1.6]

                  text-[var(--admin-muted)]
                "
              >
                {t("project.publish.schedule.description")}
              </p>
            </button>
          </div>

          {/* DATE */}

          {mode === "schedule" && (
            <div className="mt-5">
              <label className="block">
                <span
                  className="
                    admin-text-12
                    font-medium

                    text-[var(--admin-muted)]
                  "
                >
                  {t("project.publish.schedule.dateLabel")}
                </span>

                <input
                  type="datetime-local"
                  value={scheduledAt}
                  min={toDateTimeLocalValue(new Date())}
                  disabled={submitting}
                  onChange={(event) => setScheduledAt(event.target.value)}
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

                    focus:border-[var(--company-primary)]

                    focus:ring-2
                    focus:ring-[var(--company-primary-soft)]

                    disabled:opacity-60
                  "
                />
              </label>
            </div>
          )}

          {/* INFO */}

          <div
            className="
              mt-6

              rounded-2xl

              border
              border-[var(--company-primary-border)]

              bg-[var(--company-primary-soft)]

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
              {t("project.publish.visibility.title")}
            </div>

            <p
              className="
                mt-1

                admin-text-11
                leading-[1.65]

                text-[var(--admin-muted)]
              "
            >
              {t("project.publish.visibility.description")}
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
            {t("common.cancel")}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="
              inline-flex
              h-10

              items-center
              justify-center
              gap-2

              rounded-xl

              bg-[var(--company-primary)]

              px-5

              admin-text-14
              font-medium

              text-[var(--company-primary-foreground)]

              transition

              hover:bg-[var(--company-primary-hover)]

              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {submitting ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : mode === "schedule" ? (
              <CalendarClock size={15} />
            ) : (
              <Send size={15} />
            )}

            {submitting
              ? mode === "schedule"
                ? t("project.publish.schedule.scheduling")
                : t("project.publish.now.publishing")
              : mode === "schedule"
                ? t("project.publish.schedule.action")
                : t("project.publish.now.action")}
          </button>
        </footer>
      </div>
    </div>
  );
}
