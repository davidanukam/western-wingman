import { z } from "zod";

const PredictionSchema = z.object({
  class: z.string(),
  confidence: z.number(),
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

const RoboflowResponseSchema = z.object({
  predictions: z.array(PredictionSchema).optional(),
});

export type RoboflowDetection = {
  gooseCount: number;
  detectionConfidence: number | null;
  detectionPayload: unknown;
};

function gooseClassNames(): string[] {
  const raw = process.env.ROBOFLOW_GOOSE_CLASSES ?? "goose,Canada goose,bird";
  return raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}

function matchesGooseClass(className: string, allowed: string[]): boolean {
  const lower = className.toLowerCase();
  return allowed.some((a) => lower.includes(a) || a.includes(lower));
}

export function isRoboflowConfigured(): boolean {
  return Boolean(process.env.ROBOFLOW_API_KEY && process.env.ROBOFLOW_MODEL_ID);
}

/**
 * Run Roboflow hosted detection on a base64-encoded image.
 * @see https://docs.roboflow.com/deploy/serverless-hosted-api-v2/use-with-the-rest-api
 */
export async function detectGeese(
  imageBase64: string
): Promise<RoboflowDetection> {
  const apiKey = process.env.ROBOFLOW_API_KEY;
  const modelId = process.env.ROBOFLOW_MODEL_ID;
  if (!apiKey || !modelId) {
    throw new Error("ROBOFLOW_API_KEY and ROBOFLOW_MODEL_ID are not configured");
  }

  const threshold = Number(process.env.ROBOFLOW_CONFIDENCE_THRESHOLD ?? "0.5");
  const allowedClasses = gooseClassNames();

  const apiBase =
    process.env.ROBOFLOW_API_BASE_URL?.replace(/\/$/, "") ??
    "https://serverless.roboflow.com";
  const url = new URL(`${apiBase}/${modelId}`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("confidence", String(threshold));

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: imageBase64,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Roboflow API error ${res.status}: ${text.slice(0, 200)}`);
  }

  const json: unknown = await res.json();
  const parsed = RoboflowResponseSchema.safeParse(json);
  const predictions = parsed.success ? (parsed.data.predictions ?? []) : [];

  const boxes = predictions.filter(
    (p) =>
      p.confidence >= threshold &&
      matchesGooseClass(p.class, allowedClasses)
  );

  const gooseCount = boxes.length;
  const detectionConfidence =
    boxes.length > 0
      ? boxes.reduce((sum, b) => sum + b.confidence, 0) / boxes.length
      : null;

  return {
    gooseCount,
    detectionConfidence,
    detectionPayload: json,
  };
}
