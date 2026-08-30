import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { companyIdSchema } from "@/modules/company/company.schema";

import { safeDeleteMedia } from "@/modules/media/media-delete.service";

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
 * DELETE
 * =========================================================
 */

export async function DELETE(request, context) {
  try {
    /*
     * =====================================================
     * ORIGIN
     * =====================================================
     */

    if (!isTrustedOrigin(request)) {
      return NextResponse.json(
        {
          success: false,

          code: "INVALID_ORIGIN",

          message: "Invalid request origin.",
        },
        {
          status: 403,
        },
      );
    }

    /*
     * =====================================================
     * PARAMS
     * =====================================================
     */

    const params = await resolveParams(context);

    if (!params) {
      return NextResponse.json(
        {
          success: false,

          code: "INVALID_MEDIA_REQUEST",

          message: "Invalid media request.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * =====================================================
     * PERMISSION
     * =====================================================
     */

    const access = await getCompanyPermission({
      companyId: params.companyId,

      permission: PERMISSIONS.MEDIA_DELETE,
    });

    if (!access.authorized) {
      return NextResponse.json(
        {
          success: false,

          code: "MEDIA_DELETE_FORBIDDEN",

          message: access.reason,
        },
        {
          status: access.user ? 403 : 401,
        },
      );
    }

    /*
     * =====================================================
     * BODY
     * =====================================================
     */

    let body = {};

    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const detachReferences = body?.detachReferences === true;

    /*
     * =====================================================
     * SAFE DELETE
     * =====================================================
     */

    const data = await safeDeleteMedia({
      companyId: params.companyId,

      mediaId: params.mediaId,

      detachReferences,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,

      data: {
        ...data,

        alreadyDeleted: false,
      },
    });
  } catch (error) {
    /*
     * =====================================================
     * MEDIA ALREADY DELETED
     * =====================================================
     *
     * DELETE should be idempotent.
     *
     * First request:
     *
     * DELETE
     * → 200
     *
     * Repeated request:
     *
     * DELETE
     * → 200
     *
     * This prevents double-clicks, browser retries,
     * slow networks, etc. from becoming false errors.
     * =====================================================
     */

    if (error.message === "MEDIA_ALREADY_DELETED") {
      return NextResponse.json({
        success: true,

        data: {
          deleted: true,

          alreadyDeleted: true,

          detachedReferences: 0,

          affectedDocuments: 0,
        },
      });
    }

    /*
     * =====================================================
     * MEDIA IS STILL IN USE
     * =====================================================
     */

    if (error.message === "MEDIA_IN_USE") {
      return NextResponse.json(
        {
          success: false,

          code: "MEDIA_IN_USE",

          message: "Media is currently being used.",

          data: error.usage || null,
        },
        {
          status: 409,
        },
      );
    }

    /*
     * =====================================================
     * DETACH INCOMPLETE
     * =====================================================
     */

    if (error.message === "MEDIA_REFERENCES_REMAIN") {
      return NextResponse.json(
        {
          success: false,

          code: "MEDIA_REFERENCES_REMAIN",

          message: "Some media references could not be removed.",

          data: error.usage || null,
        },
        {
          status: 409,
        },
      );
    }

    /*
     * =====================================================
     * NOT FOUND
     * =====================================================
     */

    if (error.message === "MEDIA_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,

          code: "MEDIA_NOT_FOUND",

          message: "Media not found.",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * =====================================================
     * UNEXPECTED
     * =====================================================
     */

    console.error("Delete media error:", error);

    return NextResponse.json(
      {
        success: false,

        code: "MEDIA_DELETE_FAILED",

        message: "Unable to delete media.",
      },
      {
        status: 500,
      },
    );
  }
}
