-- Tangy Sessions — event booking form (0024).
--
-- Per-event quantity range and optional questions; every booking detail is
-- validated server-side; answers are private to the booker and admins; the
-- whole checkout lands on one booking with its named attendees (0023).
-- One transaction, rolled back at the end. Run: scripts/test-db.sh

\set ON_ERROR_STOP 1
\set QUIET 1
begin;

delete from bookings; delete from waitlist; delete from collaborations; delete from crew_applications;
delete from conversations; delete from notifications; delete from email_outbox;
delete from events; delete from artists; delete from auth.users;

create schema tt;
create function tt.login(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;
create function tt.anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('role', 'anon', true);
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
-- Book as the Edge Function does (service role path), with details.
create function tt.book(p_code text, p_qty int, p_names text[], p_details jsonb, p_event uuid default '00000000-0000-0000-0000-00000000bf01')
returns bookings language sql as $$
  select create_pending_booking('00000000-0000-0000-0000-0000000b0003', p_event, p_code, 'Rahul Sharma', 'rahul@form.tangy.test', '9876543210',
         p_qty, 500 * p_qty, 'gen', null, p_names, p_details);
$$;
grant usage on schema tt to anon, authenticated;
grant execute on all functions in schema tt to anon, authenticated;

insert into auth.users (id, email, aud, role, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000b0001', 'admin@form.tangy.test',  'authenticated', 'authenticated', '{"full_name":"Mira Manager"}'),
  ('00000000-0000-0000-0000-0000000b0002', 'staff@form.tangy.test',  'authenticated', 'authenticated', '{"full_name":"Sam Staff"}'),
  ('00000000-0000-0000-0000-0000000b0003', 'rahul@form.tangy.test',  'authenticated', 'authenticated', '{"full_name":"Rahul Sharma"}'),
  ('00000000-0000-0000-0000-0000000b0004', 'other@form.tangy.test',  'authenticated', 'authenticated', '{"full_name":"Other Patron"}');
update profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000b0001';
update profiles set role = 'staff' where id = '00000000-0000-0000-0000-0000000b0002';

insert into events (id, slug, name, event_date, venue, capacity, price, status) values
  ('00000000-0000-0000-0000-00000000bf01', 'form-a', 'Music Night', current_date + 5, 'Stepwell', 100, 2000, 'on-sale'),
  ('00000000-0000-0000-0000-00000000bf02', 'form-b', 'Quiet Night', current_date + 9, 'Baradari', 100, 800, 'on-sale');
insert into event_assignments (event_id, assignee_role, assignee_id, title, assigned_by) values
  ('00000000-0000-0000-0000-00000000bf01', 'staff', '00000000-0000-0000-0000-0000000b0002', 'Gate', '00000000-0000-0000-0000-0000000b0001');

\echo '--- 1. Event configuration'
select tt.check((select booking_min_quantity = 1 and booking_max_quantity = 10 and booking_questions = '[]'::jsonb from events where slug = 'form-b'),
  'events default to 1–10 tickets and no extra questions');
update events set booking_max_quantity = 6, booking_questions = '[
  {"id":"chairs","type":"number","label":"How many people need chair seating?","required":false,"help":"For guests over 55 or anyone more comfortable on a chair."},
  {"id":"seating_note","type":"long_text","label":"Any seating or accessibility requirement?"},
  {"id":"area","type":"single_select","label":"Which part of Hyderabad are you coming from?","options":["Banjara Hills","Gachibowli","Secunderabad","Old City","Other"]},
  {"id":"dob","type":"date","label":"Date of birth","required":true},
  {"id":"gender","type":"single_select","label":"Gender","options":["Woman","Man","Non-binary","Prefer not to say","Other"]},
  {"id":"diet","type":"multi_select","label":"Food preferences","options":["Veg","Vegan","Jain"]},
  {"id":"first_gig","type":"boolean","label":"First time at a stepwell gig?"}
]'::jsonb where slug = 'form-a';
select tt.check((select jsonb_array_length(booking_questions) = 7 from events where slug = 'form-a'), 'an event can carry its own questions');
select tt.expect_error($$update events set booking_questions = '[{"id":"x","type":"password","label":"Secret"}]' where slug = 'form-b'$$, '%booking_questions_check%', 'unknown question type refused');
select tt.expect_error($$update events set booking_questions = '[{"id":"a","type":"text","label":"A"},{"id":"a","type":"text","label":"B"}]' where slug = 'form-b'$$, '%booking_questions_check%', 'duplicate question ids refused');
select tt.expect_error($$update events set booking_questions = '[{"id":"area","type":"single_select","label":"Area"}]' where slug = 'form-b'$$, '%booking_questions_check%', 'a select without options refused');
select tt.expect_error($$update events set booking_questions = '[{"id":"a","type":"text","label":"A","script":"alert(1)"}]' where slug = 'form-b'$$, '%booking_questions_check%', 'unexpected question keys refused');
select tt.expect_error($$update events set booking_min_quantity = 5, booking_max_quantity = 2 where slug = 'form-b'$$, '%booking_quantity_check%', 'min above max refused');

\echo '--- 2. Checkout validation (server-side)'
select tt.expect_error($$select tt.book('F-QTY', 7, array['A','B','C','D','E','F','G'], '{"answers":{"dob":"1990-05-01"}}')$$, '%INVALID_QUANTITY%', 'more than the event''s maximum refused');
select tt.expect_error($$select tt.book('F-REQ', 2, array['Rahul Sharma','Priya Sharma'], '{"answers":{}}')$$, '%Please answer: Date of birth%', 'required question missing refused');
select tt.expect_error($$select tt.book('F-FUT', 1, array['Rahul Sharma'], '{"answers":{"dob":"2999-01-01"}}')$$, '%valid date%', 'future date of birth refused');
select tt.expect_error($$select tt.book('F-OPT', 1, array['Rahul Sharma'], '{"answers":{"dob":"1990-05-01","area":"Mars"}}')$$, '%Choose an option%', 'answer outside the options refused');
select tt.expect_error($$select tt.book('F-CHR', 2, array['Rahul Sharma','Priya Sharma'], '{"answers":{"dob":"1990-05-01","chairs":3}}')$$, '%from 0 to 2%', 'more chairs than people refused');
select tt.expect_error($$select tt.book('F-NUM', 2, array['Rahul Sharma','Priya Sharma'], '{"answers":{"dob":"1990-05-01","chairs":"two"}}')$$, '%Enter a number%', 'a non-number count refused');
select tt.expect_error($$select tt.book('F-UNK', 1, array['Rahul Sharma'], '{"answers":{"dob":"1990-05-01","ssn":"123"}}')$$, '%does not match%', 'answers to questions the event doesn''t ask are refused');
select tt.expect_error($$select tt.book('F-MUL', 1, array['Rahul Sharma'], '{"answers":{"dob":"1990-05-01","diet":["Veg","Keto"]}}')$$, '%Choose from the options%', 'multi-select outside the options refused');
select tt.expect_error($$select tt.book('F-BOO', 1, array['Rahul Sharma'], '{"answers":{"dob":"1990-05-01","first_gig":"yes"}}')$$, '%yes or no%', 'boolean answer must be true/false');
select tt.expect_error($$select tt.book('F-IG', 1, array['Rahul Sharma'], '{"answers":{"dob":"1990-05-01"},"instagram":"not a handle!"}')$$, '%Instagram%', 'invalid Instagram handle refused');
select tt.expect_error($$select tt.book('F-COL', 1, array['Rahul Sharma'], '{"answers":{"dob":"1990-05-01"},"collab_interests":["admin"]}')$$, '%collaboration interest%', 'unknown collaboration interest refused (no role smuggling)');
select tt.expect_error($$select tt.book('F-NTE', 1, array['Rahul Sharma'], jsonb_build_object('answers', jsonb_build_object('dob','1990-05-01'), 'note', repeat('x', 1001)))$$, '%1000 characters%', 'over-long note refused');
select tt.expect_error($$select tt.book('F-NAM', 2, array['Rahul Sharma','  '], '{"answers":{"dob":"1990-05-01"}}')$$, '%INVALID_ATTENDEE_NAMES%', 'blank attendee name refused');
select tt.check((select count(*) = 0 from bookings where registration_code like 'F-%'), 'refused checkouts created nothing');

\echo '--- 3. A complete checkout'
select tt.book('F-OK', 5, array['Rahul Sharma', 'Priya Sharma', 'Arjun Nair', 'Kavya Singh', 'Rahul Sharma'],
  '{"answers":{"dob":"1990-05-01","chairs":2,"seating_note":"Knee trouble — near the aisle","area":"Old City","diet":["Veg"],"first_gig":true},
    "instagram":"@rahul.sharma","note":"Excited!","collab_interests":["volunteer","sound_technical","volunteer"],"collab_note":"FOH mixing for 5 years"}');
select tt.check((select attendee_names = array['Rahul Sharma', 'Priya Sharma', 'Arjun Nair', 'Kavya Singh', 'Rahul Sharma'] and status = 'pending'
  and booking_answers ->> 'area' = 'Old City' and (booking_answers ->> 'chairs')::int = 2 and contact_instagram = 'rahul.sharma' and customer_note = 'Excited!'
  and collab_interests = array['sound_technical', 'volunteer'] and collab_note = 'FOH mixing for 5 years'
  from bookings where registration_code = 'F-OK'), 'booking stored with names (duplicates allowed), answers, @-less handle, de-duplicated interests');
select tt.check((select count(*) = 0 from tickets t join bookings b on b.id = t.booking_id where b.registration_code = 'F-OK'), 'no attendees before payment');
select tt.book('F-MIN', 1, array['Solo Guest'], '{"answers":{"dob":"1985-01-01"}}');
select tt.check((select booking_answers = '{"dob":"1985-01-01"}'::jsonb and contact_instagram is null and collab_interests is null
  from bookings where registration_code = 'F-MIN'), 'optional fields omitted: stored as empty');
select tt.book('F-B', 2, array['Asha Rao', 'Ravi Rao'], '{}', '00000000-0000-0000-0000-00000000bf02');
select tt.check(exists (select 1 from bookings where registration_code = 'F-B'), 'an event with no questions needs no answers');
select count(*) from confirm_booking_and_issue_tickets((select id from bookings where registration_code = 'F-OK'));
select count(*) from confirm_booking_and_issue_tickets((select id from bookings where registration_code = 'F-OK'));
select tt.check((select count(*) = 5 from tickets t join bookings b on b.id = t.booking_id where b.registration_code = 'F-OK')
  and (select status = 'confirmed' from bookings where registration_code = 'F-OK'), 'payment confirmation creates 5 attendees once (idempotent on repeat)');
select tt.check((select count(distinct t.id) = 5 and count(*) filter (where t.attendee_name = 'Rahul Sharma') = 2
  from tickets t join bookings b on b.id = t.booking_id where b.registration_code = 'F-OK'), 'two attendees named Rahul Sharma are two identities');
select create_pending_booking(null, '00000000-0000-0000-0000-00000000bf01', 'F-COMP', 'Guest list', 'gl@x.test', null, 12, 0, 'gen', null);
select tt.check(exists (select 1 from bookings where registration_code = 'F-COMP' and quantity = 12), 'admin/complimentary path (no checkout details) keeps its own limits');

\echo '--- 4. Privacy of booking details'
update bookings set user_id = '00000000-0000-0000-0000-0000000b0003' where registration_code = 'F-OK';
select tt.login('00000000-0000-0000-0000-0000000b0003');
select tt.check((select booking_answers ->> 'dob' = '1990-05-01' from bookings where registration_code = 'F-OK'), 'the booker can read their own answers');
select tt.check((select count(*) = 5 from tickets t join bookings b on b.id = t.booking_id where b.registration_code = 'F-OK'), 'the booker sees their named attendees');
update bookings set booking_answers = '{}', contact_instagram = 'hacked', collab_interests = array['sponsor'] where registration_code = 'F-OK';
select tt.logout();
select tt.check((select booking_answers ->> 'dob' = '1990-05-01' and contact_instagram = 'rahul.sharma' from bookings where registration_code = 'F-OK'),
  'the booker cannot rewrite stored booking details');
select tt.login('00000000-0000-0000-0000-0000000b0004');
select tt.check(not exists (select 1 from bookings where registration_code = 'F-OK'), 'another customer cannot see the booking or its answers');
select tt.check(not exists (select 1 from tickets t join bookings b on b.id = t.booking_id where b.registration_code = 'F-OK'), 'nor its attendees');
select tt.login('00000000-0000-0000-0000-0000000b0002');
select tt.check(not exists (select 1 from bookings where registration_code = 'F-OK'), 'staff cannot read booking answers (DOB etc.)');
select tt.check((select count(*) = 5 and bool_and(guest_name is not null) from attendee_tickets where registration_code = 'F-OK'), 'staff on the event see attendee names for check-in');
select tt.check(not exists (select 1 from information_schema.columns where table_name = 'attendee_tickets' and column_name in ('booking_answers', 'contact_instagram')),
  'the attendee view never carries answers or Instagram');
with u as (update events set booking_max_quantity = 50 where slug = 'form-a' returning id)
select tt.check(not exists (select 1 from u), 'staff cannot change an event''s booking form');
select tt.login('00000000-0000-0000-0000-0000000b0001');
select tt.check((select booking_answers ->> 'area' = 'Old City' and collab_interests @> array['volunteer'] from bookings where registration_code = 'F-OK'),
  'admins see answers and collaboration interest (leads)');
with u as (update events set booking_max_quantity = 8 where slug = 'form-a' returning id)
select tt.check(exists (select 1 from u), 'admins can edit the booking form');
select tt.check((select count(*) = 5 and bool_and(checked_in_by_name is null)
  from attendee_tickets where registration_code = 'F-OK')
  and exists (select 1 from information_schema.columns where table_name = 'attendee_tickets' and column_name = 'payment_status'),
  'export view carries payment status and checked-in-by');
select tt.anon();
select tt.check((select jsonb_array_length(booking_questions) = 7 from events where slug = 'form-a'), 'the form definition is public (it holds no answers)');
select tt.check(not exists (select 1 from bookings), 'the public sees no bookings');

\echo ''
\echo 'ALL BOOKING FORM DATABASE TESTS PASSED'
rollback;
