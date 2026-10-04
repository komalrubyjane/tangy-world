-- 0036_fix_artist_documents_storage.sql
--
-- Fix artist-documents storage ownership policies.
-- 0033 used an unqualified `name` inside a subquery over public.artists,
-- which resolves to artists.name instead of storage.objects.name.
-- Artist document paths are intentionally:
--   <artist_id>/...
--
-- Production currently has zero objects in artist-documents.

drop policy if exists "artist-documents: own read" on storage.objects;
drop policy if exists "artist-documents: own upload" on storage.objects;
drop policy if exists "artist-documents: own delete" on storage.objects;

create policy "artist-documents: own read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'artist-documents'
  and exists (
    select 1
    from public.artists a
    where a.id::text = (storage.foldername(objects.name))[1]
      and a.user_id = auth.uid()
  )
);

create policy "artist-documents: own upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'artist-documents'
  and exists (
    select 1
    from public.artists a
    where a.id::text = (storage.foldername(objects.name))[1]
      and a.user_id = auth.uid()
  )
);

create policy "artist-documents: own delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'artist-documents'
  and exists (
    select 1
    from public.artists a
    where a.id::text = (storage.foldername(objects.name))[1]
      and a.user_id = auth.uid()
  )
);
