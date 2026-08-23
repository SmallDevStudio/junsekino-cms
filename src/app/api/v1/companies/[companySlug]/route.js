import { NextResponse } from "next/server";

import { getPublicCompany } from "@/modules/public/public-company.service";

export const revalidate = 300;

export async function GET(request, context) {
  try {
    const params = await context.params;

    const companySlug = params.companySlug?.trim().toLowerCase();

    if (!companySlug) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid company.",
        },
        {
          status: 400,
        },
      );
    }

    const data = await getPublicCompany(companySlug);

    return NextResponse.json({
      success: true,

      data,
    });
  } catch (error) {
    console.error("Public company error:", error);

    if (error.message === "PUBLIC_COMPANY_NOT_FOUND") {
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
