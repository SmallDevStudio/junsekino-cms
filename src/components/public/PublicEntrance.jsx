"use client";

import Link from "next/link";
import { useState } from "react";

function CompanyLogo({ company }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex items-baseline justify-center whitespace-nowrap">
        <span
          className="
            text-[clamp(1.65rem,2.55vw,2.8rem)]
            font-normal
            leading-none
            tracking-[0.075em]
            text-black
          "
        >
          {company.brandName}
        </span>

        {company.brandSuffix && (
          <span
            className="
              ml-[0.32em]
              text-[clamp(1.65rem,2.55vw,2.8rem)]
              font-normal
              leading-none
              tracking-[-0.025em]
            "
            style={{
              color: company.primaryColor,
            }}
          >
            {company.brandSuffix}
          </span>
        )}
      </div>

      {company.subtitle && (
        <div
          className="
            mt-[0.28rem]
            text-[clamp(0.72rem,0.9vw,0.98rem)]
            font-normal
            leading-none
            tracking-[0.015em]
            text-[#929295]
          "
        >
          {company.subtitle}
        </div>
      )}
    </div>
  );
}

function IntroScreen({ onEnter }) {
  return (
    <div
      className="
        absolute
        inset-0
        flex
        items-center
        justify-center
      "
    >
      <button
        type="button"
        onClick={onEnter}
        aria-label="Enter Junsekino website"
        className="
          group
          flex
          -translate-y-[2.5vh]
          flex-col
          items-center
          border-0
          bg-transparent
          p-0
          text-center
          outline-none
        "
      >
        <div
          className="
            text-[clamp(2.8rem,5.1vw,5.45rem)]
            font-normal
            leading-none
            tracking-[0.11em]
            text-black
            transition-opacity
            duration-300
            ease-out
            group-hover:opacity-70
            group-focus-visible:opacity-70
          "
        >
          JUNSEKINO
        </div>

        <div
          className="
            mt-[clamp(2.45rem,4.6vh,3.8rem)]
            text-[clamp(0.74rem,0.92vw,0.98rem)]
            font-normal
            tracking-[0.01em]
            text-[#929295]
            transition-colors
            duration-300
            ease-out
            group-hover:text-black
            group-focus-visible:text-black
          "
        >
          Enter Site
        </div>
      </button>
    </div>
  );
}

function CompanySelection({ companies }) {
  return (
    <div
      className="
        absolute
        inset-0
        flex
        items-center
        justify-center
        px-6
        py-10
      "
    >
      {companies.length > 0 ? (
        <div
          className="
            flex
            w-full
            flex-col
            items-center
            justify-center
            gap-[clamp(4.25rem,9vh,7.2rem)]
          "
        >
          {companies.map((company) => (
            <Link
              key={company.id}
              href={`/${company.slug}`}
              aria-label={`Enter ${company.name}`}
              className="
                group
                block
                w-fit
                max-w-full
                text-center
                outline-none
              "
            >
              <div
                className="
                  transition-opacity
                  duration-300
                  ease-out
                  group-hover:opacity-65
                  group-focus-visible:opacity-65
                "
              >
                <CompanyLogo company={company} />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div
          className="
            text-xs
            font-normal
            tracking-[0.05em]
            text-[#929295]
          "
        >
          No company available
        </div>
      )}
    </div>
  );
}

export default function PublicEntrance({ companies = [] }) {
  const [entered, setEntered] = useState(false);

  return (
    <main
      className="
        relative
        min-h-svh
        overflow-hidden
        bg-[#f0f0f2]
        text-black
      "
    >
      <div
        className={`
          absolute
          inset-0
          transition-all
          duration-500
          ease-out
          ${entered ? "pointer-events-none opacity-0" : "opacity-100"}
        `}
      >
        <IntroScreen onEnter={() => setEntered(true)} />
      </div>

      <div
        className={`
          absolute
          inset-0
          transition-all
          duration-500
          ease-out
          ${entered ? "opacity-100" : "pointer-events-none opacity-0"}
        `}
      >
        <CompanySelection companies={companies} />
      </div>
    </main>
  );
}
