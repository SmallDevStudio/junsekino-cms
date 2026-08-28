import { NextResponse } from "next/server";

import { companySlugSchema } from "@/modules/company/company-slug.schema";

import { resolvePublicCompany } from "@/modules/company/company-slug.service";

import { getPublicAboutPage } from "@/modules/public/public-about.service";

export const revalidate = 300;

/*
 * =========================================================
 * GET
 * =========================================================
 */

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

    const companySlug = validation.data;

    const resolved = await resolvePublicCompany(companySlug);

    if (!resolved) {
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

    if (resolved.redirect) {
      return NextResponse.json({
        success: true,

        redirect: true,

        redirectTo: resolved.redirectTo,
      });
    }

    const data = await getPublicAboutPage({
      companyId: resolved.company.id,

      companySlug,
    });

    if (!data) {
      return NextResponse.json(
        {
          success: false,

          message: "Published About page not found.",
        },
        {
          status: 404,
        },
      );
    }

    const response = NextResponse.json({
      success: true,

      redirect: false,

      data,
    });

    response.headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=60",
    );

    return response;
  } catch (error) {
    console.error("Public About error:", error);

    return NextResponse.json(
      {
        success: false,

        message: "Unable to retrieve About page.",
      },
      {
        status: 500,
      },
    );
  }
}
