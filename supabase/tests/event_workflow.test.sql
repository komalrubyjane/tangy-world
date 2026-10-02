-- Tangy Sessions — the event ↔ artist workflow (0034): availability, line-ups,
-- publish / change / cancel notifications, custom notifications, private
-- Super Admin ↔ artist messaging and role changes.
-- One transaction, rolled back at the end. Run: scripts/test-db.sh

\set ON_ERROR_STOP 1
\set QUIET 1
begin;

delete from programmes; delete from bookings; delete from waitlist; delete from collaborations; delete from crew_applications;
delete from private_enquiries; delete from contact_enquiries; delete from assignment_requests;
delete from conversations; delete from notifications; delete from email_outbox; delete from application_reviews;
delete from events; delete from artists; delete from auth.users;

create schema tt;
create function tt.login(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;
create function tt.logout() returns void language plpgsql as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
end $$;
create function tt.expect_error(p_sql text, p_pattern text, p_label text) returns void language plpgsql as $$
begin
  execute p_sql;
  raise exception 'FAIL [%]: expected an error matching "%", but the statement succeeded', p_label, p_pattern;
exception when others then
  if sqlerrm like 'FAIL [%' then raise; end if;
  if sqlerrm not ilike p_pattern then
    raise exception 'FAIL [%]: expected error matching "%", got "%"', p_label, p_pattern, sqlerrm;
  end if;
  raise notice 'ok  %', p_label;
end $$;
create function tt.check(p_cond boolean, p_label text) returns void language plpgsql as $$
begin
  if p_cond is not true then
    raise exception 'FAIL [%]', p_label;
  end if;
  raise notice 'ok  %', p_label;
end $$;
create function tt.notes(p_uid uuid, p_type text) returns bigint language sql security definer as $$
  select count(*) from notifications where user_id = p_uid and type = p_type;
$$;
create function tt.note(p_uid uuid, p_type text) returns notifications language sql security definer as $$
  select * from notifications where user_id = p_uid and type = p_type order by created_at desc limit 1;
$$;
create function tt.status(p_artist uuid, p_date date) returns text language sql security definer as $$
  select status from find_available_artists(p_date) where artist_id = p_artist;
$$;
create function tt.audits(p_action text) returns setof audit_logs language sql security definer as $$
  select * from audit_logs where action = p_action;
$$;
grant usage on schema tt to anon, authenticated;
grant execute on all functions in schema tt to anon, authenticated;

-- People: f100 super admin, f101 admin, f102 staff, f103 sponsor, f104 second super admin;
-- artists with accounts f110 Asha, f111 Bilal, f112 Chitra, f114 Esha, f115 Farid; Dev (no account).
insert into auth.users (id, email, aud, role, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000f100', 'root@wf.tangy.test',   'authenticated', 'authenticated', '{}'),
  ('00000000-0000-0000-0000-00000000f101', 'admin@wf.tangy.test',  'authenticated', 'authenticated', '{}'),
  ('00000000-0000-0000-0000-00000000f102', 'staff@wf.tangy.test',  'authenticated', 'authenticated', '{}'),
  ('00000000-0000-0000-0000-00000000f103', 'sponsor@wf.tangy.test','authenticated', 'authenticated', '{}'),
  ('00000000-0000-0000-0000-00000000f104', 'root2@wf.tangy.test',  'authenticated', 'authenticated', '{}'),
  ('00000000-0000-0000-0000-00000000f110', 'asha@wf.tangy.test',   'authenticated', 'authenticated', '{}'),
  ('00000000-0000-0000-0000-00000000f111', 'bilal@wf.tangy.test',  'authenticated', 'authenticated', '{}'),
  ('00000000-0000-0000-0000-00000000f112', 'chitra@wf.tangy.test', 'authenticated', 'authenticated', '{}'),
  ('00000000-0000-0000-0000-00000000f114', 'esha@wf.tangy.test',   'authenticated', 'authenticated', '{}'),
  ('00000000-0000-0000-0000-00000000f115', 'farid@wf.tangy.test',  'authenticated', 'authenticated', '{}');
update profiles set role = 'super_admin' where id in ('00000000-0000-0000-0000-00000000f100', '00000000-0000-0000-0000-00000000f104');
update profiles set role = 'admin' where id = '00000000-0000-0000-0000-00000000f101';
update profiles set role = 'staff' where id = '00000000-0000-0000-0000-00000000f102';
update profiles set role = 'sponsor' where id = '00000000-0000-0000-0000-00000000f103';
update profiles set role = 'artist' where id in ('00000000-0000-0000-0000-00000000f110', '00000000-0000-0000-0000-00000000f111',
  '00000000-0000-0000-0000-00000000f112', '00000000-0000-0000-0000-00000000f114', '00000000-0000-0000-0000-00000000f115');

insert into artists (id, user_id, name, stage_name, email, genre, city, instruments, status) values
  ('00000000-0000-0000-0000-00000000a110', '00000000-0000-0000-0000-00000000f110', 'Asha Rao', 'Asha', 'asha@wf.tangy.test', 'Electronic', 'Hyderabad', '{Synth}', 'approved'),
  ('00000000-0000-0000-0000-00000000a111', '00000000-0000-0000-0000-00000000f111', 'Bilal Khan', 'Bilal', 'bilal@wf.tangy.test', 'Sufi', 'Lucknow', '{Harmonium}', 'approved'),
  ('00000000-0000-0000-0000-00000000a112', '00000000-0000-0000-0000-00000000f112', 'Chitra Iyer', 'Chitra', 'chitra@wf.tangy.test', 'Carnatic', 'Chennai', '{Veena}', 'approved'),
  ('00000000-0000-0000-0000-00000000a113', null, 'Dev Malhotra', 'Dev', 'dev@wf.tangy.test', 'Jazz', 'Mumbai', '{Saxophone}', 'approved'),
  ('00000000-0000-0000-0000-00000000a114', '00000000-0000-0000-0000-00000000f114', 'Esha Nair', 'Esha', 'esha@wf.tangy.test', 'Folk', 'Kochi', '{Guitar}', 'approved'),
  ('00000000-0000-0000-0000-00000000a115', '00000000-0000-0000-0000-00000000f115', 'Farid Ali', 'Farid', 'farid@wf.tangy.test', 'Qawwali', 'Hyderabad', '{Vocals}', 'approved');

insert into events (id, slug, name, event_date, event_time, venue, capacity, price, status, timezone) values
  ('00000000-0000-0000-0000-00000000e701', 'wf-heritage', 'Heritage Night', current_date + 14, '7:00 PM', 'Stepwell', 100, 900, 'draft', 'Asia/Kolkata'),
  ('00000000-0000-0000-0000-00000000e702', 'wf-other', 'Other Night', current_date + 14, '7:00 PM', 'Courtyard', 100, 900, 'on-sale', 'Asia/Kolkata'),
  ('00000000-0000-0000-0000-00000000e703', 'wf-third', 'Third Night', current_date + 21, '7:00 PM', 'Baradari', 100, 900, 'on-sale', 'Asia/Kolkata');
-- Dev is already booked on the other night, 19:00–20:00 local.
insert into event_artists (event_id, artist_id) values ('00000000-0000-0000-0000-00000000e702', '00000000-0000-0000-0000-00000000a113');
insert into event_artist_details (event_id, artist_id, performance_start, performance_end) values
  ('00000000-0000-0000-0000-00000000e702', '00000000-0000-0000-0000-00000000a113',
   ((current_date + 14) + time '19:00') at time zone 'Asia/Kolkata', ((current_date + 14) + time '20:00') at time zone 'Asia/Kolkata');

\echo '--- 1. Availability comes from the artist''s own calendar'
select tt.login('00000000-0000-0000-0000-00000000f110');
select set_artist_availability(current_date + 14, current_date + 14, 'available', null);
select tt.login('00000000-0000-0000-0000-00000000f111');
select set_artist_availability(current_date + 14, current_date + 14, 'tentative', 'Might be travelling');
select tt.login('00000000-0000-0000-0000-00000000f112');
select set_artist_availability(current_date + 14, current_date + 14, 'unavailable', 'Family wedding');
select tt.expect_error($$insert into artist_availability (artist_id, date, status) values ('00000000-0000-0000-0000-00000000a110', current_date + 30, 'unavailable')$$,
  '%row-level security%', 'an artist cannot edit another artist''s availability');
select tt.expect_error($$select * from find_available_artists(current_date + 14)$$, '%permission%', 'artists cannot browse other artists'' availability');
select tt.expect_error($$select * from artist_calendar('00000000-0000-0000-0000-00000000a110', current_date, current_date + 30)$$, '%not found%', 'an artist cannot open another artist''s calendar');
select tt.check((select count(*) from artist_calendar('00000000-0000-0000-0000-00000000a112', current_date, current_date + 30) where kind = 'unavailable') = 1, 'an artist reads their own calendar');
select tt.login('00000000-0000-0000-0000-00000000f102');
select tt.expect_error($$select * from find_available_artists(current_date + 14)$$, '%permission%', 'staff cannot browse artist availability');

select tt.login('00000000-0000-0000-0000-00000000f101');
select tt.check(tt.status('00000000-0000-0000-0000-00000000a110', current_date + 14) = 'available', 'the admin sees Asha available');
select tt.check(tt.status('00000000-0000-0000-0000-00000000a111', current_date + 14) = 'tentative', '… Bilal tentative');
select tt.check(tt.status('00000000-0000-0000-0000-00000000a112', current_date + 14) = 'unavailable', '… Chitra unavailable');
select tt.check(tt.status('00000000-0000-0000-0000-00000000a113', current_date + 14) = 'busy', '… Dev busy (booked elsewhere)');
select tt.check(tt.status('00000000-0000-0000-0000-00000000a114', current_date + 14) = 'unknown', '… Esha has set nothing');
select tt.check((select status from find_available_artists(current_date + 14, '21:00', '22:00') where artist_id = '00000000-0000-0000-0000-00000000a113') = 'tentative',
  'a booking at a different time that day reads as tentative, not busy');
select tt.check((select array_agg(artist_id order by artist_id) from find_available_artists(current_date + 14, p_search => 'hyderabad'))
  = array['00000000-0000-0000-0000-00000000a110', '00000000-0000-0000-0000-00000000a115']::uuid[], 'search by city');
select tt.check((select array_agg(artist_id) from find_available_artists(current_date + 14, p_search => 'electronic')) = array['00000000-0000-0000-0000-00000000a110']::uuid[], 'search by genre');
select tt.check((select array_agg(artist_id) from find_available_artists(current_date + 14, p_search => 'veena')) = array['00000000-0000-0000-0000-00000000a112']::uuid[], 'search by instrument');
select tt.check((select status from find_available_artists(current_date + 14) limit 1) = 'available', 'available artists are listed first');

\echo '--- 2. Line-up: several artists, re-checked on the server'
select tt.expect_error($$select save_event_lineup('00000000-0000-0000-0000-00000000e701', '[{"artist_id":"00000000-0000-0000-0000-00000000a113","mode":"assign"}]')$$,
  '%already booked%', 'a busy artist is refused');
select tt.expect_error($$select save_event_lineup('00000000-0000-0000-0000-00000000e701', '[{"artist_id":"00000000-0000-0000-0000-00000000a112","mode":"assign"}]')$$,
  '%unavailable%', 'an unavailable artist is refused without an override');
select save_event_lineup('00000000-0000-0000-0000-00000000e701', jsonb_build_array(
  jsonb_build_object('artist_id', '00000000-0000-0000-0000-00000000a110', 'mode', 'assign', 'performance_order', 1, 'performance_type', 'Live set',
    'start', ((current_date + 14) + time '19:00') at time zone 'Asia/Kolkata', 'end', ((current_date + 14) + time '19:45') at time zone 'Asia/Kolkata'),
  jsonb_build_object('artist_id', '00000000-0000-0000-0000-00000000a111', 'mode', 'assign', 'performance_order', 2,
    'start', ((current_date + 14) + time '20:00') at time zone 'Asia/Kolkata', 'end', ((current_date + 14) + time '20:45') at time zone 'Asia/Kolkata')));
select tt.check((select count(*) from event_artists where event_id = '00000000-0000-0000-0000-00000000e701') = 2, 'the event stores both artists');
select tt.check((select performance_order from event_artist_details where event_id = '00000000-0000-0000-0000-00000000e701' and artist_id = '00000000-0000-0000-0000-00000000a111') = 2,
  '… with their running order');
select tt.expect_error(format($$select save_event_lineup('00000000-0000-0000-0000-00000000e701', '[{"artist_id":"00000000-0000-0000-0000-00000000a115","mode":"assign","start":"%s","end":"%s"}]')$$,
  ((current_date + 14) + time '19:30') at time zone 'Asia/Kolkata', ((current_date + 14) + time '20:15') at time zone 'Asia/Kolkata'),
  '%overlaps%', 'overlapping sets in one event are refused');
select tt.check(tt.notes('00000000-0000-0000-0000-00000000f110', 'assignment.new') = 0, 'nobody is told while the event is a draft');
select save_event_lineup('00000000-0000-0000-0000-00000000e701', '[{"artist_id":"00000000-0000-0000-0000-00000000a112","mode":"assign","override":true}]');
select tt.check(exists (select 1 from tt.audits('event.lineup_saved') where metadata -> 'items' -> 0 ->> 'availability' = 'unavailable'),
  'an override is deliberate and audited');
select remove_event_artist('00000000-0000-0000-0000-00000000e701', '00000000-0000-0000-0000-00000000a112');
select tt.check(tt.notes('00000000-0000-0000-0000-00000000f112', 'assignment.removed') = 0, 'removal from a draft line-up is silent');
select save_event_lineup('00000000-0000-0000-0000-00000000e701', format('[{"artist_id":"00000000-0000-0000-0000-00000000a114","mode":"request","start":"%s","end":"%s","performance_type":"Acoustic"}]',
  ((current_date + 14) + time '21:00') at time zone 'Asia/Kolkata', ((current_date + 14) + time '21:45') at time zone 'Asia/Kolkata')::jsonb);
select tt.check(tt.notes('00000000-0000-0000-0000-00000000f114', 'booking.requested') = 1, 'a requested artist gets the session request');
select tt.check((select status from find_available_artists(current_date + 14) where artist_id = '00000000-0000-0000-0000-00000000a114') = 'tentative',
  'a pending request is shown as tentative, never as a booking');
select tt.login('00000000-0000-0000-0000-00000000f110');
select tt.expect_error($$select save_event_lineup('00000000-0000-0000-0000-00000000e701', '[{"artist_id":"00000000-0000-0000-0000-00000000a110"}]')$$, '%permission%', 'artists cannot change line-ups');

\echo '--- 3. Publishing tells the line-up'
select tt.login('00000000-0000-0000-0000-00000000f101');
update events set status = 'on-sale' where id = '00000000-0000-0000-0000-00000000e701';
select tt.check(tt.notes('00000000-0000-0000-0000-00000000f110', 'assignment.new') = 1 and tt.notes('00000000-0000-0000-0000-00000000f111', 'assignment.new') = 1,
  'publishing tells every artist on the line-up');
select tt.check((tt.note('00000000-0000-0000-0000-00000000f110', 'assignment.new')).body like '%Your performance: 7:00 PM – 7:45 PM. Do your best.',
  '… with their performance time');
select tt.check((tt.note('00000000-0000-0000-0000-00000000f110', 'assignment.new')).link = '/artist/sessions/00000000-0000-0000-0000-00000000e701', '… linking to the session');
select tt.check(tt.notes('00000000-0000-0000-0000-00000000f114', 'assignment.new') = 0, 'an artist with only a request is not told they are on the line-up');

select tt.login('00000000-0000-0000-0000-00000000f114');
select respond_to_booking_request((select id from assignment_requests where artist_id = '00000000-0000-0000-0000-00000000a114'), true, null);
select tt.check(exists (select 1 from event_artists where event_id = '00000000-0000-0000-0000-00000000e701' and artist_id = '00000000-0000-0000-0000-00000000a114'),
  'accepting puts the artist on the line-up');
select tt.check((select count(*) from artist_calendar('00000000-0000-0000-0000-00000000a114', current_date, current_date + 30) where kind = 'confirmed') = 1, '… and on their calendar');
select tt.check(tt.notes('00000000-0000-0000-0000-00000000f101', 'booking.accepted') = 1, 'the admin is told it was accepted');

-- Farid has a request for the third night; meanwhile he is booked elsewhere that evening.
select tt.login('00000000-0000-0000-0000-00000000f101');
select create_artist_request('00000000-0000-0000-0000-00000000e703', '00000000-0000-0000-0000-00000000a115', '{}'::jsonb, true);
insert into events (id, slug, name, event_date, event_time, venue, capacity, price, status) values
  ('00000000-0000-0000-0000-00000000e704', 'wf-clash', 'Clash Night', current_date + 21, '7:00 PM', 'Elsewhere', 50, 500, 'draft');
select save_event_lineup('00000000-0000-0000-0000-00000000e704', '[{"artist_id":"00000000-0000-0000-0000-00000000a115","mode":"assign"}]');
select tt.login('00000000-0000-0000-0000-00000000f115');
select tt.expect_error($$select respond_to_booking_request((select id from assignment_requests where artist_id = '00000000-0000-0000-0000-00000000a115'), true, null)$$,
  '%already booked%', 'accepting re-checks: a clash booked meanwhile is refused');
select respond_to_booking_request((select id from assignment_requests where artist_id = '00000000-0000-0000-0000-00000000a115'), false, 'Booked elsewhere');
select tt.check((select status::text from assignment_requests where artist_id = '00000000-0000-0000-0000-00000000a115') = 'declined', 'the artist declines instead');

\echo '--- 4. Changes reach the artists'
select tt.login('00000000-0000-0000-0000-00000000f101');
update events set event_date = current_date + 15 where id = '00000000-0000-0000-0000-00000000e701';
select tt.check(tt.notes('00000000-0000-0000-0000-00000000f110', 'event.date_changed') = 1, 'a date change notifies the line-up');
select tt.check((tt.note('00000000-0000-0000-0000-00000000f110', 'event.date_changed')).body like 'New date: %', '… with the new date');
select tt.check((select day from artist_calendar('00000000-0000-0000-0000-00000000a110', current_date, current_date + 30) where kind = 'confirmed') = current_date + 15,
  'the artist''s calendar moves with it');
update events set venue = 'Taramati Baradari' where id = '00000000-0000-0000-0000-00000000e701';
select tt.check(tt.notes('00000000-0000-0000-0000-00000000f111', 'event.venue_changed') = 1, 'a venue change notifies the line-up');
select update_event_artist('00000000-0000-0000-0000-00000000e701', '00000000-0000-0000-0000-00000000a110', jsonb_build_object(
  'start', ((current_date + 15) + time '18:30') at time zone 'Asia/Kolkata', 'end', ((current_date + 15) + time '19:15') at time zone 'Asia/Kolkata', 'performance_order', 1));
select tt.check(tt.notes('00000000-0000-0000-0000-00000000f110', 'schedule.changed') = 1, 'performance-time changes notify the artist');
select remove_event_artist('00000000-0000-0000-0000-00000000e701', '00000000-0000-0000-0000-00000000a111', 'Programme changed');
select tt.check(tt.notes('00000000-0000-0000-0000-00000000f111', 'assignment.removed') = 1, 'removal from a published line-up is announced');

\echo '--- 5. Cancellation keeps history'
select create_artist_request('00000000-0000-0000-0000-00000000e701', '00000000-0000-0000-0000-00000000a115', '{}'::jsonb, true);
update events set status = 'cancelled' where id = '00000000-0000-0000-0000-00000000e701';
select tt.check(tt.notes('00000000-0000-0000-0000-00000000f110', 'event.cancelled') = 1, 'cancelling tells the line-up');
select tt.check(tt.notes('00000000-0000-0000-0000-00000000f115', 'event.cancelled') = 1 and tt.notes('00000000-0000-0000-0000-00000000f115', 'booking.cancelled') = 0,
  '… and anyone holding a request, once');
select tt.check((select count(*) from event_artists where event_id = '00000000-0000-0000-0000-00000000e701') = 2, 'the line-up rows are kept as history');
select tt.check((select bool_and(status = 'cancelled') from assignment_requests where session_id = '00000000-0000-0000-0000-00000000e701' and status not in ('declined', 'accepted')),
  'open requests are closed');
select tt.check((select kind from artist_calendar('00000000-0000-0000-0000-00000000a110', current_date, current_date + 30) where event_id = '00000000-0000-0000-0000-00000000e701') = 'cancelled',
  'the artist''s calendar marks it cancelled');
select tt.check(tt.status('00000000-0000-0000-0000-00000000a110', current_date + 15) <> 'busy', 'a cancelled event no longer makes the artist busy');

\echo '--- 6. Availability reminder'
select tt.logout();
-- Backdate the calendar (bypassing the updated_at trigger, as time passing would).
set local session_replication_role = replica;
update artist_availability set updated_at = now() - interval '60 days' where artist_id = '00000000-0000-0000-0000-00000000a110';
set local session_replication_role = origin;
select tt.check(send_availability_reminders() >= 1 and tt.notes('00000000-0000-0000-0000-00000000f110', 'availability.reminder') = 1, 'a stale calendar gets one reminder');
select send_availability_reminders();
select tt.check(tt.notes('00000000-0000-0000-0000-00000000f110', 'availability.reminder') = 1, '… and not another within the period');
select tt.login('00000000-0000-0000-0000-00000000f110');
select tt.check((artist_availability_summary() ->> 'is_stale')::boolean, 'the artist''s summary says it is stale');
select set_artist_availability(current_date + 3, current_date + 4, 'available', null);
select tt.check(not (artist_availability_summary() ->> 'is_stale')::boolean, 'updating clears it');

\echo '--- 7. Custom notifications'
select tt.expect_error($$select send_custom_notification('00000000-0000-0000-0000-00000000f111', 'Hi', 'Hello')$$, '%Super Admin%', 'an artist cannot send custom notifications');
select tt.login('00000000-0000-0000-0000-00000000f102');
select tt.expect_error($$select send_custom_notification('00000000-0000-0000-0000-00000000f110', 'Hi', 'Hello')$$, '%Super Admin%', 'staff cannot');
select tt.login('00000000-0000-0000-0000-00000000f101');
select tt.expect_error($$select send_custom_notification('00000000-0000-0000-0000-00000000f110', 'Hi', 'Hello')$$, '%Super Admin%', 'an admin cannot');
select tt.login('00000000-0000-0000-0000-00000000f100');
select tt.expect_error($$select send_custom_notification('00000000-0000-0000-0000-00000000f110', 'Hi', 'Hello', 'https://evil.example')$$, '%inside Tangy%', 'links stay inside Tangy');
select tt.check((send_custom_notification('00000000-0000-0000-0000-00000000f110', 'Important update', 'Please review your October schedule.', '/artist/calendar') ->> 'in_app')::boolean,
  'a Super Admin sends a custom notification');
select tt.login('00000000-0000-0000-0000-00000000f110');
select tt.check((select title from notifications where type = 'admin.message') = 'Important update', 'the recipient sees it in their notification centre');

\echo '--- 8. Private Super Admin ↔ artist messaging'
select tt.login('00000000-0000-0000-0000-00000000f101');
select tt.expect_error($$select start_private_artist_conversation('00000000-0000-0000-0000-00000000f110', 'Hi', 'Hello')$$, '%Super Admin%', 'an admin cannot open a private thread');
select tt.login('00000000-0000-0000-0000-00000000f100');
create temp table pc as select start_private_artist_conversation('00000000-0000-0000-0000-00000000f110', 'Your October schedule', 'Can we talk about the 18th?') as id;
grant select on pc to authenticated;
select tt.check(tt.notes('00000000-0000-0000-0000-00000000f110', 'message.new') = 1, 'the artist is notified');
select tt.check((tt.note('00000000-0000-0000-0000-00000000f110', 'message.new')).link = '/artist/messages/' || (select id from pc), '… with a link to the conversation');
select tt.login('00000000-0000-0000-0000-00000000f110');
select tt.check((select count(*) from conversation_messages((select id from pc))) = 1, 'the artist reads it');
select send_message((select id from pc), 'Yes — I can do the 18th.');
select tt.check(tt.notes('00000000-0000-0000-0000-00000000f100', 'message.new') = 1, 'the Super Admin is notified of the reply');
select tt.check((tt.note('00000000-0000-0000-0000-00000000f100', 'message.new')).link = '/admin-portal/messages/' || (select id from pc), '… linking to the conversation');
select tt.check(tt.notes('00000000-0000-0000-0000-00000000f101', 'message.new') = 0 and tt.notes('00000000-0000-0000-0000-00000000f104', 'message.new') = 0,
  'nobody outside the conversation is notified');
select tt.login('00000000-0000-0000-0000-00000000f101');
select tt.check((select count(*) from conversations where id = (select id from pc)) = 0 and (select count(*) from messages where conversation_id = (select id from pc)) = 0,
  'another admin cannot read the private conversation');
select tt.expect_error($$select * from conversation_messages((select id from pc))$$, '%not found%', '… or open it through the API');
select tt.check((select count(*) from admin_conversations()) = 0, '… or see it in the admin inbox');
select tt.expect_error($$select send_message((select id from pc), 'Butting in')$$, '%not found%', '… or post in it');
select tt.login('00000000-0000-0000-0000-00000000f104');
select tt.check((select count(*) from messages where conversation_id = (select id from pc)) = 0, 'another Super Admin is not a participant either');
select tt.login('00000000-0000-0000-0000-00000000f111');
select tt.check((select count(*) from messages where conversation_id = (select id from pc)) = 0, 'another artist cannot read it');
select tt.login('00000000-0000-0000-0000-00000000f102');
select tt.check((select count(*) from messages where conversation_id = (select id from pc)) = 0, 'staff cannot read it');
select tt.login('00000000-0000-0000-0000-00000000f103');
select tt.check((select count(*) from messages where conversation_id = (select id from pc)) = 0, 'a sponsor cannot read it');

\echo '--- 9. Roles'
select tt.login('00000000-0000-0000-0000-00000000f101');
select tt.expect_error($$select admin_set_user_role('00000000-0000-0000-0000-00000000f102', 'super_admin', null)$$, '%super admin%', 'an admin cannot grant Super Admin');
select tt.login('00000000-0000-0000-0000-00000000f102');
select tt.check(not has_permission('events.manage'), 'staff cannot manage events');
select tt.expect_error($$select admin_set_user_role('00000000-0000-0000-0000-00000000f103', 'admin', null)$$, '%super admin%', 'staff cannot change roles');
select tt.expect_error($$update profiles set role = 'admin' where id = auth.uid()$$, '%', 'nobody can grant themselves a role');
select tt.check((select role::text from profiles where id = '00000000-0000-0000-0000-00000000f102') = 'staff', '… the role is unchanged');
select tt.login('00000000-0000-0000-0000-00000000f100');
select admin_set_user_role('00000000-0000-0000-0000-00000000f102', 'admin', 'Promoted');
select tt.check((select role::text from profiles where id = '00000000-0000-0000-0000-00000000f102') = 'admin', 'a Super Admin changes the role server-side');
select tt.check((tt.note('00000000-0000-0000-0000-00000000f102', 'role.changed')).body like 'Previous role: Staff · New role: Admin%', 'the person is told their previous and new role');
select tt.check((tt.note('00000000-0000-0000-0000-00000000f102', 'role.changed')).link = '/admin-portal', '… with a link to their dashboard');
select tt.check(exists (select 1 from tt.audits('user.role_changed') where resource_id = '00000000-0000-0000-0000-00000000f102'
  and actor_id = '00000000-0000-0000-0000-00000000f100' and metadata ->> 'from' = 'staff' and metadata ->> 'to' = 'admin'), 'the change is audited (who, whom, from, to)');
select tt.login('00000000-0000-0000-0000-00000000f102');
select tt.check(has_permission('events.manage'), 'the next request already runs with the new role');
select tt.login('00000000-0000-0000-0000-00000000f100');
select admin_set_user_role('00000000-0000-0000-0000-00000000f102', 'staff', 'Back to staff');
select tt.login('00000000-0000-0000-0000-00000000f102');
select tt.check(not has_permission('events.manage'), 'a demotion removes the access at once');
select tt.expect_error($$select save_event_lineup('00000000-0000-0000-0000-00000000e703', '[{"artist_id":"00000000-0000-0000-0000-00000000a110"}]')$$, '%permission%', '… including line-up changes');

\echo '--- 9b. Session page backgrounds'
select tt.logout();
update events set page_background = '#1E2440' where id = '00000000-0000-0000-0000-00000000e703';
update events set page_background = 'cover' where id = '00000000-0000-0000-0000-00000000e703';
update events set page_background = '/media/gallery/tangy2.jpg' where id = '00000000-0000-0000-0000-00000000e703';
select tt.check((select page_background from events where id = '00000000-0000-0000-0000-00000000e703') = '/media/gallery/tangy2.jpg', 'a session takes a colour, its cover or an image link as its background');
select tt.expect_error($$update events set page_background = 'red;background:url(x)' where id = '00000000-0000-0000-0000-00000000e703'$$, '%check constraint%', 'nothing else can reach the page''s CSS');
select tt.expect_error($$update events set page_background = 'javascript:alert(1)' where id = '00000000-0000-0000-0000-00000000e703'$$, '%check constraint%', '… not a script link either');

\echo ''
\echo 'ALL EVENT WORKFLOW DATABASE TESTS PASSED'
rollback;
