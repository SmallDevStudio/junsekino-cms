import { NextResponse } from "next/server";

import { adminDb } from "@/lib/firebase/admin";

export async function GET() {
  try {
    await adminDb.collection("_health").limit(1).get();

    return NextResponse.json({
      success: true,
      firebase: "connected",
      firestore: "connected",
    });
  } catch (error) {
    console.error("Firebase health check failed:", error);

    return NextResponse.json(
      {
        success: false,
        firebase: "error",
      },
      {
        status: 500,
      },
    );
  }
}
