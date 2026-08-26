"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Image as ImageIcon, RefreshCw, Search, Upload } from "lucide-react";

import { useCompanyWorkspace } from "@/components/admin/company/CompanyWorkspaceProvider";
import { cn } from "@/utils/cn";

import MediaUploadDropzone from "./MediaUploadDropzone";
import MediaCard from "./MediaCard";

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

function getMediaName(media) {
  return (
    media?.originalFileName ||
    media?.fileName ||
    media?.name ||
    media?.id ||
    "Untitled media"
  );
}

export default function MediaManager() {
  const {
    activeCompany,
    activeCompanyId,
    loading: companyLoading,
  } = useCompanyWorkspace();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");

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
          throw new Error(payload?.message || "Unable to retrieve media.");
        }

        setItems(normalizeMediaResponse(payload));
      } catch (loadError) {
        console.error("Load media error:", loadError);

        setError(loadError?.message || "Unable to retrieve media.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeCompanyId],
  );

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
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(keyword);
    });
  }, [items, search]);

  if (companyLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-sm text-[var(--admin-muted)]">
          Loading workspace...
        </div>
      </div>
    );
  }

  if (!activeCompany) {
    return (
      <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-8">
        <div className="text-sm font-medium text-[var(--admin-foreground)]">
          No company selected
        </div>

        <p className="mt-1 text-sm text-[var(--admin-muted)]">
          Select a workspace before managing media.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div
        className={cn(
          "flex flex-col gap-5",
          "lg:flex-row lg:items-end lg:justify-between",
        )}
      >
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--admin-muted)]">
            Content Management
          </div>

          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-[var(--admin-foreground)] sm:text-4xl">
            Media
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--admin-muted)]">
            Upload and manage images used across the website.
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
            "text-sm font-medium text-[var(--admin-foreground)]",
            "transition hover:bg-[var(--admin-hover)]",
            "disabled:cursor-not-allowed disabled:opacity-60",
            "lg:self-auto",
          )}
        >
          <RefreshCw size={15} className={cn(refreshing && "animate-spin")} />
          Refresh
        </button>
      </div>

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

      <div
        className={cn(
          "mt-6 flex flex-col gap-4",
          "sm:flex-row sm:items-center sm:justify-between",
        )}
      >
        <div className="relative w-full sm:max-w-sm">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-muted)]"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search media..."
            className={cn(
              "h-11 w-full rounded-xl",
              "border border-[var(--admin-border)]",
              "bg-[var(--admin-surface)]",
              "pl-10 pr-4",
              "text-sm text-[var(--admin-foreground)]",
              "outline-none transition",
              "placeholder:text-[var(--admin-muted-light)]",
              "focus:border-[var(--company-primary)]",
              "focus:ring-2 focus:ring-[var(--company-primary-soft)]",
            )}
          />
        </div>

        <div className="text-xs text-[var(--admin-muted)]">
          {filteredItems.length}{" "}
          {filteredItems.length === 1 ? "asset" : "assets"}
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

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
              className="overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)]"
            >
              <div className="aspect-[4/3] animate-pulse bg-[var(--admin-hover)]" />

              <div className="space-y-2 p-4">
                <div className="h-3 w-3/4 animate-pulse rounded bg-[var(--admin-hover)]" />
                <div className="h-2.5 w-1/2 animate-pulse rounded bg-[var(--admin-hover)]" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="mt-6 flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)] p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--company-primary-soft)] text-[var(--company-primary)]">
            <ImageIcon size={21} strokeWidth={1.7} />
          </div>

          <div className="mt-4 text-sm font-medium text-[var(--admin-foreground)]">
            {search ? "No matching media" : "No media yet"}
          </div>

          <p className="mt-1 max-w-sm text-xs leading-5 text-[var(--admin-muted)]">
            {search
              ? "Try another filename or keyword."
              : "Upload the first image to start building your media library."}
          </p>
        </div>
      ) : (
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
              title={getMediaName(media)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
