import { NextResponse } from "next/server";

import { MEDIA_VARIANT_KEYS } from "@/constants/media";

import { companyIdSchema } from "@/modules/company/company.schema";

import { mediaIdSchema } from "@/modules/media/media.schema";

import { createPublicMediaVariantUrl } from "@/modules/media/media.service";

export async function GET(request, context) {
  try {
    const params = await context.params;

    const company = companyIdSchema.safeParse(params.companyId);

    const media = mediaIdSchema.safeParse(params.mediaId);

    if (!company.success || !media.success) {
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

    const { searchParams } = new URL(request.url);

    const variant = searchParams.get("variant") || "large";

    if (!MEDIA_VARIANT_KEYS.includes(variant)) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid media variant.",
        },
        {
          status: 400,
        },
      );
    }

    const result = await createPublicMediaVariantUrl({
      companyId: company.data,

      mediaId: media.data,

      variant,
    });

    const response = NextResponse.redirect(result.url, {
      status: 307,
    });

    /*
     * Cache redirect for only
     * a short period because the
     * signed URL itself expires.
     */
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=60",
    );

    response.headers.set("X-Robots-Tag", "index");

    return response;
  } catch (error) {
    console.error("Public media error:", error);

    if (
      error.message === "MEDIA_NOT_FOUND" ||
      error.message === "MEDIA_VARIANT_NOT_FOUND"
    ) {
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
        message: "Unable to retrieve media.",
      },
      {
        status: 500,
      },
    );
  }
}
