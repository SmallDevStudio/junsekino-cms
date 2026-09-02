import { NextResponse } from "next/server";

import { companySlugSchema } from "@/modules/company/company-slug.schema";

import { formSlugSchema } from "@/modules/form/form.schema";

import { publicFormSubmissionSchema } from "@/modules/form/form-submission.schema";

import { resolvePublicCompany } from "@/modules/company/company-slug.service";

import { submitPublicForm } from "@/modules/form/form-submission.service";

import { isTrustedOrigin } from "@/lib/auth/origin";

import {
  attachVisitorCookie,
  hashVisitorId,
  hashVisitorTechnicalValue,
  resolveVisitor,
} from "@/lib/visitor/visitor";

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

    const params = await context.params;

    const company = companySlugSchema.safeParse(params.companySlug);

    const form = formSlugSchema.safeParse(params.formSlug);

    if (!company.success || !form.success) {
      return NextResponse.json(
        {
          success: false,

          message: "Form not found.",
        },

        {
          status: 404,
        },
      );
    }

    const resolved = await resolvePublicCompany(company.data);

    if (!resolved || resolved.redirect || !resolved.company) {
      return NextResponse.json(
        {
          success: false,

          message: "Form not found.",
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

    const validation = publicFormSubmissionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid submission.",

          errors: validation.error.flatten().fieldErrors,
        },

        {
          status: 400,
        },
      );
    }

    const visitor = resolveVisitor(request);

    const visitorHash = hashVisitorId(
      visitor.visitorId,

      resolved.company.id,
    );

    /*
     * Do not persist the raw User-Agent.
     *
     * The current service field keeps its legacy
     * name for backward compatibility, but the
     * value sent to it is now an irreversible
     * company-scoped HMAC hash.
     */
    const userAgentHash = hashVisitorTechnicalValue(
      request.headers.get("user-agent"),

      resolved.company.id,
    );

    let result;

    try {
      result = await submitPublicForm({
        companyId: resolved.company.id,

        formSlug: form.data,

        input: validation.data,

        visitorHash,

        userAgent: userAgentHash ? `hmac-sha256:${userAgentHash}` : null,
      });
    } catch (error) {
      /*
       * Honeypot responses intentionally look
       * successful to automated clients.
       *
       * Do not create a persistent visitor cookie
       * for a request identified as a bot.
       */
      if (error.message === "FORM_HONEYPOT_TRIGGERED") {
        return NextResponse.json({
          success: true,

          data: {
            submitted: true,
          },
        });
      }

      throw error;
    }

    const response = NextResponse.json(
      {
        success: true,

        data: result,
      },

      {
        status: 201,
      },
    );

    /*
     * Form submission and rate limiting require
     * a stable pseudonymous identifier.
     *
     * This identifier is treated as a necessary
     * security cookie for the requested action.
     */
    if (visitor.isNew) {
      attachVisitorCookie({
        response,

        visitorId: visitor.visitorId,
      });
    }

    return response;
  } catch (error) {
    console.error(
      "Public form submission error:",

      error,
    );

    if (error.message === "FORM_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,

          message: "Form not found.",
        },

        {
          status: 404,
        },
      );
    }

    if (error.message === "FORM_RATE_LIMITED") {
      return NextResponse.json(
        {
          success: false,

          message: "Too many submissions. Please try again later.",
        },

        {
          status: 429,
        },
      );
    }

    if (error.message === "FORM_FILE_UPLOAD_NOT_READY") {
      return NextResponse.json(
        {
          success: false,

          message: "File upload is not available for this form yet.",
        },

        {
          status: 400,
        },
      );
    }

    if (error.message === "FORM_PRIVACY_NOTICE_NOT_PUBLISHED") {
      return NextResponse.json(
        {
          success: false,

          message: "This form is temporarily unavailable.",
        },

        {
          status: 503,
        },
      );
    }

    if (error.message?.startsWith("FORM_FIELD_")) {
      const [code, fieldId] = error.message.split(":");

      return NextResponse.json(
        {
          success: false,

          message: "Invalid form data.",

          error: {
            code,

            fieldId: fieldId || null,
          },
        },

        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,

        message: "Unable to submit form.",
      },

      {
        status: 500,
      },
    );
  }
}
