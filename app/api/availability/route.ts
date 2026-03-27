import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/zenoti";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "startDate and endDate required" }, { status: 400 });
    }

    const dates = await getAvailableSlots(startDate, endDate);
    return NextResponse.json({ dates });
  } catch (error) {
    console.error("Availability API error:", error);
    return NextResponse.json({ dates: [] });
  }
}
