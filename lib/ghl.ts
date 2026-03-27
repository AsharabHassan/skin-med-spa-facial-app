const GHL_BASE = "https://services.leadconnectorhq.com";

function headers() {
  const apiKey = process.env.GHL_API_KEY;
  if (!apiKey) throw new Error("Missing GHL_API_KEY");
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Version: "2021-07-28",
  };
}

/** Search for a contact by email, or create one if not found */
export async function findOrCreateContact(lead: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}): Promise<string> {
  const locationId = process.env.GHL_LOCATION_ID;
  if (!locationId) throw new Error("Missing GHL_LOCATION_ID");

  const searchRes = await fetch(
    `${GHL_BASE}/contacts/?locationId=${locationId}&query=${encodeURIComponent(lead.email)}`,
    { headers: headers() }
  );

  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.contacts?.length > 0) {
      return data.contacts[0].id;
    }
  }

  const createRes = await fetch(`${GHL_BASE}/contacts/`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      locationId,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      source: "Skin Med Spa Facial Analysis App",
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`GHL create contact failed: ${createRes.status} ${err}`);
  }

  const created = await createRes.json();
  return created.contact.id;
}

/** Update contact custom fields */
export async function updateContact(
  contactId: string,
  fields: Record<string, string>
): Promise<void> {
  const res = await fetch(`${GHL_BASE}/contacts/${contactId}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({ customFields: Object.entries(fields).map(([k, v]) => ({ key: k, value: v })) }),
  });

  if (!res.ok) {
    console.error("GHL update contact failed:", res.status);
  }
}

/** Trigger a GHL workflow by ID */
export async function triggerWorkflow(
  workflowId: string,
  contactId: string
): Promise<void> {
  const res = await fetch(
    `${GHL_BASE}/contacts/${contactId}/workflow/${workflowId}`,
    {
      method: "POST",
      headers: headers(),
    }
  );

  if (!res.ok) {
    console.error("GHL trigger workflow failed:", res.status);
  }
}
