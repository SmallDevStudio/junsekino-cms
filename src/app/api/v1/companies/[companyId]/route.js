import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";

import { isTrustedOrigin } from "@/lib/auth/origin";

import {
  companyIdSchema,
  updateCompanySchema,
} from "@/modules/company/company.schema";

import {
  deleteCompany,
  getCompany,
  updateCompany,
} from "@/modules/company/company.service";

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
          message: "Permission denied.",
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

    const company = await getCompany(companyId);

    return NextResponse.json({
      success: true,
      data: company,
    });
  } catch (error) {
    console.error("Get company error:", error);

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
        message: "Unable to retrieve company.",
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
          message: "Super administrator permission required.",
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

    const body = await request.json();

    const validation = updateCompanySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid company data.",

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
          message: "No company data supplied.",
        },
        {
          status: 400,
        },
      );
    }

    const company = await updateCompany({
      companyId,

      input: validation.data,

      currentUser,
    });

    return NextResponse.json({
      success: true,
      data: company,
    });
  } catch (error) {
    console.error("Update company error:", error);

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

    if (error.message === "COMPANY_SLUG_EXISTS") {
      return NextResponse.json(
        {
          success: false,
          message: "This company slug is already in use.",
        },
        {
          status: 409,
        },
      );
    }

    if (error.message === "DEFAULT_LOCALE_NOT_SUPPORTED") {
      return NextResponse.json(
        {
          success: false,
          message: "Default locale must be included in supported locales.",
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update company.",
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
          message: "Super administrator permission required.",
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

    const result = await deleteCompany({
      companyId,
      currentUser,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Delete company error:", error);

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

    if (error.message === "COMPANY_ALREADY_DELETED") {
      return NextResponse.json(
        {
          success: false,
          message: "Company has already been deleted.",
        },
        {
          status: 409,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to delete company.",
      },
      {
        status: 500,
      },
    );
  }
}
