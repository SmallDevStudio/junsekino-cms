"use client";

import { CalendarX2, LoaderCircle, RotateCcw, Trash2, X } from "lucide-react";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { cn } from "@/utils/cn";

export default function NewsConfirmDialog({
  open,
  mode,
  item,
  loading = false,
  onClose,
  onConfirm,
}) {
  const { t } = useAdminTranslation();

  if (!open || !item) {
    return null;
  }

  const deleting = mode === "delete";

  const scheduled = !deleting && item.status === "scheduled";

  const Icon = deleting ? Trash2 : scheduled ? CalendarX2 : RotateCcw;

  const title = deleting
    ? t("news.confirm.delete.title")
    : scheduled
      ? t("news.confirm.cancelSchedule.title")
      : t("news.confirm.unpublish.title");

  const description = deleting
    ? t("news.confirm.delete.description")
    : scheduled
      ? t("news.confirm.cancelSchedule.description")
      : t("news.confirm.unpublish.description");

  const action = deleting
    ? t("news.confirm.delete.action")
    : scheduled
      ? t("news.confirm.cancelSchedule.action")
      : t("news.confirm.unpublish.action");

  const itemTitle =
    item.title?.en?.trim() ||
    item.title?.th?.trim() ||
    item.slug ||
    t("news.manager.untitled");

  return (
    <div
      className="
        fixed
        inset-0
        z-[270]

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

      <div
        className="
          relative

          w-full
          max-w-md

          overflow-hidden

          rounded-3xl

          border
          border-[var(--admin-border)]

          bg-[var(--admin-surface)]

          shadow-2xl
        "
      >
        <div className="p-6">
          <div
            className="
              flex
              items-start
              justify-between
            "
          >
            <div
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-2xl",

                deleting
                  ? "bg-red-50 text-red-600"
                  : scheduled
                    ? "bg-amber-50 text-amber-600"
                    : "bg-[var(--company-primary-soft)] text-[var(--company-primary)]",
              )}
            >
              <Icon size={19} />
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
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
          </div>

          <h2
            className="
              mt-5

              admin-text-18
              font-semibold
            "
          >
            {title}
          </h2>

          <p
            className="
              mt-2

              admin-text-14
              leading-[1.7]

              text-[var(--admin-muted)]
            "
          >
            {description}
          </p>

          <div
            className="
              mt-5

              rounded-2xl

              border
              border-[var(--admin-border)]

              bg-[var(--admin-background)]

              p-4
            "
          >
            <div
              className="
                admin-text-14
                font-medium
              "
            >
              {itemTitle}
            </div>

            <div
              className="
                mt-1

                admin-text-12

                text-[var(--admin-muted)]
              "
            >
              /{item.slug}
            </div>
          </div>
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
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={cn(
              "inline-flex h-10 min-w-32 items-center justify-center gap-2 rounded-xl px-4 admin-text-14 font-medium transition disabled:opacity-50",

              deleting
                ? "bg-red-600 text-white hover:bg-red-700"
                : scheduled
                  ? "bg-amber-500 text-white hover:bg-amber-600"
                  : "bg-[var(--company-primary)] text-[var(--company-primary-foreground)] hover:bg-[var(--company-primary-hover)]",
            )}
          >
            {loading ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : (
              <Icon size={15} />
            )}

            {loading ? t("common.processing") : action}
          </button>
        </footer>
      </div>
    </div>
  );
}
