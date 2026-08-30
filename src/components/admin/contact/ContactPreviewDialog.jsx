"use client";

import { LoaderCircle, X } from "lucide-react";

import { useEffect, useState } from "react";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import ContactPageContent from "@/components/public/contact/ContactPageContent";

/*
 * =========================================================
 * PREVIEW
 * =========================================================
 */

export default function ContactPreviewDialog({
  open,

  companyId,

  companySlug,

  value,

  contactForm,

  locale = "en",

  onClose,
}) {
  const { t } = useAdminTranslation();

  const [coverUrl, setCoverUrl] = useState(null);

  const [coverLoading, setCoverLoading] = useState(false);

  const mediaId = value?.featuredImage?.mediaId || null;

  useEffect(() => {
    if (!open || !companyId || !mediaId) {
      return;
    }

    let cancelled = false;

    const timeoutId = window.setTimeout(async () => {
      try {
        if (!cancelled) {
          setCoverLoading(true);

          setCoverUrl(null);
        }

        const response = await fetch(
          `/api/v1/companies/${companyId}/media/${mediaId}/preview?variant=large`,
          {
            cache: "no-store",

            credentials: "include",
          },
        );

        const payload = await response.json();

        if (!response.ok || payload?.success === false) {
          throw new Error("CONTACT_PREVIEW_IMAGE_FAILED");
        }

        if (!cancelled) {
          setCoverUrl(payload?.data?.url || payload?.url || null);
        }
      } catch (error) {
        console.error("Contact preview image error:", error);
      } finally {
        if (!cancelled) {
          setCoverLoading(false);
        }
      }
    }, 0);

    return () => {
      cancelled = true;

      window.clearTimeout(timeoutId);
    };
  }, [open, companyId, mediaId]);

  if (!open) {
    return null;
  }

  const previewPage = {
    ...value,

    form: contactForm || null,
  };

  return (
    <div
      className="
        fixed
        inset-0
        z-[240]

        flex
        items-center
        justify-center

        p-4

        sm:p-6
      "
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={t("common.close")}
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

          flex
          max-h-[94vh]
          w-full
          max-w-[1500px]
          flex-col

          overflow-hidden

          rounded-3xl

          bg-white

          shadow-[0_30px_100px_rgba(0,0,0,0.3)]
        "
      >
        <header
          className="
            flex
            shrink-0

            items-center
            justify-between

            border-b
            border-black/[0.06]

            px-5
            py-3

            sm:px-7
          "
        >
          <div>
            <div
              className="
                admin-text-10
                font-semibold
                uppercase
                tracking-[0.16em]

                text-[var(--company-primary)]
              "
            >
              {t("contact.preview.title")}
            </div>

            <div
              className="
                mt-0.5

                admin-text-11

                text-black/45
              "
            >
              {t("contact.preview.description")}
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

              items-center
              justify-center

              rounded-xl

              text-black/45

              transition

              hover:bg-black/[0.04]

              hover:text-black
            "
          >
            <X size={17} />
          </button>
        </header>

        <div
          className="
            min-h-0
            flex-1

            overflow-y-auto

            bg-white
          "
        >
          {coverLoading && mediaId ? (
            <div
              className="
                flex
                min-h-[380px]

                items-center
                justify-center
              "
            >
              <LoaderCircle
                size={20}
                className="
                  animate-spin

                  text-[var(--company-primary)]
                "
              />
            </div>
          ) : (
            <ContactPageContent
              companySlug={companySlug || ""}
              page={previewPage}
              locale={locale}
              coverUrl={coverUrl}
              preview
            />
          )}
        </div>
      </div>
    </div>
  );
}
