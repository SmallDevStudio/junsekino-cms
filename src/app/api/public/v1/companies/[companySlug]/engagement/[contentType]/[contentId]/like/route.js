import { NextResponse } from "next/server";

import { resolveEngagementRoute } from "@/modules/engagement/engagement-route.helper";

import { likeContent } from "@/modules/engagement/engagement.service";

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

    /*
     * The visitor explicitly requested
     * the Like function.
     *
     * A pseudonymous identifier is required
     * to remember the reaction and prevent
     * duplicate likes.
     */
    const visitorHash = hashVisitorId(
      visitor.visitorId,

      route.company.id,
    );

    const data = await likeContent({
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
     * Persist only after the visitor
     * actively uses the Like function.
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
      "Like content error:",

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

        message: "Unable to like content.",
      },

      {
        status: 500,
      },
    );
  }
}
