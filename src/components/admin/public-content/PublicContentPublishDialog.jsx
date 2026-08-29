"use client";

import { CalendarClock, LoaderCircle, Send, X } from "lucide-react";

import { useEffect, useState } from "react";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { cn } from "@/utils/cn";

/*
 * =========================================================
 * DATE HELPERS
 * =========================================================
 */

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

function getItemTitle(item, fallback) {
  return (
    item?.title?.en?.trim() || item?.title?.th?.trim() || item?.slug || fallback
  );
}

/*
 * =========================================================
 * DIALOG
 * =========================================================
 */

export default function PublicContentPublishDialog({
  open,

  item,

  loading = false,

  onClose,

  onPublishNow,

  onSchedule,
}) {
  const { t } = useAdminTranslation();

  const [mode, setMode] = useState("publish");

  const [scheduledAt, setScheduledAt] = useState(getDefaultScheduleValue);

  const [error, setError] = useState("");

  /*
   * =======================================================
   * RESET
   * =======================================================
   */

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

  const title = getItemTitle(
    item,

    t("publicContent.manager.untitled"),
  );

  /*
   * =======================================================
   * CLOSE
   * =======================================================
   */

  function handleClose() {
    if (loading) {
      return;
    }

    onClose?.();
  }

  /*
   * =======================================================
   * SUBMIT
   * =======================================================
   */

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
      setError(t("publicContent.publish.errors.selectSchedule"));

      return;
    }

    const date = new Date(scheduledAt);

    if (Number.isNaN(date.getTime())) {
      setError(t("publicContent.publish.errors.invalidSchedule"));

      return;
    }

    if (date.getTime() <= Date.now()) {
      setError(t("publicContent.publish.errors.futureSchedule"));

      return;
    }

    setError("");

    onSchedule?.(date.toISOString());
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
        z-[260]

        flex
        items-center
        justify-center

        p-4
      "
    >
      {/* BACKDROP */}

      <button
        type="button"
        aria-label={t("common.close")}
        disabled={loading}
        onClick={handleClose}
        className="
          absolute
          inset-0

          bg-black/45

          backdrop-blur-[2px]
        "
      />

      {/* DIALOG */}

      <form
        onSubmit={handleSubmit}
        className="
          relative
          z-10

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
        {/* HEADER */}

        <header
          className="
            flex
            items-start
            justify-between

            gap-4

            border-b
            border-[var(--admin-border)]

            px-5
            py-5

            sm:px-6
          "
        >
          <div className="min-w-0">
            <div
              className="
                admin-text-10
                font-semibold
                uppercase
                tracking-[0.14em]

                text-[var(--company-primary)]
              "
            >
              {t("publicContent.publish.sectionLabel")}
            </div>

            <h2
              className="
                mt-1

                truncate

                admin-text-18
                font-semibold
                tracking-[-0.02em]

                text-[var(--admin-foreground)]
              "
            >
              {title}
            </h2>

            <p
              className="
                mt-1

                admin-text-12

                text-[var(--admin-muted)]
              "
            >
              {t("publicContent.publish.description")}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            aria-label={t("common.close")}
            title={t("common.close")}
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

              hover:text-[var(--admin-foreground)]

              disabled:opacity-50
            "
          >
            <X size={17} />
          </button>
        </header>

        {/* BODY */}

        <div
          className="
            p-5

            sm:p-6
          "
        >
          <div
            className="
              grid
              gap-3

              sm:grid-cols-2
            "
          >
            {/* PUBLISH NOW */}

            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setMode("publish");

                setError("");
              }}
              className={cn(
                "rounded-2xl",

                "border",

                "p-4",

                "text-left",

                "transition",

                mode === "publish"
                  ? [
                      "border-[var(--company-primary)]",

                      "bg-[var(--company-primary-soft)]",

                      "ring-1 ring-[var(--company-primary)]",
                    ]
                  : [
                      "border-[var(--admin-border)]",

                      "hover:bg-[var(--admin-hover)]",
                    ],

                "disabled:opacity-50",
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

              <div
                className="
                  mt-3

                  admin-text-14
                  font-semibold

                  text-[var(--admin-foreground)]
                "
              >
                {t("publicContent.publish.now.title")}
              </div>

              <p
                className="
                  mt-1

                  admin-text-12
                  leading-[1.6]

                  text-[var(--admin-muted)]
                "
              >
                {t("publicContent.publish.now.description")}
              </p>
            </button>

            {/* SCHEDULE */}

            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setMode("schedule");

                setError("");
              }}
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

                "disabled:opacity-50",
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

                  text-[var(--admin-foreground)]
                "
              >
                {t("publicContent.publish.schedule.title")}
              </div>

              <p
                className="
                  mt-1

                  admin-text-12
                  leading-[1.6]

                  text-[var(--admin-muted)]
                "
              >
                {t("publicContent.publish.schedule.description")}
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
                  {t("publicContent.publish.schedule.dateLabel")}

                  <span className="ml-1 text-red-500">*</span>
                </span>

                <input
                  type="datetime-local"
                  value={scheduledAt}
                  min={toLocalDateTimeValue(new Date())}
                  disabled={loading}
                  onChange={(event) => {
                    setScheduledAt(event.target.value);

                    setError("");
                  }}
                  className={cn(
                    "mt-2",

                    "h-11 w-full",

                    "rounded-xl",

                    "border",

                    "bg-[var(--admin-surface)]",

                    "px-3",

                    "admin-text-14",

                    "text-[var(--admin-foreground)]",

                    "outline-none transition",

                    error
                      ? [
                          "border-red-500",

                          "focus:border-red-500",

                          "focus:ring-2 focus:ring-red-500/15",
                        ]
                      : [
                          "border-[var(--admin-border)]",

                          "focus:border-[var(--company-primary)]",

                          "focus:ring-2 focus:ring-[var(--company-primary-soft)]",
                        ],

                    "disabled:opacity-50",
                  )}
                />
              </label>

              {error && (
                <p
                  className="
                    mt-2

                    admin-text-12
                    font-medium

                    text-red-500
                  "
                >
                  {error}
                </p>
              )}
            </div>
          )}

          {/* INFO */}

          <div
            className="
              mt-5

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
              {t("publicContent.publish.visibility.title")}
            </div>

            <p
              className="
                mt-1

                admin-text-11
                leading-[1.65]

                text-[var(--admin-muted)]
              "
            >
              {t("publicContent.publish.visibility.description")}
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

            px-5
            py-4

            sm:px-6
          "
        >
          <button
            type="button"
            disabled={loading}
            onClick={handleClose}
            className="
              h-10

              rounded-xl

              px-4

              admin-text-14
              font-medium

              text-[var(--admin-muted)]

              transition

              hover:bg-[var(--admin-hover)]

              hover:text-[var(--admin-foreground)]

              disabled:opacity-50
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
                ? t("publicContent.publish.schedule.action")
                : t("publicContent.publish.now.action")}
          </button>
        </footer>
      </form>
    </div>
  );
}
