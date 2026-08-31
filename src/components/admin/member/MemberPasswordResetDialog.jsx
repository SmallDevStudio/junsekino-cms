"use client";

import { useState } from "react";

import {
  Check,
  Clipboard,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

function generateTemporaryPassword() {
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lowercase = "abcdefghijkmnopqrstuvwxyz";
  const numbers = "23456789";
  const symbols = "!@#$%";

  const required = [uppercase, lowercase, numbers, symbols].map(
    (characters) => characters[Math.floor(Math.random() * characters.length)],
  );

  const allCharacters = uppercase + lowercase + numbers + symbols;

  const remaining = Array.from(
    {
      length: 8,
    },
    () => allCharacters[Math.floor(Math.random() * allCharacters.length)],
  );

  const password = [...required, ...remaining];

  for (let index = password.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));

    [password[index], password[randomIndex]] = [
      password[randomIndex],
      password[index],
    ];
  }

  return password.join("");
}

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

export default function MemberPasswordResetDialog({
  member,
  companyId,
  onClose,
  onSuccess,
}) {
  const { t } = useAdminTranslation();

  const user = member?.user || member || {};

  const uid =
    member?.userId ||
    member?.uid ||
    member?.id ||
    user?.uid ||
    user?.id ||
    null;

  const [password, setPassword] = useState(() => generateTemporaryPassword());

  const [confirmPassword, setConfirmPassword] = useState(password);

  const [showPassword, setShowPassword] = useState(true);

  const [mustChangePassword, setMustChangePassword] = useState(true);

  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [copied, setCopied] = useState(false);

  const [error, setError] = useState("");

  function createNewPassword() {
    const generated = generateTemporaryPassword();

    setPassword(generated);
    setConfirmPassword(generated);
    setCopied(false);
    setError("");
  }

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(password);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (copyError) {
      console.error("Copy temporary password error:", copyError);

      setError(t("members.passwordReset.errors.copy"));
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!uid || saving) {
      return;
    }

    const validationError = validatePassword(password);

    if (validationError) {
      setError(t(`members.passwordReset.validation.${validationError}`));

      return;
    }

    if (password !== confirmPassword) {
      setError(t("members.passwordReset.validation.mismatch"));

      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `/api/v1/users/${encodeURIComponent(uid)}/password/reset`,
        {
          method: "POST",

          credentials: "include",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            password,

            confirmPassword,

            companyId: companyId || undefined,

            mustChangePassword,
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.message || t("members.passwordReset.errors.reset"),
        );
      }

      setCompleted(true);

      if (typeof onSuccess === "function") {
        onSuccess(payload?.data || null);
      }
    } catch (resetError) {
      console.error("Reset member password error:", resetError);

      setError(resetError?.message || t("members.passwordReset.errors.reset"));
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    if (saving) {
      return;
    }

    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[240] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--admin-border)] p-5">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--company-primary)_12%,white)] text-[var(--company-primary)]">
              <KeyRound size={19} />
            </span>

            <div className="min-w-0">
              <h2 className="text-lg font-semibold">
                {t("members.passwordReset.title")}
              </h2>

              <p className="mt-1 truncate text-xs text-[var(--admin-muted-foreground)]">
                {user.displayName || user.email || "—"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            aria-label={t("common.close")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition hover:bg-[var(--admin-background)] disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {completed ? (
          <div className="p-6">
            <div className="flex flex-col items-center py-4 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Check size={26} />
              </span>

              <h3 className="mt-4 text-lg font-semibold">
                {t("members.passwordReset.success.title")}
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--admin-muted-foreground)]">
                {mustChangePassword
                  ? t("members.passwordReset.success.forcedDescription")
                  : t("members.passwordReset.success.description")}
              </p>
            </div>

            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-medium text-amber-800">
                {t("members.passwordReset.temporaryPassword")}
              </p>

              <div className="mt-2 flex items-center gap-2">
                <code className="min-w-0 flex-1 overflow-x-auto rounded-lg bg-white px-3 py-2 text-sm font-semibold text-amber-900">
                  {password}
                </code>

                <button
                  type="button"
                  onClick={copyPassword}
                  className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 text-xs font-semibold text-amber-800"
                >
                  {copied ? <Check size={14} /> : <Clipboard size={14} />}

                  {copied
                    ? t("members.passwordReset.actions.copied")
                    : t("members.passwordReset.actions.copy")}
                </button>
              </div>

              <p className="mt-2 text-xs leading-5 text-amber-700">
                {t("members.passwordReset.securityNotice")}
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="h-10 rounded-xl bg-[var(--company-primary)] px-5 text-sm font-semibold text-white"
              >
                {t("common.done")}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-5 p-5">
              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] p-4">
                <div className="flex gap-3">
                  <ShieldCheck
                    size={18}
                    className="mt-0.5 shrink-0 text-[var(--company-primary)]"
                  />

                  <p className="text-xs leading-5 text-[var(--admin-muted-foreground)]">
                    {t("members.passwordReset.description")}
                  </p>
                </div>
              </div>

              <label className="grid gap-2 text-sm">
                <span className="font-medium">
                  {t("members.passwordReset.fields.password")}
                </span>

                <div className="flex gap-2">
                  <div className="relative min-w-0 flex-1">
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);

                        setCopied(false);
                      }}
                      minLength={8}
                      maxLength={128}
                      autoComplete="new-password"
                      disabled={saving}
                      className="h-11 w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 pr-11 font-mono text-sm outline-none focus:border-[var(--company-primary)]"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      disabled={saving}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--admin-muted-foreground)]"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={createNewPassword}
                    disabled={saving}
                    aria-label={t("members.passwordReset.actions.generate")}
                    title={t("members.passwordReset.actions.generate")}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--admin-border)] transition hover:text-[var(--company-primary)] disabled:opacity-50"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </label>

              <label className="grid gap-2 text-sm">
                <span className="font-medium">
                  {t("members.passwordReset.fields.confirmPassword")}
                </span>

                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  disabled={saving}
                  className="h-11 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 font-mono text-sm outline-none focus:border-[var(--company-primary)]"
                />
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--admin-border)] p-4">
                <input
                  type="checkbox"
                  checked={mustChangePassword}
                  onChange={(event) =>
                    setMustChangePassword(event.target.checked)
                  }
                  disabled={saving}
                  className="mt-0.5 h-4 w-4 accent-[var(--company-primary)]"
                />

                <span>
                  <span className="block text-sm font-medium">
                    {t("members.passwordReset.fields.mustChangePassword")}
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-[var(--admin-muted-foreground)]">
                    {t(
                      "members.passwordReset.fields.mustChangePasswordDescription",
                    )}
                  </span>
                </span>
              </label>

              <div className="rounded-xl bg-[var(--admin-background)] p-4 text-xs leading-6 text-[var(--admin-muted-foreground)]">
                <p className="font-medium text-[var(--admin-foreground)]">
                  {t("members.passwordReset.requirements.title")}
                </p>

                <ul className="mt-1 list-inside list-disc">
                  <li>{t("members.passwordReset.requirements.length")}</li>

                  <li>{t("members.passwordReset.requirements.uppercase")}</li>

                  <li>{t("members.passwordReset.requirements.lowercase")}</li>

                  <li>{t("members.passwordReset.requirements.number")}</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-[var(--admin-border)] p-5">
              <button
                type="button"
                onClick={handleClose}
                disabled={saving}
                className="h-10 rounded-xl border border-[var(--admin-border)] px-4 text-sm font-medium disabled:opacity-50"
              >
                {t("common.cancel")}
              </button>

              <button
                type="submit"
                disabled={saving || !uid}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--company-primary)] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : (
                  <KeyRound size={15} />
                )}

                {saving
                  ? t("members.passwordReset.actions.resetting")
                  : t("members.passwordReset.actions.reset")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
