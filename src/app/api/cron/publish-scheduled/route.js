import { NextResponse } from "next/server";

import { verifyCronRequest } from "@/lib/auth/cron";

import { runScheduledPublisher } from "@/modules/scheduler/scheduler.service";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    if (!verifyCronRequest(request)) {
      return NextResponse.json(
        {
          success: false,

          message: "Unauthorized.",
        },
        {
          status: 401,
        },
      );
    }

    const result = await runScheduledPublisher();

    return NextResponse.json(result, {
      status: result.success ? 200 : 207,
    });
  } catch (error) {
    console.error("Scheduled publisher error:", error);

    return NextResponse.json(
      {
        success: false,

        message: "Scheduled publisher failed.",

        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      {
        status: 500,
      },
    );
  }
}
