"use client";

import { Upload, X } from "lucide-react";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import MediaUploadDropzone from "./MediaUploadDropzone";

/*
 * =========================================================
 * MEDIA UPLOAD DIALOG
 * =========================================================
 */

export default function MediaUploadDialog({
  open,

  companyId,

  onClose,

  onUploaded,
}) {
  const { t } = useAdminTranslation();

  if (!open) {
    return null;
  }

  /*
   * =======================================================
   * UPLOADED
   * =======================================================
   */

  async function handleUploaded(media) {
    await onUploaded?.(media);
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
        z-[220]

        flex
        items-center
        justify-center

        p-4

        sm:p-6
      "
    >
      {/* =================================
          BACKDROP
      ================================= */}

      <button
        type="button"
        aria-label={t("common.close")}
        onClick={onClose}
        className="
          absolute
          inset-0

          bg-black/40

          backdrop-blur-[2px]
        "
      />

      {/* =================================
          DIALOG
      ================================= */}

      <div
        className="
          relative
          z-10

          flex
          max-h-[90vh]
          w-full
          max-w-[900px]
          flex-col

          overflow-hidden

          rounded-3xl

          border
          border-[var(--admin-border)]

          bg-[var(--admin-surface)]

          shadow-[0_30px_100px_rgba(0,0,0,0.22)]
        "
      >
        {/* ===============================
            HEADER
        =============================== */}

        <header
          className="
            flex
            shrink-0

            items-center
            justify-between

            gap-4

            border-b
            border-[var(--admin-border)]

            px-5
            py-4

            sm:px-7
          "
        >
          <div
            className="
              flex
              min-w-0

              items-center
              gap-3
            "
          >
            <div
              className="
                flex
                h-10
                w-10
                shrink-0

                items-center
                justify-center

                rounded-2xl

                bg-[var(--company-primary-soft)]

                text-[var(--company-primary)]
              "
            >
              <Upload size={18} strokeWidth={1.7} />
            </div>

            <div className="min-w-0">
              <h2
                className="
                  admin-text-16
                  font-semibold
                  tracking-[-0.02em]

                  text-[var(--admin-foreground)]
                "
              >
                {t("media.uploadDialog.title")}
              </h2>

              <p
                className="
                  mt-0.5

                  admin-text-11

                  text-[var(--admin-muted)]
                "
              >
                {t("media.uploadDialog.description")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
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
            "
          >
            <X size={18} />
          </button>
        </header>

        {/* ===============================
            BODY
        =============================== */}

        <div
          className="
            admin-sidebar-scrollbar-hide

            min-h-0
            flex-1

            overflow-y-auto

            px-5
            py-5

            sm:px-7
            sm:py-6
          "
        >
          <MediaUploadDropzone
            companyId={companyId}
            onUploaded={handleUploaded}
          />
        </div>

        {/* ===============================
            FOOTER
        =============================== */}

        <footer
          className="
            flex
            shrink-0

            items-center
            justify-between

            gap-4

            border-t
            border-[var(--admin-border)]

            bg-[var(--admin-background)]

            px-5
            py-3

            sm:px-7
          "
        >
          <div
            className="
              admin-text-10
              leading-[1.5]

              text-[var(--admin-muted)]
            "
          >
            {t("media.uploadDialog.hint")}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              h-9
              shrink-0

              rounded-xl

              border
              border-[var(--admin-border)]

              bg-[var(--admin-surface)]

              px-4

              admin-text-12
              font-medium

              text-[var(--admin-foreground)]

              transition

              hover:bg-[var(--admin-hover)]
            "
          >
            {t("common.close")}
          </button>
        </footer>
      </div>
    </div>
  );
}
