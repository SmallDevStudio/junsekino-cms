"use client";

import Link from "next/link";

import { usePathname } from "next/navigation";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function getLocalizedValue(value, locale = "en") {
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

function normalizeNavigation(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter((item) => item?.enabled !== false && item?.key !== "news")
    .sort((a, b) => (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0));
}

function normalizePath(value) {
  return String(value || "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

function isProjectItem(item) {
  return (
    item?.key === "project" ||
    item?.key === "projects" ||
    normalizePath(item?.path) === "project" ||
    normalizePath(item?.path) === "projects"
  );
}

function isPublicItem(item) {
  return (
    item?.key === "public" ||
    item?.key === "public-content" ||
    item?.key === "publicContent" ||
    normalizePath(item?.path) === "public"
  );
}

function resolveHref(companySlug, item) {
  /*
   * Project always uses:
   *
   * /project
   */
  if (isProjectItem(item)) {
    return `/${companySlug}/project`;
  }

  /*
   * Public always uses:
   *
   * /public
   */
  if (isPublicItem(item)) {
    return `/${companySlug}/public`;
  }

  const path = normalizePath(item?.path);

  return path ? `/${companySlug}/${path}` : `/${companySlug}`;
}

function isMainItemActive({ pathname, href, companySlug }) {
  /*
   * HOME must only be active
   * on the company homepage.
   */
  if (href === `/${companySlug}`) {
    return pathname === href || pathname === `${href}/`;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function isCategoryActive({ pathname, companySlug, categorySlug }) {
  return (
    pathname === `/${companySlug}/project/${categorySlug}` ||
    pathname.startsWith(`/${companySlug}/project/${categorySlug}/`)
  );
}

function isPublicCategoryActive({ pathname, companySlug, category }) {
  return (
    pathname === `/${companySlug}/public/${category}` ||
    pathname.startsWith(`/${companySlug}/public/${category}/`)
  );
}

/*
 * =========================================================
 * DESKTOP PROJECT CATEGORY DROPDOWN
 * =========================================================
 *
 * IMPORTANT UI RULE
 *
 * The FIRST dropdown item starts from
 * the same left edge as the parent menu.
 *
 * Example:
 *
 * PROJECT
 * RESIDENTIAL   COMMERCIAL   ...
 *
 * instead of centering the whole dropdown
 * below PROJECT.
 * =========================================================
 */

function ProjectCategoryDropdown({
  companySlug,
  categories = [],
  locale = "en",
  primaryColor,
}) {
  const pathname = usePathname();

  if (!categories.length) {
    return null;
  }

  return (
    <div
      className="
        invisible

        absolute
        left-0
        top-full
        z-[110]

        translate-y-1

        opacity-0

        transition-all
        duration-150
        ease-out

        group-hover/navitem:visible
        group-hover/navitem:translate-y-0
        group-hover/navitem:opacity-100

        group-focus-within/navitem:visible
        group-focus-within/navitem:translate-y-0
        group-focus-within/navitem:opacity-100
      "
    >
      {/* =====================================
          HOVER BRIDGE
      ===================================== */}

      <div className="h-[12px]" />

      {/* =====================================
          CATEGORY ROW
      ===================================== */}

      <div
        className="
          flex
          items-center
          justify-start

          gap-[clamp(1.7rem,2.15vw,2.8rem)]

          whitespace-nowrap
        "
      >
        {categories.map((category) => {
          const active = isCategoryActive({
            pathname,

            companySlug,

            categorySlug: category.slug,
          });

          return (
            <Link
              key={category.id}
              href={`/${companySlug}/project/${category.slug}`}
              className={`
                  text-[11px]
                  uppercase
                  tracking-[0.02em]

                  transition-all
                  duration-150
                  ease-out

                  hover:opacity-55

                  xl:text-[12px]

                  ${active ? "font-semibold" : "font-normal text-[#242424]"}
                `}
              style={
                active
                  ? {
                      color: primaryColor,
                    }
                  : undefined
              }
            >
              {getLocalizedValue(category.name, locale)}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/*
 * =========================================================
 * DESKTOP PUBLIC CATEGORY DROPDOWN
 * =========================================================
 *
 * Uses the same left-alignment rule:
 *
 * PUBLIC
 * VIDEO   PUBLICATION
 * =========================================================
 */

function PublicCategoryDropdown({ companySlug, primaryColor }) {
  const pathname = usePathname();

  const categories = [
    {
      key: "video",
      label: "Video",
    },

    {
      key: "publication",
      label: "Publication",
    },
  ];

  return (
    <div
      className="
        invisible

        absolute
        left-0
        top-full
        z-[110]

        translate-y-1

        opacity-0

        transition-all
        duration-150
        ease-out

        group-hover/navitem:visible
        group-hover/navitem:translate-y-0
        group-hover/navitem:opacity-100

        group-focus-within/navitem:visible
        group-focus-within/navitem:translate-y-0
        group-focus-within/navitem:opacity-100
      "
    >
      {/* =====================================
          HOVER BRIDGE
      ===================================== */}

      <div className="h-[12px]" />

      {/* =====================================
          PUBLIC CATEGORY ROW
      ===================================== */}

      <div
        className="
          flex
          items-center
          justify-start

          gap-[clamp(1.7rem,2.15vw,2.8rem)]

          whitespace-nowrap
        "
      >
        {categories.map((category) => {
          const active = isPublicCategoryActive({
            pathname,

            companySlug,

            category: category.key,
          });

          return (
            <Link
              key={category.key}
              href={`/${companySlug}/public/${category.key}`}
              className={`
                  text-[11px]
                  uppercase
                  tracking-[0.02em]

                  transition-all
                  duration-150
                  ease-out

                  hover:opacity-55

                  xl:text-[12px]

                  ${active ? "font-semibold" : "font-normal text-[#242424]"}
                `}
              style={
                active
                  ? {
                      color: primaryColor,
                    }
                  : undefined
              }
            >
              {category.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/*
 * =========================================================
 * DESKTOP MAIN ITEM
 * =========================================================
 */

function DesktopNavigationItem({
  item,
  companySlug,
  locale,
  primaryColor,
  projectCategories,
}) {
  const pathname = usePathname();

  const href = resolveHref(companySlug, item);

  const active = isMainItemActive({
    pathname,
    href,
    companySlug,
  });

  const label = getLocalizedValue(item?.label, locale) || item?.key || "";

  const project = isProjectItem(item);

  const publicItem = isPublicItem(item);

  return (
    <div
      className="
        group/navitem
        relative

        flex
        items-center
        justify-start
      "
    >
      {/* =====================================
          MAIN LINK
      ===================================== */}

      <Link
        href={href}
        className={`
          relative

          whitespace-nowrap

          py-3

          text-[13px]
          uppercase
          tracking-[0.025em]

          transition-all
          duration-150
          ease-out

          hover:opacity-55

          xl:text-[14px]

          ${active ? "font-semibold" : "font-normal text-[#181818]"}
        `}
        style={
          active
            ? {
                color: primaryColor,
              }
            : undefined
        }
      >
        {label}
      </Link>

      {/* =====================================
          PROJECT DROPDOWN
      ===================================== */}

      {project && projectCategories.length > 0 && (
        <ProjectCategoryDropdown
          companySlug={companySlug}
          categories={projectCategories}
          locale={locale}
          primaryColor={primaryColor}
        />
      )}

      {/* =====================================
          PUBLIC DROPDOWN
      ===================================== */}

      {publicItem && (
        <PublicCategoryDropdown
          companySlug={companySlug}
          primaryColor={primaryColor}
        />
      )}
    </div>
  );
}

/*
 * =========================================================
 * MOBILE PROJECT CATEGORIES
 * =========================================================
 */

function MobileProjectCategories({
  companySlug,
  categories = [],
  locale = "en",
  primaryColor,
  onNavigate,
}) {
  const pathname = usePathname();

  if (!categories.length) {
    return null;
  }

  return (
    <div
      className="
        mt-4

        flex
        max-w-[340px]
        flex-wrap

        items-center
        justify-center

        gap-x-5
        gap-y-3
      "
    >
      {categories.map((category) => {
        const active = isCategoryActive({
          pathname,

          companySlug,

          categorySlug: category.slug,
        });

        return (
          <Link
            key={category.id}
            href={`/${companySlug}/project/${category.slug}`}
            onClick={onNavigate}
            className={`
                text-[11px]
                uppercase
                tracking-[0.025em]

                transition-all
                duration-150

                hover:opacity-55

                ${active ? "font-semibold" : "font-normal text-black/40"}
              `}
            style={
              active
                ? {
                    color: primaryColor,
                  }
                : undefined
            }
          >
            {getLocalizedValue(category.name, locale)}
          </Link>
        );
      })}
    </div>
  );
}

/*
 * =========================================================
 * MOBILE PUBLIC CATEGORIES
 * =========================================================
 */

function MobilePublicCategories({ companySlug, primaryColor, onNavigate }) {
  const pathname = usePathname();

  const categories = [
    {
      key: "video",
      label: "Video",
    },

    {
      key: "publication",
      label: "Publication",
    },
  ];

  return (
    <div
      className="
        mt-4

        flex
        items-center
        justify-center

        gap-x-5
        gap-y-3
      "
    >
      {categories.map((category) => {
        const active = isPublicCategoryActive({
          pathname,

          companySlug,

          category: category.key,
        });

        return (
          <Link
            key={category.key}
            href={`/${companySlug}/public/${category.key}`}
            onClick={onNavigate}
            className={`
                text-[11px]
                uppercase
                tracking-[0.025em]

                transition-all
                duration-150

                hover:opacity-55

                ${active ? "font-semibold" : "font-normal text-black/40"}
              `}
            style={
              active
                ? {
                    color: primaryColor,
                  }
                : undefined
            }
          >
            {category.label}
          </Link>
        );
      })}
    </div>
  );
}

/*
 * =========================================================
 * PUBLIC NAVIGATION
 * =========================================================
 */

export default function PublicNavigation({
  companySlug,

  navigation = [],

  projectCategories = [],

  locale = "en",

  primaryColor = "#000000",

  mobile = false,

  onNavigate,
}) {
  const pathname = usePathname();

  const items = normalizeNavigation(navigation);

  /*
   * =======================================================
   * MOBILE
   * =======================================================
   */

  if (mobile) {
    return (
      <nav
        aria-label="Mobile navigation"
        className="
          flex
          flex-col

          items-center

          gap-7
        "
      >
        {items.map((item) => {
          const href = resolveHref(companySlug, item);

          const active = isMainItemActive({
            pathname,

            href,

            companySlug,
          });

          const label =
            getLocalizedValue(item?.label, locale) || item?.key || "";

          const project = isProjectItem(item);

          const publicItem = isPublicItem(item);

          return (
            <div
              key={item?.key || href}
              className="
                  flex
                  flex-col

                  items-center
                "
            >
              <Link
                href={href}
                onClick={onNavigate}
                className={`
                    text-[16px]
                    uppercase
                    tracking-[0.055em]

                    transition-opacity
                    duration-200

                    hover:opacity-50

                    ${active ? "font-semibold" : "font-normal text-[#151515]"}
                  `}
                style={
                  active
                    ? {
                        color: primaryColor,
                      }
                    : undefined
                }
              >
                {label}
              </Link>

              {/* PROJECT */}

              {project && (
                <MobileProjectCategories
                  companySlug={companySlug}
                  categories={projectCategories}
                  locale={locale}
                  primaryColor={primaryColor}
                  onNavigate={onNavigate}
                />
              )}

              {/* PUBLIC */}

              {publicItem && (
                <MobilePublicCategories
                  companySlug={companySlug}
                  primaryColor={primaryColor}
                  onNavigate={onNavigate}
                />
              )}
            </div>
          );
        })}
      </nav>
    );
  }

  /*
   * =======================================================
   * DESKTOP
   * =======================================================
   */

  return (
    <nav
      aria-label="Main navigation"
      className="
        hidden

        items-center
        justify-center

        gap-[clamp(1.6rem,2vw,2.6rem)]

        lg:flex
      "
    >
      {items.map((item) => (
        <DesktopNavigationItem
          key={item?.key || item?.path}
          item={item}
          companySlug={companySlug}
          locale={locale}
          primaryColor={primaryColor}
          projectCategories={projectCategories}
        />
      ))}
    </nav>
  );
}
