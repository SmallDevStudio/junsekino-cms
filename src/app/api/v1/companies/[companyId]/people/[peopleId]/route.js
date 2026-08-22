import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { companyIdSchema } from "@/modules/company/company.schema";

import {
  peopleIdSchema,
  updatePeopleSchema,
} from "@/modules/people/people.schema";

import {
  deletePerson,
  getPerson,
  updatePerson,
} from "@/modules/people/people.service";

async function resolveParams(context) {
  const params = await context.params;

  const company = companyIdSchema.safeParse(params.companyId);

  const person = peopleIdSchema.safeParse(params.peopleId);

  if (!company.success || !person.success) {
    return null;
  }

  return {
    companyId: company.data,

    peopleId: person.data,
  };
}

export async function GET(request, context) {
  try {
    const params = await resolveParams(context);

    if (!params) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request parameters.",
        },
        {
          status: 400,
        },
      );
    }

    const access = await getCompanyPermission({
      companyId: params.companyId,

      permission: PERMISSIONS.PEOPLE_VIEW,
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

    const person = await getPerson({
      companyId: params.companyId,

      peopleId: params.peopleId,
    });

    return NextResponse.json({
      success: true,
      data: person,
    });
  } catch (error) {
    console.error("Get people error:", error);

    if (error.message === "PEOPLE_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          message: "People record not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve people record.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(request, context) {
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

    const params = await resolveParams(context);

    if (!params) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request parameters.",
        },
        {
          status: 400,
        },
      );
    }

    const access = await getCompanyPermission({
      companyId: params.companyId,

      permission: PERMISSIONS.PEOPLE_UPDATE,
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

    const body = await request.json();

    const validation = updatePeopleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,

          message: "Invalid people data.",

          errors: validation.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    if (Object.keys(validation.data).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No people data supplied.",
        },
        {
          status: 400,
        },
      );
    }

    const person = await updatePerson({
      companyId: params.companyId,

      peopleId: params.peopleId,

      input: validation.data,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,
      data: person,
    });
  } catch (error) {
    console.error("Update people error:", error);

    if (error.message === "PEOPLE_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          message: "People record not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (error.message === "PEOPLE_SLUG_EXISTS") {
      return NextResponse.json(
        {
          success: false,
          message: "This people slug is already in use.",
        },
        {
          status: 409,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update people record.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(request, context) {
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

    const params = await resolveParams(context);

    if (!params) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request parameters.",
        },
        {
          status: 400,
        },
      );
    }

    const access = await getCompanyPermission({
      companyId: params.companyId,

      permission: PERMISSIONS.PEOPLE_DELETE,
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

    const result = await deletePerson({
      companyId: params.companyId,

      peopleId: params.peopleId,

      currentUser: access.user,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Delete people error:", error);

    if (error.message === "PEOPLE_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          message: "People record not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (error.message === "PEOPLE_ALREADY_DELETED") {
      return NextResponse.json(
        {
          success: false,
          message: "People record has already been deleted.",
        },
        {
          status: 409,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to delete people record.",
      },
      {
        status: 500,
      },
    );
  }
}
