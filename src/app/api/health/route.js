import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,

    application: "Junsekino CMS",

    environment: process.env.NEXT_PUBLIC_APP_ENV,

    timestamp: new Date().toISOString(),
  });
}
