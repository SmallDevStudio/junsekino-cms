"use client";

import { LoaderCircle, Plus, X } from "lucide-react";

import { useMemo, useState } from "react";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { cn } from "@/utils/cn";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function normalizeTag(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function hasTag(items, tag) {
  const normalized = tag.toLowerCase();

  return items.some((item) => normalizeTag(item).toLowerCase() === normalized);
}

/*
 * =========================================================
 * TAG INPUT
 * =========================================================
 */

export default function TagInput({
  value = [],

  suggestions = [],

  loadingSuggestions = false,

  onChange,

  placeholder,

  maxLength = 100,
}) {
  const { t } = useAdminTranslation();

  const [input, setInput] = useState("");

  const [focused, setFocused] = useState(false);

  const resolvedPlaceholder = placeholder || t("tagInput.placeholder");

  /*
   * =======================================================
   * SUGGESTIONS
   * =======================================================
   */

  const filteredSuggestions = useMemo(() => {
    const keyword = normalizeTag(input).toLowerCase();

    return suggestions
      .map(normalizeTag)
      .filter(Boolean)
      .filter(
        (suggestion, index, items) =>
          items.findIndex(
            (item) => item.toLowerCase() === suggestion.toLowerCase(),
          ) === index,
      )
      .filter((suggestion) => !hasTag(value, suggestion))
      .filter((suggestion) =>
        keyword ? suggestion.toLowerCase().includes(keyword) : true,
      )
      .slice(0, 8);
  }, [input, suggestions, value]);

  /*
   * =======================================================
   * ADD
   * =======================================================
   */

  function addTag(rawValue) {
    const tag = normalizeTag(rawValue);

    if (!tag) {
      return;
    }

    if (tag.length > maxLength) {
      return;
    }

    if (hasTag(value, tag)) {
      setInput("");

      return;
    }

    onChange?.([...value, tag]);

    setInput("");
  }

  /*
   * =======================================================
   * REMOVE
   * =======================================================
   */

  function removeTag(tag) {
    const normalized = normalizeTag(tag).toLowerCase();

    onChange?.(
      value.filter((item) => normalizeTag(item).toLowerCase() !== normalized),
    );
  }

  const showSuggestions =
    focused && (loadingSuggestions || filteredSuggestions.length > 0);

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <div>
      <div className="relative">
        <div
          className="
            flex
            gap-2
          "
        >
          <input
            value={input}
            maxLength={maxLength}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              window.setTimeout(() => {
                setFocused(false);
              }, 120);
            }}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault();

                addTag(input);
              }

              if (event.key === "Backspace" && !input && value.length > 0) {
                removeTag(value[value.length - 1]);
              }
            }}
            placeholder={resolvedPlaceholder}
            className="
              h-10
              min-w-0
              flex-1

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
            "
          />

          <button
            type="button"
            onClick={() => addTag(input)}
            disabled={!normalizeTag(input)}
            className="
              inline-flex
              h-10

              items-center
              justify-center
              gap-1.5

              rounded-xl

              border
              border-[var(--admin-border)]

              px-4

              admin-text-12
              font-medium

              text-[var(--admin-foreground)]

              transition

              hover:border-[var(--company-primary-border)]

              hover:bg-[var(--company-primary-soft)]

              hover:text-[var(--company-primary)]

              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            <Plus size={13} />

            {t("common.add")}
          </button>
        </div>

        {/* =================================
            SUGGESTIONS
        ================================= */}

        {showSuggestions && (
          <div
            className={cn(
              "absolute left-0 right-12 top-[calc(100%+6px)] z-40",

              "overflow-hidden",

              "rounded-xl",

              "border border-[var(--admin-border)]",

              "bg-[var(--admin-surface)]",

              "shadow-[0_12px_35px_rgba(0,0,0,0.12)]",
            )}
          >
            <div
              className="
                border-b
                border-[var(--admin-border)]

                px-3
                py-2
              "
            >
              <div
                className="
                  admin-text-10
                  font-semibold
                  uppercase
                  tracking-[0.12em]

                  text-[var(--admin-muted-light)]
                "
              >
                {t("tagInput.suggestions")}
              </div>
            </div>

            <div
              className="
                admin-sidebar-scrollbar-hide

                max-h-56
                overflow-y-auto

                p-1.5
              "
            >
              {loadingSuggestions ? (
                <div
                  className="
                    flex
                    items-center
                    justify-center
                    gap-2

                    px-3
                    py-5

                    admin-text-11

                    text-[var(--admin-muted)]
                  "
                >
                  <LoaderCircle size={14} className="animate-spin" />

                  {t("tagInput.loadingSuggestions")}
                </div>
              ) : (
                filteredSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.toLowerCase()}
                    type="button"
                    onMouseDown={(event) => {
                      /*
                       * Prevent blur before
                       * selection click.
                       */
                      event.preventDefault();
                    }}
                    onClick={() => addTag(suggestion)}
                    className="
                        flex
                        w-full

                        items-center
                        justify-between

                        gap-3

                        rounded-lg

                        px-3
                        py-2

                        text-left

                        admin-text-12

                        text-[var(--admin-foreground)]

                        transition

                        hover:bg-[var(--admin-hover)]

                        hover:text-[var(--company-primary)]
                      "
                  >
                    <span className="truncate">{suggestion}</span>

                    <Plus
                      size={12}
                      className="
                          shrink-0

                          text-[var(--admin-muted)]
                        "
                    />
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* =====================================
          SELECTED TAGS
      ===================================== */}

      {value.length > 0 && (
        <div
          className="
            mt-3

            flex
            flex-wrap

            gap-2
          "
        >
          {value.map((tag) => (
            <button
              key={tag.toLowerCase()}
              type="button"
              onClick={() => removeTag(tag)}
              aria-label={t("tagInput.remove", {
                tag,
              })}
              title={t("tagInput.remove", {
                tag,
              })}
              className="
                  inline-flex
                  items-center
                  gap-1.5

                  rounded-full

                  bg-[var(--company-primary-soft)]

                  px-3
                  py-1.5

                  admin-text-12

                  text-[var(--company-primary)]

                  transition

                  hover:bg-red-50
                  hover:text-red-600
                "
            >
              <span>{tag}</span>

              <X size={11} />
            </button>
          ))}
        </div>
      )}

      <p
        className="
          mt-2

          admin-text-10
          leading-[1.6]

          text-[var(--admin-muted-light)]
        "
      >
        {t("tagInput.hint")}
      </p>
    </div>
  );
}
