"use client";

import { CalendarX2, LoaderCircle, RotateCcw, Trash2, X } from "lucide-react";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { cn } from "@/utils/cn";

function getItemTitle(item, fallback) {
  return (
    item?.title?.en?.trim() || item?.title?.th?.trim() || item?.slug || fallback
  );
}

/*
 * =========================================================
 * CONFIRM DIALOG
 * =========================================================
 */

export default function PublicContentConfirmDialog({
  open,

  mode = "delete",

  item,

  loading = false,

  onClose,

  onConfirm,
}) {
  const { t } = useAdminTranslation();

  if (!open) {
    return null;
  }

  const deleting = mode === "delete";

  const scheduled = !deleting && item?.status === "scheduled";

  const Icon = deleting ? Trash2 : scheduled ? CalendarX2 : RotateCcw;

  const title = deleting
    ? t("publicContent.confirm.delete.title")
    : scheduled
      ? t("publicContent.confirm.cancelSchedule.title")
      : t("publicContent.confirm.unpublish.title");

  const description = deleting
    ? t("publicContent.confirm.delete.description")
    : scheduled
      ? t("publicContent.confirm.cancelSchedule.description")
      : t("publicContent.confirm.unpublish.description");

  const actionLabel = deleting
    ? t("publicContent.confirm.delete.action")
    : scheduled
      ? t("publicContent.confirm.cancelSchedule.action")
      : t("publicContent.confirm.unpublish.action");

  const itemTitle = getItemTitle(
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
   * RENDER
   * =======================================================
   */

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

      <div
        className={cn(
          "relative z-10",

          "w-full max-w-md",

          "overflow-hidden",

          "rounded-3xl",

          "border",

          deleting ? "border-red-200" : "border-[var(--admin-border)]",

          "bg-[var(--admin-surface)]",

          "shadow-2xl",
        )}
      >
        {/* HEADER ICON */}

        <header
          className="
            flex
            items-start
            justify-between

            px-5
            pt-5

            sm:px-6
            sm:pt-6
          "
        >
          <div
            className={cn(
              "flex",

              "h-11 w-11",

              "items-center justify-center",

              "rounded-2xl",

              deleting
                ? "bg-red-50 text-red-600"
                : scheduled
                  ? "bg-amber-50 text-amber-600"
                  : "bg-[var(--company-primary-soft)] text-[var(--company-primary)]",
            )}
          >
            <Icon size={19} strokeWidth={1.8} />
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleClose}
            aria-label={t("common.close")}
            title={t("common.close")}
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
            px-5
            pb-5
            pt-4

            sm:px-6
            sm:pb-6
          "
        >
          <div
            className={cn(
              "admin-text-10",

              "font-semibold uppercase tracking-[0.14em]",

              deleting
                ? "text-red-500"
                : scheduled
                  ? "text-amber-600"
                  : "text-[var(--company-primary)]",
            )}
          >
            {deleting
              ? t("publicContent.confirm.delete.sectionLabel")
              : t("publicContent.confirm.lifecycleSectionLabel")}
          </div>

          <h2
            className="
              mt-1

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
              mt-2

              admin-text-14
              leading-[1.7]

              text-[var(--admin-muted)]
            "
          >
            {description}
          </p>

          {/* ITEM */}

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
                truncate

                admin-text-14
                font-medium

                text-[var(--admin-foreground)]
              "
            >
              {itemTitle}
            </div>

            {item?.slug && (
              <div
                className="
                  mt-1

                  truncate

                  admin-text-12

                  text-[var(--admin-muted)]
                "
              >
                /{item.slug}
              </div>
            )}
          </div>

          {/* EXTRA INFO */}

          {deleting && (
            <div
              className="
                mt-4

                rounded-2xl

                border
                border-red-100

                bg-red-50/70

                p-4
              "
            >
              <div
                className="
                  admin-text-11
                  font-medium

                  text-red-700
                "
              >
                {t("publicContent.confirm.delete.softDelete.title")}
              </div>

              <p
                className="
                  mt-1

                  admin-text-11
                  leading-[1.65]

                  text-red-600
                "
              >
                {t("publicContent.confirm.delete.softDelete.description")}
              </p>
            </div>
          )}

          {!deleting && (
            <div
              className={cn(
                "mt-4",

                "rounded-2xl",

                "border",

                "p-4",

                scheduled
                  ? "border-amber-200 bg-amber-50"
                  : "border-[var(--company-primary-border)] bg-[var(--company-primary-soft)]",
              )}
            >
              <div
                className="
                  admin-text-11
                  font-medium

                  text-[var(--admin-foreground)]
                "
              >
                {t("publicContent.confirm.contentSafe.title")}
              </div>

              <p
                className="
                  mt-1

                  admin-text-11
                  leading-[1.65]

                  text-[var(--admin-muted)]
                "
              >
                {t("publicContent.confirm.contentSafe.description")}
              </p>
            </div>
          )}
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
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={cn(
              "inline-flex",

              "h-10 min-w-32",

              "items-center justify-center gap-2",

              "rounded-xl",

              "px-5",

              "admin-text-14 font-medium",

              "text-white",

              "transition",

              deleting
                ? ["bg-red-600", "hover:bg-red-700"]
                : scheduled
                  ? ["bg-amber-500", "hover:bg-amber-600"]
                  : [
                      "bg-[var(--company-primary)]",

                      "text-[var(--company-primary-foreground)]",

                      "hover:bg-[var(--company-primary-hover)]",
                    ],

              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {loading ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : (
              <Icon size={15} />
            )}

            {loading ? t("common.processing") : actionLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}
