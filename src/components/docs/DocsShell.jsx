"use client";

import {
  ArrowLeft,
  BookOpen,
  ExternalLink,
  Languages,
  Search,
} from "lucide-react";

import Link from "next/link";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { ADMIN_LOCALE } from "@/constants/admin-ui";

/*
 * =========================================================
 * DOCUMENTATION THEME
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
 * USER NAME
 * =========================================================
 */

function getUserName(user) {
  return user?.displayName || user?.name || user?.email || "Administrator";
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
  const {
    locale,

    setLocale,

    t,
  } = useAdminTranslation();

  const nextLocale =
    locale === ADMIN_LOCALE.TH ? ADMIN_LOCALE.EN : ADMIN_LOCALE.TH;

  const languageLabel = locale === ADMIN_LOCALE.TH ? "English" : "ภาษาไทย";

  return (
    <div
      style={DOCS_THEME}
      className="
        min-h-screen

        bg-[var(--admin-background)]

        text-[var(--admin-foreground)]
      "
    >
      {/* =================================
          HEADER
      ================================= */}

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
            mx-auto
            flex
            h-16
            w-full
            max-w-[1680px]

            items-center
            gap-3

            px-4

            sm:px-6
            xl:px-8
          "
        >
          {/* =============================
              BRAND
          ============================= */}

          <Link
            href="/docs"
            aria-label={t("docs.title")}
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
              <BookOpen size={17} strokeWidth={1.8} />
            </span>

            <span className="min-w-0">
              <span
                className="
                  block
                  truncate

                  text-[13px]
                  font-semibold
                  tracking-[0.03em]

                  text-[var(--admin-foreground)]
                "
              >
                Junsekino CMS
              </span>

              <span
                className="
                  block
                  truncate

                  text-[9px]
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

          {/* =============================
              SEARCH PLACEHOLDER
          ============================= */}

          <div
            className="
              mx-auto
              hidden
              w-full
              max-w-[560px]

              md:block
            "
          >
            <button
              type="button"
              className="
                flex
                h-10
                w-full

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
                {t("docs.search.placeholder")}
              </span>

              <kbd
                className="
                  hidden

                  rounded-md

                  border
                  border-[var(--admin-border)]

                  bg-white

                  px-1.5
                  py-0.5

                  text-[9px]
                  font-medium

                  text-[var(--admin-muted)]

                  lg:inline-flex
                "
              >
                Ctrl K
              </kbd>
            </button>
          </div>

          {/* =============================
              HEADER ACTIONS
          ============================= */}

          <div
            className="
              ml-auto
              flex
              shrink-0
              items-center
              gap-2
            "
          >
            <button
              type="button"
              onClick={() => setLocale(nextLocale)}
              aria-label={t("docs.header.changeLanguage")}
              className="
                inline-flex
                h-10
                items-center
                justify-center
                gap-2

                rounded-xl

                border
                border-[var(--admin-border)]

                bg-white

                px-3

                admin-text-10
                font-semibold

                text-[var(--admin-foreground)]

                transition

                hover:bg-[var(--admin-hover)]
              "
            >
              <Languages size={15} />

              <span className="hidden sm:inline">{languageLabel}</span>
            </button>

            <Link
              href="/admin/dashboard"
              className="
                inline-flex
                h-10
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

              <span className="hidden sm:inline">
                {t("docs.header.backToAdmin")}
              </span>
            </Link>
          </div>
        </div>

        {/* =============================
            MOBILE SEARCH
        ============================= */}

        <div
          className="
            border-t
            border-[var(--admin-border)]

            px-4
            py-2

            md:hidden
          "
        >
          <button
            type="button"
            className="
              flex
              h-10
              w-full

              items-center
              gap-3

              rounded-xl

              border
              border-[var(--admin-border)]

              bg-[var(--admin-background)]

              px-3

              text-left
            "
          >
            <Search size={15} className="text-[var(--admin-muted)]" />

            <span
              className="
                min-w-0
                flex-1
                truncate

                admin-text-10

                text-[var(--admin-muted)]
              "
            >
              {t("docs.search.placeholder")}
            </span>
          </button>
        </div>
      </header>

      {/* =================================
          MAIN
      ================================= */}

      <main
        className="
          mx-auto
          min-h-[calc(100vh-64px)]
          w-full
          max-w-[1680px]

          px-4
          py-6

          sm:px-6
          sm:py-8

          xl:px-8
          xl:py-10
        "
      >
        {children}
      </main>

      {/* =================================
          FOOTER
      ================================= */}

      <footer
        className="
          border-t
          border-[var(--admin-border)]

          bg-white
        "
      >
        <div
          className="
            mx-auto
            flex
            w-full
            max-w-[1680px]

            flex-col
            gap-2

            px-4
            py-5

            sm:flex-row
            sm:items-center
            sm:justify-between
            sm:px-6

            xl:px-8
          "
        >
          <p
            className="
              admin-text-9

              text-[var(--admin-muted)]
            "
          >
            {t("docs.footer.copyright")}
          </p>

          <a
            href="/admin/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="
              inline-flex
              w-fit
              items-center
              gap-1.5

              admin-text-9
              font-semibold

              text-[var(--company-primary)]

              hover:underline
              hover:underline-offset-4
            "
          >
            {getUserName(user)}

            <ExternalLink size={11} />
          </a>
        </div>
      </footer>
    </div>
  );
}
