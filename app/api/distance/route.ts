import { NextRequest, NextResponse } from "next/server";

const CLINIC_LAT = process.env.NEXT_PUBLIC_CLINIC_LAT ?? "33.1972";
const CLINIC_LNG = process.env.NEXT_PUBLIC_CLINIC_LNG ?? "-96.6397";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!lat || !lng) {
      return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(null, { status: 500 });
    }

    const origin = `${lat},${lng}`;
    const destination = `${CLINIC_LAT},${CLINIC_LNG}`;

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&units=imperial&key=${apiKey}`
    );

    if (!res.ok) {
      return NextResponse.json(null, { status: 500 });
    }

    const data = await res.json();
    const element = data.rows?.[0]?.elements?.[0];

    if (!element || element.status !== "OK") {
      return NextResponse.json(null, { status: 200 });
    }

    const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=400x120&scale=2&markers=color:red%7C${CLINIC_LAT},${CLINIC_LNG}&markers=color:blue%7C${lat},${lng}&path=enc:&key=${apiKey}`;

    return NextResponse.json({
      durationText: element.duration.text,
      distanceText: element.distance.text,
      staticMapUrl,
    });
  } catch (error) {
    console.error("Distance API error:", error);
    return NextResponse.json(null, { status: 500 });
  }
}
