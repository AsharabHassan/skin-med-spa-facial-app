const ZENOTI_BASE = process.env.ZENOTI_API_URL ?? "https://api.zenoti.com/v1";

function headers() {
  const apiKey = process.env.ZENOTI_API_KEY;
  if (!apiKey) throw new Error("Missing ZENOTI_API_KEY");
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

function centerId(): string {
  const id = process.env.ZENOTI_CENTER_ID;
  if (!id) throw new Error("Missing ZENOTI_CENTER_ID");
  return id;
}

/** Fetch available slots from Zenoti for a date range */
export async function getAvailableSlots(
  startDate: string,
  endDate: string
): Promise<{ date: string; slots: string[] }[]> {
  const serviceId = process.env.ZENOTI_SERVICE_ID;

  const res = await fetch(
    `${ZENOTI_BASE}/bookings/availability?center_id=${centerId()}&date=${startDate}&end_date=${endDate}${serviceId ? `&service_id=${serviceId}` : ""}`,
    { headers: headers() }
  );

  if (!res.ok) {
    console.error("Zenoti availability error:", res.status);
    return [];
  }

  const data = await res.json();

  const result: { date: string; slots: string[] }[] = [];

  if (data?.slots) {
    // Zenoti returns slots grouped by date
    for (const daySlot of data.slots) {
      const dateStr = daySlot.date?.split("T")[0] ?? daySlot.date;
      const times = (daySlot.available_times ?? daySlot.times ?? []).map(
        (t: { time?: string; start_time?: string }) => {
          const raw = t.time ?? t.start_time ?? "";
          // Convert ISO/24h to 12h format for display
          const d = new Date(raw);
          if (isNaN(d.getTime())) return raw;
          return d.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
        }
      );
      if (times.length > 0) {
        result.push({ date: dateStr, slots: times });
      }
    }
  }

  return result;
}

/** Check if a specific slot is still available */
export async function isSlotAvailable(
  date: string,
  time: string
): Promise<boolean> {
  const slots = await getAvailableSlots(date, date);
  const daySlots = slots.find((d) => d.date === date);
  return daySlots ? daySlots.slots.includes(time) : false;
}

/** Create an appointment in Zenoti */
export async function createAppointment(params: {
  guestId?: string;
  startTime: string;
  serviceName: string;
  notes?: string;
  guest?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}): Promise<{ id: string }> {
  // If no guestId, create a guest first
  let guestId = params.guestId;
  if (!guestId && params.guest) {
    guestId = await findOrCreateGuest(params.guest);
  }

  const res = await fetch(`${ZENOTI_BASE}/bookings`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      center_id: centerId(),
      date: params.startTime,
      is_only_catalog_employees: false,
      slots: [
        {
          guest_id: guestId,
          services: [
            {
              service: {
                id: process.env.ZENOTI_SERVICE_ID,
                name: params.serviceName,
              },
            },
          ],
        },
      ],
      notes: params.notes ?? `Booked via Skin Med Spa App - ${params.serviceName}`,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Zenoti create appointment failed: ${res.status} ${err}`);
  }

  const data = await res.json();
  return { id: data.appointment_id ?? data.id ?? "unknown" };
}

/** Find or create a guest in Zenoti */
async function findOrCreateGuest(guest: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}): Promise<string> {
  // Search by email
  const searchRes = await fetch(
    `${ZENOTI_BASE}/guests/search?center_id=${centerId()}&email=${encodeURIComponent(guest.email)}`,
    { headers: headers() }
  );

  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.guests?.length > 0) {
      return data.guests[0].id;
    }
  }

  // Create new guest
  const createRes = await fetch(`${ZENOTI_BASE}/guests`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      center_id: centerId(),
      personal_info: {
        first_name: guest.firstName,
        last_name: guest.lastName,
        email: guest.email,
        mobile_phone: { number: guest.phone },
      },
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Zenoti create guest failed: ${createRes.status} ${err}`);
  }

  const created = await createRes.json();
  return created.id;
}
