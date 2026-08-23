import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { companyIdSchema } from "@/modules/company/company.schema";

import { publicContentIdSchema } from "@/modules/public-content/public-content.schema";

import { unpublishPublicContent } from "@/modules/public-content/public-content.service";

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

    const content = publicContentIdSchema.safeParse(params.contentId);

    if (!company.success || !content.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request parameters.",
        },
        {
          status: 400,
        },
      );
    }

    const access = await getCompanyPermission({
      companyId: company.data,

      permission: PERMISSIONS.PUBLIC_PUBLISH,
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

    const data = await unpublishPublicContent({
      companyId: company.data,

      contentId: content.data,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Unpublish public content error:", error);

    if (error.message === "PUBLIC_CONTENT_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          message: "Public content not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to unpublish public content.",
      },
      {
        status: 500,
      },
    );
  }
}
