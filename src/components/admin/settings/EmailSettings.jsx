"use client";

import {
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  LoaderCircle,
  Mail,
  Plus,
  Save,
  Send,
  Server,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import { useCallback, useEffect, useState } from "react";

import { toast } from "sonner";

import { useCompanyWorkspace } from "@/components/admin/company/CompanyWorkspaceProvider";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { cn } from "@/utils/cn";

/*
 * =========================================================
 * CONSTANTS
 * =========================================================
 */

const EMAIL_PROVIDER = {
  RESEND: "resend",
  SMTP: "smtp",
};

const SMTP_SECURITY = {
  NONE: "none",
  STARTTLS: "starttls",
  TLS: "tls",
};

const EMPTY_EMAIL_SETTINGS = {
  enabled: false,

  provider: EMAIL_PROVIDER.RESEND,

  senderName: "",

  senderEmail: "",

  replyTo: "",

  recipients: [],

  smtp: {
    host: "",

    port: 587,

    security: SMTP_SECURITY.STARTTLS,

    username: "",
  },
};

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function normalizeEmailSettings(email) {
  return {
    enabled: email?.enabled === true,

    provider:
      email?.provider === EMAIL_PROVIDER.SMTP
        ? EMAIL_PROVIDER.SMTP
        : EMAIL_PROVIDER.RESEND,

    senderName: email?.senderName || "",

    senderEmail: email?.senderEmail || "",

    replyTo: email?.replyTo || "",

    recipients: Array.isArray(email?.recipients) ? email.recipients : [],

    smtp: {
      host: email?.smtp?.host || "",

      port: Number(email?.smtp?.port) || 587,

      security: [
        SMTP_SECURITY.NONE,
        SMTP_SECURITY.STARTTLS,
        SMTP_SECURITY.TLS,
      ].includes(email?.smtp?.security)
        ? email.smtp.security
        : SMTP_SECURITY.STARTTLS,

      username: email?.smtp?.username || "",
    },
  };
}

/*
 * =========================================================
 * PROVIDER OPTION
 * =========================================================
 */

function ProviderOption({ icon: Icon, title, description, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3",
        "rounded-2xl",
        "border",
        "p-4",
        "text-left",
        "transition",

        active
          ? "border-[var(--company-primary-border)] bg-[var(--company-primary-soft)]"
          : "border-[var(--admin-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-hover)]",
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0",
          "items-center justify-center",
          "rounded-xl",

          active
            ? "bg-[var(--company-primary)] text-[var(--company-primary-foreground)]"
            : "bg-[var(--admin-background)] text-[var(--admin-muted)]",
        )}
      >
        <Icon size={16} strokeWidth={1.8} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block admin-text-11 font-semibold text-[var(--admin-foreground)]">
          {title}
        </span>

        <span className="mt-1 block admin-text-9 leading-[1.55] text-[var(--admin-muted)]">
          {description}
        </span>
      </span>

      {active && (
        <CheckCircle2
          size={17}
          className="mt-1 shrink-0 text-[var(--company-primary)]"
        />
      )}
    </button>
  );
}

/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

export default function EmailSettings() {
  const {
    activeCompany,
    activeCompanyId,
    loading: companyLoading,
  } = useCompanyWorkspace();

  const { t } = useAdminTranslation();

  const [form, setForm] = useState(EMPTY_EMAIL_SETTINGS);

  const [recipientInput, setRecipientInput] = useState("");

  const [smtpPassword, setSmtpPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [passwordConfigured, setPasswordConfigured] = useState(false);

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [testing, setTesting] = useState(false);

  const [sendingTest, setSendingTest] = useState(false);

  /*
   * =======================================================
   * LOAD SETTINGS
   * =======================================================
   */

  const loadSettings = useCallback(async () => {
    if (!activeCompanyId) {
      return;
    }

    try {
      setLoading(true);

      const [settingsResponse, passwordResponse] = await Promise.all([
        fetch(`/api/v1/companies/${activeCompanyId}/settings/communication`, {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        }),

        fetch(
          `/api/v1/companies/${activeCompanyId}/settings/communication/smtp-password`,
          {
            method: "GET",
            cache: "no-store",
            credentials: "include",
          },
        ),
      ]);

      const settingsPayload = await settingsResponse.json();

      const passwordPayload = await passwordResponse.json();

      if (!settingsResponse.ok || settingsPayload?.success === false) {
        throw new Error(
          settingsPayload?.message || t("settings.email.messages.loadFailed"),
        );
      }

      setForm(normalizeEmailSettings(settingsPayload?.data?.email));

      setPasswordConfigured(
        passwordResponse.ok &&
          passwordPayload?.success !== false &&
          passwordPayload?.data?.configured === true,
      );

      setSmtpPassword("");
    } catch (error) {
      console.error("Load email settings error:", error);

      toast.error(error?.message || t("settings.email.messages.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [activeCompanyId, t]);

  useEffect(() => {
    if (!activeCompanyId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      loadSettings();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeCompanyId, loadSettings]);

  /*
   * =======================================================
   * UPDATE
   * =======================================================
   */

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateSmtpField(field, value) {
    setForm((current) => ({
      ...current,

      smtp: {
        ...current.smtp,

        [field]: value,
      },
    }));
  }

  /*
   * =======================================================
   * RECIPIENTS
   * =======================================================
   */

  function addRecipient() {
    const email = recipientInput.trim().toLowerCase();

    if (!email) {
      return;
    }

    if (!isValidEmail(email)) {
      toast.error(t("settings.email.messages.invalidRecipient"));

      return;
    }

    if (form.recipients.includes(email)) {
      toast.error(t("settings.email.messages.duplicateRecipient"));

      return;
    }

    setForm((current) => ({
      ...current,

      recipients: [...current.recipients, email],
    }));

    setRecipientInput("");
  }

  function removeRecipient(email) {
    setForm((current) => ({
      ...current,

      recipients: current.recipients.filter((item) => item !== email),
    }));
  }

  /*
   * =======================================================
   * VALIDATE
   * =======================================================
   */

  function validateForm() {
    if (form.senderEmail && !isValidEmail(form.senderEmail)) {
      toast.error(t("settings.email.messages.invalidSender"));

      return false;
    }

    if (form.replyTo && !isValidEmail(form.replyTo)) {
      toast.error(t("settings.email.messages.invalidReplyTo"));

      return false;
    }

    if (form.provider === EMAIL_PROVIDER.SMTP) {
      if (!form.smtp.host.trim()) {
        toast.error(t("settings.email.messages.smtpHostRequired"));

        return false;
      }

      if (
        !Number.isInteger(Number(form.smtp.port)) ||
        Number(form.smtp.port) < 1 ||
        Number(form.smtp.port) > 65535
      ) {
        toast.error(t("settings.email.messages.smtpPortInvalid"));

        return false;
      }
    }

    return true;
  }

  /*
   * =======================================================
   * SAVE SETTINGS
   * =======================================================
   */

  async function handleSave() {
    if (!activeCompanyId || saving) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      /*
       * Save communication config first.
       */

      const response = await fetch(
        `/api/v1/companies/${activeCompanyId}/settings/communication`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            email: {
              ...form,

              smtp: {
                ...form.smtp,

                port: Number(form.smtp.port),
              },
            },
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.message || t("settings.email.messages.saveFailed"),
        );
      }

      /*
       * Save SMTP password separately.
       *
       * Never include the password inside
       * communication settings.
       */

      if (form.provider === EMAIL_PROVIDER.SMTP && smtpPassword) {
        const passwordResponse = await fetch(
          `/api/v1/companies/${activeCompanyId}/settings/communication/smtp-password`,
          {
            method: "PUT",

            headers: {
              "Content-Type": "application/json",
            },

            credentials: "include",

            body: JSON.stringify({
              password: smtpPassword,
            }),
          },
        );

        const passwordPayload = await passwordResponse.json();

        if (!passwordResponse.ok || passwordPayload?.success === false) {
          throw new Error(
            passwordPayload?.message ||
              t("settings.email.messages.passwordSaveFailed"),
          );
        }

        setPasswordConfigured(true);

        setSmtpPassword("");
      }

      setForm(normalizeEmailSettings(payload?.data?.email || form));

      toast.success(t("settings.email.messages.saved"));
    } catch (error) {
      console.error("Save email settings error:", error);

      toast.error(error?.message || t("settings.email.messages.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  /*
   * =======================================================
   * TEST SMTP
   * =======================================================
   */

  async function testSmtp() {
    if (!activeCompanyId || testing) {
      return;
    }

    if (form.provider !== EMAIL_PROVIDER.SMTP) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setTesting(true);

      /*
       * Ensure latest settings/password are saved first.
       */

      await handleSave();

      const response = await fetch(
        `/api/v1/companies/${activeCompanyId}/settings/communication/test-smtp`,
        {
          method: "POST",

          credentials: "include",
        },
      );

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.message || t("settings.email.messages.testConnectionFailed"),
        );
      }

      toast.success(t("settings.email.messages.testConnectionSuccess"));
    } catch (error) {
      console.error("SMTP test error:", error);

      toast.error(
        error?.message || t("settings.email.messages.testConnectionFailed"),
      );
    } finally {
      setTesting(false);
    }
  }

  /*
   * =======================================================
   * SEND TEST EMAIL
   * =======================================================
   */

  async function sendTestEmail() {
    if (!activeCompanyId || sendingTest) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    if (form.recipients.length === 0) {
      toast.error(t("settings.email.messages.testEmailRecipientRequired"));

      return;
    }

    try {
      setSendingTest(true);

      /*
       * Save latest provider configuration
       * and a newly entered SMTP password first.
       */

      await handleSave();

      const response = await fetch(
        `/api/v1/companies/${activeCompanyId}/settings/communication/send-test-email`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            /*
             * Send to first configured recipient.
             *
             * Normal notifications may still use
             * every configured recipient.
             */
            recipient: form.recipients[0],
          }),
        },
      );

      let payload = null;

      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.message || t("settings.email.messages.testEmailFailed"),
        );
      }

      toast.success(
        t("settings.email.messages.testEmailSent", {
          email: form.recipients[0],
        }),
      );
    } catch (error) {
      console.error("Send test email error:", error);

      toast.error(
        error?.message || t("settings.email.messages.testEmailFailed"),
      );
    } finally {
      setSendingTest(false);
    }
  }

  /*
   * =======================================================
   * LOADING
   * =======================================================
   */

  if (companyLoading || loading) {
    return (
      <div
        className="
          flex
          min-h-[420px]

          items-center
          justify-center

          rounded-2xl

          border
          border-[var(--admin-border)]

          bg-[var(--admin-surface)]
        "
      >
        <LoaderCircle
          size={20}
          className="
            animate-spin

            text-[var(--company-primary)]
          "
        />
      </div>
    );
  }

  if (!activeCompany || !activeCompanyId) {
    return null;
  }

  return (
    <div
      className="
        rounded-2xl

        border
        border-[var(--admin-border)]

        bg-[var(--admin-surface)]
      "
    >
      {/* =================================
          HEADER
      ================================= */}

      <div
        className="
          flex
          items-start
          gap-3

          border-b
          border-[var(--admin-border)]

          px-5
          py-5

          sm:px-6
        "
      >
        <div
          className="
            flex
            h-10
            w-10
            shrink-0

            items-center
            justify-center

            rounded-xl

            bg-[var(--company-primary-soft)]

            text-[var(--company-primary)]
          "
        >
          <Mail size={17} />
        </div>

        <div className="min-w-0">
          <h2 className="admin-text-16 font-semibold text-[var(--admin-foreground)]">
            {t("settings.email.title")}
          </h2>

          <p className="mt-1 admin-text-10 leading-[1.6] text-[var(--admin-muted)]">
            {t("settings.email.description")}
          </p>
        </div>
      </div>

      {/* =================================
          BODY
      ================================= */}

      <div
        className="
          space-y-9

          px-5
          py-6

          sm:px-6
        "
      >
        {/* ENABLE */}

        <section>
          <div
            className="
              flex
              items-center
              justify-between
              gap-4

              rounded-2xl

              border
              border-[var(--admin-border)]

              bg-[var(--admin-background)]

              p-4
            "
          >
            <div>
              <div className="admin-text-12 font-semibold text-[var(--admin-foreground)]">
                {t("settings.email.enabled.title")}
              </div>

              <div className="mt-1 admin-text-9 leading-[1.5] text-[var(--admin-muted)]">
                {t("settings.email.enabled.description")}
              </div>
            </div>

            <button
              type="button"
              onClick={() => updateField("enabled", !form.enabled)}
              className={cn(
                "relative",
                "h-6 w-11 shrink-0",
                "rounded-full",
                "transition",

                form.enabled
                  ? "bg-[var(--company-primary)]"
                  : "bg-[var(--admin-border)]",
              )}
            >
              <span
                className={cn(
                  "absolute top-1",
                  "h-4 w-4",
                  "rounded-full",
                  "bg-white",
                  "shadow",
                  "transition",

                  form.enabled ? "left-6" : "left-1",
                )}
              />
            </button>
          </div>
        </section>

        {/* PROVIDER */}

        <section>
          <h3 className="admin-text-12 font-semibold text-[var(--admin-foreground)]">
            {t("settings.email.provider.title")}
          </h3>

          <p className="mt-1 admin-text-9 text-[var(--admin-muted)]">
            {t("settings.email.provider.description")}
          </p>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <ProviderOption
              icon={Send}
              title="Resend"
              description={t("settings.email.provider.resendDescription")}
              active={form.provider === EMAIL_PROVIDER.RESEND}
              onClick={() => updateField("provider", EMAIL_PROVIDER.RESEND)}
            />

            <ProviderOption
              icon={Server}
              title="SMTP"
              description={t("settings.email.provider.smtpDescription")}
              active={form.provider === EMAIL_PROVIDER.SMTP}
              onClick={() => updateField("provider", EMAIL_PROVIDER.SMTP)}
            />
          </div>
        </section>

        {/* SMTP */}

        {form.provider === EMAIL_PROVIDER.SMTP && (
          <section>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="admin-text-12 font-semibold text-[var(--admin-foreground)]">
                  {t("settings.email.smtp.title")}
                </h3>

                <p className="mt-1 admin-text-9 text-[var(--admin-muted)]">
                  {t("settings.email.smtp.description")}
                </p>
              </div>

              <div
                className={cn(
                  "inline-flex items-center gap-2",
                  "rounded-full",
                  "px-2.5 py-1",
                  "admin-text-8 font-semibold uppercase tracking-[0.08em]",

                  passwordConfigured
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-[var(--admin-hover)] text-[var(--admin-muted)]",
                )}
              >
                <ShieldCheck size={12} />

                {passwordConfigured
                  ? t("settings.email.smtp.passwordConfigured")
                  : t("settings.email.smtp.notConfigured")}
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <label>
                <div className="admin-text-10 font-medium text-[var(--admin-muted)]">
                  {t("settings.email.smtp.host")}
                </div>

                <input
                  type="text"
                  value={form.smtp.host}
                  onChange={(event) =>
                    updateSmtpField("host", event.target.value)
                  }
                  placeholder="smtp.example.com"
                  className="
                    mt-2
                    h-11
                    w-full
                    rounded-xl
                    border
                    border-[var(--admin-border)]
                    bg-[var(--admin-surface)]
                    px-3
                    admin-text-11
                    text-[var(--admin-foreground)]
                    outline-none
                    transition
                    focus:border-[var(--company-primary)]
                    focus:ring-2
                    focus:ring-[var(--company-primary-soft)]
                  "
                />
              </label>

              <label>
                <div className="admin-text-10 font-medium text-[var(--admin-muted)]">
                  {t("settings.email.smtp.port")}
                </div>

                <input
                  type="number"
                  min="1"
                  max="65535"
                  value={form.smtp.port}
                  onChange={(event) =>
                    updateSmtpField("port", event.target.value)
                  }
                  className="
                    mt-2
                    h-11
                    w-full
                    rounded-xl
                    border
                    border-[var(--admin-border)]
                    bg-[var(--admin-surface)]
                    px-3
                    admin-text-11
                    text-[var(--admin-foreground)]
                    outline-none
                    transition
                    focus:border-[var(--company-primary)]
                    focus:ring-2
                    focus:ring-[var(--company-primary-soft)]
                  "
                />
              </label>

              <label>
                <div className="admin-text-10 font-medium text-[var(--admin-muted)]">
                  {t("settings.email.smtp.security")}
                </div>

                <select
                  value={form.smtp.security}
                  onChange={(event) =>
                    updateSmtpField("security", event.target.value)
                  }
                  className="
                    mt-2
                    h-11
                    w-full
                    rounded-xl
                    border
                    border-[var(--admin-border)]
                    bg-[var(--admin-surface)]
                    px-3
                    admin-text-11
                    text-[var(--admin-foreground)]
                    outline-none
                    focus:border-[var(--company-primary)]
                  "
                >
                  <option value="starttls">STARTTLS</option>

                  <option value="tls">SSL / TLS</option>

                  <option value="none">None</option>
                </select>
              </label>

              <label>
                <div className="admin-text-10 font-medium text-[var(--admin-muted)]">
                  {t("settings.email.smtp.username")}
                </div>

                <input
                  type="text"
                  value={form.smtp.username}
                  onChange={(event) =>
                    updateSmtpField("username", event.target.value)
                  }
                  autoComplete="off"
                  className="
                    mt-2
                    h-11
                    w-full
                    rounded-xl
                    border
                    border-[var(--admin-border)]
                    bg-[var(--admin-surface)]
                    px-3
                    admin-text-11
                    text-[var(--admin-foreground)]
                    outline-none
                    focus:border-[var(--company-primary)]
                    focus:ring-2
                    focus:ring-[var(--company-primary-soft)]
                  "
                />
              </label>
            </div>

            <div className="mt-4">
              <label>
                <div className="admin-text-10 font-medium text-[var(--admin-muted)]">
                  {t("settings.email.smtp.password")}
                </div>

                <div className="relative mt-2">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={smtpPassword}
                    onChange={(event) => setSmtpPassword(event.target.value)}
                    autoComplete="new-password"
                    placeholder={
                      passwordConfigured
                        ? t("settings.email.smtp.passwordKeepPlaceholder")
                        : t("settings.email.smtp.passwordPlaceholder")
                    }
                    className="
                      h-11
                      w-full
                      rounded-xl
                      border
                      border-[var(--admin-border)]
                      bg-[var(--admin-surface)]
                      pl-3
                      pr-11
                      admin-text-11
                      text-[var(--admin-foreground)]
                      outline-none
                      transition
                      focus:border-[var(--company-primary)]
                      focus:ring-2
                      focus:ring-[var(--company-primary-soft)]
                    "
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="
                      absolute
                      right-1
                      top-1/2
                      flex
                      h-9
                      w-9
                      -translate-y-1/2
                      items-center
                      justify-center
                      rounded-lg
                      text-[var(--admin-muted)]
                      hover:bg-[var(--admin-hover)]
                    "
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={testSmtp}
                disabled={testing || saving}
                className="
                  inline-flex
                  h-10
                  items-center
                  gap-2
                  rounded-xl
                  border
                  border-[var(--admin-border)]
                  px-4
                  admin-text-10
                  font-semibold
                  text-[var(--admin-muted)]
                  transition
                  hover:border-[var(--company-primary-border)]
                  hover:bg-[var(--admin-hover)]
                  hover:text-[var(--company-primary)]
                  disabled:opacity-50
                "
              >
                {testing ? (
                  <LoaderCircle size={14} className="animate-spin" />
                ) : (
                  <Server size={14} />
                )}

                {t("settings.email.smtp.testConnection")}
              </button>

              <button
                type="button"
                onClick={sendTestEmail}
                disabled={sendingTest}
                className="
                  inline-flex
                  h-10
                  items-center
                  gap-2
                  rounded-xl
                  border
                  border-[var(--admin-border)]
                  px-4
                  admin-text-10
                  font-semibold
                  text-[var(--admin-muted)]
                  transition
                  hover:border-[var(--company-primary-border)]
                  hover:bg-[var(--admin-hover)]
                  hover:text-[var(--company-primary)]
                  disabled:opacity-50
                "
              >
                {sendingTest ? (
                  <LoaderCircle size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}

                {t("settings.email.smtp.sendTestEmail")}
              </button>
            </div>
          </section>
        )}

        {/* SENDER */}

        <section>
          <h3 className="admin-text-12 font-semibold text-[var(--admin-foreground)]">
            {t("settings.email.sender.title")}
          </h3>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <label>
              <div className="admin-text-10 font-medium text-[var(--admin-muted)]">
                {t("settings.email.sender.name")}
              </div>

              <input
                type="text"
                value={form.senderName}
                onChange={(event) =>
                  updateField("senderName", event.target.value)
                }
                placeholder={activeCompany?.name || "Junsekino"}
                className="
                  mt-2
                  h-11
                  w-full
                  rounded-xl
                  border
                  border-[var(--admin-border)]
                  bg-[var(--admin-surface)]
                  px-3
                  admin-text-11
                  text-[var(--admin-foreground)]
                  outline-none
                  focus:border-[var(--company-primary)]
                  focus:ring-2
                  focus:ring-[var(--company-primary-soft)]
                "
              />
            </label>

            <label>
              <div className="admin-text-10 font-medium text-[var(--admin-muted)]">
                {t("settings.email.sender.email")}
              </div>

              <input
                type="email"
                value={form.senderEmail}
                onChange={(event) =>
                  updateField("senderEmail", event.target.value)
                }
                placeholder="noreply@example.com"
                className="
                  mt-2
                  h-11
                  w-full
                  rounded-xl
                  border
                  border-[var(--admin-border)]
                  bg-[var(--admin-surface)]
                  px-3
                  admin-text-11
                  text-[var(--admin-foreground)]
                  outline-none
                  focus:border-[var(--company-primary)]
                  focus:ring-2
                  focus:ring-[var(--company-primary-soft)]
                "
              />
            </label>
          </div>

          <div className="mt-4">
            <label>
              <div className="admin-text-10 font-medium text-[var(--admin-muted)]">
                {t("settings.email.sender.replyTo")}
              </div>

              <input
                type="email"
                value={form.replyTo}
                onChange={(event) => updateField("replyTo", event.target.value)}
                placeholder="contact@example.com"
                className="
                  mt-2
                  h-11
                  w-full
                  rounded-xl
                  border
                  border-[var(--admin-border)]
                  bg-[var(--admin-surface)]
                  px-3
                  admin-text-11
                  text-[var(--admin-foreground)]
                  outline-none
                  focus:border-[var(--company-primary)]
                  focus:ring-2
                  focus:ring-[var(--company-primary-soft)]
                "
              />
            </label>
          </div>
        </section>

        {/* RECIPIENTS */}

        <section>
          <h3 className="admin-text-12 font-semibold text-[var(--admin-foreground)]">
            {t("settings.email.recipients.title")}
          </h3>

          <p className="mt-1 admin-text-9 text-[var(--admin-muted)]">
            {t("settings.email.recipients.description")}
          </p>

          <div className="mt-4 flex gap-2">
            <input
              type="email"
              value={recipientInput}
              onChange={(event) => setRecipientInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addRecipient();
                }
              }}
              placeholder="email@example.com"
              className="
                h-11
                min-w-0
                flex-1
                rounded-xl
                border
                border-[var(--admin-border)]
                bg-[var(--admin-surface)]
                px-3
                admin-text-11
                text-[var(--admin-foreground)]
                outline-none
                focus:border-[var(--company-primary)]
                focus:ring-2
                focus:ring-[var(--company-primary-soft)]
              "
            />

            <button
              type="button"
              onClick={addRecipient}
              className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-[var(--company-primary)]
                text-[var(--company-primary-foreground)]
              "
            >
              <Plus size={16} />
            </button>
          </div>

          {form.recipients.length > 0 && (
            <div className="mt-3 space-y-2">
              {form.recipients.map((email) => (
                <div
                  key={email}
                  className="
                      flex
                      items-center
                      justify-between
                      gap-3
                      rounded-xl
                      border
                      border-[var(--admin-border)]
                      px-3
                      py-2.5
                    "
                >
                  <span className="truncate admin-text-10 text-[var(--admin-foreground)]">
                    {email}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeRecipient(email)}
                    className="
                        flex
                        h-8
                        w-8
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                        text-red-400
                        hover:bg-red-50
                        hover:text-red-600
                      "
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECURITY NOTE */}

        <section
          className="
            flex
            gap-3
            rounded-2xl
            border
            border-[var(--admin-border)]
            bg-[var(--admin-background)]
            p-4
          "
        >
          <Info
            size={16}
            className="
              mt-0.5
              shrink-0
              text-[var(--company-primary)]
            "
          />

          <p className="admin-text-9 leading-[1.6] text-[var(--admin-muted)]">
            {t("settings.email.securityNote")}
          </p>
        </section>
      </div>

      {/* =================================
          FOOTER
      ================================= */}

      <div
        className="
          flex
          justify-end
          border-t
          border-[var(--admin-border)]
          px-5
          py-4
          sm:px-6
        "
      >
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="
            inline-flex
            h-10
            items-center
            gap-2
            rounded-xl
            bg-[var(--company-primary)]
            px-5
            admin-text-11
            font-semibold
            text-[var(--company-primary-foreground)]
            transition
            hover:bg-[var(--company-primary-hover)]
            disabled:opacity-50
          "
        >
          {saving ? (
            <LoaderCircle size={15} className="animate-spin" />
          ) : (
            <Save size={15} />
          )}

          {saving ? t("common.saving") : t("settings.email.save")}
        </button>
      </div>
    </div>
  );
}
