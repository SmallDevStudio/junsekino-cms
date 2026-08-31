"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import {
  inMemoryPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from "firebase/auth";

import { Check, Eye, EyeOff, KeyRound, LoaderCircle } from "lucide-react";

import { firebaseAuth } from "@/lib/firebase/client";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

function validatePassword(password) {
  if (password.length < 8) {
    return "length";
  }

  if (!/[a-z]/.test(password)) {
    return "lowercase";
  }

  if (!/[A-Z]/.test(password)) {
    return "uppercase";
  }

  if (!/\d/.test(password)) {
    return "number";
  }

  return null;
}

function PasswordInput({ id, label, value, onChange, autoComplete, disabled }) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium">{label}</span>

      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required
          disabled={disabled}
          minLength={8}
          maxLength={128}
          className="h-11 w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 pr-11 outline-none transition focus:border-[var(--company-primary)] disabled:cursor-not-allowed disabled:opacity-60"
        />

        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center text-[var(--admin-muted-foreground)] hover:text-[var(--admin-foreground)]"
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </label>
  );
}

export default function ChangePasswordForm({ email, forced = false }) {
  const router = useRouter();

  const { t } = useAdminTranslation();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) {
      return;
    }

    const passwordError = validatePassword(newPassword);

    if (passwordError) {
      setError(t(`password.validation.${passwordError}`));

      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("password.validation.mismatch"));

      return;
    }

    if (currentPassword === newPassword) {
      setError(t("password.validation.samePassword"));

      return;
    }

    setLoading(true);
    setError("");

    try {
      await setPersistence(firebaseAuth, inMemoryPersistence);

      const credential = await signInWithEmailAndPassword(
        firebaseAuth,
        email,
        currentPassword,
      );

      await updatePassword(credential.user, newPassword);

      const idToken = await credential.user.getIdToken(true);

      const response = await fetch("/api/v1/users/me/password/change", {
        method: "POST",

        credentials: "same-origin",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          idToken,
        }),
      });

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || t("password.errors.change"));
      }

      await signOut(firebaseAuth);

      setCompleted(true);

      window.setTimeout(() => {
        router.replace("/admin/dashboard");
        router.refresh();
      }, 700);
    } catch (changeError) {
      console.error("Change password error:", changeError);

      let message = changeError?.message || t("password.errors.change");

      if (changeError?.code === "auth/invalid-credential") {
        message = t("password.errors.currentIncorrect");
      }

      if (changeError?.code === "auth/too-many-requests") {
        message = t("password.errors.tooManyRequests");
      }

      if (changeError?.code === "auth/requires-recent-login") {
        message = t("password.errors.recentLogin");
      }

      setError(message);

      try {
        await signOut(firebaseAuth);
      } catch {
        // Ignore client sign-out errors.
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-sm">
        <div className="border-b border-[var(--admin-border)] p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--company-primary)_12%,white)] text-[var(--company-primary)]">
            <KeyRound size={22} />
          </div>

          <h1 className="mt-4 text-2xl font-semibold">
            {forced ? t("password.forcedTitle") : t("password.title")}
          </h1>

          <p className="mt-2 text-sm leading-6 text-[var(--admin-muted-foreground)]">
            {forced
              ? t("password.forcedDescription")
              : t("password.description")}
          </p>

          <p className="mt-2 text-xs font-medium text-[var(--company-primary)]">
            {email}
          </p>
        </div>

        {completed ? (
          <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Check size={26} />
            </div>

            <h2 className="mt-4 text-lg font-semibold">
              {t("password.success.title")}
            </h2>

            <p className="mt-2 text-sm text-[var(--admin-muted-foreground)]">
              {t("password.success.description")}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-5 p-6">
              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <PasswordInput
                id="current-password"
                label={t("password.fields.current")}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                disabled={loading}
              />

              <PasswordInput
                id="new-password"
                label={t("password.fields.new")}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                disabled={loading}
              />

              <PasswordInput
                id="confirm-password"
                label={t("password.fields.confirm")}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                disabled={loading}
              />

              <div className="rounded-xl bg-[var(--admin-background)] p-4 text-xs leading-6 text-[var(--admin-muted-foreground)]">
                <p className="font-medium text-[var(--admin-foreground)]">
                  {t("password.requirements.title")}
                </p>

                <ul className="mt-1 list-inside list-disc">
                  <li>{t("password.requirements.length")}</li>
                  <li>{t("password.requirements.uppercase")}</li>
                  <li>{t("password.requirements.lowercase")}</li>
                  <li>{t("password.requirements.number")}</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end border-t border-[var(--admin-border)] p-6">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--company-primary)] px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <KeyRound size={16} />
                )}

                {loading
                  ? t("password.actions.changing")
                  : t("password.actions.change")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
