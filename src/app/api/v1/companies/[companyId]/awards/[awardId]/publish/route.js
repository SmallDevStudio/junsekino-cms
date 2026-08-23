import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { companyIdSchema } from "@/modules/company/company.schema";

import {
  awardIdSchema,
  publishAwardSchema,
} from "@/modules/award/award.schema";

import { publishAward } from "@/modules/award/award.service";

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

    const award = awardIdSchema.safeParse(params.awardId);

    if (!company.success || !award.success) {
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

      permission: PERMISSIONS.AWARD_PUBLISH,
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

    const validation = publishAwardSchema.safeParse(body);

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

    const result = await publishAward({
      companyId: company.data,

      awardId: award.data,

      scheduledAt: validation.data.scheduledAt || null,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Publish award error:", error);

    const badRequests = [
      "AWARD_TITLE_REQUIRED",
      "AWARD_NAME_REQUIRED",
      "AWARD_PROJECT_NOT_FOUND",
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

    if (error.message === "AWARD_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          message: "Award not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to publish award.",
      },
      {
        status: 500,
      },
    );
  }
}
