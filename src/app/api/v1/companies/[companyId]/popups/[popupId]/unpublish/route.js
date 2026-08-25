import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { companyIdSchema } from "@/modules/company/company.schema";

import { popupIdSchema } from "@/modules/popup/popup.schema";

import { unpublishPopup } from "@/modules/popup/popup.service";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

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

    const popup = popupIdSchema.safeParse(params.popupId);

    if (!company.success || !popup.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request.",
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

    const data = await unpublishPopup({
      companyId: company.data,

      popupId: popup.data,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Publish popup error:", error);

    if (error.message?.startsWith("POPUP_")) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        {
          status: error.message === "POPUP_NOT_FOUND" ? 404 : 400,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to publish popup.",
      },
      {
        status: 500,
      },
    );
  }
}
