import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { companyIdSchema } from "@/modules/company/company.schema";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import {
  clearSmtpPassword,
  getSmtpPasswordStatus,
  saveSmtpPassword,
} from "@/modules/email/email-credential.service";

/*
 * =========================================================
 * ACCESS
 * =========================================================
 */

async function getAccess(context) {
  const params = await context.params;

  const parsed = companyIdSchema.safeParse(params.companyId);

  if (!parsed.success) {
    return {
      companyId: null,

      access: null,
    };
  }

  const access = await getCompanyPermission({
    companyId: parsed.data,

    permission: PERMISSIONS.COMPANY_UPDATE,
  });

  return {
    companyId: parsed.data,

    access,
  };
}

/*
 * =========================================================
 * GET STATUS
 * =========================================================
 */

export async function GET(request, context) {
  try {
    const { companyId, access } = await getAccess(context);

    if (!companyId) {
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

    const data = await getSmtpPasswordStatus({
      companyId,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("SMTP password status error:", error);

    return NextResponse.json(
      {
        success: false,

        message: "Unable to retrieve SMTP credential status.",
      },
      {
        status: 500,
      },
    );
  }
}

/*
 * =========================================================
 * PUT PASSWORD
 * =========================================================
 */

export async function PUT(request, context) {
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

    const { companyId, access } = await getAccess(context);

    if (!companyId) {
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

    const body = await request.json();

    const password = typeof body?.password === "string" ? body.password : "";

    const data = await saveSmtpPassword({
      companyId,

      password,

      userId: access.user.uid,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Save SMTP password error:", error);

    const known = {
      SMTP_PASSWORD_REQUIRED: [400, "SMTP password is required."],

      SMTP_PASSWORD_TOO_LONG: [400, "SMTP password is too long."],

      EMAIL_ENCRYPTION_KEY_NOT_CONFIGURED: [
        503,
        "Email credential encryption is not configured.",
      ],

      EMAIL_ENCRYPTION_KEY_INVALID: [
        500,
        "Email credential encryption configuration is invalid.",
      ],
    };

    if (known[error.message]) {
      const [status, message] = known[error.message];

      return NextResponse.json(
        {
          success: false,
          message,
        },
        {
          status,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,

        message: "Unable to save SMTP password.",
      },
      {
        status: 500,
      },
    );
  }
}

/*
 * =========================================================
 * DELETE PASSWORD
 * =========================================================
 */

export async function DELETE(request, context) {
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

    const { companyId, access } = await getAccess(context);

    if (!companyId) {
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

    const data = await clearSmtpPassword({
      companyId,

      userId: access.user.uid,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Clear SMTP password error:", error);

    return NextResponse.json(
      {
        success: false,

        message: "Unable to clear SMTP password.",
      },
      {
        status: 500,
      },
    );
  }
}
