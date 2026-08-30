"use client";

import { Check, Minus, Plus, RotateCcw, RotateCw, X } from "lucide-react";

import Cropper from "react-easy-crop";

import { useEffect, useMemo, useState } from "react";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import {
  MEDIA_CROP_PRESETS,
  MEDIA_CROP_SHAPE,
  createDefaultCropMetadata,
  normalizeCropMetadata,
} from "@/utils/media-crop";

import { cn } from "@/utils/cn";

/*
 * =========================================================
 * CONSTANTS
 * =========================================================
 */

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.05;

const ROTATION_STEP = 90;

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/*
 * =========================================================
 * IMAGE CROP DIALOG
 * =========================================================
 */

export default function ImageCropDialog({
  open,

  imageUrl,

  media,

  preset = "cover",

  initialCrop,

  title,

  description,

  allowRotation = true,

  onClose,

  onConfirm,
}) {
  const { t } = useAdminTranslation();

  const configuration = useMemo(
    () => MEDIA_CROP_PRESETS[preset] || MEDIA_CROP_PRESETS.cover,
    [preset],
  );

  const initialState = useMemo(
    () =>
      normalizeCropMetadata(initialCrop, {
        preset,
      }),
    [initialCrop, preset],
  );

  const [crop, setCrop] = useState(initialState.crop);

  const [zoom, setZoom] = useState(initialState.zoom);

  const [rotation, setRotation] = useState(initialState.rotation);

  const [croppedArea, setCroppedArea] = useState(initialState.croppedArea);

  const [croppedAreaPixels, setCroppedAreaPixels] = useState(
    initialState.croppedAreaPixels,
  );

  /*
   * =======================================================
   * RESET WHEN OPEN
   * =======================================================
   */

  useEffect(() => {
    if (!open) {
      return;
    }

    const next = normalizeCropMetadata(initialCrop, {
      preset,
    });

    const timeoutId = window.setTimeout(() => {
      setCrop(next.crop);

      setZoom(next.zoom);

      setRotation(next.rotation);

      setCroppedArea(next.croppedArea);

      setCroppedAreaPixels(next.croppedAreaPixels);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [initialCrop, open, preset]);

  if (!open || !imageUrl) {
    return null;
  }

  /*
   * =======================================================
   * STATE
   * =======================================================
   */

  const resolvedTitle =
    title ||
    t(preset === "avatar" ? "media.crop.avatarTitle" : "media.crop.coverTitle");

  const resolvedDescription =
    description ||
    t(
      preset === "avatar"
        ? "media.crop.avatarDescription"
        : "media.crop.coverDescription",
    );

  const cropShape =
    configuration.shape === MEDIA_CROP_SHAPE.CIRCLE ? "round" : "rect";

  /*
   * =======================================================
   * COMPLETE
   * =======================================================
   */

  function handleCropComplete(area, areaPixels) {
    setCroppedArea(area);

    setCroppedAreaPixels(areaPixels);
  }

  /*
   * =======================================================
   * ZOOM
   * =======================================================
   */

  function changeZoom(value) {
    setZoom(clamp(value, MIN_ZOOM, MAX_ZOOM));
  }

  /*
   * =======================================================
   * ROTATE
   * =======================================================
   */

  function rotate(direction) {
    setRotation((current) => current + ROTATION_STEP * direction);
  }

  /*
   * =======================================================
   * RESET
   * =======================================================
   */

  function handleReset() {
    const defaults = createDefaultCropMetadata({
      preset,
    });

    setCrop(defaults.crop);

    setZoom(defaults.zoom);

    setRotation(defaults.rotation);

    setCroppedArea(null);

    setCroppedAreaPixels(null);
  }

  /*
   * =======================================================
   * CONFIRM
   * =======================================================
   */

  function handleConfirm() {
    const metadata = {
      mode: configuration.mode,

      shape: configuration.shape,

      aspect: configuration.aspect,

      crop,

      zoom,

      rotation,

      croppedArea,

      croppedAreaPixels,
    };

    onConfirm?.(metadata, media);
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
        z-[360]

        flex
        items-center
        justify-center

        p-3

        sm:p-5
      "
    >
      {/* =====================================
          BACKDROP
      ===================================== */}

      <button
        type="button"
        aria-label={t("common.close")}
        onClick={onClose}
        className="
          absolute
          inset-0

          bg-black/55

          backdrop-blur-[3px]
        "
      />

      {/* =====================================
          DIALOG
      ===================================== */}

      <div
        className="
          relative

          flex
          max-h-[calc(100svh-24px)]
          w-full
          max-w-5xl
          flex-col

          overflow-hidden

          rounded-3xl

          border
          border-[var(--admin-border)]

          bg-[var(--admin-surface)]

          shadow-2xl

          sm:max-h-[calc(100svh-40px)]
        "
      >
        {/* =================================
            HEADER
        ================================= */}

        <header
          className="
            flex
            shrink-0

            items-start
            justify-between

            gap-4

            border-b
            border-[var(--admin-border)]

            px-5
            py-4

            sm:px-6
            sm:py-5
          "
        >
          <div className="min-w-0">
            <div
              className="
                admin-text-10
                font-semibold
                uppercase
                tracking-[0.14em]

                text-[var(--company-primary)]
              "
            >
              {t("media.crop.sectionLabel")}
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
              {resolvedTitle}
            </h2>

            <p
              className="
                mt-1

                max-w-2xl

                admin-text-12
                leading-[1.6]

                text-[var(--admin-muted)]
              "
            >
              {resolvedDescription}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
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
            "
          >
            <X size={17} />
          </button>
        </header>

        {/* =================================
            BODY
        ================================= */}

        <div
          className="
            admin-sidebar-scrollbar-hide

            min-h-0
            flex-1

            overflow-y-auto
          "
        >
          {/* =================================
              CROP AREA
          ================================= */}

          <div
            className="
              relative

              h-[420px]

              overflow-hidden

              bg-[#111]

              sm:h-[520px]

              lg:h-[580px]
            "
          >
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={configuration.aspect}
              cropShape={cropShape}
              showGrid={preset !== "avatar"}
              minZoom={MIN_ZOOM}
              maxZoom={MAX_ZOOM}
              zoomSpeed={0.1}
              restrictPosition
              objectFit="contain"
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={handleCropComplete}
              style={{
                containerStyle: {
                  background: "#111111",
                },

                cropAreaStyle: {
                  border:
                    configuration.shape === MEDIA_CROP_SHAPE.CIRCLE
                      ? "2px solid rgba(255,255,255,.92)"
                      : "1px solid rgba(255,255,255,.9)",

                  boxShadow: "0 0 0 9999em rgba(0,0,0,.52)",
                },
              }}
            />
          </div>

          {/* =================================
              CONTROLS
          ================================= */}

          <div
            className="
              grid
              gap-5

              border-t
              border-[var(--admin-border)]

              px-5
              py-5

              sm:px-6

              lg:grid-cols-[minmax(0,1fr)_auto]
              lg:items-end
            "
          >
            <div
              className="
                space-y-5
              "
            >
              {/* =============================
                  ZOOM
              ============================= */}

              <div>
                <div
                  className="
                    flex
                    items-center
                    justify-between

                    gap-3
                  "
                >
                  <span
                    className="
                      admin-text-12
                      font-medium

                      text-[var(--admin-foreground)]
                    "
                  >
                    {t("media.crop.zoom")}
                  </span>

                  <span
                    className="
                      admin-text-11

                      text-[var(--admin-muted)]
                    "
                  >
                    {Math.round(zoom * 100)}%
                  </span>
                </div>

                <div
                  className="
                    mt-2

                    flex
                    items-center

                    gap-3
                  "
                >
                  <button
                    type="button"
                    onClick={() => changeZoom(zoom - ZOOM_STEP)}
                    disabled={zoom <= MIN_ZOOM}
                    aria-label={t("media.crop.zoomOut")}
                    className="
                      flex
                      h-9
                      w-9
                      shrink-0

                      items-center
                      justify-center

                      rounded-xl

                      border
                      border-[var(--admin-border)]

                      text-[var(--admin-muted)]

                      transition

                      hover:border-[var(--company-primary-border)]

                      hover:bg-[var(--company-primary-soft)]

                      hover:text-[var(--company-primary)]

                      disabled:opacity-30
                    "
                  >
                    <Minus size={14} />
                  </button>

                  <input
                    type="range"
                    min={MIN_ZOOM}
                    max={MAX_ZOOM}
                    step={ZOOM_STEP}
                    value={zoom}
                    onChange={(event) => changeZoom(Number(event.target.value))}
                    className="
                      min-w-0
                      flex-1

                      accent-[var(--company-primary)]
                    "
                  />

                  <button
                    type="button"
                    onClick={() => changeZoom(zoom + ZOOM_STEP)}
                    disabled={zoom >= MAX_ZOOM}
                    aria-label={t("media.crop.zoomIn")}
                    className="
                      flex
                      h-9
                      w-9
                      shrink-0

                      items-center
                      justify-center

                      rounded-xl

                      border
                      border-[var(--admin-border)]

                      text-[var(--admin-muted)]

                      transition

                      hover:border-[var(--company-primary-border)]

                      hover:bg-[var(--company-primary-soft)]

                      hover:text-[var(--company-primary)]

                      disabled:opacity-30
                    "
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* =============================
                  IMAGE INFO
              ============================= */}

              <div
                className="
                  flex
                  flex-wrap

                  gap-x-5
                  gap-y-2

                  admin-text-11

                  text-[var(--admin-muted)]
                "
              >
                <span>
                  {t("media.crop.aspect")}:{" "}
                  <strong
                    className="
                      font-medium

                      text-[var(--admin-foreground)]
                    "
                  >
                    {configuration.label}
                  </strong>
                </span>

                {media?.originalFileName && (
                  <span
                    className="
                      max-w-sm
                      truncate
                    "
                  >
                    {media.originalFileName}
                  </span>
                )}
              </div>
            </div>

            {/* =============================
                ROTATE / RESET
            ============================= */}

            <div
              className="
                flex
                flex-wrap

                gap-2
              "
            >
              {allowRotation && (
                <>
                  <button
                    type="button"
                    onClick={() => rotate(-1)}
                    title={t("media.crop.rotateLeft")}
                    aria-label={t("media.crop.rotateLeft")}
                    className="
                      flex
                      h-10
                      w-10

                      items-center
                      justify-center

                      rounded-xl

                      border
                      border-[var(--admin-border)]

                      text-[var(--admin-muted)]

                      transition

                      hover:border-[var(--company-primary-border)]

                      hover:bg-[var(--company-primary-soft)]

                      hover:text-[var(--company-primary)]
                    "
                  >
                    <RotateCcw size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() => rotate(1)}
                    title={t("media.crop.rotateRight")}
                    aria-label={t("media.crop.rotateRight")}
                    className="
                      flex
                      h-10
                      w-10

                      items-center
                      justify-center

                      rounded-xl

                      border
                      border-[var(--admin-border)]

                      text-[var(--admin-muted)]

                      transition

                      hover:border-[var(--company-primary-border)]

                      hover:bg-[var(--company-primary-soft)]

                      hover:text-[var(--company-primary)]
                    "
                  >
                    <RotateCw size={15} />
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={handleReset}
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
                "
              >
                {t("common.reset")}
              </button>
            </div>
          </div>
        </div>

        {/* =================================
            FOOTER
        ================================= */}

        <footer
          className="
            flex
            shrink-0

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
            onClick={onClose}
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
            "
          >
            {t("common.cancel")}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="
              inline-flex
              h-10

              items-center
              justify-center
              gap-2

              rounded-xl

              bg-[var(--company-primary)]

              px-5

              admin-text-14
              font-medium

              text-[var(--company-primary-foreground)]

              transition

              hover:bg-[var(--company-primary-hover)]
            "
          >
            <Check size={15} />

            {t("media.crop.apply")}
          </button>
        </footer>
      </div>
    </div>
  );
}
