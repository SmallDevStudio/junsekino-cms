"use client";

import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ExternalLink,
  Menu,
  Search,
  X,
} from "lucide-react";

import Link from "next/link";

import { usePathname, useRouter } from "next/navigation";

import { useMemo, useState } from "react";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { ADMIN_LOCALE } from "@/constants/admin-ui";

import {
  getDocsCategories,
  getDocsSearchItems,
} from "@/constants/docs-navigation";

import { cn } from "@/utils/cn";

import AdminDisplaySettings from "@/components/admin/layout/AdminDisplaySettings";

/*
 * =========================================================
 * THEME
 * =========================================================
 */

const DOCS_THEME = {
  "--admin-background": "#f7f8fa",
  "--admin-surface": "#ffffff",
  "--admin-foreground": "#18181b",
  "--admin-muted": "#71717a",
  "--admin-muted-light": "#a1a1aa",
  "--admin-border": "#e4e4e7",
  "--admin-hover": "#f4f4f5",
  "--company-primary": "#990000",
  "--company-primary-hover": "#7f0000",
  "--company-primary-soft": "rgba(153, 0, 0, 0.08)",
  "--company-primary-foreground": "#ffffff",
};

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function getUserName(user) {
  return user?.displayName || user?.name || user?.email || "Administrator";
}

function normalizeSearch(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function matchesCurrentPath(pathname, href) {
  if (href === "/docs") {
    return pathname === "/docs";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

/*
 * =========================================================
 * SEARCH
 * =========================================================
 */

function DocsSearch({
  locale,

  open,

  onClose,
}) {
  const router = useRouter();

  const [query, setQuery] = useState("");

  const items = useMemo(
    () => getDocsSearchItems(locale),

    [locale],
  );

  const results = useMemo(() => {
    const keyword = normalizeSearch(query);

    if (!keyword) {
      return items.slice(0, 8);
    }

    return items
      .filter((item) => {
        const searchable = [
          item.title,
          item.description,
          item.categoryTitle,
          ...(item.keywords || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(keyword);
      })
      .slice(0, 12);
  }, [items, query]);

  function selectResult(item) {
    router.push(item.href);

    setQuery("");

    onClose();
  }

  if (!open) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={
        locale === ADMIN_LOCALE.TH ? "ค้นหาคู่มือ" : "Search documentation"
      }
      className="
        fixed
        inset-0
        z-[100]

        flex
        items-start
        justify-center

        bg-black/45

        px-4
        pt-[8vh]

        backdrop-blur-sm
      "
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="
          flex
          max-h-[78vh]
          w-full
          max-w-[680px]
          flex-col
          overflow-hidden

          rounded-2xl

          border
          border-[var(--admin-border)]

          bg-[var(--admin-surface)]

          shadow-2xl
        "
      >
        <div
          className="
            flex
            items-center
            gap-3

            border-b
            border-[var(--admin-border)]

            px-4
          "
        >
          <Search size={18} className="shrink-0 text-[var(--admin-muted)]" />

          <input
            autoFocus
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={
              locale === ADMIN_LOCALE.TH
                ? "ค้นหา เช่น สร้างโปรเจ็ค, อัปโหลดรูป, SEO..."
                : "Search projects, media, SEO, settings..."
            }
            className="
              h-14
              min-w-0
              flex-1

              bg-transparent

              admin-text-13
              text-[var(--admin-foreground)]

              outline-none

              placeholder:text-[var(--admin-muted-light)]
            "
          />

          <button
            type="button"
            onClick={onClose}
            aria-label={
              locale === ADMIN_LOCALE.TH ? "ปิดการค้นหา" : "Close search"
            }
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center

              rounded-xl

              text-[var(--admin-muted)]

              transition

              hover:bg-[var(--admin-hover)]
              hover:text-[var(--admin-foreground)]
            "
          >
            <X size={17} />
          </button>
        </div>

        <div className="overflow-y-auto p-2">
          {!results.length ? (
            <div
              className="
                px-5
                py-12
                text-center

                admin-text-12
                text-[var(--admin-muted)]
              "
            >
              {locale === ADMIN_LOCALE.TH
                ? "ไม่พบคู่มือที่ตรงกับคำค้นหา"
                : "No documentation matched your search."}
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((item) => (
                <button
                  key={`${item.categoryId}-${item.id}`}
                  type="button"
                  onClick={() => selectResult(item)}
                  className="
                    group
                    flex
                    w-full
                    items-start
                    gap-3

                    rounded-xl

                    px-3
                    py-3

                    text-left

                    transition

                    hover:bg-[var(--admin-hover)]
                  "
                >
                  <span
                    className="
                      mt-0.5
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center

                      rounded-xl

                      bg-[var(--company-primary-soft)]

                      text-[var(--company-primary)]
                    "
                  >
                    <BookOpen size={15} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span
                      className="
                        block

                        admin-text-12
                        font-semibold

                        text-[var(--admin-foreground)]
                      "
                    >
                      {item.title}
                    </span>

                    <span
                      className="
                        mt-0.5
                        block

                        admin-text-9
                        font-semibold
                        uppercase
                        tracking-[0.1em]

                        text-[var(--company-primary)]
                      "
                    >
                      {item.categoryTitle}
                    </span>

                    {item.description && (
                      <span
                        className="
                          mt-1
                          block

                          admin-text-10
                          leading-[1.6]

                          text-[var(--admin-muted)]
                        "
                      >
                        {item.description}
                      </span>
                    )}
                  </span>

                  <ExternalLink
                    size={13}
                    className="
                      mt-1
                      shrink-0

                      text-[var(--admin-muted-light)]

                      transition

                      group-hover:text-[var(--company-primary)]
                    "
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div
          className="
            border-t
            border-[var(--admin-border)]

            bg-[var(--admin-background)]

            px-4
            py-3

            admin-text-9
            text-[var(--admin-muted)]
          "
        >
          {locale === ADMIN_LOCALE.TH
            ? `พบ ${results.length} รายการ`
            : `${results.length} results`}
        </div>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * SIDEBAR
 * =========================================================
 */

function DocsSidebar({
  locale,

  pathname,

  onNavigate,
}) {
  const categories = useMemo(
    () => getDocsCategories(locale),

    [locale],
  );

  const activeCategoryId =
    categories.find((category) =>
      category.items.some((item) => matchesCurrentPath(pathname, item.href)),
    )?.id || "getting-started";

  const [expandedCategories, setExpandedCategories] = useState(
    () => new Set(["getting-started"]),
  );

  function toggleCategory(categoryId) {
    setExpandedCategories((current) => {
      const next = new Set(current);

      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }

      return next;
    });
  }

  return (
    <nav
      aria-label={
        locale === ADMIN_LOCALE.TH ? "สารบัญคู่มือ" : "Documentation navigation"
      }
      className="py-4"
    >
      <div
        className="
          mb-3
          px-4

          admin-text-9
          font-semibold
          uppercase
          tracking-[0.16em]

          text-[var(--admin-muted)]
        "
      >
        {locale === ADMIN_LOCALE.TH ? "สารบัญ" : "Contents"}
      </div>

      <div className="space-y-1 px-2">
        {categories.map((category) => {
          const expanded =
            expandedCategories.has(category.id) ||
            activeCategoryId === category.id;

          const categoryActive = activeCategoryId === category.id;

          return (
            <div key={category.id}>
              <button
                type="button"
                onClick={() => toggleCategory(category.id)}
                aria-expanded={expanded}
                className={cn(
                  "flex w-full items-center gap-2",
                  "rounded-xl px-3 py-2.5",
                  "text-left transition",

                  categoryActive
                    ? "bg-[var(--company-primary-soft)]"
                    : "hover:bg-[var(--admin-hover)]",
                )}
              >
                <span
                  className={cn(
                    "min-w-0 flex-1",
                    "admin-text-11 font-semibold",

                    categoryActive
                      ? "text-[var(--company-primary)]"
                      : "text-[var(--admin-foreground)]",
                  )}
                >
                  {category.title}
                </span>

                <ChevronDown
                  size={14}
                  className={cn(
                    "shrink-0 transition-transform",

                    categoryActive
                      ? "text-[var(--company-primary)]"
                      : "text-[var(--admin-muted)]",

                    expanded && "rotate-180",
                  )}
                />
              </button>

              {expanded && (
                <div
                  className="
                    relative
                    ml-4
                    mt-1
                    space-y-0.5

                    border-l
                    border-[var(--admin-border)]

                    pl-3
                  "
                >
                  {category.items.map((item) => {
                    const active = matchesCurrentPath(
                      pathname,

                      item.href,
                    );

                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "relative block",
                          "rounded-lg",
                          "px-3 py-2",
                          "admin-text-10 leading-[1.5]",
                          "transition",

                          active
                            ? "bg-[var(--company-primary-soft)] font-semibold text-[var(--company-primary)]"
                            : "text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-foreground)]",
                        )}
                      >
                        {active && (
                          <span
                            aria-hidden="true"
                            className="
                              absolute
                              -left-[13px]
                              top-1/2
                              h-5
                              w-[2px]
                              -translate-y-1/2

                              rounded-full

                              bg-[var(--company-primary)]
                            "
                          />
                        )}

                        {item.title}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}

/*
 * =========================================================
 * HEADER
 * =========================================================
 */

function DocsHeader({
  locale,

  onOpenMenu,

  onOpenSearch,
}) {
  const languageLabel = locale === ADMIN_LOCALE.TH ? "English" : "ภาษาไทย";

  return (
    <header
      className="
        sticky
        top-0
        z-50

        border-b
        border-[var(--admin-border)]

        bg-white/95

        backdrop-blur
      "
    >
      <div
        className="
          flex
          h-16
          items-center
          gap-3

          px-4

          sm:px-6
        "
      >
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label={
            locale === ADMIN_LOCALE.TH ? "เปิดสารบัญ" : "Open navigation"
          }
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center

            rounded-xl

            border
            border-[var(--admin-border)]

            text-[var(--admin-foreground)]

            lg:hidden
          "
        >
          <Menu size={17} />
        </button>

        <Link
          href="/docs"
          className="
            flex
            min-w-0
            items-center
            gap-3
          "
        >
          <span
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center

              rounded-xl

              bg-[var(--company-primary)]

              !text-white
            "
          >
            <BookOpen size={17} />
          </span>

          <span className="hidden min-w-0 sm:block">
            <span
              className="
                block
                truncate

                admin-text-13
                font-semibold
                tracking-[0.03em]
              "
            >
              Junsekino CMS
            </span>

            <span
              className="
                block

                admin-text-9
                font-semibold
                uppercase
                tracking-[0.16em]

                text-[var(--company-primary)]
              "
            >
              Documentation
            </span>
          </span>
        </Link>

        <button
          type="button"
          onClick={onOpenSearch}
          className="
            mx-auto
            flex
            h-10
            min-w-0
            max-w-[560px]
            flex-1
            items-center
            gap-3

            rounded-xl

            border
            border-[var(--admin-border)]

            bg-[var(--admin-background)]

            px-3

            text-left

            transition

            hover:border-[var(--company-primary)]
            hover:bg-white
          "
        >
          <Search
            size={15}
            className="
              shrink-0
              text-[var(--admin-muted)]
            "
          />

          <span
            className="
              min-w-0
              flex-1
              truncate

              admin-text-10

              text-[var(--admin-muted)]
            "
          >
            {locale === ADMIN_LOCALE.TH
              ? "ค้นหาคู่มือ..."
              : "Search documentation..."}
          </span>
        </button>

        <AdminDisplaySettings />

        <Link
          href="/admin/dashboard"
          className="
            inline-flex
            h-10
            shrink-0
            items-center
            justify-center
            gap-2

            rounded-xl

            bg-[var(--company-primary)]

            px-3

            admin-text-10
            font-semibold

            !text-white

            transition

            hover:bg-[var(--company-primary-hover)]

            sm:px-4
          "
        >
          <ArrowLeft size={15} />

          <span className="hidden md:inline">
            {locale === ADMIN_LOCALE.TH ? "กลับ Admin" : "Back to Admin"}
          </span>
        </Link>
      </div>
    </header>
  );
}

/*
 * =========================================================
 * SHELL
 * =========================================================
 */

export default function DocsShell({
  user,

  children,
}) {
  const pathname = usePathname();

  const { locale } = useAdminTranslation();

  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div
      style={DOCS_THEME}
      className="
        min-h-screen

        bg-[var(--admin-background)]

        text-[var(--admin-foreground)]
      "
    >
      <DocsHeader
        locale={locale}
        onOpenMenu={() => setMobileNavigationOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
      />

      <div className="flex w-full">
        <aside
          className="
            sticky
            top-16
            hidden
            h-[calc(100vh-64px)]
            w-[280px]
            shrink-0
            overflow-y-auto

            border-r
            border-[var(--admin-border)]

            bg-[var(--admin-surface)]

            lg:block
          "
        >
          <DocsSidebar locale={locale} pathname={pathname} />
        </aside>

        <main
          className="
      min-h-[calc(100vh-64px)]
      min-w-0
      flex-1

      px-4
      py-6

      sm:px-6
      sm:py-8

      xl:px-10
      xl:py-10
    "
        >
          {children}
        </main>
      </div>

      {mobileNavigationOpen && (
        <div
          className="
            fixed
            inset-0
            z-[90]

            bg-black/40

            backdrop-blur-sm

            lg:hidden
          "
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setMobileNavigationOpen(false);
            }
          }}
        >
          <aside
            className="
              flex
              h-full
              w-[min(88vw,340px)]
              flex-col

              bg-[var(--admin-surface)]

              shadow-2xl
            "
          >
            <div
              className="
                flex
                h-16
                items-center
                justify-between

                border-b
                border-[var(--admin-border)]

                px-4
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-2

                  admin-text-12
                  font-semibold
                "
              >
                <BookOpen size={16} className="text-[var(--company-primary)]" />

                {locale === ADMIN_LOCALE.TH
                  ? "คู่มือการใช้งาน"
                  : "Documentation"}
              </div>

              <button
                type="button"
                onClick={() => setMobileNavigationOpen(false)}
                aria-label={
                  locale === ADMIN_LOCALE.TH ? "ปิดสารบัญ" : "Close navigation"
                }
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center

                  rounded-xl

                  text-[var(--admin-muted)]

                  hover:bg-[var(--admin-hover)]
                "
              >
                <X size={17} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <DocsSidebar
                locale={locale}
                pathname={pathname}
                onNavigate={() => setMobileNavigationOpen(false)}
              />
            </div>

            <div
              className="
                border-t
                border-[var(--admin-border)]

                p-4
              "
            >
              <p
                className="
                  truncate

                  admin-text-9

                  text-[var(--admin-muted)]
                "
              >
                {getUserName(user)}
              </p>
            </div>
          </aside>
        </div>
      )}

      <DocsSearch
        locale={locale}
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  );
}
