import { NextResponse } from "next/server";

import { companySlugSchema } from "@/modules/company/company-slug.schema";

import { resolvePublicCompany } from "@/modules/company/company-slug.service";

import { getPublicPopups } from "@/modules/popup/popup.service";

export const dynamic = "force-dynamic";

export async function GET(request, context) {
  try {
    const params = await context.params;

    const company = companySlugSchema.safeParse(params.companySlug);

    if (!company.success) {
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

    const resolved = await resolvePublicCompany(company.data);

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

    const { searchParams } = new URL(request.url);

    const pagePath = searchParams.get("page") || "/";

    const locale = searchParams.get("locale") === "en" ? "en" : "th";

    const data = await getPublicPopups({
      companyId: resolved.company.id,

      pagePath,

      locale,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Public popup error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve popups.",
      },
      {
        status: 500,
      },
    );
  }
}
