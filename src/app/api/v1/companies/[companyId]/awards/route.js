import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { AWARD_STATUSES } from "@/constants/award";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { companyIdSchema } from "@/modules/company/company.schema";

import { createAwardSchema } from "@/modules/award/award.schema";

import { createAward, listAwards } from "@/modules/award/award.service";

async function resolveCompanyId(context) {
  const params = await context.params;

  const result = companyIdSchema.safeParse(params.companyId);

  return result.success ? result.data : null;
}

export async function GET(request, context) {
  try {
    const companyId = await resolveCompanyId(context);

    if (!companyId) {
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

    const access = await getCompanyPermission({
      companyId,

      permission: PERMISSIONS.AWARD_VIEW,
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

    const status = searchParams.get("status");

    const search = searchParams.get("search");

    const projectId = searchParams.get("projectId");

    const year = searchParams.get("year");

    if (status && !AWARD_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid award status.",
        },
        {
          status: 400,
        },
      );
    }

    const awards = await listAwards({
      companyId,
      status,
      search,
      projectId,
      year,
    });

    return NextResponse.json({
      success: true,
      data: awards,
    });
  } catch (error) {
    console.error("List awards error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve awards.",
      },
      {
        status: 500,
      },
    );
  }
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

    const companyId = await resolveCompanyId(context);

    if (!companyId) {
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

    const access = await getCompanyPermission({
      companyId,

      permission: PERMISSIONS.AWARD_CREATE,
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

    const validation = createAwardSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid award data.",

          errors: validation.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    const award = await createAward({
      companyId,

      input: validation.data,

      currentUser: access.user,
    });

    return NextResponse.json(
      {
        success: true,
        data: award,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Create award error:", error);

    const errors = {
      AWARD_SLUG_EXISTS: [409, "Award slug is already in use."],

      AWARD_PROJECT_NOT_FOUND: [400, "Linked project not found."],

      AWARD_TITLE_REQUIRED: [400, "Award title is required."],

      AWARD_NAME_REQUIRED: [400, "Award name is required."],
    };

    if (errors[error.message]) {
      const [status, message] = errors[error.message];

      return NextResponse.json(
        {
          success: false,
          message,
        },
        {
          status,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create award.",
      },
      {
        status: 500,
      },
    );
  }
}
