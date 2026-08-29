"use client";

import { CalendarClock, LoaderCircle, Send, X } from "lucide-react";

import { useEffect, useState } from "react";

import { toast } from "sonner";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { cn } from "@/utils/cn";

function getTitle(award, fallback) {
  return (
    award?.title?.en?.trim() ||
    award?.title?.th?.trim() ||
    award?.slug ||
    fallback
  );
}

export default function AwardPublishDialog({
  open,
  companyId,
  award,
  onClose,
  onCompleted,
}) {
  const { t } = useAdminTranslation();

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

  const title = getTitle(
    award,

    t("award.manager.untitledAward"),
  );

  /*
   * =======================================================
   * SUBMIT
   * =======================================================
   */

  async function handleSubmit() {
    if (mode === "schedule") {
      if (!scheduledAt) {
        toast.error(t("award.publish.errors.selectSchedule"));

        return;
      }

      const date = new Date(scheduledAt);

      if (Number.isNaN(date.getTime())) {
        toast.error(t("award.publish.errors.invalidSchedule"));

        return;
      }

      if (date.getTime() <= Date.now()) {
        toast.error(t("award.publish.errors.futureSchedule"));

        return;
      }
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
        throw new Error(payload?.message || t("award.publish.errors.failed"));
      }

      toast.success(
        mode === "schedule"
          ? t("award.publish.messages.scheduled")
          : t("award.publish.messages.published"),
      );

      await onCompleted?.(payload.data);
    } catch (error) {
      console.error("Publish award error:", error);

      toast.error(error?.message || t("award.publish.errors.failed"));
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    if (submitting) {
      return;
    }

    onClose?.();
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-[300]

        flex
        items-center
        justify-center

        p-4
      "
    >
      <button
        type="button"
        aria-label={t("common.close")}
        className="
          absolute
          inset-0

          bg-black/45

          backdrop-blur-[2px]
        "
        onClick={handleClose}
        disabled={submitting}
      />

      <div
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
                admin-text-10
                font-semibold
                uppercase
                tracking-[0.14em]

                text-[var(--company-primary)]
              "
            >
              {t("award.publish.sectionLabel")}
            </div>

            <h2
              className="
                mt-1

                admin-text-18
                font-semibold

                text-[var(--admin-foreground)]
              "
            >
              {t("award.publish.title")}
            </h2>

            <p
              className="
                mt-1

                admin-text-12

                text-[var(--admin-muted)]
              "
            >
              {title}
            </p>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={handleClose}
            aria-label={t("common.close")}
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

        {/* BODY */}

        <div
          className="
            space-y-3

            p-6
          "
        >
          <button
            type="button"
            disabled={submitting}
            onClick={() => setMode("now")}
            className={cn(
              "flex w-full items-start gap-3",

              "rounded-2xl",

              "border",

              "p-4",

              "text-left",

              "transition",

              mode === "now"
                ? "border-[var(--company-primary)] bg-[var(--company-primary-soft)]"
                : "border-[var(--admin-border)] hover:bg-[var(--admin-hover)]",
            )}
          >
            <Send
              size={18}
              className={cn(
                "mt-0.5 shrink-0",

                mode === "now"
                  ? "text-[var(--company-primary)]"
                  : "text-[var(--admin-muted)]",
              )}
            />

            <div>
              <div
                className="
                  admin-text-14
                  font-medium

                  text-[var(--admin-foreground)]
                "
              >
                {t("award.publish.now.title")}
              </div>

              <div
                className="
                  mt-1

                  admin-text-12
                  leading-[1.6]

                  text-[var(--admin-muted)]
                "
              >
                {t("award.publish.now.description")}
              </div>
            </div>
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => setMode("schedule")}
            className={cn(
              "flex w-full items-start gap-3",

              "rounded-2xl",

              "border",

              "p-4",

              "text-left",

              "transition",

              mode === "schedule"
                ? "border-[var(--company-primary)] bg-[var(--company-primary-soft)]"
                : "border-[var(--admin-border)] hover:bg-[var(--admin-hover)]",
            )}
          >
            <CalendarClock
              size={18}
              className={cn(
                "mt-0.5 shrink-0",

                mode === "schedule"
                  ? "text-[var(--company-primary)]"
                  : "text-[var(--admin-muted)]",
              )}
            />

            <div>
              <div
                className="
                  admin-text-14
                  font-medium

                  text-[var(--admin-foreground)]
                "
              >
                {t("award.publish.schedule.title")}
              </div>

              <div
                className="
                  mt-1

                  admin-text-12
                  leading-[1.6]

                  text-[var(--admin-muted)]
                "
              >
                {t("award.publish.schedule.description")}
              </div>
            </div>
          </button>

          {mode === "schedule" && (
            <label
              className="
                block
                pt-2
              "
            >
              <span
                className="
                  admin-text-12
                  font-medium

                  text-[var(--admin-muted)]
                "
              >
                {t("award.publish.schedule.dateLabel")}
              </span>

              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
                disabled={submitting}
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

                  disabled:opacity-50
                "
              />
            </label>
          )}
        </div>

        {/* FOOTER */}

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
            disabled={submitting}
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

              disabled:opacity-50
            "
          >
            {t("common.cancel")}
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="
              inline-flex
              h-10

              items-center
              gap-2

              rounded-xl

              bg-[var(--company-primary)]

              px-4

              admin-text-14
              font-medium

              text-[var(--company-primary-foreground)]

              transition

              hover:bg-[var(--company-primary-hover)]

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
              ? t("common.processing")
              : mode === "schedule"
                ? t("award.publish.schedule.action")
                : t("award.publish.now.action")}
          </button>
        </footer>
      </div>
    </div>
  );
}
