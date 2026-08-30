"use client";

import {
  Bell,
  Check,
  Info,
  LoaderCircle,
  Mail,
  MessageSquareText,
  Save,
} from "lucide-react";

import { useCallback, useEffect, useState } from "react";

import { toast } from "sonner";

import { useCompanyWorkspace } from "@/components/admin/company/CompanyWorkspaceProvider";

import { cn } from "@/utils/cn";

/*
 * =========================================================
 * DEFAULT
 * =========================================================
 */

const EMPTY_SETTINGS = {
  inApp: true,

  email: false,

  events: {
    formSubmission: {
      inApp: true,

      email: false,
    },
  },
};

/*
 * =========================================================
 * CHANNEL
 * =========================================================
 */

function ChannelToggle({
  icon: Icon,
  title,
  description,
  enabled,
  disabled = false,
  onChange,
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (!disabled) {
          onChange(!enabled);
        }
      }}
      className={cn(
        "flex w-full items-center gap-4",

        "rounded-2xl",

        "border",

        "p-4",

        "text-left",

        "transition",

        enabled
          ? "border-[var(--company-primary-border)] bg-[var(--company-primary-soft)]"
          : "border-[var(--admin-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-hover)]",

        disabled && "cursor-not-allowed opacity-55",
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0",

          "items-center justify-center",

          "rounded-xl",

          enabled
            ? "bg-[var(--company-primary)] text-[var(--company-primary-foreground)]"
            : "bg-[var(--admin-background)] text-[var(--admin-muted)]",
        )}
      >
        <Icon size={16} strokeWidth={1.8} />
      </span>

      <span className="min-w-0 flex-1">
        <span
          className="
            block

            admin-text-11
            font-semibold

            text-[var(--admin-foreground)]
          "
        >
          {title}
        </span>

        <span
          className="
            mt-1
            block

            admin-text-9
            leading-[1.5]

            text-[var(--admin-muted)]
          "
        >
          {description}
        </span>
      </span>

      <span
        className={cn(
          "flex h-6 w-6 shrink-0",

          "items-center justify-center",

          "rounded-full",

          "border",

          enabled
            ? "border-[var(--company-primary)] bg-[var(--company-primary)] text-[var(--company-primary-foreground)]"
            : "border-[var(--admin-border)] text-transparent",
        )}
      >
        <Check size={12} strokeWidth={2.2} />
      </span>
    </button>
  );
}

/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

export default function NotificationSettings() {
  const {
    activeCompany,
    activeCompanyId,
    loading: companyLoading,
  } = useCompanyWorkspace();

  const [form, setForm] = useState(EMPTY_SETTINGS);

  const [lineEnabled, setLineEnabled] = useState(false);

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  /*
   * =======================================================
   * LOAD
   * =======================================================
   */

  const loadSettings = useCallback(async () => {
    if (!activeCompanyId) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `/api/v1/companies/${activeCompanyId}/settings/communication`,
        {
          method: "GET",

          cache: "no-store",

          credentials: "include",
        },
      );

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.message || "Unable to retrieve notification settings.",
        );
      }

      const notifications = payload?.data?.notifications || EMPTY_SETTINGS;

      setForm({
        inApp: notifications.inApp !== false,

        email: notifications.email === true,

        events: {
          formSubmission: {
            inApp: notifications.events?.formSubmission?.inApp !== false,

            email: notifications.events?.formSubmission?.email === true,
          },
        },
      });

      setLineEnabled(payload?.data?.integrations?.line?.enabled === true);
    } catch (error) {
      console.error("Load notification settings error:", error);

      toast.error(
        error?.message || "Unable to retrieve notification settings.",
      );
    } finally {
      setLoading(false);
    }
  }, [activeCompanyId]);

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
   * EVENT
   * =======================================================
   */

  function updateFormSubmission(channel, value) {
    setForm((current) => ({
      ...current,

      events: {
        ...current.events,

        formSubmission: {
          ...current.events.formSubmission,

          [channel]: value,
        },
      },
    }));
  }

  /*
   * =======================================================
   * SAVE
   * =======================================================
   */

  async function handleSave() {
    if (!activeCompanyId || saving) {
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `/api/v1/companies/${activeCompanyId}/settings/communication`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            notifications: form,

            integrations: {
              line: {
                enabled: lineEnabled,
              },
            },
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.message || "Unable to save notification settings.",
        );
      }

      toast.success("Notification settings saved.");
    } catch (error) {
      console.error("Save notification settings error:", error);

      toast.error(error?.message || "Unable to save notification settings.");
    } finally {
      setSaving(false);
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
          min-h-[360px]

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
      {/* HEADER */}

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
          <Bell size={17} />
        </div>

        <div>
          <h2
            className="
              admin-text-16
              font-semibold

              text-[var(--admin-foreground)]
            "
          >
            Notifications
          </h2>

          <p
            className="
              mt-1

              admin-text-10
              leading-[1.6]

              text-[var(--admin-muted)]
            "
          >
            Choose how website activity should notify your team.
          </p>
        </div>
      </div>

      <div
        className="
          space-y-8

          px-5
          py-6

          sm:px-6
        "
      >
        {/* GLOBAL CHANNEL */}

        <section>
          <h3
            className="
              admin-text-12
              font-semibold

              text-[var(--admin-foreground)]
            "
          >
            Notification Channels
          </h3>

          <p
            className="
              mt-1

              admin-text-9

              text-[var(--admin-muted)]
            "
          >
            Control the communication channels available to this company.
          </p>

          <div
            className="
              mt-4

              grid
              gap-3

              lg:grid-cols-2
            "
          >
            <ChannelToggle
              icon={Bell}
              title="In-App"
              description="Show activity in the CMS notification center."
              enabled={form.inApp}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,

                  inApp: value,
                }))
              }
            />

            <ChannelToggle
              icon={Mail}
              title="Email"
              description="Allow notification events to be delivered by email."
              enabled={form.email}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,

                  email: value,
                }))
              }
            />
          </div>
        </section>

        {/* EVENTS */}

        <section>
          <h3
            className="
              admin-text-12
              font-semibold

              text-[var(--admin-foreground)]
            "
          >
            Events
          </h3>

          <p
            className="
              mt-1

              admin-text-9

              text-[var(--admin-muted)]
            "
          >
            Choose how individual website events are delivered.
          </p>

          <div
            className="
              mt-4

              rounded-2xl

              border
              border-[var(--admin-border)]

              p-4
            "
          >
            <div
              className="
                flex
                items-start
                gap-3
              "
            >
              <div
                className="
                  flex
                  h-9
                  w-9
                  shrink-0

                  items-center
                  justify-center

                  rounded-xl

                  bg-[var(--company-primary-soft)]

                  text-[var(--company-primary)]
                "
              >
                <MessageSquareText size={15} />
              </div>

              <div className="min-w-0 flex-1">
                <div
                  className="
                    admin-text-11
                    font-semibold

                    text-[var(--admin-foreground)]
                  "
                >
                  Form Submission
                </div>

                <div
                  className="
                    mt-1

                    admin-text-9

                    text-[var(--admin-muted)]
                  "
                >
                  Contact messages, survey responses, job applications and other
                  form submissions.
                </div>

                <div
                  className="
                    mt-4

                    flex
                    flex-wrap
                    gap-2
                  "
                >
                  <button
                    type="button"
                    disabled={!form.inApp}
                    onClick={() =>
                      updateFormSubmission(
                        "inApp",

                        !form.events.formSubmission.inApp,
                      )
                    }
                    className={cn(
                      "inline-flex items-center gap-2",

                      "rounded-xl",

                      "border",

                      "px-3 py-2",

                      "admin-text-9",

                      "transition",

                      form.events.formSubmission.inApp
                        ? "border-[var(--company-primary-border)] bg-[var(--company-primary-soft)] text-[var(--company-primary)]"
                        : "border-[var(--admin-border)] text-[var(--admin-muted)]",

                      !form.inApp && "cursor-not-allowed opacity-40",
                    )}
                  >
                    <Bell size={12} />
                    In-App
                  </button>

                  <button
                    type="button"
                    disabled={!form.email}
                    onClick={() =>
                      updateFormSubmission(
                        "email",

                        !form.events.formSubmission.email,
                      )
                    }
                    className={cn(
                      "inline-flex items-center gap-2",

                      "rounded-xl",

                      "border",

                      "px-3 py-2",

                      "admin-text-9",

                      "transition",

                      form.events.formSubmission.email
                        ? "border-[var(--company-primary-border)] bg-[var(--company-primary-soft)] text-[var(--company-primary)]"
                        : "border-[var(--admin-border)] text-[var(--admin-muted)]",

                      !form.email && "cursor-not-allowed opacity-40",
                    )}
                  >
                    <Mail size={12} />
                    Email
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FUTURE INTEGRATIONS */}

        <section>
          <h3
            className="
              admin-text-12
              font-semibold

              text-[var(--admin-foreground)]
            "
          >
            Integrations
          </h3>

          <div className="mt-4">
            <ChannelToggle
              icon={MessageSquareText}
              title="LINE"
              description="LINE notifications are reserved for a future integration."
              enabled={lineEnabled}
              disabled
              onChange={setLineEnabled}
            />
          </div>
        </section>

        {/* NOTE */}

        <div
          className="
            flex
            gap-3

            rounded-2xl

            bg-[var(--admin-background)]

            p-4
          "
        >
          <Info
            size={15}
            className="
              mt-0.5
              shrink-0

              text-[var(--company-primary)]
            "
          />

          <p
            className="
              admin-text-9
              leading-[1.65]

              text-[var(--admin-muted)]
            "
          >
            Channel settings determine which notification methods are available.
            Event settings decide which channels are used for each event.
          </p>
        </div>
      </div>

      {/* FOOTER */}

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

          {saving ? "Saving..." : "Save Notification Settings"}
        </button>
      </div>
    </div>
  );
}
