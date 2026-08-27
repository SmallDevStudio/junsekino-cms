"use client";

import { CalendarClock, LoaderCircle, Send, X } from "lucide-react";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { cn } from "@/utils/cn";

function getProjectTitle(project) {
  return (
    project?.title?.en?.trim() ||
    project?.title?.th?.trim() ||
    project?.slug ||
    "Untitled project"
  );
}

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

const PUBLISH_ERROR_MESSAGES = {
  PROJECT_TITLE_REQUIRED: "Project title is required before publishing.",

  PROJECT_CONTENT_REQUIRED: "Project content is required before publishing.",

  PROJECT_CATEGORY_REQUIRED: "Project category is required before publishing.",

  PROJECT_CATEGORY_NOT_FOUND: "Selected project category was not found.",

  PROJECT_SUBCATEGORY_NOT_FOUND: "Selected project sub-category was not found.",

  PROJECT_SUBCATEGORY_INVALID_PARENT:
    "Selected sub-category does not belong to the selected category.",

  INVALID_SCHEDULE_DATE: "Invalid publishing date and time.",

  SCHEDULE_MUST_BE_FUTURE: "Scheduled publishing time must be in the future.",
};

export default function ProjectPublishDialog({
  open,
  companyId,
  project,
  onClose,
  onCompleted,
}) {
  const [mode, setMode] = useState("now");

  const [scheduledAt, setScheduledAt] = useState(() =>
    getDefaultScheduleValue(),
  );

  const [submitting, setSubmitting] = useState(false);

  const projectTitle = useMemo(() => getProjectTitle(project), [project]);

  if (!open || !project) {
    return null;
  }

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

  async function handleConfirm() {
    if (!companyId || !project?.id || submitting) {
      return;
    }

    let normalizedScheduledAt = null;

    if (mode === "schedule") {
      if (!scheduledAt) {
        toast.error("Select a publishing date and time.");

        return;
      }

      const date = new Date(scheduledAt);

      if (Number.isNaN(date.getTime())) {
        toast.error("Invalid publishing date and time.");

        return;
      }

      if (date.getTime() <= Date.now()) {
        toast.error("Scheduled publishing time must be in the future.");

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
        throw new Error(
          payload?.message ||
            (mode === "schedule"
              ? "Unable to schedule project."
              : "Unable to publish project."),
        );
      }

      toast.success(
        mode === "schedule"
          ? "Project scheduled successfully."
          : "Project published successfully.",
      );

      resetForm();

      await onCompleted?.(payload.data);
    } catch (error) {
      console.error("Publish project error:", error);

      toast.error(
        PUBLISH_ERROR_MESSAGES[error?.message] ||
          error?.message ||
          (mode === "schedule"
            ? "Unable to schedule project."
            : "Unable to publish project."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close publish dialog"
        onClick={handleClose}
        disabled={submitting}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
      />

      <div
        className={cn(
          "relative z-10 w-full max-w-lg",
          "overflow-hidden rounded-3xl",
          "border border-[var(--admin-border)]",
          "bg-[var(--admin-surface)]",
          "shadow-2xl",
        )}
      >
        <header className="flex items-start justify-between border-b border-[var(--admin-border)] px-6 py-5">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--admin-muted)]">
              Publishing
            </div>

            <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-[var(--admin-foreground)]">
              Publish Project
            </h2>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            aria-label="Close"
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
              disabled:opacity-50
            "
          >
            <X size={17} />
          </button>
        </header>

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

          <h3 className="mt-4 text-sm font-semibold text-[var(--admin-foreground)]">
            {projectTitle}
          </h3>

          {project.slug && (
            <div className="mt-1 text-xs text-[var(--admin-muted)]">
              /{project.slug}
            </div>
          )}

          <p className="mt-4 text-sm leading-6 text-[var(--admin-muted)]">
            Publish this project immediately or schedule it to become public at
            a future date and time.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => setMode("now")}
              className={cn(
                "rounded-2xl border p-4 text-left transition",

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
              <div className="flex items-center gap-2">
                <Send
                  size={16}
                  className={
                    mode === "now"
                      ? "text-[var(--company-primary)]"
                      : "text-[var(--admin-muted)]"
                  }
                />

                <span className="text-sm font-semibold text-[var(--admin-foreground)]">
                  Publish Now
                </span>
              </div>

              <p className="mt-2 text-xs leading-5 text-[var(--admin-muted)]">
                Make this project publicly available immediately.
              </p>
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => setMode("schedule")}
              className={cn(
                "rounded-2xl border p-4 text-left transition",

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
              <div className="flex items-center gap-2">
                <CalendarClock
                  size={16}
                  className={
                    mode === "schedule"
                      ? "text-[var(--company-primary)]"
                      : "text-[var(--admin-muted)]"
                  }
                />

                <span className="text-sm font-semibold text-[var(--admin-foreground)]">
                  Schedule
                </span>
              </div>

              <p className="mt-2 text-xs leading-5 text-[var(--admin-muted)]">
                Publish automatically at a selected future time.
              </p>
            </button>
          </div>

          {mode === "schedule" && (
            <div className="mt-5">
              <label className="block">
                <span className="text-xs font-medium text-[var(--admin-muted)]">
                  Publishing Date & Time
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
                    text-sm
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

          <div className="mt-6 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-hover)] p-4">
            <div className="text-[11px] font-medium text-[var(--admin-foreground)]">
              Public website visibility
            </div>

            <p className="mt-1 text-[11px] leading-5 text-[var(--admin-muted)]">
              Once published, this project can appear on the public website and
              its Project category can become visible in public navigation.
            </p>
          </div>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-[var(--admin-border)] px-6 py-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="
              h-10
              rounded-xl
              px-4
              text-sm
              font-medium
              text-[var(--admin-muted)]
              transition
              hover:bg-[var(--admin-hover)]
              disabled:opacity-50
            "
          >
            Cancel
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
              text-sm
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
                ? "Scheduling..."
                : "Publishing..."
              : mode === "schedule"
                ? "Schedule Project"
                : "Publish Project"}
          </button>
        </footer>
      </div>
    </div>
  );
}
