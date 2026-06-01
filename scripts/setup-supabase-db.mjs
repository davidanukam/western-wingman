/**
 * Applies Western Wingman DB schema (tables + RLS + realtime).
 * Run: npm run setup:db
 * Requires DIRECT_URL or DATABASE_URL in .env.local
 */
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

config({ path: resolve(process.cwd(), ".env.local") });

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Missing DIRECT_URL or DATABASE_URL in .env.local");
  process.exit(1);
}

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20250601000000_initial_schema.sql"
);
const sql = readFileSync(migrationPath, "utf8");

const client = new pg.Client({
  connectionString,
  ssl: connectionString.includes("supabase.com") ? { rejectUnauthorized: false } : undefined,
});

await client.connect();

try {
  await client.query(sql);
  console.log("Applied:", migrationPath);
} catch (e) {
  // Idempotent re-runs: ignore "already exists" style errors
  const msg = e instanceof Error ? e.message : String(e);
  if (
    msg.includes("already exists") ||
    msg.includes("duplicate key") ||
    msg.includes("is already member of publication")
  ) {
    console.log("Schema largely present; some objects already existed.");
    console.log(msg);
  } else {
    throw e;
  }
}

// Storage policies migration (optional second file)
const storagePath = resolve(
  process.cwd(),
  "supabase/migrations/20250602000000_storage_policies.sql"
);
try {
  const storageSql = readFileSync(storagePath, "utf8");
  await client.query(storageSql);
  console.log("Applied:", storagePath);
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("already exists")) {
    console.log("Storage policies already present.");
  } else {
    console.warn("Storage policies migration:", msg);
  }
}

await client.end();

const { createClient } = await import("@supabase/supabase-js");
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
for (const t of ["sightings", "pending_submissions"]) {
  const { error } = await sb.from(t).select("id").limit(1);
  console.log(`Verify ${t}:`, error ? error.message : "OK");
}

console.log("Database setup complete.");
