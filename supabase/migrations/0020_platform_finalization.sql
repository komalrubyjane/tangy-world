-- Tangy Sessions — platform finalization.
--
-- Builds on 0017/0018 (and 0019's enum values). Additive: no historical
-- migration is modified, no existing row is deleted. Reverse with
-- supabase/rollbacks/0020_platform_finalization.down.sql.
--
--  1. Settings           booking hold, reminder lead time, request expiry
--  2. Events             explicit timezone, doors time
--  3. Artist profile     private profile fields (never public), admin-only
--                        notes, real profile completion, public_artists view
--                        (closes the public read of artist email)
--  4. Artist logistics   structured hospitality / travel / schedule points
--  5. Media curation     type, status workflow, review — artists can't approve
--  6. Booking requests   proposed slot, deadline, expiry, notifications
--  7. Requirements       priority, close, attachments, re-submission
--  8. Documents          categories, descriptions, expiry, private storage
--  9. Sponsor assets     brand asset uploads + review, sponsorship package
-- 10. Vendor / venue     setup, breakdown, loading & venue access, contacts
-- 11. Volunteer teams    event-scoped teams + team-targeted announcements
-- 12. Tasks             event-level tasks, blocked/urgent, completion trail
-- 13. Invoices           partner invoices (own-only visibility)
-- 14. Notifications      categories, priorities, per-user preferences,
--                        email outbox, schedule/document/request triggers
-- 15. Messaging          conversation priority, assignment
-- 16. Bookings           server-side expiry of stale pending checkouts,
--                        payment states, late-payment reconciliation
-- 17. Event health       explicit, rule-based readiness
-- 18. Operations         command center overview, global search
-- 19. Scheduling         pg_cron jobs when the extension is available

-- ===========================================================================
-- 1. SETTINGS
-- ===========================================================================

insert into system_settings (key, value, value_type, category, label, description, exposed) values
  ('bookings.pending_timeout_minutes', '30', 'integer', 'Bookings', 'Checkout hold (minutes)',
   'How long an unpaid checkout holds its tickets before it expires and the seats are released.', true),
  ('notifications.event_reminder_hours', '24', 'integer', 'Notifications', 'Event reminder lead time (hours)',
   'Artists and partners get a reminder this many hours before their event.', true),
  ('artists.request_default_days', '7', 'integer', 'Event defaults', 'Booking request deadline (days)',
   'Default number of days an artist has to answer a booking request.', true)
on conflict (key) do nothing;

create or replace function setting_number(p_key text, p_default numeric)
returns numeric
language sql stable security definer set search_path = public
as $$
  select coalesce((select (value #>> '{}')::numeric from system_settings where key = p_key), p_default);
$$;

-- ===========================================================================
-- 2. EVENTS — explicit timezone and doors
-- ===========================================================================

alter table events
  add column if not exists timezone text not null default 'Asia/Kolkata',
  add column if not exists doors_at timestamptz;

create or replace function validate_event_timezone()
returns trigger
language plpgsql
as $$
begin
  if not exists (select 1 from pg_timezone_names where name = new.timezone) then
    raise exception 'Unknown timezone "%". Use an IANA name such as Asia/Kolkata.', new.timezone;
  end if;
  return new;
end;
$$;
drop trigger if exists events_validate_timezone on events;
create trigger events_validate_timezone before insert or update of timezone on events
  for each row execute function validate_event_timezone();

-- ===========================================================================
-- 3. ARTIST PROFILE
-- ===========================================================================

-- Public-facing profile additions live on artists (they are meant to be public).
alter table artists
  add column if not exists stage_name text,
  add column if not exists subgenre text,
  add column if not exists youtube text,
  add column if not exists performance_type text;

-- Everything personal/operational lives in a private 1:1 table — never readable publicly.
create table if not exists artist_private_profiles (
  artist_id uuid primary key references artists(id) on delete cascade,
  phone text check (phone is null or length(phone) <= 30),
  set_duration_minutes integer check (set_duration_minutes is null or set_duration_minutes between 5 and 600),
  technical_rider text check (technical_rider is null or length(technical_rider) <= 6000),
  equipment text check (equipment is null or length(equipment) <= 2000),
  inputs text check (inputs is null or length(inputs) <= 2000),
  microphones text check (microphones is null or length(microphones) <= 2000),
  backline text check (backline is null or length(backline) <= 2000),
  food_preferences text check (food_preferences is null or length(food_preferences) <= 1000),
  dietary_restrictions text check (dietary_restrictions is null or length(dietary_restrictions) <= 1000),
  green_room text check (green_room is null or length(green_room) <= 1000),
  accommodation text check (accommodation is null or length(accommodation) <= 1000),
  travel_preferences text check (travel_preferences is null or length(travel_preferences) <= 1000),
  updated_at timestamptz not null default now()
);
create trigger artist_private_profiles_set_updated_at before update on artist_private_profiles
  for each row execute function set_updated_at();
alter table artist_private_profiles enable row level security;
create policy "artist_private_profiles: own" on artist_private_profiles for all
  using (exists (select 1 from artists a where a.id = artist_id and a.user_id = auth.uid()))
  with check (exists (select 1 from artists a where a.id = artist_id and a.user_id = auth.uid()));
create policy "artist_private_profiles: partner managers read" on artist_private_profiles for select
  using (has_permission('entities.manage') or has_permission('events.manage'));

-- Admin-only commercial notes. Artists can never read this table.
create table if not exists artist_admin_notes (
  artist_id uuid primary key references artists(id) on delete cascade,
  internal_notes text check (internal_notes is null or length(internal_notes) <= 6000),
  default_fee integer check (default_fee is null or default_fee >= 0),
  contract_status text not null default 'none' check (contract_status in ('none', 'sent', 'signed', 'expired')),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_at timestamptz not null default now()
);
create trigger artist_admin_notes_set_updated_at before update on artist_admin_notes
  for each row execute function set_updated_at();
create trigger artist_admin_notes_audit after insert or update or delete on artist_admin_notes
  for each row execute function audit_row_change('artist_admin_notes');
alter table artist_admin_notes enable row level security;
create policy "artist_admin_notes: partner managers" on artist_admin_notes for all
  using (has_permission('entities.manage')) with check (has_permission('entities.manage'));

-- SECURITY FIX: "artists: public read approved" returned every column
-- (including email) to anonymous visitors. The public directory now reads
-- this view of explicitly public columns; the base table is readable only
-- by the artist themself and by console roles (existing policies).
drop policy if exists "artists: public read approved" on artists;
create or replace view public_artists as
  select id, name, stage_name, genre, subgenre, city, bio, avatar_url, instagram, soundcloud, spotify, youtube,
         performance_type, applied_at
  from artists
  where status = 'approved';
grant select on public_artists to anon, authenticated;

-- Admin console reads approved artists through the base table (is_admin policy);
-- partner managers need it too.
drop policy if exists "artists: partner managers read" on artists;
create policy "artists: partner managers read" on artists for select
  using (has_permission('entities.manage') or has_permission('events.view_all'));

-- Real profile completion — the same defined fields for every artist.
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
    'Genre', coalesce(trim(a.genre), '') <> '',
    'City', coalesce(trim(a.city), '') <> '',
    'Phone', coalesce(trim(p.phone), '') <> '',
    'Email', coalesce(trim(a.email), '') <> '',
    'Profile photo', coalesce(trim(a.avatar_url), '') <> '',
    'Instagram', coalesce(trim(a.instagram), '') <> '',
    'Spotify', coalesce(trim(a.spotify), '') <> '',
    'SoundCloud', coalesce(trim(a.soundcloud), '') <> '',
    'Media upload', exists (select 1 from artist_media m where m.artist_id = a.id),
    'Technical requirements', coalesce(trim(p.technical_rider), '') <> '',
    'Hospitality requirements', coalesce(trim(p.food_preferences), '') <> '' or coalesce(trim(p.accommodation), '') <> '',
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
-- 4. ARTIST LOGISTICS — structured schedule / hospitality / travel
-- ===========================================================================

alter table event_artist_details
  add column if not exists wrap_at timestamptz,
  add column if not exists accommodation text,
  add column if not exists meals text,
  add column if not exists green_room text,
  add column if not exists rider_notes text,
  add column if not exists pickup text,
  add column if not exists dropoff text,
  add column if not exists hotel text,
  add column if not exists transport_notes text;

-- ===========================================================================
-- 5. MEDIA CURATION
-- ===========================================================================

alter table artist_media
  add column if not exists media_type text not null default 'demo',
  add column if not exists mime_type text,
  add column if not exists title text,
  add column if not exists review_note text,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz;
alter table artist_media drop constraint if exists artist_media_media_type_check;
alter table artist_media add constraint artist_media_media_type_check
  check (media_type in ('audio', 'video', 'image', 'press_kit', 'live_set', 'demo'));
-- Existing 'pending_review' rows become the explicit 'under_review'.
alter table artist_media drop constraint if exists artist_media_status_check;
update artist_media set status = 'under_review' where status not in ('uploaded', 'under_review', 'approved', 'rejected', 'archived');
alter table artist_media alter column status set default 'uploaded';
alter table artist_media add constraint artist_media_status_check
  check (status in ('uploaded', 'under_review', 'approved', 'rejected', 'archived'));

-- Artists may submit their own media for review or archive it; only curators
-- (entities.manage) can approve/reject and write review notes.
create or replace function guard_artist_media()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if has_permission('entities.manage') or coalesce(auth.role(), '') not in ('authenticated', 'anon') then
    if new.status is distinct from old.status and new.status in ('approved', 'rejected') then
      new.reviewed_by := auth.uid();
      new.reviewed_at := now();
    end if;
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.status not in ('uploaded', 'under_review') then
      raise exception 'New media starts as uploaded or under review.';
    end if;
    new.review_note := null; new.reviewed_by := null; new.reviewed_at := null;
    return new;
  end if;
  if new.review_note is distinct from old.review_note or new.reviewed_by is distinct from old.reviewed_by
     or new.reviewed_at is distinct from old.reviewed_at or new.artist_id is distinct from old.artist_id
     or new.storage_path is distinct from old.storage_path then
    raise exception 'Only Tangy curators can review media.';
  end if;
  if new.status is distinct from old.status and not (
       (old.status in ('uploaded', 'rejected') and new.status = 'under_review')
    or (new.status = 'archived')
    or (old.status = 'archived' and new.status = 'uploaded')) then
    raise exception 'You can submit media for review or archive it; approval is done by Tangy.';
  end if;
  return new;
end;
$$;
drop trigger if exists artist_media_guard on artist_media;
create trigger artist_media_guard before insert or update on artist_media
  for each row execute function guard_artist_media();
-- Supersedes 0013's trigger, which only allowed 'pending' for artists (the new
-- guard keeps its intent — no self-approval — with the explicit workflow).
drop trigger if exists guard_artist_media_status on artist_media;

-- Artists keep their 0013 "self manage" policy; the guard above limits what they can change.
drop policy if exists "artist_media: curators" on artist_media;
create policy "artist_media: curators" on artist_media for all
  using (has_permission('entities.manage')) with check (has_permission('entities.manage'));

-- ===========================================================================
-- 6. BOOKING REQUESTS (assignment_requests)
-- ===========================================================================

alter table assignment_requests
  add column if not exists proposed_start timestamptz,
  add column if not exists proposed_end timestamptz,
  add column if not exists fee_offer integer check (fee_offer is null or fee_offer >= 0),
  add column if not exists expires_at timestamptz,
  add column if not exists decline_reason text check (decline_reason is null or length(decline_reason) <= 1000);

drop policy if exists "assignment_requests: artist read own" on assignment_requests;
create policy "assignment_requests: artist read own" on assignment_requests for select
  using (exists (select 1 from artists a where a.id = artist_id and a.user_id = auth.uid()));

-- FIX: 0008's version assigned a text CASE to the assignment_status column
-- without a cast, so accepting/declining a request always failed.
create or replace function respond_to_assignment_request(p_request_id uuid, p_accept boolean)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_req assignment_requests%rowtype;
begin
  select * into v_req from assignment_requests where id = p_request_id;
  if v_req.id is null then
    raise exception 'Assignment request not found.';
  end if;
  if v_req.status <> 'pending' then
    raise exception 'This request has already been responded to.';
  end if;
  if not exists (select 1 from artists where id = v_req.artist_id and user_id = auth.uid()) then
    raise exception 'Not authorized to respond to this request.';
  end if;

  update assignment_requests
    set status = (case when p_accept then 'accepted' else 'declined' end)::assignment_status,
        responded_at = now()
    where id = p_request_id;

  if p_accept then
    insert into event_artists (event_id, artist_id) values (v_req.session_id, v_req.artist_id)
      on conflict do nothing;
  end if;

  if v_req.conversation_id is not null then
    insert into messages (conversation_id, sender_id, content, message_type)
      values (v_req.conversation_id, auth.uid(),
        case when p_accept then 'Accepted the assignment request.' else 'Declined the assignment request.' end,
        'system');
  end if;
end;
$$;

create or replace function create_booking_request(
  p_event_id uuid, p_artist_id uuid, p_message text default null,
  p_proposed_start timestamptz default null, p_proposed_end timestamptz default null,
  p_fee_offer integer default null, p_expires_at timestamptz default null)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
begin
  if not has_permission('events.manage') then
    raise exception 'You do not have permission to send booking requests.';
  end if;
  if not exists (select 1 from artists where id = p_artist_id and status = 'approved' and user_id is not null) then
    raise exception 'Booking requests can only go to approved artists with an account.';
  end if;
  if exists (select 1 from events where id = p_event_id and status = 'cancelled') then
    raise exception 'This event is cancelled.';
  end if;
  if p_proposed_end is not null and p_proposed_start is not null and p_proposed_end <= p_proposed_start then
    raise exception 'The proposed set must end after it starts.';
  end if;
  v_id := create_assignment_request(p_event_id, p_artist_id, p_message);
  update assignment_requests
    set proposed_start = p_proposed_start, proposed_end = p_proposed_end, fee_offer = p_fee_offer,
        expires_at = coalesce(p_expires_at, now() + make_interval(days => setting_number('artists.request_default_days', 7)::int))
    where id = v_id;
  return v_id;
end;
$$;

-- Accept / decline (with reason). Replaces the 0008 function's behaviour for
-- expired requests and records the proposed slot as the artist's logistics.
create or replace function respond_to_booking_request(p_request_id uuid, p_accept boolean, p_reason text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_req assignment_requests%rowtype;
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
  perform respond_to_assignment_request(p_request_id, p_accept);
  update assignment_requests set decline_reason = case when p_accept then null else nullif(trim(coalesce(p_reason, '')), '') end
    where id = p_request_id;
  if p_accept and v_req.proposed_start is not null then
    insert into event_artist_details (event_id, artist_id, performance_start, performance_end)
    values (v_req.session_id, v_req.artist_id, v_req.proposed_start, v_req.proposed_end)
    on conflict (event_id, artist_id) do update
      set performance_start = coalesce(event_artist_details.performance_start, excluded.performance_start),
          performance_end = coalesce(event_artist_details.performance_end, excluded.performance_end);
  end if;
end;
$$;

create or replace function expire_booking_requests()
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_n int;
begin
  update assignment_requests set status = 'expired', updated_at = now()
    where status = 'pending' and expires_at is not null and expires_at <= now();
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;
revoke execute on function expire_booking_requests() from public, anon, authenticated;

create or replace function my_booking_requests()
returns table (id uuid, status text, event_id uuid, event_name text, event_date date, event_time text, venue text,
               message text, proposed_start timestamptz, proposed_end timestamptz, fee_offer integer,
               expires_at timestamptz, created_at timestamptz, responded_at timestamptz, decline_reason text,
               conversation_id uuid, requested_by_name text)
language plpgsql security definer set search_path = public
as $$
begin
  perform expire_booking_requests();
  return query
  select r.id, r.status::text, e.id, e.name, e.event_date, e.event_time, coalesce(v.name, e.venue),
         r.message, r.proposed_start, r.proposed_end, r.fee_offer, r.expires_at, r.created_at, r.responded_at,
         r.decline_reason, r.conversation_id, coalesce(p.full_name, 'Tangy team')
  from assignment_requests r
  join artists a on a.id = r.artist_id and a.user_id = auth.uid()
  join events e on e.id = r.session_id
  left join venues v on v.id = e.venue_id
  left join profiles p on p.id = r.requested_by
  order by (r.status = 'pending') desc, r.created_at desc
  limit 200;
end;
$$;

-- ===========================================================================
-- 7. REQUIREMENTS — priority, close, attachments
-- ===========================================================================

alter table event_requirements
  add column if not exists priority text not null default 'normal',
  add column if not exists attachment_path text,
  add column if not exists closed_at timestamptz,
  add column if not exists closed_by uuid references auth.users(id) on delete set null;
alter table event_requirements drop constraint if exists event_requirements_priority_check;
alter table event_requirements add constraint event_requirements_priority_check check (priority in ('low', 'normal', 'high', 'urgent'));
alter table event_requirements drop constraint if exists event_requirements_status_check;
alter table event_requirements add constraint event_requirements_status_check
  check (status in ('requested', 'submitted', 'accepted', 'changes_requested', 'closed'));

-- Answer (or re-answer after "changes requested"), optionally with a file the
-- member uploaded to their own requirement folder in the private bucket.
create or replace function submit_requirement(p_id uuid, p_response text, p_attachment_path text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_req event_requirements%rowtype;
begin
  select * into v_req from event_requirements where id = p_id for update;
  if v_req.id is null or v_req.user_id <> auth.uid() then
    raise exception 'Requirement not found.';
  end if;
  if v_req.status not in ('requested', 'changes_requested') then
    raise exception 'This requirement is not waiting for your response.';
  end if;
  if length(trim(coalesce(p_response, ''))) = 0 and p_attachment_path is null then
    raise exception 'Please add your response or attach a file.';
  end if;
  if p_attachment_path is not null and p_attachment_path not like 'requirements/' || p_id::text || '/%' then
    raise exception 'Attachments must be uploaded to this requirement.';
  end if;
  update event_requirements
    set status = 'submitted', response = nullif(trim(coalesce(p_response, '')), ''), responded_at = now(),
        attachment_path = coalesce(p_attachment_path, attachment_path)
    where id = p_id;
end;
$$;
drop function if exists submit_requirement(uuid, text);

create or replace function close_requirement(p_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not has_permission('events.manage') then
    raise exception 'You do not have permission to close requirements.';
  end if;
  update event_requirements set status = 'closed', closed_at = now(), closed_by = auth.uid()
    where id = p_id and status <> 'closed';
  if not found then
    raise exception 'Requirement not found or already closed.';
  end if;
end;
$$;

-- ===========================================================================
-- 8. DOCUMENTS — categories, expiry, private storage
-- ===========================================================================

alter table event_documents
  add column if not exists description text,
  add column if not exists category text not null default 'other',
  add column if not exists storage_path text,
  add column if not exists file_name text,
  add column if not exists file_size_bytes bigint,
  add column if not exists expires_at timestamptz;
alter table event_documents drop constraint if exists event_documents_category_check;
alter table event_documents add constraint event_documents_category_check
  check (category in ('tech_rider', 'contract', 'event_brief', 'travel', 'hospitality', 'venue', 'schedule', 'other'));
-- A document is either an https link or a private storage object — never both, never neither.
alter table event_documents alter column url drop not null;
alter table event_documents drop constraint if exists event_documents_url_check;
alter table event_documents add constraint event_documents_url_check
  check (url is null or (url ~* '^https://[^\s]+$' and length(url) <= 2000));
alter table event_documents drop constraint if exists event_documents_source_check;
alter table event_documents add constraint event_documents_source_check
  check ((url is not null) <> (storage_path is not null));
alter table event_documents drop constraint if exists event_documents_storage_path_check;
alter table event_documents add constraint event_documents_storage_path_check
  check (storage_path is null or storage_path like 'events/' || event_id::text || '/%');

-- Expired documents disappear for members (managers still see them).
drop policy if exists "event_documents: members read" on event_documents;
create policy "event_documents: members read" on event_documents for select
  using (
    (expires_at is null or expires_at > now()) and (
      (audience = 'user' and user_id = auth.uid())
      or (audience = 'members' and event_member_kind(event_id) is not null)
      or (audience not in ('user', 'members') and event_member_kind(event_id) = audience))
  );

-- Private bucket for event documents and requirement attachments. Objects are
-- only ever served through short-lived signed URLs, and signing requires the
-- storage.objects SELECT policy below — i.e. the same rules as the rows.
insert into storage.buckets (id, name, public, file_size_limit)
values ('event-documents', 'event-documents', false, 26214400)
on conflict (id) do update set public = false;

create or replace function can_read_event_file(p_name text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select has_permission('events.manage')
      or exists (select 1 from event_documents d where d.storage_path = p_name
                   and (d.expires_at is null or d.expires_at > now())
                   and ((d.audience = 'user' and d.user_id = auth.uid())
                        or (d.audience = 'members' and event_member_kind(d.event_id) is not null)
                        or (d.audience not in ('user', 'members') and event_member_kind(d.event_id) = d.audience)))
      or exists (select 1 from event_requirements r where r.user_id = auth.uid()
                   and p_name like 'requirements/' || r.id::text || '/%');
$$;

create or replace function can_write_event_file(p_name text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select (p_name like 'events/%' and has_permission('events.manage'))
      or exists (select 1 from event_requirements r where r.user_id = auth.uid()
                   and r.status in ('requested', 'changes_requested')
                   and p_name like 'requirements/' || r.id::text || '/%');
$$;

drop policy if exists "event-documents: read" on storage.objects;
create policy "event-documents: read" on storage.objects for select to authenticated
  using (bucket_id = 'event-documents' and can_read_event_file(name));
drop policy if exists "event-documents: upload" on storage.objects;
create policy "event-documents: upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'event-documents' and can_write_event_file(name));
drop policy if exists "event-documents: managers delete" on storage.objects;
create policy "event-documents: managers delete" on storage.objects for delete to authenticated
  using (bucket_id = 'event-documents' and has_permission('events.manage'));

-- ===========================================================================
-- 9. SPONSORS — package, deliverable kinds, brand assets
-- ===========================================================================

alter table event_assignments add column if not exists package text check (package is null or length(package) <= 200);
alter table sponsor_deliverables
  add column if not exists kind text not null default 'other',
  add column if not exists completed_at timestamptz,
  add column if not exists proof_url text check (proof_url is null or proof_url ~* '^https://');
alter table sponsor_deliverables drop constraint if exists sponsor_deliverables_kind_check;
alter table sponsor_deliverables add constraint sponsor_deliverables_kind_check
  check (kind in ('logo_placement', 'social_mention', 'event_branding', 'stage_mention', 'sampling', 'other'));
create or replace function stamp_deliverable_completion()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'delivered' and old.status is distinct from 'delivered' then
    new.completed_at := now();
  elsif new.status <> 'delivered' then
    new.completed_at := null;
  end if;
  return new;
end;
$$;
drop trigger if exists sponsor_deliverables_completion on sponsor_deliverables;
create trigger sponsor_deliverables_completion before update of status on sponsor_deliverables
  for each row execute function stamp_deliverable_completion();

create table if not exists sponsor_assets (
  id uuid primary key default gen_random_uuid(),
  sponsor_id uuid not null references profiles(id) on delete cascade,
  event_id uuid references events(id) on delete set null,
  kind text not null default 'logo' check (kind in ('logo', 'guidelines', 'campaign', 'other')),
  title text not null check (length(trim(title)) between 1 and 200),
  storage_path text not null unique check (storage_path like sponsor_id::text || '/%'),
  file_name text,
  file_size_bytes bigint,
  mime_type text,
  status text not null default 'submitted' check (status in ('submitted', 'approved', 'changes_requested', 'archived')),
  review_note text check (review_note is null or length(review_note) <= 1000),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists sponsor_assets_sponsor_idx on sponsor_assets (sponsor_id, created_at desc);
create trigger sponsor_assets_audit after insert or update or delete on sponsor_assets
  for each row execute function audit_row_change('sponsor_asset');
alter table sponsor_assets enable row level security;
create policy "sponsor_assets: own read" on sponsor_assets for select using (sponsor_id = auth.uid());
create policy "sponsor_assets: own submit" on sponsor_assets for insert
  with check (sponsor_id = auth.uid() and status = 'submitted' and review_note is null and reviewed_by is null
              and exists (select 1 from profiles where id = auth.uid() and role = 'sponsor' and is_active));
create policy "sponsor_assets: own delete unreviewed" on sponsor_assets for delete
  using (sponsor_id = auth.uid() and status in ('submitted', 'changes_requested'));
create policy "sponsor_assets: partner managers" on sponsor_assets for all
  using (has_permission('entities.manage')) with check (has_permission('entities.manage'));

insert into storage.buckets (id, name, public, file_size_limit)
values ('sponsor-assets', 'sponsor-assets', false, 26214400)
on conflict (id) do update set public = false;
drop policy if exists "sponsor-assets: own upload" on storage.objects;
create policy "sponsor-assets: own upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'sponsor-assets' and (storage.foldername(name))[1] = auth.uid()::text
              and exists (select 1 from profiles where id = auth.uid() and role = 'sponsor' and is_active));
drop policy if exists "sponsor-assets: read" on storage.objects;
create policy "sponsor-assets: read" on storage.objects for select to authenticated
  using (bucket_id = 'sponsor-assets' and ((storage.foldername(name))[1] = auth.uid()::text or has_permission('entities.manage')));
drop policy if exists "sponsor-assets: delete" on storage.objects;
create policy "sponsor-assets: delete" on storage.objects for delete to authenticated
  using (bucket_id = 'sponsor-assets' and ((storage.foldername(name))[1] = auth.uid()::text or has_permission('entities.manage')));

-- ===========================================================================
-- 10. VENDOR / VENUE OPERATIONS
-- ===========================================================================

alter table event_assignments
  add column if not exists setup_at timestamptz,
  add column if not exists breakdown_at timestamptz,
  add column if not exists loading_access text check (loading_access is null or length(loading_access) <= 1000),
  add column if not exists venue_access text check (venue_access is null or length(venue_access) <= 1000),
  add column if not exists onsite_contact text check (onsite_contact is null or length(onsite_contact) <= 300),
  add column if not exists team text;

alter table venues
  add column if not exists access_info text check (access_info is null or length(access_info) <= 2000),
  add column if not exists parking text check (parking is null or length(parking) <= 1000),
  add column if not exists loading_bay text check (loading_bay is null or length(loading_bay) <= 1000),
  add column if not exists setup_notes text check (setup_notes is null or length(setup_notes) <= 2000),
  add column if not exists map_url text check (map_url is null or map_url ~* '^https://');

-- Venue hosts can read the venue record(s) linked to their events or account.
drop policy if exists "venues: hosts read own" on venues;
create policy "venues: hosts read own" on venues for select
  using (partner_profile_id = auth.uid()
         or exists (select 1 from events e where e.venue_id = venues.id and event_member_kind(e.id) is not null));

-- ===========================================================================
-- 11. VOLUNTEER TEAMS (event-scoped)
-- ===========================================================================

alter table event_assignments drop constraint if exists event_assignments_team_check;
alter table event_assignments add constraint event_assignments_team_check
  check (team is null or team in ('gate', 'hospitality', 'stage', 'registration', 'production', 'runners', 'other'));

alter table announcements add column if not exists target_team text;
alter table announcements drop constraint if exists announcements_target_team_check;
alter table announcements add constraint announcements_target_team_check
  check (target_team is null or (target_team in ('gate', 'hospitality', 'stage', 'registration', 'production', 'runners', 'other')
                                 and event_id is not null));

-- Team notices reach only that event's assignees on that team.
create or replace function can_read_member_announcement(p_audience text, p_event_id uuid, p_team text default null)
returns boolean
language sql stable security definer set search_path = public
as $$
  select case
    when p_event_id is null then
      p_audience in ('sponsor', 'vendor', 'venue', 'volunteer', 'crew', 'artist')
      and p_audience = current_role_name()::text
    when p_team is not null then
      exists (select 1 from event_assignments ea where ea.event_id = p_event_id and ea.assignee_id = auth.uid()
              and ea.team = p_team and ea.status <> 'declined'
              and (p_audience in ('members', 'all') or ea.assignee_role = p_audience))
    else
      coalesce(event_member_kind(p_event_id) in (p_audience)
               or (p_audience in ('members', 'all') and event_member_kind(p_event_id) is not null), false)
  end;
$$;
drop policy if exists "announcements: members read relevant" on announcements;
create policy "announcements: members read relevant" on announcements for select
  using (status = 'published' and publish_at <= now() and (expire_at is null or expire_at > now())
         and can_read_member_announcement(audience, event_id, target_team));
drop function if exists can_read_member_announcement(text, uuid);

drop function if exists portal_announcements(int);
create or replace function portal_announcements(p_limit int default 20)
returns table (id uuid, title text, body text, priority text, audience text, event_id uuid, event_name text,
               target_team text, publish_at timestamptz)
language sql stable security definer set search_path = public
as $$
  select a.id, a.title, a.body, a.priority, a.audience, a.event_id, e.name, a.target_team, a.publish_at
  from announcements a left join events e on e.id = a.event_id
  where a.status = 'published' and a.publish_at <= now() and (a.expire_at is null or a.expire_at > now())
    and can_read_member_announcement(a.audience, a.event_id, a.target_team)
  order by (a.priority = 'high') desc, a.publish_at desc
  limit least(greatest(p_limit, 1), 50);
$$;

-- ===========================================================================
-- 12. TASKS — event-level, blocked/urgent, completion trail
-- ===========================================================================

alter table event_tasks
  add column if not exists event_id uuid references events(id) on delete cascade,
  add column if not exists team text,
  add column if not exists created_by uuid references auth.users(id) on delete set null default auth.uid(),
  add column if not exists completed_by uuid references auth.users(id) on delete set null,
  add column if not exists completed_at timestamptz;
update event_tasks t set event_id = ea.event_id from event_assignments ea where ea.id = t.assignment_id and t.event_id is null;
alter table event_tasks alter column event_id set not null;
alter table event_tasks alter column assignment_id drop not null;
create index if not exists event_tasks_event_idx on event_tasks (event_id, status);
alter table event_tasks drop constraint if exists event_tasks_status_check;
alter table event_tasks add constraint event_tasks_status_check check (status in ('pending', 'in_progress', 'blocked', 'done'));
alter table event_tasks drop constraint if exists event_tasks_priority_check;
alter table event_tasks add constraint event_tasks_priority_check check (priority in ('low', 'normal', 'high', 'urgent'));
alter table event_tasks drop constraint if exists event_tasks_team_check;
alter table event_tasks add constraint event_tasks_team_check
  check (team is null or team in ('gate', 'hospitality', 'stage', 'registration', 'production', 'runners', 'other'));

-- The assignment (when present) must belong to the same event.
create or replace function validate_event_task()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.assignment_id is not null then
    select event_id into new.event_id from event_assignments where id = new.assignment_id;
  end if;
  if new.event_id is null then
    raise exception 'A task must belong to an event.';
  end if;
  if new.status = 'done' and (tg_op = 'INSERT' or old.status is distinct from 'done') then
    new.completed_at := now();
    new.completed_by := auth.uid();
  elsif new.status <> 'done' then
    new.completed_at := null;
    new.completed_by := null;
  end if;
  return new;
end;
$$;
drop trigger if exists event_tasks_validate on event_tasks;
create trigger event_tasks_validate before insert or update on event_tasks
  for each row execute function validate_event_task();

-- Assignees may change status only (compared as whole rows — covers new columns).
create or replace function guard_event_task_status()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if is_staff_or_admin() or coalesce(auth.role(), '') not in ('authenticated', 'anon') then
    return new;
  end if;
  if (to_jsonb(new) - 'status' - 'updated_at' - 'completed_at' - 'completed_by')
     is distinct from (to_jsonb(old) - 'status' - 'updated_at' - 'completed_at' - 'completed_by') then
    raise exception 'Only staff/admin can change task details.';
  end if;
  return new;
end;
$$;

create trigger event_tasks_audit after insert or update or delete on event_tasks
  for each row execute function audit_row_change('event_task');

-- ===========================================================================
-- 13. INVOICES
-- ===========================================================================

create table if not exists partner_invoices (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete set null,
  partner_id uuid not null references profiles(id) on delete cascade,
  direction text not null default 'payable' check (direction in ('payable', 'receivable')),
  invoice_number text not null unique check (length(trim(invoice_number)) between 1 and 60),
  amount integer not null check (amount >= 0),
  currency text not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  issued_date date,
  due_date date,
  status text not null default 'draft' check (status in ('draft', 'issued', 'paid', 'void')),
  paid_date date,
  notes text check (notes is null or length(notes) <= 2000),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (due_date is null or issued_date is null or due_date >= issued_date),
  check ((status = 'paid') = (paid_date is not null))
);
create index if not exists partner_invoices_partner_idx on partner_invoices (partner_id, created_at desc);
create trigger partner_invoices_set_updated_at before update on partner_invoices for each row execute function set_updated_at();
create trigger partner_invoices_audit after insert or update or delete on partner_invoices
  for each row execute function audit_row_change('partner_invoice');
alter table partner_invoices enable row level security;
-- Partners only ever see their own issued/paid invoices; drafts stay internal.
create policy "partner_invoices: own read" on partner_invoices for select
  using (partner_id = auth.uid() and status <> 'draft');
create policy "partner_invoices: finance" on partner_invoices for all
  using (has_permission('payments.view') and has_permission('bookings.manage'))
  with check (has_permission('payments.view') and has_permission('bookings.manage'));

-- OVERDUE is derived, never stored, so it can't drift.
create or replace function invoice_state(i partner_invoices)
returns text
language sql stable
as $$
  select case when i.status = 'issued' and i.due_date is not null and i.due_date < current_date then 'overdue' else i.status end;
$$;

-- Staff assigned to an event can see and progress its event-level tasks.
drop policy if exists "event_tasks: event staff read" on event_tasks;
create policy "event_tasks: event staff read" on event_tasks for select
  using (assignment_id is null and has_permission('tasks.view_own') and is_assigned_to_event(event_id));
drop policy if exists "event_tasks: event staff update" on event_tasks;
create policy "event_tasks: event staff update" on event_tasks for update
  using (assignment_id is null and has_permission('tasks.view_own') and is_assigned_to_event(event_id));

-- ===========================================================================
-- 14. NOTIFICATIONS — categories, priorities, preferences, email outbox
-- ===========================================================================

alter table notifications
  add column if not exists category text not null default 'system',
  add column if not exists priority text not null default 'normal';
alter table notifications drop constraint if exists notifications_category_check;
alter table notifications add constraint notifications_category_check
  check (category in ('messages', 'events', 'requirements', 'applications', 'payments', 'tasks', 'system'));
alter table notifications drop constraint if exists notifications_priority_check;
alter table notifications add constraint notifications_priority_check check (priority in ('info', 'normal', 'important', 'urgent'));
create index if not exists notifications_user_category_idx on notifications (user_id, category, created_at desc);

-- One place that knows what each notification type is. `pref` is the
-- preference key a user can switch; `critical` types ignore the in-app switch.
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
    ('assignment.new',          'events',       'event_updates',        'normal',    true,  false),
    ('schedule.changed',        'events',       'schedule_changes',     'important', true,  false),
    ('event.updated',           'events',       'event_updates',        'important', true,  false),
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
    ('media.reviewed',          'events',       'document_updates',     'normal',    false, false),
    ('asset.submitted',         'events',       'document_updates',     'normal',    false, false),
    ('asset.reviewed',          'events',       'document_updates',     'normal',    true,  false),
    ('invoice.issued',          'payments',     'payment_updates',      'normal',    true,  false),
    ('invoice.paid',            'payments',     'payment_updates',      'normal',    true,  false),
    ('booking_payment.expired', 'payments',     'payment_updates',      'normal',    false, false),
    ('payment.late',            'payments',     'payment_updates',      'urgent',    true,  true),
    ('payment.webhook_failed',  'payments',     'payment_updates',      'urgent',    true,  true)
  ) v(t, category, pref, priority, email, critical)
    where v.t = p_type
  )
  select * from m
  union all
  select 'system', 'system', 'normal', false, false where not exists (select 1 from m);
$$;

create table if not exists notification_preferences (
  user_id uuid primary key references profiles(id) on delete cascade,
  prefs jsonb not null default '{}'::jsonb,
  email_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);
create trigger notification_preferences_set_updated_at before update on notification_preferences
  for each row execute function set_updated_at();
alter table notification_preferences enable row level security;
create policy "notification_preferences: own" on notification_preferences for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function notification_pref_keys()
returns text[]
language sql immutable
as $$
  select array['booking_requests', 'schedule_changes', 'event_updates', 'event_reminders', 'requirement_requests',
               'requirement_reviews', 'messages', 'announcements', 'document_updates', 'payment_updates', 'tasks',
               'access', 'applications'];
$$;

create or replace function notification_allowed(p_user_id uuid, p_pref text, p_channel text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((
    select case when p_channel = 'email' and not np.email_enabled then false
                else coalesce((np.prefs -> p_pref ->> p_channel)::boolean, true) end
    from notification_preferences np where np.user_id = p_user_id), true);
$$;

create or replace function my_notification_preferences()
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'email_enabled', coalesce((select email_enabled from notification_preferences where user_id = auth.uid()), true),
    'prefs', (select jsonb_object_agg(k, jsonb_build_object(
                'in_app', notification_allowed(auth.uid(), k, 'in_app'),
                'email', coalesce((select (prefs -> k ->> 'email')::boolean from notification_preferences where user_id = auth.uid()), true)))
              from unnest(notification_pref_keys()) k));
$$;

create or replace function set_notification_preference(p_pref text, p_in_app boolean default null, p_email boolean default null)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if p_pref <> 'email_enabled' and not (p_pref = any (notification_pref_keys())) then
    raise exception 'Unknown notification preference.';
  end if;
  insert into notification_preferences (user_id) values (auth.uid()) on conflict do nothing;
  if p_pref = 'email_enabled' then
    update notification_preferences set email_enabled = coalesce(p_email, email_enabled) where user_id = auth.uid();
  else
    update notification_preferences
      set prefs = jsonb_set(prefs, array[p_pref],
                            coalesce(prefs -> p_pref, '{}'::jsonb)
                            || case when p_in_app is null then '{}'::jsonb else jsonb_build_object('in_app', p_in_app) end
                            || case when p_email is null then '{}'::jsonb else jsonb_build_object('email', p_email) end)
      where user_id = auth.uid();
  end if;
end;
$$;

-- Outbox drained by the send-notification-emails Edge Function (service role only).
create table if not exists email_outbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  to_email text not null,
  notification_type text not null,
  subject text not null,
  body text,
  link text,
  status text not null default 'queued' check (status in ('queued', 'sending', 'sent', 'failed', 'skipped')),
  attempts int not null default 0,
  last_error text,
  dedupe_key text unique,
  created_at timestamptz not null default now(),
  locked_at timestamptz,
  sent_at timestamptz
);
create index if not exists email_outbox_queue_idx on email_outbox (status, created_at) where status in ('queued', 'sending');
alter table email_outbox enable row level security;
create policy "email_outbox: platform admins read" on email_outbox for select using (has_permission('settings.manage'));

create or replace function claim_email_batch(p_limit int default 25)
returns setof email_outbox
language plpgsql security definer set search_path = public
as $$
begin
  return query
  update email_outbox o set status = 'sending', locked_at = now(), attempts = o.attempts + 1
  where o.id in (
    select id from email_outbox
    where (status = 'queued' or (status = 'sending' and locked_at < now() - interval '10 minutes'))
      and attempts < 5
    order by created_at
    limit least(greatest(p_limit, 1), 100)
    for update skip locked)
  returning o.*;
end;
$$;
create or replace function complete_email(p_id uuid, p_ok boolean, p_error text default null)
returns void
language sql security definer set search_path = public
as $$
  update email_outbox
    set status = case when p_ok then 'sent' when attempts >= 5 then 'failed' else 'queued' end,
        sent_at = case when p_ok then now() end, last_error = left(p_error, 500), locked_at = null
  where id = p_id;
$$;
revoke execute on function claim_email_batch(int) from public, anon, authenticated;
revoke execute on function complete_email(uuid, boolean, text) from public, anon, authenticated;
grant execute on function claim_email_batch(int), complete_email(uuid, boolean, text) to service_role;

-- notify(): same contract as 0018 plus category/priority, preferences and email.
drop function if exists notify(uuid, text, text, text, text, uuid);
create or replace function notify(p_user_id uuid, p_type text, p_title text, p_body text default null,
                                  p_link text default null, p_event_id uuid default null, p_priority text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  m record;
  v_email text;
  v_priority text;
begin
  if p_user_id is null or p_user_id = auth.uid() then
    return;
  end if;
  select email into v_email from profiles where id = p_user_id and is_active;
  if not found then
    return;
  end if;
  select * into m from notification_meta(p_type) limit 1;
  v_priority := coalesce(p_priority, m.priority);
  if m.critical or notification_allowed(p_user_id, m.pref, 'in_app') then
    insert into notifications (user_id, type, title, body, link, event_id, category, priority)
    values (p_user_id, p_type, left(p_title, 200), left(p_body, 1000), p_link, p_event_id, m.category, v_priority);
  end if;
  if m.email and v_email is not null and notification_allowed(p_user_id, m.pref, 'email') then
    insert into email_outbox (user_id, to_email, notification_type, subject, body, link, dedupe_key)
    values (p_user_id, v_email, p_type, left(p_title, 200), left(p_body, 1000), p_link,
            -- one email per thread per 15 minutes for chat; otherwise one per identical notice per hour
            case when p_type = 'message.new'
                 then p_user_id || ':' || coalesce(p_link, '') || ':' || floor(extract(epoch from now()) / 900)
                 else p_user_id || ':' || p_type || ':' || coalesce(p_link, '') || ':' || md5(coalesce(p_title, '')) || ':' || floor(extract(epoch from now()) / 3600) end)
    on conflict (dedupe_key) do nothing;
  end if;
end;
$$;
revoke execute on function notify(uuid, text, text, text, text, uuid, text) from public, anon, authenticated;
grant execute on function notify(uuid, text, text, text, text, uuid, text) to service_role;
grant execute on function notify_permission_holders(text, text, text, text, text, uuid) to service_role;

drop function if exists my_notifications(int, timestamptz, boolean);
create or replace function my_notifications(p_limit int default 20, p_before timestamptz default null,
                                            p_unread_only boolean default false, p_category text default null)
returns setof notifications
language sql stable security definer set search_path = public
as $$
  select * from notifications
  where user_id = auth.uid()
    and (p_before is null or created_at < p_before)
    and (not p_unread_only or read_at is null)
    and (p_category is null or category = p_category)
  order by created_at desc
  limit least(greatest(p_limit, 1), 100);
$$;

-- Portal / console path for each role (deep links must never 404).
create or replace function portal_path(p_role user_role)
returns text
language sql immutable
as $$
  select case p_role
    when 'artist' then '/artist/dashboard'
    when 'sponsor' then '/sponsor/dashboard'
    when 'vendor' then '/vendor/dashboard'
    when 'venue' then '/venue/dashboard'
    when 'volunteer' then '/volunteer/dashboard'
    when 'crew' then '/crew/dashboard'
    when 'staff' then '/admin-portal'
    when 'admin' then '/admin-portal'
    when 'super_admin' then '/admin-portal'
    else '/dashboard'
  end;
$$;

-- Everyone on an event (for event-wide notices).
create or replace function event_member_ids(p_event_id uuid)
returns table (user_id uuid, kind text)
language sql stable security definer set search_path = public
as $$
  select distinct on (u) u, k from (
    select a.user_id as u, 'artist' as k from event_artists ea join artists a on a.id = ea.artist_id
      where ea.event_id = p_event_id and a.user_id is not null and a.status = 'approved'
    union all
    select assignee_id, assignee_role from event_assignments where event_id = p_event_id and status <> 'declined'
    union all
    select venue_partner_id, 'venue' from events where id = p_event_id and venue_partner_id is not null
    union all
    select v.partner_profile_id, 'venue' from events e join venues v on v.id = e.venue_id
      where e.id = p_event_id and v.partner_profile_id is not null
    union all
    select sponsor_profile_id, 'sponsor' from sponsor_deliverables where event_id = p_event_id
  ) x
  order by u;
$$;

create or replace function member_link(p_user_id uuid, p_suffix text default '')
returns text
language sql stable security definer set search_path = public
as $$
  select case when p.role in ('staff', 'admin', 'super_admin') then '/admin-portal/my-events'
              when p.role = 'artist' then '/artist/dashboard' || p_suffix
              else portal_path(p.role) || p_suffix end
  from profiles p where p.id = p_user_id;
$$;

-- Schedule changes for artists
create or replace function notify_on_artist_schedule()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid;
  v_event text;
begin
  if tg_op = 'UPDATE' and new.call_time is not distinct from old.call_time and new.soundcheck_at is not distinct from old.soundcheck_at
     and new.performance_start is not distinct from old.performance_start and new.performance_end is not distinct from old.performance_end
     and new.wrap_at is not distinct from old.wrap_at and new.hotel is not distinct from old.hotel
     and new.pickup is not distinct from old.pickup and new.dropoff is not distinct from old.dropoff then
    return new;
  end if;
  if tg_op = 'INSERT' and new.call_time is null and new.performance_start is null and new.soundcheck_at is null then
    return new;
  end if;
  select a.user_id into v_user from artists a where a.id = new.artist_id;
  select name into v_event from events where id = new.event_id;
  perform notify(v_user, 'schedule.changed', 'Schedule updated: ' || v_event,
    concat_ws(' · ',
      'Performance ' || to_char(new.performance_start at time zone 'Asia/Kolkata', 'DD Mon, HH12:MI AM'),
      'Call ' || to_char(new.call_time at time zone 'Asia/Kolkata', 'HH12:MI AM'),
      'Soundcheck ' || to_char(new.soundcheck_at at time zone 'Asia/Kolkata', 'HH12:MI AM')),
    '/artist/calendar', new.event_id);
  return new;
end;
$$;
drop trigger if exists event_artist_details_notify on event_artist_details;
create trigger event_artist_details_notify after insert or update on event_artist_details
  for each row execute function notify_on_artist_schedule();

create or replace function notify_on_assignment_schedule()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_event text;
begin
  if new.call_time is not distinct from old.call_time and new.starts_at is not distinct from old.starts_at
     and new.ends_at is not distinct from old.ends_at and new.setup_at is not distinct from old.setup_at
     and new.breakdown_at is not distinct from old.breakdown_at and new.instructions is not distinct from old.instructions
     and new.loading_access is not distinct from old.loading_access and new.venue_access is not distinct from old.venue_access then
    return new;
  end if;
  select name into v_event from events where id = new.event_id;
  perform notify(new.assignee_id, 'schedule.changed', 'Timings updated: ' || v_event,
    concat_ws(' · ', 'Call ' || to_char(new.call_time at time zone 'Asia/Kolkata', 'DD Mon, HH12:MI AM'),
                     'Setup ' || to_char(new.setup_at at time zone 'Asia/Kolkata', 'HH12:MI AM'),
                     case when new.instructions is distinct from old.instructions then 'Instructions updated' end),
    member_link(new.assignee_id, '?tab=events'), new.event_id);
  return new;
end;
$$;
drop trigger if exists event_assignments_schedule_notify on event_assignments;
create trigger event_assignments_schedule_notify after update on event_assignments
  for each row execute function notify_on_assignment_schedule();

-- Event date/venue changes and cancellations reach everyone on the event.
create or replace function notify_on_event_change()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  r record;
  v_cancel boolean := new.status = 'cancelled' and old.status is distinct from 'cancelled';
begin
  if not v_cancel and new.event_date is not distinct from old.event_date and new.event_time is not distinct from old.event_time
     and new.end_time is not distinct from old.end_time and new.venue is not distinct from old.venue
     and new.venue_id is not distinct from old.venue_id and new.doors_at is not distinct from old.doors_at then
    return new;
  end if;
  for r in select * from event_member_ids(new.id) limit 2000 loop
    perform notify(r.user_id,
      case when v_cancel then 'event.cancelled' else 'event.updated' end,
      case when v_cancel then new.name || ' has been cancelled' else new.name || ' — details changed' end,
      case when v_cancel then 'Tangy will be in touch about next steps.'
           else concat_ws(' · ', to_char(new.event_date, 'DD Mon YYYY'), new.event_time, coalesce(new.venue, 'Venue TBC')) end,
      member_link(r.user_id, '?tab=events'), new.id);
  end loop;
  return new;
end;
$$;
drop trigger if exists events_notify_change on events;
create trigger events_notify_change after update on events
  for each row execute function notify_on_event_change();

-- Documents
create or replace function notify_on_document()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  r record;
  v_event text;
begin
  select name into v_event from events where id = new.event_id;
  for r in select * from event_member_ids(new.event_id)
           where (new.audience = 'members' and kind <> 'staff')
              or (new.audience = 'user' and user_id = new.user_id)
              or (new.audience = kind)
           limit 2000 loop
    perform notify(r.user_id, 'document.added', 'New document: ' || new.title, v_event,
      member_link(r.user_id, '?tab=documents'), new.event_id);
  end loop;
  return new;
end;
$$;
drop trigger if exists event_documents_notify on event_documents;
create trigger event_documents_notify after insert on event_documents
  for each row execute function notify_on_document();

-- Booking requests
create or replace function notify_on_booking_request()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid;
  v_artist text;
  v_event events%rowtype;
begin
  select user_id, name into v_user, v_artist from artists where id = new.artist_id;
  select * into v_event from events where id = new.session_id;
  if tg_op = 'INSERT' then
    perform notify(v_user, 'booking.requested', 'Booking request: ' || v_event.name,
      concat_ws(' · ', to_char(v_event.event_date, 'DD Mon YYYY'), v_event.venue, left(new.message, 120)), '/artist/requests', new.session_id);
  elsif new.status is distinct from old.status and new.status in ('accepted', 'declined', 'expired') then
    perform notify(new.requested_by,
      case new.status when 'accepted' then 'booking.accepted' when 'declined' then 'booking.declined' else 'booking.expired' end,
      v_artist || case new.status when 'accepted' then ' accepted ' when 'declined' then ' declined ' else ' did not answer ' end || v_event.name,
      new.decline_reason, '/admin-portal/events/' || new.session_id || '?tab=artists', new.session_id);
  end if;
  return new;
end;
$$;
drop trigger if exists assignment_requests_notify on assignment_requests;
create trigger assignment_requests_notify after insert or update of status on assignment_requests
  for each row execute function notify_on_booking_request();

-- Requirements (replaces 0018's trigger function: adds close + deep links).
create or replace function notify_on_requirement()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_event text;
begin
  select name into v_event from events where id = new.event_id;
  if tg_op = 'INSERT' then
    perform notify(new.user_id, 'requirement.requested', 'Tangy needs: ' || new.title,
      concat_ws(' · ', v_event, 'Due ' || to_char(new.due_at at time zone 'Asia/Kolkata', 'DD Mon, HH12:MI AM')),
      member_link(new.user_id, '?tab=requirements'), new.event_id,
      case new.priority when 'urgent' then 'urgent' when 'high' then 'important' else null end);
  elsif new.status = 'submitted' and old.status is distinct from 'submitted' then
    perform notify_permission_holders('events.manage', 'requirement.submitted',
      'Response received: ' || new.title, v_event, '/admin-portal/events/' || new.event_id || '?tab=requirements', new.event_id);
  elsif new.status in ('accepted', 'changes_requested') and old.status = 'submitted' then
    perform notify(new.user_id, 'requirement.reviewed',
      case when new.status = 'accepted' then 'Accepted: ' else 'Changes requested: ' end || new.title,
      new.review_note, member_link(new.user_id, '?tab=requirements'), new.event_id);
  end if;
  return new;
end;
$$;

-- Media and sponsor assets reviews
create or replace function notify_on_media_review()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.status is distinct from old.status and new.status in ('approved', 'rejected') then
    perform notify((select user_id from artists where id = new.artist_id), 'media.reviewed',
      case when new.status = 'approved' then 'Media approved: ' else 'Media not approved: ' end || coalesce(new.title, new.file_name),
      new.review_note, '/artist/media');
  end if;
  return new;
end;
$$;
drop trigger if exists artist_media_review_notify on artist_media;
create trigger artist_media_review_notify after update of status on artist_media
  for each row execute function notify_on_media_review();

create or replace function notify_on_sponsor_asset()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform notify_permission_holders('entities.manage', 'asset.submitted',
      'Brand asset submitted: ' || new.title, (select coalesce(organization_name, '') from sponsor_profiles where id = new.sponsor_id),
      '/admin-portal/people/sponsors');
  elsif new.status is distinct from old.status and new.status in ('approved', 'changes_requested') then
    perform notify(new.sponsor_id, 'asset.reviewed',
      case when new.status = 'approved' then 'Brand asset approved: ' else 'Changes requested: ' end || new.title,
      new.review_note, '/sponsor/dashboard?tab=assets');
  end if;
  return new;
end;
$$;
drop trigger if exists sponsor_assets_notify on sponsor_assets;
create trigger sponsor_assets_notify after insert or update of status on sponsor_assets
  for each row execute function notify_on_sponsor_asset();

create or replace function stamp_asset_review()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status and new.status in ('approved', 'changes_requested') then
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
  end if;
  return new;
end;
$$;
drop trigger if exists sponsor_assets_stamp on sponsor_assets;
create trigger sponsor_assets_stamp before update on sponsor_assets for each row execute function stamp_asset_review();

create or replace function notify_on_invoice()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.status in ('issued', 'paid') and (tg_op = 'INSERT' or new.status is distinct from old.status) then
    perform notify(new.partner_id, case when new.status = 'paid' then 'invoice.paid' else 'invoice.issued' end,
      case when new.status = 'paid' then 'Invoice paid: ' else 'Invoice issued: ' end || new.invoice_number,
      new.currency || ' ' || to_char(new.amount, 'FM99,99,99,999'), member_link(new.partner_id, '?tab=payments'), new.event_id);
  end if;
  return new;
end;
$$;
drop trigger if exists partner_invoices_notify on partner_invoices;
create trigger partner_invoices_notify after insert or update of status on partner_invoices
  for each row execute function notify_on_invoice();

-- Team announcements notify only that team (replaces 0018's function).
create or replace function notify_on_announcement()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  r record;
begin
  if new.status <> 'published' or new.publish_at > now()
     or (tg_op = 'UPDATE' and old.status = 'published') then
    return new;
  end if;
  if new.audience not in ('staff', 'sponsor', 'vendor', 'venue', 'volunteer', 'crew', 'artist', 'members') then
    return new;
  end if;
  for r in
    select distinct p.id, p.role from profiles p
    where p.is_active and (
      (new.event_id is null and p.role::text = new.audience)
      or (new.event_id is not null and new.target_team is not null and exists (
            select 1 from event_assignments ea where ea.event_id = new.event_id and ea.assignee_id = p.id and ea.team = new.target_team
              and ea.status <> 'declined' and (new.audience = 'members' or ea.assignee_role = new.audience)))
      or (new.event_id is not null and new.target_team is null and (
            (new.audience = 'members' and event_member_kind(new.event_id, p.id) is not null)
         or event_member_kind(new.event_id, p.id) = new.audience))
    )
    limit 2000
  loop
    perform notify(r.id, 'announcement.published', new.title, left(new.body, 200),
      case when r.role in ('staff', 'admin', 'super_admin') then '/admin-portal/announcements' else portal_path(r.role) || '?tab=announcements' end,
      new.event_id, case when new.priority = 'high' then 'important' else null end);
  end loop;
  return new;
end;
$$;

-- Reminders, overdue tasks and expiring access (run by pg_cron; safe to re-run).
create table if not exists event_reminders_sent (
  event_id uuid references events(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  sent_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
alter table event_reminders_sent enable row level security;

create or replace function event_starts_at(e events)
returns timestamptz
language sql stable
as $$
  select coalesce(e.doors_at, (e.event_date::timestamp + coalesce(
    (select to_timestamp(e.event_time, 'HH12:MI AM')::time where e.event_time ~* '^\s*\d{1,2}:\d{2}\s*(AM|PM)\s*$'),
    time '18:00')) at time zone e.timezone);
$$;

create or replace function send_event_reminders()
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  e events%rowtype;
  r record;
  v_n int := 0;
  v_hours int := setting_number('notifications.event_reminder_hours', 24)::int;
begin
  for e in select * from events where status not in ('draft', 'cancelled', 'past')
                                  and event_date between current_date and current_date + 3 loop
    if event_starts_at(e) > now() and event_starts_at(e) <= now() + make_interval(hours => v_hours) then
      for r in select * from event_member_ids(e.id) m
               where not exists (select 1 from event_reminders_sent s where s.event_id = e.id and s.user_id = m.user_id) loop
        insert into event_reminders_sent (event_id, user_id) values (e.id, r.user_id) on conflict do nothing;
        perform notify(r.user_id, 'event.reminder', 'Reminder: ' || e.name,
          concat_ws(' · ', to_char(event_starts_at(e) at time zone e.timezone, 'DD Mon, HH12:MI AM'), e.venue),
          member_link(r.user_id, '?tab=events'), e.id);
        v_n := v_n + 1;
      end loop;
    end if;
  end loop;
  return v_n;
end;
$$;

alter table event_tasks add column if not exists overdue_notified_at timestamptz;
create or replace function notify_overdue_tasks()
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  t record;
  v_n int := 0;
begin
  for t in select et.*, ea.assignee_id from event_tasks et left join event_assignments ea on ea.id = et.assignment_id
           where et.status <> 'done' and et.due_at < now() and et.overdue_notified_at is null loop
    update event_tasks set overdue_notified_at = now() where id = t.id;
    if t.assignee_id is not null then
      perform notify(t.assignee_id, 'task.overdue', 'Overdue: ' || t.title, null, member_link(t.assignee_id, '?tab=tasks'), t.event_id);
    else
      perform notify_permission_holders('team.manage', 'task.overdue', 'Overdue: ' || t.title, null,
        '/admin-portal/events/' || t.event_id || '?tab=tasks', t.event_id);
    end if;
    v_n := v_n + 1;
  end loop;
  return v_n;
end;
$$;

alter table temporary_access add column if not exists expiring_notified_at timestamptz;
create or replace function notify_expiring_access()
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  g record;
  v_n int := 0;
begin
  for g in select ta.*, e.name from temporary_access ta join events e on e.id = ta.event_id
           where ta.revoked_at is null and ta.expiring_notified_at is null
             and ta.expires_at > now() and ta.expires_at <= now() + interval '15 minutes' loop
    update temporary_access set expiring_notified_at = now() where id = g.id;
    perform notify(g.user_id, 'access.expiring', 'Check-in access ends soon: ' || g.name,
      'Ends at ' || to_char(g.expires_at at time zone 'Asia/Kolkata', 'HH12:MI AM'), '/volunteer/dashboard?tab=checkin', g.event_id);
    v_n := v_n + 1;
  end loop;
  return v_n;
end;
$$;

-- ===========================================================================
-- 15. MESSAGING — priority + assignment
-- ===========================================================================

alter table conversations add column if not exists priority text not null default 'normal';
alter table conversations drop constraint if exists conversations_priority_check;
alter table conversations add constraint conversations_priority_check check (priority in ('normal', 'high', 'urgent'));

create or replace function set_conversation_meta(p_conversation_id uuid, p_priority text default null, p_assign_to_me boolean default null)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not has_permission('messages.manage') then
    raise exception 'You do not have permission to manage conversations.';
  end if;
  update conversations
    set priority = coalesce(p_priority, priority),
        assigned_admin_id = case when p_assign_to_me is true then auth.uid() when p_assign_to_me is false then null else assigned_admin_id end
    where id = p_conversation_id and conversation_type <> 'general';
  if not found then
    raise exception 'Conversation not found.';
  end if;
  if p_assign_to_me is true then
    insert into conversation_participants (conversation_id, user_id, role) values (p_conversation_id, auth.uid(), 'admin')
    on conflict do nothing;
  end if;
end;
$$;

drop function if exists admin_conversations(text, uuid, text, text, boolean, int, int);
create or replace function admin_conversations(
  p_type text default null, p_event_id uuid default null, p_status text default null,
  p_search text default null, p_unread_only boolean default false, p_limit int default 30, p_offset int default 0,
  p_assigned text default null)
returns table (id uuid, subject text, conversation_type text, status conversation_status, priority text, event_id uuid, event_name text,
               partner_id uuid, partner_name text, partner_email text, partner_role text,
               assigned_admin_id uuid, assigned_admin_name text, last_message_at timestamptz, last_message_preview text,
               last_partner_message_at timestamptz, last_tangy_reply_at timestamptz, unread integer, total_count bigint)
language plpgsql stable security definer set search_path = public
as $$
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
    where c.conversation_type <> 'general'
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
$$;

-- ===========================================================================
-- 16. BOOKINGS — server-side expiry, payment states, late payments
-- ===========================================================================

alter table bookings
  add column if not exists payment_status text not null default 'created',
  add column if not exists payment_updated_at timestamptz,
  add column if not exists refunded_amount integer not null default 0 check (refunded_amount >= 0),
  add column if not exists expired_at timestamptz;
alter table bookings drop constraint if exists bookings_payment_status_check;
alter table bookings add constraint bookings_payment_status_check
  check (payment_status in ('created', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded', 'not_required'));
update bookings set payment_status = case
    when source = 'complimentary' then 'not_required'
    when status = 'confirmed' and razorpay_payment_id is not null then 'captured'
    when status = 'refunded' then 'refunded'
    when status = 'failed' then 'failed'
    else payment_status end
  where payment_status = 'created';
create index if not exists bookings_pending_created_idx on bookings (created_at) where status = 'pending';

alter table payment_webhook_events
  add column if not exists processing_error text,
  add column if not exists processed_at timestamptz;

-- Releases capacity held by unpaid checkouts. Never touches a booking with a
-- recorded payment. Runs from pg_cron, and before every new checkout.
create or replace function expire_stale_bookings()
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_ids uuid[];
  r record;
begin
  with x as (
    update bookings set status = 'expired', expired_at = now()
    where status = 'pending' and razorpay_payment_id is null and coalesce(source, 'checkout') <> 'complimentary'
      and created_at < now() - make_interval(mins => setting_number('bookings.pending_timeout_minutes', 30)::int)
    returning id, event_id, user_id, registration_code
  )
  select array_agg(id) into v_ids from x;
  if v_ids is null then
    return 0;
  end if;
  for r in select b.id, b.event_id, b.user_id, b.registration_code, e.name from bookings b join events e on e.id = b.event_id where b.id = any (v_ids) loop
    insert into audit_logs (actor_id, actor_email, actor_role, action, resource_type, resource_id, event_id, metadata)
    values (null, null, 'system', 'booking.expired', 'booking', r.id::text, r.event_id,
            jsonb_build_object('registration_code', r.registration_code, 'reason', 'unpaid checkout hold expired'));
    perform notify(r.user_id, 'booking_payment.expired', 'Checkout expired: ' || r.name,
      'Your seats were released because payment was not completed. You can book again if seats are available.', '/dashboard', r.event_id);
  end loop;
  return coalesce(array_length(v_ids, 1), 0);
end;
$$;
revoke execute on function expire_stale_bookings() from public, anon, authenticated;
grant execute on function expire_stale_bookings() to service_role;

-- 0016's function with stale holds released first (same locking/capacity rules).
create or replace function create_pending_booking(p_user_id uuid, p_event_id uuid, p_registration_code text, p_attendee_name text,
  p_attendee_email text, p_attendee_phone text, p_quantity integer, p_amount integer, p_tier text, p_razorpay_order_id text)
returns bookings
language plpgsql security definer set search_path = public
as $$
declare
  v_capacity int;
  v_taken int;
  v_booking bookings%rowtype;
begin
  perform expire_stale_bookings();
  select capacity into v_capacity from events where id = p_event_id for update;
  if v_capacity is null then
    raise exception 'EVENT_NOT_FOUND';
  end if;
  select coalesce(sum(quantity), 0) into v_taken
  from bookings
  where event_id = p_event_id and status in ('pending', 'confirmed');
  if v_taken + p_quantity > v_capacity then
    raise exception 'SOLD_OUT';
  end if;
  insert into bookings (
    registration_code, user_id, event_id, attendee_name, attendee_email,
    attendee_phone, quantity, amount, tier, status, razorpay_order_id
  ) values (
    p_registration_code, p_user_id, p_event_id, p_attendee_name, p_attendee_email,
    p_attendee_phone, p_quantity, p_amount, p_tier, 'pending', p_razorpay_order_id
  )
  returning * into v_booking;
  return v_booking;
end;
$$;

-- Money is never lost: a payment captured after the hold expired still
-- confirms the booking, and the finance team is told to check capacity.
create or replace function flag_late_payment()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_event events%rowtype;
  v_taken int;
begin
  if old.status = 'expired' and new.status = 'confirmed' then
    select * into v_event from events where id = new.event_id;
    select coalesce(sum(quantity), 0) into v_taken from bookings where event_id = new.event_id and status = 'confirmed';
    insert into audit_logs (actor_id, actor_email, actor_role, action, resource_type, resource_id, event_id, metadata)
    values (null, null, 'system', 'payment.late', 'booking', new.id::text, new.event_id,
            jsonb_build_object('registration_code', new.registration_code, 'confirmed_seats', v_taken, 'capacity', v_event.capacity));
    perform notify_permission_holders('payments.view', 'payment.late',
      'Paid after hold expired: ' || new.registration_code,
      v_event.name || ' · ' || v_taken || '/' || v_event.capacity || ' seats confirmed — check capacity',
      '/admin-portal/bookings?q=' || new.registration_code, new.event_id);
  end if;
  if new.status is distinct from old.status or new.razorpay_payment_id is distinct from old.razorpay_payment_id then
    new.payment_updated_at := now();
  end if;
  return new;
end;
$$;
drop trigger if exists bookings_flag_late_payment on bookings;
create trigger bookings_flag_late_payment before update on bookings
  for each row execute function flag_late_payment();

-- Webhook processing failures surface to finance (called by the Edge Function).
create or replace function record_webhook_failure(p_event_id text, p_error text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  update payment_webhook_events set processing_error = left(p_error, 500), processed_at = now() where event_id = p_event_id;
  perform notify_permission_holders('payments.view', 'payment.webhook_failed', 'Payment webhook failed',
    left(p_error, 200), '/admin-portal/bookings');
end;
$$;
revoke execute on function record_webhook_failure(text, text) from public, anon, authenticated;
grant execute on function record_webhook_failure(text, text) to service_role;

-- ===========================================================================
-- 17. EVENT HEALTH — explicit rules, no scores
-- ===========================================================================
-- CANCELLED  status = cancelled
-- COMPLETED  event date has passed or status = past
-- LIVE       published and happening today
-- AT_RISK    published, within 3 days, and any of: no artist on the lineup,
--            no venue, an overdue requirement, no staff assigned
-- NEEDS_ATTENTION  any of: open requirements, responses to review, partner
--            messages awaiting reply, pending volunteer access requests,
--            overdue tasks, an artist without a performance time, still in
--            draft within 7 days
-- READY      none of the above
create or replace function event_health(p_event_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  e events%rowtype;
  v_reasons jsonb := '[]'::jsonb;
  v_risk jsonb := '[]'::jsonb;
  n int;
begin
  if not (has_permission('events.view_all') or is_assigned_to_event(p_event_id)) then
    raise exception 'You do not have access to this event.';
  end if;
  select * into e from events where id = p_event_id;
  if e.id is null then
    raise exception 'Event not found.';
  end if;
  if e.status = 'cancelled' then return jsonb_build_object('state', 'cancelled', 'reasons', '[]'::jsonb); end if;
  if e.status = 'past' or e.event_date < (now() at time zone e.timezone)::date then
    return jsonb_build_object('state', 'completed', 'reasons', '[]'::jsonb);
  end if;

  if e.status <> 'draft' and e.event_date <= (now() at time zone e.timezone)::date + 3 then
    if not exists (select 1 from event_artists where event_id = e.id) then v_risk := v_risk || '"No artist on the lineup"'; end if;
    if e.venue_id is null and coalesce(trim(e.venue), '') = '' then v_risk := v_risk || '"No venue set"'; end if;
    if exists (select 1 from event_requirements where event_id = e.id and status in ('requested', 'changes_requested') and due_at < now())
      then v_risk := v_risk || '"Overdue partner requirement"'; end if;
    if not exists (select 1 from event_assignments where event_id = e.id and assignee_role = 'staff' and status <> 'declined')
      then v_risk := v_risk || '"No staff assigned"'; end if;
  end if;

  select count(*) into n from event_requirements where event_id = e.id and status in ('requested', 'changes_requested');
  if n > 0 then v_reasons := v_reasons || to_jsonb(n || ' open requirement' || case when n = 1 then '' else 's' end); end if;
  select count(*) into n from event_requirements where event_id = e.id and status = 'submitted';
  if n > 0 then v_reasons := v_reasons || to_jsonb(n || ' response' || case when n = 1 then '' else 's' end || ' to review'); end if;
  select count(*) into n from conversations where related_session_id = e.id and conversation_type <> 'general' and status = 'open';
  if n > 0 then v_reasons := v_reasons || to_jsonb(n || ' partner message' || case when n = 1 then '' else 's' end || ' awaiting reply'); end if;
  select count(*) into n from access_requests where event_id = e.id and status = 'pending';
  if n > 0 then v_reasons := v_reasons || to_jsonb(n || ' volunteer access request' || case when n = 1 then '' else 's' end); end if;
  select count(*) into n from event_tasks where event_id = e.id and status <> 'done' and due_at < now();
  if n > 0 then v_reasons := v_reasons || to_jsonb(n || ' overdue task' || case when n = 1 then '' else 's' end); end if;
  select count(*) into n from event_artists ea left join event_artist_details d on d.event_id = ea.event_id and d.artist_id = ea.artist_id
    where ea.event_id = e.id and d.performance_start is null;
  if n > 0 then v_reasons := v_reasons || to_jsonb(n || ' artist' || case when n = 1 then '' else 's' end || ' without a performance time'); end if;
  if e.status = 'draft' and e.event_date <= (now() at time zone e.timezone)::date + 7 then v_reasons := v_reasons || '"Still in draft"'; end if;

  if jsonb_array_length(v_risk) > 0 then
    return jsonb_build_object('state', 'at_risk', 'reasons', v_risk || v_reasons);
  end if;
  if e.status <> 'draft' and e.event_date = (now() at time zone e.timezone)::date then
    return jsonb_build_object('state', 'live', 'reasons', v_reasons);
  end if;
  return jsonb_build_object('state', case when jsonb_array_length(v_reasons) > 0 then 'needs_attention' else 'ready' end, 'reasons', v_reasons);
end;
$$;

-- ===========================================================================
-- 18. OPERATIONS OVERVIEW + GLOBAL SEARCH
-- ===========================================================================

create or replace function admin_operations_overview()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_today date := (now() at time zone 'Asia/Kolkata')::date;
  v_timeout int := setting_number('bookings.pending_timeout_minutes', 30)::int;
begin
  if not has_permission('events.view_all') then
    raise exception 'You do not have access to the operations overview.';
  end if;
  return jsonb_build_object(
    'metrics', jsonb_build_object(
      'upcoming_events', (select count(*) from events where status not in ('draft', 'cancelled') and event_date > v_today),
      'live_events', (select count(*) from events where status not in ('draft', 'cancelled') and event_date = v_today),
      'tickets_sold_upcoming', (select count(*) from tickets t join events e on e.id = t.event_id where t.status <> 'cancelled' and e.event_date >= v_today),
      'checked_in_today', (select count(*) from tickets t join events e on e.id = t.event_id where t.status = 'checked_in' and e.event_date = v_today),
      'tickets_today', (select count(*) from tickets t join events e on e.id = t.event_id where t.status <> 'cancelled' and e.event_date = v_today),
      'pending_applications', case when has_permission('applications.view') then (select count(*) from applications_overview where status = 'pending') end,
      'pending_payments', (select count(*) from bookings where status = 'pending'),
      'open_requirements', (select count(*) from event_requirements where status in ('requested', 'changes_requested')),
      'overdue_requirements', (select count(*) from event_requirements where status in ('requested', 'changes_requested') and due_at < now()),
      'partner_messages_waiting', case when has_permission('messages.manage') then (select count(*) from conversations where conversation_type <> 'general' and status = 'open') end,
      'access_requests', case when has_permission('volunteers.manage') then (select count(*) from access_requests where status = 'pending') end,
      'overdue_tasks', (select count(*) from event_tasks where status <> 'done' and due_at < now())),
    'attention', jsonb_build_object(
      'expiring_access', (select count(*) from temporary_access where revoked_at is null and expires_at > now() and expires_at <= now() + interval '30 minutes'),
      'failed_ticket_emails', (select count(*) from bookings where ticket_email_status = 'failed'),
      'failed_webhooks', (select count(*) from payment_webhook_events where processing_error is not null and created_at > now() - interval '30 days'),
      'stale_pending_bookings', (select count(*) from bookings where status = 'pending' and created_at < now() - make_interval(mins => v_timeout)),
      'events_without_venue', (select count(*) from events where status not in ('draft', 'cancelled', 'past') and event_date >= v_today and venue_id is null and coalesce(trim(venue), '') = ''),
      'events_without_artists', (select count(*) from events e where status not in ('draft', 'cancelled', 'past') and event_date between v_today and v_today + 14
                                   and not exists (select 1 from event_artists ea where ea.event_id = e.id)),
      'artists_missing_logistics', (select count(*) from event_artists ea join events e on e.id = ea.event_id
                                     left join event_artist_details d on d.event_id = ea.event_id and d.artist_id = ea.artist_id
                                     where e.event_date between v_today and v_today + 14 and e.status not in ('cancelled', 'past') and d.performance_start is null),
      'sponsor_deliverables_due', (select count(*) from sponsor_deliverables where status <> 'delivered' and due_date <= v_today + 7),
      'events_without_documents', (select count(*) from events e where status not in ('draft', 'cancelled', 'past') and event_date between v_today and v_today + 14
                                     and not exists (select 1 from event_documents d where d.event_id = e.id))),
    'today', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', e.id, 'name', e.name, 'event_time', e.event_time, 'end_time', e.end_time, 'timezone', e.timezone,
        'venue', coalesce(v.name, e.venue), 'doors_at', e.doors_at, 'capacity', e.capacity, 'status', e.status,
        'tickets', (select count(*) from tickets t where t.event_id = e.id and t.status <> 'cancelled'),
        'checked_in', (select count(*) from tickets t where t.event_id = e.id and t.status = 'checked_in'),
        'staff', (select count(*) from event_assignments ea where ea.event_id = e.id and ea.assignee_role = 'staff' and ea.status <> 'declined'),
        'volunteers', (select count(*) from event_assignments ea where ea.event_id = e.id and ea.assignee_role = 'volunteer' and ea.status <> 'declined'),
        'open_tasks', (select count(*) from event_tasks et where et.event_id = e.id and et.status <> 'done'),
        'artists', coalesce((select jsonb_agg(jsonb_build_object('name', a.name, 'call_time', d.call_time, 'soundcheck_at', d.soundcheck_at,
                                              'performance_start', d.performance_start, 'performance_end', d.performance_end)
                                         order by d.performance_start nulls last)
                             from event_artists ea join artists a on a.id = ea.artist_id
                             left join event_artist_details d on d.event_id = ea.event_id and d.artist_id = ea.artist_id
                             where ea.event_id = e.id), '[]'::jsonb)) order by e.event_time)
      from events e left join venues v on v.id = e.venue_id
      where e.event_date = v_today and e.status not in ('draft', 'cancelled')), '[]'::jsonb),
    'upcoming', coalesce((
      select jsonb_agg(x order by x.event_date) from (
        select e.id, e.name, e.event_date, e.event_time, coalesce(v.name, e.venue) as venue, e.status, e.capacity,
               (select count(*) from tickets t where t.event_id = e.id and t.status <> 'cancelled') as tickets,
               (event_health(e.id) ->> 'state') as health
        from events e left join venues v on v.id = e.venue_id
        where e.event_date between v_today and v_today + 30 and e.status <> 'cancelled'
        order by e.event_date limit 12) x), '[]'::jsonb)
  );
end;
$$;

-- Permission-scoped global search for the admin portal command palette.
create or replace function admin_search(p_query text, p_limit int default 6)
returns table (kind text, id text, title text, subtitle text, link text)
language plpgsql stable security definer set search_path = public
as $$
declare
  q text := '%' || replace(replace(trim(coalesce(p_query, '')), '%', ''), '_', '') || '%';
  n int := least(greatest(p_limit, 1), 20);
begin
  if length(trim(coalesce(p_query, ''))) < 2 or current_role_name() not in ('super_admin', 'admin', 'staff') then
    return;
  end if;
  return query
  (select 'event', e.id::text, e.name, to_char(e.event_date, 'DD Mon YYYY') || coalesce(' · ' || e.venue, ''),
          case when has_permission('events.view_all') then '/admin-portal/events/' || e.id else '/admin-portal/my-events/' || e.id end
   from events e
   where (has_permission('events.view_all') or is_assigned_to_event(e.id)) and (e.name ilike q or e.venue ilike q)
   order by e.event_date desc limit n)
  union all
  (select 'artist', a.id::text, a.name, concat_ws(' · ', a.genre, a.city, a.status::text), '/admin-portal/people/artists?q=' || a.name
   from artists a where has_permission('entities.manage') and (a.name ilike q or a.email ilike q or a.genre ilike q)
   order by a.name limit n)
  union all
  (select case p.role when 'sponsor' then 'sponsor' when 'vendor' then 'vendor' when 'venue' then 'venue host' else 'volunteer' end,
          p.id::text, coalesce(p.full_name, p.email), p.email,
          case p.role when 'sponsor' then '/admin-portal/people/sponsors' when 'vendor' then '/admin-portal/people/vendors'
                      when 'venue' then '/admin-portal/people/venue-hosts' else '/admin-portal/volunteers' end || '?q=' || coalesce(p.full_name, p.email)
   from profiles p
   where p.role in ('sponsor', 'vendor', 'venue', 'volunteer')
     and ((p.role = 'volunteer' and has_permission('volunteers.manage')) or (p.role <> 'volunteer' and has_permission('entities.manage')))
     and (p.full_name ilike q or p.email ilike q)
   order by p.full_name limit n)
  union all
  (select 'booking', b.id::text, b.registration_code, b.attendee_name || ' · ' || e.name, '/admin-portal/bookings?q=' || b.registration_code
   from bookings b join events e on e.id = b.event_id
   where has_permission('bookings.view_all') and (b.registration_code ilike q or b.attendee_name ilike q or b.attendee_email ilike q)
   order by b.created_at desc limit n)
  union all
  (select 'attendee', t.ticket_id::text, t.attendee_name, t.ticket_number || ' · ' || t.event_name, '/admin-portal/attendees?q=' || t.ticket_number
   from attendee_tickets t
   where not has_permission('bookings.view_all') and (t.attendee_name ilike q or t.ticket_number ilike q)
   limit n)
  union all
  (select 'message', c.id::text, coalesce(p.full_name, p.email), coalesce(c.subject, c.last_message_preview), '/admin-portal/messages?c=' || c.id
   from conversations c left join profiles p on p.id = c.external_user_id
   where has_permission('messages.manage') and c.conversation_type <> 'general'
     and (p.full_name ilike q or p.email ilike q or c.subject ilike q)
   order by c.last_message_at desc nulls last limit n);
end;
$$;

-- ===========================================================================
-- 19. SCHEDULING (pg_cron when available; every job is also safe to call manually)
-- ===========================================================================

create or replace function run_platform_jobs()
returns jsonb
language plpgsql security definer set search_path = public
as $$
begin
  return jsonb_build_object(
    'bookings_expired', expire_stale_bookings(),
    'requests_expired', expire_booking_requests(),
    'reminders', send_event_reminders(),
    'overdue_tasks', notify_overdue_tasks(),
    'expiring_access', notify_expiring_access(),
    'access_expiry_logged', log_expired_access());
end;
$$;
revoke execute on function run_platform_jobs() from public, anon, authenticated;
grant execute on function run_platform_jobs() to service_role;

do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    begin
      create extension if not exists pg_cron;
      perform cron.schedule('tangy-platform-jobs', '*/5 * * * *', 'select public.run_platform_jobs()');
    exception when others then
      raise notice 'pg_cron unavailable (%); schedule public.run_platform_jobs() externally every 5 minutes.', sqlerrm;
    end;
  end if;
end $$;

-- ===========================================================================
-- GRANTS (every function re-checks authorization inside)
-- ===========================================================================

grant execute on function artist_profile_completion(uuid), create_booking_request(uuid, uuid, text, timestamptz, timestamptz, integer, timestamptz),
  respond_to_booking_request(uuid, boolean, text), my_booking_requests(), submit_requirement(uuid, text, text), close_requirement(uuid),
  my_notification_preferences(), set_notification_preference(text, boolean, boolean),
  my_notifications(int, timestamptz, boolean, text), portal_announcements(int), set_conversation_meta(uuid, text, boolean),
  admin_conversations(text, uuid, text, text, boolean, int, int, text), event_health(uuid), admin_operations_overview(),
  admin_search(text, int)
to authenticated;
revoke execute on function can_read_event_file(text), can_write_event_file(text) from anon;
