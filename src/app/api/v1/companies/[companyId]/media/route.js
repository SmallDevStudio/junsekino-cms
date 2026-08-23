import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { MEDIA_USAGE } from "@/constants/media";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { companyIdSchema } from "@/modules/company/company.schema";

import { createMediaUploadSchema } from "@/modules/media/media.schema";

import { createMediaUpload, listMedia } from "@/modules/media/media.service";

async function resolveCompanyId(context) {
  const params = await context.params;

  const validation = companyIdSchema.safeParse(params.companyId);

  return validation.success ? validation.data : null;
}

export async function GET(request, context) {
  try {
    const companyId = await resolveCompanyId(context);

    if (!companyId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid company ID.",
        },
        {
          status: 400,
        },
      );
    }

    const access = await getCompanyPermission({
      companyId,

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

    const { searchParams } = new URL(request.url);

    const usage = searchParams.get("usage");

    const search = searchParams.get("search");

    if (usage && !Object.values(MEDIA_USAGE).includes(usage)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid media usage.",
        },
        {
          status: 400,
        },
      );
    }

    const data = await listMedia({
      companyId,
      usage,
      search,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("List media error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve media.",
      },
      {
        status: 500,
      },
    );
  }
}

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

    const companyId = await resolveCompanyId(context);

    if (!companyId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid company ID.",
        },
        {
          status: 400,
        },
      );
    }

    const access = await getCompanyPermission({
      companyId,

      permission: PERMISSIONS.MEDIA_UPLOAD,
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

    const validation = createMediaUploadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid media data.",
          errors: validation.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    const data = await createMediaUpload({
      companyId,

      input: validation.data,

      currentUser: access.user,
    });

    return NextResponse.json(
      {
        success: true,
        data,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Create media upload error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create media upload.",
      },
      {
        status: 500,
      },
    );
  }
}
