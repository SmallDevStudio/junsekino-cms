import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { companyIdSchema } from "@/modules/company/company.schema";

import { pageIdSchema } from "@/modules/page/page.schema";

import { publishAboutPage } from "@/modules/page/about-page.service";

/*
 * =========================================================
 * PARAMS
 * =========================================================
 */

async function resolveParams(context) {
  const params = await context.params;

  const company = companyIdSchema.safeParse(params.companyId);

  const page = pageIdSchema.safeParse(params.pageId);

  if (!company.success || !page.success) {
    return null;
  }

  return {
    companyId: company.data,

    pageId: page.data,
  };
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

    const params = await resolveParams(context);

    if (!params) {
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
      companyId: params.companyId,

      permission: PERMISSIONS.PAGE_PUBLISH,
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

    const page = await publishAboutPage({
      companyId: params.companyId,

      pageId: params.pageId,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,

      data: page,
    });
  } catch (error) {
    console.error("Publish About error:", error);

    const badRequests = [
      "PAGE_TITLE_REQUIRED",
      "PAGE_CONTENT_REQUIRED",
      "PAGE_IS_NOT_ABOUT",
    ];

    if (badRequests.includes(error.message)) {
      return NextResponse.json(
        {
          success: false,

          message: error.message,
        },
        {
          status: 400,
        },
      );
    }

    if (error.message === "PAGE_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,

          message: "About version not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,

        message: "Unable to publish About page.",
      },
      {
        status: 500,
      },
    );
  }
}
