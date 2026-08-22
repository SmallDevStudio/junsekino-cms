import { NextResponse } from "next/server";

import { adminDb } from "@/lib/firebase/admin";

import { getCurrentUser } from "@/lib/auth/current-user";

import { serializeFirestoreDocument } from "@/utils/firestore";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        {
          status: 401,
        },
      );
    }

    if (user.isSuperAdmin) {
      const snapshot = await adminDb.collection("companies").get();

      const companies = snapshot.docs
        .map((document) => ({
          id: document.id,

          ...document.data(),
        }))
        .filter((company) => !company.deletedAt)
        .map(serializeFirestoreDocument);

      return NextResponse.json({
        success: true,
        data: companies,
      });
    }

    /*
     * Firestore collectionGroup allows us
     * to locate memberships belonging to
     * this uid across companies.
     *
     * We also keep userId explicitly in
     * membership documents.
     */

    const membershipsSnapshot = await adminDb
      .collectionGroup("members")
      .where("userId", "==", user.uid)
      .where("status", "==", "active")
      .get();

    const memberships = membershipsSnapshot.docs.filter(
      (document) => !document.data().deletedAt,
    );

    const companies = await Promise.all(
      memberships.map(async (membership) => {
        const companyRef = membership.ref.parent.parent;

        if (!companyRef) {
          return null;
        }

        const companySnapshot = await companyRef.get();

        if (!companySnapshot.exists) {
          return null;
        }

        const company = {
          id: companySnapshot.id,

          ...companySnapshot.data(),
        };

        if (company.deletedAt || company.status === "archived") {
          return null;
        }

        return {
          ...serializeFirestoreDocument(company),

          membership: serializeFirestoreDocument({
            id: membership.id,

            ...membership.data(),
          }),
        };
      }),
    );

    return NextResponse.json({
      success: true,

      data: companies.filter(Boolean),
    });
  } catch (error) {
    console.error("Current user companies error:", error);

    return NextResponse.json(
      {
        success: false,

        message: "Unable to retrieve companies.",
      },
      {
        status: 500,
      },
    );
  }
}
