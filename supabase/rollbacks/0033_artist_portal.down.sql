-- Rollback for 0033_artist_portal.sql. Drops artist applications, artist
-- documents (their files stay in storage — remove the artist-documents bucket
-- by hand), the private review notes table (export it first: the notes are not
-- copied back onto the applicant-readable rows), the new artist profile,
-- request and media columns; restores public availability reads, the 0020
-- request notifications and the 0017 / 0028 views.
begin;

drop policy if exists "artist-media: applicant read" on storage.objects;
drop policy if exists "artist-media: applicant upload" on storage.objects;
drop policy if exists "artist-media: applicant delete" on storage.objects;
drop policy if exists "artist-media: reviewers read applications" on storage.objects;
drop policy if exists "artist-documents: own read" on storage.objects;
drop policy if exists "artist-documents: own upload" on storage.objects;
drop policy if exists "artist-documents: own delete" on storage.objects;
drop policy if exists "artist-documents: team read" on storage.objects;
drop table if exists artist_documents;

drop function if exists set_artist_availability(date, date, text, text, time, time);
drop function if exists artist_schedule_check(uuid, date);
drop function if exists mark_artist_request_viewed(uuid);
drop function if exists manage_artist_request(uuid, text, text);
drop function if exists create_artist_request(uuid, uuid, jsonb, boolean);
drop trigger if exists artists_sync_application on artists;
drop function if exists sync_artist_application_status();
drop function if exists review_artist_application(uuid, text, text[], text, text);
drop function if exists withdraw_artist_application();
drop function if exists submit_artist_application();
drop table if exists artist_applications;
drop function if exists guard_artist_application();

drop trigger if exists artists_private_notes on artists;
drop trigger if exists collaborations_private_notes on collaborations;
drop trigger if exists crew_applications_private_notes on crew_applications;
drop function if exists move_review_notes();

create or replace view applications_overview with (security_invoker = true) as
select
  'artists'::text as source_table, a.id, 'artist'::text as type, a.user_id,
  a.name as applicant_name, a.email as applicant_email, null::text as phone,
  a.applied_at as submitted_at, a.status, a.reviewed_by, a.reviewed_at, a.review_notes, a.decision_reason,
  concat_ws(' · ', a.genre, a.city) as summary,
  jsonb_build_object('genre', a.genre, 'city', a.city, 'bio', a.bio, 'experience_level', a.experience_level,
    'instagram', a.instagram, 'soundcloud', a.soundcloud, 'spotify', a.spotify) as details
from artists a
union all
select
  'collaborations', c.id, case c.type when 'venue_host' then 'venue' else c.type::text end, c.user_id,
  coalesce(c.business_name, c.contact_name), c.email, c.phone,
  c.created_at, c.status, c.reviewed_by, c.reviewed_at, c.review_notes, c.decision_reason,
  c.business_name,
  jsonb_build_object('business_name', c.business_name, 'contact_name', c.contact_name, 'details', c.details)
from collaborations c
union all
select
  'crew_applications', r.id, r.category, r.user_id,
  r.name, r.email, r.phone,
  r.created_at, r.status, r.reviewed_by, r.reviewed_at, r.review_notes, r.decision_reason,
  concat_ws(' · ', r.role_interest, r.event_interest),
  jsonb_build_object('role_interest', r.role_interest, 'event_interest', r.event_interest, 'message', r.message)
from crew_applications r;

drop table if exists application_reviews;

drop policy if exists "artist_availability: self read" on artist_availability;
drop policy if exists "artist_availability: team read" on artist_availability;
create policy "artist_availability: public read" on artist_availability for select using (true);
alter table artist_availability drop constraint if exists artist_availability_window_check;
alter table artist_availability drop column if exists note, drop column if exists start_time, drop column if exists end_time;

drop view if exists public_artists;
create or replace view public_artists as
  select id, name, stage_name, genre, subgenre, city, bio, avatar_url, instagram, soundcloud, spotify, youtube,
         performance_type, applied_at, slug
  from artists
  where status = 'approved'::application_status;
grant select on public_artists to anon, authenticated;
alter table artists drop column if exists cover_url, drop column if exists long_bio, drop column if exists country,
  drop column if exists languages, drop column if exists instruments, drop column if exists genres, drop column if exists years_active,
  drop column if exists performance_count, drop column if exists website, drop column if exists highlights,
  drop column if exists notable_venues, drop column if exists audience_metrics;
alter table artist_private_profiles drop column if exists legal_name, drop column if exists whatsapp, drop column if exists manager_name,
  drop column if exists manager_contact, drop column if exists booking_email, drop column if exists travel_origin,
  drop column if exists travelling_members, drop column if exists hospitality_notes, drop column if exists payment_details_status;

-- 0032's enum values cannot be removed; map requests back to the old states.
update assignment_requests set status = 'cancelled' where status = 'draft';
update assignment_requests set status = 'accepted' where status in ('confirmed', 'completed');
drop index if exists assignment_requests_active_unique;
create unique index assignment_requests_active_unique on assignment_requests (session_id, artist_id) where status in ('pending', 'accepted');
drop policy if exists "assignment_requests: artist read own" on assignment_requests;
create policy "assignment_requests: artist read own" on assignment_requests for select
  using (exists (select 1 from artists a where a.id = artist_id and a.user_id = auth.uid()));
alter table assignment_requests drop column if exists performance_type, drop column if exists set_minutes, drop column if exists sets_count,
  drop column if exists call_time, drop column if exists soundcheck_at, drop column if exists technical_notes,
  drop column if exists hospitality_notes, drop column if exists viewed_at, drop column if exists confirmed_at,
  drop column if exists completed_at, drop column if exists cancel_reason;
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

alter table artist_media drop column if exists description, drop column if exists tags, drop column if exists taken_on,
  drop column if exists event_id, drop column if exists kind, drop column if exists performance_type;

drop function if exists my_booking_requests();
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
grant execute on function my_booking_requests() to authenticated;

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

commit;
