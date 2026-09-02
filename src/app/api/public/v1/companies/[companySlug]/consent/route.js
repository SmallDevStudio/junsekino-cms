import { NextResponse } from "next/server";

import { companySlugSchema } from "@/modules/company/company-slug.schema";

import { resolvePublicCompany } from "@/modules/company/company-slug.service";

import { saveConsentSchema } from "@/modules/legal/legal.schema";

import {
  getPublicLegalDocuments,
  saveVisitorConsent,
} from "@/modules/legal/legal.service";

import { getCompanyPrivacySettings } from "@/modules/legal/privacy-settings.service";

import {
  attachVisitorCookie,
  hashVisitorId,
  resolveVisitor,
} from "@/lib/visitor/visitor";

import {
  decodeConsentCookie,
  getConsentCookieName,
  getDefaultConsent,
  setConsentCookie,
} from "@/lib/visitor/consent";

import { isTrustedOrigin } from "@/lib/auth/origin";

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

    const [legal, privacySettings] = await Promise.all([
      getPublicLegalDocuments(company.id),

      getCompanyPrivacySettings(company.id),
    ]);

    const currentVersions = getVersionMap(legal);

    const currentConsentVersion =
      privacySettings.consentManagement?.version || 1;

    const cookieName = getConsentCookieName(company.id);

    const raw = request.cookies.get(cookieName)?.value;

    const existing = decodeConsentCookie(raw, company.id);

    const versionsMatch =
      Boolean(existing) &&
      isSameVersion(
        existing.legalVersions,

        currentVersions,
      );

    const consentVersionMatches =
      Boolean(existing) && existing.consentVersion === currentConsentVersion;

    const consentEnabled = privacySettings.consentManagement?.enabled !== false;

    const renewOnPolicyChange =
      privacySettings.consentManagement?.renewOnPolicyChange !== false;

    const policyRequiresConsent = Boolean(
      legal.privacy?.requireReConsent || legal.cookies?.requireReConsent,
    );

    const policyChanged =
      !versionsMatch && (renewOnPolicyChange || policyRequiresConsent);

    const requireConsent =
      consentEnabled && (!existing || !consentVersionMatches || policyChanged);

    return NextResponse.json({
      success: true,

      data: {
        consent: existing?.consent || getDefaultConsent(),

        consentVersion: currentConsentVersion,

        legalVersions: currentVersions,

        hasConsent: Boolean(existing),

        versionsMatch,

        consentVersionMatches,

        requireConsent,
      },
    });
  } catch (error) {
    console.error(
      "Get consent status error:",

      error,
    );

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
    if (!isTrustedOrigin(request)) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid request origin.",
        },

        {
          status: 403,
        },
      );
    }

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

    const privacySettings = await getCompanyPrivacySettings(company.id);

    if (privacySettings.consentManagement?.enabled === false) {
      return NextResponse.json(
        {
          success: false,

          message: "Consent management is disabled.",
        },

        {
          status: 409,
        },
      );
    }

    const visitor = resolveVisitor(request);

    const visitorHash = hashVisitorId(
      visitor.visitorId,

      company.id,
    );

    const result = await saveVisitorConsent({
      companyId: company.id,

      visitorHash,

      consent: validation.data.consent,

      source: validation.data.source,

      userAgent: request.headers.get("user-agent"),
    });

    const cookieData = {
      version: 2,

      companyId: company.id,

      consentVersion: result.consentVersion,

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

      companyId: company.id,

      data: cookieData,

      maxAgeDays: privacySettings.consentManagement?.cookieMaxAgeDays,
    });

    return response;
  } catch (error) {
    console.error(
      "Save consent error:",

      error,
    );

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
