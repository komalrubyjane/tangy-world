-- Tangy Sessions — fix artist-media / artist-avatars storage ownership checks.
--
-- 0013 wrote the "self" policies as
--
--   exists (select 1 from public.artists
--           where id::text = (storage.foldername(name))[1] and user_id = auth.uid())
--
-- Inside that subquery the unqualified `name` resolves to artists.name (the
-- artist's display name), not storage.objects.name, so the folder check
-- never matched: artists could not upload, read (sign) or delete their own
-- media or avatar. It failed closed — nobody else gained access — but the
-- 0020 media workflow and avatar uploads were unusable for artists.
--
-- Same rules, with the object path qualified: `<artist_id>/<file>` where the
-- artist row belongs to the caller, plus an owner SELECT policy on the public
-- avatars bucket so replacing/removing an avatar works. Admin/curator
-- policies are unchanged.
--
-- Rollback: rollbacks/0022_artist_storage_policies.down.sql

begin;

drop policy if exists "artist-media: self upload" on storage.objects;
create policy "artist-media: self upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'artist-media'
    and exists (select 1 from public.artists a where a.id::text = (storage.foldername(objects.name))[1] and a.user_id = auth.uid()));

drop policy if exists "artist-media: self read" on storage.objects;
create policy "artist-media: self read" on storage.objects for select to authenticated
  using (bucket_id = 'artist-media'
    and (exists (select 1 from public.artists a where a.id::text = (storage.foldername(objects.name))[1] and a.user_id = auth.uid())
         or public.is_admin()));

drop policy if exists "artist-media: self delete" on storage.objects;
create policy "artist-media: self delete" on storage.objects for delete to authenticated
  using (bucket_id = 'artist-media'
    and exists (select 1 from public.artists a where a.id::text = (storage.foldername(objects.name))[1] and a.user_id = auth.uid()));

drop policy if exists "artist-avatars: self upload" on storage.objects;
create policy "artist-avatars: self upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'artist-avatars'
    and exists (select 1 from public.artists a where a.id::text = (storage.foldername(objects.name))[1] and a.user_id = auth.uid()));

-- The bucket is public (avatars render on the public site), so this grants no
-- new visibility; it lets the owner replace (upsert) and remove their own
-- avatar, which Postgres only allows on rows the caller can SELECT.
drop policy if exists "artist-avatars: self read" on storage.objects;
create policy "artist-avatars: self read" on storage.objects for select to authenticated
  using (bucket_id = 'artist-avatars'
    and exists (select 1 from public.artists a where a.id::text = (storage.foldername(objects.name))[1] and a.user_id = auth.uid()));

drop policy if exists "artist-avatars: self update" on storage.objects;
create policy "artist-avatars: self update" on storage.objects for update to authenticated
  using (bucket_id = 'artist-avatars'
    and exists (select 1 from public.artists a where a.id::text = (storage.foldername(objects.name))[1] and a.user_id = auth.uid()));

drop policy if exists "artist-avatars: self delete" on storage.objects;
create policy "artist-avatars: self delete" on storage.objects for delete to authenticated
  using (bucket_id = 'artist-avatars'
    and exists (select 1 from public.artists a where a.id::text = (storage.foldername(objects.name))[1] and a.user_id = auth.uid()));

commit;
