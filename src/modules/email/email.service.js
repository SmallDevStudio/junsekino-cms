import "server-only";

import { Resend } from "resend";

import { getCommunicationSettings } from "@/modules/settings/communication-settings.service";

/*
 * =========================================================
 * HTML
 * =========================================================
 */

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/*
 * =========================================================
 * VALUE
 * =========================================================
 */

function formatValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(", ");
  }

  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value ?? "");
}

/*
 * =========================================================
 * EMAIL HTML
 * =========================================================
 */

function createFormEmailHtml({ form, submission }) {
  const fields = form.fields || [];

  const rows = fields
    .filter(
      (field) =>
        field.enabled !== false &&
        !["heading", "paragraph"].includes(field.type),
    )
    .map((field) => {
      const label = field.label?.th || field.label?.en || field.id;

      const value = submission.values?.[field.id];

      return `
        <tr>
          <td
            style="
              width:190px;
              padding:10px 12px;
              border-bottom:1px solid #eeeeee;
              font-weight:600;
              vertical-align:top;
            "
          >
            ${escapeHtml(label)}
          </td>

          <td
            style="
              padding:10px 12px;
              border-bottom:1px solid #eeeeee;
              white-space:pre-wrap;
              word-break:break-word;
            "
          >
            ${escapeHtml(formatValue(value))}
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <!doctype html>

    <html>
      <head>
        <meta
          charset="utf-8"
        />

        <meta
          name="viewport"
          content="width=device-width,initial-scale=1"
        />
      </head>

      <body
        style="
          margin:0;
          padding:0;
          background:#ffffff;
          font-family:Arial,Helvetica,sans-serif;
          color:#111111;
        "
      >
        <div
          style="
            max-width:760px;
            margin:0 auto;
            padding:40px 24px;
          "
        >
          <div
            style="
              font-size:11px;
              letter-spacing:.14em;
              text-transform:uppercase;
              color:#777777;
            "
          >
            Junsekino CMS
          </div>

          <h2
            style="
              margin:12px 0 0;
              font-size:20px;
              font-weight:600;
              line-height:1.4;
            "
          >
            ${escapeHtml(
              form.name?.en || form.name?.th || "New Form Submission",
            )}
          </h2>

          <p
            style="
              margin:10px 0 24px;
              color:#666666;
              font-size:13px;
              line-height:1.7;
            "
          >
            A new submission was received from the Junsekino website.
          </p>

          <table
            style="
              width:100%;
              border-collapse:collapse;
              font-size:13px;
              line-height:1.6;
            "
          >
            ${rows}
          </table>

          <div
            style="
              margin-top:28px;
              padding-top:16px;
              border-top:1px solid #eeeeee;
              color:#888888;
              font-size:11px;
              line-height:1.6;
            "
          >
            Submission ID:
            ${escapeHtml(submission.id)}
          </div>
        </div>
      </body>
    </html>
  `;
}

/*
 * =========================================================
 * RESEND
 * =========================================================
 */

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new Resend(apiKey);
}

/*
 * =========================================================
 * SENDER
 * =========================================================
 */

function resolveSender({ emailSettings }) {
  /*
   * Company-level sender email takes priority.
   *
   * IMPORTANT:
   * The address must belong to a domain verified
   * with the configured Resend account.
   */

  const senderEmail =
    emailSettings?.senderEmail?.trim() || process.env.EMAIL_FROM?.trim() || "";

  if (!senderEmail) {
    return "";
  }

  const senderName = emailSettings?.senderName?.trim();

  if (!senderName) {
    return senderEmail;
  }

  /*
   * If EMAIL_FROM already contains:
   *
   * Junsekino <mail@example.com>
   *
   * don't wrap it again.
   */

  if (senderEmail.includes("<") && senderEmail.includes(">")) {
    return senderEmail;
  }

  return `${senderName} <${senderEmail}>`;
}

/*
 * =========================================================
 * RECIPIENTS
 * =========================================================
 */

function resolveRecipients({ emailSettings, form }) {
  /*
   * New company-level settings take priority.
   */

  const companyRecipients = Array.isArray(emailSettings?.recipients)
    ? emailSettings.recipients
        .map((item) => String(item).trim().toLowerCase())
        .filter(Boolean)
    : [];

  if (companyRecipients.length > 0) {
    return Array.from(new Set(companyRecipients));
  }

  /*
   * Backward compatibility:
   *
   * Existing forms may already contain
   * notificationEmails.
   */

  const legacyRecipients = Array.isArray(form.settings?.notificationEmails)
    ? form.settings.notificationEmails
        .map((item) => String(item).trim().toLowerCase())
        .filter(Boolean)
    : [];

  return Array.from(new Set(legacyRecipients));
}

/*
 * =========================================================
 * FORM SUBMISSION EMAIL
 * =========================================================
 */

export async function sendFormSubmissionEmail({ companyId, form, submission }) {
  /*
   * =======================================================
   * COMMUNICATION SETTINGS
   * =======================================================
   */

  const communication = await getCommunicationSettings({
    companyId,
  });

  const emailSettings = communication?.email || {};

  const notifications = communication?.notifications || {};

  const formSubmission = notifications?.events?.formSubmission || {};

  /*
   * Email provider/channel disabled.
   */

  if (emailSettings.enabled !== true) {
    return {
      sent: false,

      skipped: "COMPANY_EMAIL_DISABLED",
    };
  }

  /*
   * Notification email channel disabled globally.
   */

  if (notifications.email !== true) {
    return {
      sent: false,

      skipped: "NOTIFICATION_EMAIL_DISABLED",
    };
  }

  /*
   * Form Submission event email disabled.
   */

  if (formSubmission.email !== true) {
    return {
      sent: false,

      skipped: "FORM_SUBMISSION_EMAIL_DISABLED",
    };
  }

  /*
   * Keep legacy Form Core switch.
   *
   * A form that explicitly disables its own email
   * should still be respected.
   *
   * However, undefined is allowed because new
   * Communication Settings are now authoritative.
   */

  if (form.settings?.sendEmailNotification === false) {
    return {
      sent: false,

      skipped: "FORM_EMAIL_DISABLED",
    };
  }

  /*
   * =======================================================
   * RECIPIENTS
   * =======================================================
   */

  const recipients = resolveRecipients({
    emailSettings,

    form,
  });

  if (recipients.length === 0) {
    return {
      sent: false,

      skipped: "NO_RECIPIENTS",
    };
  }

  /*
   * =======================================================
   * PROVIDER
   * =======================================================
   */

  const resend = getResend();

  const from = resolveSender({
    emailSettings,
  });

  if (!resend || !from) {
    console.warn(
      "Form email notification skipped: RESEND_API_KEY or sender email is not configured.",
    );

    return {
      sent: false,

      skipped: "EMAIL_NOT_CONFIGURED",
    };
  }

  /*
   * =======================================================
   * SUBJECT
   * =======================================================
   */

  const subject = `New submission: ${
    form.name?.en || form.name?.th || form.slug
  }`;

  /*
   * =======================================================
   * SEND
   * =======================================================
   */

  const emailPayload = {
    from,

    to: recipients,

    subject,

    html: createFormEmailHtml({
      form,

      submission,
    }),
  };

  /*
   * Optional Reply-To.
   */

  if (emailSettings?.replyTo?.trim()) {
    emailPayload.replyTo = emailSettings.replyTo.trim();
  }

  const { data, error } = await resend.emails.send(emailPayload, {
    /*
     * One outgoing email per submission.
     *
     * Prevents accidental duplicate sends
     * during retries.
     */
    idempotencyKey: `form-submission/${submission.id}`,
  });

  if (error) {
    console.error("Resend email error:", error);

    return {
      sent: false,

      error,
    };
  }

  return {
    sent: true,

    emailId: data?.id || null,
  };
}
