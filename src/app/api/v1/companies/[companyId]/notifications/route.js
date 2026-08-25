import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { companyIdSchema } from "@/modules/company/company.schema";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { listCompanyNotifications } from "@/modules/notification/notification.service";

export async function GET(request, context) {
  try {
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

    const data = await listCompanyNotifications({
      companyId: company.data,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("List notifications error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve notifications.",
      },
      {
        status: 500,
      },
    );
  }
}
