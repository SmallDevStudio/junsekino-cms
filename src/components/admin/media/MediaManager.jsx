"use client";

import {
  Image as ImageIcon,
  LoaderCircle,
  RefreshCw,
  Search,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useCompanyWorkspace } from "@/components/admin/company/CompanyWorkspaceProvider";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { cn } from "@/utils/cn";

import MediaCard from "./MediaCard";
import MediaUploadDropzone from "./MediaUploadDropzone";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function normalizeMediaResponse(payload) {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (Array.isArray(payload.media)) {
    return payload.media;
  }

  if (Array.isArray(payload.data?.media)) {
    return payload.data.media;
  }

  return [];
}

function getMediaName(media, fallback) {
  return (
    media?.originalFileName ||
    media?.fileName ||
    media?.name ||
    media?.id ||
    fallback
  );
}

/*
 * =========================================================
 * MEDIA MANAGER
 * =========================================================
 */

export default function MediaManager() {
  const {
    activeCompany,
    activeCompanyId,
    loading: companyLoading,
  } = useCompanyWorkspace();

  const { t } = useAdminTranslation();

  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");

  /*
   * =======================================================
   * LOAD MEDIA
   * =======================================================
   */

  const loadMedia = useCallback(
    async ({ silent = false } = {}) => {
      if (!activeCompanyId) {
        setItems([]);

        return;
      }

      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const response = await fetch(
          `/api/v1/companies/${activeCompanyId}/media`,
          {
            method: "GET",

            cache: "no-store",

            credentials: "include",
          },
        );

        const payload = await response.json();

        if (!response.ok || payload?.success === false) {
          throw new Error(
            payload?.message || t("media.manager.errors.loadFailed"),
          );
        }

        setItems(normalizeMediaResponse(payload));
      } catch (loadError) {
        console.error("Load media error:", loadError);

        setError(loadError?.message || t("media.manager.errors.loadFailed"));
      } finally {
        setLoading(false);

        setRefreshing(false);
      }
    },
    [activeCompanyId, t],
  );

  /*
   * React Compiler-safe.
   */

  useEffect(() => {
    if (!activeCompanyId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      loadMedia();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeCompanyId, loadMedia]);

  /*
   * =======================================================
   * FILTER
   * =======================================================
   */

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return items;
    }

    return items.filter((media) => {
      const text = [
        media.id,

        media.originalFileName,

        media.fileName,

        media.mimeType,

        media.type,

        media.usage,

        media.status,

        media.alt?.en,

        media.alt?.th,

        media.caption?.en,

        media.caption?.th,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(keyword);
    });
  }, [items, search]);

  /*
   * =======================================================
   * COMPANY LOADING
   * =======================================================
   */

  if (companyLoading) {
    return (
      <div
        className="
          flex
          min-h-[420px]

          items-center
          justify-center
        "
      >
        <div
          className="
            flex
            items-center
            gap-2

            admin-text-14

            text-[var(--admin-muted)]
          "
        >
          <LoaderCircle
            size={17}
            className="
              animate-spin

              text-[var(--company-primary)]
            "
          />

          {t("media.manager.loadingWorkspace")}
        </div>
      </div>
    );
  }

  /*
   * =======================================================
   * NO COMPANY
   * =======================================================
   */

  if (!activeCompany) {
    return (
      <div
        className="
          rounded-2xl

          border
          border-[var(--admin-border)]

          bg-[var(--admin-surface)]

          p-8
        "
      >
        <div
          className="
            admin-text-14
            font-medium

            text-[var(--admin-foreground)]
          "
        >
          {t("media.manager.noCompany.title")}
        </div>

        <p
          className="
            mt-1

            admin-text-14
            leading-[1.6]

            text-[var(--admin-muted)]
          "
        >
          {t("media.manager.noCompany.description")}
        </p>
      </div>
    );
  }

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <div>
      {/* =====================================
          HEADER
      ===================================== */}

      <div
        className={cn(
          "flex flex-col gap-5",

          "lg:flex-row lg:items-end lg:justify-between",
        )}
      >
        <div>
          <div
            className="
              admin-text-12

              font-medium
              uppercase
              tracking-[0.14em]

              text-[var(--company-primary)]
            "
          >
            {t("media.manager.sectionLabel")}
          </div>

          <h1
            className="
              mt-2

              admin-text-32
              font-semibold
              tracking-[-0.035em]

              text-[var(--admin-foreground)]
            "
          >
            {t("media.manager.title")}
          </h1>

          <p
            className="
              mt-2
              max-w-2xl

              admin-text-14
              leading-[1.7]

              text-[var(--admin-muted)]
            "
          >
            {t("media.manager.description")}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            loadMedia({
              silent: true,
            })
          }
          disabled={refreshing}
          className={cn(
            "inline-flex h-10 items-center justify-center gap-2",

            "self-start rounded-xl",

            "border border-[var(--admin-border)]",

            "bg-[var(--admin-surface)] px-4",

            "admin-text-14 font-medium",

            "text-[var(--admin-foreground)]",

            "transition",

            "hover:border-[var(--company-primary-border)]",

            "hover:bg-[var(--company-primary-soft)]",

            "hover:text-[var(--company-primary)]",

            "disabled:cursor-not-allowed disabled:opacity-60",

            "lg:self-auto",
          )}
        >
          <RefreshCw size={15} className={cn(refreshing && "animate-spin")} />

          {refreshing ? t("media.manager.refreshing") : t("common.refresh")}
        </button>
      </div>

      {/* =====================================
          UPLOAD
      ===================================== */}

      <div className="mt-8">
        <MediaUploadDropzone
          companyId={activeCompanyId}
          onUploaded={() =>
            loadMedia({
              silent: true,
            })
          }
        />
      </div>

      {/* =====================================
          SEARCH + COUNT
      ===================================== */}

      <div
        className={cn(
          "mt-6 flex flex-col gap-4",

          "sm:flex-row sm:items-center sm:justify-between",
        )}
      >
        <div
          className="
            relative

            w-full

            sm:max-w-sm
          "
        >
          <Search
            size={16}
            className="
              pointer-events-none

              absolute
              left-3
              top-1/2

              -translate-y-1/2

              text-[var(--admin-muted)]
            "
          />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("media.manager.searchPlaceholder")}
            className="
              h-11
              w-full

              rounded-xl

              border
              border-[var(--admin-border)]

              bg-[var(--admin-surface)]

              pl-10
              pr-4

              admin-text-14

              text-[var(--admin-foreground)]

              outline-none

              transition

              placeholder:text-[var(--admin-muted-light)]

              focus:border-[var(--company-primary)]

              focus:ring-2
              focus:ring-[var(--company-primary-soft)]
            "
          />
        </div>

        <div
          className="
            admin-text-12

            text-[var(--admin-muted)]
          "
        >
          {t("media.manager.assetCount", {
            count: filteredItems.length,
          })}
        </div>
      </div>

      {/* =====================================
          ERROR
      ===================================== */}

      {error && (
        <div
          className="
            mt-6

            rounded-2xl

            border
            border-red-200

            bg-red-50

            p-4

            admin-text-14

            text-red-700
          "
        >
          {error}
        </div>
      )}

      {/* =====================================
          LOADING
      ===================================== */}

      {loading ? (
        <div
          className={cn(
            "mt-6 grid gap-4",

            "grid-cols-2",

            "sm:grid-cols-3",

            "lg:grid-cols-4",

            "2xl:grid-cols-5",
          )}
        >
          {Array.from({
            length: 10,
          }).map((_, index) => (
            <div
              key={index}
              className="
                  overflow-hidden

                  rounded-2xl

                  border
                  border-[var(--admin-border)]

                  bg-[var(--admin-surface)]
                "
            >
              <div
                className="
                    aspect-[4/3]

                    animate-pulse

                    bg-[var(--admin-hover)]
                  "
              />

              <div className="space-y-2 p-4">
                <div
                  className="
                      h-3
                      w-3/4

                      animate-pulse

                      rounded

                      bg-[var(--admin-hover)]
                    "
                />

                <div
                  className="
                      h-2.5
                      w-1/2

                      animate-pulse

                      rounded

                      bg-[var(--admin-hover)]
                    "
                />
              </div>
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        /*
         * ===================================
         * EMPTY
         * ===================================
         */

        <div
          className="
            mt-6

            flex
            min-h-[320px]

            flex-col
            items-center
            justify-center

            rounded-2xl

            border
            border-dashed
            border-[var(--admin-border)]

            bg-[var(--admin-surface)]

            p-8

            text-center
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

              bg-[var(--company-primary-soft)]

              text-[var(--company-primary)]
            "
          >
            <ImageIcon size={21} strokeWidth={1.7} />
          </div>

          <div
            className="
              mt-4

              admin-text-14
              font-medium

              text-[var(--admin-foreground)]
            "
          >
            {search
              ? t("media.manager.empty.searchTitle")
              : t("media.manager.empty.title")}
          </div>

          <p
            className="
              mt-1
              max-w-sm

              admin-text-12
              leading-[1.65]

              text-[var(--admin-muted)]
            "
          >
            {search
              ? t("media.manager.empty.searchDescription")
              : t("media.manager.empty.description")}
          </p>
        </div>
      ) : (
        /*
         * ===================================
         * GRID
         * ===================================
         */

        <div
          className={cn(
            "mt-6 grid gap-4",

            "grid-cols-2",

            "sm:grid-cols-3",

            "lg:grid-cols-4",

            "2xl:grid-cols-5",
          )}
        >
          {filteredItems.map((media) => (
            <MediaCard
              key={media.id}
              companyId={activeCompanyId}
              media={media}
              title={getMediaName(
                media,

                t("media.manager.untitled"),
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
