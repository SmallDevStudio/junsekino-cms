import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { companyIdSchema } from "@/modules/company/company.schema";

import { mediaIdSchema, updateMediaSchema } from "@/modules/media/media.schema";

import { getMedia, updateMedia } from "@/modules/media/media.service";

/*
 * =========================================================
 * PARAMS
 * =========================================================
 */

async function resolveParams(context) {
  const params = await context.params;

  const company = companyIdSchema.safeParse(params.companyId);

  const media = mediaIdSchema.safeParse(params.mediaId);

  if (!company.success || !media.success) {
    return null;
  }

  return {
    companyId: company.data,

    mediaId: media.data,
  };
}

/*
 * =========================================================
 * GET METADATA
 * =========================================================
 */

export async function GET(request, context) {
  try {
    const params = await resolveParams(context);

    if (!params) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid media request.",
        },
        {
          status: 400,
        },
      );
    }

    const access = await getCompanyPermission({
      companyId: params.companyId,

      permission: PERMISSIONS.MEDIA_VIEW,
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

    const data = await getMedia({
      companyId: params.companyId,

      mediaId: params.mediaId,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get media metadata error:", error);

    if (error.message === "MEDIA_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,

          message: "Media not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,

        message: "Unable to retrieve media metadata.",
      },
      {
        status: 500,
      },
    );
  }
}

/*
 * =========================================================
 * PATCH METADATA
 * =========================================================
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

    const params = await resolveParams(context);

    if (!params) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid media request.",
        },
        {
          status: 400,
        },
      );
    }

    const access = await getCompanyPermission({
      companyId: params.companyId,

      permission: PERMISSIONS.MEDIA_UPDATE,
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

    const validation = updateMediaSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid media metadata.",

          errors: validation.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    const data = await updateMedia({
      companyId: params.companyId,

      mediaId: params.mediaId,

      input: validation.data,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Update media metadata error:", error);

    if (error.message === "MEDIA_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,

          message: "Media not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,

        message: "Unable to update media metadata.",
      },
      {
        status: 500,
      },
    );
  }
}
