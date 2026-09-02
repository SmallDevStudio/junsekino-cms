"use client";

import Link from "next/link";

import { useEffect, useRef, useState } from "react";

function CompanyCircle({
  company,

  active = false,

  large = false,
}) {
  return (
    <span
      className={`
        flex
        shrink-0

        items-center
        justify-center

        rounded-full

        font-semibold
        leading-none

        text-white

        transition-transform
        duration-200

        ${
          large
            ? "h-[50px] w-[50px] text-[13px]"
            : "h-[40px] w-[40px] text-[11px] xl:h-[44px] xl:w-[44px] xl:text-[12px]"
        }

        ${active ? "scale-100" : ""}
      `}
      style={{
        backgroundColor: company?.primaryColor || "#111111",
      }}
    >
      {company?.brandSuffix || "JS"}
    </span>
  );
}

export default function PublicCompanySwitcher({
  companies = [],

  currentCompanySlug,

  large = false,

  dropUp = false,
}) {
  const [open, setOpen] = useState(false);

  const containerRef = useRef(null);

  const currentCompany =
    companies.find((company) => company.slug === currentCompanySlug) ||
    companies[0];

  useEffect(() => {
    function handlePointerDown(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener(
      "pointerdown",

      handlePointerDown,
    );

    document.addEventListener(
      "keydown",

      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        "pointerdown",

        handlePointerDown,
      );

      document.removeEventListener(
        "keydown",

        handleKeyDown,
      );
    };
  }, []);

  if (!currentCompany) {
    return null;
  }

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        aria-label="Select company"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="
          block

          rounded-full

          outline-none

          transition-all
          duration-200

          hover:scale-105
          hover:opacity-85

          focus-visible:ring-2
          focus-visible:ring-[var(--public-primary)]
          focus-visible:ring-offset-2
          focus-visible:ring-offset-[var(--public-background)]
        "
      >
        <CompanyCircle company={currentCompany} active large={large} />
      </button>

      <div
        className={`
          absolute
          right-0
          z-[150]

          flex
          flex-col
          items-center
          gap-2

          transition-all
          duration-200

          ${dropUp ? "bottom-[calc(100%+10px)]" : "top-[calc(100%+10px)]"}

          ${
            open
              ? "visible translate-y-0 opacity-100"
              : dropUp
                ? "invisible translate-y-1 opacity-0"
                : "invisible -translate-y-1 opacity-0"
          }
        `}
      >
        {companies
          .filter((company) => company.slug !== currentCompanySlug)
          .map((company) => (
            <Link
              key={company.id}
              href={`/${company.slug}`}
              onClick={() => setOpen(false)}
              aria-label={`Switch to ${company.name}`}
              className="
                  block

                  rounded-full

                  transition-transform
                  duration-200

                  hover:scale-110

                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-[var(--public-primary)]
                "
            >
              <CompanyCircle company={company} large={large} />
            </Link>
          ))}
      </div>
    </div>
  );
}
