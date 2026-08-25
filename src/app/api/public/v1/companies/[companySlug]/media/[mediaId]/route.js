import { NextResponse } from "next/server";

import { MEDIA_VARIANT_KEYS } from "@/constants/media";

import { companySlugSchema } from "@/modules/company/company-slug.schema";

import { mediaIdSchema } from "@/modules/media/media.schema";

import { resolvePublicCompany } from "@/modules/company/company-slug.service";

import { createPublicMediaVariantUrl } from "@/modules/media/media.service";

export async function GET(request, context) {
  try {
    const params = await context.params;

    const companyValidation = companySlugSchema.safeParse(params.companySlug);

    const mediaValidation = mediaIdSchema.safeParse(params.mediaId);

    if (!companyValidation.success || !mediaValidation.success) {
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

    const companySlug = companyValidation.data;

    const mediaId = mediaValidation.data;

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

    /*
     * Old company slug.
     */
    if (resolved.redirect) {
      return NextResponse.json(
        {
          success: true,

          redirect: true,

          redirectTo: resolved.redirectTo,
        },
        {
          status: 200,
        },
      );
    }

    const company = resolved.company;

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
      companyId: company.id,

      mediaId,

      variant,
    });

    const response = NextResponse.redirect(result.url, {
      status: 307,
    });

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
