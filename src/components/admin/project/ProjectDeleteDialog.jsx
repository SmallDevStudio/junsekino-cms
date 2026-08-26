"use client";

import { AlertTriangle, LoaderCircle, Trash2, X } from "lucide-react";

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

export default function ProjectDeleteDialog({
  open,
  companyId,
  project,
  onClose,
  onCompleted,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState("");

  if (!open || !project) {
    return null;
  }

  const projectTitle = getProjectTitle(project);

  const canDelete = confirmation.trim().toLowerCase() === "delete";

  async function handleDelete() {
    if (!companyId || !project?.id || !canDelete) {
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
          PROJECT_NOT_FOUND: "Project not found.",

          PROJECT_ALREADY_DELETED: "Project has already been deleted.",
        };

        throw new Error(
          messages[payload?.message] ||
            payload?.message ||
            "Unable to delete project.",
        );
      }

      toast.success("Project deleted.");

      setConfirmation("");

      await onCompleted?.(payload.data);
    } catch (error) {
      console.error("Delete project error:", error);

      toast.error(error?.message || "Unable to delete project.");
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
    <div className="fixed inset-0 z-[230] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close delete dialog"
        onClick={handleClose}
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
      />

      <div
        className={cn(
          "relative z-10 w-full max-w-md",
          "overflow-hidden rounded-3xl",
          "border border-red-200",
          "bg-[var(--admin-surface)]",
          "shadow-2xl",
        )}
      >
        {/* Header */}

        <header className="flex items-start justify-between border-b border-[var(--admin-border)] px-6 py-5">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.12em] text-red-500">
              Destructive Action
            </div>

            <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-[var(--admin-foreground)]">
              Delete Project
            </h2>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--admin-muted)] transition hover:bg-[var(--admin-hover)] disabled:opacity-50"
          >
            <X size={17} />
          </button>
        </header>

        {/* Content */}

        <div className="p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertTriangle size={21} strokeWidth={1.8} />
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
            This project will be removed from the active CMS project list and
            archived internally.
          </p>

          {(project.status === "published" ||
            project.status === "scheduled") && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="text-xs font-semibold text-amber-800">
                {project.status === "published"
                  ? "This project is currently published."
                  : "This project is currently scheduled."}
              </div>

              <p className="mt-1 text-xs leading-5 text-amber-700">
                Deleting it will remove it from the active content collection.
                Continue only if this is intentional.
              </p>
            </div>
          )}

          <div className="mt-5 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-hover)] p-4">
            <div className="text-xs font-medium text-[var(--admin-foreground)]">
              This is a soft delete.
            </div>

            <p className="mt-1 text-xs leading-5 text-[var(--admin-muted)]">
              The database record and audit history are preserved. Restore
              functionality can be added later.
            </p>
          </div>

          {/* Confirmation */}

          <label className="mt-5 block">
            <span className="text-xs font-medium text-[var(--admin-foreground)]">
              Type <span className="font-semibold text-red-600">DELETE</span> to
              confirm
            </span>

            <input
              type="text"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              disabled={submitting}
              autoComplete="off"
              placeholder="DELETE"
              className={cn(
                "mt-2 h-11 w-full rounded-xl",
                "border border-[var(--admin-border)]",
                "bg-[var(--admin-surface)] px-3",
                "text-sm text-[var(--admin-foreground)]",
                "outline-none transition",
                "placeholder:text-[var(--admin-muted-light)]",
                "focus:border-red-400",
                "focus:ring-2 focus:ring-red-100",
                "disabled:opacity-60",
              )}
            />
          </label>
        </div>

        {/* Footer */}

        <footer className="flex items-center justify-end gap-2 border-t border-[var(--admin-border)] px-6 py-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="h-10 rounded-xl px-4 text-sm font-medium text-[var(--admin-muted)] transition hover:bg-[var(--admin-hover)] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={!canDelete || submitting}
            className={cn(
              "inline-flex h-10 min-w-32 items-center justify-center gap-2",
              "rounded-xl bg-red-600 px-4",
              "text-sm font-medium text-white",
              "transition hover:bg-red-700",
              "disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            {submitting ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : (
              <Trash2 size={15} />
            )}

            {submitting ? "Deleting..." : "Delete Project"}
          </button>
        </footer>
      </div>
    </div>
  );
}
