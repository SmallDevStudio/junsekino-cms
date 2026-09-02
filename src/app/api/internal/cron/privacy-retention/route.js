import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { runPrivacyRetentionCleanup } from "@/modules/legal/privacy-retention.service";

export const dynamic = "force-dynamic";

export const maxDuration = 60;

function safeCompare(left, right) {
  if (typeof left !== "string" || typeof right !== "string") {
    return false;
  }

  const leftBuffer = Buffer.from(left, "utf8");

  const rightBuffer = Buffer.from(right, "utf8");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    leftBuffer,

    rightBuffer,
  );
}

function isAuthorized(request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return {
      authorized: false,

      configured: false,
    };
  }

  const authorization = request.headers.get("authorization");

  const expected = `Bearer ${secret}`;

  return {
    authorized: safeCompare(
      authorization,

      expected,
    ),

    configured: true,
  };
}

export async function GET(request) {
  try {
    const auth = isAuthorized(request);

    if (!auth.configured) {
      console.error("CRON_SECRET is not configured.");

      return NextResponse.json(
        {
          success: false,

          message: "Retention cleanup is not configured.",
        },

        {
          status: 503,
        },
      );
    }

    if (!auth.authorized) {
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

    const result = await runPrivacyRetentionCleanup({
      attachmentLimit: 50,

      submissionLimit: 25,
    });

    return NextResponse.json({
      success: true,

      data: result,
    });
  } catch (error) {
    console.error(
      "Privacy retention cron error:",

      error,
    );

    if (error.message === "RETENTION_CLEANUP_ALREADY_RUNNING") {
      return NextResponse.json(
        {
          success: false,

          message: "Retention cleanup is already running.",
        },

        {
          status: 409,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,

        message: "Unable to run retention cleanup.",
      },

      {
        status: 500,
      },
    );
  }
}
