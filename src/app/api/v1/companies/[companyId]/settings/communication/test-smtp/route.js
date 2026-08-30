import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { companyIdSchema } from "@/modules/company/company.schema";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { getCommunicationSettings } from "@/modules/settings/communication-settings.service";

import { verifyCompanySmtp } from "@/modules/email/smtp.service";

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

    const settings = await getCommunicationSettings({
      companyId: company.data,
    });

    if (settings.email?.provider !== "smtp") {
      return NextResponse.json(
        {
          success: false,

          message: "SMTP is not the selected email provider.",
        },
        {
          status: 400,
        },
      );
    }

    await verifyCompanySmtp({
      companyId: company.data,

      smtp: settings.email.smtp,
    });

    return NextResponse.json({
      success: true,

      data: {
        connected: true,
      },
    });
  } catch (error) {
    console.error("SMTP connection test error:", error);

    return NextResponse.json(
      {
        success: false,

        message: "Unable to connect to the SMTP server.",

        code: error?.code || error?.message || "SMTP_CONNECTION_FAILED",
      },
      {
        status: 400,
      },
    );
  }
}
