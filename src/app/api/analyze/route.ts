import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const client = new Anthropic();

const BodySchema = z.object({
  imageBase64: z.string().min(1),
  mediaType: z.enum(["image/jpeg", "image/png", "image/gif", "image/webp"]),
});

const AnalysisSchema = z.object({
  gooseCount: z.number().int().min(0).max(500),
  isNesting: z.boolean(),
  isAggressive: z.boolean(),
  riskLevel: z.enum(["low", "medium", "high"]),
  summary: z.string().max(200),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { imageBase64, mediaType } = BodySchema.parse(json);

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 503 });
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: imageBase64 },
            },
            {
              type: "text",
              text: `Analyze this image for Canada geese on a university campus. Return ONLY valid JSON with these fields:
{
  "gooseCount": <number, 0 if no geese>,
  "isNesting": <true if a goose is sitting on a nest or eggs are visible>,
  "isAggressive": <true if a goose is hissing, wings spread, or charging>,
  "riskLevel": "low" | "medium" | "high",
  "summary": "<one sentence description max 100 chars>"
}`,
            },
          ],
        },
      ],
    });

    const block = message.content[0];
    if (block.type !== "text") {
      return NextResponse.json({ error: "Unexpected response from model" }, { status: 502 });
    }

    const raw = block.text.trim();
    const jsonSlice = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonSlice ? jsonSlice[0] : raw);
    const result = AnalysisSchema.parse(parsed);

    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
