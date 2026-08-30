"use client";

import { useMemo, useState } from "react";

import { Users, X } from "lucide-react";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { cn } from "@/utils/cn";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function getInitials(reader) {
  const source = reader?.displayName || reader?.email || "?";

  const words = String(source).trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "?";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0] || ""}${words[1][0] || ""}`.toUpperCase();
}

function formatReadDate(value, locale) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/*
 * =========================================================
 * AVATAR
 * =========================================================
 */

function ReaderAvatar({ reader, locale, size = "normal" }) {
  const [showTooltip, setShowTooltip] = useState(false);

  const compact = size === "compact";

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-center",

          "rounded-full",

          "border-2 border-[var(--admin-surface)]",

          "bg-[var(--company-primary-soft)]",

          "font-semibold",

          "text-[var(--company-primary)]",

          compact ? "h-6 w-6 text-[8px]" : "h-8 w-8 text-[9px]",
        )}
      >
        {getInitials(reader)}
      </div>

      {showTooltip && (
        <div
          className="
            pointer-events-none

            absolute
            bottom-[calc(100%+8px)]
            left-1/2

            z-[260]

            w-max
            max-w-[220px]

            -translate-x-1/2

            rounded-xl

            bg-black

            px-3
            py-2

            text-white

            shadow-xl
          "
        >
          <div
            className="
              admin-text-9
              font-semibold
            "
          >
            {reader?.displayName || reader?.email || "User"}
          </div>

          {reader?.email && (
            <div
              className="
                mt-0.5

                admin-text-8

                text-white/65
              "
            >
              {reader.email}
            </div>
          )}

          {reader?.readAt && (
            <div
              className="
                mt-1

                admin-text-8

                text-white/55
              "
            >
              {formatReadDate(reader.readAt, locale)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/*
 * =========================================================
 * GROUP
 * =========================================================
 */

export default function MessageReaderAvatars({
  readBy,
  max = 3,
  compact = false,
}) {
  const { t, locale } = useAdminTranslation();

  const [expanded, setExpanded] = useState(false);

  const readers = useMemo(() => {
    if (!readBy || typeof readBy !== "object") {
      return [];
    }

    return Object.values(readBy)
      .filter(Boolean)
      .sort((a, b) => {
        const aTime = new Date(a?.readAt || 0).getTime();

        const bTime = new Date(b?.readAt || 0).getTime();

        return aTime - bTime;
      });
  }, [readBy]);

  if (readers.length === 0) {
    return (
      <span
        className="
          admin-text-8

          text-[var(--admin-muted-light)]
        "
      >
        {t("messages.readers.none")}
      </span>
    );
  }

  const visible = readers.slice(0, max);

  const remaining = Math.max(0, readers.length - max);

  return (
    <div className="relative">
      <div
        className="
          flex
          items-center
        "
      >
        {visible.map((reader, index) => (
          <div
            key={reader.uid || reader.email || index}
            className={index > 0 ? "-ml-2" : ""}
          >
            <ReaderAvatar
              reader={reader}
              locale={locale}
              size={compact ? "compact" : "normal"}
            />
          </div>
        ))}

        {remaining > 0 && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();

              setExpanded(true);
            }}
            className={cn(
              "-ml-2",

              "flex shrink-0 items-center justify-center",

              "rounded-full",

              "border-2 border-[var(--admin-surface)]",

              "bg-[var(--admin-background)]",

              "font-semibold",

              "text-[var(--admin-muted)]",

              "transition",

              "hover:bg-[var(--admin-hover)]",

              "hover:text-[var(--company-primary)]",

              compact
                ? "h-6 min-w-6 px-1 text-[7px]"
                : "h-8 min-w-8 px-1 text-[8px]",
            )}
          >
            +{remaining}
          </button>
        )}
      </div>

      {/* =================================
          EXPANDED READER LIST
      ================================= */}

      {expanded && (
        <>
          <button
            type="button"
            aria-label={t("common.close")}
            onClick={(event) => {
              event.stopPropagation();

              setExpanded(false);
            }}
            className="
              fixed
              inset-0
              z-[245]

              cursor-default
            "
          />

          <div
            className="
              absolute
              right-0
              top-[calc(100%+8px)]

              z-[250]

              w-[300px]
              max-w-[calc(100vw-32px)]

              overflow-hidden

              rounded-2xl

              border
              border-[var(--admin-border)]

              bg-[var(--admin-surface)]

              shadow-[0_20px_60px_rgba(0,0,0,0.16)]
            "
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="
                flex
                items-center
                justify-between

                border-b
                border-[var(--admin-border)]

                px-4
                py-3
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >
                <Users
                  size={14}
                  className="
                    text-[var(--company-primary)]
                  "
                />

                <span
                  className="
                    admin-text-10
                    font-semibold

                    text-[var(--admin-foreground)]
                  "
                >
                  {t("messages.readers.title", {
                    count: readers.length,
                  })}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="
                  flex
                  h-7
                  w-7

                  items-center
                  justify-center

                  rounded-lg

                  text-[var(--admin-muted)]

                  hover:bg-[var(--admin-hover)]
                "
              >
                <X size={13} />
              </button>
            </div>

            <div
              className="
                max-h-[320px]
                overflow-y-auto
              "
            >
              {readers.map((reader, index) => (
                <div
                  key={reader.uid || reader.email || index}
                  className="
                      flex
                      items-center
                      gap-3

                      border-b
                      border-[var(--admin-border)]

                      px-4
                      py-3

                      last:border-b-0
                    "
                >
                  <ReaderAvatar reader={reader} locale={locale} />

                  <div className="min-w-0 flex-1">
                    <div
                      className="
                          truncate

                          admin-text-10
                          font-semibold

                          text-[var(--admin-foreground)]
                        "
                    >
                      {reader.displayName ||
                        reader.email ||
                        t("messages.readers.unknown")}
                    </div>

                    {reader.email && (
                      <div
                        className="
                            mt-0.5
                            truncate

                            admin-text-8

                            text-[var(--admin-muted)]
                          "
                      >
                        {reader.email}
                      </div>
                    )}

                    <div
                      className="
                          mt-1

                          admin-text-8

                          text-[var(--admin-muted-light)]
                        "
                    >
                      {formatReadDate(reader.readAt, locale)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
