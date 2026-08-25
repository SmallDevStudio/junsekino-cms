import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { companyIdSchema } from "@/modules/company/company.schema";

import { formAttachmentIdSchema } from "@/modules/form/form-attachment.schema";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { createPrivateAttachmentReadUrl } from "@/modules/form/form-attachment.service";

export async function GET(request, context) {
  try {
    const params = await context.params;

    const company = companyIdSchema.safeParse(params.companyId);

    const attachment = formAttachmentIdSchema.safeParse(params.attachmentId);

    if (!company.success || !attachment.success) {
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

    const access = await getCompanyPermission({
      companyId: company.data,

      permission: PERMISSIONS.COMPANY_UPDATE,
    });

    if (!access.authorized) {
      return NextResponse.json(
        {
          success: false,
          message: access.reason,
        },
        {
          status: access.user ? 403 : 401,
        },
      );
    }

    const data = await createPrivateAttachmentReadUrl({
      companyId: company.data,

      attachmentId: attachment.data,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Preview private form attachment error:", error);

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
        message: "Unable to retrieve attachment.",
      },
      {
        status: 500,
      },
    );
  }
}
