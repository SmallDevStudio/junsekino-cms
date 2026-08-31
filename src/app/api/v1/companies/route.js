import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { createCompanySchema } from "@/modules/company/company.schema";

import {
  createCompany,
  getCompaniesForUser,
} from "@/modules/company/company.service";

export async function GET() {
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

    const companies = await getCompaniesForUser({
      currentUser,
    });

    return NextResponse.json({
      success: true,

      data: companies,
    });
  } catch (error) {
    console.error("List user companies error:", error);

    return NextResponse.json(
      {
        success: false,

        message: "Unable to retrieve available companies.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request) {
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

    const body = await request.json();

    const validation = createCompanySchema.safeParse(body);

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

    const company = await createCompany({
      input: validation.data,

      currentUser,
    });

    return NextResponse.json(
      {
        success: true,

        data: company,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Create company error:", error);

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

        message: "Unable to create company.",
      },
      {
        status: 500,
      },
    );
  }
}
