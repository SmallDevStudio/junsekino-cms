import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { companyIdSchema } from "@/modules/company/company.schema";

import { peopleIdSchema } from "@/modules/people/people.schema";

import { publishPerson } from "@/modules/people/people.service";

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

    const person = peopleIdSchema.safeParse(params.peopleId);

    if (!company.success || !person.success) {
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

      permission: PERMISSIONS.PEOPLE_UPDATE,
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

    const result = await publishPerson({
      companyId: company.data,

      peopleId: person.data,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Publish people error:", error);

    if (error.message === "PEOPLE_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          message: "People record not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to publish people record.",
      },
      {
        status: 500,
      },
    );
  }
}
