"use client";

import { Menu, X } from "lucide-react";

import { useEffect, useState } from "react";

import PublicBrandWordmark from "@/components/public/PublicBrandWordmark";

import PublicCompanySwitcher from "@/components/public/PublicCompanySwitcher";

import PublicNavigation from "@/components/public/PublicNavigation";

import PublicSocialLinks from "@/components/public/PublicSocialLinks";

import PublicThemeToggle from "@/components/public/PublicThemeToggle";

import { usePublicTheme } from "@/components/public/PublicThemeProvider";

export default function PublicHeader({
  company,

  companySlug,

  companies = [],

  navigation = [],

  projectCategories = [],

  social = {},

  primaryColor = "#000000",
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const { resolvedTheme } = usePublicTheme();

  useEffect(() => {
    if (!mobileOpen) {
      document.body.style.overflow = "";

      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <header
        className="
          relative
          z-[90]
          h-[92px]
          w-full
          shrink-0
          border-b
          border-transparent
          bg-[var(--public-background)]
          text-[var(--public-foreground)]
          lg:h-[104px]
          mb-5
        "
      >
        <div
          className="
            relative
            flex
            h-full
            w-full
            items-center
            px-6
            sm:px-8
            lg:px-10
            xl:px-12
            2xl:px-14
          "
        >
          {/* =================================================
              LEFT — COMPANY LOGO
          ================================================= */}

          <div
            className="
              relative
              z-20
              flex
              h-9
              min-w-0
              items-end
            "
          >
            <PublicBrandWordmark
              company={company}
              primaryColor={primaryColor}
              href={`/${companySlug}`}
              themeVariant={resolvedTheme}
            />
          </div>

          {/* =================================================
              CENTER — DESKTOP NAVIGATION
          ================================================= */}

          <div
            className="
              pointer-events-none
              absolute
              left-1/2
              top-1/2
              z-10
              hidden
              -translate-x-1/2
              -translate-y-1/2
              lg:block
            "
          >
            <div
              className="
                pointer-events-auto
                flex
                h-9
                items-end
              "
            >
              <PublicNavigation
                companySlug={companySlug}
                navigation={navigation}
                projectCategories={projectCategories}
                locale="en"
                primaryColor={primaryColor}
              />
            </div>
          </div>

          {/* =================================================
              RIGHT — SOCIAL / THEME / COMPANY
          ================================================= */}

          <div
            className="
              relative
              z-20

              ml-auto

              hidden
              items-center

              gap-2

              lg:flex
            "
          >
            <PublicSocialLinks social={social} />

            <PublicThemeToggle />

            <PublicCompanySwitcher
              companies={companies}
              currentCompanySlug={companySlug}
            />
          </div>

          {/* =================================================
              MOBILE ACTIONS
          ================================================= */}

          <div
            className="
              relative
              z-20
              ml-auto
              flex
              h-11
              items-end
              gap-2
              lg:hidden
            "
          >
            <PublicThemeToggle />

            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-full
                text-[var(--public-foreground)]
                transition
                hover:bg-[var(--public-surface)]
                hover:text-[var(--public-primary)]
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-[var(--public-primary)]
              "
            >
              <Menu size={27} strokeWidth={1.25} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================
          MOBILE FULLSCREEN NAVIGATION
      ===================================================== */}

      <div
        className={`
          fixed
          inset-0
          z-[120]
          bg-[var(--public-background)]
          text-[var(--public-foreground)]
          transition-all
          duration-300
          ease-out
          lg:hidden

          ${
            mobileOpen
              ? "visible opacity-100"
              : "invisible pointer-events-none opacity-0"
          }
        `}
        aria-hidden={!mobileOpen}
      >
        <div
          className="
            flex
            h-[92px]
            items-center
            justify-between
            border-b
            border-[var(--public-border)]
            px-6
            sm:px-8
          "
        >
          <div className="flex h-9 items-end">
            <PublicBrandWordmark
              company={company}
              primaryColor={primaryColor}
              href={`/${companySlug}`}
              themeVariant={resolvedTheme}
            />
          </div>

          <div
            className="
              flex
              h-11
              items-end
              gap-2
            "
          >
            <PublicThemeToggle />

            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-full
                text-[var(--public-foreground)]
                transition
                hover:bg-[var(--public-surface)]
                hover:text-[var(--public-primary)]
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-[var(--public-primary)]
              "
            >
              <X size={27} strokeWidth={1.25} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div
          className="
            flex
            h-[calc(100svh-92px)]
            flex-col
            items-center
            justify-center
            overflow-y-auto
            px-6
            py-10
          "
        >
          <PublicNavigation
            companySlug={companySlug}
            navigation={navigation}
            projectCategories={projectCategories}
            locale="en"
            primaryColor={primaryColor}
            mobile
            onNavigate={() => setMobileOpen(false)}
          />

          <div
            className="
              mt-12
              flex
              flex-col
              items-center
              gap-8
            "
          >
            <PublicSocialLinks social={social} size="large" />

            <PublicCompanySwitcher
              companies={companies}
              currentCompanySlug={companySlug}
              large
            />
          </div>
        </div>
      </div>
    </>
  );
}
