"use client";

import { Search, X } from "lucide-react";

export default function PublicProjectFilter({
  search,

  category,

  year,

  categories = [],

  years = [],

  locale = "en",

  onSearchChange,

  onCategoryChange,

  onYearChange,

  onClear,
}) {
  const hasFilters = Boolean(search) || Boolean(category) || Boolean(year);

  function localized(value) {
    if (!value) {
      return "";
    }

    if (typeof value === "string") {
      return value;
    }

    return (
      value?.[locale]?.trim() || value?.en?.trim() || value?.th?.trim() || ""
    );
  }

  return (
    <div
      className="
        border-b
        border-[var(--public-border)]
        pb-4
        text-[var(--public-foreground)]
      "
    >
      <div
        className="
          flex
          flex-col
          gap-4
          md:flex-row
          md:items-end
          md:gap-6
        "
      >
        <label
          className="
            group
            flex
            min-w-0
            flex-1
            items-center
            gap-2
            border-b
            border-[var(--public-border)]
            pb-2
            transition-colors
            focus-within:border-[var(--public-primary)]
          "
        >
          <Search
            size={14}
            strokeWidth={1.2}
            className="
              shrink-0
              text-[var(--public-muted-foreground)]
              transition-colors
              group-focus-within:text-[var(--public-primary)]
            "
          />

          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search projects"
            className="
              min-w-0
              flex-1
              bg-transparent
              text-[11px]
              tracking-[0.02em]
              text-[var(--public-foreground)]
              outline-none
              placeholder:text-[var(--public-muted-foreground)]
              sm:text-[12px]
            "
          />

          {search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onSearchChange("")}
              className="
                text-[var(--public-muted-foreground)]
                transition-colors
                hover:text-[var(--public-primary)]
              "
            >
              <X size={13} strokeWidth={1.2} />
            </button>
          )}
        </label>

        <label
          className="
            flex
            min-w-[170px]
            flex-col
            gap-1
          "
        >
          <span
            className="
              text-[8px]
              uppercase
              tracking-[0.09em]
              text-[var(--public-muted-foreground)]
            "
          >
            Category
          </span>

          <select
            value={category}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="
              cursor-pointer
              appearance-none
              border-0
              border-b
              border-[var(--public-border)]
              bg-[var(--public-background)]
              pb-2
              text-[10px]
              uppercase
              tracking-[0.05em]
              text-[var(--public-foreground)]
              outline-none
              transition-colors
              focus:border-[var(--public-primary)]
              sm:text-[11px]
            "
          >
            <option value="">All Categories</option>

            {categories.map((item) => (
              <option key={item.id} value={item.slug}>
                {localized(item.name)}
              </option>
            ))}
          </select>
        </label>

        <label
          className="
            flex
            min-w-[120px]
            flex-col
            gap-1
          "
        >
          <span
            className="
              text-[8px]
              uppercase
              tracking-[0.09em]
              text-[var(--public-muted-foreground)]
            "
          >
            Year
          </span>

          <select
            value={year}
            onChange={(event) => onYearChange(event.target.value)}
            className="
              cursor-pointer
              appearance-none
              border-0
              border-b
              border-[var(--public-border)]
              bg-[var(--public-background)]
              pb-2
              text-[10px]
              uppercase
              tracking-[0.05em]
              text-[var(--public-foreground)]
              outline-none
              transition-colors
              focus:border-[var(--public-primary)]
              sm:text-[11px]
            "
          >
            <option value="">All Years</option>

            {years.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <div
          className="
            flex
            h-[34px]
            items-end
          "
        >
          <button
            type="button"
            disabled={!hasFilters}
            onClick={onClear}
            className="
              pb-2
              text-[9px]
              uppercase
              tracking-[0.08em]
              text-[var(--public-muted-foreground)]
              transition-colors
              enabled:hover:text-[var(--public-primary)]
              disabled:cursor-default
              disabled:opacity-0
              sm:text-[10px]
            "
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
