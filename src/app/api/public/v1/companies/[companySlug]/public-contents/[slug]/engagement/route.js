import { NextResponse } from "next/server";

import { companySlugSchema } from "@/modules/company/company-slug.schema";

import { resolvePublicCompany } from "@/modules/company/company-slug.service";

import {
  recordPublicContentShare,
  recordPublicContentView,
  togglePublicContentLike,
} from "@/modules/public-content/public-content-engagement.service";

export const dynamic = "force-dynamic";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function normalizeContentSlug(value) {
  const slug = String(value || "")
    .trim()
    .toLowerCase();

  if (
    !slug ||
    slug.length < 2 ||
    slug.length > 150 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
  ) {
    return null;
  }

  return slug;
}

function normalizeAction(value) {
  const action = String(value || "")
    .trim()
    .toLowerCase();

  if (action === "view" || action === "like" || action === "share") {
    return action;
  }

  return null;
}

/*
 * =========================================================
 * POST
 *
 * VIEW
 *
 * {
 *   action: "view",
 *   visitorId
 * }
 *
 * LIKE
 *
 * {
 *   action: "like",
 *   visitorId
 * }
 *
 * SHARE
 *
 * {
 *   action: "share",
 *   visitorId,
 *   channel: "facebook"
 * }
 * =========================================================
 */

export async function POST(request, context) {
  try {
    const params = await context.params;

    const companyValidation = companySlugSchema.safeParse(params.companySlug);

    const slug = normalizeContentSlug(params.slug);

    if (!companyValidation.success || !slug) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid public content request.",
        },
        {
          status: 400,
        },
      );
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid request body.",
        },
        {
          status: 400,
        },
      );
    }

    const action = normalizeAction(body?.action);

    const visitorId = String(body?.visitorId || "").trim();

    if (!action || !visitorId) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid engagement request.",
        },
        {
          status: 400,
        },
      );
    }

    const companySlug = companyValidation.data;

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

    if (resolved.redirect) {
      return NextResponse.json({
        success: true,

        redirect: true,

        redirectTo: resolved.redirectTo,
      });
    }

    let result;

    if (action === "view") {
      result = await recordPublicContentView({
        companyId: resolved.company.id,

        slug,

        visitorId,
      });
    }

    if (action === "like") {
      result = await togglePublicContentLike({
        companyId: resolved.company.id,

        slug,

        visitorId,
      });
    }

    if (action === "share") {
      result = await recordPublicContentShare({
        companyId: resolved.company.id,

        slug,

        visitorId,

        channel: body?.channel,
      });
    }

    const response = NextResponse.json({
      success: true,

      redirect: false,

      data: result,
    });

    response.headers.set("Cache-Control", "no-store");

    return response;
  } catch (error) {
    console.error("Public content engagement error:", error);

    if (error.message === "PUBLIC_CONTENT_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,

          message: "Public content not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (error.message === "INVALID_VISITOR_ID") {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid visitor.",
        },
        {
          status: 400,
        },
      );
    }

    if (error.message === "INVALID_SHARE_CHANNEL") {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid share channel.",
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,

        message: "Unable to update content engagement.",
      },
      {
        status: 500,
      },
    );
  }
}
