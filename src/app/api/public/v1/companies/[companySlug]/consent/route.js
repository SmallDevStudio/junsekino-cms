import { NextResponse } from "next/server";

import { companySlugSchema } from "@/modules/company/company-slug.schema";

import { resolvePublicCompany } from "@/modules/company/company-slug.service";

import { saveConsentSchema } from "@/modules/legal/legal.schema";

import {
  getPublicLegalDocuments,
  saveVisitorConsent,
} from "@/modules/legal/legal.service";

import {
  attachVisitorCookie,
  hashVisitorId,
  resolveVisitor,
} from "@/lib/visitor/visitor";

import { decodeConsentCookie, setConsentCookie } from "@/lib/visitor/consent";

import { CONSENT_COOKIE_NAME } from "@/constants/legal";

async function resolveCompany(context) {
  const params = await context.params;

  const validation = companySlugSchema.safeParse(params.companySlug);

  if (!validation.success) {
    return null;
  }

  const resolved = await resolvePublicCompany(validation.data);

  if (!resolved || resolved.redirect || !resolved.company) {
    return null;
  }

  return resolved.company;
}

function getVersionMap(legal) {
  return {
    privacy: legal.privacy?.versionId || null,

    cookies: legal.cookies?.versionId || null,

    terms: legal.terms?.versionId || null,
  };
}

function isSameVersion(a, b) {
  return (
    a?.privacy === b?.privacy &&
    a?.cookies === b?.cookies &&
    a?.terms === b?.terms
  );
}

export async function GET(request, context) {
  try {
    const company = await resolveCompany(context);

    if (!company) {
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

    const legal = await getPublicLegalDocuments(company.id);

    const currentVersions = getVersionMap(legal);

    const raw = request.cookies.get(CONSENT_COOKIE_NAME)?.value;

    const existing = decodeConsentCookie(raw);

    const versionsMatch = isSameVersion(
      existing?.legalVersions,

      currentVersions,
    );

    const requireReConsent = Boolean(
      legal.privacy?.requireReConsent || legal.cookies?.requireReConsent,
    );

    return NextResponse.json({
      success: true,

      data: {
        consent: existing?.consent || {
          necessary: true,
          analytics: false,
          functional: false,
          marketing: false,
        },

        legalVersions: currentVersions,

        hasConsent: Boolean(existing),

        versionsMatch,

        requireConsent:
          !existing || !versionsMatch || (requireReConsent && !versionsMatch),
      },
    });
  } catch (error) {
    console.error("Get consent status error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve consent status.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request, context) {
  try {
    const company = await resolveCompany(context);

    if (!company) {
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

    const body = await request.json();

    const validation = saveConsentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid consent data.",

          errors: validation.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    const visitor = resolveVisitor(request);

    const visitorHash = hashVisitorId(visitor.visitorId);

    const result = await saveVisitorConsent({
      companyId: company.id,

      visitorHash,

      consent: validation.data.consent,

      source: validation.data.source,

      userAgent: request.headers.get("user-agent"),
    });

    const cookieData = {
      version: 1,

      consent: result.consent,

      legalVersions: result.legalVersions,

      updatedAt: result.updatedAt,
    };

    const response = NextResponse.json({
      success: true,
      data: cookieData,
    });

    if (visitor.isNew) {
      attachVisitorCookie({
        response,

        visitorId: visitor.visitorId,
      });
    }

    setConsentCookie({
      response,
      data: cookieData,
    });

    return response;
  } catch (error) {
    console.error("Save consent error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to save consent.",
      },
      {
        status: 500,
      },
    );
  }
}
