import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum) || latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
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
    console.log("Google Maps status:", data.status, "| element status:", element?.status);
    if (data.status !== "OK" || !element || element.status !== "OK") {
      console.error("Google Maps Distance Matrix failed:", JSON.stringify(data));
      return NextResponse.json({ error: data.status ?? "NO_RESULT" }, { status: 200 });
    }

    const staticMapUrl = `/api/static-map?userLat=${lat}&userLng=${lng}`;

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
