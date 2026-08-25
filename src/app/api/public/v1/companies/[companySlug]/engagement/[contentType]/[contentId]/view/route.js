import { NextResponse } from "next/server";

import { resolveEngagementRoute } from "@/modules/engagement/engagement-route.helper";

import { viewContent } from "@/modules/engagement/engagement.service";

import {
  attachVisitorCookie,
  getConsent,
  hashVisitorId,
  resolveVisitor,
} from "@/lib/visitor/visitor";

export async function POST(request, context) {
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

    const consent = getConsent(request);

    const visitorHash = consent.analytics
      ? hashVisitorId(visitor.visitorId)
      : null;

    const data = await viewContent({
      companyId: route.company.id,

      contentType: route.contentType,

      contentId: route.contentId,

      visitorHash,

      analyticsConsent: consent.analytics,
    });

    const response = NextResponse.json({
      success: true,
      data,
    });

    /*
     * Visitor cookie is also needed
     * for functional features such as
     * Likes, therefore it is not tied
     * exclusively to analytics consent.
     */

    if (visitor.isNew) {
      attachVisitorCookie({
        response,

        visitorId: visitor.visitorId,
      });
    }

    return response;
  } catch (error) {
    console.error("View content error:", error);

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
        message: "Unable to record view.",
      },
      {
        status: 500,
      },
    );
  }
}
