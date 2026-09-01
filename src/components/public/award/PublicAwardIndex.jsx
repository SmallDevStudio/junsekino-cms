"use client";

import Link from "next/link";

import { useMemo, useState } from "react";

import { Search, SlidersHorizontal, X } from "lucide-react";

import PublicAwardCard from "./PublicAwardCard";

function getLocalizedValue(
  value,

  locale = "en",
) {
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

function matchesKeyword({
  award,

  keyword,

  locale,
}) {
  const normalized = String(keyword || "")
    .trim()
    .toLowerCase();

  if (!normalized) {
    return true;
  }

  const searchable = [
    award.awardName?.en,

    award.awardName?.th,

    award.project?.title?.en,

    award.project?.title?.th,

    award.project?.slug,

    award.category?.name?.en,

    award.category?.name?.th,

    ...(Array.isArray(award.tags) ? award.tags : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  void locale;

  return searchable.includes(normalized);
}

function FilterTooltip({ label }) {
  return (
    <span
      className="
        pointer-events-none
        absolute
        right-0
        top-full
        z-[120]
        mt-2
        whitespace-nowrap
        bg-black/80
        px-2
        py-1
        text-[9px]
        tracking-[0.04em]
        text-white
        opacity-0
        transition-opacity
        duration-150
        group-hover:opacity-100
      "
    >
      {label}
    </span>
  );
}

export default function PublicAwardIndex({
  companySlug,

  awards = [],

  categories = [],

  tags = [],

  locale = "en",
}) {
  const [filterOpen, setFilterOpen] = useState(false);

  const [keyword, setKeyword] = useState("");

  const [categoryId, setCategoryId] = useState("");

  const [selectedTag, setSelectedTag] = useState("");

  const hasFilters = Boolean(keyword.trim() || categoryId || selectedTag);

  const filteredAwards = useMemo(
    () =>
      awards.filter((award) => {
        if (categoryId && award.category?.id !== categoryId) {
          return false;
        }

        if (
          selectedTag &&
          !(Array.isArray(award.tags) && award.tags.includes(selectedTag))
        ) {
          return false;
        }

        return matchesKeyword({
          award,

          keyword,

          locale,
        });
      }),
    [awards, keyword, categoryId, selectedTag, locale],
  );

  function clearFilters() {
    setKeyword("");

    setCategoryId("");

    setSelectedTag("");
  }

  return (
    <div
      className="
        w-full
        bg-[var(--public-background)]
        px-6
        pb-16
        text-[var(--public-foreground)]
        sm:px-8
        lg:px-12
        lg:pb-24
        xl:px-16
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-[1100px]
        "
      >
        <div
          className="
            flex
            items-center
            justify-between
            gap-6
            pt-2
            lg:pt-4
          "
        >
          <nav
            aria-label="Breadcrumb"
            className="
              flex
              items-center
              gap-2
              text-[10px]
              uppercase
              tracking-[0.06em]
              sm:text-[11px]
            "
          >
            <Link
              href={`/${companySlug}`}
              className="
                text-[var(--public-muted-foreground)]
                transition-colors
                hover:text-[var(--public-foreground)]
              "
            >
              Home
            </Link>

            <span
              className="
                text-[var(--public-border)]
              "
            >
              /
            </span>

            <span
              className="
                font-medium
                text-[var(--public-primary)]
              "
            >
              Award
            </span>
          </nav>

          <button
            type="button"
            aria-label={filterOpen ? "Close filters" : "Filter awards"}
            aria-expanded={filterOpen}
            onClick={() => setFilterOpen((current) => !current)}
            className="
              group
              relative
              flex
              h-8
              w-8
              items-center
              justify-center
              text-[var(--public-muted-foreground)]
              transition-all
              duration-200
              hover:text-[var(--public-primary)]
            "
          >
            {filterOpen ? (
              <X size={18} strokeWidth={1.1} />
            ) : (
              <SlidersHorizontal
                size={17}
                strokeWidth={1.1}
                className="
                  transition-transform
                  duration-200
                  group-hover:scale-110
                "
              />
            )}

            {!filterOpen && <FilterTooltip label="Filter awards" />}
          </button>
        </div>

        {filterOpen && (
          <div
            className="
              mt-7
              border-b
              border-[var(--public-border)]
              pb-4
              sm:mt-8
            "
          >
            <div
              className="
                grid
                grid-cols-1
                gap-4
                md:grid-cols-[minmax(220px,1fr)_200px_180px_auto]
                md:items-end
                md:gap-6
              "
            >
              <label
                className="
                  group
                  flex
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
                  strokeWidth={1.1}
                  className="
                    shrink-0
                    text-[var(--public-muted-foreground)]
                    transition-colors
                    group-focus-within:text-[var(--public-primary)]
                  "
                />

                <input
                  type="search"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Search award or project"
                  autoFocus
                  autoComplete="off"
                  aria-label="Search award or project"
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

                {keyword && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setKeyword("")}
                    className="
                      text-[var(--public-muted-foreground)]
                      transition-colors
                      hover:text-[var(--public-primary)]
                    "
                  >
                    <X size={13} strokeWidth={1.1} />
                  </button>
                )}
              </label>

              <label
                className="
                  flex
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
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  className="
                    cursor-pointer
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

                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {getLocalizedValue(
                        category.name,

                        locale,
                      )}
                    </option>
                  ))}
                </select>
              </label>

              <label
                className="
                  flex
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
                  Tag
                </span>

                <select
                  value={selectedTag}
                  onChange={(event) => setSelectedTag(event.target.value)}
                  className="
                    cursor-pointer
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
                  <option value="">All Tags</option>

                  {tags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                disabled={!hasFilters}
                onClick={clearFilters}
                className="
                  pb-2
                  text-left
                  text-[9px]
                  uppercase
                  tracking-[0.08em]
                  text-[var(--public-muted-foreground)]
                  transition-colors
                  enabled:hover:text-[var(--public-primary)]
                  disabled:cursor-default
                  disabled:opacity-0
                  md:text-right
                "
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {hasFilters && (
          <div
            className="
              mt-7
              flex
              items-center
              gap-4
              sm:mt-8
            "
          >
            <span
              className="
                shrink-0
                text-[9px]
                uppercase
                tracking-[0.07em]
                text-[var(--public-primary)]
                sm:text-[10px]
              "
            >
              Filtered
            </span>

            <div
              className="
                h-px
                flex-1
                bg-[var(--public-border)]
              "
            />

            <span
              className="
                shrink-0
                text-[9px]
                uppercase
                tracking-[0.07em]
                text-[var(--public-muted-foreground)]
              "
            >
              {filteredAwards.length}{" "}
              {filteredAwards.length === 1 ? "Award" : "Awards"}
            </span>

            <button
              type="button"
              aria-label="Clear filters"
              onClick={clearFilters}
              className="
                flex
                h-6
                w-6
                items-center
                justify-center
                text-[var(--public-muted-foreground)]
                transition-colors
                hover:text-[var(--public-primary)]
              "
            >
              <X size={14} strokeWidth={1.1} />
            </button>
          </div>
        )}

        {!awards.length ? (
          <div
            className="
              flex
              min-h-[50vh]
              items-center
              justify-center
              text-[11px]
              uppercase
              tracking-[0.08em]
              text-[var(--public-muted-foreground)]
            "
          >
            No awards available
          </div>
        ) : !filteredAwards.length ? (
          <div
            className="
              flex
              min-h-[360px]
              flex-col
              items-center
              justify-center
              text-center
            "
          >
            <p
              className="
                text-[10px]
                uppercase
                tracking-[0.08em]
                text-[var(--public-muted-foreground)]
              "
            >
              No awards found
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="
                mt-4
                text-[9px]
                uppercase
                tracking-[0.08em]
                text-[var(--public-primary)]
                transition-opacity
                hover:opacity-60
              "
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div
            className="
              mt-10
              space-y-14
              sm:mt-12
              sm:space-y-16
              lg:mt-14
              lg:space-y-20
            "
          >
            {filteredAwards.map((award) => (
              <PublicAwardCard
                key={award.id}
                companySlug={companySlug}
                award={award}
                locale={locale}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
