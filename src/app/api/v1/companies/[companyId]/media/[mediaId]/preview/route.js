import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { companyIdSchema } from "@/modules/company/company.schema";

import { mediaIdSchema } from "@/modules/media/media.schema";

import { createTemporaryMediaReadUrl } from "@/modules/media/media.service";

export async function GET(request, context) {
  try {
    const params = await context.params;

    const company = companyIdSchema.safeParse(params.companyId);

    const media = mediaIdSchema.safeParse(params.mediaId);

    if (!company.success || !media.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request parameters.",
        },
        {
          status: 400,
        },
      );
    }

    const access = await getCompanyPermission({
      companyId: company.data,

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

    const data = await createTemporaryMediaReadUrl({
      companyId: company.data,

      mediaId: media.data,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Media preview error:", error);

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
        message: "Unable to create preview URL.",
      },
      {
        status: 500,
      },
    );
  }
}
