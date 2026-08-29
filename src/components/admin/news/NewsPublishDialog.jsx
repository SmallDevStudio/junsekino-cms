"use client";

import { CalendarClock, LoaderCircle, Send, X } from "lucide-react";

import { useEffect, useState } from "react";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { cn } from "@/utils/cn";

function toLocalDateTimeValue(date) {
  const pad = (value) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultSchedule() {
  const date = new Date();

  date.setMinutes(date.getMinutes() + 30);

  return toLocalDateTimeValue(date);
}

function getTitle(item, fallback) {
  return (
    item?.title?.en?.trim() || item?.title?.th?.trim() || item?.slug || fallback
  );
}

export default function NewsPublishDialog({
  open,
  item,
  loading = false,
  onClose,
  onPublishNow,
  onSchedule,
}) {
  const { t } = useAdminTranslation();

  const [mode, setMode] = useState("now");

  const [scheduledAt, setScheduledAt] = useState(defaultSchedule);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    const timer = window.setTimeout(() => {
      setMode("now");

      setScheduledAt(defaultSchedule());

      setError("");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [open, item?.id]);

  if (!open || !item) {
    return null;
  }

  const title = getTitle(item, t("news.manager.untitled"));

  function handleSubmit(event) {
    event.preventDefault();

    if (loading) {
      return;
    }

    if (mode === "now") {
      onPublishNow?.();

      return;
    }

    if (!scheduledAt) {
      setError(t("news.publish.errors.selectSchedule"));

      return;
    }

    const date = new Date(scheduledAt);

    if (Number.isNaN(date.getTime())) {
      setError(t("news.publish.errors.invalidSchedule"));

      return;
    }

    if (date.getTime() <= Date.now()) {
      setError(t("news.publish.errors.futureSchedule"));

      return;
    }

    onSchedule?.(date.toISOString());
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-[260]

        flex
        items-center
        justify-center

        p-4
      "
    >
      <button
        type="button"
        disabled={loading}
        onClick={onClose}
        className="
          absolute
          inset-0

          bg-black/45

          backdrop-blur-[2px]
        "
      />

      <form
        onSubmit={handleSubmit}
        className="
          relative

          w-full
          max-w-lg

          overflow-hidden

          rounded-3xl

          border
          border-[var(--admin-border)]

          bg-[var(--admin-surface)]

          shadow-2xl
        "
      >
        <header
          className="
            flex
            items-start
            justify-between

            gap-4

            border-b
            border-[var(--admin-border)]

            p-6
          "
        >
          <div>
            <div
              className="
                admin-text-10
                font-semibold
                uppercase
                tracking-[0.14em]

                text-[var(--company-primary)]
              "
            >
              {t("news.publish.sectionLabel")}
            </div>

            <h2
              className="
                mt-1

                admin-text-18
                font-semibold
              "
            >
              {title}
            </h2>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="
              flex
              h-9
              w-9

              items-center
              justify-center

              rounded-xl

              text-[var(--admin-muted)]

              hover:bg-[var(--admin-hover)]
            "
          >
            <X size={17} />
          </button>
        </header>

        <div className="p-6">
          <div
            className="
              grid
              gap-3

              sm:grid-cols-2
            "
          >
            <button
              type="button"
              onClick={() => setMode("now")}
              className={cn(
                "rounded-2xl border p-4 text-left transition",

                mode === "now"
                  ? "border-[var(--company-primary)] bg-[var(--company-primary-soft)]"
                  : "border-[var(--admin-border)] hover:bg-[var(--admin-hover)]",
              )}
            >
              <Send
                size={18}
                className={
                  mode === "now"
                    ? "text-[var(--company-primary)]"
                    : "text-[var(--admin-muted)]"
                }
              />

              <div
                className="
                  mt-3

                  admin-text-14
                  font-semibold
                "
              >
                {t("news.publish.now.title")}
              </div>

              <p
                className="
                  mt-1

                  admin-text-12

                  text-[var(--admin-muted)]
                "
              >
                {t("news.publish.now.description")}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setMode("schedule")}
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

              <div
                className="
                  mt-3

                  admin-text-14
                  font-semibold
                "
              >
                {t("news.publish.schedule.title")}
              </div>

              <p
                className="
                  mt-1

                  admin-text-12

                  text-[var(--admin-muted)]
                "
              >
                {t("news.publish.schedule.description")}
              </p>
            </button>
          </div>

          {mode === "schedule" && (
            <div className="mt-5">
              <label
                className="
                  admin-text-12
                  font-medium
                "
              >
                {t("news.publish.schedule.dateLabel")}
              </label>

              <input
                type="datetime-local"
                value={scheduledAt}
                min={toLocalDateTimeValue(new Date())}
                onChange={(event) => {
                  setScheduledAt(event.target.value);

                  setError("");
                }}
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

                  outline-none

                  focus:border-[var(--company-primary)]

                  focus:ring-2
                  focus:ring-[var(--company-primary-soft)]
                "
              />

              {error && (
                <div
                  className="
                    mt-2

                    admin-text-12

                    text-red-500
                  "
                >
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        <footer
          className="
            flex
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
            disabled={loading}
            onClick={onClose}
            className="
              h-10
              rounded-xl
              px-4

              admin-text-14

              text-[var(--admin-muted)]

              hover:bg-[var(--admin-hover)]
            "
          >
            {t("common.cancel")}
          </button>

          <button
            type="submit"
            disabled={loading}
            className="
              inline-flex
              h-10
              min-w-32

              items-center
              justify-center
              gap-2

              rounded-xl

              bg-[var(--company-primary)]

              px-4

              admin-text-14
              font-medium

              text-[var(--company-primary-foreground)]

              hover:bg-[var(--company-primary-hover)]

              disabled:opacity-50
            "
          >
            {loading ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : mode === "schedule" ? (
              <CalendarClock size={15} />
            ) : (
              <Send size={15} />
            )}

            {loading
              ? t("common.processing")
              : mode === "schedule"
                ? t("news.publish.schedule.action")
                : t("news.publish.now.action")}
          </button>
        </footer>
      </form>
    </div>
  );
}
