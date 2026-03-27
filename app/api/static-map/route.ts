import { NextRequest, NextResponse } from "next/server";

const CLINIC_LAT = process.env.NEXT_PUBLIC_CLINIC_LAT ?? "33.1972";
const CLINIC_LNG = process.env.NEXT_PUBLIC_CLINIC_LNG ?? "-96.6397";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userLat = searchParams.get("userLat");
    const userLng = searchParams.get("userLng");

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return new NextResponse(null, { status: 500 });
    }

    let markers = `markers=color:red%7C${CLINIC_LAT},${CLINIC_LNG}`;
    if (userLat && userLng) {
      const lat = parseFloat(userLat);
      const lng = parseFloat(userLng);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        markers += `&markers=color:blue%7C${lat},${lng}`;
      }
    }

    const url = `https://maps.googleapis.com/maps/api/staticmap?size=400x120&scale=2&${markers}&key=${apiKey}`;
    const res = await fetch(url);

    if (!res.ok) {
      return new NextResponse(null, { status: 502 });
    }

    const imageBuffer = await res.arrayBuffer();

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
