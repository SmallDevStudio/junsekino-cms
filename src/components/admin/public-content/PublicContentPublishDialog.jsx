"use client";

import { CalendarClock, LoaderCircle, Send, X } from "lucide-react";

import { useEffect, useState } from "react";

import { cn } from "@/utils/cn";

function toLocalDateTimeValue(date) {
  const pad = (value) => String(value).padStart(2, "0");

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

  return toLocalDateTimeValue(date);
}

export default function PublicContentPublishDialog({
  open,
  item,
  loading = false,
  onClose,
  onPublishNow,
  onSchedule,
}) {
  const [mode, setMode] = useState("publish");
  const [scheduledAt, setScheduledAt] = useState(getDefaultScheduleValue);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setMode("publish");
      setScheduledAt(getDefaultScheduleValue());
      setError("");
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [open, item?.id]);

  if (!open) {
    return null;
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (loading) {
      return;
    }

    if (mode === "publish") {
      onPublishNow?.();
      return;
    }

    if (!scheduledAt) {
      setError("Select a publish date and time.");
      return;
    }

    const date = new Date(scheduledAt);

    if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
      setError("Scheduled time must be in the future.");
      return;
    }

    setError("");

    onSchedule?.(date.toISOString());
  }

  return (
    <div className="fixed inset-0 z-[260] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close publish dialog"
        className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
        disabled={loading}
        onClick={loading ? undefined : onClose}
      />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-2xl"
      >
        <header className="flex items-start justify-between border-b border-[var(--admin-border)] px-5 py-5 sm:px-6">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--admin-muted)]">
              Publish Content
            </div>

            <h2 className="mt-1 text-lg font-semibold text-[var(--admin-foreground)]">
              {item?.title?.en?.trim() ||
                item?.title?.th?.trim() ||
                item?.slug ||
                "Public content"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--admin-muted)] transition hover:bg-[var(--admin-hover)] disabled:opacity-50"
          >
            <X size={17} />
          </button>
        </header>

        <div className="p-5 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setMode("publish");
                setError("");
              }}
              className={cn(
                "rounded-2xl border p-4 text-left transition",
                mode === "publish"
                  ? "border-[var(--company-primary)] bg-[var(--company-primary-soft)]"
                  : "border-[var(--admin-border)] hover:bg-[var(--admin-hover)]",
              )}
            >
              <Send
                size={18}
                className={
                  mode === "publish"
                    ? "text-[var(--company-primary)]"
                    : "text-[var(--admin-muted)]"
                }
              />

              <div className="mt-3 text-sm font-semibold text-[var(--admin-foreground)]">
                Publish Now
              </div>

              <p className="mt-1 text-xs leading-5 text-[var(--admin-muted)]">
                Make this content public immediately.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("schedule");
                setError("");
              }}
              className={cn(
                "rounded-2xl border p-4 text-left transition",
                mode === "schedule"
                  ? "border-[var(--company-primary)] bg-[var(--company-primary-soft)]"
                  : "border-[var(--admin-border)] hover:bg-[var(--admin-hover)]",
              )}
            >
              <CalendarClock
                size={18}
                className={
                  mode === "schedule"
                    ? "text-[var(--company-primary)]"
                    : "text-[var(--admin-muted)]"
                }
              />

              <div className="mt-3 text-sm font-semibold text-[var(--admin-foreground)]">
                Schedule
              </div>

              <p className="mt-1 text-xs leading-5 text-[var(--admin-muted)]">
                Publish automatically at a future date.
              </p>
            </button>
          </div>

          {mode === "schedule" && (
            <div className="mt-5">
              <label className="block">
                <span className="text-xs font-medium text-[var(--admin-muted)]">
                  Publish Date & Time
                  <span className="ml-1 text-red-500">*</span>
                </span>

                <input
                  type="datetime-local"
                  value={scheduledAt}
                  min={toLocalDateTimeValue(new Date())}
                  onChange={(event) => {
                    setScheduledAt(event.target.value);
                    setError("");
                  }}
                  className={cn(
                    "mt-2 h-11 w-full rounded-xl border bg-[var(--admin-surface)] px-3",
                    "text-sm text-[var(--admin-foreground)] outline-none transition",
                    error
                      ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/15"
                      : "border-[var(--admin-border)] focus:border-[var(--company-primary)] focus:ring-2 focus:ring-[var(--company-primary-soft)]",
                  )}
                />
              </label>

              {error && (
                <p className="mt-2 text-xs font-medium text-red-500">{error}</p>
              )}
            </div>
          )}
        </div>

        <footer className="flex items-center justify-end gap-3 border-t border-[var(--admin-border)] px-5 py-4 sm:px-6">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="h-10 rounded-xl px-4 text-sm font-medium text-[var(--admin-muted)] transition hover:bg-[var(--admin-hover)] hover:text-[var(--admin-foreground)] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-10 min-w-32 items-center justify-center gap-2 rounded-xl bg-[var(--company-primary)] px-5 text-sm font-medium text-[var(--company-primary-foreground)] transition hover:bg-[var(--company-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <LoaderCircle size={15} className="animate-spin" />}

            {loading
              ? "Processing..."
              : mode === "schedule"
                ? "Schedule"
                : "Publish Now"}
          </button>
        </footer>
      </form>
    </div>
  );
}
