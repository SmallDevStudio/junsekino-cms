"use client";

import { LoaderCircle, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function getTitle(award) {
  return (
    award?.title?.en?.trim() ||
    award?.title?.th?.trim() ||
    award?.slug ||
    "Award"
  );
}

export default function AwardDeleteDialog({
  open,
  companyId,
  award,
  onClose,
  onCompleted,
}) {
  const [deleting, setDeleting] = useState(false);

  if (!open || !award) {
    return null;
  }

  async function handleDelete() {
    try {
      setDeleting(true);

      const response = await fetch(
        `/api/v1/companies/${companyId}/awards/${award.id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || "Unable to delete award.");
      }

      toast.success("Award deleted successfully.");

      await onCompleted?.(payload.data);
    } catch (error) {
      console.error("Delete award error:", error);
      toast.error(error?.message || "Unable to delete award.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close delete dialog"
        className="absolute inset-0 bg-black/45"
        onClick={deleting ? undefined : onClose}
      />

      <div className="relative w-full max-w-md rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-2xl">
        <div className="flex items-start justify-between p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <Trash2 size={19} />
          </div>

          <button
            type="button"
            disabled={deleting}
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[var(--admin-hover)]"
          >
            <X size={17} />
          </button>
        </div>

        <div className="px-5 pb-5">
          <h2 className="text-lg font-semibold text-[var(--admin-foreground)]">
            Delete Award?
          </h2>

          <p className="mt-2 text-sm leading-6 text-[var(--admin-muted)]">
            <span className="font-medium text-[var(--admin-foreground)]">
              {getTitle(award)}
            </span>{" "}
            will be removed from the active award library.
          </p>
        </div>

        <div className="flex justify-end gap-3 border-t border-[var(--admin-border)] p-5">
          <button
            type="button"
            disabled={deleting}
            onClick={onClose}
            className="h-10 rounded-xl border border-[var(--admin-border)] px-4 text-sm font-medium"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={deleting}
            onClick={handleDelete}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {deleting ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : (
              <Trash2 size={15} />
            )}
            Delete Award
          </button>
        </div>
      </div>
    </div>
  );
}
