import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { companyIdSchema } from "@/modules/company/company.schema";

import { createMemberSchema } from "@/modules/user/membership.schema";

import {
  addCompanyMember,
  getCompanyMembers,
} from "@/modules/user/membership.service";

async function resolveCompanyId(context) {
  const params = await context.params;

  const validation = companyIdSchema.safeParse(params.companyId);

  if (!validation.success) {
    return null;
  }

  return validation.data;
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

      permission: PERMISSIONS.USER_VIEW,
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

    const members = await getCompanyMembers(companyId);

    return NextResponse.json({
      success: true,

      data: members,
    });
  } catch (error) {
    console.error("List members error:", error);

    return NextResponse.json(
      {
        success: false,

        message: "Unable to retrieve company members.",
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

      permission: PERMISSIONS.USER_CREATE,
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

    const validation = createMemberSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid member data.",

          errors: validation.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    const member = await addCompanyMember({
      companyId,

      input: validation.data,

      currentUser: access.user,
    });

    return NextResponse.json(
      {
        success: true,

        data: member,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Create member error:", error);

    if (error.message === "MEMBERSHIP_EXISTS") {
      return NextResponse.json(
        {
          success: false,

          message: "This user is already a member of the company.",
        },
        {
          status: 409,
        },
      );
    }

    if (error.message === "INVALID_CUSTOM_PERMISSION") {
      return NextResponse.json(
        {
          success: false,

          message: "One or more custom permissions are invalid for this role.",
        },
        {
          status: 400,
        },
      );
    }

    if (error.code === "auth/email-already-exists") {
      return NextResponse.json(
        {
          success: false,

          message: "This email address is already registered.",
        },
        {
          status: 409,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,

        message: "Unable to add company member.",
      },
      {
        status: 500,
      },
    );
  }
}
