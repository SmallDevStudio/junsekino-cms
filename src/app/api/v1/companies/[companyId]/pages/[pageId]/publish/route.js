import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { companyIdSchema } from "@/modules/company/company.schema";

import { pageIdSchema, publishPageSchema } from "@/modules/page/page.schema";

import { publishPage } from "@/modules/page/page.service";

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

    const body = await request.json();

    const validation = publishPageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid publish data.",
        },
        {
          status: 400,
        },
      );
    }

    const page = await publishPage({
      companyId: params.companyId,

      pageId: params.pageId,

      scheduledAt: validation.data.scheduledAt || null,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,
      data: page,
    });
  } catch (error) {
    console.error("Publish page error:", error);

    if (error.message === "PAGE_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          message: "Page not found.",
        },
        {
          status: 404,
        },
      );
    }

    const badRequests = [
      "PAGE_TITLE_REQUIRED",
      "PAGE_CONTENT_REQUIRED",
      "INVALID_SCHEDULE_DATE",
      "SCHEDULE_MUST_BE_FUTURE",
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

    return NextResponse.json(
      {
        success: false,
        message: "Unable to publish page.",
      },
      {
        status: 500,
      },
    );
  }
}
