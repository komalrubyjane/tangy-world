-- REVERSE of 0036_fix_artist_documents_storage.sql — run by hand only, BEFORE
-- rollbacks/0035_phase1_security_gaps.down.sql.
--
-- Restores the three artist-documents ownership policies exactly as 0033
-- created them.
--
-- WARNING: those 0033 definitions are the bug 0036 fixes — the unqualified
-- `name` resolves to artists.name, so no artist can upload, open or delete
-- their own documents. Only roll back to return to the pre-0036 state.
-- "artist-documents: team read" (0033) is not touched by 0036 or by this file.

begin;

drop policy if exists "artist-documents: own read" on storage.objects;
drop policy if exists "artist-documents: own upload" on storage.objects;
drop policy if exists "artist-documents: own delete" on storage.objects;

create policy "artist-documents: own read" on storage.objects for select to authenticated
  using (bucket_id = 'artist-documents' and exists (select 1 from public.artists a where a.id::text = (storage.foldername(name))[1] and a.user_id = auth.uid()));
create policy "artist-documents: own upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'artist-documents' and exists (select 1 from public.artists a where a.id::text = (storage.foldername(name))[1] and a.user_id = auth.uid()));
create policy "artist-documents: own delete" on storage.objects for delete to authenticated
  using (bucket_id = 'artist-documents' and exists (select 1 from public.artists a where a.id::text = (storage.foldername(name))[1] and a.user_id = auth.uid()));

commit;
