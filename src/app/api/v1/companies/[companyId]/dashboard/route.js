import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { DASHBOARD_DEFAULT_RANGE } from "@/constants/dashboard";

import { companyIdSchema } from "@/modules/company/company.schema";

import { dashboardRangeSchema } from "@/modules/dashboard/dashboard.schema";

import { getDashboardMetrics } from "@/modules/dashboard/dashboard.service";

import { getCompanyPermission } from "@/lib/auth/company-guards";

export const dynamic = "force-dynamic";

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

    const { searchParams } = new URL(request.url);

    const rawRange = searchParams.get("range") || DASHBOARD_DEFAULT_RANGE;

    const range = dashboardRangeSchema.safeParse(rawRange);

    if (!range.success) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid dashboard range.",
        },
        {
          status: 400,
        },
      );
    }

    const data = await getDashboardMetrics({
      companyId: company.data,

      range: range.data,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Dashboard metrics error:", error);

    return NextResponse.json(
      {
        success: false,

        message: "Unable to retrieve dashboard metrics.",
      },
      {
        status: 500,
      },
    );
  }
}
