"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useEffect, useMemo, useRef, useState } from "react";

import { CiSearch } from "react-icons/ci";

import { IoCloseOutline } from "react-icons/io5";

import PublicProjectBreadcrumbs from "./PublicProjectBreadcrumbs";

import PublicProjectCard from "./PublicProjectCard";

function matchesSearch(
  project,

  keyword,
) {
  const normalizedKeyword = String(keyword || "")
    .trim()
    .toLowerCase();

  if (!normalizedKeyword) {
    return true;
  }

  const searchable = [
    project.title?.en,

    project.title?.th,

    project.excerpt?.en,

    project.excerpt?.th,

    project.slug,

    project.projectInfo?.location?.en,

    project.projectInfo?.location?.th,

    project.projectInfo?.client?.en,

    project.projectInfo?.client?.th,

    project.projectInfo?.designYear,

    project.projectInfo?.completionYear,

    ...(Array.isArray(project.tags) ? project.tags : []),
  ]
    .filter((value) => value !== null && value !== undefined)
    .join(" ")
    .toLowerCase();

  return searchable.includes(normalizedKeyword);
}

function SearchTooltip() {
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
      Search projects
    </span>
  );
}

export default function PublicProjectIndex({
  companySlug,

  projects = [],

  locale = "en",
}) {
  const router = useRouter();

  const pathname = usePathname();

  const searchParams = useSearchParams();

  const searchInputRef = useRef(null);

  const currentQuery = searchParams.get("q") || "";

  const [searchOpen, setSearchOpen] = useState(false);

  const [searchValue, setSearchValue] = useState(currentQuery);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();

      searchInputRef.current.select();
    }
  }, [searchOpen]);

  const visibleProjects = useMemo(() => {
    if (!currentQuery) {
      return projects;
    }

    return projects.filter((project) =>
      matchesSearch(
        project,

        currentQuery,
      ),
    );
  }, [currentQuery, projects]);

  function openSearch() {
    setSearchValue(currentQuery);

    setSearchOpen(true);
  }

  function closeSearch() {
    setSearchValue(currentQuery);

    setSearchOpen(false);
  }

  function submitSearch(event) {
    event.preventDefault();

    const normalized = searchValue.trim();

    if (!normalized) {
      clearSearch();

      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    params.set("q", normalized);

    const query = params.toString();

    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });

    setSearchOpen(false);
  }

  function clearSearch() {
    const params = new URLSearchParams(searchParams.toString());

    params.delete("q");

    const query = params.toString();

    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });

    setSearchValue("");

    setSearchOpen(false);
  }

  function handleSearchKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();

      closeSearch();
    }
  }

  const hasSearch = Boolean(currentQuery);

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
          max-w-[1440px]
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
          <div className="min-w-0">
            <PublicProjectBreadcrumbs
              companySlug={companySlug}
              locale={locale}
            />
          </div>

          <div
            className="
              flex
              min-w-0
              shrink-0
              items-center
              justify-end
            "
          >
            {searchOpen ? (
              <form
                onSubmit={submitSearch}
                className="
                  flex
                  w-[210px]
                  max-w-[52vw]
                  items-center
                  gap-2
                  border-b
                  border-[var(--public-border)]
                  pb-1.5
                  transition-colors
                  duration-200
                  focus-within:border-[var(--public-primary)]
                  sm:w-[260px]
                "
              >
                <CiSearch
                  size={18}
                  className="
                    shrink-0
                    text-[var(--public-muted-foreground)]
                  "
                />

                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search projects"
                  autoComplete="off"
                  aria-label="Search projects"
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

                <button
                  type="button"
                  aria-label="Close search"
                  onClick={closeSearch}
                  className="
                    flex
                    shrink-0
                    items-center
                    justify-center
                    text-[var(--public-muted-foreground)]
                    transition-colors
                    duration-200
                    hover:text-[var(--public-primary)]
                  "
                >
                  <IoCloseOutline size={18} />
                </button>
              </form>
            ) : (
              <button
                type="button"
                aria-label="Search projects"
                onClick={openSearch}
                className="
                  group
                  relative
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  text-[var(--public-muted-foreground)]
                  transition-colors
                  duration-200
                  hover:text-[var(--public-primary)]
                "
              >
                <CiSearch
                  size={21}
                  className="
                    transition-transform
                    duration-200
                    group-hover:scale-110
                  "
                />

                <SearchTooltip />
              </button>
            )}
          </div>
        </div>

        {hasSearch && (
          <div
            className="
              mt-10
              flex
              items-center
              gap-4
              sm:mt-12
              sm:gap-5
              lg:mt-14
            "
          >
            <div
              className="
                flex
                min-w-0
                items-center
                gap-2
              "
            >
              <span
                className="
                  shrink-0
                  text-[10px]
                  uppercase
                  tracking-[0.07em]
                  text-[var(--public-muted-foreground)]
                "
              >
                Search:
              </span>

              <span
                className="
                  max-w-[180px]
                  truncate
                  text-[11px]
                  font-medium
                  uppercase
                  tracking-[0.06em]
                  text-[var(--public-primary)]
                  sm:max-w-[420px]
                  sm:text-[12px]
                "
              >
                {currentQuery}
              </span>

              <button
                type="button"
                aria-label="Clear search"
                title="Clear search"
                onClick={clearSearch}
                className="
                  flex
                  h-6
                  w-6
                  shrink-0
                  items-center
                  justify-center
                  text-[var(--public-muted-foreground)]
                  transition-colors
                  duration-200
                  hover:text-[var(--public-primary)]
                "
              >
                <IoCloseOutline size={16} />
              </button>
            </div>

            <div
              className="
                h-px
                min-w-0
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
                sm:text-[10px]
              "
            >
              {visibleProjects.length}{" "}
              {visibleProjects.length === 1 ? "result" : "results"}
            </span>
          </div>
        )}

        {visibleProjects.length ? (
          <div className={hasSearch ? "mt-8 lg:mt-10" : "mt-12 lg:mt-14"}>
            <div
              className="
                grid
                grid-cols-1
                gap-x-[clamp(2rem,6vw,6.5rem)]
                gap-y-12
                sm:grid-cols-2
                lg:grid-cols-3
                lg:gap-y-16
              "
            >
              {visibleProjects.map((project) => (
                <PublicProjectCard
                  key={project.id}
                  companySlug={companySlug}
                  project={project}
                  locale={locale}
                />
              ))}
            </div>
          </div>
        ) : (
          <div
            className="
              flex
              min-h-[50vh]
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
              {hasSearch ? "No projects found" : "No projects available"}
            </p>

            {hasSearch && (
              <button
                type="button"
                onClick={clearSearch}
                className="
                  mt-4
                  text-[9px]
                  uppercase
                  tracking-[0.08em]
                  text-[var(--public-primary)]
                  transition-opacity
                  duration-200
                  hover:opacity-60
                "
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
