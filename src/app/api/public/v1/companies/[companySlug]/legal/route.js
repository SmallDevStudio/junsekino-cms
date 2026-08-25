import { NextResponse } from "next/server";

import { companySlugSchema } from "@/modules/company/company-slug.schema";

import { resolvePublicCompany } from "@/modules/company/company-slug.service";

import { getPublicLegalDocuments } from "@/modules/legal/legal.service";

export const revalidate = 300;

export async function GET(request, context) {
  try {
    const params = await context.params;

    const validation = companySlugSchema.safeParse(params.companySlug);

    if (!validation.success) {
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

    const resolved = await resolvePublicCompany(validation.data);

    if (!resolved || resolved.redirect || !resolved.company) {
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

    const data = await getPublicLegalDocuments(resolved.company.id);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Public legal error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve legal documents.",
      },
      {
        status: 500,
      },
    );
  }
}
