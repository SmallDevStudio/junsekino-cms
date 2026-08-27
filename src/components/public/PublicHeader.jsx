"use client";

import { Menu, X } from "lucide-react";

import { useEffect, useState } from "react";

import PublicBrandWordmark from "@/components/public/PublicBrandWordmark";

import PublicCompanySwitcher from "@/components/public/PublicCompanySwitcher";

import PublicNavigation from "@/components/public/PublicNavigation";

import PublicSocialLinks from "@/components/public/PublicSocialLinks";

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

          bg-[var(--public-background)]

          lg:h-[104px]
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
          {/* =========================
              LEFT — BRAND
          ========================= */}

          <div
            className="
              relative
              z-20

              flex
              min-w-0
              items-center
            "
          >
            <PublicBrandWordmark
              company={company}
              primaryColor={primaryColor}
              href={`/${companySlug}`}
            />
          </div>

          {/* =========================
              TRUE VIEWPORT CENTER
          ========================= */}

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
            <div className="pointer-events-auto">
              <PublicNavigation
                companySlug={companySlug}
                navigation={navigation}
                projectCategories={projectCategories}
                locale="en"
                primaryColor={primaryColor}
              />
            </div>
          </div>

          {/* =========================
              RIGHT — SOCIAL / COMPANY
          ========================= */}

          <div
            className="
              relative
              z-20

              ml-auto

              hidden
              items-center

              gap-3

              lg:flex
              xl:gap-4
            "
          >
            <PublicSocialLinks social={social} />

            <PublicCompanySwitcher
              companies={companies}
              currentCompanySlug={companySlug}
            />
          </div>

          {/* =========================
              MOBILE MENU BUTTON
          ========================= */}

          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="
              ml-auto

              flex
              h-11
              w-11

              items-center
              justify-center

              text-black

              lg:hidden
            "
          >
            <Menu size={27} strokeWidth={1.25} />
          </button>
        </div>
      </header>

      {/* =============================
          MOBILE FULLSCREEN NAVIGATION
      ============================= */}

      <div
        className={`
          fixed
          inset-0

          z-[120]

          bg-[var(--public-background)]

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
      >
        <div
          className="
            flex
            h-[92px]

            items-center
            justify-between

            px-6
            sm:px-8
          "
        >
          <PublicBrandWordmark
            company={company}
            primaryColor={primaryColor}
            href={`/${companySlug}`}
          />

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

              text-black
            "
          >
            <X size={27} strokeWidth={1.25} />
          </button>
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
