import { NextResponse } from "next/server";

import { resolveEngagementRoute } from "@/modules/engagement/engagement-route.helper";

import { getContentEngagement } from "@/modules/engagement/engagement.service";

import {
  attachVisitorCookie,
  hashVisitorId,
  resolveVisitor,
} from "@/lib/visitor/visitor";

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

    const visitorHash = hashVisitorId(visitor.visitorId);

    const data = await getContentEngagement({
      companyId: route.company.id,

      contentType: route.contentType,

      contentId: route.contentId,

      visitorHash,
    });

    const response = NextResponse.json({
      success: true,
      data,
    });

    if (visitor.isNew) {
      attachVisitorCookie({
        response,

        visitorId: visitor.visitorId,
      });
    }

    return response;
  } catch (error) {
    console.error("Get engagement error:", error);

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
