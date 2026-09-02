import { NextResponse } from "next/server";

import { companySlugSchema } from "@/modules/company/company-slug.schema";

import { resolvePublicCompany } from "@/modules/company/company-slug.service";

import {
  recordPublicContentShare,
  recordPublicContentView,
  togglePublicContentLike,
} from "@/modules/public-content/public-content-engagement.service";

import {
  attachVisitorCookie,
  getConsent,
  hashVisitorId,
  resolveVisitor,
} from "@/lib/visitor/visitor";

export const dynamic = "force-dynamic";

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

  return ["view", "like", "share"].includes(action) ? action : null;
}

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

    const resolved = await resolvePublicCompany(companyValidation.data);

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

    const visitor = resolveVisitor(request);

    const visitorHash = hashVisitorId(visitor.visitorId, companyId);

    const consent = getConsent(request, companyId);

    const analyticsConsent = consent.analytics === true;

    let result;

    if (action === "view") {
      result = await recordPublicContentView({
        companyId,
        slug,
        visitorHash: analyticsConsent ? visitorHash : null,
        analyticsConsent,
      });
    }

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

    /*
     * A passive view may create the cookie only after Analytics consent.
     * A like is an explicit user action and needs the identifier to preserve
     * its selected state. Sharing does not require a persistent identifier.
     */
    if (
      visitor.isNew &&
      ((action === "view" && analyticsConsent) || action === "like")
    ) {
      attachVisitorCookie({
        response,
        visitorId: visitor.visitorId,
      });
    }

    return response;
  } catch (error) {
    console.error("Public content engagement error:", error);

    const errors = {
      PUBLIC_CONTENT_NOT_FOUND: [404, "Public content not found."],
      ENGAGEMENT_CONTENT_NOT_FOUND: [404, "Public content not found."],
      INVALID_VISITOR_HASH: [400, "Invalid visitor."],
      INVALID_SHARE_CHANNEL: [400, "Invalid share channel."],
    };

    const known = errors[error.message];

    if (known) {
      return NextResponse.json(
        {
          success: false,
          message: known[1],
        },
        {
          status: known[0],
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
