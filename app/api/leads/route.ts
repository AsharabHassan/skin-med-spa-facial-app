import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const {
      firstName, lastName, email, phone, marketingConsent,
      analysisResult,
      metaEventId, metaEventSourceUrl, metaUserAgent, metaFbp, metaFbc,
    } = await req.json();

    const webhookUrl = process.env.WEBHOOK_URL || "https://services.leadconnectorhq.com/hooks/8uElW7d5ZvUZkgLgQDN8/webhook-trigger/0mtWSQpsC0DEeLhb1gEK";

    // Extract client IP for Meta CAPI
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("x-real-ip") ??
      null;

    // Flatten zones into individual fields for CRM readability
    const zoneFields: Record<string, string> = {};
    if (analysisResult?.zones) {
      for (const zone of analysisResult.zones) {
        const key = zone.overlayRegion;
        zoneFields[`zone_${key}_name`]          = zone.name;
        zoneFields[`zone_${key}_concern`]        = zone.concern;
        zoneFields[`zone_${key}_recommendation`] = zone.recommendation;
        zoneFields[`zone_${key}_severity`]       = zone.severity;
      }
    }

    // Plain-text summary for CRM notes
    const analysisSummary = analysisResult?.zones
      ?.map((z: { name: string; severity: string; concern: string; recommendation: string }) =>
        `${z.name} (${z.severity}): ${z.concern} → ${z.recommendation}`
      )
      .join("\n") ?? "";

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // ── Contact details ──────────────────────────────
        firstName,
        lastName,
        email,
        phone,
        marketingConsent,

        // ── Face analysis ────────────────────────────────
        faceShape:       analysisResult?.faceShape ?? null,
        overallSummary:  analysisResult?.overallSummary ?? null,
        analysisSummary,
        ...zoneFields,

        // ── Meta Conversions API fields ──────────────────
        meta_pixel_id:         process.env.NEXT_PUBLIC_META_PIXEL_ID || "424986547363126",
        meta_event_id:         metaEventId ?? null,
        meta_event_name:       "Lead",
        meta_event_source_url: metaEventSourceUrl ?? null,
        // Server-side user data (for CAPI)
        meta_client_ip_address:  clientIp,
        meta_client_user_agent:  metaUserAgent ?? req.headers.get("user-agent"),
        meta_fbp:                metaFbp ?? null,
        meta_fbc:                metaFbc ?? null,
        // SHA-256 hashed PII (required by Meta CAPI)
        meta_hashed_email:       email   ? sha256(email)   : null,
        meta_hashed_phone:       phone   ? sha256(phone)   : null,
        meta_hashed_first_name:  firstName ? sha256(firstName) : null,
        meta_hashed_last_name:   lastName  ? sha256(lastName)  : null,

        // ── Meta ────────────────────────────────────────
        source:      "Harley Street Aesthetics Filler Analysis App",
        submittedAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.error("Webhook error:", response.status);
      return NextResponse.json({ success: true, warning: "Webhook delivery failed" });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lead submission error:", error);
    return NextResponse.json({ success: true, warning: "Webhook delivery failed" });
  }
}
