import { NextResponse } from "next/server";

import { companySlugSchema } from "@/modules/company/company-slug.schema";

import { formSlugSchema } from "@/modules/form/form.schema";

import { formAttachmentIdSchema } from "@/modules/form/form-attachment.schema";

import { resolvePublicCompany } from "@/modules/company/company-slug.service";

import { finalizePublicFormAttachment } from "@/modules/form/form-attachment.service";

import { isTrustedOrigin } from "@/lib/auth/origin";

import {
  attachVisitorCookie,
  hashVisitorId,
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

    const attachment = formAttachmentIdSchema.safeParse(params.attachmentId);

    if (!company.success || !form.success || !attachment.success) {
      return NextResponse.json(
        {
          success: false,

          message: "Attachment not found.",
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

          message: "Attachment not found.",
        },

        {
          status: 404,
        },
      );
    }

    const visitor = resolveVisitor(request);

    const visitorHash = hashVisitorId(
      visitor.visitorId,

      resolved.company.id,
    );

    const data = await finalizePublicFormAttachment({
      companyId: resolved.company.id,

      formSlug: form.data,

      attachmentId: attachment.data,

      visitorHash,
    });

    const response = NextResponse.json({
      success: true,

      data,
    });

    /*
     * Normally this cookie already exists from
     * the attachment upload initialization.
     *
     * Keep a fallback for supported clients that
     * finalize within the same visitor workflow.
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
      "Finalize form attachment error:",

      error,
    );

    const badRequests = [
      "FORM_ATTACHMENT_FILE_NOT_UPLOADED",

      "FORM_ATTACHMENT_TYPE_NOT_ALLOWED",

      "FORM_ATTACHMENT_TOO_LARGE",

      "FORM_ATTACHMENT_MIME_MISMATCH",

      "FORM_ATTACHMENT_SIZE_MISMATCH",

      "FORM_ATTACHMENT_INVALID_STATUS",
    ];

    if (badRequests.includes(error.message)) {
      return NextResponse.json(
        {
          success: false,

          message: error.message,
        },

        {
          status: 400,
        },
      );
    }

    if (error.message === "FORM_ATTACHMENT_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,

          message: "Attachment not found.",
        },

        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,

        message: "Unable to finalize attachment.",
      },

      {
        status: 500,
      },
    );
  }
}
