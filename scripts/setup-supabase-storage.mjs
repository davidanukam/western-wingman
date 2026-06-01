/**
 * Creates sightings-pending and sightings-approved storage buckets.
 * Run: node scripts/setup-supabase-storage.mjs
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const buckets = [
  { id: "sightings-pending", name: "sightings-pending", public: false },
  { id: "sightings-approved", name: "sightings-approved", public: true },
];

async function ensureBucket(bucket) {
  const res = await fetch(`${url}/storage/v1/bucket`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: bucket.id,
      name: bucket.name,
      public: bucket.public,
      file_size_limit: 20971520,
      allowed_mime_types: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    }),
  });

  if (res.ok) {
    console.log(`Created bucket: ${bucket.id}`);
    return;
  }

  const body = await res.text();
  if (res.status === 409 || body.toLowerCase().includes("already exists")) {
    console.log(`Bucket already exists: ${bucket.id}`);
    return;
  }

  throw new Error(`Failed to create ${bucket.id} (${res.status}): ${body}`);
}

for (const bucket of buckets) {
  await ensureBucket(bucket);
}

console.log("Storage buckets ready.");
