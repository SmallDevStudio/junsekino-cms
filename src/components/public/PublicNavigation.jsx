"use client";

import Link from "next/link";

import { usePathname } from "next/navigation";

import { usePublicTheme } from "@/components/public/PublicThemeProvider";

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

function isSafeExternalUrl(value) {
  if (typeof value !== "string") {
    return false;
  }

  try {
    const url = new URL(value.trim());

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isExternalItem(item) {
  return item?.type === "external" && isSafeExternalUrl(item?.url);
}

function isProjectItem(item) {
  if (isExternalItem(item)) {
    return false;
  }

  return (
    item?.key === "project" ||
    item?.key === "projects" ||
    normalizePath(item?.path) === "project" ||
    normalizePath(item?.path) === "projects"
  );
}

function isPublicItem(item) {
  if (isExternalItem(item)) {
    return false;
  }

  return (
    item?.key === "public" ||
    item?.key === "public-content" ||
    item?.key === "publicContent" ||
    normalizePath(item?.path) === "public"
  );
}

function resolveHref(companySlug, item) {
  if (isExternalItem(item)) {
    return item.url.trim();
  }

  if (isProjectItem(item)) {
    return `/${companySlug}/project`;
  }

  if (isPublicItem(item)) {
    return `/${companySlug}/public`;
  }

  const path = normalizePath(item?.path);

  return path ? `/${companySlug}/${path}` : `/${companySlug}`;
}

function isMainItemActive({ pathname, href, companySlug, external = false }) {
  if (external) {
    return false;
  }

  if (href === `/${companySlug}`) {
    return pathname === href || pathname === `${href}/`;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function isProjectCategoryActive({ pathname, companySlug, categorySlug }) {
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

function resolveNormalColor(resolvedTheme) {
  return resolvedTheme === "dark" ? "#ffffff" : "#000000";
}

function resolveHoverColor({ primaryColor, resolvedTheme }) {
  if (resolvedTheme === "dark") {
    return `color-mix(
      in srgb,
      ${primaryColor} 78%,
      #000000
    )`;
  }

  return `color-mix(
    in srgb,
    ${primaryColor} 68%,
    #ffffff
  )`;
}

/*
 * =========================================================
 * CONTROLLED NAVIGATION LINK
 * =========================================================
 *
 * Internal links use Next Link.
 * External links use a normal anchor element.
 * =========================================================
 */

function NavigationLink({
  href,
  active = false,
  external = false,
  openInNewTab = false,
  primaryColor,
  resolvedTheme,
  onClick,
  className = "",
  children,
}) {
  const normalColor = resolveNormalColor(resolvedTheme);

  const activeColor = primaryColor || "#000000";

  const hoverColor = resolveHoverColor({
    primaryColor: activeColor,

    resolvedTheme,
  });

  const restingColor = active ? activeColor : normalColor;

  const linkClassName = `
    transition-colors
    duration-150
    ease-out

    ${active ? "font-semibold" : "font-normal"}

    ${className}
  `;

  const linkStyle = {
    color: restingColor,
  };

  function handlePointerEnter(event) {
    if (active) {
      event.currentTarget.style.color = activeColor;

      return;
    }

    event.currentTarget.style.color = hoverColor;
  }

  function handlePointerLeave(event) {
    event.currentTarget.style.color = restingColor;
  }

  function handleFocus(event) {
    if (active) {
      event.currentTarget.style.color = activeColor;

      return;
    }

    event.currentTarget.style.color = hoverColor;
  }

  function handleBlur(event) {
    event.currentTarget.style.color = restingColor;
  }

  const commonProps = {
    onClick,

    onMouseEnter: handlePointerEnter,

    onMouseLeave: handlePointerLeave,

    onFocus: handleFocus,

    onBlur: handleBlur,

    className: linkClassName,

    style: linkStyle,
  };

  if (external) {
    return (
      <a
        href={href}
        target={openInNewTab ? "_blank" : undefined}
        rel={openInNewTab ? "noopener noreferrer" : "external"}
        {...commonProps}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} {...commonProps}>
      {children}
    </Link>
  );
}

/*
 * =========================================================
 * DESKTOP PROJECT CATEGORY DROPDOWN
 * =========================================================
 */

function ProjectCategoryDropdown({
  companySlug,
  categories = [],
  locale = "en",
  primaryColor,
  resolvedTheme,
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
      <div className="h-[12px]" />

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
          const active = isProjectCategoryActive({
            pathname,

            companySlug,

            categorySlug: category.slug,
          });

          return (
            <NavigationLink
              key={category.id}
              href={`/${companySlug}/project/${category.slug}`}
              active={active}
              primaryColor={primaryColor}
              resolvedTheme={resolvedTheme}
              className="
                text-[11px]
                uppercase
                tracking-[0.02em]

                xl:text-[12px]
              "
            >
              {getLocalizedValue(
                category.name,

                locale,
              )}
            </NavigationLink>
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
 */

function PublicCategoryDropdown({ companySlug, primaryColor, resolvedTheme }) {
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
      <div className="h-[12px]" />

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
            <NavigationLink
              key={category.key}
              href={`/${companySlug}/public/${category.key}`}
              active={active}
              primaryColor={primaryColor}
              resolvedTheme={resolvedTheme}
              className="
                text-[11px]
                uppercase
                tracking-[0.02em]

                xl:text-[12px]
              "
            >
              {category.label}
            </NavigationLink>
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
  resolvedTheme,
  projectCategories,
}) {
  const pathname = usePathname();

  const external = isExternalItem(item);

  const href = resolveHref(
    companySlug,

    item,
  );

  const active = isMainItemActive({
    pathname,

    href,

    companySlug,

    external,
  });

  const label =
    getLocalizedValue(
      item?.label,

      locale,
    ) ||
    item?.key ||
    "";

  const project = isProjectItem(item);

  const publicItem = isPublicItem(item);

  return (
    <div
      className="
        group/navitem
        relative
        flex
        h-9
        items-end
        justify-start
      "
    >
      <NavigationLink
        href={href}
        external={external}
        openInNewTab={item?.openInNewTab === true}
        active={active}
        primaryColor={primaryColor}
        resolvedTheme={resolvedTheme}
        className="
          relative
          flex
          h-9
          items-end

          whitespace-nowrap

          pb-px

          text-[13px]
          leading-none
          uppercase
          tracking-[0.025em]

          xl:text-[14px]
        "
      >
        {label}
      </NavigationLink>

      {project && projectCategories.length > 0 && (
        <ProjectCategoryDropdown
          companySlug={companySlug}
          categories={projectCategories}
          locale={locale}
          primaryColor={primaryColor}
          resolvedTheme={resolvedTheme}
        />
      )}

      {publicItem && (
        <PublicCategoryDropdown
          companySlug={companySlug}
          primaryColor={primaryColor}
          resolvedTheme={resolvedTheme}
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
  resolvedTheme,
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
        const active = isProjectCategoryActive({
          pathname,

          companySlug,

          categorySlug: category.slug,
        });

        return (
          <NavigationLink
            key={category.id}
            href={`/${companySlug}/project/${category.slug}`}
            active={active}
            primaryColor={primaryColor}
            resolvedTheme={resolvedTheme}
            onClick={onNavigate}
            className="
              text-[11px]
              uppercase
              tracking-[0.025em]
            "
          >
            {getLocalizedValue(
              category.name,

              locale,
            )}
          </NavigationLink>
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

function MobilePublicCategories({
  companySlug,
  primaryColor,
  resolvedTheme,
  onNavigate,
}) {
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
          <NavigationLink
            key={category.key}
            href={`/${companySlug}/public/${category.key}`}
            active={active}
            primaryColor={primaryColor}
            resolvedTheme={resolvedTheme}
            onClick={onNavigate}
            className="
              text-[11px]
              uppercase
              tracking-[0.025em]
            "
          >
            {category.label}
          </NavigationLink>
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

  const { resolvedTheme } = usePublicTheme();

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
          const external = isExternalItem(item);

          const href = resolveHref(
            companySlug,

            item,
          );

          const active = isMainItemActive({
            pathname,

            href,

            companySlug,

            external,
          });

          const label =
            getLocalizedValue(
              item?.label,

              locale,
            ) ||
            item?.key ||
            "";

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
              <NavigationLink
                href={href}
                external={external}
                openInNewTab={item?.openInNewTab === true}
                active={active}
                primaryColor={primaryColor}
                resolvedTheme={resolvedTheme}
                onClick={onNavigate}
                className="
                  text-[16px]
                  uppercase
                  tracking-[0.055em]
                "
              >
                {label}
              </NavigationLink>

              {project && (
                <MobileProjectCategories
                  companySlug={companySlug}
                  categories={projectCategories}
                  locale={locale}
                  primaryColor={primaryColor}
                  resolvedTheme={resolvedTheme}
                  onNavigate={onNavigate}
                />
              )}

              {publicItem && (
                <MobilePublicCategories
                  companySlug={companySlug}
                  primaryColor={primaryColor}
                  resolvedTheme={resolvedTheme}
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
        h-9
        items-end
        justify-center
        gap-[clamp(1.6rem,2vw,2.6rem)]

        lg:flex
      "
    >
      {items.map((item) => (
        <DesktopNavigationItem
          key={item?.key || item?.path || item?.url}
          item={item}
          companySlug={companySlug}
          locale={locale}
          primaryColor={primaryColor}
          resolvedTheme={resolvedTheme}
          projectCategories={projectCategories}
        />
      ))}
    </nav>
  );
}
