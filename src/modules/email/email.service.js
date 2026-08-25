import "server-only";

import { Resend } from "resend";

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
                  padding:8px 12px;
                  border-bottom:1px solid #eee;
                  font-weight:600;
                  vertical-align:top;
                "
              >
                ${escapeHtml(label)}
              </td>

              <td
                style="
                  padding:8px 12px;
                  border-bottom:1px solid #eee;
                  white-space:pre-wrap;
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
      <body
        style="
          font-family:Arial,sans-serif;
          color:#111;
        "
      >
        <h2>
          ${escapeHtml(form.name?.th || form.name?.en || "New Form Submission")}
        </h2>

        <p>
          A new submission was received from the Junsekino website.
        </p>

        <table
          style="
            width:100%;
            max-width:700px;
            border-collapse:collapse;
          "
        >
          ${rows}
        </table>

        <p
          style="
            margin-top:24px;
            color:#777;
            font-size:12px;
          "
        >
          Submission ID:
          ${escapeHtml(submission.id)}
        </p>
      </body>
    </html>
  `;
}

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new Resend(apiKey);
}

export async function sendFormSubmissionEmail({ form, submission }) {
  if (form.settings?.sendEmailNotification !== true) {
    return {
      sent: false,
      skipped: "FORM_EMAIL_DISABLED",
    };
  }

  const recipients = (form.settings?.notificationEmails || []).filter(Boolean);

  if (recipients.length === 0) {
    return {
      sent: false,
      skipped: "NO_RECIPIENTS",
    };
  }

  const from = process.env.EMAIL_FROM;

  const resend = getResend();

  if (!resend || !from) {
    console.warn(
      "Form email notification skipped: RESEND_API_KEY or EMAIL_FROM is not configured.",
    );

    return {
      sent: false,
      skipped: "EMAIL_NOT_CONFIGURED",
    };
  }

  const subject = `New submission: ${
    form.name?.en || form.name?.th || form.slug
  }`;

  const { data, error } = await resend.emails.send(
    {
      from,

      to: recipients,

      subject,

      html: createFormEmailHtml({
        form,
        submission,
      }),
    },
    {
      idempotencyKey: `form-submission/${submission.id}`,
    },
  );

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
