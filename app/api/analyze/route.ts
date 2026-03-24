import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { SKIN_ANALYSIS_PROMPT } from "@/lib/prompts";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MAX_BASE64_BYTES = 5 * 1024 * 1024;

const skinDimensionSchema = z.object({
  id: z.number(),
  name: z.string(),
  concern: z.string(),
  severity: z.enum(["healthy", "mild", "moderate"]),
  highlightAreas: z.array(z.string()),
});

const facialRecommendationSchema = z.object({
  rank: z.number(),
  facialName: z.string(),
  matchReason: z.string(),
  shortDescription: z.string(),
});

const analysisResultSchema = z.object({
  skinType: z.string(),
  estimatedAgeRange: z.string(),
  overallSummary: z.string(),
  dimensions: z.array(skinDimensionSchema).length(5),
  recommendations: z.array(facialRecommendationSchema).length(3),
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
              text: SKIN_ANALYSIS_PROMPT,
            },
          ],
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

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
