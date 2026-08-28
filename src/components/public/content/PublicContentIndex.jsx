"use client";

import Link from "next/link";

import { Search, SlidersHorizontal, X } from "lucide-react";

import { useMemo, useState } from "react";

import PublicContentCard from "./PublicContentCard";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function matchesSearch(item, keyword) {
  const search = String(keyword || "")
    .trim()
    .toLowerCase();

  if (!search) {
    return true;
  }

  const values = [
    item.title?.en,
    item.title?.th,

    item.excerpt?.en,
    item.excerpt?.th,

    item.source?.metadata?.title,

    item.source?.metadata?.authorName,

    item.source?.provider,

    ...(Array.isArray(item.tags) ? item.tags : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return values.includes(search);
}

/*
 * =========================================================
 * CONTENT SECTION
 * =========================================================
 *
 * Important:
 * Keep this component outside
 * PublicContentIndex.
 *
 * React Compiler / ESLint does not allow
 * components to be created inside render.
 * =========================================================
 */

function PublicContentSection({ title, contents, companySlug, locale }) {
  if (!contents.length) {
    return null;
  }

  return (
    <section>
      {/* =====================================
          SECTION TITLE
      ===================================== */}

      <div
        className="
          flex
          items-center
          gap-6
        "
      >
        <h2
          className="
            shrink-0

            text-[12px]
            font-medium
            uppercase
            tracking-[0.07em]

            text-[var(--public-primary)]

            sm:text-[13px]
          "
        >
          {title}
        </h2>

        <div
          className="
            h-px
            flex-1

            bg-black/10
          "
        />
      </div>

      {/* =====================================
          CONTENT LIST
      ===================================== */}

      <div
        className="
          mt-8

          space-y-14

          sm:space-y-16

          lg:mt-10
          lg:space-y-20
        "
      >
        {contents.map((item) => (
          <PublicContentCard
            key={item.id}
            companySlug={companySlug}
            item={item}
            locale={locale}
          />
        ))}
      </div>
    </section>
  );
}

/*
 * =========================================================
 * PUBLIC CONTENT INDEX
 * =========================================================
 */

export default function PublicContentIndex({
  companySlug,
  items = [],
  providers = [],
  tags = [],
  locale = "en",
}) {
  const [filterOpen, setFilterOpen] = useState(false);

  const [keyword, setKeyword] = useState("");

  const [section, setSection] = useState("");

  const [provider, setProvider] = useState("");

  const [tag, setTag] = useState("");

  const hasFilters = Boolean(keyword || section || provider || tag);

  /*
   * =======================================================
   * FILTER DATA
   * =======================================================
   */

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        /*
         * Section
         */
        if (section && item.section !== section) {
          return false;
        }

        /*
         * Provider
         */
        if (provider && item.source?.provider !== provider) {
          return false;
        }

        /*
         * Tag
         */
        if (tag && !(Array.isArray(item.tags) && item.tags.includes(tag))) {
          return false;
        }

        /*
         * Search
         */
        return matchesSearch(item, keyword);
      }),
    [items, keyword, section, provider, tag],
  );

  const videos = useMemo(
    () => filteredItems.filter((item) => item.section === "video"),
    [filteredItems],
  );

  const publications = useMemo(
    () => filteredItems.filter((item) => item.section === "publication"),
    [filteredItems],
  );

  /*
   * =======================================================
   * ACTIONS
   * =======================================================
   */

  function clearFilters() {
    setKeyword("");
    setSection("");
    setProvider("");
    setTag("");
  }

  function toggleFilter() {
    setFilterOpen((current) => !current);
  }

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <div
      className="
        w-full

        px-6
        pb-16

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
          max-w-[1440px]
        "
      >
        {/* =====================================
            BREADCRUMB + FILTER
        ===================================== */}

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
          {/* Breadcrumb */}

          <nav
            aria-label="Breadcrumb"
            className="
              flex
              min-w-0
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
                text-black/25

                transition-colors
                duration-200

                hover:text-black/55
              "
            >
              Home
            </Link>

            <span
              className="
                text-black/15
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
              Public
            </span>
          </nav>

          {/* Filter Button */}

          <button
            type="button"
            aria-label={filterOpen ? "Close filters" : "Filter public content"}
            aria-expanded={filterOpen}
            onClick={toggleFilter}
            className="
              group

              flex
              h-8
              w-8

              shrink-0

              items-center
              justify-center

              text-black/25

              transition-colors
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
          </button>
        </div>

        {/* =====================================
            FILTER PANEL
        ===================================== */}

        {filterOpen && (
          <div
            className="
              mt-8

              grid
              grid-cols-1

              gap-5

              border-b
              border-black/[0.08]

              pb-5

              md:grid-cols-[minmax(220px,1fr)_160px_160px_160px_auto]
              md:items-end
              md:gap-6
            "
          >
            {/* =====================
                SEARCH
            ====================== */}

            <label
              className="
                group

                flex
                items-center
                gap-2

                border-b
                border-black/10

                pb-2

                transition-colors
                duration-200

                focus-within:border-[var(--public-primary)]
              "
            >
              <Search
                size={14}
                strokeWidth={1.1}
                className="
                  shrink-0

                  text-black/25

                  transition-colors

                  group-focus-within:text-[var(--public-primary)]
                "
              />

              <input
                type="search"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Search"
                autoFocus
                autoComplete="off"
                aria-label="Search public content"
                className="
                  min-w-0
                  flex-1

                  bg-transparent

                  text-[11px]
                  tracking-[0.02em]
                  text-black/70

                  outline-none

                  placeholder:text-black/25

                  sm:text-[12px]
                "
              />

              {keyword && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setKeyword("")}
                  className="
                    flex
                    h-5
                    w-5

                    items-center
                    justify-center

                    text-black/20

                    transition-colors

                    hover:text-[var(--public-primary)]
                  "
                >
                  <X size={12} strokeWidth={1.1} />
                </button>
              )}
            </label>

            {/* =====================
                CONTENT TYPE
            ====================== */}

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
                  text-black/25
                "
              >
                Type
              </span>

              <select
                value={section}
                onChange={(event) => setSection(event.target.value)}
                className="
                  cursor-pointer

                  border-0
                  border-b
                  border-black/10

                  bg-transparent

                  pb-2

                  text-[10px]
                  uppercase
                  tracking-[0.05em]
                  text-black/50

                  outline-none

                  transition-colors

                  focus:border-[var(--public-primary)]
                "
              >
                <option value="">All</option>

                <option value="video">Video</option>

                <option value="publication">Publication</option>
              </select>
            </label>

            {/* =====================
                PROVIDER
            ====================== */}

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
                  text-black/25
                "
              >
                Provider
              </span>

              <select
                value={provider}
                onChange={(event) => setProvider(event.target.value)}
                className="
                  cursor-pointer

                  border-0
                  border-b
                  border-black/10

                  bg-transparent

                  pb-2

                  text-[10px]
                  uppercase
                  tracking-[0.05em]
                  text-black/50

                  outline-none

                  transition-colors

                  focus:border-[var(--public-primary)]
                "
              >
                <option value="">All Providers</option>

                {providers.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            {/* =====================
                TAG
            ====================== */}

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
                  text-black/25
                "
              >
                Tag
              </span>

              <select
                value={tag}
                onChange={(event) => setTag(event.target.value)}
                className="
                  cursor-pointer

                  border-0
                  border-b
                  border-black/10

                  bg-transparent

                  pb-2

                  text-[10px]
                  uppercase
                  tracking-[0.05em]
                  text-black/50

                  outline-none

                  transition-colors

                  focus:border-[var(--public-primary)]
                "
              >
                <option value="">All Tags</option>

                {tags.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            {/* =====================
                CLEAR
            ====================== */}

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

                text-black/25

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
        )}

        {/* =====================================
            ACTIVE FILTER SUMMARY
        ===================================== */}

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
                min-w-0
                flex-1

                bg-black/10
              "
            />

            <span
              className="
                shrink-0

                text-[9px]
                uppercase
                tracking-[0.07em]

                text-black/25
              "
            >
              {filteredItems.length}{" "}
              {filteredItems.length === 1 ? "Item" : "Items"}
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

                text-black/20

                transition-colors

                hover:text-[var(--public-primary)]
              "
            >
              <X size={14} strokeWidth={1.1} />
            </button>
          </div>
        )}

        {/* =====================================
            EMPTY STATE
        ===================================== */}

        {!items.length ? (
          <div
            className="
              flex
              min-h-[50vh]

              items-center
              justify-center

              text-[11px]
              uppercase
              tracking-[0.08em]

              text-black/25
            "
          >
            No public content available
          </div>
        ) : (
          <>
            {/* =================================
                NO FILTER RESULTS
            ================================= */}

            {!videos.length && !publications.length ? (
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

                    text-black/25
                  "
                >
                  No content found
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
              /* =================================
                 VIDEO + PUBLICATION
              ================================= */

              <div
                className="
                  mt-10

                  space-y-24

                  sm:mt-12

                  lg:mt-14
                  lg:space-y-28
                "
              >
                <PublicContentSection
                  title="Video"
                  contents={videos}
                  companySlug={companySlug}
                  locale={locale}
                />

                <PublicContentSection
                  title="Publication"
                  contents={publications}
                  companySlug={companySlug}
                  locale={locale}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
