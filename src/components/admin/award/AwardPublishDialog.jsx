"use client";

import { CalendarClock, LoaderCircle, Send, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function getTitle(award) {
  return (
    award?.title?.en?.trim() ||
    award?.title?.th?.trim() ||
    award?.slug ||
    "Award"
  );
}

export default function AwardPublishDialog({
  open,
  companyId,
  award,
  onClose,
  onCompleted,
}) {
  const [mode, setMode] = useState("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setMode("now");
      setScheduledAt("");
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [open, award]);

  if (!open || !award) {
    return null;
  }

  async function handleSubmit() {
    if (mode === "schedule" && !scheduledAt) {
      toast.error("Select a schedule date and time.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `/api/v1/companies/${companyId}/awards/${award.id}/publish`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            scheduledAt:
              mode === "schedule" ? new Date(scheduledAt).toISOString() : null,
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || "Unable to publish award.");
      }

      toast.success(
        mode === "schedule"
          ? "Award scheduled successfully."
          : "Award published successfully.",
      );

      await onCompleted?.(payload.data);
    } catch (error) {
      console.error("Publish award error:", error);
      toast.error(error?.message || "Unable to publish award.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close publish dialog"
        className="absolute inset-0 bg-black/45"
        onClick={submitting ? undefined : onClose}
      />

      <div className="relative w-full max-w-lg rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-2xl">
        <div className="flex items-start justify-between border-b border-[var(--admin-border)] p-5">
          <div>
            <h2 className="text-lg font-semibold text-[var(--admin-foreground)]">
              Publish Award
            </h2>

            <p className="mt-1 text-xs text-[var(--admin-muted)]">
              {getTitle(award)}
            </p>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[var(--admin-hover)]"
          >
            <X size={17} />
          </button>
        </div>

        <div className="space-y-3 p-5">
          <button
            type="button"
            onClick={() => setMode("now")}
            className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left ${
              mode === "now"
                ? "border-[var(--company-primary)] bg-[var(--company-primary-soft)]"
                : "border-[var(--admin-border)]"
            }`}
          >
            <Send size={18} />

            <div>
              <div className="text-sm font-medium text-[var(--admin-foreground)]">
                Publish now
              </div>

              <div className="mt-0.5 text-xs text-[var(--admin-muted)]">
                Make this award public immediately.
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMode("schedule")}
            className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left ${
              mode === "schedule"
                ? "border-[var(--company-primary)] bg-[var(--company-primary-soft)]"
                : "border-[var(--admin-border)]"
            }`}
          >
            <CalendarClock size={18} />

            <div>
              <div className="text-sm font-medium text-[var(--admin-foreground)]">
                Schedule
              </div>

              <div className="mt-0.5 text-xs text-[var(--admin-muted)]">
                Publish automatically at a future date.
              </div>
            </div>
          </button>

          {mode === "schedule" && (
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              className="h-11 w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 text-sm text-[var(--admin-foreground)] outline-none focus:border-[var(--company-primary)]"
            />
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-[var(--admin-border)] p-5">
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="h-10 rounded-xl border border-[var(--admin-border)] px-4 text-sm font-medium"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--company-primary)] px-4 text-sm font-medium text-[var(--company-primary-foreground)] disabled:opacity-60"
          >
            {submitting ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : (
              <Send size={15} />
            )}

            {mode === "schedule" ? "Schedule" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
