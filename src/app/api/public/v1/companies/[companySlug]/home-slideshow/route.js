import { NextResponse } from "next/server";

import { companySlugSchema } from "@/modules/company/company-slug.schema";

import { resolvePublicCompany } from "@/modules/company/company-slug.service";

import { getPublicHomeSlideshow } from "@/modules/home-slideshow/home-slideshow.service";

export const revalidate = 300;

export async function GET(request, context) {
  try {
    const params = await context.params;

    const validation = companySlugSchema.safeParse(params.companySlug);

    if (!validation.success) {
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

    const data = await getPublicHomeSlideshow({
      companyId: resolved.company.id,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Public home slideshow error:", error);

    if (error.message === "HOME_SLIDESHOW_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          message: "Homepage slideshow is not available.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,

        message: "Unable to retrieve homepage slideshow.",
      },
      {
        status: 500,
      },
    );
  }
}
