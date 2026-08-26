"use client";

import { Edit3, LoaderCircle, Send, Trash2 } from "lucide-react";

function displayName(item) {
  return item?.name?.en || item?.name?.th || "Untitled Slideshow";
}

function formatDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function SlideshowCard({
  item,
  busy = false,
  onEdit,
  onPublish,
  onDelete,
}) {
  const published = item?.status === "published";

  const enabledSlides = Array.isArray(item?.slides)
    ? item.slides.filter((slide) => slide.enabled !== false).length
    : 0;

  return (
    <article className="rounded-3xl border border-neutral-200 bg-white p-6 transition hover:border-neutral-300">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="truncate text-base font-semibold tracking-[-0.02em] text-neutral-950">
            {displayName(item)}
          </div>

          {item?.name?.th && item?.name?.en && (
            <div className="mt-1 truncate text-xs text-neutral-400">
              {item.name.th}
            </div>
          )}
        </div>

        <span
          className={
            published
              ? "shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-700"
              : "shrink-0 rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-500"
          }
        >
          {published ? "Published" : "Draft"}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-neutral-50 p-4">
          <div className="text-2xl font-semibold tracking-[-0.04em] text-neutral-950">
            {item?.slides?.length || 0}
          </div>

          <div className="mt-1 text-xs text-neutral-400">Total images</div>
        </div>

        <div className="rounded-2xl bg-neutral-50 p-4">
          <div className="text-2xl font-semibold tracking-[-0.04em] text-neutral-950">
            {enabledSlides}
          </div>

          <div className="mt-1 text-xs text-neutral-400">Active images</div>
        </div>
      </div>

      {item?.updatedAt && (
        <div className="mt-4 text-[11px] text-neutral-400">
          Updated {formatDate(item.updatedAt)}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-4">
        <button
          type="button"
          onClick={onEdit}
          disabled={busy}
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-neutral-200 px-3 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
        >
          <Edit3 size={14} />
          Edit
        </button>

        {!published && (
          <button
            type="button"
            onClick={onPublish}
            disabled={busy}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-neutral-950 px-3 text-xs font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
          >
            {busy ? (
              <LoaderCircle size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            Publish
          </button>
        )}

        {!published && (
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className="ml-auto inline-flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 size={14} />
            Delete
          </button>
        )}
      </div>
    </article>
  );
}
