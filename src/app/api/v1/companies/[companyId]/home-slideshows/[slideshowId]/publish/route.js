import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { companyIdSchema } from "@/modules/company/company.schema";

import { homeSlideshowIdSchema } from "@/modules/home-slideshow/home-slideshow.schema";

import { publishHomeSlideshow } from "@/modules/home-slideshow/home-slideshow.service";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

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

    const params = await context.params;

    const company = companyIdSchema.safeParse(params.companyId);

    const slideshow = homeSlideshowIdSchema.safeParse(params.slideshowId);

    if (!company.success || !slideshow.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid slideshow request.",
        },
        {
          status: 400,
        },
      );
    }

    const access = await getCompanyPermission({
      companyId: company.data,

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

    const data = await publishHomeSlideshow({
      companyId: company.data,

      slideshowId: slideshow.data,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Publish home slideshow error:", error);

    if (error.message === "HOME_SLIDESHOW_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          message: "Slideshow not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (error.message === "HOME_SLIDESHOW_REQUIRES_SLIDE") {
      return NextResponse.json(
        {
          success: false,

          message:
            "Homepage slideshow requires at least one active image before publishing.",
        },
        {
          status: 400,
        },
      );
    }

    if (error.message?.startsWith("HOME_")) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to publish slideshow.",
      },
      {
        status: 500,
      },
    );
  }
}
