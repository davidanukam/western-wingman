import { NextResponse } from "next/server";
import { mapSightingRow } from "@/lib/sightings";
import { createServiceSupabaseClient, isSupabaseConfigured } from "@/lib/supabase-server";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json([]);
  }

  const supabase = createServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json([]);
  }

  try {
    const { data, error } = await supabase
      .from("sightings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Failed to load sightings" },
        { status: 500 }
      );
    }

    return NextResponse.json((data ?? []).map(mapSightingRow));
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load sightings" },
      { status: 500 }
    );
  }
}
