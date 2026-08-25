import { NextResponse } from "next/server";

import { shareEventSchema } from "@/modules/engagement/engagement.schema";

import { resolveEngagementRoute } from "@/modules/engagement/engagement-route.helper";

import { shareContent } from "@/modules/engagement/engagement.service";

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

    const body = await request.json();

    const validation = shareEventSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid share data.",
        },
        {
          status: 400,
        },
      );
    }

    const data = await shareContent({
      companyId: route.company.id,

      contentType: route.contentType,

      contentId: route.contentId,

      channel: validation.data.channel,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Share content error:", error);

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
        message: "Unable to record share.",
      },
      {
        status: 500,
      },
    );
  }
}
