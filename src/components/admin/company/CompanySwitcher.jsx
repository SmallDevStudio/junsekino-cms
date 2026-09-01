"use client";

import { useEffect, useRef, useState } from "react";

import {
  Building2,
  Check,
  ChevronDown,
  LoaderCircle,
  Plus,
} from "lucide-react";

import CompanyCreateDialog from "./CompanyCreateDialog";

import { useCompanyWorkspace } from "./CompanyWorkspaceProvider";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { cn } from "@/utils/cn";

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

  return getCompanyName(company).trim().charAt(0).toUpperCase();
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
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl font-semibold",

        compact ? "h-9 w-9 text-[9px]" : "h-10 w-10 text-[10px]",
      )}
      style={{
        backgroundColor: getCompanyPrimary(company),

        color: "var(--company-primary-foreground, #ffffff)",
      }}
    >
      {getCompanyCode(company)}
    </span>
  );
}

function CurrentCompany({ company, compact }) {
  const name = getCompanyName(company);

  return (
    <div
      className={cn(
        "flex w-full min-w-0 items-center rounded-xl",

        compact ? "justify-center p-1.5" : "gap-3 p-2",
      )}
      title={compact ? name : undefined}
    >
      <CompanyBadge company={company} compact={compact} />

      {!compact ? (
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-[var(--admin-foreground)]">
            {name}
          </span>

          <span className="mt-0.5 block text-[9px] uppercase tracking-[0.13em] text-[var(--admin-muted)]">
            Current workspace
          </span>
        </span>
      ) : null}
    </div>
  );
}

function CreateCompanyButton({ compact, onClick, t }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={compact ? t("companySwitcher.create") : undefined}
      className={cn(
        "flex items-center rounded-xl text-[var(--company-primary)] transition",
        "hover:bg-[var(--company-primary-soft)]",

        compact
          ? "h-10 w-10 justify-center"
          : "w-full gap-3 px-3 py-2.5 text-left",
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--company-primary-border)] bg-[var(--company-primary-soft)]">
        <Plus size={16} />
      </span>

      {!compact ? (
        <span className="min-w-0">
          <span className="block text-[13px] font-semibold">
            {t("companySwitcher.create")}
          </span>

          <span className="mt-0.5 block text-[10px] text-[var(--admin-muted)]">
            {t("companySwitcher.createDescription")}
          </span>
        </span>
      ) : null}
    </button>
  );
}

export default function CompanySwitcher({
  compact = false,
  placement = "bottom",
}) {
  const { t } = useAdminTranslation();

  const {
    companies,

    activeCompany,

    loading,
    error,

    isSuperAdmin,

    selectCompany,

    refreshCompanies,

    canSwitchCompany,
  } = useCompanyWorkspace();

  const [open, setOpen] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);

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

  async function handleCompanyCreated(company) {
    if (!company?.id) {
      await refreshCompanies();

      return;
    }

    await refreshCompanies({
      selectCompanyId: company.id,

      silent: true,
    });

    setOpen(false);
  }

  function openCreateDialog() {
    setOpen(false);

    setCreateOpen(true);
  }

  if (loading) {
    return (
      <div
        className={cn(
          "flex h-11 items-center text-xs text-[var(--admin-muted)]",

          compact ? "justify-center" : "gap-2 px-2",
        )}
      >
        <LoaderCircle size={15} className="animate-spin" />

        {!compact ? <span>{t("companySwitcher.loading")}</span> : null}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "text-xs text-red-600",

          compact && "text-center",
        )}
      >
        {compact ? "!" : t("companySwitcher.unavailable")}
      </div>
    );
  }

  /*
   * A new installation may not have a company yet.
   * Superadmin must still be able to create the first company.
   */
  if (!activeCompany) {
    return (
      <>
        {isSuperAdmin ? (
          <CreateCompanyButton
            compact={compact}
            onClick={openCreateDialog}
            t={t}
          />
        ) : (
          <div className="text-xs text-[var(--admin-muted)]">
            {compact ? "—" : t("companySwitcher.noCompany")}
          </div>
        )}

        {isSuperAdmin ? (
          <CompanyCreateDialog
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            onCreated={handleCompanyCreated}
          />
        ) : null}
      </>
    );
  }

  /*
   * Company users cannot switch company and cannot create one.
   */
  if (!isSuperAdmin) {
    return <CurrentCompany company={activeCompany} compact={compact} />;
  }

  /*
   * Superadmin with only one company still needs the popover
   * because the Create Company action lives inside it.
   */
  const activeName = getCompanyName(activeCompany);

  const popoverPosition =
    placement === "top" ? "bottom-[calc(100%+8px)]" : "top-[calc(100%+8px)]";

  return (
    <>
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-label={`${t("companySwitcher.current")}: ${activeName}`}
          title={compact ? activeName : undefined}
          className={cn(
            "flex w-full min-w-0 items-center rounded-xl text-left transition",
            "hover:bg-[var(--admin-hover)]",

            compact ? "justify-center p-1.5" : "gap-3 p-2",
          )}
        >
          <CompanyBadge company={activeCompany} compact={compact} />

          {!compact ? (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-[var(--admin-foreground)]">
                  {activeName}
                </span>

                <span className="mt-0.5 block text-[9px] uppercase tracking-[0.13em] text-[var(--admin-muted)]">
                  {t("companySwitcher.current")}
                </span>
              </span>

              <ChevronDown
                size={14}
                className={cn(
                  "shrink-0 text-[var(--admin-muted)] transition-transform",

                  open && "rotate-180",
                )}
              />
            </>
          ) : null}
        </button>

        {open ? (
          <div
            className={cn(
              "absolute z-[80] overflow-hidden rounded-2xl border",
              "border-[var(--admin-border)] bg-[var(--admin-surface)]",
              "shadow-[0_18px_50px_rgba(0,0,0,0.12)]",

              popoverPosition,

              compact ? "left-[calc(100%+10px)] w-[280px]" : "left-0 w-[280px]",
            )}
          >
            <div className="border-b border-[var(--admin-border)] px-4 py-3">
              <div className="flex items-center gap-2">
                <Building2
                  size={14}
                  className="text-[var(--company-primary)]"
                />

                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--admin-muted-light)]">
                  {t("companySwitcher.workspace")}
                </div>
              </div>

              <div className="mt-1 text-xs text-[var(--admin-muted)]">
                {canSwitchCompany
                  ? t("companySwitcher.select")
                  : t("companySwitcher.singleCompany")}
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
                      "flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition",

                      selected
                        ? "bg-[var(--company-primary-soft)]"
                        : "hover:bg-[var(--admin-hover)]",
                    )}
                  >
                    <CompanyBadge company={company} compact />

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-[var(--admin-foreground)]">
                        {getCompanyName(company)}
                      </span>

                      {company.slug ? (
                        <span className="mt-0.5 block truncate text-[11px] text-[var(--admin-muted)]">
                          {company.slug}
                        </span>
                      ) : null}
                    </span>

                    {selected ? (
                      <Check
                        size={16}
                        className="shrink-0 text-[var(--company-primary)]"
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="border-t border-[var(--admin-border)] p-2">
              <CreateCompanyButton
                compact={false}
                onClick={openCreateDialog}
                t={t}
              />
            </div>
          </div>
        ) : null}
      </div>

      <CompanyCreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCompanyCreated}
      />
    </>
  );
}
