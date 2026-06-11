-- ============================================================
-- Profile avatars
--
-- Adds an `avatar_url` to profiles and a public `avatars` storage bucket so
-- customers can upload a profile picture from the mobile app. Each user may only
-- write objects under a folder named after their own uid (`<uid>/<file>`), so
-- one customer can never overwrite another's avatar. Reads are public so the
-- image can be rendered straight from the CDN URL.
-- ============================================================

alter table profiles add column if not exists avatar_url text;

-- Public avatars bucket.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars: public read" on storage.objects;
create policy "avatars: public read" on storage.objects
  for select using (bucket_id = 'avatars');

-- A signed-in user may manage only the objects under their own uid folder.
drop policy if exists "avatars: owner write" on storage.objects;
create policy "avatars: owner write" on storage.objects
  for all
  to authenticated
  using  (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
