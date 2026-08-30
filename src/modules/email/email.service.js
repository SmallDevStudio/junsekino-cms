import "server-only";

import { Resend } from "resend";

import { getCommunicationSettings } from "@/modules/settings/communication-settings.service";

import { createCompanySmtpTransport } from "./smtp.service";

/*
 * =========================================================
 * HELPERS
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

function resolveSender(emailSettings) {
  const senderEmail =
    emailSettings?.senderEmail?.trim() || process.env.EMAIL_FROM?.trim() || "";

  if (!senderEmail) {
    return "";
  }

  const senderName = emailSettings?.senderName?.trim() || "";

  /*
   * Environment variable may already contain:
   *
   * Junsekino <mail@example.com>
   */
  if (senderEmail.includes("<") && senderEmail.includes(">")) {
    return senderEmail;
  }

  if (!senderName) {
    return senderEmail;
  }

  return `${senderName} <${senderEmail}>`;
}

/*
 * =========================================================
 * RECIPIENTS
 * =========================================================
 */

function resolveRecipients({ emailSettings, form = null }) {
  const companyRecipients = Array.isArray(emailSettings?.recipients)
    ? emailSettings.recipients
        .map((item) => String(item).trim().toLowerCase())
        .filter(Boolean)
    : [];

  if (companyRecipients.length > 0) {
    return Array.from(new Set(companyRecipients));
  }

  /*
   * Legacy form-level recipients.
   */

  const formRecipients =
    form && Array.isArray(form.settings?.notificationEmails)
      ? form.settings.notificationEmails
          .map((item) => String(item).trim().toLowerCase())
          .filter(Boolean)
      : [];

  return Array.from(new Set(formRecipients));
}

/*
 * =========================================================
 * FORM EMAIL HTML
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
      const label = field.label?.en || field.label?.th || field.id;

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
        <meta charset="utf-8" />

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
            JUNSEKINO CMS
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
            A new submission was received from the website.
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
 * TEST EMAIL HTML
 * =========================================================
 */

function createTestEmailHtml({ companyName, provider }) {
  return `
    <!doctype html>

    <html>
      <head>
        <meta charset="utf-8" />
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
            max-width:640px;
            margin:0 auto;
            padding:48px 24px;
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
            JUNSEKINO CMS
          </div>

          <h2
            style="
              margin:14px 0 0;
              font-size:20px;
              font-weight:600;
            "
          >
            Email configuration test
          </h2>

          <p
            style="
              margin:14px 0 0;
              font-size:13px;
              line-height:1.8;
              color:#555555;
            "
          >
            This message confirms that email delivery for
            ${escapeHtml(companyName || "this company")}
            is working correctly.
          </p>

          <div
            style="
              margin-top:24px;
              padding:14px 16px;
              background:#f7f7f7;
              font-size:12px;
              color:#555555;
            "
          >
            Provider:
            <strong>
              ${escapeHtml(String(provider || "").toUpperCase())}
            </strong>
          </div>

          <p
            style="
              margin-top:28px;
              font-size:11px;
              color:#999999;
            "
          >
            Sent automatically from Junsekino CMS.
          </p>
        </div>
      </body>
    </html>
  `;
}

/*
 * =========================================================
 * SEND VIA RESEND
 * =========================================================
 */

async function sendWithResend({
  emailSettings,
  recipients,
  subject,
  html,
  idempotencyKey = null,
}) {
  const resend = getResend();

  const from = resolveSender(emailSettings);

  if (!resend || !from) {
    return {
      sent: false,

      skipped: "RESEND_NOT_CONFIGURED",
    };
  }

  const payload = {
    from,

    to: recipients,

    subject,

    html,
  };

  if (emailSettings?.replyTo?.trim()) {
    payload.replyTo = emailSettings.replyTo.trim();
  }

  const options = idempotencyKey
    ? {
        idempotencyKey,
      }
    : undefined;

  const { data, error } = await resend.emails.send(payload, options);

  if (error) {
    console.error("Resend email error:", error);

    return {
      sent: false,

      provider: "resend",

      error,
    };
  }

  return {
    sent: true,

    provider: "resend",

    emailId: data?.id || null,
  };
}

/*
 * =========================================================
 * SEND VIA SMTP
 * =========================================================
 */

async function sendWithSmtp({
  companyId,
  emailSettings,
  recipients,
  subject,
  html,
}) {
  const from = resolveSender(emailSettings);

  if (!from) {
    return {
      sent: false,

      skipped: "SENDER_NOT_CONFIGURED",
    };
  }

  const transport = await createCompanySmtpTransport({
    companyId,

    smtp: emailSettings.smtp,
  });

  const message = {
    from,

    to: recipients.join(", "),

    subject,

    html,
  };

  if (emailSettings?.replyTo?.trim()) {
    message.replyTo = emailSettings.replyTo.trim();
  }

  const info = await transport.sendMail(message);

  return {
    sent: true,

    provider: "smtp",

    emailId: info?.messageId || null,

    accepted: info?.accepted || [],

    rejected: info?.rejected || [],
  };
}

/*
 * =========================================================
 * PROVIDER ROUTER
 * =========================================================
 */

async function sendCompanyEmail({
  companyId,
  emailSettings,
  recipients,
  subject,
  html,
  idempotencyKey = null,
}) {
  const provider = emailSettings?.provider || "resend";

  if (provider === "smtp") {
    return sendWithSmtp({
      companyId,

      emailSettings,

      recipients,

      subject,

      html,
    });
  }

  if (provider === "resend") {
    return sendWithResend({
      emailSettings,

      recipients,

      subject,

      html,

      idempotencyKey,
    });
  }

  return {
    sent: false,

    skipped: "EMAIL_PROVIDER_UNSUPPORTED",
  };
}

/*
 * =========================================================
 * FORM SUBMISSION EMAIL
 * =========================================================
 */

export async function sendFormSubmissionEmail({ companyId, form, submission }) {
  const communication = await getCommunicationSettings({
    companyId,
  });

  const emailSettings = communication?.email || {};

  const notifications = communication?.notifications || {};

  const formSubmission = notifications?.events?.formSubmission || {};

  /*
   * Company email master switch.
   */

  if (emailSettings.enabled !== true) {
    return {
      sent: false,

      skipped: "COMPANY_EMAIL_DISABLED",
    };
  }

  /*
   * Notification email master switch.
   */

  if (notifications.email !== true) {
    return {
      sent: false,

      skipped: "NOTIFICATION_EMAIL_DISABLED",
    };
  }

  /*
   * Event-level switch.
   */

  if (formSubmission.email !== true) {
    return {
      sent: false,

      skipped: "FORM_SUBMISSION_EMAIL_DISABLED",
    };
  }

  /*
   * Legacy per-form switch.
   */

  if (form.settings?.sendEmailNotification === false) {
    return {
      sent: false,

      skipped: "FORM_EMAIL_DISABLED",
    };
  }

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

  const subject = `New submission: ${
    form.name?.en || form.name?.th || form.slug
  }`;

  const html = createFormEmailHtml({
    form,
    submission,
  });

  return sendCompanyEmail({
    companyId,

    emailSettings,

    recipients,

    subject,

    html,

    idempotencyKey: `form-submission/${submission.id}`,
  });
}

/*
 * =========================================================
 * SEND TEST EMAIL
 * =========================================================
 */

export async function sendCompanyTestEmail({
  companyId,
  companyName,
  recipient = null,
}) {
  const communication = await getCommunicationSettings({
    companyId,
  });

  const emailSettings = communication?.email || {};

  /*
   * Test Email intentionally does not require
   * notification event switches.
   *
   * It tests the provider configuration itself.
   */

  const recipients = recipient
    ? [String(recipient).trim().toLowerCase()]
    : resolveRecipients({
        emailSettings,
      });

  if (recipients.length === 0) {
    throw new Error("TEST_EMAIL_RECIPIENT_REQUIRED");
  }

  const subject = "Junsekino CMS - Email Test";

  const html = createTestEmailHtml({
    companyName,

    provider: emailSettings.provider,
  });

  const result = await sendCompanyEmail({
    companyId,

    emailSettings,

    recipients,

    subject,

    html,

    idempotencyKey: null,
  });

  if (result.sent !== true) {
    const reason = result.skipped || "TEST_EMAIL_FAILED";

    throw new Error(reason);
  }

  return {
    sent: true,

    provider: result.provider,

    emailId: result.emailId || null,

    recipients,
  };
}
