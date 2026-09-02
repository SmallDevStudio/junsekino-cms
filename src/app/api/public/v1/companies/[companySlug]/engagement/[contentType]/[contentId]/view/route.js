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

    const consent = getConsent(
      request,

      route.company.id,
    );

    const visitor = resolveVisitor(request);

    /*
     * The hash is scoped to the selected company.
     * It cannot be used to correlate visitors
     * between independent companies.
     */
    const visitorHash = hashVisitorId(
      visitor.visitorId,

      route.company.id,
    );

    const analyticsConsent = consent.analytics === true;

    const data = await viewContent({
      companyId: route.company.id,

      contentType: route.contentType,

      contentId: route.contentId,

      visitorHash,

      analyticsConsent,
    });

    const response = NextResponse.json({
      success: true,

      data,
    });

    /*
     * Do not create a persistent visitor cookie
     * from a page view before Analytics consent.
     *
     * Without consent, the generated ID exists
     * only during this request.
     */
    if (visitor.isNew && analyticsConsent) {
      attachVisitorCookie({
        response,

        visitorId: visitor.visitorId,
      });
    }

    return response;
  } catch (error) {
    console.error(
      "View content error:",

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

        message: "Unable to record view.",
      },

      {
        status: 500,
      },
    );
  }
}
