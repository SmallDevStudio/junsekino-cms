"use client";

import {
  Archive,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Mail,
  ShieldAlert,
  X,
} from "lucide-react";

import { useState } from "react";

import { toast } from "sonner";

import { FORM_SUBMISSION_STATUS } from "@/constants/form";

function localized(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return value.en || value.th || "";
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function displayValue(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return String(value);
}

const ACTIONS = [
  {
    status: FORM_SUBMISSION_STATUS.IN_PROGRESS,
    label: "In Progress",
    icon: Clock3,
  },
  {
    status: FORM_SUBMISSION_STATUS.RESOLVED,
    label: "Resolved",
    icon: CheckCircle2,
  },
  {
    status: FORM_SUBMISSION_STATUS.ARCHIVED,
    label: "Archive",
    icon: Archive,
  },
  {
    status: FORM_SUBMISSION_STATUS.SPAM,
    label: "Spam",
    icon: ShieldAlert,
  },
];

export default function MessageDetailDrawer({
  open,
  companyId,
  submission,
  onClose,
  onUpdated,
}) {
  const [updating, setUpdating] = useState(false);

  if (!open || !submission) {
    return null;
  }

  const fields = Array.isArray(submission.fieldsSnapshot)
    ? submission.fieldsSnapshot.filter(
        (field) =>
          field?.enabled !== false &&
          !["heading", "paragraph"].includes(field?.type),
      )
    : [];

  async function updateStatus(status) {
    if (!companyId || !submission?.id || updating) {
      return;
    }

    try {
      setUpdating(true);

      const response = await fetch(
        `/api/v1/companies/${companyId}/form-submissions/${submission.id}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            status,
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || "Unable to update message.");
      }

      toast.success("Message status updated.");

      onUpdated?.(payload.data);
    } catch (error) {
      console.error("Update message status error:", error);

      toast.error(error?.message || "Unable to update message.");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[220] flex justify-end">
      <button
        type="button"
        onClick={updating ? undefined : onClose}
        aria-label="Close message"
        className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
      />

      <aside
        className="
          relative
          z-10
          flex
          h-full
          w-full
          max-w-[680px]
          flex-col
          bg-[var(--admin-surface)]
          shadow-2xl
        "
      >
        {/* HEADER */}

        <header className="flex min-h-20 shrink-0 items-center justify-between gap-4 border-b border-[var(--admin-border)] px-5 py-4 sm:px-7">
          <div className="min-w-0">
            <div className="admin-text-9 font-semibold uppercase tracking-[0.14em] text-[var(--company-primary)]">
              Form Submission
            </div>

            <h2 className="mt-1 truncate admin-text-17 font-semibold tracking-[-0.02em] text-[var(--admin-foreground)]">
              {localized(submission.formName) || "Message"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={updating}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--admin-muted)] transition hover:bg-[var(--admin-hover)] hover:text-[var(--admin-foreground)]"
          >
            <X size={17} />
          </button>
        </header>

        {/* BODY */}

        <div className="admin-sidebar-scrollbar-hide min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
          {/* STATUS */}

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex rounded-full bg-[var(--company-primary-soft)] px-2.5 py-1 admin-text-9 font-semibold uppercase tracking-[0.08em] text-[var(--company-primary)]">
              {String(submission.status || "new").replaceAll("_", " ")}
            </span>

            <span className="inline-flex rounded-full bg-[var(--admin-hover)] px-2.5 py-1 admin-text-9 text-[var(--admin-muted)]">
              {formatDate(submission.createdAt)}
            </span>
          </div>

          {/* FORM DATA */}

          <section className="mt-7">
            <div className="flex items-center gap-2">
              <Mail size={15} className="text-[var(--company-primary)]" />

              <h3 className="admin-text-13 font-semibold text-[var(--admin-foreground)]">
                Message Information
              </h3>
            </div>

            <div className="mt-4 divide-y divide-[var(--admin-border)] rounded-2xl border border-[var(--admin-border)]">
              {fields.map((field) => {
                const value = submission.values?.[field.id];

                return (
                  <div
                    key={field.id}
                    className="grid gap-2 px-4 py-4 sm:grid-cols-[150px_1fr]"
                  >
                    <div className="admin-text-10 font-medium text-[var(--admin-muted)]">
                      {localized(field.label) || field.id}
                    </div>

                    <div className="whitespace-pre-wrap break-words admin-text-11 leading-[1.7] text-[var(--admin-foreground)]">
                      {displayValue(value)}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* SOURCE */}

          <section className="mt-8">
            <h3 className="admin-text-13 font-semibold text-[var(--admin-foreground)]">
              Submission Details
            </h3>

            <div className="mt-4 space-y-3 rounded-2xl bg-[var(--admin-background)] p-4">
              <div className="grid gap-1 sm:grid-cols-[110px_1fr]">
                <span className="admin-text-9 text-[var(--admin-muted)]">
                  Form
                </span>

                <span className="break-all admin-text-10 text-[var(--admin-foreground)]">
                  {submission.formSlug || "—"}
                </span>
              </div>

              <div className="grid gap-1 sm:grid-cols-[110px_1fr]">
                <span className="admin-text-9 text-[var(--admin-muted)]">
                  Page
                </span>

                <span className="break-all admin-text-10 text-[var(--admin-foreground)]">
                  {submission.source?.pagePath || "—"}
                </span>
              </div>

              <div className="grid gap-1 sm:grid-cols-[110px_1fr]">
                <span className="admin-text-9 text-[var(--admin-muted)]">
                  Referrer
                </span>

                <span className="break-all admin-text-10 text-[var(--admin-foreground)]">
                  {submission.source?.referrer || "—"}
                </span>
              </div>

              <div className="grid gap-1 sm:grid-cols-[110px_1fr]">
                <span className="admin-text-9 text-[var(--admin-muted)]">
                  Received
                </span>

                <span className="admin-text-10 text-[var(--admin-foreground)]">
                  {formatDate(submission.createdAt)}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* ACTIONS */}

        <footer className="shrink-0 border-t border-[var(--admin-border)] bg-[var(--admin-surface)] px-5 py-4 sm:px-7">
          <div className="flex flex-wrap items-center justify-end gap-2">
            {ACTIONS.map((action) => {
              const Icon = action.icon;

              const active = submission.status === action.status;

              return (
                <button
                  key={action.status}
                  type="button"
                  disabled={updating || active}
                  onClick={() => updateStatus(action.status)}
                  className={`
                    inline-flex
                    h-9
                    items-center
                    gap-2
                    rounded-xl
                    px-3
                    admin-text-10
                    font-medium
                    transition
                    disabled:opacity-40
                    ${
                      active
                        ? "bg-[var(--company-primary-soft)] text-[var(--company-primary)]"
                        : "text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-foreground)]"
                    }
                  `}
                >
                  {updating ? (
                    <LoaderCircle size={13} className="animate-spin" />
                  ) : (
                    <Icon size={13} />
                  )}

                  {action.label}
                </button>
              );
            })}
          </div>
        </footer>
      </aside>
    </div>
  );
}
