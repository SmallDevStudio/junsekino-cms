import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { companyIdSchema } from "@/modules/company/company.schema";

import { updateCompanySlugSchema } from "@/modules/company/company-slug.schema";

import {
  assignCompanySlug,
  updateCompanySlug,
} from "@/modules/company/company-slug.service";

async function resolveCompanyId(context) {
  const params = await context.params;

  const validation = companyIdSchema.safeParse(params.companyId);

  return validation.success ? validation.data : null;
}

/*
 * POST
 *
 * First-time slug reservation / repair.
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

    const body = await request.json();

    const validation = updateCompanySlugSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid company slug.",

          errors: validation.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    const result = await assignCompanySlug({
      companyId,

      slug: validation.data.slug,

      currentUser: access.user,
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Assign company slug error:", error);

    if (error.message === "COMPANY_SLUG_EXISTS") {
      return NextResponse.json(
        {
          success: false,

          message: "This company URL is already in use.",
        },
        {
          status: 409,
        },
      );
    }

    if (error.message === "COMPANY_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          message: "Company not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,

        message: "Unable to assign company slug.",
      },
      {
        status: 500,
      },
    );
  }
}

/*
 * PATCH
 *
 * Change an existing company URL.
 */

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

    const body = await request.json();

    const validation = updateCompanySlugSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid company slug.",

          errors: validation.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    const result = await updateCompanySlug({
      companyId,

      slug: validation.data.slug,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,

      data: result,
    });
  } catch (error) {
    console.error("Update company slug error:", error);

    if (error.message === "COMPANY_SLUG_EXISTS") {
      return NextResponse.json(
        {
          success: false,

          message: "This company URL is already in use.",
        },
        {
          status: 409,
        },
      );
    }

    if (error.message === "COMPANY_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          message: "Company not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,

        message: "Unable to update company slug.",
      },
      {
        status: 500,
      },
    );
  }
}
