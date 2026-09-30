-- Tangy Sessions — private content media, live seat availability, waitlist
-- allocation policy, and auditable scheduled jobs.
--
-- 1. content-media becomes PRIVATE. Files are referenced as
--    /storage/content-media/<path> and shown through short-lived signed URLs.
--    Storage signs a file only for callers passing the SELECT policy below:
--    content editors, or anyone once the file belongs to PUBLISHED content
--    (a published TV video / diary post / album / photo, or a non-draft
--    session's cover). Draft media is no longer reachable by URL.
-- 2. event_availability_signal: one row per session whose `version` changes
--    whenever seats may have changed (bookings, waitlist holds, ticket types,
--    capacity). It carries no booking data and is readable by anyone for
--    published sessions; it is in the supabase_realtime publication so the
--    session page refetches event_availability() the moment it changes.
--    Capacity is still decided only by the server at checkout.
-- 3. waitlist.allocation: 'strict_order' (default, unchanged behaviour: a
--    smaller party never jumps the head of the queue) or 'first_fit' (offer
--    released seats to the earliest waiting party that fits).
-- 5. Every bucket gets a size limit and a MIME allowlist (artist-avatars is
--    public, and previously accepted any file type — e.g. HTML).
-- 4. run_platform_jobs() takes a transaction advisory lock (a second
--    concurrent run is skipped, not duplicated) and records every run in
--    platform_job_runs.
--
-- Rollback: rollbacks/0029_private_media_realtime_jobs.down.sql

begin;

-- 1. Private content media ----------------------------------------------------------------
update storage.buckets set public = false where id = 'content-media';

create or replace function content_media_is_public(p_name text)
returns boolean
language sql stable security definer set search_path = public
as $$
  with ref as (select '/storage/content-media/' || p_name as u)
  select exists (select 1 from tv_videos t, ref where t.status = 'published' and t.published_at <= now() and (t.video_url = ref.u or t.thumbnail_url = ref.u))
      or exists (select 1 from diary_posts d, ref where d.status = 'published' and d.published_at <= now() and d.cover_url = ref.u)
      or exists (select 1 from gallery_albums a, ref where a.status = 'published' and a.published_at <= now() and a.cover_url = ref.u)
      or exists (select 1 from gallery_photos p join gallery_albums a on a.id = p.album_id, ref
                 where a.status = 'published' and a.published_at <= now() and p.image_url = ref.u)
      or exists (select 1 from events e, ref where e.status <> 'draft' and e.image_url = ref.u);
$$;
revoke execute on function content_media_is_public(text) from public;
grant execute on function content_media_is_public(text) to anon, authenticated;

drop policy if exists "content-media: read" on storage.objects;
create policy "content-media: read" on storage.objects for select to anon, authenticated
  using (bucket_id = 'content-media' and (
    public.content_can('view', 'media') or public.content_can('view', 'tv') or public.content_can('view', 'diary')
    or public.has_permission('content.manage_sessions') or public.has_permission('events.manage')
    or public.content_media_is_public(name)));

-- Session covers can be uploaded by session-content editors too (Sessions area).
drop policy if exists "content-media: upload" on storage.objects;
create policy "content-media: upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'content-media' and (public.content_can('create', 'media') or public.content_can('create', 'tv') or public.content_can('create', 'diary')
                                               or public.content_can('edit', 'media') or public.content_can('edit', 'tv') or public.content_can('edit', 'diary')
                                               or (public.has_permission('content.manage_sessions') and public.has_permission('content.edit'))
                                               or public.has_permission('events.manage')));

-- 2. Live availability signal --------------------------------------------------------------
create table if not exists event_availability_signal (
  event_id uuid primary key references events(id) on delete cascade,
  version bigint not null default 1,
  changed_at timestamptz not null default now()
);
alter table event_availability_signal enable row level security;
drop policy if exists "availability signal: public" on event_availability_signal;
create policy "availability signal: public" on event_availability_signal for select
  using (exists (select 1 from events e where e.id = event_id and e.status <> 'draft'));
grant select on event_availability_signal to anon, authenticated;
revoke insert, update, delete on event_availability_signal from anon, authenticated;

create or replace function bump_availability(p_event_id uuid)
returns void
language sql security definer set search_path = public
as $$
  -- (Skipped when the event itself is being deleted — nothing left to watch.)
  insert into event_availability_signal (event_id)
  select p_event_id where exists (select 1 from events where id = p_event_id)
  on conflict (event_id) do update set version = event_availability_signal.version + 1, changed_at = now();
$$;
revoke execute on function bump_availability(uuid) from public, anon, authenticated;

create or replace function availability_signal_trigger()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if tg_table_name = 'events' then
    if tg_op = 'INSERT' or new.capacity is distinct from old.capacity or new.status is distinct from old.status then
      perform bump_availability(new.id);
    end if;
  elsif tg_op = 'DELETE' then
    perform bump_availability(old.event_id);
  elsif tg_op = 'INSERT' or row(new.*) is distinct from row(old.*) then
    perform bump_availability(new.event_id);
  end if;
  return null;
end;
$$;
drop trigger if exists bookings_availability_signal on bookings;
create trigger bookings_availability_signal after insert or delete or update of status, quantity on bookings
  for each row execute function availability_signal_trigger();
drop trigger if exists waitlist_availability_signal on waitlist;
create trigger waitlist_availability_signal after insert or delete or update of status on waitlist
  for each row execute function availability_signal_trigger();
drop trigger if exists ticket_types_availability_signal on event_ticket_types;
create trigger ticket_types_availability_signal after insert or delete or update on event_ticket_types
  for each row execute function availability_signal_trigger();
drop trigger if exists events_availability_signal on events;
create trigger events_availability_signal after insert or update of capacity, status on events
  for each row execute function availability_signal_trigger();

insert into event_availability_signal (event_id) select id from events on conflict do nothing;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'event_availability_signal') then
    alter publication supabase_realtime add table event_availability_signal;
  end if;
end $$;

-- 3. Waitlist allocation policy -----------------------------------------------------------------
insert into system_settings (key, value, value_type, category, label, description, exposed) values
  ('waitlist.allocation', '"strict_order"', 'string', 'Bookings', 'Waitlist allocation',
   'strict_order: released seats go to the head of the queue only (a smaller party never jumps ahead). first_fit: offer them to the earliest waiting party that fits.', true)
on conflict (key) do nothing;

create or replace function offer_waitlist_seats(p_event_id uuid)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_event events%rowtype;
  v_free int;
  v_hold int := setting_number('waitlist.offer_hold_minutes', 120)::int;
  v_first_fit boolean := coalesce((select value #>> '{}' from system_settings where key = 'waitlist.allocation'), 'strict_order') = 'first_fit';
  r record;
  v_offered int := 0;
begin
  select * into v_event from events where id = p_event_id for update;
  if v_event.id is null or v_event.status in ('draft', 'cancelled', 'past') or v_event.event_date < current_date then
    return 0;
  end if;
  -- Lapsed offers first, so their seats flow onwards in this same pass.
  update waitlist set status = 'expired', resolved_at = now(), updated_at = now()
   where event_id = p_event_id and status = 'offered' and offer_expires_at <= now();
  select v_event.capacity
         - coalesce((select sum(quantity) from bookings where event_id = p_event_id and status in ('pending', 'confirmed')), 0)
         - waitlist_held_seats(p_event_id)
    into v_free;
  for r in select * from waitlist
           where event_id = p_event_id and status = 'waiting' and user_id is not null
           order by queue_no for update loop
    exit when v_free <= 0;
    if r.quantity > v_free then
      exit when not v_first_fit;   -- strict_order: never skip the head of the queue
      continue;                    -- first_fit: try the next party
    end if;
    update waitlist set status = 'offered', offered_at = now(), offer_expires_at = now() + make_interval(mins => v_hold), updated_at = now()
     where id = r.id;
    v_free := v_free - r.quantity;
    v_offered := v_offered + 1;
    perform notify(r.user_id, 'waitlist.offer', 'A seat opened up: ' || v_event.name,
      format('We''re holding %s seat%s for you until %s. Book now to keep them.', r.quantity, case when r.quantity = 1 then '' else 's' end,
             to_char(now() at time zone coalesce(v_event.timezone, 'Asia/Kolkata') + make_interval(mins => v_hold), 'HH12:MI AM, DD Mon')),
      '/sessions/' || v_event.slug, p_event_id);
    insert into audit_logs (actor_id, actor_email, actor_role, action, resource_type, resource_id, event_id, metadata)
    values (null, null, 'system', 'waitlist.offered', 'waitlist', r.id::text, p_event_id,
            jsonb_build_object('quantity', r.quantity, 'hold_minutes', v_hold, 'allocation', case when v_first_fit then 'first_fit' else 'strict_order' end));
  end loop;
  return v_offered;
end;
$$;
revoke execute on function offer_waitlist_seats(uuid) from public, anon, authenticated;

-- 5. Upload limits for every bucket ------------------------------------------------------------------
update storage.buckets set file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
 where id = 'artist-avatars';
update storage.buckets set file_size_limit = 52428800,
  allowed_mime_types = array['audio/*', 'video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'application/pdf']
 where id = 'artist-media';
update storage.buckets set allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'text/plain', 'text/csv',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/zip']
 where id = 'event-documents';
-- Sponsor logos legitimately come as SVG / AI / EPS; the bucket is private and served only through signed URLs.
update storage.buckets set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/pdf',
  'application/postscript', 'application/illustrator', 'application/zip', 'application/octet-stream']
 where id = 'sponsor-assets';

-- 4. Scheduled jobs: single-flight + run log -------------------------------------------------------
create table if not exists platform_job_runs (
  id bigint generated always as identity primary key,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  source text not null default 'scheduler',
  skipped boolean not null default false,
  result jsonb
);
create index if not exists platform_job_runs_started_idx on platform_job_runs (started_at desc);
alter table platform_job_runs enable row level security;
drop policy if exists "job runs: operations read" on platform_job_runs;
create policy "job runs: operations read" on platform_job_runs for select using (has_permission('operations.manage'));

create or replace function run_platform_jobs(p_source text default 'scheduler')
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_run bigint;
  v_result jsonb;
begin
  -- One run at a time: an overlapping invocation is recorded and skipped.
  if not pg_try_advisory_xact_lock(hashtext('tangy.run_platform_jobs')) then
    insert into platform_job_runs (source, skipped, finished_at, result) values (left(coalesce(p_source, 'scheduler'), 40), true, now(), '{"skipped": "another run in progress"}');
    return jsonb_build_object('skipped', true);
  end if;
  insert into platform_job_runs (source) values (left(coalesce(p_source, 'scheduler'), 40)) returning id into v_run;
  v_result := jsonb_build_object(
    'bookings_expired', expire_stale_bookings(),
    'waitlist_offers_expired', expire_waitlist_offers(),
    'requests_expired', expire_booking_requests(),
    'reminders', send_event_reminders(),
    'overdue_tasks', notify_overdue_tasks(),
    'expiring_access', notify_expiring_access(),
    'access_expiry_logged', log_expired_access());
  update platform_job_runs set finished_at = now(), result = v_result where id = v_run;
  return v_result;
end;
$$;
drop function if exists run_platform_jobs();
revoke execute on function run_platform_jobs(text) from public, anon, authenticated;
grant execute on function run_platform_jobs(text) to service_role;

commit;
