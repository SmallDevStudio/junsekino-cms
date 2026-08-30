"use client";

import {
  Check,
  Image as ImageIcon,
  Link2,
  LoaderCircle,
  Search,
  UploadCloud,
  X,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";

import { toast } from "sonner";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { cn } from "@/utils/cn";

import ImageCropDialog from "./ImageCropDialog";
import MediaUploadDropzone from "./MediaUploadDropzone";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function normalizeMedia(payload) {
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
}

function getMediaName(media, fallback) {
  return media?.originalFileName || media?.fileName || media?.id || fallback;
}

function formatBytes(bytes) {
  const value = Number(bytes);

  if (!Number.isFinite(value)) {
    return null;
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

/*
 * =========================================================
 * READ RESPONSE
 * =========================================================
 */

async function readResponse(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/*
 * =========================================================
 * THUMBNAIL
 * =========================================================
 *
 * The Admin preview API returns a runtime
 * signed Storage URL.
 *
 * We intentionally keep <img> here rather
 * than Next Image because the hostname of
 * signed preview URLs is runtime-dependent.
 *
 * Public website image rendering still uses
 * the established Next Image pipeline.
 * =========================================================
 */

function MediaThumbnail({ companyId, media }) {
  const [url, setUrl] = useState(null);

  const [loading, setLoading] = useState(false);

  const mediaId = media?.id;

  useEffect(() => {
    if (!companyId || !mediaId) {
      return;
    }

    let cancelled = false;

    const timeoutId = window.setTimeout(async () => {
      try {
        if (!cancelled) {
          setLoading(true);
        }

        const response = await fetch(
          `/api/v1/companies/${companyId}/media/${mediaId}/preview?variant=thumbnail`,
          {
            cache: "no-store",

            credentials: "include",
          },
        );

        const payload = await response.json();

        if (!response.ok || payload?.success === false) {
          throw new Error("MEDIA_PREVIEW_FAILED");
        }

        const previewUrl = payload?.data?.url || payload?.url || null;

        if (!previewUrl) {
          throw new Error("MEDIA_PREVIEW_URL_MISSING");
        }

        if (!cancelled) {
          setUrl(previewUrl);
        }
      } catch (error) {
        console.error("Media picker preview error:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 0);

    return () => {
      cancelled = true;

      window.clearTimeout(timeoutId);
    };
  }, [companyId, mediaId]);

  if (loading) {
    return (
      <div
        className="
          flex
          h-full
          w-full

          items-center
          justify-center
        "
      >
        <LoaderCircle
          size={18}
          className="
            animate-spin
            text-[var(--admin-muted)]
          "
        />
      </div>
    );
  }

  if (!url) {
    return (
      <div
        className="
          flex
          h-full
          w-full

          items-center
          justify-center
        "
      >
        <ImageIcon
          size={22}
          strokeWidth={1.5}
          className="
            text-[var(--admin-muted-light)]
          "
        />
      </div>
    );
  }

  return (
    // Signed preview URL is generated at runtime.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={media?.alt?.en || media?.alt?.th || ""}
      loading="lazy"
      decoding="async"
      className="
        h-full
        w-full

        object-cover
      "
    />
  );
}

/*
 * =========================================================
 * IMPORT URL PANEL
 * =========================================================
 */

function ImportUrlPanel({ companyId, onImported }) {
  const { t } = useAdminTranslation();

  const [url, setUrl] = useState("");

  const [importing, setImporting] = useState(false);

  async function handleImport() {
    const value = url.trim();

    if (!value) {
      toast.error(t("media.importUrl.errors.required"));

      return;
    }

    try {
      const parsed = new URL(value);

      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error();
      }
    } catch {
      toast.error(t("media.importUrl.errors.invalid"));

      return;
    }

    try {
      setImporting(true);

      const response = await fetch(
        `/api/v1/companies/${companyId}/media/import-url`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            url: value,
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || t("media.importUrl.errors.failed"));
      }

      toast.success(t("media.importUrl.messages.imported"));

      setUrl("");

      await onImported?.(payload.data);
    } catch (error) {
      console.error("Import image URL error:", error);

      toast.error(error?.message || t("media.importUrl.errors.failed"));
    } finally {
      setImporting(false);
    }
  }

  return (
    <div
      className="
        mx-auto
        max-w-2xl
      "
    >
      <div
        className="
          rounded-3xl

          border
          border-[var(--admin-border)]

          bg-[var(--admin-background)]

          p-5

          sm:p-6
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
          <Link2 size={20} />
        </div>

        <h3
          className="
            mt-4

            admin-text-14
            font-semibold

            text-[var(--admin-foreground)]
          "
        >
          {t("media.importUrl.title")}
        </h3>

        <p
          className="
            mt-1

            admin-text-12
            leading-[1.65]

            text-[var(--admin-muted)]
          "
        >
          {t("media.importUrl.description")}
        </p>

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

              text-[var(--admin-muted)]
            "
          >
            {t("media.importUrl.fieldLabel")}
          </span>

          <input
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();

                handleImport();
              }
            }}
            disabled={importing}
            placeholder="https://example.com/image.jpg"
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

              focus:border-[var(--company-primary)]

              focus:ring-2
              focus:ring-[var(--company-primary-soft)]

              disabled:opacity-60
            "
          />
        </label>

        <div
          className="
            mt-4

            rounded-2xl

            border
            border-[var(--admin-border)]

            bg-[var(--admin-surface)]

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
            {t("media.importUrl.directOnly")}
          </div>

          <p
            className="
              mt-1

              admin-text-11
              leading-[1.65]

              text-[var(--admin-muted)]
            "
          >
            {t("media.importUrl.supportedFormats")}
          </p>
        </div>

        <button
          type="button"
          onClick={handleImport}
          disabled={importing || !url.trim()}
          className="
            mt-5

            inline-flex
            h-10

            items-center
            justify-center
            gap-2

            rounded-xl

            bg-[var(--company-primary)]

            px-4

            admin-text-14
            font-medium

            text-[var(--company-primary-foreground)]

            transition

            hover:bg-[var(--company-primary-hover)]

            disabled:cursor-not-allowed
            disabled:opacity-40
          "
        >
          {importing ? (
            <LoaderCircle size={15} className="animate-spin" />
          ) : (
            <Link2 size={15} />
          )}

          {importing
            ? t("media.importUrl.importing")
            : t("media.importUrl.action")}
        </button>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * MEDIA PICKER
 * =========================================================
 */

export default function MediaPicker({
  open,

  companyId,

  selectedIds = [],

  multiple = true,

  /*
   * =======================================================
   * CROP
   * =======================================================
   *
   * null
   *   → existing MediaPicker behavior
   *
   * "cover"
   *   → rectangular crop
   *
   * "avatar"
   *   → circular crop
   *
   * Other presets supported by
   * MEDIA_CROP_PRESETS may also be used.
   *
   * Crop is intentionally enabled only for
   * single-selection mode.
   * =======================================================
   */

  cropPreset = null,

  initialCrop = null,

  cropTitle,

  cropDescription,

  /*
   * Optional consumer-provided title.
   *
   * When omitted it follows Admin i18n.
   */
  title,

  onClose,

  onConfirm,
}) {
  const { t } = useAdminTranslation();

  /*
   * =======================================================
   * MEDIA
   * =======================================================
   */

  const [items, setItems] = useState([]);

  const [selection, setSelection] = useState([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState("library");

  /*
   * =======================================================
   * CROP STATE
   * =======================================================
   */

  const [cropDialogOpen, setCropDialogOpen] = useState(false);

  const [cropMedia, setCropMedia] = useState(null);

  const [cropImageUrl, setCropImageUrl] = useState(null);

  const [cropLoading, setCropLoading] = useState(false);

  const [cropError, setCropError] = useState(null);

  /*
   * Crop is intentionally supported only
   * for one selected image at a time.
   */
  const cropEnabled = Boolean(cropPreset) && !multiple;

  const dialogTitle = title || t("media.picker.title");

  /*
   * =======================================================
   * LOAD
   * =======================================================
   */

  const loadMedia = useCallback(async () => {
    if (!companyId) {
      setItems([]);

      return [];
    }

    try {
      setLoading(true);

      setError(null);

      const response = await fetch(`/api/v1/companies/${companyId}/media`, {
        method: "GET",

        cache: "no-store",

        credentials: "include",
      });

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.message || t("media.picker.errors.loadFailed"),
        );
      }

      const media = normalizeMedia(payload).filter(
        (item) =>
          item?.status === "ready" &&
          item?.type === "image" &&
          !item?.deletedAt,
      );

      setItems(media);

      return media;
    } catch (loadError) {
      console.error("Media picker error:", loadError);

      const message = loadError?.message || t("media.picker.errors.loadFailed");

      setError(message);

      return [];
    } finally {
      setLoading(false);
    }
  }, [companyId, t]);

  /*
   * =======================================================
   * OPEN RESET
   * =======================================================
   */

  useEffect(() => {
    if (!open) {
      return;
    }

    /*
     * React Compiler-safe.
     */
    const timeoutId = window.setTimeout(() => {
      setSelection(Array.isArray(selectedIds) ? selectedIds : []);

      setSearch("");

      setActiveTab("library");

      setCropDialogOpen(false);

      setCropMedia(null);

      setCropImageUrl(null);

      setCropLoading(false);

      setCropError(null);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [open, selectedIds]);

  /*
   * =======================================================
   * OPEN LOAD
   * =======================================================
   */

  useEffect(() => {
    if (!open || !companyId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      loadMedia();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [open, companyId, loadMedia]);

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
      const searchable = [
        media?.originalFileName,

        media?.fileName,

        media?.alt?.th,

        media?.alt?.en,

        media?.caption?.th,

        media?.caption?.en,

        media?.format,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(keyword);
    });
  }, [items, search]);

  /*
   * =======================================================
   * SELECTION
   * =======================================================
   */

  function toggleMedia(mediaId) {
    if (!multiple) {
      setSelection([mediaId]);

      return;
    }

    setSelection((current) => {
      if (current.includes(mediaId)) {
        return current.filter((id) => id !== mediaId);
      }

      return [...current, mediaId];
    });
  }

  function addToSelection(mediaId) {
    if (!mediaId) {
      return;
    }

    if (!multiple) {
      setSelection([mediaId]);

      return;
    }

    setSelection((current) =>
      current.includes(mediaId) ? current : [...current, mediaId],
    );
  }

  /*
   * =======================================================
   * CREATED / IMPORTED
   * =======================================================
   */

  async function handleMediaCreated(media) {
    const refreshed = await loadMedia();

    const mediaId = media?.id;

    if (mediaId && refreshed.some((item) => item.id === mediaId)) {
      addToSelection(mediaId);
    }

    setActiveTab("library");
  }

  /*
   * =======================================================
   * SELECTED MEDIA
   * =======================================================
   */

  function getSelectedMedia() {
    return selection
      .map((id) => items.find((item) => item.id === id))
      .filter(Boolean);
  }

  /*
   * =======================================================
   * LOAD CROP PREVIEW
   * =======================================================
   */

  async function openCropDialog(media) {
    if (!companyId || !media?.id) {
      return;
    }

    try {
      setCropLoading(true);

      setCropError(null);

      setCropMedia(media);

      /*
       * We deliberately use the largest Admin preview
       * available so react-easy-crop has enough resolution
       * for accurate positioning.
       */
      const response = await fetch(
        `/api/v1/companies/${companyId}/media/${media.id}/preview?variant=large`,
        {
          method: "GET",

          cache: "no-store",

          credentials: "include",
        },
      );

      const payload = await readResponse(response);

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.message || t("media.picker.crop.errors.previewFailed"),
        );
      }

      const previewUrl = payload?.data?.url || payload?.url || null;

      if (!previewUrl) {
        throw new Error(t("media.picker.crop.errors.previewFailed"));
      }

      setCropImageUrl(previewUrl);

      /*
       * Opening only after URL is available avoids a
       * flash of an empty Crop dialog.
       */
      setCropDialogOpen(true);
    } catch (previewError) {
      console.error("Media crop preview error:", previewError);

      const message =
        previewError?.message || t("media.picker.crop.errors.previewFailed");

      setCropError(message);

      toast.error(message);
    } finally {
      setCropLoading(false);
    }
  }

  /*
   * =======================================================
   * CLOSE CROP
   * =======================================================
   */

  function closeCropDialog() {
    setCropDialogOpen(false);

    setCropImageUrl(null);

    setCropMedia(null);

    setCropError(null);
  }

  /*
   * =======================================================
   * APPLY CROP
   * =======================================================
   */

  function handleCropConfirm(cropMetadata) {
    if (!cropMedia) {
      return;
    }

    /*
     * Backward-compatible Media object:
     *
     * {
     *   ...existingMedia,
     *   crop: {...}
     * }
     *
     * Existing consumers which don't use cropPreset
     * continue receiving the original object.
     */
    const result = {
      ...cropMedia,

      crop: cropMetadata,
    };

    setCropDialogOpen(false);

    setCropImageUrl(null);

    setCropMedia(null);

    onConfirm?.(result);

    onClose?.();
  }

  /*
   * =======================================================
   * CONFIRM
   * =======================================================
   */

  async function handleConfirm() {
    const selectedMedia = getSelectedMedia();

    /*
     * ===============================================
     * CROP FLOW
     * ===============================================
     */

    if (cropEnabled) {
      const media = selectedMedia[0] || null;

      if (!media) {
        return;
      }

      await openCropDialog(media);

      return;
    }

    /*
     * ===============================================
     * STANDARD FLOW
     * ===============================================
     *
     * Existing MediaPicker behavior remains unchanged.
     */

    onConfirm?.(multiple ? selectedMedia : selectedMedia[0] || null);

    onClose?.();
  }

  if (!open) {
    return null;
  }

  /*
   * =======================================================
   * TABS
   * =======================================================
   */

  const tabs = [
    {
      value: "library",

      label: t("media.picker.tabs.library"),

      icon: ImageIcon,
    },

    {
      value: "upload",

      label: t("media.picker.tabs.upload"),

      icon: UploadCloud,
    },

    {
      value: "url",

      label: t("media.picker.tabs.importUrl"),

      icon: Link2,
    },
  ];

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <>
      <div
        className="
          fixed
          inset-0
          z-[200]

          flex
          items-center
          justify-center

          p-4

          sm:p-6
        "
      >
        {/* =====================================
            BACKDROP
        ===================================== */}

        <button
          type="button"
          aria-label={t("media.picker.close")}
          onClick={onClose}
          disabled={cropLoading}
          className="
            absolute
            inset-0

            bg-black/40

            backdrop-blur-[2px]
          "
        />

        {/* =====================================
            DIALOG
        ===================================== */}

        <div
          role="dialog"
          aria-modal="true"
          aria-label={dialogTitle}
          className="
            relative
            z-10

            flex
            max-h-[88vh]
            w-full
            max-w-5xl
            flex-col

            overflow-hidden

            rounded-3xl

            border
            border-[var(--admin-border)]

            bg-[var(--admin-surface)]

            shadow-[0_30px_100px_rgba(0,0,0,0.25)]
          "
        >
          {/* =================================
              HEADER
          ================================= */}

          <div
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

              sm:px-6
            "
          >
            <div className="min-w-0">
              <h2
                className="
                  admin-text-18
                  font-semibold
                  tracking-[-0.02em]

                  text-[var(--admin-foreground)]
                "
              >
                {dialogTitle}
              </h2>

              <p
                className="
                  mt-1

                  admin-text-12

                  text-[var(--admin-muted)]
                "
              >
                {cropEnabled
                  ? t("media.picker.crop.selectDescription")
                  : multiple
                    ? t("media.picker.multipleDescription")
                    : t("media.picker.singleDescription")}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={cropLoading}
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
              <X size={18} />
            </button>
          </div>

          {/* =================================
              TABS
          ================================= */}

          <div
            className="
              flex
              shrink-0

              overflow-x-auto

              border-b
              border-[var(--admin-border)]

              px-4

              sm:px-6
            "
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;

              const active = activeTab === tab.value;

              return (
                <button
                  key={tab.value}
                  type="button"
                  disabled={cropLoading}
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    "relative",

                    "inline-flex shrink-0 items-center gap-2",

                    "px-4 py-3",

                    "admin-text-12 font-medium",

                    "transition",

                    active
                      ? "text-[var(--company-primary)]"
                      : "text-[var(--admin-muted)] hover:text-[var(--admin-foreground)]",

                    "disabled:opacity-50",
                  )}
                >
                  <Icon size={14} />

                  {tab.label}

                  {active && (
                    <span
                      className="
                          absolute
                          inset-x-0
                          bottom-0

                          h-0.5

                          bg-[var(--company-primary)]
                        "
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* =================================
              BODY
          ================================= */}

          <div
            className="
              admin-sidebar-scrollbar-hide

              min-h-0
              flex-1

              overflow-y-auto

              p-5

              sm:p-6
            "
          >
            {/* ===============================
                LIBRARY
            =============================== */}

            {activeTab === "library" && (
              <>
                {/* =============================
                    SEARCH
                ============================= */}

                <div
                  className="
                    flex
                    flex-col
                    gap-3

                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                  "
                >
                  <div
                    className="
                      relative
                      w-full
                      max-w-[420px]
                    "
                  >
                    <Search
                      size={15}
                      className="
                        pointer-events-none

                        absolute
                        left-3
                        top-1/2

                        -translate-y-1/2

                        text-[var(--admin-muted-light)]
                      "
                    />

                    <input
                      type="search"
                      value={search}
                      disabled={cropLoading}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder={t("media.picker.searchPlaceholder")}
                      className="
                        h-10
                        w-full

                        rounded-xl

                        border
                        border-[var(--admin-border)]

                        bg-[var(--admin-background)]

                        pl-9
                        pr-3

                        admin-text-12

                        text-[var(--admin-foreground)]

                        outline-none

                        transition

                        placeholder:text-[var(--admin-muted-light)]

                        focus:border-[var(--company-primary)]

                        focus:ring-2
                        focus:ring-[var(--company-primary-soft)]

                        disabled:opacity-50
                      "
                    />
                  </div>

                  <div
                    className="
                      admin-text-11

                      text-[var(--admin-muted)]
                    "
                  >
                    {t("media.picker.resultCount", {
                      count: filteredItems.length,
                    })}
                  </div>
                </div>

                {/* =============================
                    CROP NOTE
                ============================= */}

                {cropEnabled && (
                  <div
                    className="
                      mt-4

                      rounded-xl

                      border
                      border-[var(--company-primary-border)]

                      bg-[var(--company-primary-soft)]

                      px-4
                      py-3
                    "
                  >
                    <div
                      className="
                        admin-text-11
                        font-medium

                        text-[var(--company-primary)]
                      "
                    >
                      {t("media.picker.crop.noteTitle")}
                    </div>

                    <p
                      className="
                        mt-1

                        admin-text-11
                        leading-[1.6]

                        text-[var(--admin-muted)]
                      "
                    >
                      {t("media.picker.crop.noteDescription")}
                    </p>
                  </div>
                )}

                {/* =============================
                    CROP ERROR
                ============================= */}

                {cropError && (
                  <div
                    className="
                      mt-4

                      rounded-xl

                      border
                      border-red-200

                      bg-red-50

                      px-4
                      py-3

                      admin-text-12

                      text-red-700
                    "
                  >
                    {cropError}
                  </div>
                )}

                {/* =============================
                    LOADING
                ============================= */}

                {loading && (
                  <div
                    className="
                      flex
                      min-h-[320px]

                      items-center
                      justify-center
                    "
                  >
                    <div className="text-center">
                      <LoaderCircle
                        size={22}
                        className="
                          mx-auto

                          animate-spin

                          text-[var(--company-primary)]
                        "
                      />

                      <div
                        className="
                          mt-3

                          admin-text-12

                          text-[var(--admin-muted)]
                        "
                      >
                        {t("media.picker.loading")}
                      </div>
                    </div>
                  </div>
                )}

                {/* =============================
                    ERROR
                ============================= */}

                {!loading && error && (
                  <div
                    className="
                        mt-6

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
                      {error}
                    </div>

                    <button
                      type="button"
                      onClick={loadMedia}
                      className="
                          mt-3

                          admin-text-12
                          font-medium

                          text-[var(--company-primary)]

                          hover:underline
                        "
                    >
                      {t("common.retry")}
                    </button>
                  </div>
                )}

                {/* =============================
                    EMPTY
                ============================= */}

                {!loading && !error && filteredItems.length === 0 && (
                  <div
                    className="
                        flex
                        min-h-[320px]

                        flex-col
                        items-center
                        justify-center

                        text-center
                      "
                  >
                    <div
                      className="
                          flex
                          h-14
                          w-14

                          items-center
                          justify-center

                          rounded-2xl

                          bg-[var(--admin-background)]

                          text-[var(--admin-muted-light)]
                        "
                    >
                      <ImageIcon size={23} strokeWidth={1.5} />
                    </div>

                    <div
                      className="
                          mt-4

                          admin-text-14
                          font-medium

                          text-[var(--admin-foreground)]
                        "
                    >
                      {search.trim()
                        ? t("media.picker.noSearchResults")
                        : t("media.picker.emptyTitle")}
                    </div>

                    <div
                      className="
                          mt-1

                          max-w-[360px]

                          admin-text-12
                          leading-[1.6]

                          text-[var(--admin-muted)]
                        "
                    >
                      {search.trim()
                        ? t("media.picker.noSearchDescription")
                        : t("media.picker.emptyDescription")}
                    </div>

                    {!search.trim() && (
                      <button
                        type="button"
                        onClick={() => setActiveTab("upload")}
                        className="
                            mt-4

                            inline-flex
                            h-9

                            items-center
                            gap-2

                            rounded-xl

                            bg-[var(--company-primary)]

                            px-3

                            admin-text-12
                            font-medium

                            text-[var(--company-primary-foreground)]

                            transition

                            hover:bg-[var(--company-primary-hover)]
                          "
                      >
                        <UploadCloud size={14} />

                        {t("media.picker.tabs.upload")}
                      </button>
                    )}
                  </div>
                )}

                {/* =============================
                    GRID
                ============================= */}

                {!loading && !error && filteredItems.length > 0 && (
                  <div
                    className="
                        mt-5

                        grid
                        grid-cols-2
                        gap-3

                        sm:grid-cols-3

                        lg:grid-cols-4
                      "
                  >
                    {filteredItems.map((media) => {
                      const selected = selection.includes(media.id);

                      const fileSize = formatBytes(media.size);

                      return (
                        <button
                          key={media.id}
                          type="button"
                          disabled={cropLoading}
                          onClick={() => toggleMedia(media.id)}
                          className={cn(
                            "group overflow-hidden",

                            "rounded-2xl",

                            "border",

                            "text-left",

                            "transition",

                            selected
                              ? "border-[var(--company-primary)] bg-[var(--company-primary-soft)] ring-2 ring-[var(--company-primary-soft)]"
                              : "border-[var(--admin-border)] bg-[var(--admin-surface)] hover:border-[var(--company-primary-border)]",

                            "disabled:opacity-60",
                          )}
                        >
                          {/* IMAGE */}

                          <div
                            className="
                                  relative

                                  aspect-[4/3]

                                  overflow-hidden

                                  bg-[var(--admin-background)]
                                "
                          >
                            <MediaThumbnail
                              companyId={companyId}
                              media={media}
                            />

                            {/* CHECK */}

                            <span
                              className={cn(
                                "absolute right-2 top-2",

                                "flex h-6 w-6",

                                "items-center justify-center",

                                "rounded-full",

                                "border",

                                "transition",

                                selected
                                  ? "border-[var(--company-primary)] bg-[var(--company-primary)] text-[var(--company-primary-foreground)]"
                                  : "border-white/70 bg-white/85 text-transparent shadow-sm group-hover:text-black/30",
                              )}
                            >
                              <Check size={13} strokeWidth={2.4} />
                            </span>
                          </div>

                          {/* META */}

                          <div className="p-3">
                            <div
                              className="
                                    truncate

                                    admin-text-11
                                    font-medium

                                    text-[var(--admin-foreground)]
                                  "
                            >
                              {getMediaName(
                                media,

                                t("media.picker.untitled"),
                              )}
                            </div>

                            <div
                              className="
                                    mt-1

                                    flex
                                    items-center
                                    gap-1.5

                                    admin-text-9

                                    text-[var(--admin-muted)]
                                  "
                            >
                              {media.format && (
                                <span
                                  className="
                                        uppercase
                                      "
                                >
                                  {media.format}
                                </span>
                              )}

                              {media.format && fileSize && <span>•</span>}

                              {fileSize && <span>{fileSize}</span>}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* ===============================
                UPLOAD
            =============================== */}

            {activeTab === "upload" && (
              <MediaUploadDropzone
                companyId={companyId}
                onUploaded={handleMediaCreated}
              />
            )}

            {/* ===============================
                URL
            =============================== */}

            {activeTab === "url" && (
              <ImportUrlPanel
                companyId={companyId}
                onImported={handleMediaCreated}
              />
            )}
          </div>

          {/* =================================
              FOOTER
          ================================= */}

          <div
            className="
              flex
              shrink-0

              flex-col
              gap-3

              border-t
              border-[var(--admin-border)]

              bg-[var(--admin-surface)]

              px-5
              py-4

              sm:flex-row
              sm:items-center
              sm:justify-between

              sm:px-6
            "
          >
            <div
              className="
                admin-text-11

                text-[var(--admin-muted)]
              "
            >
              {selection.length > 0
                ? t("media.picker.selectedCount", {
                    count: selection.length,
                  })
                : t("media.picker.noneSelected")}
            </div>

            <div
              className="
                flex
                items-center
                justify-end
                gap-2
              "
            >
              <button
                type="button"
                onClick={onClose}
                disabled={cropLoading}
                className="
                  h-10

                  rounded-xl

                  border
                  border-[var(--admin-border)]

                  px-4

                  admin-text-12
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
                onClick={handleConfirm}
                disabled={selection.length === 0 || cropLoading}
                className="
                  inline-flex
                  h-10
                  min-w-28

                  items-center
                  justify-center
                  gap-2

                  rounded-xl

                  bg-[var(--company-primary)]

                  px-4

                  admin-text-12
                  font-medium

                  text-[var(--company-primary-foreground)]

                  transition

                  hover:bg-[var(--company-primary-hover)]

                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                {cropLoading ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : (
                  <Check size={15} />
                )}

                {cropLoading
                  ? t("media.picker.crop.preparing")
                  : cropEnabled
                    ? t("media.picker.crop.continue")
                    : multiple
                      ? t("media.picker.confirmMultiple")
                      : t("media.picker.confirmSingle")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================
          CROP DIALOG
      ===================================== */}

      <ImageCropDialog
        open={cropDialogOpen}
        imageUrl={cropImageUrl}
        media={cropMedia}
        preset={cropPreset || "cover"}
        initialCrop={initialCrop}
        title={cropTitle}
        description={cropDescription}
        onClose={closeCropDialog}
        onConfirm={handleCropConfirm}
      />
    </>
  );
}
