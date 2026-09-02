import { NextResponse } from "next/server";

import { resolveEngagementRoute } from "@/modules/engagement/engagement-route.helper";

import { getContentEngagement } from "@/modules/engagement/engagement.service";

import { hashVisitorId, resolveVisitor } from "@/lib/visitor/visitor";

export async function GET(request, context) {
  try {
    const route = await resolveEngagementRoute(context);

    if (!route.valid) {
      return NextResponse.json(
        {
          success: false,

          message: "Content not found.",
        },

        {
          status: 404,
        },
      );
    }

    const visitor = resolveVisitor(request);

    /*
     * Scope the hash to the selected company.
     *
     * If the visitor does not yet have a cookie,
     * resolveVisitor creates an in-memory ID for
     * this request only.
     *
     * This GET endpoint intentionally does not
     * persist a new visitor cookie.
     */
    const visitorHash = hashVisitorId(
      visitor.visitorId,

      route.company.id,
    );

    const data = await getContentEngagement({
      companyId: route.company.id,

      contentType: route.contentType,

      contentId: route.contentId,

      visitorHash,
    });

    return NextResponse.json({
      success: true,

      data,
    });
  } catch (error) {
    console.error(
      "Get engagement error:",

      error,
    );

    if (error.message === "ENGAGEMENT_CONTENT_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,

          message: "Content not found.",
        },

        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,

        message: "Unable to retrieve engagement.",
      },

      {
        status: 500,
      },
    );
  }
}
