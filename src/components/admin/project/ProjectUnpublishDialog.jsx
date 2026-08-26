"use client";

import { CalendarX2, LoaderCircle, RotateCcw, X } from "lucide-react";

import { useState } from "react";
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

export default function ProjectUnpublishDialog({
  open,
  companyId,
  project,
  onClose,
  onCompleted,
}) {
  const [submitting, setSubmitting] = useState(false);

  if (!open || !project) {
    return null;
  }

  const scheduled = project.status === "scheduled";

  async function handleConfirm() {
    if (!companyId || !project?.id) {
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
              ? "Unable to cancel schedule."
              : "Unable to unpublish project."),
        );
      }

      toast.success(
        scheduled ? "Scheduled publishing cancelled." : "Project unpublished.",
      );

      await onCompleted?.(payload.data);
    } catch (error) {
      console.error("Unpublish project error:", error);

      toast.error(
        error?.message ||
          (scheduled
            ? "Unable to cancel schedule."
            : "Unable to unpublish project."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
      />

      <div
        className={cn(
          "relative z-10 w-full max-w-md",
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
              {scheduled ? "Cancel Schedule" : "Unpublish Project"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--admin-muted)] transition hover:bg-[var(--admin-hover)] disabled:opacity-50"
          >
            <X size={17} />
          </button>
        </header>

        <div className="p-6">
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center",
              "rounded-2xl",
              scheduled
                ? "bg-amber-50 text-amber-600"
                : "bg-neutral-100 text-neutral-600",
            )}
          >
            {scheduled ? <CalendarX2 size={20} /> : <RotateCcw size={20} />}
          </div>

          <h3 className="mt-4 text-sm font-semibold text-[var(--admin-foreground)]">
            {getProjectTitle(project)}
          </h3>

          {project.slug && (
            <div className="mt-1 text-xs text-[var(--admin-muted)]">
              /{project.slug}
            </div>
          )}

          <p className="mt-4 text-sm leading-6 text-[var(--admin-muted)]">
            {scheduled
              ? "This will cancel the scheduled publishing time and return the project to Draft."
              : "This project will no longer be publicly published and will return to Draft."}
          </p>

          <div className="mt-5 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-hover)] p-4">
            <div className="text-[11px] font-medium text-[var(--admin-foreground)]">
              Project content will not be deleted.
            </div>

            <p className="mt-1 text-[11px] leading-5 text-[var(--admin-muted)]">
              You can continue editing and publish the project again later.
            </p>
          </div>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-[var(--admin-border)] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-10 rounded-xl px-4 text-sm font-medium text-[var(--admin-muted)] transition hover:bg-[var(--admin-hover)]"
          >
            Keep Current Status
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className={cn(
              "inline-flex h-10 items-center justify-center gap-2",
              "rounded-xl px-4",
              "text-sm font-medium",
              scheduled
                ? "bg-amber-500 text-white"
                : "bg-neutral-900 text-white",
              "transition hover:opacity-90",
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
              ? "Processing..."
              : scheduled
                ? "Cancel Schedule"
                : "Unpublish"}
          </button>
        </footer>
      </div>
    </div>
  );
}
