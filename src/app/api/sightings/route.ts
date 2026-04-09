import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const SightingSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  gooseCount: z.number().int().min(1).max(500),
  isNesting: z.boolean().default(false),
  isAggressive: z.boolean().default(false),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
  aiSummary: z.string().optional(),
  locationName: z.string().optional(),
  reporterName: z.string().optional(),
});

export async function GET() {
  try {
    const sightings = await prisma.sighting.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json(sightings);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load sightings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = SightingSchema.parse(body);

    const riskLevel = data.isAggressive ? "high" : data.isNesting ? "medium" : "low";

    const sighting = await prisma.sighting.create({
      data: { ...data, riskLevel },
    });

    return NextResponse.json(sighting, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to create sighting" }, { status: 500 });
  }
}
