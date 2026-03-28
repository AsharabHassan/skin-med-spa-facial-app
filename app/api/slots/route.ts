import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlotsForDate } from "@/lib/zenoti";

export async function POST(req: NextRequest) {
  try {
    const { date, lead } = await req.json();

    if (!date || !lead) {
      return NextResponse.json({ error: "date and lead required" }, { status: 400 });
    }

    const { slots, bookingId } = await getAvailableSlotsForDate(date, lead);
    return NextResponse.json({ slots, bookingId });
  } catch (error) {
    console.error("Slots API error:", error);
    return NextResponse.json({ slots: [], bookingId: "" });
  }
}
