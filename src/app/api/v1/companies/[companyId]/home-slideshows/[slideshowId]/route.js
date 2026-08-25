import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { companyIdSchema } from "@/modules/company/company.schema";

import {
  homeSlideshowIdSchema,
  updateHomeSlideshowSchema,
} from "@/modules/home-slideshow/home-slideshow.schema";

import {
  deleteHomeSlideshow,
  getHomeSlideshow,
  updateHomeSlideshow,
} from "@/modules/home-slideshow/home-slideshow.service";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

async function resolveParams(context) {
  const params = await context.params;

  const company = companyIdSchema.safeParse(params.companyId);

  const slideshow = homeSlideshowIdSchema.safeParse(params.slideshowId);

  if (!company.success || !slideshow.success) {
    return null;
  }

  return {
    companyId: company.data,

    slideshowId: slideshow.data,
  };
}

async function getAccess(params) {
  return getCompanyPermission({
    companyId: params.companyId,

    permission: PERMISSIONS.COMPANY_UPDATE,
  });
}

export async function GET(request, context) {
  try {
    const params = await resolveParams(context);

    if (!params) {
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

    const access = await getAccess(params);

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

    const data = await getHomeSlideshow({
      companyId: params.companyId,

      slideshowId: params.slideshowId,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
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

    console.error("Get home slideshow error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve slideshow.",
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
          message: "Invalid slideshow request.",
        },
        {
          status: 400,
        },
      );
    }

    const access = await getAccess(params);

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

    const validation = updateHomeSlideshowSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid slideshow data.",

          errors: validation.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    const data = await updateHomeSlideshow({
      companyId: params.companyId,

      slideshowId: params.slideshowId,

      input: validation.data,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Update home slideshow error:", error);

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
        message: "Unable to update slideshow.",
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
          message: "Invalid slideshow request.",
        },
        {
          status: 400,
        },
      );
    }

    const access = await getAccess(params);

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

    const data = await deleteHomeSlideshow({
      companyId: params.companyId,

      slideshowId: params.slideshowId,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Delete home slideshow error:", error);

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

    if (error.message === "HOME_SLIDESHOW_PUBLISHED_DELETE_NOT_ALLOWED") {
      return NextResponse.json(
        {
          success: false,

          message:
            "Published home slideshow cannot be deleted. Publish another slideshow first.",
        },
        {
          status: 409,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to delete slideshow.",
      },
      {
        status: 500,
      },
    );
  }
}
