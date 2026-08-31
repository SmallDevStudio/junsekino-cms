"use client";

import Link from "next/link";

import {
  Bell,
  Check,
  Eye,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Monitor,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { useCallback, useEffect, useState } from "react";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

const DEFAULT_PREFERENCES = {
  privacy: {
    avatarVisibility: "company",
    phoneVisibility: "private",
    bioVisibility: "company",
    lastActiveVisibility: "admins",
  },

  notifications: {
    emailEnabled: true,
    browserEnabled: true,
    formSubmissions: true,
    contentPublished: true,
    memberUpdates: true,
    securityAlerts: true,
  },
};

function SelectField({
  label,
  description,
  value,
  onChange,
  options,
  disabled,
}) {
  return (
    <label className="grid gap-2 border-b border-[var(--admin-border)] py-4 last:border-0">
      <span className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="min-w-0">
          <span className="block text-sm font-medium">{label}</span>

          <span className="mt-1 block text-xs leading-5 text-[var(--admin-muted-foreground)]">
            {description}
          </span>
        </span>

        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="h-10 min-w-40 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 text-sm outline-none focus:border-[var(--company-primary)]"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
}

function ToggleField({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
  disabled,
  locked = false,
}) {
  return (
    <label
      className={`flex items-start gap-3 border-b border-[var(--admin-border)] py-4 last:border-0 ${
        disabled || locked ? "cursor-not-allowed opacity-70" : "cursor-pointer"
      }`}
    >
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--admin-background)] text-[var(--company-primary)]">
        <Icon size={16} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>

        <span className="mt-1 block text-xs leading-5 text-[var(--admin-muted-foreground)]">
          {description}
        </span>
      </span>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled || locked}
        className="mt-2 h-4 w-4 accent-[var(--company-primary)]"
      />
    </label>
  );
}

export default function PreferencesManager() {
  const { t } = useAdminTranslation();

  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [saved, setSaved] = useState(false);

  const [error, setError] = useState("");

  const loadPreferences = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/v1/users/me/preferences", {
        method: "GET",

        cache: "no-store",

        credentials: "include",
      });

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || t("privacy.errors.load"));
      }

      setPreferences({
        privacy: {
          ...DEFAULT_PREFERENCES.privacy,

          ...(payload?.data?.privacy || {}),
        },

        notifications: {
          ...DEFAULT_PREFERENCES.notifications,

          ...(payload?.data?.notifications || {}),
        },
      });
    } catch (loadError) {
      console.error("Load privacy preferences error:", loadError);

      setError(loadError?.message || t("privacy.errors.load"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadPreferences();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadPreferences]);

  function updatePrivacy(field, value) {
    setPreferences((current) => ({
      ...current,

      privacy: {
        ...current.privacy,

        [field]: value,
      },
    }));

    setSaved(false);
  }

  function updateNotification(field, value) {
    setPreferences((current) => ({
      ...current,

      notifications: {
        ...current.notifications,

        [field]: value,
      },
    }));

    setSaved(false);
  }

  async function handleSave() {
    if (saving) {
      return;
    }

    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const response = await fetch("/api/v1/users/me/preferences", {
        method: "PATCH",

        credentials: "include",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          privacy: preferences.privacy,

          notifications: preferences.notifications,
        }),
      });

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || t("privacy.errors.save"));
      }

      setPreferences({
        privacy: {
          ...DEFAULT_PREFERENCES.privacy,

          ...(payload?.data?.privacy || {}),
        },

        notifications: {
          ...DEFAULT_PREFERENCES.notifications,

          ...(payload?.data?.notifications || {}),
        },
      });

      setSaved(true);
    } catch (saveError) {
      console.error("Save privacy preferences error:", saveError);

      setError(saveError?.message || t("privacy.errors.save"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-sm text-[var(--admin-muted-foreground)]">
        <LoaderCircle
          size={18}
          className="animate-spin text-[var(--company-primary)]"
        />

        {t("privacy.loading")}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--company-primary)]">
          {t("privacy.eyebrow")}
        </p>

        <h1 className="text-2xl font-semibold">{t("privacy.title")}</h1>

        <p className="mt-1 text-sm text-[var(--admin-muted-foreground)]">
          {t("privacy.description")}
        </p>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {saved ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <Check size={17} />

          {t("privacy.success")}
        </div>
      ) : null}

      <section className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2">
          <Eye size={18} className="text-[var(--company-primary)]" />

          <h2 className="font-semibold">{t("privacy.sections.visibility")}</h2>
        </div>

        <div className="mt-2">
          <SelectField
            label={t("privacy.fields.avatar.label")}
            description={t("privacy.fields.avatar.description")}
            value={preferences.privacy.avatarVisibility}
            onChange={(value) => updatePrivacy("avatarVisibility", value)}
            disabled={saving}
            options={[
              {
                value: "company",

                label: t("privacy.options.company"),
              },
              {
                value: "private",

                label: t("privacy.options.private"),
              },
            ]}
          />

          <SelectField
            label={t("privacy.fields.phone.label")}
            description={t("privacy.fields.phone.description")}
            value={preferences.privacy.phoneVisibility}
            onChange={(value) => updatePrivacy("phoneVisibility", value)}
            disabled={saving}
            options={[
              {
                value: "company",

                label: t("privacy.options.company"),
              },
              {
                value: "private",

                label: t("privacy.options.private"),
              },
            ]}
          />

          <SelectField
            label={t("privacy.fields.bio.label")}
            description={t("privacy.fields.bio.description")}
            value={preferences.privacy.bioVisibility}
            onChange={(value) => updatePrivacy("bioVisibility", value)}
            disabled={saving}
            options={[
              {
                value: "company",

                label: t("privacy.options.company"),
              },
              {
                value: "private",

                label: t("privacy.options.private"),
              },
            ]}
          />

          <SelectField
            label={t("privacy.fields.lastActive.label")}
            description={t("privacy.fields.lastActive.description")}
            value={preferences.privacy.lastActiveVisibility}
            onChange={(value) => updatePrivacy("lastActiveVisibility", value)}
            disabled={saving}
            options={[
              {
                value: "admins",

                label: t("privacy.options.admins"),
              },
              {
                value: "private",

                label: t("privacy.options.private"),
              },
            ]}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-[var(--company-primary)]" />

          <h2 className="font-semibold">
            {t("privacy.sections.notifications")}
          </h2>
        </div>

        <div className="mt-2">
          <ToggleField
            icon={Mail}
            label={t("privacy.notifications.email.label")}
            description={t("privacy.notifications.email.description")}
            checked={preferences.notifications.emailEnabled}
            onChange={(value) => updateNotification("emailEnabled", value)}
            disabled={saving}
          />

          <ToggleField
            icon={Monitor}
            label={t("privacy.notifications.browser.label")}
            description={t("privacy.notifications.browser.description")}
            checked={preferences.notifications.browserEnabled}
            onChange={(value) => updateNotification("browserEnabled", value)}
            disabled={saving}
          />

          <ToggleField
            icon={Bell}
            label={t("privacy.notifications.forms.label")}
            description={t("privacy.notifications.forms.description")}
            checked={preferences.notifications.formSubmissions}
            onChange={(value) => updateNotification("formSubmissions", value)}
            disabled={saving}
          />

          <ToggleField
            icon={UserRound}
            label={t("privacy.notifications.members.label")}
            description={t("privacy.notifications.members.description")}
            checked={preferences.notifications.memberUpdates}
            onChange={(value) => updateNotification("memberUpdates", value)}
            disabled={saving}
          />

          <ToggleField
            icon={ShieldCheck}
            label={t("privacy.notifications.security.label")}
            description={t("privacy.notifications.security.description")}
            checked
            onChange={() => {}}
            locked
          />
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2">
          <LockKeyhole size={18} className="text-[var(--company-primary)]" />

          <h2 className="font-semibold">{t("privacy.sections.security")}</h2>
        </div>

        <div className="mt-4 flex flex-col gap-4 rounded-xl border border-[var(--admin-border)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">
              {t("privacy.security.password.title")}
            </p>

            <p className="mt-1 text-xs leading-5 text-[var(--admin-muted-foreground)]">
              {t("privacy.security.password.description")}
            </p>
          </div>

          <Link
            href="/admin/change-password"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--admin-border)] px-4 text-sm font-medium hover:text-[var(--company-primary)]"
          >
            <KeyRound size={15} />

            {t("privacy.security.password.action")}
          </Link>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--company-primary)] px-5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}

          {saving ? t("common.saving") : t("common.save")}
        </button>
      </div>
    </div>
  );
}
