"use client";

import Link from "next/link";

import { useEffect, useRef, useState } from "react";

function CompanyCircle({ company, active = false, large = false }) {
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

    document.addEventListener("pointerdown", handlePointerDown);

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);

      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (!currentCompany) {
    return null;
  }

  return (
    <div ref={containerRef} className="relative">
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
        "
      >
        <CompanyCircle company={currentCompany} active large={large} />
      </button>

      <div
        className={`
          absolute
          right-0
          top-[calc(100%+14px)]
          z-[150]
          flex
          flex-col
          items-center
          gap-2.5
          transition-all
          duration-200
          ${
            open
              ? "visible translate-y-0 opacity-100"
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
              "
            >
              <CompanyCircle company={company} large={large} />
            </Link>
          ))}
      </div>
    </div>
  );
}
