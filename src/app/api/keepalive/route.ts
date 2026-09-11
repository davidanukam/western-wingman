import { NextResponse } from "next/server";
import { createServiceSupabaseClient, isSupabaseConfigured } from "@/lib/supabase-server";

const noStore = { "Cache-Control": "no-store" };

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Supabase is not configured" },
      { status: 503, headers: noStore }
    );
  }

  const supabase = createServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Could not connect to database" },
      { status: 503, headers: noStore }
    );
  }

  try {
    const { error } = await supabase.from("sightings").select("id").limit(1);
    if (error) {
      console.error(error);
      return NextResponse.json(
        { ok: false, error: "Database ping failed" },
        { status: 500, headers: noStore }
      );
    }

    return NextResponse.json(
      { ok: true, at: new Date().toISOString() },
      { headers: noStore }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: "Database ping failed" },
      { status: 500, headers: noStore }
    );
  }
}
