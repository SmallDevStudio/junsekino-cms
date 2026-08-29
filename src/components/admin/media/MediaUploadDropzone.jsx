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
} from "@/constants/media";

import { cn } from "@/utils/cn";

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

export default function MediaUploadDropzone({ companyId, onUploaded }) {
  const { t } = useAdminTranslation();

  const inputRef = useRef(null);

  const [dragging, setDragging] = useState(false);

  const [uploads, setUploads] = useState([]);

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

          status: "error",

          progress: 0,

          error: t("media.upload.errors.unsupportedType"),
        },

        ...current,
      ]);

      return;
    }

    /*
     * SIZE
     */

    if (file.size > MAX_MEDIA_FILE_SIZE) {
      setUploads((current) => [
        {
          localId,

          fileName: file.name,

          size: file.size,

          status: "error",

          progress: 0,

          error: t("media.upload.errors.fileTooLarge", {
            size: formatBytes(MAX_MEDIA_FILE_SIZE),
          }),
        },

        ...current,
      ]);

      return;
    }

    /*
     * CREATE LOCAL ITEM
     */

    setUploads((current) => [
      {
        localId,

        fileName: file.name,

        size: file.size,

        status: "creating",

        progress: 0,

        error: null,
      },

      ...current,
    ]);

    try {
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
            fileName: file.name,

            mimeType: file.type,

            size: file.size,
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
       * STORAGE
       */

      await uploadWithProgress({
        url: upload.url,

        method: upload.method,

        headers: upload.headers,

        file,

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
    } catch (error) {
      console.error("Media upload error:", error);

      updateUpload(localId, {
        status: "error",

        error:
          error?.message && !error.message.startsWith("STORAGE_UPLOAD_FAILED")
            ? error.message
            : t("media.upload.errors.failed"),
      });
    }
  }

  /*
   * =======================================================
   * FILE QUEUE
   * =======================================================
   */

  async function processFiles(fileList) {
    const files = Array.from(fileList || []);

    /*
     * Sequential uploads reduce spikes
     * in browser memory and signed-upload
     * requests when users drop many files.
     */
    for (const file of files) {
      await uploadFile(file);
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
        className={cn(
          "flex w-full flex-col items-center justify-center",

          "rounded-2xl",

          "border border-dashed",

          "px-6 py-10",

          "text-center",

          "transition",

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
          {t("media.upload.formats", {
            size: formatBytes(MAX_MEDIA_FILE_SIZE),
          })}
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ALLOWED_IMAGE_MIME_TYPES.join(",")}
        className="hidden"
        onChange={(event) => {
          processFiles(event.target.files);

          event.target.value = "";
        }}
      />

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
                {["creating", "uploading", "finalizing"].includes(
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
