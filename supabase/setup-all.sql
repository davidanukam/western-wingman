-- Run once in Supabase Dashboard → SQL Editor → New query → Run
-- Western Wingman: tables + RLS + realtime (storage buckets: npm run setup:storage)

-- Approved sightings (live map)
create table if not exists public.sightings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  lat double precision not null,
  lng double precision not null,
  goose_count int not null check (goose_count between 0 and 500),
  detection_confidence real,
  is_nesting boolean not null default false,
  is_aggressive boolean not null default false,
  risk_level text not null default 'low' check (risk_level in ('low', 'medium', 'high')),
  description text,
  image_url text,
  ai_summary text,
  reporter_name text default 'Anonymous',
  location_name text,
  upvotes int not null default 0
);

create index if not exists sightings_created_at_idx on public.sightings (created_at desc);
create index if not exists sightings_lat_lng_idx on public.sightings (lat, lng);

-- Pending reports (awaiting email approval)
create table if not exists public.pending_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  lat double precision not null,
  lng double precision not null,
  goose_count int not null check (goose_count between 0 and 500),
  detection_confidence real,
  detection_payload jsonb,
  is_nesting boolean not null default false,
  is_aggressive boolean not null default false,
  risk_level text check (risk_level in ('low', 'medium', 'high')),
  description text,
  image_path text not null,
  ai_summary text,
  reporter_name text,
  location_name text,
  approve_token_hash text not null unique,
  token_expires_at timestamptz not null default (now() + interval '7 days')
);

create index if not exists pending_submissions_status_idx on public.pending_submissions (status);

-- Realtime (ignore error if already added)
do $$
begin
  alter publication supabase_realtime add table public.sightings;
exception
  when duplicate_object then null;
end $$;

-- RLS
alter table public.sightings enable row level security;
alter table public.pending_submissions enable row level security;

drop policy if exists "sightings_select_anon" on public.sightings;
create policy "sightings_select_anon"
  on public.sightings for select
  to anon, authenticated
  using (true);

drop policy if exists "pending_no_public_access" on public.pending_submissions;
create policy "pending_no_public_access"
  on public.pending_submissions for select
  to anon, authenticated
  using (false);
