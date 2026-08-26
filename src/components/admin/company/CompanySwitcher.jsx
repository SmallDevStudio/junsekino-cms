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

function getCompanyInitial(company) {
  return getCompanyName(company).trim().charAt(0).toUpperCase();
}

export default function CompanySwitcher() {
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

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-10 items-center gap-2 px-2 text-xs text-[var(--admin-muted)]">
        <LoaderCircle size={15} className="animate-spin" />

        <span className="hidden sm:inline">Loading workspace</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-xs text-red-600">Company unavailable</div>;
  }

  if (!activeCompany) {
    return <div className="text-xs text-[var(--admin-muted)]">No company</div>;
  }

  const activeName = getCompanyName(activeCompany);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className={cn(
          "flex min-w-0 items-center gap-3",
          "rounded-xl px-2 py-1.5",
          "text-left transition",
          "hover:bg-[var(--admin-hover)]",
        )}
      >
        <span
          className={cn(
            "flex h-8 w-8 shrink-0",
            "items-center justify-center",
            "rounded-lg",
            "bg-[var(--company-primary)]",
            "text-[11px] font-semibold",
            "text-[var(--company-primary-foreground)]",
          )}
        >
          {getCompanyInitial(activeCompany)}
        </span>

        <span className="min-w-0">
          <span className="block max-w-[160px] truncate text-[13px] font-medium text-[var(--admin-foreground)] sm:max-w-[220px]">
            {activeName}
          </span>

          <span className="hidden text-[10px] uppercase tracking-[0.12em] text-[var(--admin-muted)] sm:block">
            Workspace
          </span>
        </span>

        <ChevronDown
          size={15}
          className={cn(
            "shrink-0 text-[var(--admin-muted)]",
            "transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          className={cn(
            "absolute left-0 top-[calc(100%+8px)]",
            "z-50 w-[280px]",
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
                    className={cn(
                      "flex h-9 w-9 shrink-0",
                      "items-center justify-center",
                      "rounded-lg border",
                      "border-[var(--admin-border)]",
                      "bg-[var(--admin-surface)]",
                      "text-xs font-semibold",
                      "text-[var(--admin-foreground)]",
                    )}
                  >
                    {getCompanyInitial(company)}
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
