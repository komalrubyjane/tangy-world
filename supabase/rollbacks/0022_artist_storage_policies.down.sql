-- REVERSE of 0022_artist_storage_policies.sql — run by hand only, BEFORE
-- rollbacks/0021_canonical_admin_links.down.sql.
--
-- Restores the six policies exactly as 0013 defined them. Note that those
-- definitions are the broken ones (the unqualified `name` resolves to
-- artists.name), so after this rollback artists can no longer upload, read or
-- delete their own media and avatars; admin access is unaffected.

begin;

drop policy if exists "artist-media: self upload" on storage.objects;
create policy "artist-media: self upload" on storage.objects for insert
  with check (bucket_id = 'artist-media'
    and exists (select 1 from public.artists where id::text = (storage.foldername(name))[1] and user_id = auth.uid()));

drop policy if exists "artist-media: self read" on storage.objects;
create policy "artist-media: self read" on storage.objects for select
  using (bucket_id = 'artist-media'
    and (exists (select 1 from public.artists where id::text = (storage.foldername(name))[1] and user_id = auth.uid())
         or public.is_admin()));

drop policy if exists "artist-media: self delete" on storage.objects;
create policy "artist-media: self delete" on storage.objects for delete
  using (bucket_id = 'artist-media'
    and exists (select 1 from public.artists where id::text = (storage.foldername(name))[1] and user_id = auth.uid()));

drop policy if exists "artist-avatars: self upload" on storage.objects;
create policy "artist-avatars: self upload" on storage.objects for insert
  with check (bucket_id = 'artist-avatars'
    and exists (select 1 from public.artists where id::text = (storage.foldername(name))[1] and user_id = auth.uid()));

drop policy if exists "artist-avatars: self read" on storage.objects;  -- added by 0022, not in 0013

drop policy if exists "artist-avatars: self update" on storage.objects;
create policy "artist-avatars: self update" on storage.objects for update
  using (bucket_id = 'artist-avatars'
    and exists (select 1 from public.artists where id::text = (storage.foldername(name))[1] and user_id = auth.uid()));

drop policy if exists "artist-avatars: self delete" on storage.objects;
create policy "artist-avatars: self delete" on storage.objects for delete
  using (bucket_id = 'artist-avatars'
    and exists (select 1 from public.artists where id::text = (storage.foldername(name))[1] and user_id = auth.uid()));

commit;
