"use client";

import { useRef, useState } from "react";

import {
  CheckCircle2,
  FileImage,
  LoaderCircle,
  UploadCloud,
  XCircle,
} from "lucide-react";

import { cn } from "@/utils/cn";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const MAX_FILE_SIZE = 20 * 1024 * 1024;

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) {
    return "—";
  }

  if (bytes === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];

  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );

  const value = bytes / 1024 ** index;

  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

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

      onProgress(percent);
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }

      reject(new Error(`Storage upload failed (${xhr.status}).`));
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Storage upload failed."));
    });

    xhr.send(file);
  });
}

export default function MediaUploadDropzone({ companyId, onUploaded }) {
  const inputRef = useRef(null);

  const [dragging, setDragging] = useState(false);

  const [uploads, setUploads] = useState([]);

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

  async function uploadFile(file) {
    const localId = `${Date.now()}-${Math.random()}`;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploads((current) => [
        {
          localId,
          fileName: file.name,

          size: file.size,

          status: "error",

          progress: 0,

          error: "Unsupported file type.",
        },

        ...current,
      ]);

      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploads((current) => [
        {
          localId,

          fileName: file.name,

          size: file.size,

          status: "error",

          progress: 0,

          error: "File exceeds 20 MB.",
        },

        ...current,
      ]);

      return;
    }

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
        throw new Error(created?.message || "Unable to create media upload.");
      }

      const media = created.data.media;

      const upload = created.data.upload;

      updateUpload(localId, {
        status: "uploading",

        mediaId: media.id,
      });

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
        throw new Error(finalized?.message || "Unable to finalize media.");
      }

      updateUpload(localId, {
        status: "complete",

        progress: 100,
      });

      await onUploaded?.();
    } catch (error) {
      console.error("Media upload error:", error);

      updateUpload(localId, {
        status: "error",

        error: error?.message || "Upload failed.",
      });
    }
  }

  async function processFiles(fileList) {
    const files = Array.from(fileList || []);

    for (const file of files) {
      await uploadFile(file);
    }
  }

  function handleDrop(event) {
    event.preventDefault();

    setDragging(false);

    processFiles(event.dataTransfer.files);
  }

  return (
    <div>
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
          "rounded-2xl border border-dashed",
          "px-6 py-10",
          "text-center transition",
          dragging
            ? "border-[var(--company-primary)] bg-[var(--company-primary-soft)]"
            : "border-[var(--admin-border)] bg-[var(--admin-surface)] hover:border-[var(--company-primary)]",
        )}
      >
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center",
            "rounded-2xl",
            "bg-[var(--company-primary-soft)]",
            "text-[var(--company-primary)]",
          )}
        >
          <UploadCloud size={21} strokeWidth={1.7} />
        </div>

        <div className="mt-4 text-sm font-medium text-[var(--admin-foreground)]">
          Drop images here or click to upload
        </div>

        <div className="mt-1 text-xs text-[var(--admin-muted)]">
          JPG, PNG or WebP • up to 20 MB
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          processFiles(event.target.files);

          event.target.value = "";
        }}
      />

      {uploads.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
          {uploads.map((upload, index) => (
            <div
              key={upload.localId}
              className={cn(
                "flex items-center gap-4 px-4 py-3",
                index !== uploads.length - 1 &&
                  "border-b border-[var(--admin-border)]",
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-background)] text-[var(--admin-muted)]">
                <FileImage size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-[var(--admin-foreground)]">
                  {upload.fileName}
                </div>

                <div className="mt-1 text-[11px] text-[var(--admin-muted)]">
                  {formatBytes(upload.size)}
                </div>

                {["uploading", "finalizing"].includes(upload.status) && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--admin-hover)]">
                    <div
                      className="h-full rounded-full bg-[var(--company-primary)] transition-[width]"
                      style={{
                        width: `${upload.progress}%`,
                      }}
                    />
                  </div>
                )}

                {upload.error && (
                  <div className="mt-1.5 text-[11px] text-red-600">
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
                    className="animate-spin text-[var(--company-primary)]"
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
