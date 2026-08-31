"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, LoaderCircle, Save } from "lucide-react";

import { useCompanyWorkspace } from "@/components/admin/company/CompanyWorkspaceProvider";
import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

const DEFAULT_COLORS = {
  primary: "#111111",
  secondary: "#ffffff",
  accent: "#d4d4d4",
  background: "#ffffff",
  surface: "#f7f7f7",
  text: "#111111",
};

function normalizeCompany(company = {}) {
  return {
    name: company.name || "",
    legalName: company.legalName || "",
    shortName: company.shortName || "",
    slug: company.slug || "",
    status: company.status || "active",
    defaultLocale: company.defaultLocale || "en",
    supportedLocales: Array.isArray(company.supportedLocales)
      ? company.supportedLocales
      : ["en"],
    branding: {
      ...(company.branding || {}),
      colors: {
        ...DEFAULT_COLORS,
        ...(company.branding?.colors || company.colors || {}),
      },
    },
  };
}

export default function CompanyManager() {
  const { activeCompanyId, activeCompany, refreshCompanies } =
    useCompanyWorkspace();
  const { t } = useAdminTranslation();
  const [form, setForm] = useState(() => normalizeCompany(activeCompany));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCompany = useCallback(async () => {
    if (!activeCompanyId) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/v1/companies/${encodeURIComponent(activeCompanyId)}`,
        { cache: "no-store", credentials: "include" },
      );
      const payload = await response.json();
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || t("companyAdmin.errors.load"));
      }
      setForm(normalizeCompany(payload.data));
    } catch (loadError) {
      setError(loadError?.message || t("companyAdmin.errors.load"));
    } finally {
      setLoading(false);
    }
  }, [activeCompanyId, t]);

  useEffect(() => {
    const timeoutId = window.setTimeout(loadCompany, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadCompany]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateColor(field, value) {
    setForm((current) => ({
      ...current,
      branding: {
        ...current.branding,
        colors: { ...current.branding.colors, [field]: value },
      },
    }));
  }

  function toggleThai(enabled) {
    setForm((current) => ({
      ...current,
      supportedLocales: enabled ? ["en", "th"] : ["en"],
      defaultLocale:
        !enabled && current.defaultLocale === "th"
          ? "en"
          : current.defaultLocale,
    }));
  }

  async function save(event) {
    event.preventDefault();
    if (!activeCompanyId) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(
        `/api/v1/companies/${encodeURIComponent(activeCompanyId)}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const payload = await response.json();
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || t("companyAdmin.errors.save"));
      }
      setForm(normalizeCompany(payload.data));
      setSuccess(t("companyAdmin.saved"));
      await refreshCompanies();
    } catch (saveError) {
      setError(saveError?.message || t("companyAdmin.errors.save"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoaderCircle className="animate-spin text-[var(--company-primary)]" />
      </div>
    );
  }

  return (
    <form onSubmit={save} className="mx-auto w-full max-w-5xl space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[var(--company-primary)]">
            <Building2 size={18} />
            <span className="text-xs font-semibold uppercase tracking-[0.12em]">
              {t("companyAdmin.eyebrow")}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold">
            {t("companyAdmin.title")}
          </h1>
          <p className="mt-1 text-sm text-[var(--admin-muted-foreground)]">
            {t("companyAdmin.description")}
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--company-primary)] px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? (
            <LoaderCircle size={15} className="animate-spin" />
          ) : (
            <Save size={15} />
          )}
          {t("common.save")}
        </button>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <section className="grid gap-5 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 sm:grid-cols-2">
        {[
          ["name", "companyAdmin.fields.name"],
          ["legalName", "companyAdmin.fields.legalName"],
          ["shortName", "companyAdmin.fields.shortName"],
          ["slug", "companyAdmin.fields.slug"],
        ].map(([field, key]) => (
          <label key={field} className="grid gap-1.5 text-sm">
            <span>{t(key)}</span>
            <input
              required={field === "name" || field === "slug"}
              value={form[field]}
              onChange={(event) => update(field, event.target.value)}
              className="h-11 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 outline-none focus:border-[var(--company-primary)]"
            />
          </label>
        ))}
        <label className="grid gap-1.5 text-sm">
          <span>{t("companyAdmin.fields.status")}</span>
          <select
            value={form.status}
            onChange={(event) => update("status", event.target.value)}
            className="h-11 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label className="grid gap-1.5 text-sm">
          <span>{t("companyAdmin.fields.defaultLocale")}</span>
          <select
            value={form.defaultLocale}
            onChange={(event) => update("defaultLocale", event.target.value)}
            className="h-11 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3"
          >
            <option value="en">English</option>
            {form.supportedLocales.includes("th") ? (
              <option value="th">ไทย</option>
            ) : null}
          </select>
        </label>
        <label className="flex items-center gap-3 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={form.supportedLocales.includes("th")}
            onChange={(event) => toggleThai(event.target.checked)}
            className="h-4 w-4 accent-[var(--company-primary)]"
          />
          {t("companyAdmin.fields.enableThai")}
        </label>
      </section>

      <section className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
        <h2 className="font-semibold">{t("companyAdmin.colors.title")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(form.branding.colors).map(([field, value]) => (
            <label key={field} className="grid gap-1.5 text-sm">
              <span>{t(`companyAdmin.colors.${field}`)}</span>
              <div className="flex h-11 overflow-hidden rounded-xl border border-[var(--admin-border)]">
                <input
                  type="color"
                  value={value}
                  onChange={(event) => updateColor(field, event.target.value)}
                  className="h-full w-12 cursor-pointer border-0 bg-transparent"
                />
                <input
                  value={value}
                  onChange={(event) => updateColor(field, event.target.value)}
                  className="min-w-0 flex-1 bg-[var(--admin-background)] px-3 uppercase outline-none"
                />
              </div>
            </label>
          ))}
        </div>
      </section>
    </form>
  );
}
