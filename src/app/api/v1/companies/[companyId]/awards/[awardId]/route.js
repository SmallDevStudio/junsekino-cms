import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { companyIdSchema } from "@/modules/company/company.schema";

import { awardIdSchema, updateAwardSchema } from "@/modules/award/award.schema";

import {
  deleteAward,
  getAward,
  updateAward,
} from "@/modules/award/award.service";

async function resolveParams(context) {
  const params = await context.params;

  const company = companyIdSchema.safeParse(params.companyId);

  const award = awardIdSchema.safeParse(params.awardId);

  if (!company.success || !award.success) {
    return null;
  }

  return {
    companyId: company.data,

    awardId: award.data,
  };
}

export async function GET(request, context) {
  try {
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

    const award = await getAward({
      companyId: params.companyId,

      awardId: params.awardId,
    });

    return NextResponse.json({
      success: true,
      data: award,
    });
  } catch (error) {
    console.error("Get award error:", error);

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
        message: "Unable to retrieve award.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(request, context) {
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

      permission: PERMISSIONS.AWARD_UPDATE,
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

    const validation = updateAwardSchema.safeParse(body);

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

    if (Object.keys(validation.data).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No award data supplied.",
        },
        {
          status: 400,
        },
      );
    }

    const award = await updateAward({
      companyId: params.companyId,

      awardId: params.awardId,

      input: validation.data,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,
      data: award,
    });
  } catch (error) {
    console.error("Update award error:", error);

    const errors = {
      AWARD_NOT_FOUND: [404, "Award not found."],

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
        message: "Unable to update award.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(request, context) {
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

      permission: PERMISSIONS.AWARD_DELETE,
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

    const result = await deleteAward({
      companyId: params.companyId,

      awardId: params.awardId,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Delete award error:", error);

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

    if (error.message === "AWARD_ALREADY_DELETED") {
      return NextResponse.json(
        {
          success: false,
          message: "Award has already been deleted.",
        },
        {
          status: 409,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to delete award.",
      },
      {
        status: 500,
      },
    );
  }
}
