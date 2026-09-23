-- Tangy Sessions — real artist media uploads (Phase 3 follow-up).
--
-- MediaPage.jsx previously had a button literally named
-- handleSimulateUpload that claimed "DEMO TRACK UPLOADED TO CURATION
-- SERVER!" and appended a fake row to local state — nothing was ever
-- stored anywhere. This is the real fix: a private Storage bucket plus a
-- metadata table, both with RLS.

insert into storage.buckets (id, name, public)
values ('artist-media', 'artist-media', false)
on conflict (id) do nothing;

-- Separate PUBLIC bucket for avatars — artists.avatar_url is rendered
-- directly as an <img src> on the public Artists Directory, so it must be
-- reachable without auth (unlike demo tracks/photos above, which stay
-- private pending curation review).
insert into storage.buckets (id, name, public)
values ('artist-avatars', 'artist-avatars', true)
on conflict (id) do nothing;

create policy "artist-avatars: self upload"
  on storage.objects for insert
  with check (
    bucket_id = 'artist-avatars'
    and exists (select 1 from public.artists where id::text = (storage.foldername(name))[1] and user_id = auth.uid())
  );

create policy "artist-avatars: self update"
  on storage.objects for update
  using (
    bucket_id = 'artist-avatars'
    and exists (select 1 from public.artists where id::text = (storage.foldername(name))[1] and user_id = auth.uid())
  );

create policy "artist-avatars: self delete"
  on storage.objects for delete
  using (
    bucket_id = 'artist-avatars'
    and exists (select 1 from public.artists where id::text = (storage.foldername(name))[1] and user_id = auth.uid())
  );

create policy "artist-avatars: admin manage"
  on storage.objects for all
  using (bucket_id = 'artist-avatars' and public.is_admin());

-- Storage objects are keyed by path; every upload goes under
-- `<artist_id>/<filename>`, so ownership is enforced by matching the first
-- path segment to an artist row the caller owns.
create policy "artist-media: self upload"
  on storage.objects for insert
  with check (
    bucket_id = 'artist-media'
    and exists (select 1 from public.artists where id::text = (storage.foldername(name))[1] and user_id = auth.uid())
  );

create policy "artist-media: self read"
  on storage.objects for select
  using (
    bucket_id = 'artist-media'
    and (
      exists (select 1 from public.artists where id::text = (storage.foldername(name))[1] and user_id = auth.uid())
      or public.is_admin()
    )
  );

create policy "artist-media: self delete"
  on storage.objects for delete
  using (
    bucket_id = 'artist-media'
    and exists (select 1 from public.artists where id::text = (storage.foldername(name))[1] and user_id = auth.uid())
  );

create policy "artist-media: admin manage"
  on storage.objects for all
  using (bucket_id = 'artist-media' and public.is_admin());

-- METADATA — what the artist portal actually lists/reviews. Storage alone
-- has no "approved for curation" concept, duration, or original filename.
create table artist_media (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references artists(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  file_size_bytes bigint,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index artist_media_artist_id_idx on artist_media (artist_id);

alter table artist_media enable row level security;

create policy "artist_media: self manage" on artist_media for all
  using (exists (select 1 from artists where id = artist_id and user_id = auth.uid()))
  with check (exists (select 1 from artists where id = artist_id and user_id = auth.uid()));
create policy "artist_media: admin manage" on artist_media for all
  using (is_admin());

-- The "self manage" policy above has no column granularity — without this,
-- an artist could INSERT/UPDATE their own row with status='approved'
-- directly, self-approving their own upload for curation. Same pattern as
-- prevent_artist_status_self_escalation in 0003_role_security.sql.
create function prevent_artist_media_self_approval()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if not is_admin() and new.status is distinct from 'pending' then
    raise exception 'Only an admin can approve or reject uploaded media.';
  end if;
  return new;
end;
$$;

create trigger guard_artist_media_status
  before insert or update on artist_media
  for each row execute function prevent_artist_media_self_approval();
