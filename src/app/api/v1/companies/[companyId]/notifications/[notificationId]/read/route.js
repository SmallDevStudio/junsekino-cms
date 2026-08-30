import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { companyIdSchema } from "@/modules/company/company.schema";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { markCompanyNotificationRead } from "@/modules/notification/notification.service";

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

    if (!company.success || !params.notificationId) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid notification.",
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

    const data = await markCompanyNotificationRead({
      companyId: company.data,

      notificationId: params.notificationId,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,

      data,
    });
  } catch (error) {
    console.error("Mark notification read error:", error);

    if (error.message === "NOTIFICATION_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,

          message: "Notification not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,

        message: "Unable to update notification.",
      },
      {
        status: 500,
      },
    );
  }
}
