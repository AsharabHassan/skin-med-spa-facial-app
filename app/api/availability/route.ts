import { NextResponse } from "next/server";

// This endpoint is no longer used — availability is fetched per-date via POST /api/slots.
export async function GET() {
  return NextResponse.json({ dates: [] });
}
