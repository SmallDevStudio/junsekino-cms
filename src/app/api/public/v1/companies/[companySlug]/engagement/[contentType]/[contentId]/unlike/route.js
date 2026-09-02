import { NextResponse } from "next/server";

import { resolveEngagementRoute } from "@/modules/engagement/engagement-route.helper";

import { unlikeContent } from "@/modules/engagement/engagement.service";

import { isTrustedOrigin } from "@/lib/auth/origin";

import {
  attachVisitorCookie,
  hashVisitorId,
  resolveVisitor,
} from "@/lib/visitor/visitor";

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

    const visitorHash = hashVisitorId(
      visitor.visitorId,

      route.company.id,
    );

    const data = await unlikeContent({
      companyId: route.company.id,

      contentType: route.contentType,

      contentId: route.contentId,

      visitorHash,
    });

    const response = NextResponse.json({
      success: true,

      data,
    });

    /*
     * Normally Unlike already has an existing
     * visitor cookie from the Like action.
     *
     * Keep this fallback for old reactions
     * and clients that lost their cookie.
     */
    if (visitor.isNew) {
      attachVisitorCookie({
        response,

        visitorId: visitor.visitorId,
      });
    }

    return response;
  } catch (error) {
    console.error(
      "Unlike content error:",

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

        message: "Unable to unlike content.",
      },

      {
        status: 500,
      },
    );
  }
}
