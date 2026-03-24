import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { FILLER_ANALYSIS_PROMPT } from "@/lib/prompts";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MAX_BASE64_BYTES = 5 * 1024 * 1024; // 5 MB

const faceZoneSchema = z.object({
  id: z.number(),
  name: z.string(),
  concern: z.string(),
  recommendation: z.string(),
  severity: z.enum(["none", "mild", "moderate"]),
  overlayRegion: z.enum(["forehead", "temples", "undereyes", "cheeks", "lips", "jawline"]),
});

const analysisResultSchema = z.object({
  faceShape: z.string(),
  overallSummary: z.string(),
  zones: z.array(faceZoneSchema).length(6),
});

export async function POST(req: NextRequest) {
  try {
    const { imageDataUrl } = await req.json();

    if (!imageDataUrl || !imageDataUrl.startsWith("data:image/")) {
      return NextResponse.json({ error: "Invalid image data" }, { status: 400 });
    }

    const base64 = imageDataUrl.split(",")[1];

    if (base64.length > MAX_BASE64_BYTES) {
      return NextResponse.json(
        { error: "Image too large. Please use a smaller photo." },
        { status: 413 }
      );
    }

    const mediaType = imageDataUrl.split(";")[0].split(":")[1] as
      | "image/jpeg"
      | "image/png"
      | "image/webp";

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: FILLER_ANALYSIS_PROMPT,
            },
          ],
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Strip markdown code fences if Claude wraps the JSON (e.g. ```json ... ```)
    const cleanedText = responseText
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleanedText);
    } catch {
      console.error("Claude returned non-JSON:", responseText.slice(0, 200));
      return NextResponse.json(
        { error: "Analysis failed. Please try again." },
        { status: 500 }
      );
    }

    const result = analysisResultSchema.safeParse(parsed);
    if (!result.success) {
      console.error("Claude response failed schema validation:", result.error);
      return NextResponse.json(
        { error: "Analysis failed. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ result: result.data });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}
