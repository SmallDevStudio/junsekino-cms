"use client";

import { Check, ChevronDown, LoaderCircle } from "lucide-react";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/utils/cn";

import { useCompanyWorkspace } from "./CompanyWorkspaceProvider";

function getCompanyName(company) {
  return (
    company?.name ||
    company?.displayName ||
    company?.title ||
    company?.slug ||
    "Untitled company"
  );
}

function getCompanyCode(company) {
  const values = [
    company?.shortName,
    company?.code,
    company?.name,
    company?.displayName,
  ]
    .filter(Boolean)
    .map((value) => String(value).trim().toUpperCase());

  for (const value of values) {
    const match = value.match(/\b([AI]\+D)\b/);

    if (match?.[1]) {
      return match[1];
    }

    if (value.includes("I+D")) {
      return "I+D";
    }

    if (value.includes("A+D")) {
      return "A+D";
    }
  }

  const name = getCompanyName(company);

  return name.trim().charAt(0).toUpperCase();
}

function getCompanyPrimary(company) {
  return (
    company?.colors?.primary ||
    company?.branding?.colors?.primary ||
    company?.primaryColor ||
    "#18181b"
  );
}

function CompanyBadge({ company, compact = false }) {
  const code = getCompanyCode(company);

  const primary = getCompanyPrimary(company);

  return (
    <span
      className={cn(
        "flex shrink-0",
        "items-center justify-center",
        "rounded-xl",
        "font-semibold",
        compact ? "h-9 w-9 text-[9px]" : "h-10 w-10 text-[10px]",
      )}
      style={{
        backgroundColor: primary,

        color: "#ffffff",
      }}
    >
      {code}
    </span>
  );
}

export default function CompanySwitcher({
  compact = false,
  placement = "bottom",
}) {
  const { companies, activeCompany, loading, error, selectCompany } =
    useCompanyWorkspace();

  const [open, setOpen] = useState(false);

  const containerRef = useRef(null);

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

  if (loading) {
    return (
      <div
        className={cn(
          "flex h-11 items-center",
          "text-xs text-[var(--admin-muted)]",
          compact ? "justify-center" : "gap-2 px-2",
        )}
      >
        <LoaderCircle size={15} className="animate-spin" />

        {!compact && <span>Loading workspace</span>}
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("text-xs text-red-600", compact && "text-center")}>
        {compact ? "!" : "Company unavailable"}
      </div>
    );
  }

  if (!activeCompany) {
    return (
      <div className="text-xs text-[var(--admin-muted)]">
        {compact ? "—" : "No company"}
      </div>
    );
  }

  const activeName = getCompanyName(activeCompany);

  const popoverPosition =
    placement === "top" ? "bottom-[calc(100%+8px)]" : "top-[calc(100%+8px)]";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={`Current company: ${activeName}`}
        title={compact ? activeName : undefined}
        className={cn(
          "flex w-full min-w-0 items-center",
          "rounded-xl",
          "text-left transition",
          "hover:bg-[var(--admin-hover)]",

          compact ? "justify-center p-1.5" : "gap-3 p-2",
        )}
      >
        <CompanyBadge company={activeCompany} compact={compact} />

        {!compact && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-[var(--admin-foreground)]">
                {activeName}
              </span>

              <span className="mt-0.5 block text-[9px] uppercase tracking-[0.13em] text-[var(--admin-muted)]">
                Current workspace
              </span>
            </span>

            <ChevronDown
              size={14}
              className={cn(
                "shrink-0 text-[var(--admin-muted)]",
                "transition-transform",
                open && "rotate-180",
              )}
            />
          </>
        )}
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-[80]",
            popoverPosition,

            compact ? "left-[calc(100%+10px)] w-[280px]" : "left-0 w-[280px]",

            "overflow-hidden rounded-2xl",

            "border border-[var(--admin-border)]",

            "bg-[var(--admin-surface)]",

            "shadow-[0_18px_50px_rgba(0,0,0,0.12)]",
          )}
        >
          <div className="border-b border-[var(--admin-border)] px-4 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--admin-muted-light)]">
              Workspace
            </div>

            <div className="mt-1 text-xs text-[var(--admin-muted)]">
              Select company to manage
            </div>
          </div>

          <div className="max-h-[360px] overflow-y-auto p-2">
            {companies.map((company) => {
              const selected = company.id === activeCompany.id;

              const companyPrimary = getCompanyPrimary(company);

              return (
                <button
                  key={company.id}
                  type="button"
                  onClick={() => {
                    selectCompany(company.id);

                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3",

                    "rounded-xl p-2.5",

                    "text-left transition",

                    selected
                      ? "bg-[var(--company-primary-soft)]"
                      : "hover:bg-[var(--admin-hover)]",
                  )}
                >
                  <span
                    className="
                        flex
                        h-9
                        w-9
                        shrink-0

                        items-center
                        justify-center

                        rounded-lg

                        text-[9px]
                        font-semibold
                        text-white
                      "
                    style={{
                      backgroundColor: companyPrimary,
                    }}
                  >
                    {getCompanyCode(company)}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-[var(--admin-foreground)]">
                      {getCompanyName(company)}
                    </span>

                    {company.slug && (
                      <span className="mt-0.5 block truncate text-[11px] text-[var(--admin-muted)]">
                        {company.slug}
                      </span>
                    )}
                  </span>

                  {selected && (
                    <Check
                      size={16}
                      className="shrink-0 text-[var(--company-primary)]"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
