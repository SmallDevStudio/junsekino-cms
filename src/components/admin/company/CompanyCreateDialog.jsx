"use client";

import { useState } from "react";
import { LoaderCircle, Plus, X } from "lucide-react";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

const INITIAL_FORM = {
  name: "",
  legalName: "",
  shortName: "",
  slug: "",
  status: "active",
  defaultLocale: "en",
  supportedLocales: ["en"],
};

function createSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CompanyCreateDialog({ open, onClose, onCreated }) {
  const { t } = useAdminTranslation();
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  function update(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "name" && !current.slug ? { slug: createSlug(value) } : {}),
    }));
  }

  function close() {
    if (saving) return;
    setForm(INITIAL_FORM);
    setError("");
    onClose?.();
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/v1/companies", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          slug: createSlug(form.slug),
        }),
      });
      const payload = await response.json();
      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.message || t("companyAdmin.create.errors.save"),
        );
      }
      setForm(INITIAL_FORM);
      onCreated?.(payload.data);
      onClose?.();
    } catch (saveError) {
      setError(saveError?.message || t("companyAdmin.create.errors.save"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onMouseDown={(event) => event.target === event.currentTarget && close()}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--admin-border)] p-5">
          <div>
            <h2 className="text-lg font-semibold">
              {t("companyAdmin.create.title")}
            </h2>
            <p className="mt-1 text-xs text-[var(--admin-muted-foreground)]">
              {t("companyAdmin.create.description")}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            disabled={saving}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[var(--admin-background)]"
          >
            <X size={18} />
          </button>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
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
        </div>
        {error ? (
          <div className="mx-5 mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        <div className="flex justify-end gap-3 border-t border-[var(--admin-border)] p-5">
          <button
            type="button"
            onClick={close}
            disabled={saving}
            className="h-10 rounded-xl border border-[var(--admin-border)] px-4 text-sm font-medium"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--company-primary)] px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : (
              <Plus size={15} />
            )}
            {t("companyAdmin.create.action")}
          </button>
        </div>
      </form>
    </div>
  );
}
