-- Tangy Sessions — artist portal and artist applications.
-- Run after 0032_booking_request_states.sql (its enum values must be
-- committed first). Reverse with supabase/rollbacks/0033_artist_portal.down.sql.
--
-- 1. SECURITY FIX — internal review notes (review_notes) were stored on the
--    application rows applicants can read (artists, collaborations,
--    crew_applications), so an applicant could read the team's notes. They now
--    live in application_reviews (application reviewers only); a trigger moves
--    any note written to the old column, so existing approve functions keep
--    working. decision_reason stays on the row — it is the applicant-facing
--    message (it is already sent to them in the decision notification).
-- 2. SECURITY FIX — artist_availability was readable by anyone ("public read").
--    Now the artist themselves and the team only.
-- 3. ARTIST APPLICATIONS — artist_applications: a multi-step application with
--    autosaved drafts (data jsonb, current step), a performance video (upload
--    or YouTube / Vimeo link), consents, and the review cycle
--    draft → submitted → under_review → needs_information → submitted … →
--    approved | rejected (| withdrawn). Submitting creates / updates the artist
--    record (status pending); approval still runs approve_artist_application
--    (role provisioning, notification, audit). Status changes only through
--    the functions below.
-- 4. ARTIST PROFILE — public fields on artists (cover, long bio, country,
--    languages, instruments, genres, years active, website, highlights,
--    self-reported audience numbers) and private ones on
--    artist_private_profiles (legal name, WhatsApp, management, travel).
-- 5. BOOKING REQUESTS — performance type, set length, call / soundcheck
--    times, technical and hospitality notes, viewed / confirmed / completed
--    timestamps; draft requests stay invisible to the artist; the team can
--    confirm, cancel and complete; artist_schedule_check() shows the team an
--    artist's availability and other sessions on a date before sending.
-- 6. AVAILABILITY — a note and an optional time window per day;
--    set_artist_availability() for date ranges.
-- 7. MEDIA — description, tags, date, related session, kind and performance
--    type on artist_media (review stays with the existing guard).
-- 8. DOCUMENTS — artist_documents + a private artist-documents bucket
--    (rider, EPK, tax / payment, identity); the artist and the team only.

-- ===========================================================================
-- 1. PRIVATE REVIEW NOTES
-- ===========================================================================
create table if not exists application_reviews (
  source_table text not null check (source_table in ('artists', 'collaborations', 'crew_applications', 'artist_applications')),
  source_id uuid not null,
  notes text check (notes is null or length(notes) <= 8000),
  tags text[] not null default '{}',
  assessment jsonb not null default '{}'::jsonb check (jsonb_typeof(assessment) = 'object'),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_at timestamptz not null default now(),
  primary key (source_table, source_id)
);
alter table application_reviews enable row level security;
create policy "application_reviews: reviewers read" on application_reviews for select using (has_permission('applications.view'));
create policy "application_reviews: reviewers write" on application_reviews for insert with check (has_permission('applications.review'));
create policy "application_reviews: reviewers update" on application_reviews for update using (has_permission('applications.review')) with check (has_permission('applications.review'));
grant select, insert, update on application_reviews to authenticated;

create or replace function move_review_notes()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.review_notes is not null then
    insert into application_reviews (source_table, source_id, notes, updated_by, updated_at)
    values (tg_table_name, new.id, new.review_notes, auth.uid(), now())
    on conflict (source_table, source_id) do update
      set notes = concat_ws(E'\n\n', application_reviews.notes, excluded.notes), updated_by = excluded.updated_by, updated_at = now();
    new.review_notes := null;
  end if;
  return new;
end;
$$;
create trigger artists_private_notes before insert or update of review_notes on artists for each row execute function move_review_notes();
create trigger collaborations_private_notes before insert or update of review_notes on collaborations for each row execute function move_review_notes();
create trigger crew_applications_private_notes before insert or update of review_notes on crew_applications for each row execute function move_review_notes();

-- Existing notes move now.
insert into application_reviews (source_table, source_id, notes)
  select 'artists', id, review_notes from artists where review_notes is not null
  union all select 'collaborations', id, review_notes from collaborations where review_notes is not null
  union all select 'crew_applications', id, review_notes from crew_applications where review_notes is not null
on conflict do nothing;
alter table artists disable trigger artists_private_notes;
update artists set review_notes = null where review_notes is not null;
alter table artists enable trigger artists_private_notes;
alter table collaborations disable trigger collaborations_private_notes;
update collaborations set review_notes = null where review_notes is not null;
alter table collaborations enable trigger collaborations_private_notes;
alter table crew_applications disable trigger crew_applications_private_notes;
update crew_applications set review_notes = null where review_notes is not null;
alter table crew_applications enable trigger crew_applications_private_notes;

-- Same columns as 0017; notes now come from application_reviews (reviewers
-- see them, applicants get null — the view runs with the caller's RLS).
create or replace view applications_overview with (security_invoker = true) as
select
  'artists'::text as source_table, a.id, 'artist'::text as type, a.user_id,
  a.name as applicant_name, a.email as applicant_email, null::text as phone,
  a.applied_at as submitted_at, a.status, a.reviewed_by, a.reviewed_at,
  (select ar.notes from application_reviews ar where ar.source_table = 'artists' and ar.source_id = a.id) as review_notes, a.decision_reason,
  concat_ws(' · ', a.genre, a.city) as summary,
  jsonb_build_object('genre', a.genre, 'city', a.city, 'bio', a.bio, 'experience_level', a.experience_level,
    'instagram', a.instagram, 'soundcloud', a.soundcloud, 'spotify', a.spotify) as details
from artists a
union all
select
  'collaborations', c.id, case c.type when 'venue_host' then 'venue' else c.type::text end, c.user_id,
  coalesce(c.business_name, c.contact_name), c.email, c.phone,
  c.created_at, c.status, c.reviewed_by, c.reviewed_at,
  (select ar.notes from application_reviews ar where ar.source_table = 'collaborations' and ar.source_id = c.id), c.decision_reason,
  c.business_name,
  jsonb_build_object('business_name', c.business_name, 'contact_name', c.contact_name, 'details', c.details)
from collaborations c
union all
select
  'crew_applications', r.id, r.category, r.user_id,
  r.name, r.email, r.phone,
  r.created_at, r.status, r.reviewed_by, r.reviewed_at,
  (select ar.notes from application_reviews ar where ar.source_table = 'crew_applications' and ar.source_id = r.id), r.decision_reason,
  concat_ws(' · ', r.role_interest, r.event_interest),
  jsonb_build_object('role_interest', r.role_interest, 'event_interest', r.event_interest, 'message', r.message)
from crew_applications r;

-- ===========================================================================
-- 2. AVAILABILITY IS PRIVATE
-- ===========================================================================
drop policy if exists "artist_availability: public read" on artist_availability;
create policy "artist_availability: self read" on artist_availability for select
  using (exists (select 1 from artists a where a.id = artist_id and a.user_id = auth.uid()));
create policy "artist_availability: team read" on artist_availability for select
  using (has_permission('events.manage') or has_permission('entities.manage'));

alter table artist_availability
  add column if not exists note text check (note is null or length(note) <= 300),
  add column if not exists start_time time,
  add column if not exists end_time time;
alter table artist_availability drop constraint if exists artist_availability_window_check;
alter table artist_availability add constraint artist_availability_window_check
  check ((start_time is null and end_time is null) or (start_time is not null and end_time is not null and end_time > start_time));

-- The artist sets a status for every day in a range (or clears it).
create or replace function set_artist_availability(p_from date, p_to date, p_status text, p_note text default null,
                                                   p_start time default null, p_end time default null)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_artist uuid;
  v_n int;
begin
  select id into v_artist from artists where user_id = auth.uid() and status = 'approved';
  if v_artist is null then
    raise exception 'Only an approved artist can set availability.';
  end if;
  if p_to < p_from or p_to - p_from > 366 then
    raise exception 'Choose a range of up to a year.';
  end if;
  if p_status is null then
    delete from artist_availability where artist_id = v_artist and date between p_from and p_to;
    get diagnostics v_n = row_count;
    return v_n;
  end if;
  if p_status not in ('available', 'tentative', 'unavailable') then
    raise exception 'Unknown availability status.';
  end if;
  -- Days with a confirmed performance keep their booking (guard_artist_availability, 0020).
  insert into artist_availability (artist_id, date, status, note, start_time, end_time)
  select v_artist, d::date, p_status, nullif(trim(coalesce(p_note, '')), ''), p_start, p_end
  from generate_series(p_from, p_to, interval '1 day') d
  where not exists (select 1 from event_artists ea join events e on e.id = ea.event_id
                    where ea.artist_id = v_artist and e.event_date = d::date and e.status <> 'cancelled')
  on conflict (artist_id, date) do update
    set status = excluded.status, note = excluded.note, start_time = excluded.start_time, end_time = excluded.end_time;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

-- ===========================================================================
-- 3. ARTIST APPLICATIONS
-- ===========================================================================
create table if not exists artist_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade default auth.uid(),
  artist_id uuid references artists(id) on delete set null,
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'under_review', 'needs_information', 'approved', 'rejected', 'withdrawn')),
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object' and pg_column_size(data) < 200000),
  current_step int not null default 1 check (current_step between 1 and 8),
  -- Performance video: an uploaded file (private artist-media bucket) or a link
  -- to YouTube / Vimeo only.
  video_url text check (video_url is null or video_url ~ '^https://(www\.|m\.)?(youtube\.com/(watch\?v=|embed/|shorts/)|youtu\.be/|vimeo\.com/|player\.vimeo\.com/video/)[A-Za-z0-9_\-?=&/]+$'),
  video_storage_path text check (video_storage_path is null or length(video_storage_path) <= 400),
  media_consent boolean not null default false,
  accuracy_confirmed boolean not null default false,
  info_request jsonb check (info_request is null or jsonb_typeof(info_request) = 'object'),
  public_message text check (public_message is null or length(public_message) <= 1000),
  submitted_at timestamptz,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists artist_applications_status_idx on artist_applications (status, submitted_at desc);
create trigger artist_applications_set_updated_at before update on artist_applications for each row execute function set_updated_at();

alter table artist_applications enable row level security;
create policy "artist_applications: applicant read" on artist_applications for select using (user_id = auth.uid());
create policy "artist_applications: reviewers read" on artist_applications for select using (has_permission('applications.view'));
create policy "artist_applications: applicant start" on artist_applications for insert with check (user_id = auth.uid());
create policy "artist_applications: applicant edit" on artist_applications for update
  using (user_id = auth.uid() and status in ('draft', 'needs_information'))
  with check (user_id = auth.uid());
grant select, insert, update on artist_applications to authenticated;

-- Applicants may only edit their answers; status and review fields change
-- through the functions below.
create or replace function guard_artist_application()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if coalesce(auth.role(), '') not in ('authenticated', 'anon') or current_setting('tangy.application_rpc', true) = 'on' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.status := 'draft'; new.artist_id := null; new.info_request := null; new.public_message := null;
    new.submitted_at := null; new.decided_at := null;
    return new;
  end if;
  if new.status is distinct from old.status or new.artist_id is distinct from old.artist_id
     or new.info_request is distinct from old.info_request or new.public_message is distinct from old.public_message
     or new.submitted_at is distinct from old.submitted_at or new.decided_at is distinct from old.decided_at
     or new.user_id is distinct from old.user_id then
    raise exception 'Use Submit to send your application; the team updates its status.';
  end if;
  return new;
end;
$$;
create trigger artist_applications_guard before insert or update on artist_applications
  for each row execute function guard_artist_application();

create or replace function submit_artist_application()
returns artist_applications
language plpgsql security definer set search_path = public
as $$
declare
  v_app artist_applications%rowtype;
  v_email text;
  v jsonb;
  v_missing text[] := '{}';
  v_artist uuid;
  v_resubmit boolean;
begin
  select * into v_app from artist_applications where user_id = auth.uid() for update;
  if v_app.id is null then
    raise exception 'Start an application first.';
  end if;
  if v_app.status not in ('draft', 'needs_information') then
    raise exception 'This application has already been submitted.';
  end if;
  v := v_app.data;
  if coalesce(trim(v #>> '{about,full_name}'), '') = '' then v_missing := array_append(v_missing, 'full name'); end if;
  if coalesce(trim(v #>> '{about,stage_name}'), '') = '' then v_missing := array_append(v_missing, 'stage name'); end if;
  if coalesce(trim(v #>> '{about,city}'), '') = '' then v_missing := array_append(v_missing, 'city'); end if;
  if coalesce(trim(v #>> '{artistry,artist_type}'), '') = '' then v_missing := array_append(v_missing, 'artist type'); end if;
  if coalesce(trim(v #>> '{artistry,primary_genre}'), '') = '' then v_missing := array_append(v_missing, 'primary genre'); end if;
  if coalesce(trim(v #>> '{artistry,short_bio}'), '') = '' then v_missing := array_append(v_missing, 'short bio'); end if;
  if v_app.video_url is null and v_app.video_storage_path is null then v_missing := array_append(v_missing, 'performance video'); end if;
  if not v_app.media_consent then v_missing := array_append(v_missing, 'media consent'); end if;
  if not v_app.accuracy_confirmed then v_missing := array_append(v_missing, 'confirmation that the information is accurate'); end if;
  if cardinality(v_missing) > 0 then
    raise exception 'Please complete: %.', array_to_string(v_missing, ', ');
  end if;

  select email into v_email from auth.users where id = auth.uid();
  v_resubmit := v_app.status = 'needs_information';
  perform set_config('tangy.application_rpc', 'on', true);
  if v_app.artist_id is null then
    insert into artists (user_id, name, stage_name, email, genre, subgenre, city, bio, long_bio, instagram, spotify, youtube, soundcloud,
                         website, performance_type, experience_level, country, languages, instruments, genres, years_active, status)
    values (auth.uid(), trim(v #>> '{about,full_name}'), trim(v #>> '{about,stage_name}'), v_email,
            v #>> '{artistry,primary_genre}', v #>> '{artistry,sub_genres}', trim(v #>> '{about,city}'),
            trim(v #>> '{artistry,short_bio}'), v #>> '{artistry,long_bio}',
            v #>> '{online,instagram}', v #>> '{online,spotify}', v #>> '{online,youtube}', v #>> '{online,soundcloud}', v #>> '{online,website}',
            v #>> '{artistry,artist_type}', v #>> '{artistry,experience_level}', v #>> '{about,country}',
            array(select jsonb_array_elements_text(coalesce(v #> '{artistry,languages}', '[]'))),
            array(select jsonb_array_elements_text(coalesce(v #> '{artistry,instruments}', '[]'))),
            array(select jsonb_array_elements_text(coalesce(v #> '{artistry,genres}', '[]'))),
            nullif(v #>> '{artistry,years_active}', '')::int, 'pending')
    returning id into v_artist;
  else
    v_artist := v_app.artist_id;
    update artists set name = trim(v #>> '{about,full_name}'), stage_name = trim(v #>> '{about,stage_name}'),
      genre = v #>> '{artistry,primary_genre}', city = trim(v #>> '{about,city}'), bio = trim(v #>> '{artistry,short_bio}'),
      long_bio = v #>> '{artistry,long_bio}', instagram = v #>> '{online,instagram}', spotify = v #>> '{online,spotify}',
      youtube = v #>> '{online,youtube}', soundcloud = v #>> '{online,soundcloud}', website = v #>> '{online,website}',
      performance_type = v #>> '{artistry,artist_type}', experience_level = v #>> '{artistry,experience_level}'
      where id = v_artist and status = 'pending';
  end if;

  update artist_applications set status = 'submitted', artist_id = v_artist, submitted_at = now(), info_request = null
    where id = v_app.id returning * into v_app;
  if v_resubmit then
    perform notify_permission_holders('applications.review', 'application.resubmitted',
      'Artist application updated: ' || trim(v #>> '{about,stage_name}'), 'The requested information was added.',
      '/admin-portal/artists/applications/' || v_app.id);
  end if;
  perform notify(auth.uid(), 'application.submitted', 'Your artist application was submitted',
    'The Tangy team will review it — you can follow it here.', '/artist/application');
  perform audit_write(case when v_resubmit then 'application.resubmitted' else 'application.submitted' end, 'artist_application', v_app.id::text,
    jsonb_build_object('artist_id', v_artist));
  return v_app;
end;
$$;

create or replace function withdraw_artist_application()
returns void
language plpgsql security definer set search_path = public
as $$
begin
  perform set_config('tangy.application_rpc', 'on', true);
  update artist_applications set status = 'withdrawn'
    where user_id = auth.uid() and status in ('draft', 'submitted', 'under_review', 'needs_information');
  if not found then
    raise exception 'There is no open application to withdraw.';
  end if;
end;
$$;

create or replace function review_artist_application(p_id uuid, p_action text, p_items text[] default null,
                                                     p_message text default null, p_internal text default null)
returns artist_applications
language plpgsql security definer set search_path = public
as $$
declare
  v_app artist_applications%rowtype;
  v_name text;
begin
  if not has_permission('applications.review') then
    raise exception 'You do not have permission to review applications.' using errcode = '42501';
  end if;
  select * into v_app from artist_applications where id = p_id for update;
  if v_app.id is null then
    raise exception 'Application not found.';
  end if;
  v_name := coalesce(v_app.data #>> '{about,stage_name}', 'the artist');
  perform set_config('tangy.application_rpc', 'on', true);

  if p_action = 'start_review' then
    if v_app.status <> 'submitted' then raise exception 'Only a submitted application can be put under review.'; end if;
    update artist_applications set status = 'under_review' where id = p_id returning * into v_app;
    perform notify(v_app.user_id, 'application.under_review', 'Your artist application is being reviewed', null, '/artist/application');

  elsif p_action = 'request_info' then
    if v_app.status not in ('submitted', 'under_review') then raise exception 'Information can be requested only for a submitted application.'; end if;
    if coalesce(cardinality(p_items), 0) = 0 and coalesce(trim(p_message), '') = '' then
      raise exception 'Say what is needed.';
    end if;
    update artist_applications set status = 'needs_information',
      info_request = jsonb_build_object('items', to_jsonb(coalesce(p_items, '{}')), 'message', nullif(trim(coalesce(p_message, '')), ''), 'requested_at', now())
      where id = p_id returning * into v_app;
    perform notify(v_app.user_id, 'application.info_requested', 'More information requested for your artist application',
      coalesce(nullif(trim(coalesce(p_message, '')), ''), array_to_string(p_items, ', ')), '/artist/application');

  elsif p_action in ('approve', 'reject') then
    if v_app.status not in ('submitted', 'under_review') then raise exception 'This application is not awaiting a decision.'; end if;
    if p_action = 'reject' and coalesce(trim(p_internal), '') = '' then
      raise exception 'An internal reason is required to reject.';
    end if;
    if p_action = 'approve' then
      perform approve_artist_application(v_app.artist_id, null);
    else
      perform reject_artist_application(v_app.artist_id, nullif(trim(coalesce(p_message, '')), ''));
    end if;
    update artist_applications set status = case when p_action = 'approve' then 'approved' else 'rejected' end,
      decided_at = now(), public_message = nullif(trim(coalesce(p_message, '')), '')
      where id = p_id returning * into v_app;
  else
    raise exception 'Unknown action.';
  end if;

  if coalesce(trim(p_internal), '') <> '' then
    insert into application_reviews (source_table, source_id, notes)
    values ('artist_applications', p_id, trim(p_internal))
    on conflict (source_table, source_id) do update
      set notes = concat_ws(E'\n\n', application_reviews.notes, excluded.notes), updated_by = auth.uid(), updated_at = now();
  end if;
  perform audit_write('application.' || p_action, 'artist_application', p_id::text,
    jsonb_build_object('artist', v_name, 'items', p_items));
  return v_app;
end;
$$;

-- A decision made from the generic Applications screen keeps the application in step.
create or replace function sync_artist_application_status()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.status is distinct from old.status and new.status in ('approved', 'rejected') then
    perform set_config('tangy.application_rpc', 'on', true);
    update artist_applications set status = new.status::text, decided_at = coalesce(decided_at, now())
      where artist_id = new.id and status in ('submitted', 'under_review');
  end if;
  return new;
end;
$$;
create trigger artists_sync_application after update of status on artists for each row execute function sync_artist_application_status();

-- ===========================================================================
-- 4. ARTIST PROFILE
-- ===========================================================================
alter table artists
  add column if not exists cover_url text check (cover_url is null or cover_url ~ '^(/|https://)\S+$'),
  add column if not exists long_bio text check (long_bio is null or length(long_bio) <= 6000),
  add column if not exists country text,
  add column if not exists languages text[] not null default '{}',
  add column if not exists instruments text[] not null default '{}',
  add column if not exists genres text[] not null default '{}',
  add column if not exists years_active int check (years_active is null or years_active between 0 and 80),
  add column if not exists performance_count int check (performance_count is null or performance_count >= 0),
  add column if not exists website text,
  add column if not exists highlights text check (highlights is null or length(highlights) <= 4000),
  add column if not exists notable_venues text[] not null default '{}',
  add column if not exists audience_metrics jsonb check (audience_metrics is null or jsonb_typeof(audience_metrics) = 'object');
comment on column artists.audience_metrics is 'Self-reported by the artist ({instagram_followers, spotify_monthly_listeners, youtube_subscribers, updated_at}); never verified.';

alter table artist_private_profiles
  add column if not exists legal_name text,
  add column if not exists whatsapp text,
  add column if not exists manager_name text,
  add column if not exists manager_contact text,
  add column if not exists booking_email text,
  add column if not exists travel_origin text,
  add column if not exists travelling_members int check (travelling_members is null or travelling_members between 0 and 50),
  add column if not exists hospitality_notes text,
  add column if not exists payment_details_status text check (payment_details_status is null or payment_details_status in ('not_started', 'submitted', 'verified'));

-- Public view: 0028's columns, then the new public profile fields.
create or replace view public_artists as
  select id, name, stage_name, genre, subgenre, city, bio, avatar_url, instagram, soundcloud, spotify, youtube,
         performance_type, applied_at, slug,
         cover_url, long_bio, country, languages, instruments, genres, years_active, website, highlights
  from artists
  where status = 'approved'::application_status;
grant select on public_artists to anon, authenticated;

-- ===========================================================================
-- 5. BOOKING REQUESTS
-- ===========================================================================
alter table assignment_requests
  add column if not exists performance_type text,
  add column if not exists set_minutes int check (set_minutes is null or set_minutes between 5 and 600),
  add column if not exists sets_count int check (sets_count is null or sets_count between 1 and 10),
  add column if not exists call_time timestamptz,
  add column if not exists soundcheck_at timestamptz,
  add column if not exists technical_notes text check (technical_notes is null or length(technical_notes) <= 2000),
  add column if not exists hospitality_notes text check (hospitality_notes is null or length(hospitality_notes) <= 2000),
  add column if not exists viewed_at timestamptz,
  add column if not exists confirmed_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists cancel_reason text check (cancel_reason is null or length(cancel_reason) <= 1000);

drop index if exists assignment_requests_active_unique;
create unique index assignment_requests_active_unique on assignment_requests (session_id, artist_id)
  where status in ('draft', 'pending', 'accepted', 'confirmed');

-- Drafts are the team's; the artist sees requests once sent.
drop policy if exists "assignment_requests: artist read own" on assignment_requests;
create policy "assignment_requests: artist read own" on assignment_requests for select
  using (status <> 'draft' and exists (select 1 from artists a where a.id = artist_id and a.user_id = auth.uid()));

-- Create (draft or sent) with the full set of details.
create or replace function create_artist_request(p_event_id uuid, p_artist_id uuid, p_details jsonb default '{}'::jsonb, p_send boolean default true)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
  d jsonb := coalesce(p_details, '{}'::jsonb);
begin
  if not has_permission('events.manage') then
    raise exception 'You do not have permission to send booking requests.' using errcode = '42501';
  end if;
  if not exists (select 1 from artists where id = p_artist_id and status = 'approved' and user_id is not null) then
    raise exception 'Booking requests can only go to approved artists with an account.';
  end if;
  if exists (select 1 from events where id = p_event_id and status = 'cancelled') then
    raise exception 'This event is cancelled.';
  end if;
  if (d ->> 'proposed_end') is not null and (d ->> 'proposed_start') is not null and (d ->> 'proposed_end')::timestamptz <= (d ->> 'proposed_start')::timestamptz then
    raise exception 'The set must end after it starts.';
  end if;
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

-- The team: send a draft, confirm an accepted request, cancel, mark completed.
create or replace function manage_artist_request(p_id uuid, p_action text, p_reason text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_req assignment_requests%rowtype;
begin
  if not has_permission('events.manage') then
    raise exception 'You do not have permission to manage booking requests.' using errcode = '42501';
  end if;
  select * into v_req from assignment_requests where id = p_id for update;
  if v_req.id is null then raise exception 'Request not found.'; end if;
  if p_action = 'send' then
    if v_req.status <> 'draft' then raise exception 'Only a draft can be sent.'; end if;
    update assignment_requests set status = 'pending', created_at = now() where id = p_id;
  elsif p_action = 'confirm' then
    if v_req.status <> 'accepted' then raise exception 'Only an accepted request can be confirmed.'; end if;
    update assignment_requests set status = 'confirmed', confirmed_at = now() where id = p_id;
    insert into event_artist_details (event_id, artist_id, call_time, soundcheck_at, performance_start, performance_end, fee_amount)
    values (v_req.session_id, v_req.artist_id, v_req.call_time, v_req.soundcheck_at, v_req.proposed_start, v_req.proposed_end, v_req.fee_offer)
    on conflict (event_id, artist_id) do update
      set call_time = coalesce(excluded.call_time, event_artist_details.call_time),
          soundcheck_at = coalesce(excluded.soundcheck_at, event_artist_details.soundcheck_at),
          performance_start = coalesce(excluded.performance_start, event_artist_details.performance_start),
          performance_end = coalesce(excluded.performance_end, event_artist_details.performance_end),
          fee_amount = coalesce(event_artist_details.fee_amount, excluded.fee_amount);
  elsif p_action = 'cancel' then
    if v_req.status not in ('draft', 'pending', 'accepted', 'confirmed') then raise exception 'This request can no longer be cancelled.'; end if;
    update assignment_requests set status = 'cancelled', cancel_reason = nullif(trim(coalesce(p_reason, '')), '') where id = p_id;
    if v_req.status in ('accepted', 'confirmed') then
      delete from event_artists where event_id = v_req.session_id and artist_id = v_req.artist_id;
    end if;
  elsif p_action = 'complete' then
    if v_req.status not in ('accepted', 'confirmed') then raise exception 'Only a confirmed request can be completed.'; end if;
    -- "Today" is the event's own calendar day (the database clock is UTC).
    if (select event_date > (now() at time zone coalesce(timezone, 'Asia/Kolkata'))::date from events where id = v_req.session_id) then
      raise exception 'The session has not happened yet.';
    end if;
    update assignment_requests set status = 'completed', completed_at = now() where id = p_id;
  else
    raise exception 'Unknown action.';
  end if;
  perform audit_write('booking.request_' || p_action, 'booking_request', p_id::text, jsonb_build_object('reason', p_reason));
end;
$$;

-- The artist opened a sent request.
create or replace function mark_artist_request_viewed(p_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  update assignment_requests r set viewed_at = now()
  where r.id = p_id and r.viewed_at is null and r.status = 'pending'
    and exists (select 1 from artists a where a.id = r.artist_id and a.user_id = auth.uid());
end;
$$;

-- Before sending: the artist's availability that day and their other sessions.
create or replace function artist_schedule_check(p_artist_id uuid, p_date date)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
begin
  if not (has_permission('events.manage') or has_permission('entities.manage')) then
    raise exception 'You do not have permission to see artist schedules.' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'availability', (select jsonb_build_object('status', status, 'note', note, 'start_time', start_time, 'end_time', end_time)
                     from artist_availability where artist_id = p_artist_id and date = p_date),
    'sessions', coalesce((select jsonb_agg(jsonb_build_object('event_id', e.id, 'name', e.name, 'status', x.status))
                          from (select ea.event_id, 'booked' as status from event_artists ea where ea.artist_id = p_artist_id
                                union select r.session_id, r.status::text from assignment_requests r
                                  where r.artist_id = p_artist_id and r.status in ('pending', 'accepted', 'confirmed')) x
                          join events e on e.id = x.event_id and e.event_date = p_date and e.status <> 'cancelled'), '[]'::jsonb));
end;
$$;

-- Notifications: drafts are silent; sending, confirming and cancelling tell the artist.
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
    elsif new.status = 'cancelled' and old.status <> 'draft' then
      perform notify(v_user, 'booking.cancelled', 'Cancelled: ' || v_event.name, new.cancel_reason, '/artist/requests/' || new.id, new.session_id);
    end if;
  end if;
  return new;
end;
$$;

-- ===========================================================================
-- 6/7. MEDIA METADATA
-- ===========================================================================
alter table artist_media
  add column if not exists description text check (description is null or length(description) <= 1000),
  add column if not exists tags text[] not null default '{}',
  add column if not exists taken_on date,
  add column if not exists event_id uuid references events(id) on delete set null,
  add column if not exists kind text check (kind is null or kind in ('photo', 'video', 'recording', 'press', 'poster')),
  add column if not exists performance_type text;

-- Application uploads (performance video, photos, EPK, rider) before an
-- artist record exists: artist-media/applications/<user id>/…, private to the
-- applicant and application reviewers.
create policy "artist-media: applicant read" on storage.objects for select to authenticated
  using (bucket_id = 'artist-media' and (storage.foldername(name))[1] = 'applications' and (storage.foldername(name))[2] = auth.uid()::text);
create policy "artist-media: applicant upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'artist-media' and (storage.foldername(name))[1] = 'applications' and (storage.foldername(name))[2] = auth.uid()::text);
create policy "artist-media: applicant delete" on storage.objects for delete to authenticated
  using (bucket_id = 'artist-media' and (storage.foldername(name))[1] = 'applications' and (storage.foldername(name))[2] = auth.uid()::text);
create policy "artist-media: reviewers read applications" on storage.objects for select to authenticated
  using (bucket_id = 'artist-media' and (storage.foldername(name))[1] = 'applications' and public.has_permission('applications.view'));

-- ===========================================================================
-- 8. PRIVATE DOCUMENTS
-- ===========================================================================
create table if not exists artist_documents (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references artists(id) on delete cascade,
  kind text not null check (kind in ('rider', 'epk', 'tax', 'payment', 'identity', 'other')),
  title text not null check (length(trim(title)) between 1 and 160),
  storage_path text not null check (length(storage_path) <= 400),
  file_name text,
  file_size_bytes bigint check (file_size_bytes is null or file_size_bytes between 1 and 26214400),
  created_at timestamptz not null default now()
);
create index if not exists artist_documents_artist_idx on artist_documents (artist_id, created_at desc);
alter table artist_documents enable row level security;
create policy "artist_documents: own" on artist_documents for all
  using (exists (select 1 from artists a where a.id = artist_id and a.user_id = auth.uid()))
  with check (exists (select 1 from artists a where a.id = artist_id and a.user_id = auth.uid()));
create policy "artist_documents: team read" on artist_documents for select using (has_permission('entities.manage'));
grant select, insert, delete on artist_documents to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('artist-documents', 'artist-documents', false, 26214400,
        array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Files live under <artist id>/…
create policy "artist-documents: own read" on storage.objects for select to authenticated
  using (bucket_id = 'artist-documents' and exists (select 1 from public.artists a where a.id::text = (storage.foldername(name))[1] and a.user_id = auth.uid()));
create policy "artist-documents: own upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'artist-documents' and exists (select 1 from public.artists a where a.id::text = (storage.foldername(name))[1] and a.user_id = auth.uid()));
create policy "artist-documents: own delete" on storage.objects for delete to authenticated
  using (bucket_id = 'artist-documents' and exists (select 1 from public.artists a where a.id::text = (storage.foldername(name))[1] and a.user_id = auth.uid()));
create policy "artist-documents: team read" on storage.objects for select to authenticated
  using (bucket_id = 'artist-documents' and public.has_permission('entities.manage'));


-- The artist's request list: never drafts, with the new details.
drop function if exists my_booking_requests();
create function my_booking_requests()
returns table (id uuid, status text, event_id uuid, event_name text, event_date date, event_time text, venue text,
               message text, proposed_start timestamptz, proposed_end timestamptz, fee_offer integer,
               expires_at timestamptz, created_at timestamptz, responded_at timestamptz, decline_reason text,
               conversation_id uuid, requested_by_name text,
               performance_type text, set_minutes int, sets_count int, call_time timestamptz, soundcheck_at timestamptz,
               technical_notes text, hospitality_notes text, viewed_at timestamptz, confirmed_at timestamptz, cancel_reason text,
               venue_city text)
language plpgsql security definer set search_path = public
as $$
begin
  perform expire_booking_requests();
  return query
  select r.id, r.status::text, e.id, e.name, e.event_date, e.event_time, coalesce(v.name, e.venue),
         r.message, r.proposed_start, r.proposed_end, r.fee_offer, r.expires_at, r.created_at, r.responded_at,
         r.decline_reason, r.conversation_id, coalesce(p.full_name, 'Tangy team'),
         r.performance_type, r.set_minutes, r.sets_count, r.call_time, r.soundcheck_at,
         r.technical_notes, r.hospitality_notes, r.viewed_at, r.confirmed_at, r.cancel_reason, v.city
  from assignment_requests r
  join artists a on a.id = r.artist_id and a.user_id = auth.uid()
  join events e on e.id = r.session_id
  left join venues v on v.id = e.venue_id
  left join profiles p on p.id = r.requested_by
  where r.status <> 'draft'
  order by (r.status = 'pending') desc, r.created_at desc
  limit 200;
end;
$$;
revoke all on function my_booking_requests() from public, anon;
grant execute on function my_booking_requests() to authenticated;

-- Profile completion: 0020's checks plus the portal's new profile fields.
create or replace function artist_profile_completion(p_artist_id uuid default null)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  a artists%rowtype;
  p artist_private_profiles%rowtype;
  v_checks jsonb;
  v_done int := 0;
  v_total int := 0;
  v_missing jsonb := '[]'::jsonb;
  k text;
  ok boolean;
begin
  if p_artist_id is null then
    select * into a from artists where user_id = auth.uid() order by applied_at desc limit 1;
  else
    select * into a from artists where id = p_artist_id;
  end if;
  if a.id is null then
    return null;
  end if;
  if a.user_id is distinct from auth.uid() and not (has_permission('entities.manage') or has_permission('events.view_all')) then
    raise exception 'You do not have access to this artist.';
  end if;
  select * into p from artist_private_profiles where artist_id = a.id;
  v_checks := jsonb_build_object(
    'Name', coalesce(trim(a.name), '') <> '',
    'Stage name', coalesce(trim(a.stage_name), '') <> '',
    'Bio', length(coalesce(trim(a.bio), '')) >= 40,
    'Long bio', length(coalesce(trim(a.long_bio), '')) >= 120,
    'Genre', coalesce(trim(a.genre), '') <> '',
    'Instruments', cardinality(a.instruments) > 0,
    'Languages', cardinality(a.languages) > 0,
    'City', coalesce(trim(a.city), '') <> '',
    'Phone', coalesce(trim(p.phone), '') <> '',
    'Email', coalesce(trim(a.email), '') <> '',
    'Profile photo', coalesce(trim(a.avatar_url), '') <> '',
    'Instagram', coalesce(trim(a.instagram), '') <> '',
    'Spotify', coalesce(trim(a.spotify), '') <> '',
    'YouTube', coalesce(trim(a.youtube), '') <> '',
    'Performance video', exists (select 1 from artist_media m where m.artist_id = a.id and (m.kind in ('video', 'recording') or m.media_type like 'video%'))
                         or exists (select 1 from artist_applications ap where ap.artist_id = a.id and (ap.video_url is not null or ap.video_storage_path is not null)),
    'Media upload', exists (select 1 from artist_media m where m.artist_id = a.id),
    'Technical rider', coalesce(trim(p.technical_rider), '') <> '' or exists (select 1 from artist_documents d where d.artist_id = a.id and d.kind = 'rider'),
    'Hospitality requirements', coalesce(trim(p.food_preferences), '') <> '' or coalesce(trim(p.accommodation), '') <> '' or coalesce(trim(p.hospitality_notes), '') <> '',
    'Availability', exists (select 1 from artist_availability av where av.artist_id = a.id)
  );
  for k, ok in select key, value::boolean from jsonb_each_text(v_checks) loop
    v_total := v_total + 1;
    if ok then v_done := v_done + 1; else v_missing := v_missing || to_jsonb(k); end if;
  end loop;
  return jsonb_build_object('artist_id', a.id, 'percent', round(100.0 * v_done / v_total), 'done', v_done, 'total', v_total, 'missing', v_missing);
end;
$$;

-- ===========================================================================
-- Grants
-- ===========================================================================
revoke all on function submit_artist_application(), withdraw_artist_application(),
  review_artist_application(uuid, text, text[], text, text), create_artist_request(uuid, uuid, jsonb, boolean),
  manage_artist_request(uuid, text, text), mark_artist_request_viewed(uuid), artist_schedule_check(uuid, date),
  set_artist_availability(date, date, text, text, time, time) from public, anon;
grant execute on function submit_artist_application(), withdraw_artist_application(),
  review_artist_application(uuid, text, text[], text, text), create_artist_request(uuid, uuid, jsonb, boolean),
  manage_artist_request(uuid, text, text), mark_artist_request_viewed(uuid), artist_schedule_check(uuid, date),
  set_artist_availability(date, date, text, text, time, time) to authenticated;
