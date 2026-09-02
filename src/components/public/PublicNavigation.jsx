"use client";

import { ArrowLeft, ChevronRight } from "lucide-react";

import Link from "next/link";

import { usePathname } from "next/navigation";

import { useEffect, useState } from "react";

import { usePublicTheme } from "@/components/public/PublicThemeProvider";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

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

function resolveHref(
  companySlug,

  item,
) {
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

function isMainItemActive({
  pathname,

  href,

  companySlug,

  external = false,
}) {
  if (external) {
    return false;
  }

  if (href === `/${companySlug}`) {
    return pathname === href || pathname === `${href}/`;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function isProjectCategoryActive({
  pathname,

  companySlug,

  categorySlug,
}) {
  return (
    pathname === `/${companySlug}/project/${categorySlug}` ||
    pathname.startsWith(`/${companySlug}/project/${categorySlug}/`)
  );
}

function isPublicCategoryActive({
  pathname,

  companySlug,

  category,
}) {
  return (
    pathname === `/${companySlug}/public/${category}` ||
    pathname.startsWith(`/${companySlug}/public/${category}/`)
  );
}

function resolveNormalColor(resolvedTheme) {
  return resolvedTheme === "dark" ? "#ffffff" : "#000000";
}

function resolveHoverColor({
  primaryColor,

  resolvedTheme,
}) {
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

function getMobileLabels(locale) {
  if (locale === "th") {
    return {
      back: "ย้อนกลับ",

      viewAllProjects: "ดูโปรเจกต์ทั้งหมด",

      viewAllPublic: "ดู Public ทั้งหมด",

      video: "วิดีโอ",

      publication: "สิ่งพิมพ์",
    };
  }

  return {
    back: "Back",

    viewAllProjects: "View all projects",

    viewAllPublic: "View all public",

    video: "Video",

    publication: "Publication",
  };
}

/*
 * =========================================================
 * CONTROLLED LINK
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

  function handlePointerEnter(event) {
    event.currentTarget.style.color = active ? activeColor : hoverColor;
  }

  function handlePointerLeave(event) {
    event.currentTarget.style.color = restingColor;
  }

  function handleFocus(event) {
    event.currentTarget.style.color = active ? activeColor : hoverColor;
  }

  function handleBlur(event) {
    event.currentTarget.style.color = restingColor;
  }

  function handleClick(event) {
    onClick?.(event);

    event.currentTarget.blur();
  }

  const commonProps = {
    onClick: handleClick,

    onMouseEnter: handlePointerEnter,

    onMouseLeave: handlePointerLeave,

    onFocus: handleFocus,

    onBlur: handleBlur,

    className: `
      transition-colors
      duration-150
      ease-out

      ${active ? "font-semibold" : "font-normal"}

      ${className}
    `,

    style: {
      color: restingColor,
    },
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
 * MOBILE SECTION BUTTON
 * =========================================================
 */

function MobileSectionButton({
  label,

  primaryColor,

  resolvedTheme,

  onClick,
}) {
  const normalColor = resolveNormalColor(resolvedTheme);

  const hoverColor = resolveHoverColor({
    primaryColor: primaryColor || "#000000",

    resolvedTheme,
  });

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={(event) => {
        event.currentTarget.style.color = hoverColor;
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.color = normalColor;
      }}
      onFocus={(event) => {
        event.currentTarget.style.color = hoverColor;
      }}
      onBlur={(event) => {
        event.currentTarget.style.color = normalColor;
      }}
      className="
        flex
        w-full
        max-w-[300px]

        items-center
        justify-start
        gap-5

        py-1

        text-left
        text-[16px]
        font-normal
        uppercase
        tracking-[0.055em]

        transition-colors
        duration-150
      "
      style={{
        color: normalColor,
      }}
    >
      <span>{label}</span>

      <ChevronRight
        size={16}
        strokeWidth={1.25}
        aria-hidden="true"
        className="ml-1.5 shrink-0"
      />
    </button>
  );
}

/*
 * =========================================================
 * DESKTOP DROPDOWNS
 * =========================================================
 */

function ProjectCategoryDropdown({
  companySlug,

  categories = [],

  locale = "en",

  primaryColor,

  resolvedTheme,

  visible,

  onNavigate,
}) {
  const pathname = usePathname();

  if (!categories.length) {
    return null;
  }

  return (
    <div
      aria-hidden={!visible}
      className={`
        absolute
        left-0
        top-full
        z-[110]

        transition-all
        duration-150
        ease-out

        ${
          visible
            ? "visible translate-y-0 opacity-100"
            : "invisible translate-y-1 opacity-0"
        }
      `}
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
              onClick={onNavigate}
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

function PublicCategoryDropdown({
  companySlug,

  primaryColor,

  resolvedTheme,

  visible,

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
      aria-hidden={!visible}
      className={`
        absolute
        left-0
        top-full
        z-[110]

        transition-all
        duration-150
        ease-out

        ${
          visible
            ? "visible translate-y-0 opacity-100"
            : "invisible translate-y-1 opacity-0"
        }
      `}
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
              onClick={onNavigate}
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

function DesktopNavigationItem({
  item,

  companySlug,

  locale,

  primaryColor,

  resolvedTheme,

  projectCategories,
}) {
  const pathname = usePathname();

  const [dropdownOpen, setDropdownOpen] = useState(false);

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

  const hasDropdown = (project && projectCategories.length > 0) || publicItem;

  function closeDropdown() {
    setDropdownOpen(false);
  }

  function handleBlur(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      closeDropdown();
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();

      closeDropdown();

      event.currentTarget.querySelector("a")?.focus();
    }
  }

  return (
    <div
      onMouseEnter={() => {
        if (hasDropdown) {
          setDropdownOpen(true);
        }
      }}
      onMouseLeave={closeDropdown}
      onFocusCapture={() => {
        if (hasDropdown) {
          setDropdownOpen(true);
        }
      }}
      onBlurCapture={handleBlur}
      onKeyDown={handleKeyDown}
      className="
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
        onClick={closeDropdown}
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
          visible={dropdownOpen}
          onNavigate={closeDropdown}
        />
      )}

      {publicItem && (
        <PublicCategoryDropdown
          companySlug={companySlug}
          primaryColor={primaryColor}
          resolvedTheme={resolvedTheme}
          visible={dropdownOpen}
          onNavigate={closeDropdown}
        />
      )}
    </div>
  );
}

/*
 * =========================================================
 * MOBILE NAVIGATION
 * =========================================================
 */

function MobileNavigation({
  items,

  companySlug,

  projectCategories,

  locale,

  primaryColor,

  resolvedTheme,

  onNavigate,

  resetKey,
}) {
  const pathname = usePathname();

  const [section, setSection] = useState(null);

  const labels = getMobileLabels(locale);

  /*
   * Reset submenu whenever the parent
   * mobile overlay closes.
   */
  useEffect(() => {
    if (resetKey !== false) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setSection(null);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [resetKey]);

  function handleNavigate(event) {
    setSection(null);

    onNavigate?.(event);
  }

  const projectItem = items.find((item) => isProjectItem(item));

  const publicItem = items.find((item) => isPublicItem(item));

  const activeSectionItem =
    section === "project"
      ? projectItem
      : section === "public"
        ? publicItem
        : null;

  const sectionTitle =
    getLocalizedValue(
      activeSectionItem?.label,

      locale,
    ) ||
    activeSectionItem?.key ||
    "";

  return (
    <nav
      aria-label="Mobile navigation"
      className="
        w-[min(82vw,360px)]
        overflow-hidden
      "
    >
      <div
        className={`
          flex
          w-[200%]

          items-start

          transition-transform
          duration-300
          ease-out

          ${section ? "-translate-x-1/2" : "translate-x-0"}
        `}
      >
        {/* MAIN MENU */}

        <div
          className="
            flex
            w-1/2
            shrink-0
            flex-col
            items-center
            gap-7

            px-3
          "
          aria-hidden={Boolean(section)}
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

            const publicItemValue = isPublicItem(item);

            const hasSubmenu =
              (project && projectCategories.length > 0) || publicItemValue;

            if (hasSubmenu) {
              return (
                <MobileSectionButton
                  key={item?.key || href}
                  label={label}
                  primaryColor={primaryColor}
                  resolvedTheme={resolvedTheme}
                  onClick={() => setSection(project ? "project" : "public")}
                />
              );
            }

            return (
              <NavigationLink
                key={item?.key || href}
                href={href}
                external={external}
                openInNewTab={item?.openInNewTab === true}
                active={active}
                primaryColor={primaryColor}
                resolvedTheme={resolvedTheme}
                onClick={handleNavigate}
                className="
                    flex
                    w-full
                    max-w-[300px]

                    items-center

                    py-1

                    text-left
                    text-[16px]
                    uppercase
                    tracking-[0.055em]
                  "
              >
                {label}
              </NavigationLink>
            );
          })}
        </div>

        {/* SUBMENU */}

        <div
          className="
            w-1/2
            shrink-0

            px-3
          "
          aria-hidden={!section}
        >
          <button
            type="button"
            onClick={() => setSection(null)}
            className="
              inline-flex
              items-center
              gap-2

              py-1

              text-[11px]
              uppercase
              tracking-[0.08em]

              text-[var(--public-muted-foreground)]

              transition-colors

              hover:text-[var(--public-primary)]
              focus-visible:text-[var(--public-primary)]
              focus-visible:outline-none
            "
          >
            <ArrowLeft size={16} strokeWidth={1.25} aria-hidden="true" />

            {labels.back}
          </button>

          <div
            className="
              mt-8

              border-b
              border-[var(--public-border)]

              pb-5

              text-[18px]
              font-medium
              uppercase
              tracking-[0.07em]

              text-[var(--public-primary)]
            "
          >
            {sectionTitle}
          </div>

          <div
            className="
              mt-7

              flex
              flex-col
              items-start
              gap-5
            "
          >
            {section === "project" && (
              <>
                <NavigationLink
                  href={`/${companySlug}/project`}
                  active={pathname === `/${companySlug}/project`}
                  primaryColor={primaryColor}
                  resolvedTheme={resolvedTheme}
                  onClick={handleNavigate}
                  className="
                    text-[14px]
                    uppercase
                    tracking-[0.05em]
                  "
                >
                  {labels.viewAllProjects}
                </NavigationLink>

                {projectCategories.map((category) => (
                  <NavigationLink
                    key={category.id}
                    href={`/${companySlug}/project/${category.slug}`}
                    active={isProjectCategoryActive({
                      pathname,

                      companySlug,

                      categorySlug: category.slug,
                    })}
                    primaryColor={primaryColor}
                    resolvedTheme={resolvedTheme}
                    onClick={handleNavigate}
                    className="
                        text-[14px]
                        uppercase
                        tracking-[0.05em]
                      "
                  >
                    {getLocalizedValue(
                      category.name,

                      locale,
                    )}
                  </NavigationLink>
                ))}
              </>
            )}

            {section === "public" && (
              <>
                <NavigationLink
                  href={`/${companySlug}/public`}
                  active={pathname === `/${companySlug}/public`}
                  primaryColor={primaryColor}
                  resolvedTheme={resolvedTheme}
                  onClick={handleNavigate}
                  className="
                    text-[14px]
                    uppercase
                    tracking-[0.05em]
                  "
                >
                  {labels.viewAllPublic}
                </NavigationLink>

                <NavigationLink
                  href={`/${companySlug}/public/video`}
                  active={isPublicCategoryActive({
                    pathname,

                    companySlug,

                    category: "video",
                  })}
                  primaryColor={primaryColor}
                  resolvedTheme={resolvedTheme}
                  onClick={handleNavigate}
                  className="
                    text-[14px]
                    uppercase
                    tracking-[0.05em]
                  "
                >
                  {labels.video}
                </NavigationLink>

                <NavigationLink
                  href={`/${companySlug}/public/publication`}
                  active={isPublicCategoryActive({
                    pathname,

                    companySlug,

                    category: "publication",
                  })}
                  primaryColor={primaryColor}
                  resolvedTheme={resolvedTheme}
                  onClick={handleNavigate}
                  className="
                    text-[14px]
                    uppercase
                    tracking-[0.05em]
                  "
                >
                  {labels.publication}
                </NavigationLink>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
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

  resetKey,
}) {
  const { resolvedTheme } = usePublicTheme();

  const items = normalizeNavigation(navigation);

  if (mobile) {
    return (
      <MobileNavigation
        items={items}
        companySlug={companySlug}
        projectCategories={projectCategories}
        locale={locale}
        primaryColor={primaryColor}
        resolvedTheme={resolvedTheme}
        onNavigate={onNavigate}
        resetKey={resetKey}
      />
    );
  }

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
