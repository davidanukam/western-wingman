import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import type { RiskLevel } from "@/types";

const BehaviorSchema = z.object({
  isNesting: z.boolean(),
  isAggressive: z.boolean(),
  riskLevel: z.enum(["low", "medium", "high"]),
  summary: z.string().max(200),
});

export type BehaviorAnalysis = z.infer<typeof BehaviorSchema>;

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/**
 * Assess nesting/aggression from image + YOLO count (single multimodal call).
 */
export async function analyzeGooseBehavior(
  imageBase64: string,
  mediaType: string,
  gooseCount: number,
  detectionConfidence: number | null
): Promise<BehaviorAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: { maxOutputTokens: 300, temperature: 0.2 },
  });

  const confNote =
    detectionConfidence != null
      ? `${Math.round(detectionConfidence * 100)}% average detection confidence`
      : "no detection confidence";

  const prompt = `You are analyzing a campus photo for Canada geese safety.
Object detection found ${gooseCount} goose/geese (${confNote}).

Return ONLY valid JSON:
{
  "isNesting": <true if a goose is on a nest or eggs visible>,
  "isAggressive": <true if hissing, wings spread, charging posture>,
  "riskLevel": "low" | "medium" | "high",
  "summary": "<one sentence, max 100 chars>"
}`;

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: mediaType,
        data: imageBase64,
      },
    },
    { text: prompt },
  ]);

  const text = result.response.text().trim();
  const jsonSlice = text.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonSlice ? jsonSlice[0] : text);
  return BehaviorSchema.parse(parsed);
}

/** Fallback when Gemini is not configured. */
export function defaultBehaviorAnalysis(
  gooseCount: number,
  isNesting = false,
  isAggressive = false
): BehaviorAnalysis {
  let riskLevel: RiskLevel = "low";
  if (isAggressive) riskLevel = "high";
  else if (isNesting) riskLevel = "medium";
  else if (gooseCount >= 5) riskLevel = "high";
  else if (gooseCount >= 3) riskLevel = "medium";

  const summary =
    gooseCount === 0
      ? "No geese detected in frame."
      : `${gooseCount} goose${gooseCount === 1 ? "" : "ese"} detected on campus.`;

  return { isNesting, isAggressive, riskLevel, summary };
}
