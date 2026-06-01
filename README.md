# Western Wingman

Live goose sightings, heatmap, and safety tips for Western University campus.

## Setup

1. Copy [`.env.example`](.env.example) to `.env.local` and fill in values.
2. Create tables (required before submit works):
   - Supabase Dashboard → **SQL Editor** → paste [`supabase/setup-all.sql`](supabase/setup-all.sql) → **Run**
   - Or: `npm run setup:db` (needs a valid `DIRECT_URL` in `.env.local`)
3. Create storage buckets: `npm run setup:storage` (you already have `sightings-pending` / `sightings-approved`)
   - Or run everything: `npm run setup:supabase`
4. Enable **Realtime** for `public.sightings` (included in migration).
5. [Roboflow](https://roboflow.com): deploy a hosted detection model; set `ROBOFLOW_API_KEY` and `ROBOFLOW_MODEL_ID` (e.g. `your-project/1`).
6. Optional: [Gemini API key](https://aistudio.google.com/apikey) for nesting/aggression analysis.
7. Optional: [Resend](https://resend.com) for approval emails (`RESEND_API_KEY`, `EMAIL_FROM`, `APPROVER_EMAIL`).

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Report flow

1. User uploads a photo → **Roboflow YOLO** counts geese + confidence; **Gemini** (optional) assesses behaviour.
2. Submit creates a **pending** row + stores image in `sightings-pending` storage.
3. Approver receives email with approve/reject links (or dev console logs links if Resend is not configured).
4. On approve, row moves to `sightings` and the **live map** updates via Supabase Realtime.

## API routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/sightings` | GET | Approved sightings for map |
| `/api/analyze` | POST | Roboflow + Gemini preview on report page |
| `/api/report` | POST | Submit pending sighting |
| `/api/approve` | GET | Email approval/reject handler |
