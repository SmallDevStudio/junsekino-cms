import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { companyIdSchema } from "@/modules/company/company.schema";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { sendCompanyTestEmail } from "@/modules/email/email.service";

/*
 * =========================================================
 * EMAIL
 * =========================================================
 */

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

/*
 * =========================================================
 * POST
 * =========================================================
 */

export async function POST(request, context) {
  try {
    if (!isTrustedOrigin(request)) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid request origin.",
        },
        {
          status: 403,
        },
      );
    }

    const params = await context.params;

    const company = companyIdSchema.safeParse(params.companyId);

    if (!company.success) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid company.",
        },
        {
          status: 400,
        },
      );
    }

    const access = await getCompanyPermission({
      companyId: company.data,

      permission: PERMISSIONS.COMPANY_UPDATE,
    });

    if (!access.authorized) {
      return NextResponse.json(
        {
          success: false,

          message: access.reason,
        },
        {
          status: access.user ? 403 : 401,
        },
      );
    }

    let body = {};

    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const recipient = String(body?.recipient || "").trim();

    if (recipient && !isValidEmail(recipient)) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid test email recipient.",
        },
        {
          status: 400,
        },
      );
    }

    const result = await sendCompanyTestEmail({
      companyId: company.data,

      companyName: access.company?.name || access.company?.legalName || "",

      recipient: recipient || null,
    });

    return NextResponse.json({
      success: true,

      data: result,
    });
  } catch (error) {
    console.error("Send test email error:", error);

    const knownErrors = {
      TEST_EMAIL_RECIPIENT_REQUIRED: {
        status: 400,

        message:
          "Add at least one email recipient before sending a test email.",
      },

      SMTP_HOST_REQUIRED: {
        status: 400,

        message: "SMTP server is required.",
      },

      SMTP_PORT_REQUIRED: {
        status: 400,

        message: "SMTP port is required.",
      },

      EMAIL_ENCRYPTION_KEY_NOT_CONFIGURED: {
        status: 503,

        message: "SMTP credential encryption is not configured.",
      },

      EMAIL_ENCRYPTION_KEY_INVALID: {
        status: 500,

        message: "SMTP credential encryption configuration is invalid.",
      },

      RESEND_NOT_CONFIGURED: {
        status: 503,

        message: "Resend is not configured.",
      },

      SENDER_NOT_CONFIGURED: {
        status: 400,

        message: "Sender email is not configured.",
      },

      EMAIL_PROVIDER_UNSUPPORTED: {
        status: 400,

        message: "Unsupported email provider.",
      },
    };

    if (knownErrors[error.message]) {
      const known = knownErrors[error.message];

      return NextResponse.json(
        {
          success: false,

          code: error.message,

          message: known.message,
        },
        {
          status: known.status,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,

        code: error?.code || "TEST_EMAIL_FAILED",

        message: "Unable to send test email.",
      },
      {
        status: 400,
      },
    );
  }
}
