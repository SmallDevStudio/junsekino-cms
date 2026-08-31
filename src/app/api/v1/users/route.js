import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";

import { companyIdSchema } from "@/modules/company/company.schema";

import { listPlatformUsers } from "@/modules/user/platform-user.service";

function resolveCompanyId(request) {
  const value = request.nextUrl.searchParams.get("companyId");

  if (!value) {
    return {
      success: true,

      companyId: null,
    };
  }

  const validation = companyIdSchema.safeParse(value);

  if (!validation.success) {
    return {
      success: false,

      companyId: null,
    };
  }

  return {
    success: true,

    companyId: validation.data,
  };
}

export async function GET(request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,

          message: "Authentication required.",
        },
        {
          status: 401,
        },
      );
    }

    if (!currentUser.isSuperAdmin) {
      return NextResponse.json(
        {
          success: false,

          message: "Superadmin permission required.",
        },
        {
          status: 403,
        },
      );
    }

    const company = resolveCompanyId(request);

    if (!company.success) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid company ID.",
        },
        {
          status: 400,
        },
      );
    }

    const users = await listPlatformUsers({
      companyId: company.companyId,
    });

    return NextResponse.json({
      success: true,

      data: users,

      meta: {
        companyId: company.companyId,

        total: users.length,
      },
    });
  } catch (error) {
    console.error("List platform users error:", error);

    return NextResponse.json(
      {
        success: false,

        message: "Unable to retrieve platform users.",
      },
      {
        status: 500,
      },
    );
  }
}
