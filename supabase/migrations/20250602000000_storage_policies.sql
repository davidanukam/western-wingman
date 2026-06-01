-- Storage buckets (safe to re-run)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('sightings-pending', 'sightings-pending', false, 20971520, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('sightings-approved', 'sightings-approved', true, 20971520, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Service role uploads (defense in depth; service role usually bypasses RLS)
create policy "service_upload_pending"
  on storage.objects for insert
  to service_role
  with check (bucket_id = 'sightings-pending');

create policy "service_upload_approved"
  on storage.objects for insert
  to service_role
  with check (bucket_id = 'sightings-approved');

create policy "service_read_storage"
  on storage.objects for select
  to service_role
  using (bucket_id in ('sightings-pending', 'sightings-approved'));

create policy "public_read_approved_images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'sightings-approved');
