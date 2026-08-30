import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { companyIdSchema } from "@/modules/company/company.schema";

import { findMediaUsages } from "@/modules/media/media-relations.service";

import { mediaIdSchema } from "@/modules/media/media.schema";

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
 * GET MEDIA USAGE
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

    /*
     * Usage information exposes details
     * about Company content.
     *
     * MEDIA_VIEW permission is required.
     */

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

    const data = await findMediaUsages({
      companyId: params.companyId,

      mediaId: params.mediaId,
    });

    return NextResponse.json({
      success: true,

      data,
    });
  } catch (error) {
    console.error("Get media usage error:", error);

    return NextResponse.json(
      {
        success: false,

        message: "Unable to retrieve media usage.",
      },
      {
        status: 500,
      },
    );
  }
}
