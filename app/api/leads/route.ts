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

    const webhookUrl = process.env.GHL_WEBHOOK_URL;

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("x-real-ip") ??
      null;

    // Flatten dimensions into individual fields for CRM readability
    const dimensionFields: Record<string, string> = {};
    if (analysisResult?.dimensions) {
      for (const dim of analysisResult.dimensions) {
        const key = dim.name.toLowerCase().replace(/[^a-z]/g, "_");
        dimensionFields[`skin_${key}_concern`] = dim.concern;
        dimensionFields[`skin_${key}_severity`] = dim.severity;
      }
    }

    // Flatten recommendations
    const recommendationFields: Record<string, string> = {};
    if (analysisResult?.recommendations) {
      for (const rec of analysisResult.recommendations) {
        recommendationFields[`recommendation_${rec.rank}_name`] = rec.facialName;
        recommendationFields[`recommendation_${rec.rank}_reason`] = rec.matchReason;
      }
    }

    // Plain-text summary for CRM notes
    const analysisSummary = [
      `Skin Type: ${analysisResult?.skinType ?? "unknown"}`,
      `Age Range: ${analysisResult?.estimatedAgeRange ?? "unknown"}`,
      "",
      "SKIN DIMENSIONS:",
      ...(analysisResult?.dimensions?.map(
        (d: { name: string; severity: string; concern: string }) =>
          `${d.name} (${d.severity}): ${d.concern}`
      ) ?? []),
      "",
      "RECOMMENDED FACIALS:",
      ...(analysisResult?.recommendations?.map(
        (r: { rank: number; facialName: string; matchReason: string }) =>
          `#${r.rank} ${r.facialName} — ${r.matchReason}`
      ) ?? []),
    ].join("\n");

    const payload = {
      firstName,
      lastName,
      email,
      phone,
      marketingConsent,
      skinType: analysisResult?.skinType ?? null,
      overallSummary: analysisResult?.overallSummary ?? null,
      analysisSummary,
      ...dimensionFields,
      ...recommendationFields,
      meta_pixel_id: process.env.NEXT_PUBLIC_META_PIXEL_ID || null,
      meta_event_id: metaEventId ?? null,
      meta_event_name: "Lead",
      meta_event_source_url: metaEventSourceUrl ?? null,
      meta_client_ip_address: clientIp,
      meta_client_user_agent: metaUserAgent ?? req.headers.get("user-agent"),
      meta_fbp: metaFbp ?? null,
      meta_fbc: metaFbc ?? null,
      meta_hashed_email: email ? sha256(email) : null,
      meta_hashed_phone: phone ? sha256(phone) : null,
      meta_hashed_first_name: firstName ? sha256(firstName) : null,
      meta_hashed_last_name: lastName ? sha256(lastName) : null,
      source: "Skin Med Spa Facial Analysis App",
      submittedAt: new Date().toISOString(),
    };

    if (webhookUrl) {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error("Webhook error:", response.status);
        return NextResponse.json({ success: true, warning: "Webhook delivery failed" });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lead submission error:", error);
    return NextResponse.json({ success: true, warning: "Webhook delivery failed" });
  }
}
