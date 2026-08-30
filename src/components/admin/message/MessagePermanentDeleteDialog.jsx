"use client";

import { AlertTriangle, LoaderCircle, Trash2, X } from "lucide-react";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

export default function MessagePermanentDeleteDialog({
  open,
  deleting,
  onCancel,
  onConfirm,
}) {
  const { t } = useAdminTranslation();

  if (!open) {
    return null;
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
        onClick={deleting ? undefined : onCancel}
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
          z-10

          w-full
          max-w-[460px]

          rounded-3xl

          bg-[var(--admin-surface)]

          shadow-[0_30px_100px_rgba(0,0,0,0.28)]
        "
      >
        <div
          className="
            flex
            items-start
            justify-between
            gap-4

            px-6
            pt-6
          "
        >
          <div
            className="
              flex
              h-11
              w-11

              items-center
              justify-center

              rounded-2xl

              bg-red-50

              text-red-600
            "
          >
            <AlertTriangle size={19} />
          </div>

          <button
            type="button"
            disabled={deleting}
            onClick={onCancel}
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
            <X size={16} />
          </button>
        </div>

        <div className="px-6 pb-6">
          <h2
            className="
              mt-5

              admin-text-18
              font-semibold

              text-[var(--admin-foreground)]
            "
          >
            {t("messages.deletePermanent.title")}
          </h2>

          <p
            className="
              mt-2

              admin-text-10
              leading-[1.7]

              text-[var(--admin-muted)]
            "
          >
            {t("messages.deletePermanent.description")}
          </p>

          <div
            className="
              mt-5

              rounded-2xl

              bg-red-50

              px-4
              py-3

              admin-text-9
              leading-[1.6]

              text-red-700
            "
          >
            {t("messages.deletePermanent.warning")}
          </div>

          <div
            className="
              mt-6

              flex
              justify-end
              gap-2
            "
          >
            <button
              type="button"
              disabled={deleting}
              onClick={onCancel}
              className="
                h-10

                rounded-xl

                px-4

                admin-text-10
                font-semibold

                text-[var(--admin-muted)]

                hover:bg-[var(--admin-hover)]
              "
            >
              {t("common.cancel")}
            </button>

            <button
              type="button"
              disabled={deleting}
              onClick={onConfirm}
              className="
                inline-flex
                h-10

                items-center
                gap-2

                rounded-xl

                bg-red-600

                px-4

                admin-text-10
                font-semibold

                text-white

                transition

                hover:bg-red-700

                disabled:opacity-50
              "
            >
              {deleting ? (
                <LoaderCircle size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}

              {t("messages.deletePermanent.action")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
