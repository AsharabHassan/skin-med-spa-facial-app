import { NextResponse } from "next/server";
import { request as undiciRequest } from "undici";

const ZENOTI_BASE = "https://api.zenoti.com/v1";

export async function GET() {
  const apiKey = process.env.ZENOTI_API_KEY!;
  const centerId = process.env.ZENOTI_CENTER_ID!;
  const serviceId = process.env.ZENOTI_SERVICE_ID!;
  const therapistId = process.env.ZENOTI_THERAPIST_ID!;

  const headers = {
    Authorization: `apikey ${apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const log: Record<string, unknown> = {};

  // Step 1: find existing test guest
  const searchRes = await fetch(
    `${ZENOTI_BASE}/guests/search?center_id=${centerId}&email=zenotitest@example.com`,
    { headers }
  );
  const searchData = await searchRes.json();
  const guestId: string = searchData.guests?.[0]?.id;
  log.guest_id = guestId ?? "not found";
  if (!guestId) return NextResponse.json({ error: "Test guest not found", log });

  // Step 2: create booking for Saturday
  const dateStr = "2026-03-28"; // today = Saturday
  const bookingRes = await fetch(`${ZENOTI_BASE}/bookings`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      center_id: centerId,
      date: dateStr,
      is_family_booking: false,
      is_only_catalog_employees: false,
      slot_id: null,
      is_surprise: false,
      is_double_booking_enabled: true,
      guests: [{ id: guestId, items: [{ item: { id: serviceId }, therapist: { id: therapistId } }] }],
    }),
  });
  const bookingData = await bookingRes.json();
  const bookingId: string = bookingData.id;
  log.booking_id = bookingId;
  if (!bookingId) return NextResponse.json({ error: "Booking failed", log, bookingData });

  // Step 3: GET /slots using undici (supports GET+body, unlike Node.js fetch)
  const { statusCode, body } = await undiciRequest(
    `${ZENOTI_BASE}/bookings/${bookingId}/slots`,
    {
      method: "GET",
      headers,
      body: JSON.stringify({ item_id: serviceId, date: dateStr }),
    }
  );
  const slotsData = await body.json() as Record<string, unknown>;
  log.slots_via_undici = { statusCode, body: slotsData };

  return NextResponse.json({ success: true, log });
}
