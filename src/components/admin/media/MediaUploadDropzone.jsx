"use client";

import {
  CheckCircle2,
  FileImage,
  LoaderCircle,
  UploadCloud,
  XCircle,
} from "lucide-react";

import { useRef, useState } from "react";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_MEDIA_FILE_SIZE,
  MEDIA_CLIENT_MAX_DIMENSION,
  MEDIA_CLIENT_MAX_SIZE_MB,
  MEDIA_CLIENT_WEBP_QUALITY,
} from "@/constants/media";

import { cn } from "@/utils/cn";

import imageCompression from "browser-image-compression";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function formatBytes(bytes) {
  if (!Number.isFinite(Number(bytes))) {
    return "—";
  }

  const value = Number(bytes);

  if (value === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];

  const index = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),

    units.length - 1,
  );

  const normalized = value / 1024 ** index;

  return `${normalized.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function createOptimizedFileName(fileName) {
  const baseName = String(fileName || "image")
    .replace(/\.[^.]+$/, "")
    .trim();

  return `${baseName || "image"}.webp`;
}

async function optimizeImage(file) {
  const compressed = await imageCompression(file, {
    maxSizeMB: MEDIA_CLIENT_MAX_SIZE_MB,

    maxWidthOrHeight: MEDIA_CLIENT_MAX_DIMENSION,

    useWebWorker: true,

    fileType: "image/webp",

    initialQuality: MEDIA_CLIENT_WEBP_QUALITY,

    maxIteration: 10,

    preserveExif: false,
  });

  /*
   * If compression unexpectedly produces
   * a larger file, keep the original.
   */
  if (
    compressed.size >= file.size &&
    file.size <= MEDIA_CLIENT_MAX_SIZE_MB * 1024 * 1024
  ) {
    return file;
  }

  return new File(
    [compressed],

    createOptimizedFileName(file.name),

    {
      type: compressed.type || "image/webp",

      lastModified: file.lastModified || Date.now(),
    },
  );
}

/*
 * =========================================================
 * STORAGE UPLOAD
 * =========================================================
 */

function uploadWithProgress({ url, method, headers, file, onProgress }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open(method || "PUT", url);

    for (const [key, value] of Object.entries(headers || {})) {
      xhr.setRequestHeader(key, value);
    }

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) {
        return;
      }

      const percent = Math.round((event.loaded / event.total) * 100);

      onProgress?.(percent);
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();

        return;
      }

      reject(new Error(`STORAGE_UPLOAD_FAILED_${xhr.status}`));
    });

    xhr.addEventListener("error", () => {
      reject(new Error("STORAGE_UPLOAD_FAILED"));
    });

    xhr.send(file);
  });
}

/*
 * =========================================================
 * UPLOAD DROPZONE
 * =========================================================
 */

export default function MediaUploadDropzone({
  companyId,

  onUploaded,

  onBusyChange,
}) {
  const { t } = useAdminTranslation();

  const inputRef = useRef(null);

  const [dragging, setDragging] = useState(false);

  const [uploads, setUploads] = useState([]);

  const [batch, setBatch] = useState(null);

  const processingRef = useRef(false);

  /*
   * =======================================================
   * UPDATE UPLOAD
   * =======================================================
   */

  function updateUpload(localId, patch) {
    setUploads((current) =>
      current.map((item) =>
        item.localId === localId
          ? {
              ...item,
              ...patch,
            }
          : item,
      ),
    );
  }

  /*
   * =======================================================
   * UPLOAD FILE
   * =======================================================
   */

  async function uploadFile(file) {
    const localId = `${Date.now()}-${Math.random()}`;

    /*
     * TYPE
     */

    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
      setUploads((current) => [
        {
          localId,

          fileName: file.name,

          size: file.size,

          originalSize: file.size,

          status: "error",

          progress: 0,

          error: t("media.upload.errors.unsupportedType"),
        },

        ...current,
      ]);

      return false;
    }

    /*
     * ORIGINAL SIZE LIMIT
     */

    if (file.size > MAX_MEDIA_FILE_SIZE) {
      setUploads((current) => [
        {
          localId,

          fileName: file.name,

          size: file.size,

          originalSize: file.size,

          status: "error",

          progress: 0,

          error: t(
            "media.upload.errors.fileTooLarge",

            {
              size: formatBytes(MAX_MEDIA_FILE_SIZE),
            },
          ),
        },

        ...current,
      ]);

      return false;
    }

    /*
     * CREATE LOCAL ITEM
     */

    setUploads((current) => [
      {
        localId,

        fileName: file.name,

        originalFileName: file.name,

        size: file.size,

        originalSize: file.size,

        optimized: false,

        status: "optimizing",

        progress: 0,

        error: null,
      },

      ...current,
    ]);

    try {
      /*
       * CLIENT OPTIMIZATION
       */

      const uploadFile = await optimizeImage(file);

      const optimized = uploadFile !== file || uploadFile.size < file.size;

      updateUpload(localId, {
        fileName: uploadFile.name,

        size: uploadFile.size,

        optimized,

        status: "creating",
      });

      /*
       * CREATE MEDIA RECORD
       */

      const createResponse = await fetch(
        `/api/v1/companies/${companyId}/media`,

        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            fileName: uploadFile.name,

            mimeType: uploadFile.type,

            size: uploadFile.size,
          }),
        },
      );

      const created = await createResponse.json();

      if (!createResponse.ok || !created?.success) {
        throw new Error(created?.message || "MEDIA_CREATE_FAILED");
      }

      const media = created.data.media;

      const upload = created.data.upload;

      updateUpload(localId, {
        status: "uploading",

        mediaId: media.id,
      });

      /*
       * STORAGE UPLOAD
       */

      await uploadWithProgress({
        url: upload.url,

        method: upload.method,

        headers: upload.headers,

        file: uploadFile,

        onProgress: (progress) => {
          updateUpload(localId, {
            progress,
          });
        },
      });

      /*
       * FINALIZE
       */

      updateUpload(localId, {
        status: "finalizing",

        progress: 100,
      });

      const finalizeResponse = await fetch(
        `/api/v1/companies/${companyId}/media/${media.id}/finalize`,

        {
          method: "POST",

          credentials: "include",
        },
      );

      const finalized = await finalizeResponse.json();

      if (!finalizeResponse.ok || !finalized?.success) {
        throw new Error(finalized?.message || "MEDIA_FINALIZE_FAILED");
      }

      updateUpload(localId, {
        status: "complete",

        progress: 100,
      });

      await onUploaded?.(finalized.data);

      return true;
    } catch (error) {
      console.error(
        "Media upload error:",

        error,
      );

      updateUpload(localId, {
        status: "error",

        error:
          error?.message && !error.message.startsWith("STORAGE_UPLOAD_FAILED")
            ? error.message
            : t("media.upload.errors.failed"),
      });

      return false;
    }
  }

  /*
   * =======================================================
   * FILE QUEUE
   * =======================================================
   */

  async function processFiles(fileList) {
    const files = Array.from(fileList || []);

    if (files.length === 0 || processingRef.current) {
      return;
    }

    processingRef.current = true;

    setBatch({
      total: files.length,

      processed: 0,

      completed: 0,

      failed: 0,

      activeFileName: files[0]?.name || "",

      status: "processing",
    });

    onBusyChange?.(true);

    let completed = 0;

    let failed = 0;

    try {
      /*
       * Sequential uploads reduce spikes
       * in browser memory and signed-upload
       * requests when users drop many files.
       */
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];

        setBatch((current) => ({
          ...current,

          activeFileName: file.name,
        }));

        const success = await uploadFile(file);

        if (success) {
          completed += 1;
        } else {
          failed += 1;
        }

        setBatch((current) => ({
          ...current,

          processed: index + 1,

          completed,

          failed,
        }));
      }

      setBatch((current) => ({
        ...current,

        activeFileName: "",

        status: "complete",
      }));
    } finally {
      processingRef.current = false;

      onBusyChange?.(false);
    }
  }

  function handleDrop(event) {
    event.preventDefault();

    setDragging(false);

    processFiles(event.dataTransfer.files);
  }

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <div>
      {/* =====================================
          DROP AREA
      ===================================== */}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();

          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();

          setDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();

          setDragging(false);
        }}
        onDrop={handleDrop}
        disabled={batch?.status === "processing"}
        className={cn(
          "flex w-full flex-col items-center justify-center",

          "rounded-2xl",

          "border border-dashed",

          "px-6 py-10",

          "text-center",

          "transition",

          "disabled:cursor-wait disabled:opacity-60",

          dragging
            ? "border-[var(--company-primary)] bg-[var(--company-primary-soft)]"
            : "border-[var(--admin-border)] bg-[var(--admin-surface)] hover:border-[var(--company-primary)] hover:bg-[var(--company-primary-soft)]",
        )}
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
          <UploadCloud size={21} strokeWidth={1.7} />
        </div>

        <div
          className="
            mt-4

            admin-text-14
            font-medium

            text-[var(--admin-foreground)]
          "
        >
          {t("media.upload.dropTitle")}
        </div>

        <div
          className="
            mt-1

            admin-text-12
            leading-[1.55]

            text-[var(--admin-muted)]
          "
        >
          {t("media.upload.recommendation", {
            size: formatBytes(MAX_MEDIA_FILE_SIZE),
          })}
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ALLOWED_IMAGE_MIME_TYPES.join(",")}
        disabled={batch?.status === "processing"}
        className="hidden"
        onChange={(event) => {
          processFiles(event.target.files);

          event.target.value = "";
        }}
      />

      {/* =====================================
          BATCH STATUS
      ===================================== */}

      {batch && (
        <div
          className={cn(
            "mt-4 rounded-2xl border px-4 py-3",

            batch.status === "processing"
              ? "border-[var(--company-primary-border)] bg-[var(--company-primary-soft)]"
              : batch.failed > 0
                ? "border-amber-200 bg-amber-50"
                : "border-emerald-200 bg-emerald-50",
          )}
        >
          <div className="flex items-center gap-3">
            {batch.status === "processing" ? (
              <LoaderCircle
                size={17}
                className="shrink-0 animate-spin text-[var(--company-primary)]"
              />
            ) : (
              <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
            )}

            <div className="min-w-0 flex-1">
              <div className="admin-text-12 font-semibold text-[var(--admin-foreground)]">
                {batch.status === "processing"
                  ? t("media.upload.batch.processing", {
                      current: Math.min(batch.processed + 1, batch.total),

                      total: batch.total,
                    })
                  : t("media.upload.batch.complete", {
                      completed: batch.completed,

                      failed: batch.failed,
                    })}
              </div>

              {batch.status === "processing" && batch.activeFileName && (
                <div className="mt-1 truncate admin-text-11 text-[var(--admin-muted)]">
                  {batch.activeFileName}
                </div>
              )}

              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/70">
                <div
                  className="h-full rounded-full bg-[var(--company-primary)] transition-[width]"
                  style={{
                    width:
                      String(
                        batch.total > 0
                          ? Math.round((batch.processed / batch.total) * 100)
                          : 0,
                      ) + "%",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================
          UPLOAD QUEUE
      ===================================== */}

      {uploads.length > 0 && (
        <div
          className="
            mt-4

            overflow-hidden

            rounded-2xl

            border
            border-[var(--admin-border)]

            bg-[var(--admin-surface)]
          "
        >
          {uploads.map((upload, index) => (
            <div
              key={upload.localId}
              className={cn(
                "flex items-center gap-4",

                "px-4 py-3",

                index !== uploads.length - 1 &&
                  "border-b border-[var(--admin-border)]",
              )}
            >
              <div
                className="
                    flex
                    h-10
                    w-10
                    shrink-0

                    items-center
                    justify-center

                    rounded-xl

                    bg-[var(--admin-background)]

                    text-[var(--admin-muted)]
                  "
              >
                <FileImage size={18} />
              </div>

              <div
                className="
                    min-w-0
                    flex-1
                  "
              >
                <div
                  className="
                      truncate

                      admin-text-12
                      font-medium

                      text-[var(--admin-foreground)]
                    "
                >
                  {upload.fileName}
                </div>

                {upload.status === "optimizing" && (
                  <div
                    className="
                      mt-1

                      admin-text-11
                      font-medium

                      text-[var(--company-primary)]
                    "
                  >
                    {t("media.upload.optimizing")}
                  </div>
                )}

                {upload.optimized && upload.originalSize > upload.size && (
                  <div
                    className="
                        mt-1

                        admin-text-11

                        text-emerald-600
                      "
                  >
                    {t(
                      "media.upload.optimizedSize",

                      {
                        original: formatBytes(upload.originalSize),

                        optimized: formatBytes(upload.size),
                      },
                    )}
                  </div>
                )}

                <div
                  className="
                      mt-1

                      admin-text-11

                      text-[var(--admin-muted)]
                    "
                >
                  {formatBytes(upload.size)}
                </div>

                {["uploading", "finalizing"].includes(upload.status) && (
                  <div
                    className="
                        mt-2

                        h-1.5

                        overflow-hidden

                        rounded-full

                        bg-[var(--admin-hover)]
                      "
                  >
                    <div
                      className="
                          h-full

                          rounded-full

                          bg-[var(--company-primary)]

                          transition-[width]
                        "
                      style={{
                        width: `${upload.progress}%`,
                      }}
                    />
                  </div>
                )}

                {upload.error && (
                  <div
                    className="
                        mt-1.5

                        admin-text-11

                        text-red-600
                      "
                  >
                    {upload.error}
                  </div>
                )}
              </div>

              <div className="shrink-0">
                {["optimizing", "creating", "uploading", "finalizing"].includes(
                  upload.status,
                ) && (
                  <LoaderCircle
                    size={17}
                    className="
                        animate-spin
                        text-[var(--company-primary)]
                      "
                  />
                )}

                {upload.status === "complete" && (
                  <CheckCircle2 size={18} className="text-emerald-600" />
                )}

                {upload.status === "error" && (
                  <XCircle size={18} className="text-red-600" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
