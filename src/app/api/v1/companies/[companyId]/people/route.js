import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/constants/permissions";

import { PEOPLE_STATUSES, PEOPLE_TYPES } from "@/constants/people";

import { getCompanyPermission } from "@/lib/auth/company-guards";

import { isTrustedOrigin } from "@/lib/auth/origin";

import { companyIdSchema } from "@/modules/company/company.schema";

import { createPeopleSchema } from "@/modules/people/people.schema";

import { createPerson, listPeople } from "@/modules/people/people.service";

async function resolveCompanyId(context) {
  const params = await context.params;

  const validation = companyIdSchema.safeParse(params.companyId);

  if (!validation.success) {
    return null;
  }

  return validation.data;
}

export async function GET(request, context) {
  try {
    const companyId = await resolveCompanyId(context);

    if (!companyId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid company ID.",
        },
        {
          status: 400,
        },
      );
    }

    const access = await getCompanyPermission({
      companyId,

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

    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");

    const peopleType = searchParams.get("peopleType");

    const search = searchParams.get("search");

    if (status && !PEOPLE_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid people status.",
        },
        {
          status: 400,
        },
      );
    }

    if (peopleType && !PEOPLE_TYPES.includes(peopleType)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid people type.",
        },
        {
          status: 400,
        },
      );
    }

    const people = await listPeople({
      companyId,
      status,
      peopleType,
      search,
    });

    return NextResponse.json({
      success: true,
      data: people,
    });
  } catch (error) {
    console.error("List people error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve people.",
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

    const companyId = await resolveCompanyId(context);

    if (!companyId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid company ID.",
        },
        {
          status: 400,
        },
      );
    }

    const access = await getCompanyPermission({
      companyId,

      permission: PERMISSIONS.PEOPLE_CREATE,
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

    const validation = createPeopleSchema.safeParse(body);

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

    const person = await createPerson({
      companyId,

      input: validation.data,

      currentUser: access.user,
    });

    return NextResponse.json(
      {
        success: true,
        data: person,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Create people error:", error);

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

    if (error.message === "PEOPLE_NAME_REQUIRED") {
      return NextResponse.json(
        {
          success: false,
          message: "Name is required in at least one language.",
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create people record.",
      },
      {
        status: 500,
      },
    );
  }
}
