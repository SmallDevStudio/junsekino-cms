"use client";

import {
  AlertTriangle,
  FileImage,
  FolderKanban,
  Home,
  LoaderCircle,
  Newspaper,
  RefreshCw,
  Trash2,
  Trophy,
  X,
} from "lucide-react";

import { useMemo, useState } from "react";

import { toast } from "sonner";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { cn } from "@/utils/cn";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

async function readResponse(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getLocalizedTitle(value, locale) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return value?.[locale] || value?.en || value?.th || "";
}

function getMediaName(media, fallback) {
  return (
    media?.title?.en ||
    media?.title?.th ||
    media?.originalFileName ||
    media?.fileName ||
    media?.id ||
    fallback
  );
}

/*
 * =========================================================
 * MODULE ICON
 * =========================================================
 */

function RelationIcon({ module, size = 15 }) {
  switch (module) {
    case "project":
      return <FolderKanban size={size} strokeWidth={1.7} />;

    case "award":
      return <Trophy size={size} strokeWidth={1.7} />;

    case "home-slideshow":
      return <Home size={size} strokeWidth={1.7} />;

    case "page":
      return <Newspaper size={size} strokeWidth={1.7} />;

    default:
      return <FileImage size={size} strokeWidth={1.7} />;
  }
}

function getModuleLabel(module, t) {
  switch (module) {
    case "project":
      return t("media.details.usage.modules.project");

    case "award":
      return t("media.details.usage.modules.award");

    case "home-slideshow":
      return t("media.details.usage.modules.homeSlideshow");

    case "page":
      return t("media.details.usage.modules.page");

    case "public-content":
      return t("media.details.usage.modules.publicContent");

    default:
      return module || "-";
  }
}

function getLocationLabel(usage, t) {
  switch (usage?.location) {
    case "featured-image":
      return t("media.details.usage.locations.featuredImage");

    case "hero":
      return t("media.details.usage.locations.hero");

    case "gallery":
      return t("media.details.usage.locations.gallery", {
        number: (usage?.index ?? 0) + 1,
      });

    case "slideshow":
      return t("media.details.usage.locations.slideshow", {
        number: (usage?.index ?? 0) + 1,
      });

    case "page-section-image":
      return t("media.details.usage.locations.sectionImage", {
        number: (usage?.sectionIndex ?? 0) + 1,
      });

    case "page-section-gallery":
      return t("media.details.usage.locations.sectionGallery", {
        section: (usage?.sectionIndex ?? 0) + 1,
        number: (usage?.sectionImageIndex ?? 0) + 1,
      });

    default:
      return usage?.location || "-";
  }
}

/*
 * =========================================================
 * DELETE DIALOG
 * =========================================================
 */

export default function MediaDeleteDialog({
  open,

  companyId,

  media,

  usageData,

  usageLoading = false,

  usageError = null,

  onRetryUsage,

  onClose,

  onDeleted,
}) {
  const { t, locale } = useAdminTranslation();

  const [deleting, setDeleting] = useState(false);

  const usageCount = Number(usageData?.usageCount) || 0;

  const mediaName = getMediaName(media, t("media.manager.untitled"));

  const usages = Array.isArray(usageData?.usages) ? usageData.usages : [];

  const priority = {
    published: 0,
    scheduled: 1,
    review: 2,
    draft: 3,
  };

  const sortedUsages = [...usages].sort((first, second) => {
    const firstPriority = priority[first?.status] ?? 99;
    const secondPriority = priority[second?.status] ?? 99;

    if (firstPriority !== secondPriority) {
      return firstPriority - secondPriority;
    }

    return String(first?.module || "").localeCompare(
      String(second?.module || ""),
    );
  });

  if (!open || !media) {
    return null;
  }

  async function handleDelete() {
    if (!companyId || !media?.id || deleting || usageLoading || usageError) {
      return;
    }

    try {
      setDeleting(true);

      const response = await fetch(
        `/api/v1/companies/${companyId}/media/${media.id}/delete`,
        {
          method: "DELETE",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            detachReferences: usageCount > 0,
          }),
        },
      );

      const payload = await readResponse(response);

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || t("media.delete.errors.failed"));
      }

      toast.success(
        usageCount > 0
          ? t("media.delete.messages.detachedAndDeleted")
          : t("media.delete.messages.deleted"),
      );

      await onDeleted?.(media.id);
    } catch (error) {
      console.error("Delete media error:", error);

      toast.error(error?.message || t("media.delete.errors.failed"));
    } finally {
      setDeleting(false);
    }
  }

  const blocking = deleting || usageLoading;

  return (
    <div
      className="
        fixed
        inset-0
        z-[290]

        flex
        items-center
        justify-center

        p-4
      "
    >
      <button
        type="button"
        disabled={blocking}
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
          max-h-[86vh]
          w-full
          max-w-[620px]
          flex-col

          overflow-hidden

          rounded-3xl

          border
          border-[var(--admin-border)]

          bg-[var(--admin-surface)]

          shadow-[0_30px_100px_rgba(0,0,0,0.24)]
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
          <div className="flex min-w-0 gap-3">
            <div
              className="
                flex
                h-10
                w-10
                shrink-0

                items-center
                justify-center

                rounded-xl

                bg-red-50

                text-red-600
              "
            >
              <Trash2 size={18} />
            </div>

            <div className="min-w-0">
              <h2
                className="
                  admin-text-16
                  font-semibold

                  text-[var(--admin-foreground)]
                "
              >
                {t("media.delete.title")}
              </h2>

              <p
                className="
                  mt-1
                  truncate

                  admin-text-11

                  text-[var(--admin-muted)]
                "
              >
                {mediaName}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={blocking}
            onClick={onClose}
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
            min-h-0
            flex-1

            overflow-y-auto

            px-6
            py-5
          "
        >
          {usageLoading ? (
            <div
              className="
                flex
                min-h-[180px]

                flex-col
                items-center
                justify-center

                gap-3
              "
            >
              <LoaderCircle
                size={22}
                className="
                  animate-spin

                  text-[var(--company-primary)]
                "
              />

              <span
                className="
                  admin-text-11

                  text-[var(--admin-muted)]
                "
              >
                {t("media.delete.checkingUsage")}
              </span>
            </div>
          ) : usageError ? (
            <div
              className="
                rounded-2xl

                border
                border-red-200

                bg-red-50

                p-5
              "
            >
              <div
                className="
                  admin-text-12
                  font-medium

                  text-red-700
                "
              >
                {usageError}
              </div>

              {onRetryUsage && (
                <button
                  type="button"
                  onClick={onRetryUsage}
                  className="
                    mt-3

                    inline-flex
                    items-center
                    gap-2

                    admin-text-11
                    font-medium

                    text-red-700
                  "
                >
                  <RefreshCw size={13} />

                  {t("media.details.usage.retry")}
                </button>
              )}
            </div>
          ) : usageCount > 0 ? (
            <>
              <div
                className="
                  flex
                  gap-3

                  rounded-2xl

                  border
                  border-amber-200

                  bg-amber-50

                  p-4
                "
              >
                <AlertTriangle
                  size={18}
                  className="
                    mt-0.5
                    shrink-0

                    text-amber-600
                  "
                />

                <div>
                  <div
                    className="
                      admin-text-12
                      font-semibold

                      text-amber-900
                    "
                  >
                    {t("media.delete.inUseTitle", {
                      count: usageCount,
                    })}
                  </div>

                  <p
                    className="
                      mt-1

                      admin-text-11
                      leading-[1.6]

                      text-amber-800
                    "
                  >
                    {t("media.delete.inUseDescription")}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                {sortedUsages.map((usage) => {
                  const title =
                    getLocalizedTitle(usage?.contentTitle, locale) ||
                    t("media.details.usage.untitled");

                  return (
                    <div
                      key={usage.id}
                      className="
                        flex
                        gap-3

                        rounded-xl

                        border
                        border-[var(--admin-border)]

                        p-3.5
                      "
                    >
                      <div
                        className="
                          flex
                          h-8
                          w-8
                          shrink-0

                          items-center
                          justify-center

                          rounded-lg

                          bg-[var(--company-primary-soft)]

                          text-[var(--company-primary)]
                        "
                      >
                        <RelationIcon module={usage.module} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div
                          className="
                            admin-text-9
                            font-semibold
                            uppercase
                            tracking-[0.08em]

                            text-[var(--company-primary)]
                          "
                        >
                          {getModuleLabel(usage.module, t)}
                        </div>

                        <div
                          className="
                            mt-0.5
                            truncate

                            admin-text-11
                            font-medium

                            text-[var(--admin-foreground)]
                          "
                        >
                          {title}
                        </div>

                        <div
                          className="
                            mt-0.5

                            admin-text-10

                            text-[var(--admin-muted)]
                          "
                        >
                          {getLocationLabel(usage, t)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div
              className="
                rounded-2xl

                bg-[var(--admin-background)]

                p-5
              "
            >
              <p
                className="
                  admin-text-12
                  leading-[1.7]

                  text-[var(--admin-muted)]
                "
              >
                {t("media.delete.unusedDescription")}
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

            px-6
            py-4
          "
        >
          <button
            type="button"
            disabled={blocking}
            onClick={onClose}
            className="
              h-10

              rounded-xl

              px-4

              admin-text-12
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
            disabled={blocking || Boolean(usageError)}
            onClick={handleDelete}
            className="
              inline-flex
              h-10

              items-center
              justify-center
              gap-2

              rounded-xl

              bg-red-600

              px-4

              admin-text-12
              font-medium

              text-white

              transition

              hover:bg-red-700

              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {deleting ? (
              <LoaderCircle size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}

            {usageCount > 0
              ? t("media.delete.removeAndDelete")
              : t("media.delete.delete")}
          </button>
        </footer>
      </div>
    </div>
  );
}
