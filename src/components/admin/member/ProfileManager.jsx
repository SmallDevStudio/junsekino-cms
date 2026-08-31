"use client";

import { useCallback, useEffect, useState } from "react";

import {
  BriefcaseBusiness,
  Check,
  IdCard,
  LoaderCircle,
  Save,
  UserRound,
} from "lucide-react";

import { useRouter } from "next/navigation";

import { useCompanyWorkspace } from "@/components/admin/company/CompanyWorkspaceProvider";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import MemberAvatarField from "@/components/admin/member/MemberAvatarField";

const EMPTY_PROFILE = {
  email: "",
  displayName: "",
  phone: "",
  position: "",
  department: "",
  employeeCode: "",
  bio: "",
  avatar: null,
};

export default function ProfileManager() {
  const router = useRouter();

  const { activeCompanyId, loading: companyLoading } = useCompanyWorkspace();

  const { t } = useAdminTranslation();

  const [profile, setProfile] = useState(EMPTY_PROFILE);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [saved, setSaved] = useState(false);

  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/v1/users/me/profile", {
        method: "GET",

        cache: "no-store",

        credentials: "include",
      });

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || t("profile.errors.load"));
      }

      setProfile({
        ...EMPTY_PROFILE,

        ...(payload?.data || {}),
      });
    } catch (loadError) {
      console.error("Load profile error:", loadError);

      setError(loadError?.message || t("profile.errors.load"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadProfile();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadProfile]);

  function updateField(field, value) {
    setProfile((current) => ({
      ...current,

      [field]: value,
    }));

    setSaved(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) {
      return;
    }

    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const response = await fetch("/api/v1/users/me/profile", {
        method: "PATCH",

        credentials: "include",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          displayName: profile.displayName.trim(),

          phone: profile.phone.trim() || null,

          position: profile.position.trim() || null,

          department: profile.department.trim() || null,

          employeeCode: profile.employeeCode.trim() || null,

          bio: profile.bio.trim() || null,

          avatar: profile.avatar || null,
        }),
      });

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || t("profile.errors.save"));
      }

      setProfile({
        ...EMPTY_PROFILE,

        ...(payload?.data || {}),
      });

      setSaved(true);

      router.refresh();
    } catch (saveError) {
      console.error("Save profile error:", saveError);

      setError(saveError?.message || t("profile.errors.save"));
    } finally {
      setSaving(false);
    }
  }

  if (loading || companyLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-sm text-[var(--admin-muted-foreground)]">
        <LoaderCircle
          size={19}
          className="animate-spin text-[var(--company-primary)]"
        />

        {t("profile.loading")}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--company-primary)]">
          {t("profile.eyebrow")}
        </p>

        <h1 className="text-2xl font-semibold">{t("profile.title")}</h1>

        <p className="mt-1 text-sm text-[var(--admin-muted-foreground)]">
          {t("profile.description")}
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

          {t("profile.success")}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-2">
            <UserRound size={18} className="text-[var(--company-primary)]" />

            <h2 className="font-semibold">{t("profile.sections.avatar")}</h2>
          </div>

          <MemberAvatarField
            companyId={activeCompanyId}
            value={profile.avatar}
            onChange={(avatar) => updateField("avatar", avatar)}
            disabled={saving || !activeCompanyId}
          />
        </section>

        <section className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-2">
            <IdCard size={18} className="text-[var(--company-primary)]" />

            <h2 className="font-semibold">{t("profile.sections.personal")}</h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span>{t("profile.fields.name")}</span>

              <input
                required
                minLength={2}
                maxLength={150}
                value={profile.displayName}
                onChange={(event) =>
                  updateField("displayName", event.target.value)
                }
                disabled={saving}
                className="h-11 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 outline-none focus:border-[var(--company-primary)]"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span>{t("profile.fields.email")}</span>

              <input
                type="email"
                value={profile.email}
                disabled
                className="h-11 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 opacity-60"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span>{t("profile.fields.phone")}</span>

              <input
                maxLength={50}
                value={profile.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                disabled={saving}
                className="h-11 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 outline-none focus:border-[var(--company-primary)]"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span>{t("profile.fields.employeeCode")}</span>

              <input
                maxLength={100}
                value={profile.employeeCode}
                onChange={(event) =>
                  updateField("employeeCode", event.target.value)
                }
                disabled={saving}
                className="h-11 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 outline-none focus:border-[var(--company-primary)]"
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-2">
            <BriefcaseBusiness
              size={18}
              className="text-[var(--company-primary)]"
            />

            <h2 className="font-semibold">{t("profile.sections.work")}</h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span>{t("profile.fields.position")}</span>

              <input
                maxLength={150}
                value={profile.position}
                onChange={(event) =>
                  updateField("position", event.target.value)
                }
                disabled={saving}
                className="h-11 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 outline-none focus:border-[var(--company-primary)]"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span>{t("profile.fields.department")}</span>

              <input
                maxLength={150}
                value={profile.department}
                onChange={(event) =>
                  updateField("department", event.target.value)
                }
                disabled={saving}
                className="h-11 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 outline-none focus:border-[var(--company-primary)]"
              />
            </label>

            <label className="grid gap-2 text-sm sm:col-span-2">
              <span>{t("profile.fields.bio")}</span>

              <textarea
                rows={5}
                maxLength={1000}
                value={profile.bio}
                onChange={(event) => updateField("bio", event.target.value)}
                disabled={saving}
                className="resize-y rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] p-3 outline-none focus:border-[var(--company-primary)]"
              />

              <span className="text-right text-xs text-[var(--admin-muted-foreground)]">
                {profile.bio.length}/1000
              </span>
            </label>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
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
      </form>
    </div>
  );
}
