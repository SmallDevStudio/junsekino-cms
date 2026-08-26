"use client";

import { LoaderCircle, RotateCcw, Trash2, X } from "lucide-react";

export default function PublicContentConfirmDialog({
  open,
  mode = "delete",
  item,
  loading = false,
  onClose,
  onConfirm,
}) {
  if (!open) {
    return null;
  }

  const deleting = mode === "delete";

  const Icon = deleting ? Trash2 : RotateCcw;

  const title = deleting
    ? "Delete Public Content?"
    : item?.status === "scheduled"
      ? "Cancel Scheduled Publish?"
      : "Unpublish Content?";

  const description = deleting
    ? "This content will be archived and removed from the active content list."
    : item?.status === "scheduled"
      ? "The scheduled publish date will be removed and this content will return to Draft."
      : "This content will be removed from the public website and returned to Draft.";

  const actionLabel = deleting
    ? "Delete Content"
    : item?.status === "scheduled"
      ? "Cancel Schedule"
      : "Unpublish";

  return (
    <div className="fixed inset-0 z-[270] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close confirmation"
        className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
        disabled={loading}
        onClick={loading ? undefined : onClose}
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-2xl">
        <header className="flex items-start justify-between px-5 pt-5 sm:px-6 sm:pt-6">
          <div
            className={
              deleting
                ? "flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600"
                : "flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"
            }
          >
            <Icon size={19} />
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--admin-muted)] transition hover:bg-[var(--admin-hover)] disabled:opacity-50"
          >
            <X size={17} />
          </button>
        </header>

        <div className="px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
          <h2 className="text-lg font-semibold text-[var(--admin-foreground)]">
            {title}
          </h2>

          <p className="mt-2 text-sm leading-6 text-[var(--admin-muted)]">
            {description}
          </p>

          <div className="mt-4 rounded-2xl bg-[var(--admin-background)] p-4">
            <div className="truncate text-sm font-medium text-[var(--admin-foreground)]">
              {item?.title?.en?.trim() ||
                item?.title?.th?.trim() ||
                item?.slug ||
                "Untitled content"}
            </div>

            {item?.slug && (
              <div className="mt-1 truncate text-xs text-[var(--admin-muted)]">
                /{item.slug}
              </div>
            )}
          </div>
        </div>

        <footer className="flex items-center justify-end gap-3 border-t border-[var(--admin-border)] px-5 py-4 sm:px-6">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="h-10 rounded-xl px-4 text-sm font-medium text-[var(--admin-muted)] transition hover:bg-[var(--admin-hover)] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={
              deleting
                ? "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                : "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 text-sm font-medium text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
            }
          >
            {loading && <LoaderCircle size={15} className="animate-spin" />}

            {loading ? "Processing..." : actionLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}
