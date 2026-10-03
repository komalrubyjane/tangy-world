-- Tangy Sessions — the event ↔ artist operations workflow.
-- Run after 0033_artist_portal.sql. Reverse with
-- supabase/rollbacks/0034_event_artist_workflow.down.sql.
--
-- 1. LINE-UP DETAILS — event_artists stays the many-to-many line-up; its 1:1
--    event_artist_details row gains performance order, type, set length and
--    notes (times were already there). events gain a category and their own
--    page background.
-- 2. AVAILABILITY, SERVER-SIDE — artist_day_status() is the one place that
--    decides available / tentative / busy / unavailable for an artist on a
--    date (and optional time window), from the artist's own calendar
--    (artist_availability), confirmed line-ups and pending requests. A
--    pending request never counts as a booking. find_available_artists(),
--    artist_calendar(), artist_availability_summary(), admin_calendar() and
--    artist_day_summary() all read through it or the same tables.
-- 3. LINE-UP CHANGES — save_event_lineup(), update_event_artist() and
--    remove_event_artist() re-check availability under a per-artist-per-day
--    advisory lock, so two admins can't double-book the same artist; a
--    busy artist is refused, an unavailable one only with an explicit
--    override (audited); overlapping sets in one event are refused.
--    create_artist_request() and respond_to_booking_request() take the same
--    lock and re-check.
-- 4. NOTIFICATIONS — "You're on the lineup" only once the event is
--    published (on publish for the existing line-up, on assignment after);
--    artists get date / time / venue / cancellation notices with a link to
--    their session; cancelling an event cancels its open requests and keeps
--    the line-up rows as history; removal from a published line-up is
--    announced; performance-time changes link to the session. Message
--    notifications link straight to the conversation.
-- 5. CUSTOM NOTIFICATIONS — send_custom_notification(): Super Admin only,
--    one recipient, in-app always, email queued only when the recipient's
--    preferences allow (the result says which).
-- 6. PRIVATE MESSAGING — start_private_artist_conversation(): a Super Admin ↔
--    artist thread (conversation_type 'artist_private') that only its two
--    participants can read or write — not other admins, staff or partners.
--    Enforced by RLS and by every conversation function. Not end-to-end
--    encrypted: HTTPS + authentication + authorization + RLS.
-- 7. ROLES — admin_set_user_role() still the only way to change a role
--    (profiles.role, read by every RLS check); it now notifies the person
--    ("Your Tangy role has been updated", previous / new role) and only a
--    Super Admin may grant or remove Super Admin.
-- 8. AVAILABILITY REMINDER — artists whose calendar hasn't been touched for
--    artists.availability_stale_days (default 30) get one reminder per
--    period from the platform job; the portal shows the same threshold.

-- ===========================================================================
-- 1. SCHEMA
-- ===========================================================================
alter table event_artist_details
  add column if not exists performance_order int check (performance_order is null or performance_order between 1 and 50),
  add column if not exists performance_type text check (performance_type is null or length(performance_type) <= 80),
  add column if not exists set_minutes int check (set_minutes is null or set_minutes between 5 and 600),
  add column if not exists notes text check (notes is null or length(notes) <= 1000);

alter table events
  add column if not exists category text check (category is null or category in
    ('concert', 'workshop', 'heritage_walk', 'private', 'festival', 'talk', 'other'));


-- A session's own page background (session + booking page, archive page):
-- 'cover' (its cover image), a dark colour '#RRGGBB', or an image link. The
-- shapes are fixed here so nothing else can reach the page's CSS.
alter table events add column if not exists page_background text check (page_background is null or page_background = 'cover'
  or page_background ~ '^#[0-9a-fA-F]{6}$' or page_background ~ '^(https://|/media/|/storage/content-media/)[A-Za-z0-9._~:/?#@!$&*+,;=%-]+$');

alter table conversations drop constraint if exists conversations_conversation_type_check;
alter table conversations add constraint conversations_conversation_type_check check (conversation_type in
  ('general', 'artist_support', 'sponsor_support', 'vendor_support', 'venue_support', 'artist_private'));

insert into system_settings (key, value, value_type, category, label, description, exposed)
values ('artists.availability_stale_days', '30', 'integer', 'Artists', 'Availability reminder (days)',
        'Artists whose availability has not been updated for this many days see a reminder and get one notification per period.', true)
on conflict (key) do nothing;

-- New notification types (the 0025 list plus the workflow's).
create or replace function notification_meta(p_type text)
returns table (category text, pref text, priority text, email boolean, critical boolean)
language sql immutable
as $$
  with m as (
    select v.category, v.pref, v.priority, v.email, v.critical
    from (values
    ('message.new',             'messages',     'messages',             'normal',    true,  false),
    ('booking.requested',       'events',       'booking_requests',     'important', true,  false),
    ('booking.accepted',        'events',       'booking_requests',     'normal',    true,  false),
    ('booking.declined',        'events',       'booking_requests',     'normal',    true,  false),
    ('booking.expired',         'events',       'booking_requests',     'normal',    false, false),
    ('booking.confirmed',       'events',       'booking_requests',     'important', true,  false),
    ('booking.cancelled',       'events',       'booking_requests',     'important', true,  false),
    ('assignment.new',          'events',       'event_updates',        'important', true,  false),
    ('assignment.removed',      'events',       'event_updates',        'important', true,  false),
    ('schedule.changed',        'events',       'schedule_changes',     'important', true,  false),
    ('event.updated',           'events',       'event_updates',        'important', true,  false),
    ('event.date_changed',      'events',       'schedule_changes',     'important', true,  false),
    ('event.time_changed',      'events',       'schedule_changes',     'important', true,  false),
    ('event.venue_changed',     'events',       'schedule_changes',     'important', true,  false),
    ('event.cancelled',         'events',       'event_updates',        'urgent',    true,  true),
    ('event.reminder',          'events',       'event_reminders',      'important', true,  false),
    ('announcement.published',  'events',       'announcements',        'normal',    true,  false),
    ('document.added',          'events',       'document_updates',     'normal',    true,  false),
    ('requirement.requested',   'requirements', 'requirement_requests', 'important', true,  false),
    ('requirement.submitted',   'requirements', 'requirement_reviews',  'normal',    true,  false),
    ('requirement.reviewed',    'requirements', 'requirement_reviews',  'important', true,  false),
    ('task.assigned',           'tasks',        'tasks',                'normal',    false, false),
    ('task.overdue',            'tasks',        'tasks',                'important', false, false),
    ('access.granted',          'events',       'access',               'important', true,  false),
    ('access.revoked',          'events',       'access',               'important', true,  true),
    ('access.expiring',         'events',       'access',               'important', false, false),
    ('access.requested',        'events',       'access',               'normal',    true,  false),
    ('access.declined',         'events',       'access',               'normal',    false, false),
    ('application.new',         'applications', 'applications',         'normal',    true,  false),
    ('application.approved',    'applications', 'applications',         'important', false, true),
    ('application.rejected',    'applications', 'applications',         'normal',    false, true),
    ('application.received',    'applications', 'applications',         'normal',    true,  true),
    ('application.submitted',   'applications', 'applications',         'normal',    false, true),
    ('application.under_review','applications', 'applications',         'normal',    false, true),
    ('application.info_requested','applications','applications',        'important', true,  true),
    ('application.resubmitted', 'applications', 'applications',         'normal',    false, false),
    ('enquiry.new',             'applications', 'applications',         'normal',    true,  false),
    ('media.reviewed',          'events',       'document_updates',     'normal',    false, false),
    ('media.submitted',         'events',       'document_updates',     'normal',    false, false),
    ('asset.submitted',         'events',       'document_updates',     'normal',    false, false),
    ('asset.reviewed',          'events',       'document_updates',     'normal',    true,  false),
    ('invoice.issued',          'payments',     'payment_updates',      'normal',    true,  false),
    ('invoice.paid',            'payments',     'payment_updates',      'normal',    true,  false),
    ('booking_payment.expired', 'payments',     'payment_updates',      'normal',    false, false),
    ('payment.late',            'payments',     'payment_updates',      'urgent',    true,  true),
    ('payment.review',          'payments',     'payment_updates',      'urgent',    true,  true),
    ('payment.webhook_failed',  'payments',     'payment_updates',      'urgent',    true,  true),
    ('waitlist.joined',         'events',       'event_updates',        'normal',    true,  true),
    ('waitlist.offer',          'events',       'event_updates',        'urgent',    true,  true),
    ('waitlist.offer_expired',  'events',       'event_updates',        'important', true,  true),
    ('waitlist.converted',      'events',       'event_updates',        'normal',    false, true),
    ('availability.reminder',   'events',       'event_updates',        'normal',    false, false),
    ('admin.message',           'system',       'system',               'important', true,  true),
    ('role.changed',            'system',       'system',               'important', true,  true)
  ) v(t, category, pref, priority, email, critical)
    where v.t = p_type
  )
  select * from m
  union all
  select 'system', 'system', 'normal', false, false where not exists (select 1 from m);
$$;

-- ===========================================================================
-- 2. AVAILABILITY — one server-side answer
-- ===========================================================================
-- An artist on a date (optionally a time window, local to the event):
--   unavailable  the artist marked the day (or an overlapping window) unavailable
--   busy         already on another (not cancelled) line-up at an overlapping time
--   tentative    the artist marked it tentative, has a pending request that day,
--                is booked that day at a different time, or is available only
--                for part of the requested window
--   available    the artist marked it available
--   unknown      nothing recorded and no sessions that day
-- Unknown times on either side count as overlapping (the safe reading).
create or replace function artist_day_status(p_artist uuid, p_date date, p_start time default null, p_end time default null,
                                             p_exclude_event uuid default null)
returns table (status text, detail text, conflicts jsonb)
language plpgsql stable security definer set search_path = public
as $$
declare
  v_av artist_availability%rowtype;
  v_booked jsonb := '[]'::jsonb;
  v_pending jsonb := '[]'::jsonb;
  v_window boolean := p_start is not null and p_end is not null;
  v_overlap boolean;
  b record;
  v_hit record;
begin
  select * into v_av from artist_availability a where a.artist_id = p_artist and a.date = p_date;
  for b in
    select e.id, e.name, 'booked' as kind,
           (d.performance_start at time zone coalesce(e.timezone, 'Asia/Kolkata'))::time as s,
           (d.performance_end at time zone coalesce(e.timezone, 'Asia/Kolkata'))::time as f
      from event_artists ea join events e on e.id = ea.event_id
      left join event_artist_details d on d.event_id = ea.event_id and d.artist_id = ea.artist_id
     where ea.artist_id = p_artist and e.event_date = p_date and e.status <> 'cancelled' and e.id is distinct from p_exclude_event
    union all
    select e.id, e.name, 'pending',
           (r.proposed_start at time zone coalesce(e.timezone, 'Asia/Kolkata'))::time,
           (r.proposed_end at time zone coalesce(e.timezone, 'Asia/Kolkata'))::time
      from assignment_requests r join events e on e.id = r.session_id
     where r.artist_id = p_artist and e.event_date = p_date and e.status <> 'cancelled' and r.status = 'pending'
       and e.id is distinct from p_exclude_event
  loop
    v_overlap := not v_window or b.s is null or b.f is null or (b.s < p_end and b.f > p_start);
    if b.kind = 'booked' then
      v_booked := v_booked || jsonb_build_object('event_id', b.id, 'name', b.name, 'overlaps', v_overlap,
                                                 'start', to_char(b.s, 'HH24:MI'), 'end', to_char(b.f, 'HH24:MI'));
    else
      v_pending := v_pending || jsonb_build_object('event_id', b.id, 'name', b.name, 'overlaps', v_overlap,
                                                   'start', to_char(b.s, 'HH24:MI'), 'end', to_char(b.f, 'HH24:MI'));
    end if;
  end loop;
  conflicts := jsonb_build_object('booked', v_booked, 'pending', v_pending,
    'availability', case when v_av.id is null then null else jsonb_build_object('status', v_av.status, 'note', v_av.note,
      'start', to_char(v_av.start_time, 'HH24:MI'), 'end', to_char(v_av.end_time, 'HH24:MI'), 'updated_at', v_av.updated_at) end);

  if v_av.status = 'unavailable' and (v_av.start_time is null or not v_window or (v_av.start_time < p_end and v_av.end_time > p_start)) then
    status := 'unavailable';
    detail := coalesce(v_av.note, 'Marked unavailable') ||
              case when v_av.start_time is not null then ' (' || to_char(v_av.start_time, 'HH24:MI') || '–' || to_char(v_av.end_time, 'HH24:MI') || ')' else '' end;
  elsif exists (select 1 from jsonb_array_elements(v_booked) x where (x ->> 'overlaps')::boolean) then
    select x ->> 'name' as name into v_hit from jsonb_array_elements(v_booked) x where (x ->> 'overlaps')::boolean limit 1;
    status := 'busy';
    detail := 'Booked: ' || v_hit.name;
  elsif jsonb_array_length(v_booked) > 0 then
    status := 'tentative';
    detail := 'Also booked that day: ' || (v_booked -> 0 ->> 'name') || ' (' || coalesce(v_booked -> 0 ->> 'start', '?') || '–' || coalesce(v_booked -> 0 ->> 'end', '?') || ')';
  elsif v_av.status = 'tentative' then
    status := 'tentative';
    detail := coalesce(v_av.note, 'Marked tentative');
  elsif jsonb_array_length(v_pending) > 0 then
    status := 'tentative';
    detail := 'Pending request: ' || (v_pending -> 0 ->> 'name');
  elsif v_av.status = 'available' then
    if v_window and v_av.start_time is not null and not (v_av.start_time <= p_start and v_av.end_time >= p_end) then
      status := 'tentative';
      detail := 'Available ' || to_char(v_av.start_time, 'HH24:MI') || '–' || to_char(v_av.end_time, 'HH24:MI') || ' only';
    else
      status := 'available';
      detail := coalesce(v_av.note, 'Marked available');
    end if;
  else
    status := 'unknown';
    detail := 'No availability set';
  end if;
  return next;
end;
$$;
revoke execute on function artist_day_status(uuid, date, time, time, uuid) from public, anon, authenticated;

create or replace function can_see_artist_schedule()
returns boolean language sql stable security definer set search_path = public
as $$ select has_permission('events.manage') or has_permission('entities.manage') $$;

-- Every approved artist on a date, grouped by the answer above. The event
-- editor, artist directory, admin calendar and dashboard all use this.
create or replace function find_available_artists(p_date date, p_start time default null, p_end time default null,
                                                  p_search text default null, p_genre text default null, p_city text default null,
                                                  p_event_id uuid default null)
returns table (artist_id uuid, name text, stage_name text, genre text, city text, instruments text[], avatar_url text,
               has_account boolean, status text, detail text, conflicts jsonb, next_booking date,
               availability_updated_at timestamptz, on_event boolean)
language plpgsql stable security definer set search_path = public
as $$
declare
  q text := nullif(trim(coalesce(p_search, '')), '');
begin
  if not can_see_artist_schedule() then
    raise exception 'You do not have permission to see artist availability.' using errcode = '42501';
  end if;
  if p_date is null then
    raise exception 'Choose a date.';
  end if;
  return query
  select a.id, a.name, a.stage_name, a.genre, a.city, a.instruments, a.avatar_url, a.user_id is not null,
         s.status, s.detail, s.conflicts,
         (select min(e.event_date) from event_artists ea join events e on e.id = ea.event_id
           where ea.artist_id = a.id and e.event_date >= current_date and e.status not in ('cancelled', 'draft')),
         (select max(av.updated_at) from artist_availability av where av.artist_id = a.id),
         p_event_id is not null and exists (select 1 from event_artists ea where ea.event_id = p_event_id and ea.artist_id = a.id)
  from artists a
  cross join lateral artist_day_status(a.id, p_date, p_start, p_end, p_event_id) s
  where a.status = 'approved'
    and (q is null or a.name ilike '%' || q || '%' or a.stage_name ilike '%' || q || '%' or a.genre ilike '%' || q || '%'
         or a.subgenre ilike '%' || q || '%' or a.city ilike '%' || q || '%'
         or exists (select 1 from unnest(coalesce(a.instruments, '{}') || coalesce(a.genres, '{}')) t where t ilike '%' || q || '%'))
    and (p_genre is null or a.genre ilike '%' || p_genre || '%' or exists (select 1 from unnest(coalesce(a.genres, '{}')) g where g ilike '%' || p_genre || '%'))
    and (p_city is null or a.city ilike '%' || p_city || '%')
  order by array_position(array['available', 'tentative', 'unknown', 'busy', 'unavailable'], s.status), coalesce(a.stage_name, a.name);
end;
$$;

-- One artist's calendar between two dates: confirmed sessions, cancelled
-- sessions, pending requests and the artist's own availability. The artist
-- portal, the admin artist page and the event editor's drawer all draw this.
create or replace function artist_calendar(p_artist_id uuid, p_from date, p_to date)
returns table (day date, kind text, title text, detail text, event_id uuid, request_id uuid, venue text,
               starts_at timestamptz, ends_at timestamptz, event_status text)
language plpgsql stable security definer set search_path = public
as $$
declare
  v_self boolean := exists (select 1 from artists a where a.id = p_artist_id and a.user_id = auth.uid());
begin
  if not (v_self or can_see_artist_schedule()) then
    raise exception 'Calendar not found.' using errcode = '42501';
  end if;
  if p_to < p_from or p_to - p_from > 400 then
    raise exception 'Choose a range of at most 400 days.';
  end if;
  return query
  -- Line-ups: a draft event is invisible to the artist until it is published.
  select e.event_date, case when e.status = 'cancelled' then 'cancelled' else 'confirmed' end, e.name,
         concat_ws(' · ',
           case when e.status = 'draft' then 'Draft — not published' end,
           d.performance_type,
           case when d.performance_start is not null then to_char(d.performance_start at time zone coalesce(e.timezone, 'Asia/Kolkata'), 'FMHH12:MI AM')
             || coalesce('–' || to_char(d.performance_end at time zone coalesce(e.timezone, 'Asia/Kolkata'), 'FMHH12:MI AM'), '') end,
           case when d.travel is not null then 'Travel: ' || left(d.travel, 80) end),
         e.id, null::uuid, coalesce(v.name, e.venue), d.performance_start, d.performance_end, e.status
    from event_artists ea join events e on e.id = ea.event_id
    left join event_artist_details d on d.event_id = ea.event_id and d.artist_id = ea.artist_id
    left join venues v on v.id = e.venue_id
   where ea.artist_id = p_artist_id and e.event_date between p_from and p_to and (not v_self or e.status <> 'draft')
  union all
  select e.event_date, 'pending', e.name,
         concat_ws(' · ', 'Request awaiting reply', r.performance_type,
           case when r.proposed_start is not null then to_char(r.proposed_start at time zone coalesce(e.timezone, 'Asia/Kolkata'), 'FMHH12:MI AM') end),
         e.id, r.id, coalesce(v.name, e.venue), r.proposed_start, r.proposed_end, e.status
    from assignment_requests r join events e on e.id = r.session_id
    left join venues v on v.id = e.venue_id
   where r.artist_id = p_artist_id and r.status = 'pending' and e.status <> 'cancelled' and e.event_date between p_from and p_to
     and not exists (select 1 from event_artists ea where ea.event_id = r.session_id and ea.artist_id = r.artist_id)
  union all
  select av.date, av.status, initcap(av.status),
         concat_ws(' · ', case when av.start_time is not null then to_char(av.start_time, 'HH24:MI') || '–' || to_char(av.end_time, 'HH24:MI') end, av.note),
         null::uuid, null::uuid, null::text, null::timestamptz, null::timestamptz, null::text
    from artist_availability av
   where av.artist_id = p_artist_id and av.date between p_from and p_to
  order by 1, 2;
end;
$$;

-- When the artist last touched their calendar, whether that's stale, and the
-- next seven days at a glance (for the artist dashboard and the admin page).
create or replace function artist_availability_summary(p_artist_id uuid default null)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_artist uuid := coalesce(p_artist_id, (select id from artists where user_id = auth.uid() order by status = 'approved' desc limit 1));
  v_days int := setting_number('artists.availability_stale_days', 30)::int;
  v_last timestamptz;
  v_week jsonb;
begin
  if v_artist is null or not (exists (select 1 from artists a where a.id = v_artist and a.user_id = auth.uid()) or can_see_artist_schedule()) then
    raise exception 'Artist not found.' using errcode = '42501';
  end if;
  select max(updated_at) into v_last from artist_availability where artist_id = v_artist;
  select jsonb_object_agg(k, n) into v_week from (
    select s.status as k, count(*) as n
      from generate_series(current_date, current_date + 6, interval '1 day') g(d)
      cross join lateral artist_day_status(v_artist, g.d::date) s
     group by s.status) x;
  return jsonb_build_object('artist_id', v_artist, 'last_updated', v_last, 'stale_days', v_days,
    'is_stale', v_last is null or v_last < now() - make_interval(days => v_days),
    'next7', coalesce(v_week, '{}'::jsonb));
end;
$$;

-- Every event in a range with its line-up and open requests (admin calendar).
create or replace function admin_calendar(p_from date, p_to date)
returns table (event_id uuid, name text, slug text, event_date date, event_time text, venue text, venue_id uuid, status text, artists jsonb)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not has_permission('events.view_all') then
    raise exception 'You do not have permission to see the event calendar.' using errcode = '42501';
  end if;
  if p_to < p_from or p_to - p_from > 400 then
    raise exception 'Choose a range of at most 400 days.';
  end if;
  return query
  select e.id, e.name, e.slug, e.event_date, e.event_time, coalesce(v.name, e.venue), e.venue_id, e.status,
         coalesce((
           select jsonb_agg(x order by x ->> 'order', x ->> 'name') from (
             select jsonb_build_object('artist_id', a.id, 'name', coalesce(a.stage_name, a.name), 'state', 'confirmed',
                      'order', lpad(coalesce(d.performance_order, 99)::text, 2, '0'),
                      'start', d.performance_start, 'end', d.performance_end) as x
               from event_artists ea join artists a on a.id = ea.artist_id
               left join event_artist_details d on d.event_id = ea.event_id and d.artist_id = ea.artist_id
              where ea.event_id = e.id
             union all
             select jsonb_build_object('artist_id', a.id, 'name', coalesce(a.stage_name, a.name), 'state', r.status::text,
                      'order', '99', 'start', r.proposed_start, 'end', r.proposed_end, 'request_id', r.id)
               from assignment_requests r join artists a on a.id = r.artist_id
              where r.session_id = e.id and r.status in ('draft', 'pending', 'declined')
                and not exists (select 1 from event_artists ea where ea.event_id = r.session_id and ea.artist_id = r.artist_id)
           ) y), '[]'::jsonb)
    from events e left join venues v on v.id = e.venue_id
   where e.event_date between p_from and p_to
   order by e.event_date, e.event_time nulls last;
end;
$$;

-- Today (or any date) at a glance for the admin dashboard.
create or replace function artist_day_summary(p_date date default current_date)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
begin
  if not has_permission('dashboard.view') or not can_see_artist_schedule() then
    raise exception 'You do not have permission to see this summary.' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'date', p_date,
    'sessions', (select count(*) from events where event_date = p_date and status not in ('cancelled', 'draft')),
    'artists_booked', (select count(distinct ea.artist_id) from event_artists ea join events e on e.id = ea.event_id
                        where e.event_date = p_date and e.status not in ('cancelled', 'draft')),
    'artists_available', (select count(*) from artist_availability av join artists a on a.id = av.artist_id
                           where av.date = p_date and av.status = 'available' and a.status = 'approved'
                             and not exists (select 1 from event_artists ea join events e on e.id = ea.event_id
                                             where ea.artist_id = a.id and e.event_date = p_date and e.status <> 'cancelled')),
    'pending_requests', (select count(*) from assignment_requests r join events e on e.id = r.session_id
                          where r.status = 'pending' and e.event_date >= p_date and e.status <> 'cancelled'));
end;
$$;

-- ===========================================================================
-- 3. LINE-UP CHANGES — re-checked on the server, serialized per artist-day
-- ===========================================================================
create or replace function lock_artist_day(p_artist uuid, p_date date)
returns void language sql volatile set search_path = public
as $$ select pg_advisory_xact_lock(hashtextextended('tangy.artist_day:' || p_artist::text || ':' || p_date::text, 0)) $$;
revoke execute on function lock_artist_day(uuid, date) from public, anon, authenticated;

-- Refuses a set that overlaps another artist's set (or open request) in the same event.
create or replace function assert_no_slot_overlap(p_event_id uuid, p_artist uuid, p_start timestamptz, p_end timestamptz)
returns void language plpgsql stable security definer set search_path = public
as $$
declare
  v_name text;
begin
  if p_start is null or p_end is null then
    return;
  end if;
  select coalesce(a.stage_name, a.name) into v_name
    from (select d.artist_id, d.performance_start s, d.performance_end f from event_artist_details d where d.event_id = p_event_id
          union all
          select r.artist_id, r.proposed_start, r.proposed_end from assignment_requests r
           where r.session_id = p_event_id and r.status in ('draft', 'pending', 'accepted', 'confirmed')) x
    join artists a on a.id = x.artist_id
   where x.artist_id <> p_artist and x.s is not null and x.f is not null and x.s < p_end and x.f > p_start
   limit 1;
  if v_name is not null then
    raise exception 'That set overlaps %''s set in this event. Adjust the times.', v_name;
  end if;
end;
$$;
revoke execute on function assert_no_slot_overlap(uuid, uuid, timestamptz, timestamptz) from public, anon, authenticated;

-- The availability gate every booking path goes through.
create or replace function assert_artist_bookable(p_event events, p_artist artists, p_start timestamptz, p_end timestamptz, p_override boolean default false)
returns text language plpgsql volatile security definer set search_path = public
as $$
declare
  v record;
  tz text := coalesce(p_event.timezone, 'Asia/Kolkata');
begin
  perform lock_artist_day(p_artist.id, p_event.event_date);
  select * into v from artist_day_status(p_artist.id, p_event.event_date, (p_start at time zone tz)::time, (p_end at time zone tz)::time, p_event.id);
  if v.status = 'busy' then
    raise exception '% is already booked on % (%).', coalesce(p_artist.stage_name, p_artist.name), to_char(p_event.event_date, 'DD Mon'), v.detail using hint = 'tangy:user';
  end if;
  if v.status = 'unavailable' and not coalesce(p_override, false) then
    raise exception '% marked % as unavailable (%). Choose another artist, or override deliberately.',
      coalesce(p_artist.stage_name, p_artist.name), to_char(p_event.event_date, 'DD Mon'), v.detail using hint = 'tangy:user';
  end if;
  return v.status;
end;
$$;
revoke execute on function assert_artist_bookable(events, artists, timestamptz, timestamptz, boolean) from public, anon, authenticated;

-- "You're on the lineup" — only ever for a published, upcoming event.
create or replace function notify_lineup_artist(p_event_id uuid, p_artist_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
declare
  e events%rowtype;
  v_user uuid;
  d event_artist_details%rowtype;
  tz text;
begin
  select * into e from events where id = p_event_id;
  if e.id is null or e.status not in ('on-sale', 'sold-out') or e.event_date < current_date then
    return;
  end if;
  tz := coalesce(e.timezone, 'Asia/Kolkata');
  select user_id into v_user from artists where id = p_artist_id;
  select * into d from event_artist_details where event_id = p_event_id and artist_id = p_artist_id;
  perform notify(v_user, 'assignment.new', 'You''re on the lineup: ' || e.name,
    concat_ws(' · ', to_char(e.event_date, 'FMDD FMMonth YYYY'), coalesce(e.venue, 'Venue to be confirmed'),
      case when d.performance_start is not null then 'Your performance: ' || to_char(d.performance_start at time zone tz, 'FMHH12:MI AM')
        || coalesce(' – ' || to_char(d.performance_end at time zone tz, 'FMHH12:MI AM'), '') end) || '. Do your best.',
    '/artist/sessions/' || p_event_id, p_event_id);
end;
$$;
revoke execute on function notify_lineup_artist(uuid, uuid) from public, anon, authenticated;

-- Add artists to an event (directly or by request), each re-checked here.
-- p_items: [{artist_id, mode: 'assign' | 'request', start, end (ISO timestamps),
--            performance_type, set_minutes, performance_order, notes, fee, override}]
create or replace function save_event_lineup(p_event_id uuid, p_items jsonb)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_event events%rowtype;
  v_artist artists%rowtype;
  it jsonb;
  v_mode text;
  v_start timestamptz;
  v_end timestamptz;
  v_status text;
  v_added int := 0;
  v_requested int := 0;
  v_out jsonb := '[]'::jsonb;
begin
  if not has_permission('events.manage') then
    raise exception 'You do not have permission to change line-ups.' using errcode = '42501';
  end if;
  select * into v_event from events where id = p_event_id for update;
  if v_event.id is null then
    raise exception 'Event not found.';
  end if;
  if v_event.status = 'cancelled' then
    raise exception 'This event is cancelled.';
  end if;
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Choose at least one artist.';
  end if;
  for it in select value from jsonb_array_elements(p_items) loop
    select * into v_artist from artists where id = (it ->> 'artist_id')::uuid;
    if v_artist.id is null or v_artist.status <> 'approved' then
      raise exception 'Only approved artists can be added to a line-up.';
    end if;
    v_mode := coalesce(it ->> 'mode', 'assign');
    v_start := nullif(it ->> 'start', '')::timestamptz;
    v_end := nullif(it ->> 'end', '')::timestamptz;
    if v_start is not null and v_end is not null and v_end <= v_start then
      raise exception 'The set for % must end after it starts.', coalesce(v_artist.stage_name, v_artist.name) using hint = 'tangy:user';
    end if;
    -- A request lets the artist decide, so only a direct assignment needs an override.
    v_status := assert_artist_bookable(v_event, v_artist, v_start, v_end, coalesce((it ->> 'override')::boolean, false) or v_mode = 'request');
    perform assert_no_slot_overlap(p_event_id, v_artist.id, v_start, v_end);
    if v_mode = 'assign' then
      perform set_config('tangy.defer_lineup_notice', 'on', true);
      insert into event_artists (event_id, artist_id) values (p_event_id, v_artist.id) on conflict do nothing;
      perform set_config('tangy.defer_lineup_notice', 'off', true);
      insert into event_artist_details (event_id, artist_id, performance_start, performance_end, performance_order, performance_type, set_minutes, notes, fee_amount)
      values (p_event_id, v_artist.id, v_start, v_end, nullif(it ->> 'performance_order', '')::int, nullif(trim(coalesce(it ->> 'performance_type', '')), ''),
              nullif(it ->> 'set_minutes', '')::int, nullif(trim(coalesce(it ->> 'notes', '')), ''), nullif(it ->> 'fee', '')::int)
      on conflict (event_id, artist_id) do update
        set performance_start = excluded.performance_start, performance_end = excluded.performance_end,
            performance_order = excluded.performance_order, performance_type = excluded.performance_type,
            set_minutes = excluded.set_minutes, notes = excluded.notes,
            fee_amount = coalesce(excluded.fee_amount, event_artist_details.fee_amount), updated_at = now();
      perform notify_lineup_artist(p_event_id, v_artist.id);
      v_added := v_added + 1;
    elsif v_mode = 'request' then
      if v_artist.user_id is null then
        raise exception '% has no portal account to answer a request — add them directly instead.', coalesce(v_artist.stage_name, v_artist.name) using hint = 'tangy:user';
      end if;
      perform create_artist_request(p_event_id, v_artist.id, jsonb_build_object(
        'proposed_start', v_start, 'proposed_end', v_end, 'performance_type', it ->> 'performance_type',
        'set_minutes', nullif(it ->> 'set_minutes', ''), 'message', it ->> 'notes', 'fee_offer', nullif(it ->> 'fee', '')), true);
      v_requested := v_requested + 1;
    else
      raise exception 'Unknown line-up action.';
    end if;
    v_out := v_out || jsonb_build_object('artist_id', v_artist.id, 'mode', v_mode, 'availability', v_status);
  end loop;
  perform audit_write('event.lineup_saved', 'event', p_event_id::text,
    jsonb_build_object('added', v_added, 'requested', v_requested, 'items', v_out), p_event_id);
  return jsonb_build_object('added', v_added, 'requested', v_requested, 'items', v_out);
end;
$$;

-- Change one artist's performance details on an event.
create or replace function update_event_artist(p_event_id uuid, p_artist_id uuid, p_details jsonb)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  d jsonb := coalesce(p_details, '{}'::jsonb);
  v_event events%rowtype;
  v_artist artists%rowtype;
  v_start timestamptz := nullif(d ->> 'start', '')::timestamptz;
  v_end timestamptz := nullif(d ->> 'end', '')::timestamptz;
begin
  if not has_permission('events.manage') then
    raise exception 'You do not have permission to change line-ups.' using errcode = '42501';
  end if;
  select * into v_event from events where id = p_event_id for update;
  select * into v_artist from artists where id = p_artist_id;
  if v_event.id is null or not exists (select 1 from event_artists where event_id = p_event_id and artist_id = p_artist_id) then
    raise exception 'That artist is not on this line-up.';
  end if;
  if v_start is not null and v_end is not null and v_end <= v_start then
    raise exception 'The set must end after it starts.' using hint = 'tangy:user';
  end if;
  perform assert_artist_bookable(v_event, v_artist, v_start, v_end, true);
  perform assert_no_slot_overlap(p_event_id, p_artist_id, v_start, v_end);
  insert into event_artist_details (event_id, artist_id, performance_start, performance_end, performance_order, performance_type, set_minutes, notes)
  values (p_event_id, p_artist_id, v_start, v_end, nullif(d ->> 'performance_order', '')::int, nullif(trim(coalesce(d ->> 'performance_type', '')), ''),
          nullif(d ->> 'set_minutes', '')::int, nullif(trim(coalesce(d ->> 'notes', '')), ''))
  on conflict (event_id, artist_id) do update
    set performance_start = excluded.performance_start, performance_end = excluded.performance_end,
        performance_order = excluded.performance_order, performance_type = excluded.performance_type,
        set_minutes = excluded.set_minutes, notes = excluded.notes, updated_at = now();
  perform audit_write('event.artist_updated', 'event', p_event_id::text, jsonb_build_object('artist_id', p_artist_id, 'details', d), p_event_id);
end;
$$;

-- Take an artist off a line-up (their open requests for it are cancelled too).
create or replace function remove_event_artist(p_event_id uuid, p_artist_id uuid, p_reason text default null)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not has_permission('events.manage') then
    raise exception 'You do not have permission to change line-ups.' using errcode = '42501';
  end if;
  perform 1 from events where id = p_event_id for update;
  perform set_config('tangy.quiet_request_cancel', 'on', true);
  update assignment_requests set status = 'cancelled', cancel_reason = coalesce(nullif(trim(coalesce(p_reason, '')), ''), 'Removed from the line-up.')
   where session_id = p_event_id and artist_id = p_artist_id and status in ('draft', 'pending', 'accepted', 'confirmed');
  perform set_config('tangy.quiet_request_cancel', 'off', true);
  delete from event_artists where event_id = p_event_id and artist_id = p_artist_id;
  if not found then
    raise exception 'That artist is not on this line-up.';
  end if;
  perform audit_write('event.artist_removed', 'event', p_event_id::text, jsonb_build_object('artist_id', p_artist_id, 'reason', p_reason), p_event_id);
end;
$$;

-- 0033's request creator, now behind the same availability gate.
create or replace function create_artist_request(p_event_id uuid, p_artist_id uuid, p_details jsonb default '{}'::jsonb, p_send boolean default true)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
  d jsonb := coalesce(p_details, '{}'::jsonb);
  v_event events%rowtype;
  v_artist artists%rowtype;
begin
  if not has_permission('events.manage') then
    raise exception 'You do not have permission to send booking requests.' using errcode = '42501';
  end if;
  select * into v_artist from artists where id = p_artist_id;
  if v_artist.id is null or v_artist.status <> 'approved' or v_artist.user_id is null then
    raise exception 'Booking requests can only go to approved artists with an account.';
  end if;
  select * into v_event from events where id = p_event_id;
  if v_event.id is null then
    raise exception 'Event not found.';
  end if;
  if v_event.status = 'cancelled' then
    raise exception 'This event is cancelled.';
  end if;
  if (d ->> 'proposed_end') is not null and (d ->> 'proposed_start') is not null and (d ->> 'proposed_end')::timestamptz <= (d ->> 'proposed_start')::timestamptz then
    raise exception 'The set must end after it starts.' using hint = 'tangy:user';
  end if;
  -- A request may go to a tentative or unavailable artist (they decide), never
  -- to one already booked at that time.
  perform assert_artist_bookable(v_event, v_artist, (d ->> 'proposed_start')::timestamptz, (d ->> 'proposed_end')::timestamptz, true);
  perform assert_no_slot_overlap(p_event_id, p_artist_id, (d ->> 'proposed_start')::timestamptz, (d ->> 'proposed_end')::timestamptz);
  insert into assignment_requests (session_id, artist_id, requested_by, status, message, proposed_start, proposed_end, fee_offer, expires_at,
                                   performance_type, set_minutes, sets_count, call_time, soundcheck_at, technical_notes, hospitality_notes)
  values (p_event_id, p_artist_id, auth.uid(), case when p_send then 'pending' else 'draft' end::assignment_status,
          nullif(trim(coalesce(d ->> 'message', '')), ''),
          (d ->> 'proposed_start')::timestamptz, (d ->> 'proposed_end')::timestamptz, (d ->> 'fee_offer')::int,
          coalesce((d ->> 'expires_at')::timestamptz, now() + make_interval(days => setting_number('artists.request_default_days', 7)::int)),
          nullif(d ->> 'performance_type', ''), (d ->> 'set_minutes')::int, (d ->> 'sets_count')::int,
          (d ->> 'call_time')::timestamptz, (d ->> 'soundcheck_at')::timestamptz,
          nullif(trim(coalesce(d ->> 'technical_notes', '')), ''), nullif(trim(coalesce(d ->> 'hospitality_notes', '')), ''))
  returning id into v_id;
  perform audit_write(case when p_send then 'booking.request_sent' else 'booking.request_drafted' end, 'booking_request', v_id::text,
    jsonb_build_object('event_id', p_event_id, 'artist_id', p_artist_id));
  return v_id;
end;
$$;

-- 0020's answer, re-checked: an artist booked elsewhere since the request
-- went out can't accept a clashing one.
create or replace function respond_to_booking_request(p_request_id uuid, p_accept boolean, p_reason text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_req assignment_requests%rowtype;
  v_event events%rowtype;
  v_artist artists%rowtype;
begin
  perform expire_booking_requests();
  select * into v_req from assignment_requests where id = p_request_id for update;
  if v_req.id is null or not exists (select 1 from artists where id = v_req.artist_id and user_id = auth.uid()) then
    raise exception 'Request not found.';
  end if;
  if v_req.status = 'expired' then
    raise exception 'This request has expired. Message Tangy if you are still available.';
  end if;
  if v_req.status <> 'pending' then
    raise exception 'This request has already been answered.';
  end if;
  if p_accept then
    select * into v_event from events where id = v_req.session_id;
    select * into v_artist from artists where id = v_req.artist_id;
    if v_event.status = 'cancelled' then
      raise exception 'This event has been cancelled.';
    end if;
    -- Accepting is the artist's own decision, so their own "unavailable" mark
    -- doesn't block it; a clashing confirmed booking does.
    perform assert_artist_bookable(v_event, v_artist, v_req.proposed_start, v_req.proposed_end, true);
  end if;
  perform respond_to_assignment_request(p_request_id, p_accept);
  update assignment_requests set decline_reason = case when p_accept then null else nullif(trim(coalesce(p_reason, '')), '') end
    where id = p_request_id;
  if p_accept and v_req.proposed_start is not null then
    insert into event_artist_details (event_id, artist_id, performance_start, performance_end, performance_type, set_minutes)
    values (v_req.session_id, v_req.artist_id, v_req.proposed_start, v_req.proposed_end, v_req.performance_type, v_req.set_minutes)
    on conflict (event_id, artist_id) do update
      set performance_start = coalesce(event_artist_details.performance_start, excluded.performance_start),
          performance_end = coalesce(event_artist_details.performance_end, excluded.performance_end),
          performance_type = coalesce(event_artist_details.performance_type, excluded.performance_type),
          set_minutes = coalesce(event_artist_details.set_minutes, excluded.set_minutes);
  end if;
end;
$$;

-- ===========================================================================
-- 4. NOTIFICATIONS
-- ===========================================================================
-- Added to a line-up: told only if the event is already published.
create or replace function notify_on_event_artist()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if coalesce(current_setting('tangy.defer_lineup_notice', true), 'off') = 'on' then
    return new;
  end if;
  perform notify_lineup_artist(new.event_id, new.artist_id);
  return new;
end;
$$;

-- Taken off a published line-up.
create or replace function notify_on_event_artist_removed()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  e events%rowtype;
  v_user uuid;
begin
  select * into e from events where id = old.event_id;
  if e.id is null or e.status not in ('on-sale', 'sold-out') or e.event_date < current_date then
    return old;
  end if;
  select user_id into v_user from artists where id = old.artist_id;
  perform notify(v_user, 'assignment.removed', 'Line-up change: ' || e.name,
    'You are no longer on the line-up for ' || to_char(e.event_date, 'FMDD FMMonth YYYY') || '. Message the Tangy team if you have questions.',
    '/artist/messages', e.id);
  return old;
end;
$$;
drop trigger if exists event_artists_notify_removed on event_artists;
create trigger event_artists_notify_removed after delete on event_artists
  for each row execute function notify_on_event_artist_removed();

-- Publishing an event tells everyone already on its line-up.
create or replace function notify_on_event_publish()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  r record;
begin
  if old.status = 'draft' and new.status in ('on-sale', 'sold-out') then
    for r in select artist_id from event_artists where event_id = new.id loop
      perform notify_lineup_artist(new.id, r.artist_id);
    end loop;
  end if;
  return new;
end;
$$;
drop trigger if exists events_notify_publish on events;
create trigger events_notify_publish after update of status on events
  for each row execute function notify_on_event_publish();

-- Date / time / venue changes and cancellation. Artists (line-up, and anyone
-- holding an open request) get a specific notice linking to their session;
-- everyone else on the event keeps the 0020 notice. A draft nobody has been
-- told about stays quiet, except to artists with an open request.
create or replace function notify_on_event_change()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  r record;
  v_cancel boolean := new.status = 'cancelled' and old.status is distinct from 'cancelled';
  v_date boolean := new.event_date is distinct from old.event_date;
  v_time boolean := new.event_time is distinct from old.event_time or new.end_time is distinct from old.end_time
                    or new.doors_at is distinct from old.doors_at;
  v_venue boolean := new.venue is distinct from old.venue or new.venue_id is distinct from old.venue_id;
  v_published boolean := old.status in ('on-sale', 'sold-out', 'past');
  v_type text;
  v_title text;
  v_body text;
begin
  if not (v_cancel or v_date or v_time or v_venue) then
    return new;
  end if;
  if v_cancel then
    v_type := 'event.cancelled';
    v_title := 'Event cancelled: ' || new.name;
    v_body := to_char(old.event_date, 'FMDD FMMonth YYYY') || ' is cancelled. The Tangy team will be in touch about next steps.';
  else
    v_type := case when v_date then 'event.date_changed' when v_venue then 'event.venue_changed' else 'event.time_changed' end;
    v_title := 'Event updated: ' || new.name;
    v_body := concat_ws(' · ',
      case when v_date then 'New date: ' || to_char(new.event_date, 'FMDD FMMonth YYYY') end,
      case when v_time then 'New time: ' || coalesce(new.event_time, 'TBC') || coalesce('–' || new.end_time, '') end,
      case when v_venue then 'New venue: ' || coalesce(new.venue, 'TBC') end) || '. Review the changes.';
  end if;

  for r in
    select distinct a.user_id from artists a
     where a.user_id is not null and (
       (v_published and exists (select 1 from event_artists ea where ea.event_id = new.id and ea.artist_id = a.id))
       or exists (select 1 from assignment_requests q where q.session_id = new.id and q.artist_id = a.id and q.status in ('pending', 'accepted', 'confirmed')))
  loop
    perform notify(r.user_id, v_type, v_title, v_body, '/artist/sessions/' || new.id, new.id);
  end loop;

  if v_published then
    for r in select * from event_member_ids(new.id) m where m.kind <> 'artist' limit 2000 loop
      perform notify(r.user_id, case when v_cancel then 'event.cancelled' else 'event.updated' end,
        case when v_cancel then new.name || ' has been cancelled' else new.name || ' — details changed' end,
        case when v_cancel then 'Tangy will be in touch about next steps.'
             else concat_ws(' · ', to_char(new.event_date, 'DD Mon YYYY'), new.event_time, coalesce(new.venue, 'Venue TBC')) end,
        member_link(r.user_id, '?tab=events'), new.id);
    end loop;
  end if;

  -- A cancelled event closes its open requests (the line-up rows stay as history).
  if v_cancel then
    perform set_config('tangy.quiet_request_cancel', 'on', true);
    update assignment_requests set status = 'cancelled', cancel_reason = 'The event was cancelled.'
     where session_id = new.id and status in ('draft', 'pending', 'accepted', 'confirmed');
    perform set_config('tangy.quiet_request_cancel', 'off', true);
  end if;
  return new;
end;
$$;

-- 0033's request notices; a request closed by an event cancellation or a
-- line-up removal is covered by that notice, so it stays quiet here.
create or replace function notify_on_booking_request()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid;
  v_artist text;
  v_event events%rowtype;
begin
  select user_id, coalesce(stage_name, name) into v_user, v_artist from artists where id = new.artist_id;
  select * into v_event from events where id = new.session_id;
  if (tg_op = 'INSERT' and new.status = 'pending') or (tg_op = 'UPDATE' and old.status = 'draft' and new.status = 'pending') then
    perform notify(v_user, 'booking.requested', 'New session request: ' || v_event.name,
      concat_ws(' · ', to_char(v_event.event_date, 'DD Mon YYYY'), v_event.venue, left(new.message, 120)), '/artist/requests/' || new.id, new.session_id);
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    if new.status in ('accepted', 'declined', 'expired') then
      perform notify(new.requested_by,
        case new.status when 'accepted' then 'booking.accepted' when 'declined' then 'booking.declined' else 'booking.expired' end,
        v_artist || case new.status when 'accepted' then ' accepted ' when 'declined' then ' declined ' else ' did not answer ' end || v_event.name,
        new.decline_reason, '/admin-portal/events/' || new.session_id || '?tab=artists', new.session_id);
    elsif new.status = 'confirmed' then
      perform notify(v_user, 'booking.confirmed', 'Confirmed: ' || v_event.name, to_char(v_event.event_date, 'DD Mon YYYY'), '/artist/sessions/' || new.session_id, new.session_id);
    elsif new.status = 'cancelled' and old.status <> 'draft' and coalesce(current_setting('tangy.quiet_request_cancel', true), 'off') <> 'on' then
      perform notify(v_user, 'booking.cancelled', 'Cancelled: ' || v_event.name, new.cancel_reason, '/artist/requests/' || new.id, new.session_id);
    end if;
  end if;
  return new;
end;
$$;

-- 0020's performance-schedule notice: not for drafts, and links to the session.
create or replace function notify_on_artist_schedule()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid;
  e events%rowtype;
  tz text;
begin
  if coalesce(current_setting('tangy.defer_lineup_notice', true), 'off') = 'on' then
    return new;
  end if;
  if tg_op = 'UPDATE' and new.call_time is not distinct from old.call_time and new.soundcheck_at is not distinct from old.soundcheck_at
     and new.performance_start is not distinct from old.performance_start and new.performance_end is not distinct from old.performance_end
     and new.wrap_at is not distinct from old.wrap_at and new.hotel is not distinct from old.hotel
     and new.pickup is not distinct from old.pickup and new.dropoff is not distinct from old.dropoff then
    return new;
  end if;
  if tg_op = 'INSERT' and new.call_time is null and new.performance_start is null and new.soundcheck_at is null then
    return new;
  end if;
  select * into e from events where id = new.event_id;
  -- The first details on a published line-up are part of the lineup notice.
  if e.status not in ('on-sale', 'sold-out') or e.event_date < current_date or tg_op = 'INSERT' then
    return new;
  end if;
  tz := coalesce(e.timezone, 'Asia/Kolkata');
  select a.user_id into v_user from artists a where a.id = new.artist_id;
  perform notify(v_user, 'schedule.changed', 'Performance details changed: ' || e.name,
    concat_ws(' · ',
      'Performance ' || to_char(new.performance_start at time zone tz, 'DD Mon, FMHH12:MI AM') || coalesce('–' || to_char(new.performance_end at time zone tz, 'FMHH12:MI AM'), ''),
      'Call ' || to_char(new.call_time at time zone tz, 'FMHH12:MI AM'),
      'Soundcheck ' || to_char(new.soundcheck_at at time zone tz, 'FMHH12:MI AM')),
    '/artist/sessions/' || new.event_id, new.event_id);
  return new;
end;
$$;

-- ===========================================================================
-- 5. CUSTOM NOTIFICATIONS — Super Admin → one person
-- ===========================================================================
create or replace function send_custom_notification(p_user_id uuid, p_title text, p_body text, p_link text default null)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_title text := trim(coalesce(p_title, ''));
  v_body text := trim(coalesce(p_body, ''));
  v_link text := nullif(trim(coalesce(p_link, '')), '');
  v_before bigint;
  v_queued boolean;
begin
  if current_role_name() is distinct from 'super_admin' then
    raise exception 'Only a Super Admin can send a custom notification.' using errcode = '42501';
  end if;
  if p_user_id is null or not exists (select 1 from profiles where id = p_user_id and is_active) then
    raise exception 'Recipient not found.' using hint = 'tangy:user';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'Choose someone other than yourself.';
  end if;
  if length(v_title) not between 1 and 120 or length(v_body) not between 1 and 1000 then
    raise exception 'Give the notification a title (up to 120 characters) and a message (up to 1000).' using hint = 'tangy:user';
  end if;
  if v_link is not null and (v_link !~ '^/[^/]' or length(v_link) > 300) then
    raise exception 'Links must point inside Tangy (start with a single /).' using hint = 'tangy:user';
  end if;
  select count(*) into v_before from email_outbox where user_id = p_user_id;
  perform notify(p_user_id, 'admin.message', v_title, v_body, v_link, null, 'important');
  v_queued := (select count(*) from email_outbox where user_id = p_user_id) > v_before;
  perform audit_write('notification.custom_sent', 'user', p_user_id::text,
    jsonb_build_object('title', v_title, 'email_queued', v_queued));
  return jsonb_build_object('in_app', true, 'email_queued', v_queued);
end;
$$;

-- ===========================================================================
-- 6. PRIVATE SUPER ADMIN ↔ ARTIST MESSAGING
-- ===========================================================================
create or replace function is_private_conversation(p_conversation_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from conversations where id = p_conversation_id and conversation_type = 'artist_private') $$;

-- Who may read / manage a conversation without being in it: message managers,
-- for partner threads only — never 'general' or private threads.
create or replace function can_manage_conversation(p_conversation_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select has_permission('messages.manage') and exists (select 1 from conversations
       where id = p_conversation_id and conversation_type not in ('general', 'artist_private')) $$;

drop policy if exists "conversations: participant or staff read" on conversations;
create policy "conversations: participant or staff read" on conversations for select
  using (is_participant(id) or (is_staff_or_admin() and conversation_type <> 'artist_private'));
drop policy if exists "conversations: staff/admin update" on conversations;
create policy "conversations: staff/admin update" on conversations for update
  using (is_staff_or_admin() and (conversation_type <> 'artist_private' or is_participant(id)));
drop policy if exists "conversations: creator or staff insert" on conversations;
create policy "conversations: creator or staff insert" on conversations for insert
  with check (((created_by = auth.uid()) and (conversation_type = 'general') and (external_user_id is null))
              or (is_staff_or_admin() and conversation_type <> 'artist_private'));

drop policy if exists "participants: self or staff read" on conversation_participants;
create policy "participants: self or staff read" on conversation_participants for select
  using (user_id = auth.uid() or (is_staff_or_admin() and not is_private_conversation(conversation_id)));
drop policy if exists "participants: staff/admin manage" on conversation_participants;
create policy "participants: staff/admin manage" on conversation_participants
  using (is_staff_or_admin() and not is_private_conversation(conversation_id))
  with check (is_staff_or_admin() and not is_private_conversation(conversation_id));

drop policy if exists "messages: participant or staff read" on messages;
create policy "messages: participant or staff read" on messages for select
  using (is_participant(conversation_id) or (is_staff_or_admin() and not is_private_conversation(conversation_id)));
drop policy if exists "messages: participant or staff insert" on messages;
create policy "messages: participant or staff insert" on messages for insert
  with check (sender_id = auth.uid() and (is_participant(conversation_id) or (is_staff_or_admin() and not is_private_conversation(conversation_id))));

-- Start (or continue) the private thread with an artist.
create or replace function start_private_artist_conversation(p_artist_user_id uuid, p_subject text, p_body text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_conv uuid;
begin
  if current_role_name() is distinct from 'super_admin' then
    raise exception 'Only a Super Admin can start a private conversation with an artist.' using errcode = '42501';
  end if;
  if partner_kind(p_artist_user_id) is distinct from 'artist' then
    raise exception 'Private conversations are for artists with a portal account.' using hint = 'tangy:user';
  end if;
  if length(trim(coalesce(p_body, ''))) not between 1 and 4000 then
    raise exception 'Messages must be between 1 and 4000 characters.';
  end if;
  select c.id into v_conv from conversations c
   where c.conversation_type = 'artist_private' and c.external_user_id = p_artist_user_id and c.status <> 'closed'
     and exists (select 1 from conversation_participants cp where cp.conversation_id = c.id and cp.user_id = auth.uid())
   order by c.created_at desc limit 1;
  if v_conv is null then
    insert into conversations (subject, category, conversation_type, created_by, external_user_id, assigned_admin_id, status,
                               related_artist_id)
    values (coalesce(left(nullif(trim(p_subject), ''), 140), 'Private conversation'), 'support', 'artist_private', auth.uid(), p_artist_user_id,
            auth.uid(), 'pending', (select id from artists where user_id = p_artist_user_id order by status = 'approved' desc limit 1))
    returning id into v_conv;
    insert into conversation_participants (conversation_id, user_id, role)
    values (v_conv, p_artist_user_id, 'owner'), (v_conv, auth.uid(), 'admin');
  end if;
  insert into messages (conversation_id, sender_id, content) values (v_conv, auth.uid(), trim(p_body));
  return v_conv;
end;
$$;

-- Message notices link straight to the conversation; a private thread never
-- falls back to "everyone who manages messages".
create or replace function on_message_created()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_conv conversations%rowtype;
  v_sender profiles%rowtype;
  v_sender_is_admin boolean;
  r record;
  v_has_admin boolean;
begin
  update conversations
    set last_message_at = new.created_at,
        last_message_preview = left(regexp_replace(new.content, '\s+', ' ', 'g'), 140),
        updated_at = now()
    where id = new.conversation_id
    returning * into v_conv;
  if v_conv.conversation_type = 'general' or new.message_type = 'system' then
    return new;
  end if;

  select * into v_sender from profiles where id = new.sender_id;
  v_sender_is_admin := exists (select 1 from role_permissions where role = v_sender.role and permission = 'messages.manage');

  insert into audit_logs (actor_id, actor_email, actor_role, action, resource_type, resource_id, event_id, metadata)
  values (new.sender_id, v_sender.email, v_sender.role::text, 'message.sent', 'conversation', new.conversation_id::text,
          v_conv.related_session_id, jsonb_build_object('conversation_type', v_conv.conversation_type, 'message_id', new.id, 'length', length(new.content)));

  v_has_admin := false;
  for r in
    select cp.user_id, p.role from conversation_participants cp join profiles p on p.id = cp.user_id
    where cp.conversation_id = new.conversation_id and cp.user_id <> new.sender_id
  loop
    if exists (select 1 from role_permissions where role = r.role and permission = 'messages.manage') then
      v_has_admin := true;
      perform notify(r.user_id, 'message.new', 'New message from ' || coalesce(v_sender.full_name, v_sender.email),
        left(new.content, 140), '/admin-portal/messages/' || new.conversation_id, v_conv.related_session_id);
    elsif r.role = 'artist' or partner_kind(r.user_id) = 'artist' then
      perform notify(r.user_id, 'message.new',
        case when v_conv.conversation_type = 'artist_private' then 'New private message from ' || coalesce(v_sender.full_name, 'Tangy') else 'New message from Tangy' end,
        left(new.content, 140), '/artist/messages/' || new.conversation_id, v_conv.related_session_id);
    else
      perform notify(r.user_id, 'message.new', 'New message from Tangy', left(new.content, 140),
        portal_path(r.role) || '?tab=messages&c=' || new.conversation_id, v_conv.related_session_id);
    end if;
  end loop;

  if not v_sender_is_admin and not v_has_admin and v_conv.conversation_type <> 'artist_private' then
    perform notify_permission_holders('messages.manage', 'message.new',
      'New message from ' || coalesce(v_sender.full_name, v_sender.email),
      left(new.content, 140), '/admin-portal/messages/' || new.conversation_id, v_conv.related_session_id);
  end if;
  return new;
end;
$$;

-- ===========================================================================
-- 7. ROLES
-- ===========================================================================
create or replace function role_label(p_role user_role)
returns text language sql immutable
as $$
  select case p_role
    when 'super_admin' then 'Super Admin' when 'admin' then 'Admin' when 'staff' then 'Staff'
    when 'artist' then 'Artist' when 'sponsor' then 'Sponsor' when 'vendor' then 'Vendor'
    when 'venue' then 'Venue Host' when 'volunteer' then 'Volunteer' when 'crew' then 'Crew'
    else initcap(replace(p_role::text, '_', ' ')) end
$$;

create or replace function admin_set_user_role(p_user_id uuid, p_role user_role, p_reason text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_old user_role;
begin
  if not has_permission('roles.manage') then
    raise exception 'Only a super admin can change roles.';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'You cannot change your own role.';
  end if;
  -- Super Admin is granted and removed only by a Super Admin, whatever the
  -- permission matrix says about roles.manage.
  if (p_role = 'super_admin' or exists (select 1 from profiles where id = p_user_id and role = 'super_admin'))
     and current_role_name() is distinct from 'super_admin' then
    raise exception 'Only a Super Admin can grant or remove Super Admin.';
  end if;
  select role into v_old from profiles where id = p_user_id for update;
  if v_old is null then
    raise exception 'User not found.';
  end if;
  if v_old = p_role then
    return;
  end if;
  if v_old = 'super_admin' and (select count(*) from profiles where role = 'super_admin' and is_active) <= 1 then
    raise exception 'Cannot demote the last active super admin.';
  end if;

  update profiles set role = p_role where id = p_user_id;
  perform audit_write('user.role_changed', 'user', p_user_id::text,
    jsonb_build_object('from', v_old, 'to', p_role, 'reason', p_reason));
  perform notify(p_user_id, 'role.changed', 'Your Tangy role has been updated',
    'Previous role: ' || role_label(v_old) || ' · New role: ' || role_label(p_role) || '. Open your dashboard to continue.',
    portal_path(p_role), null, 'important');
end;
$$;

-- ===========================================================================
-- 8. AVAILABILITY REMINDER (platform job)
-- ===========================================================================
create or replace function send_availability_reminders()
returns int
language plpgsql security definer set search_path = public
as $$
declare
  v_days int := setting_number('artists.availability_stale_days', 30)::int;
  r record;
  n int := 0;
begin
  for r in
    select a.user_id from artists a
     where a.status = 'approved' and a.user_id is not null
       and coalesce((select max(updated_at) from artist_availability av where av.artist_id = a.id), '-infinity') < now() - make_interval(days => v_days)
       and not exists (select 1 from notifications nt where nt.user_id = a.user_id and nt.type = 'availability.reminder'
                         and nt.created_at > now() - make_interval(days => v_days))
     limit 500
  loop
    perform notify(r.user_id, 'availability.reminder', 'Your availability hasn''t been updated recently',
      'Keep your calendar current so the Tangy team knows when to ask you to play.', '/artist/availability', null);
    n := n + 1;
  end loop;
  return n;
end;
$$;
revoke execute on function send_availability_reminders() from public, anon, authenticated;

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
    'access_expiry_logged', log_expired_access(),
    'availability_reminders', send_availability_reminders());
  update platform_job_runs set finished_at = now(), result = v_result where id = v_run;
  return v_result;
end;
$$;
revoke execute on function run_platform_jobs(text) from public, anon, authenticated;

-- ===========================================================================
-- GRANTS
-- ===========================================================================
grant execute on function find_available_artists(date, time, time, text, text, text, uuid), artist_calendar(uuid, date, date),
  artist_availability_summary(uuid), admin_calendar(date, date), artist_day_summary(date), can_see_artist_schedule(),
  save_event_lineup(uuid, jsonb), update_event_artist(uuid, uuid, jsonb), remove_event_artist(uuid, uuid, text),
  send_custom_notification(uuid, text, text, text), start_private_artist_conversation(uuid, text, text),
  is_private_conversation(uuid), can_manage_conversation(uuid), role_label(user_role)
  to authenticated;

-- Every existing conversation function keeps private threads to their participants.
CREATE OR REPLACE FUNCTION public.admin_conversations(p_type text DEFAULT NULL::text, p_event_id uuid DEFAULT NULL::uuid, p_status text DEFAULT NULL::text, p_search text DEFAULT NULL::text, p_unread_only boolean DEFAULT false, p_limit integer DEFAULT 30, p_offset integer DEFAULT 0, p_assigned text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, subject text, conversation_type text, status conversation_status, priority text, event_id uuid, event_name text, partner_id uuid, partner_name text, partner_email text, partner_role text, assigned_admin_id uuid, assigned_admin_name text, last_message_at timestamp with time zone, last_message_preview text, last_partner_message_at timestamp with time zone, last_tangy_reply_at timestamp with time zone, unread integer, total_count bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not has_permission('messages.manage') then
    raise exception 'You do not have permission to view messages.';
  end if;
  return query
  with base as (
    select c.*, e.name as ev_name, p.full_name as p_name, p.email as p_email, p.role::text as p_role,
           a.full_name as a_name,
           (select max(m.created_at) from messages m where m.conversation_id = c.id and m.sender_id = c.external_user_id) as last_partner,
           (select max(m.created_at) from messages m where m.conversation_id = c.id and m.sender_id <> c.external_user_id) as last_tangy,
           (select count(*)::int from messages m where m.conversation_id = c.id and m.sender_id = c.external_user_id
              and m.created_at > coalesce((select last_read_at from message_read_states rs
                                           where rs.conversation_id = c.id and rs.user_id = auth.uid()), '-infinity')) as unread_n
    from conversations c
    left join events e on e.id = c.related_session_id
    left join profiles p on p.id = c.external_user_id
    left join profiles a on a.id = c.assigned_admin_id
    where c.conversation_type <> 'general' and (c.conversation_type <> 'artist_private' or is_participant(c.id))
      and (p_type is null or c.conversation_type = p_type)
      and (p_event_id is null or c.related_session_id = p_event_id)
      and (p_status is null or c.status::text = p_status or (p_status = 'active' and c.status in ('open', 'pending')))
      and (p_assigned is null or (p_assigned = 'me' and c.assigned_admin_id = auth.uid()) or (p_assigned = 'none' and c.assigned_admin_id is null))
      and (p_search is null or p.full_name ilike '%' || p_search || '%' or p.email ilike '%' || p_search || '%'
           or c.subject ilike '%' || p_search || '%' or e.name ilike '%' || p_search || '%')
  )
  select b.id, b.subject, b.conversation_type, b.status, b.priority, b.related_session_id, b.ev_name,
         b.external_user_id, b.p_name, b.p_email, b.p_role, b.assigned_admin_id, b.a_name,
         b.last_message_at, b.last_message_preview, b.last_partner, b.last_tangy, b.unread_n, count(*) over ()
  from base b
  where not p_unread_only or b.unread_n > 0
  order by (b.priority = 'urgent') desc, (b.priority = 'high') desc, coalesce(b.last_message_at, b.created_at) desc
  limit least(greatest(p_limit, 1), 100) offset greatest(p_offset, 0);
end;
$function$;

CREATE OR REPLACE FUNCTION public.conversation_messages(p_conversation_id uuid, p_limit integer DEFAULT 100, p_before timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS TABLE(id uuid, sender_id uuid, sender_name text, from_tangy boolean, is_mine boolean, content text, message_type text, created_at timestamp with time zone, read_by_other boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_conv conversations%rowtype;
begin
  select * into v_conv from conversations where conversations.id = p_conversation_id;
  if v_conv.id is null or not (is_participant(p_conversation_id)
                               or (has_permission('messages.manage') and v_conv.conversation_type not in ('general', 'artist_private'))) then
    raise exception 'Conversation not found.';
  end if;
  return query
  select x.* from (
    select m.id, m.sender_id,
           case when m.sender_id = v_conv.external_user_id then coalesce(p.full_name, p.email)
                else coalesce(p.full_name, 'Tangy team') end,
           m.sender_id is distinct from v_conv.external_user_id,
           m.sender_id = auth.uid(),
           m.content, m.message_type, m.created_at,
           exists (select 1 from message_read_states rs
                   where rs.conversation_id = p_conversation_id and rs.user_id <> m.sender_id and rs.last_read_at >= m.created_at)
    from messages m left join profiles p on p.id = m.sender_id
    where m.conversation_id = p_conversation_id and (p_before is null or m.created_at < p_before)
    order by m.created_at desc
    limit least(greatest(p_limit, 1), 200)
  ) x order by x.created_at;
end;
$function$;

CREATE OR REPLACE FUNCTION public.send_message(p_conversation_id uuid, p_body text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_conv conversations%rowtype;
  v_admin boolean := has_permission('messages.manage');
  v_msg uuid;
begin
  select * into v_conv from conversations where id = p_conversation_id for update;
  if v_conv.id is null or not (is_participant(p_conversation_id) or (v_admin and v_conv.conversation_type not in ('general', 'artist_private'))) then
    raise exception 'Conversation not found.';
  end if;
  if length(trim(coalesce(p_body, ''))) not between 1 and 4000 then
    raise exception 'Messages must be between 1 and 4000 characters.';
  end if;
  if v_conv.status = 'closed' and not v_admin then
    raise exception 'This conversation is closed. Start a new message to reach Tangy.';
  end if;
  if v_admin and not is_participant(p_conversation_id) then
    insert into conversation_participants (conversation_id, user_id, role) values (p_conversation_id, auth.uid(), 'admin')
    on conflict do nothing;
  end if;
  insert into messages (conversation_id, sender_id, content) values (p_conversation_id, auth.uid(), trim(p_body))
  returning id into v_msg;
  update conversations
    set status = case when v_admin then 'pending'::conversation_status else 'open'::conversation_status end,
        assigned_admin_id = case when v_admin then coalesce(assigned_admin_id, auth.uid()) else assigned_admin_id end
    where id = p_conversation_id;
  return v_msg;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_conversation_status(p_conversation_id uuid, p_status conversation_status)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not has_permission('messages.manage') then
    raise exception 'You do not have permission to manage conversations.';
  end if;
  update conversations set status = p_status where id = p_conversation_id and conversation_type <> 'general'
    and (conversation_type <> 'artist_private' or is_participant(id));
  if not found then
    raise exception 'Conversation not found.';
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_conversation_meta(p_conversation_id uuid, p_priority text DEFAULT NULL::text, p_assign_to_me boolean DEFAULT NULL::boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not has_permission('messages.manage') then
    raise exception 'You do not have permission to manage conversations.';
  end if;
  update conversations
    set priority = coalesce(p_priority, priority),
        assigned_admin_id = case when p_assign_to_me is true then auth.uid() when p_assign_to_me is false then null else assigned_admin_id end
    where id = p_conversation_id and conversation_type <> 'general' and (conversation_type <> 'artist_private' or is_participant(id));
  if not found then
    raise exception 'Conversation not found.';
  end if;
  if p_assign_to_me is true then
    insert into conversation_participants (conversation_id, user_id, role) values (p_conversation_id, auth.uid(), 'admin')
    on conflict do nothing;
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.mark_conversation_read(p_conversation_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not (is_participant(p_conversation_id) or (has_permission('messages.manage') and not is_private_conversation(p_conversation_id))) then
    raise exception 'Conversation not found.';
  end if;
  insert into message_read_states (conversation_id, user_id, last_read_at)
  values (p_conversation_id, auth.uid(), now())
  on conflict (conversation_id, user_id) do update set last_read_at = now();
  update notifications set read_at = now()
    where user_id = auth.uid() and read_at is null and type = 'message.new'
      and link like '%' || p_conversation_id::text;
end;
$function$;

CREATE OR REPLACE FUNCTION public.assign_conversation(p_conversation_id uuid, p_admin_id uuid DEFAULT auth.uid())
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not is_staff_or_admin() or is_private_conversation(p_conversation_id) then
    raise exception 'Only staff/admin can assign conversations.';
  end if;
  update conversations set assigned_admin_id = p_admin_id, status = 'pending'
    where id = p_conversation_id;
  insert into conversation_participants (conversation_id, user_id, role)
    values (p_conversation_id, p_admin_id, 'admin')
    on conflict (conversation_id, user_id) do nothing;
end;
$function$;

CREATE OR REPLACE FUNCTION public.reopen_conversation(p_conversation_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not exists (
    select 1 from conversations
    where id = p_conversation_id and (created_by = auth.uid() or is_participant(id) or (is_staff_or_admin() and conversation_type <> 'artist_private'))
  ) then
    raise exception 'Not authorized to reopen this conversation.';
  end if;
  update conversations set status = 'open' where id = p_conversation_id;
end;
$function$;

