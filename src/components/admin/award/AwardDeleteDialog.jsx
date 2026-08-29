"use client";

import { AlertTriangle, LoaderCircle, Trash2, X } from "lucide-react";

import { useState } from "react";

import { toast } from "sonner";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

function getTitle(award, fallback) {
  return (
    award?.title?.en?.trim() ||
    award?.title?.th?.trim() ||
    award?.slug ||
    fallback
  );
}

export default function AwardDeleteDialog({
  open,
  companyId,
  award,
  onClose,
  onCompleted,
}) {
  const { t } = useAdminTranslation();

  const [deleting, setDeleting] = useState(false);

  const [confirmation, setConfirmation] = useState("");

  if (!open || !award) {
    return null;
  }

  const title = getTitle(
    award,

    t("award.manager.untitledAward"),
  );

  const confirmed = confirmation.trim().toLowerCase() === "delete";

  /*
   * =======================================================
   * DELETE
   * =======================================================
   */

  async function handleDelete() {
    if (deleting || !confirmed) {
      return;
    }

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
        throw new Error(payload?.message || t("award.delete.errors.failed"));
      }

      toast.success(t("award.delete.messages.deleted"));

      setConfirmation("");

      await onCompleted?.(payload.data);
    } catch (error) {
      console.error("Delete award error:", error);

      toast.error(error?.message || t("award.delete.errors.failed"));
    } finally {
      setDeleting(false);
    }
  }

  function handleClose() {
    if (deleting) {
      return;
    }

    setConfirmation("");

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
        disabled={deleting}
      />

      <div
        className="
          relative

          w-full
          max-w-md

          overflow-hidden

          rounded-3xl

          border
          border-red-200

          bg-[var(--admin-surface)]

          shadow-2xl
        "
      >
        {/* HEADER */}

        <div
          className="
            flex
            items-start
            justify-between

            p-6
          "
        >
          <div
            className="
              flex
              h-12
              w-12

              items-center
              justify-center

              rounded-2xl

              bg-red-50

              text-red-600
            "
          >
            <AlertTriangle size={21} />
          </div>

          <button
            type="button"
            disabled={deleting}
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
        </div>

        {/* BODY */}

        <div
          className="
            px-6
            pb-6
          "
        >
          <div
            className="
              admin-text-10
              font-semibold
              uppercase
              tracking-[0.14em]

              text-red-500
            "
          >
            {t("award.delete.sectionLabel")}
          </div>

          <h2
            className="
              mt-1

              admin-text-18
              font-semibold

              text-[var(--admin-foreground)]
            "
          >
            {t("award.delete.title")}
          </h2>

          <p
            className="
              mt-3

              admin-text-14
              leading-[1.7]

              text-[var(--admin-muted)]
            "
          >
            <span
              className="
                font-medium

                text-[var(--admin-foreground)]
              "
            >
              {title}
            </span>{" "}
            {t("award.delete.description")}
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
                admin-text-12
                font-medium

                text-[var(--admin-foreground)]
              "
            >
              {t("award.delete.softDelete.title")}
            </div>

            <p
              className="
                mt-1

                admin-text-12
                leading-[1.6]

                text-[var(--admin-muted)]
              "
            >
              {t("award.delete.softDelete.description")}
            </p>
          </div>

          <label
            className="
              mt-5
              block
            "
          >
            <span
              className="
                admin-text-12
                font-medium

                text-[var(--admin-foreground)]
              "
            >
              {t("award.delete.confirm.prefix")}{" "}
              <span
                className="
                  font-semibold
                  text-red-600
                "
              >
                DELETE
              </span>{" "}
              {t("award.delete.confirm.suffix")}
            </span>

            <input
              type="text"
              value={confirmation}
              disabled={deleting}
              autoComplete="off"
              placeholder="DELETE"
              onChange={(event) => setConfirmation(event.target.value)}
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

                placeholder:text-[var(--admin-muted-light)]

                focus:border-red-400

                focus:ring-2
                focus:ring-red-100

                disabled:opacity-50
              "
            />
          </label>
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
            disabled={deleting}
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
            disabled={deleting || !confirmed}
            onClick={handleDelete}
            className="
              inline-flex
              h-10
              min-w-32

              items-center
              justify-center
              gap-2

              rounded-xl

              bg-red-600

              px-4

              admin-text-14
              font-medium

              text-white

              transition

              hover:bg-red-700

              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            {deleting ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : (
              <Trash2 size={15} />
            )}

            {deleting ? t("award.delete.deleting") : t("award.delete.action")}
          </button>
        </footer>
      </div>
    </div>
  );
}
