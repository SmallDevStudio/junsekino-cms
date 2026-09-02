import { NextResponse } from "next/server";

import { companySlugSchema } from "@/modules/company/company-slug.schema";

import { resolvePublicCompany } from "@/modules/company/company-slug.service";

import {
  getPublicContentEngagement,
  recordPublicContentShare,
  recordPublicContentView,
  togglePublicContentLike,
} from "@/modules/public-content/public-content-engagement.service";

import {
  attachVisitorCookie,
  hashVisitorId,
  resolveVisitor,
} from "@/lib/visitor/visitor";

import { getConsentFromRequest } from "@/lib/visitor/consent";

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
 *   action: "view"
 * }
 *
 * LIKE
 *
 * {
 *   action: "like"
 * }
 *
 * SHARE
 *
 * {
 *   action: "share",
 *   channel: "facebook"
 * }
 *
 * visitorId is intentionally not accepted
 * from the request body.
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

    if (!action) {
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

    const companyId = resolved.company.id;

    /*
     * Visitor identity is created and validated
     * exclusively on the server.
     *
     * The raw visitor ID is never stored in
     * Firestore.
     */
    const visitor = resolveVisitor(request);

    const visitorHash = hashVisitorId(visitor.visitorId);

    const consent = getConsentFromRequest({
      request,

      companyId,
    });

    let result;

    /*
     * A passive page view is analytics.
     *
     * Without Analytics consent, return the
     * current aggregate counters without
     * recording a view.
     */
    if (action === "view") {
      if (consent.analytics === true) {
        result = await recordPublicContentView({
          companyId,

          slug,

          visitorHash,
        });
      } else {
        result = await getPublicContentEngagement({
          companyId,

          slug,

          visitorHash,
        });
      }
    }

    /*
     * Like and Share are actions expressly
     * requested by the visitor.
     *
     * They remain available when optional
     * Analytics cookies are rejected.
     */
    if (action === "like") {
      result = await togglePublicContentLike({
        companyId,

        slug,

        visitorHash,
      });
    }

    if (action === "share") {
      result = await recordPublicContentShare({
        companyId,

        slug,

        visitorHash,

        channel: body?.channel,
      });
    }

    const response = NextResponse.json({
      success: true,

      redirect: false,

      data: result,
    });

    response.headers.set("Cache-Control", "no-store");

    if (visitor.isNew) {
      attachVisitorCookie({
        response,

        visitorId: visitor.visitorId,
      });
    }

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

    if (error.message === "INVALID_VISITOR_HASH") {
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
