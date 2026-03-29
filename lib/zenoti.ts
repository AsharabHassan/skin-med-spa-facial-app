const ZENOTI_BASE = process.env.ZENOTI_API_URL || "https://api.zenoti.com/v1";

function authHeaders() {
  const apiKey = process.env.ZENOTI_API_KEY;
  if (!apiKey) throw new Error("Missing ZENOTI_API_KEY");
  return {
    Authorization: `apikey ${apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

function centerId(): string {
  const id = process.env.ZENOTI_CENTER_ID;
  if (!id) throw new Error("Missing ZENOTI_CENTER_ID");
  return id;
}

function serviceId(): string {
  const id = process.env.ZENOTI_SERVICE_ID;
  if (!id) throw new Error("Missing ZENOTI_SERVICE_ID");
  return id;
}

function therapistId(): string {
  return process.env.ZENOTI_THERAPIST_ID ?? "8dabd448-c466-456d-9b92-39a03ea6aa3a";
}

// ─── Date helpers ────────────────────────────────────────────────────────────

/** "2026-03-28" → "2026-03-28" (already correct for Create Booking) */
function toBookingDate(dateStr: string): string {
  return dateStr; // yyyy-MM-dd — Zenoti accepts this for POST /bookings
}

/** "2026-03-28" + "9:00 AM" → "2026-03-28T09:00:00" */
function toIsoDateTime(dateStr: string, timeStr: string): string {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return `${dateStr}T09:00:00`;
  let h = parseInt(match[1]);
  const m = match[2];
  const period = match[3].toUpperCase();
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return `${dateStr}T${h.toString().padStart(2, "0")}:${m}:00`;
}

/** ISO/raw time string → "9:00 AM" display format */
function toDisplayTime(raw: string): string {
  // Try as full ISO datetime first
  const d = new Date(raw);
  if (!isNaN(d.getTime())) {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  }
  // Already HH:MM or HH:MM:SS
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    const h = parseInt(match[1]);
    const m = match[2];
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${m} ${period}`;
  }
  return raw;
}

// ─── Guest ───────────────────────────────────────────────────────────────────

/** Find existing Zenoti guest by email, or create a new one. Returns guest_id. */
export async function findOrCreateGuest(guest: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}): Promise<string> {
  // Strip country code from phone (keep digits only, max 10)
  const cleanPhone = guest.phone.replace(/\D/g, "").replace(/^1/, "").slice(-10);

  // Search by email first
  const searchRes = await fetch(
    `${ZENOTI_BASE}/guests/search?center_id=${centerId()}&email=${encodeURIComponent(guest.email)}`,
    { headers: authHeaders() }
  );
  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.guests?.length > 0) return data.guests[0].id;
  }

  // Create new guest — matches n8n workflow Create Guest node exactly
  const createRes = await fetch(`${ZENOTI_BASE}/guests`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      center_id: centerId(),
      personal_info: {
        first_name: guest.firstName,
        last_name: guest.lastName,
        email: guest.email,
        mobile_phone: { number: cleanPhone },
      },
      address_info: { country_id: 225 }, // 225 = United States
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Zenoti create guest failed: ${createRes.status} ${err}`);
  }

  const created = await createRes.json();
  return created.id;
}

// ─── Availability ─────────────────────────────────────────────────────────────

/**
 * Fetch real available slots for a date using undici (supports GET+body).
 * Node.js fetch silently drops body on GET requests; undici does not.
 * Returns display times ("10:00 AM") for Available slots only, plus the bookingId
 * so it can be reused at reservation time without creating a second booking.
 */
export async function getAvailableSlotsForDate(
  dateStr: string,
  lead: { firstName: string; lastName: string; email: string; phone: string }
): Promise<{ slots: string[]; bookingId: string }> {
  const { request: undiciRequest } = await import("undici");

  const guestId = await findOrCreateGuest(lead);

  // Create a pending booking for this date
  const bookingRes = await fetch(`${ZENOTI_BASE}/bookings`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      center_id: centerId(),
      date: dateStr,
      is_family_booking: false,
      is_only_catalog_employees: false,
      slot_id: null,
      is_surprise: false,
      is_double_booking_enabled: true,
      guests: [
        {
          id: guestId,
          items: [{ item: { id: serviceId() }, therapist: { id: therapistId() } }],
        },
      ],
    }),
  });

  if (!bookingRes.ok) {
    const err = await bookingRes.text();
    throw new Error(`Zenoti booking failed: ${bookingRes.status} ${err}`);
  }

  const booking = await bookingRes.json();
  const bookingId: string = booking.id;

  // GET /slots with JSON body — requires undici, not fetch
  const { statusCode, body } = await undiciRequest(
    `${ZENOTI_BASE}/bookings/${bookingId}/slots`,
    {
      method: "GET",
      headers: authHeaders() as Record<string, string>,
      body: JSON.stringify({ item_id: serviceId(), date: dateStr }),
    }
  );

  if (statusCode !== 200) {
    const text = await body.text();
    console.warn(`Zenoti slots ${statusCode} for ${dateStr}: ${text}`);
    return { slots: [], bookingId };
  }

  const data = await body.json() as Record<string, unknown>;
  const rawList = (data.slots ?? []) as Array<Record<string, unknown>>;

  const slots: string[] = [];
  for (const slot of rawList) {
    if (slot.Available !== true) continue;
    const raw = slot.Time as string;
    if (!raw) continue;
    const display = toDisplayTime(raw);
    if (display && !slots.includes(display)) slots.push(display);
  }

  return { slots, bookingId };
}

// ─── Booking ──────────────────────────────────────────────────────────────────

/**
 * Full Zenoti booking flow (mirrors n8n workflow exactly):
 * 1. Find or create guest
 * 2. POST /v1/bookings          → booking_id
 * 3. POST /v1/bookings/{id}/slots/reserve  → lock slot_time
 * 4. POST /v1/bookings/{id}/slots/confirm  → confirm
 */
export async function createAppointment(params: {
  date: string;   // "2026-03-28"
  time: string;   // "10:30 AM"
  serviceName: string;
  guest: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}): Promise<{ id: string }> {
  const guestId = await findOrCreateGuest(params.guest);
  const slotTime = toIsoDateTime(params.date, params.time); // "2026-03-28T10:30:00"

  // Step 1 — Create booking (pending, no slot yet)
  const bookingRes = await fetch(`${ZENOTI_BASE}/bookings`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      center_id: centerId(),
      date: toBookingDate(params.date),
      is_family_booking: false,
      is_only_catalog_employees: false,
      slot_id: null,
      is_surprise: false,
      is_double_booking_enabled: true,
      guests: [
        {
          id: guestId,
          items: [
            {
              item: { id: serviceId() },
              therapist: { id: therapistId() },
            },
          ],
        },
      ],
    }),
  });

  if (!bookingRes.ok) {
    const err = await bookingRes.text();
    throw new Error(`Zenoti create booking failed: ${bookingRes.status} ${err}`);
  }

  const booking = await bookingRes.json();
  const bookingId: string = booking.id;
  console.log("Zenoti booking created:", bookingId);

  // Step 2 — Reserve the selected slot
  const reserveRes = await fetch(`${ZENOTI_BASE}/bookings/${bookingId}/slots/reserve`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      slot_time: slotTime,
      create_invoice: false,
    }),
  });

  if (!reserveRes.ok) {
    const err = await reserveRes.text();
    throw new Error(`Zenoti reserve slot failed: ${reserveRes.status} ${err}`);
  }
  console.log("Zenoti slot reserved:", slotTime);

  // Step 3 — Confirm the booking
  const confirmRes = await fetch(`${ZENOTI_BASE}/bookings/${bookingId}/slots/confirm`, {
    method: "POST",
    headers: authHeaders(),
  });

  if (!confirmRes.ok) {
    const err = await confirmRes.text();
    throw new Error(`Zenoti confirm booking failed: ${confirmRes.status} ${err}`);
  }
  console.log("Zenoti booking confirmed:", bookingId);

  return { id: bookingId };
}

/**
 * Create guest + booking + reserve the chosen slot — called before charging the card.
 * Returns bookingId so confirm route can skip straight to /slots/confirm.
 * Throws with a user-facing message if the slot is unavailable.
 */
export async function reserveSlotForPayment(params: {
  date: string;
  time: string;
  guest: { firstName: string; lastName: string; email: string; phone: string };
}): Promise<string> {
  const guestId = await findOrCreateGuest(params.guest);
  const slotTime = toIsoDateTime(params.date, params.time);

  // Create pending booking
  const bookingRes = await fetch(`${ZENOTI_BASE}/bookings`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      center_id: centerId(),
      date: toBookingDate(params.date),
      is_family_booking: false,
      is_only_catalog_employees: false,
      slot_id: null,
      is_surprise: false,
      is_double_booking_enabled: true,
      guests: [
        {
          id: guestId,
          items: [
            {
              item: { id: serviceId() },
              therapist: { id: therapistId() },
            },
          ],
        },
      ],
    }),
  });

  if (!bookingRes.ok) {
    const err = await bookingRes.text();
    throw new Error(`Booking creation failed: ${bookingRes.status} ${err}`);
  }

  const booking = await bookingRes.json();
  const bookingId: string = booking.id;

  // Reserve the chosen slot
  const reserveRes = await fetch(`${ZENOTI_BASE}/bookings/${bookingId}/slots/reserve`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ slot_time: slotTime, create_invoice: false }),
  });

  const reserveData = await reserveRes.json();

  if (!reserveRes.ok || reserveData?.Error || !reserveData?.is_reserved) {
    const msg = reserveData?.Error?.Message ?? "Slot is not available";
    throw Object.assign(new Error(msg), { slotUnavailable: true });
  }

  console.log("Zenoti slot reserved for payment:", bookingId, slotTime);
  return bookingId;
}

/**
 * Reserve a specific slot on a pre-created booking (from availability check).
 * Throws with slotUnavailable=true if the slot is taken.
 */
export async function reserveSlotOnBooking(
  bookingId: string,
  date: string,
  time: string
): Promise<void> {
  const slotTime = toIsoDateTime(date, time);
  const reserveRes = await fetch(`${ZENOTI_BASE}/bookings/${bookingId}/slots/reserve`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ slot_time: slotTime, create_invoice: false }),
  });

  const reserveData = await reserveRes.json();
  if (!reserveRes.ok || reserveData?.Error || !reserveData?.is_reserved) {
    const msg = reserveData?.Error?.Message ?? "Slot is not available";
    throw Object.assign(new Error(msg), { slotUnavailable: true });
  }
  console.log("Zenoti slot reserved:", bookingId, slotTime);
}

/**
 * Confirm a pre-reserved booking (called after payment succeeds).
 */
export async function confirmReservedBooking(bookingId: string): Promise<void> {
  const confirmRes = await fetch(`${ZENOTI_BASE}/bookings/${bookingId}/slots/confirm`, {
    method: "POST",
    headers: authHeaders(),
  });

  if (!confirmRes.ok) {
    const err = await confirmRes.text();
    throw new Error(`Zenoti confirm failed: ${confirmRes.status} ${err}`);
  }
  console.log("Zenoti booking confirmed:", bookingId);
}
