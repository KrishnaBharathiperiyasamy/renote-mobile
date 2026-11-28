import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { success: false, message: "Development mock session is disabled." },
    { status: 403 }
  );
}
