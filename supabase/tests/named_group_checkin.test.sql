-- Tangy Sessions — named attendees, one group QR, partial check-in (0023).
--
-- Names are captured before payment and land on each ticket at issuance; the
-- booking QR resolves to the booking; staff check in the named attendees who
-- are present; the server admits them all-or-none and keeps a per-attendee
-- history. Every existing guarantee (event scoping, invalid/cancelled/unpaid,
-- duplicate prevention, per-ticket QRs, staff/volunteer permissions) holds.
-- Cross-connection races are exercised in e2e/groupcheckin.mjs.
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
-- Read as the database owner (tests only; never exposed to clients).
create function tt.gt(p_code text) returns text language sql security definer as $$ select group_token from bookings where registration_code = p_code $$;
create function tt.bid(p_code text) returns uuid language sql security definer as $$ select id from bookings where registration_code = p_code $$;
create function tt.att(p_code text, p_name text) returns uuid language sql security definer as $$
  select t.id from tickets t join bookings b on b.id = t.booking_id where b.registration_code = p_code and t.attendee_name = p_name $$;
create function tt.ids(p_code text) returns uuid[] language sql security definer as $$
  select array_agg(t.id order by t.ticket_number) from tickets t join bookings b on b.id = t.booking_id where b.registration_code = p_code $$;
create function tt.tok(p_ticket text) returns text language sql security definer as $$ select token from tickets where ticket_number = p_ticket $$;
create function tt.in_names(p_code text) returns text language sql security definer as $$
  select coalesce(string_agg(t.attendee_name, ',' order by t.ticket_number), '') from tickets t join bookings b on b.id = t.booking_id
  where b.registration_code = p_code and t.status = 'checked_in' $$;
create function tt.rows(p_code text) returns bigint language sql security definer as $$
  select count(*) from checkins c join tickets t on t.id = c.ticket_id join bookings b on b.id = t.booking_id where b.registration_code = p_code $$;
create function tt.ci(p_code text, p_ids uuid[], p_method text default 'qr') returns jsonb language sql as $$
  select check_in_ticket(tt.gt(p_code), '00000000-0000-0000-0000-0000000ea001', p_method, null, p_ids);
$$;
create function tt.peek(p_code text) returns jsonb language sql as $$
  select check_in_ticket(tt.gt(p_code), '00000000-0000-0000-0000-0000000ea001', 'qr', null, null, true);
$$;
grant usage on schema tt to anon, authenticated;
grant execute on all functions in schema tt to anon, authenticated;

insert into auth.users (id, email, aud, role, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000f0001', 'admin@grp.tangy.test',   'authenticated', 'authenticated', '{"full_name":"Mira Manager"}'),
  ('00000000-0000-0000-0000-0000000f0002', 'staffa@grp.tangy.test',  'authenticated', 'authenticated', '{"full_name":"Staff A"}'),
  ('00000000-0000-0000-0000-0000000f0003', 'staffb@grp.tangy.test',  'authenticated', 'authenticated', '{"full_name":"Staff B"}'),
  ('00000000-0000-0000-0000-0000000f0004', 'staffc@grp.tangy.test',  'authenticated', 'authenticated', '{"full_name":"Staff Elsewhere"}'),
  ('00000000-0000-0000-0000-0000000f0005', 'vol@grp.tangy.test',     'authenticated', 'authenticated', '{"full_name":"Rohan Das"}'),
  ('00000000-0000-0000-0000-0000000f0006', 'patron@grp.tangy.test',  'authenticated', 'authenticated', '{"full_name":"Rahul Sharma"}');
update profiles set role = 'admin'     where id = '00000000-0000-0000-0000-0000000f0001';
update profiles set role = 'staff'     where id in ('00000000-0000-0000-0000-0000000f0002', '00000000-0000-0000-0000-0000000f0003', '00000000-0000-0000-0000-0000000f0004');
update profiles set role = 'volunteer' where id = '00000000-0000-0000-0000-0000000f0005';

insert into events (id, slug, name, event_date, venue, capacity, price, status) values
  ('00000000-0000-0000-0000-0000000ea001', 'grp-a', 'Music Night', current_date, 'Stepwell', 200, 500, 'on-sale'),
  ('00000000-0000-0000-0000-0000000ea002', 'grp-b', 'Other Night', current_date + 3, 'Baradari', 200, 500, 'on-sale');
insert into event_assignments (event_id, assignee_role, assignee_id, title, assigned_by) values
  ('00000000-0000-0000-0000-0000000ea001', 'staff', '00000000-0000-0000-0000-0000000f0002', 'Gate 1', '00000000-0000-0000-0000-0000000f0001'),
  ('00000000-0000-0000-0000-0000000ea001', 'staff', '00000000-0000-0000-0000-0000000f0003', 'Gate 2', '00000000-0000-0000-0000-0000000f0001'),
  ('00000000-0000-0000-0000-0000000ea002', 'staff', '00000000-0000-0000-0000-0000000f0004', 'Gate 1', '00000000-0000-0000-0000-0000000f0001'),
  ('00000000-0000-0000-0000-0000000ea001', 'volunteer', '00000000-0000-0000-0000-0000000f0005', 'Gate helper', '00000000-0000-0000-0000-0000000f0001');

\echo '--- 1. Names captured before payment, validated, copied to tickets'
select tt.expect_error($$select create_pending_booking(null, '00000000-0000-0000-0000-0000000ea001', 'TG-BAD1', 'Rahul Sharma', 'r@x.test', null, 3, 1500, 'gen', null, array['Rahul Sharma', 'Priya Mehta'])$$,
  '%INVALID_ATTENDEE_NAMES%', 'fewer names than tickets refused');
select tt.expect_error($$select create_pending_booking(null, '00000000-0000-0000-0000-0000000ea001', 'TG-BAD2', 'Rahul Sharma', 'r@x.test', null, 2, 1000, 'gen', null, array['Rahul Sharma', '   '])$$,
  '%INVALID_ATTENDEE_NAMES%', 'whitespace-only name refused');
select tt.expect_error($$select create_pending_booking(null, '00000000-0000-0000-0000-0000000ea001', 'TG-BAD3', 'Rahul Sharma', 'r@x.test', null, 2, 1000, 'gen', null, array['Rahul Sharma', null])$$,
  '%INVALID_ATTENDEE_NAMES%', 'missing name refused');
select tt.expect_error($$select create_pending_booking(null, '00000000-0000-0000-0000-0000000ea001', 'TG-BAD4', 'Rahul Sharma', 'r@x.test', null, 1, 500, 'gen', null, array[repeat('x', 121)])$$,
  '%INVALID_ATTENDEE_NAMES%', 'over-long name refused');
select tt.expect_error($$insert into bookings (registration_code, event_id, attendee_name, attendee_email, quantity, amount, attendee_names) values ('TG-RAW', '00000000-0000-0000-0000-0000000ea001', 'x', 'x@x.test', 2, 0, array['A'])$$,
  '%attendee_names_check%', 'the table itself refuses a name list that does not match the quantity');

do $$
declare
  a uuid := '00000000-0000-0000-0000-0000000ea001';
  b bookings;
begin
  b := create_pending_booking('00000000-0000-0000-0000-0000000f0006', a, 'TG-1024', 'Rahul Sharma', 'rahul@x.test', null, 5, 2500, 'gen', null,
         array['  Rahul Sharma ', 'Priya Mehta', 'Arjun Nair', 'Kavya Singh', 'Neha Verma']);
  perform confirm_booking_and_issue_tickets(b.id);
  b := create_pending_booking(null, a, 'TG-SOLO', 'Rahul Sharma', 'solo@x.test', null, 1, 500, 'gen', null, array['Rahul Sharma']);
  perform confirm_booking_and_issue_tickets(b.id);
  b := create_pending_booking(null, a, 'TG-DUO', 'Sam Iyer', 'duo@x.test', null, 2, 1000, 'gen', null, array['Sam Iyer', 'Sam Iyer']);  -- same name twice is allowed
  perform confirm_booking_and_issue_tickets(b.id);
  b := create_pending_booking(null, a, 'TG-TEN', 'Arjun Rao', 'ten@x.test', null, 10, 5000, 'gen', null,
         array['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10']);
  perform confirm_booking_and_issue_tickets(b.id);
  b := create_pending_booking(null, a, 'TG-OTHER', 'Omar Ali', 'other@x.test', null, 2, 1000, 'gen', null, array['Omar Ali', 'Zoya Khan']);
  perform confirm_booking_and_issue_tickets(b.id);
  b := create_pending_booking(null, a, 'TG-CXL', 'Cyrus Bhatt', 'cxl@x.test', null, 2, 1000, 'gen', null, array['Cyrus Bhatt', 'Dia Bhatt']);
  perform confirm_booking_and_issue_tickets(b.id);
  b := create_pending_booking(null, a, 'TG-PART', 'Esha Rao', 'part@x.test', null, 3, 1500, 'gen', null, array['Esha Rao', 'Farah Rao', 'Gita Rao']);
  perform confirm_booking_and_issue_tickets(b.id);
  b := create_pending_booking(null, a, 'TG-OLD', 'Legacy Buyer', 'old@x.test', null, 2, 1000, 'gen', null);  -- pre-0023 style: no names
  perform confirm_booking_and_issue_tickets(b.id);
  perform create_pending_booking(null, a, 'TG-UNPAID', 'Hari Rao', 'unpaid@x.test', null, 2, 1000, 'gen', null, array['Hari Rao', 'Ira Rao']);
  b := create_pending_booking(null, '00000000-0000-0000-0000-0000000ea002', 'TG-B', 'Priya Nair', 'b@x.test', null, 2, 1000, 'gen', null, array['Priya Nair', 'Kiran Nair']);
  perform confirm_booking_and_issue_tickets(b.id);
end $$;
select tt.check((select string_agg(t.attendee_name, ',' order by t.ticket_number) from tickets t join bookings b on b.id = t.booking_id where b.registration_code = 'TG-1024')
  = 'Rahul Sharma,Priya Mehta,Arjun Nair,Kavya Singh,Neha Verma', 'five named attendee records, in order, names trimmed');
select tt.check((select count(*) = 0 from tickets t join bookings b on b.id = t.booking_id where b.registration_code = 'TG-UNPAID'), 'no attendee records before payment');
select tt.check((select bool_and(t.attendee_name is null) from tickets t join bookings b on b.id = t.booking_id where b.registration_code = 'TG-OLD'), 'bookings without names get no invented names');
select tt.check((select count(*) from bookings where group_token is null) = 0 and (select bool_and(group_token ~ '^[0-9a-f]{40}$') from bookings)
  and (select count(distinct group_token) from bookings) = (select count(*) from bookings), 'every booking has one opaque, unique group token');

\echo '--- 2. Scan -> select Rahul, Priya, Arjun -> later Kavya, Neha -> complete'
select tt.login('00000000-0000-0000-0000-0000000f0002');
select tt.check((select r ->> 'result' = 'ready' and (r ->> 'party_size')::int = 5 and (r ->> 'checked_in')::int = 0 and (r ->> 'remaining')::int = 5
  and jsonb_array_length(r -> 'attendees') = 5 and r -> 'attendees' -> 0 ->> 'name' = 'Rahul Sharma' and r -> 'attendees' -> 4 ->> 'status' = 'valid'
  and r ->> 'event_name' = 'Music Night' from (select tt.peek('TG-1024') r) s), 'scan shows 5 named attendees, all pending, 0 / 5');
select tt.check(tt.rows('TG-1024') = 0, 'scanning writes nothing');
select tt.check((select r ->> 'result' = 'valid' and (r ->> 'quantity')::int = 3 and (r ->> 'checked_in')::int = 3 and (r ->> 'remaining')::int = 2
  from (select tt.ci('TG-1024', array[tt.att('TG-1024', 'Rahul Sharma'), tt.att('TG-1024', 'Priya Mehta'), tt.att('TG-1024', 'Arjun Nair')]) r) s),
  'check in selected (3) -> 3 / 5, 2 remaining (quantity derived from the selection)');
select tt.check(tt.in_names('TG-1024') = 'Rahul Sharma,Priya Mehta,Arjun Nair', 'exactly Rahul, Priya and Arjun are checked in');
select tt.check((select r -> 'attendees' -> 3 ->> 'status' = 'valid' and r -> 'attendees' -> 0 ->> 'checked_in_by_name' = 'Staff A'
  from (select tt.peek('TG-1024') r) s), 'same QR later: Kavya pending, Rahul checked in by Staff A');
select tt.check((tt.ci('TG-1024', array[tt.att('TG-1024', 'Rahul Sharma')])) ->> 'result' = 'attendee_already_checked_in', 'already checked-in attendee refused');
select tt.check((tt.ci('TG-1024', array[tt.att('TG-1024', 'Kavya Singh'), tt.att('TG-1024', 'Rahul Sharma')])) ->> 'result' = 'attendee_already_checked_in',
  'mixed selection with a checked-in attendee is refused whole');
select tt.check(tt.in_names('TG-1024') = 'Rahul Sharma,Priya Mehta,Arjun Nair', 'the refused request admitted nobody (Kavya still pending)');
select tt.login('00000000-0000-0000-0000-0000000f0003');
select tt.check((select r ->> 'result' = 'valid' and (r ->> 'checked_in')::int = 5 and (r ->> 'remaining')::int = 0 and r ->> 'checked_in_by_name' = 'Staff B'
  and r -> 'admitted' = '["Kavya Singh", "Neha Verma"]'::jsonb
  from (select tt.ci('TG-1024', array[tt.att('TG-1024', 'Kavya Singh'), tt.att('TG-1024', 'Neha Verma')]) r) s), 'Staff B checks in Kavya and Neha -> 5 / 5');
select tt.check((select r ->> 'result' = 'already_checked_in' and (r ->> 'checked_in')::int = 5
  and not exists (select 1 from jsonb_array_elements(r -> 'attendees') x where x ->> 'status' = 'valid')
  from (select tt.peek('TG-1024') r) s), 'scan after 5 / 5: all attendees already checked in, none selectable');
select tt.check(tt.rows('TG-1024') = 5, 'exactly one attendance record per attendee');

\echo '--- 3. Selection rules'
select tt.login('00000000-0000-0000-0000-0000000f0002');
select tt.check((tt.ci('TG-TEN', array[]::uuid[])) ->> 'result' = 'invalid_selection', 'empty selection refused');
select tt.check((tt.ci('TG-TEN', null)) ->> 'result' = 'invalid_selection', 'missing selection refused');
select tt.check((tt.ci('TG-TEN', array[tt.att('TG-TEN', 'A1'), tt.att('TG-TEN', 'A1')])) ->> 'result' = 'invalid_selection', 'same attendee selected twice refused');
select tt.check((tt.ci('TG-TEN', array[tt.att('TG-TEN', 'A1'), tt.att('TG-OTHER', 'Zoya Khan')])) ->> 'result' = 'invalid_attendee', 'attendee from another booking (same event) refused');
select tt.check((tt.ci('TG-TEN', array[tt.att('TG-B', 'Kiran Nair')])) ->> 'result' = 'invalid_attendee', 'attendee from another event refused');
select tt.check((tt.ci('TG-TEN', array[gen_random_uuid()])) ->> 'result' = 'invalid_attendee', 'forged attendee id refused');
select tt.check(tt.rows('TG-TEN') + tt.rows('TG-OTHER') + tt.rows('TG-B') = 0, 'refused selections wrote nothing anywhere');
select tt.check((tt.ci('TG-TEN', array[tt.att('TG-TEN', 'A1')])) ->> 'result' = 'valid', '10 attendees: first arrival of one');
select tt.check((tt.ci('TG-TEN', array[tt.att('TG-TEN', 'A2'), tt.att('TG-TEN', 'A3'), tt.att('TG-TEN', 'A4'), tt.att('TG-TEN', 'A5')])) ->> 'result' = 'valid', 'then four more');
select tt.check((select (r ->> 'checked_in')::int = 10 from (select tt.ci('TG-TEN', array[tt.att('TG-TEN', 'A6'), tt.att('TG-TEN', 'A7'), tt.att('TG-TEN', 'A8'), tt.att('TG-TEN', 'A9'), tt.att('TG-TEN', 'A10')]) r) s),
  'final group completes 10 / 10');
select tt.check((select r ->> 'result' = 'valid' and (r ->> 'checked_in')::int = 2
  from (select tt.ci('TG-DUO', tt.ids('TG-DUO')) r) s), 'duplicate names are distinct attendees; both arrive together');
select tt.check((select r ->> 'result' = 'valid' and (r ->> 'checked_in')::int = 1 and (r ->> 'party_size')::int = 1
  from (select tt.ci('TG-SOLO', array[tt.att('TG-SOLO', 'Rahul Sharma')]) r) s), 'single attendee via booking QR: 1 / 1');
select tt.check((tt.peek('TG-SOLO')) ->> 'result' = 'already_checked_in', 'single attendee rescanned: already checked in');

\echo '--- 4. Per-ticket QRs keep working alongside'
select tt.check((select r ->> 'result' = 'valid' and r ->> 'guest_name' = 'Esha Rao' from (select check_in_ticket(tt.tok('TG-PART-01'), '00000000-0000-0000-0000-0000000ea001') r) s),
  'individual ticket QR checks in its named attendee');
select tt.check((select r -> 'attendees' -> 0 ->> 'status' = 'checked_in' and (r ->> 'remaining')::int = 2 from (select tt.peek('TG-PART') r) s),
  'booking QR sees Esha already in');
select tt.check((tt.ci('TG-PART', array[tt.att('TG-PART', 'Esha Rao')])) ->> 'result' = 'attendee_already_checked_in', 'booking QR cannot re-admit Esha');
select tt.check((check_in_ticket(tt.tok('TG-PART-02'), '00000000-0000-0000-0000-0000000ea001', 'qr', null, array[tt.att('TG-PART', 'Gita Rao')])) ->> 'result' = 'invalid_attendee',
  'a ticket QR cannot be used to admit a different attendee');
select tt.check(not exists (select ticket_id from checkins group by ticket_id having count(*) > 1), 'never more than one attendance row per attendee');

\echo '--- 5. Event scoping, invalid, unpaid, cancelled, refunded, unnamed'
select tt.check((select r ->> 'result' = 'wrong_event' and r ->> 'ticket_event_name' = 'Other Night'
  from (select check_in_ticket(tt.gt('TG-B'), '00000000-0000-0000-0000-0000000ea001', 'qr', null, array[tt.att('TG-B', 'Priya Nair')]) r) s), 'Other Night booking at Music Night -> wrong event');
select tt.check(tt.rows('TG-B') = 0, 'wrong event writes nothing');
select tt.check((check_in_ticket('0000000000000000000000000000000000000000', '00000000-0000-0000-0000-0000000ea001', 'qr', null, null, true)) ->> 'result' = 'not_found', 'unknown QR -> invalid');
select tt.check((tt.peek('TG-UNPAID')) ->> 'result' = 'payment_not_confirmed', 'unpaid booking refused');
select tt.logout();
update bookings set status = 'cancelled' where registration_code = 'TG-CXL';
update tickets set status = 'cancelled' where booking_id = tt.bid('TG-CXL');
update tickets set status = 'cancelled' where ticket_number = 'TG-PART-03';
select tt.login('00000000-0000-0000-0000-0000000f0002');
select tt.check((tt.ci('TG-CXL', array[tt.att('TG-CXL', 'Dia Bhatt')])) ->> 'result' = 'cancelled', 'cancelled booking refused');
select tt.check((select jsonb_array_length(r -> 'attendees') = 2 and (r ->> 'party_size')::int = 2 from (select tt.peek('TG-PART') r) s), 'a cancelled ticket leaves the attendee list');
select tt.check((tt.ci('TG-PART', array[tt.att('TG-PART', 'Gita Rao')])) ->> 'result' = 'invalid_attendee', 'a cancelled attendee cannot be checked in');
select tt.check((select r -> 'attendees' -> 0 ->> 'name' is null and jsonb_array_length(r -> 'attendees') = 2 from (select tt.peek('TG-OLD') r) s),
  'a pre-0023 booking lists its attendees unnamed (UI shows "Guest N")');
select tt.check((tt.ci('TG-OLD', tt.ids('TG-OLD'))) ->> 'result' = 'valid', 'and can still be checked in');

\echo '--- 6. Permissions and server-controlled state'
select tt.login('00000000-0000-0000-0000-0000000f0004');
select tt.check((tt.ci('TG-PART', array[tt.att('TG-PART', 'Farah Rao')])) ->> 'result' = 'not_assigned', 'staff on another event refused');
select tt.login('00000000-0000-0000-0000-0000000f0005');
select tt.expect_error($$select tt.ci('TG-PART', array[tt.att('TG-PART', 'Farah Rao')])$$, '%permission to check in%', 'volunteer without a grant refused');
select tt.login('00000000-0000-0000-0000-0000000f0006');
select tt.expect_error($$select tt.ci('TG-PART', array[tt.att('TG-PART', 'Farah Rao')])$$, '%permission to check in%', 'a customer cannot check anyone in');
update tickets set status = 'checked_in', attendee_name = 'Hacker' where booking_id = tt.bid('TG-1024');
update checkins set checked_in_by = auth.uid() where true;
insert into checkins (booking_id, ticket_id, event_id) select booking_id, id, event_id from tickets where false;
select tt.check((select count(*) from tickets where booking_id = tt.bid('TG-PART')) = 0, 'a customer cannot read other bookings'' attendees');
select tt.logout();
select tt.check(tt.in_names('TG-1024') = 'Rahul Sharma,Priya Mehta,Arjun Nair,Kavya Singh,Neha Verma'
  and not exists (select 1 from tickets where attendee_name = 'Hacker') and not exists (select 1 from checkins c where c.checked_in_by = '00000000-0000-0000-0000-0000000f0006'),
  'customer writes to attendee state / check-in history are silently blocked by RLS');
select tt.login('00000000-0000-0000-0000-0000000f0006');
select tt.expect_error($$insert into checkins (booking_id, ticket_id, event_id, checked_in_by) values (tt.bid('TG-PART'), tt.att('TG-PART', 'Farah Rao'), '00000000-0000-0000-0000-0000000ea001', auth.uid())$$,
  '%row-level security%', 'a customer cannot insert a check-in record');
select tt.check((select count(*) = 5 and bool_and(attendee_name is not null) from tickets where booking_id = tt.bid('TG-1024')), 'the customer can read their own named attendees');
select tt.anon();
select tt.expect_error($$select check_in_ticket('x', '00000000-0000-0000-0000-0000000ea001', 'qr', null, null)$$, '%permission denied%', 'anonymous cannot call check-in');
select tt.check((select count(*) from tickets) = 0, 'anonymous sees no attendee records');
select tt.expect_error($$select 1 from attendee_tickets$$, '%permission denied%', 'anonymous cannot query the attendee view');

\echo '--- 7. History, read model, reporting'
select tt.login('00000000-0000-0000-0000-0000000f0002');
select tt.check((select count(*) = 5 and count(distinct batch_id) = 2
  and bool_and((attendee_name in ('Rahul Sharma', 'Priya Mehta', 'Arjun Nair') and checked_in_by_name = 'Staff A')
            or (attendee_name in ('Kavya Singh', 'Neha Verma') and checked_in_by_name = 'Staff B'))
  from booking_checkin_history(tt.bid('TG-1024'))), 'history: one row per attendee, who checked each in, grouped into 2 arrivals');
select tt.check((select party_size = 2 and party_checked_in = 1 and party_remaining = 1 and group_token is not null and guest_name = 'Farah Rao'
  from attendee_tickets where registration_code = 'TG-PART' and ticket_number = 'TG-PART-02'), 'attendee view: named attendee + party counts + group token');
select tt.check((select group_token is null from attendee_tickets where registration_code = 'TG-1024' limit 1), 'no group token once everyone is in');
select tt.login('00000000-0000-0000-0000-0000000f0004');
select tt.check(not exists (select 1 from attendee_tickets where registration_code = 'TG-PART'), 'other-event staff cannot see these attendees');
select tt.expect_error($$select * from booking_checkin_history(tt.bid('TG-1024'))$$, '%access%', 'other-event staff cannot read the history');
select tt.login('00000000-0000-0000-0000-0000000f0001');
select tt.check((select (s ->> 'tickets_issued')::int = (select count(*) from tickets where event_id = '00000000-0000-0000-0000-0000000ea001' and status <> 'cancelled')
  and (s ->> 'checked_in')::int = (select count(*) from tickets where event_id = '00000000-0000-0000-0000-0000000ea001' and status = 'checked_in')
  from (select event_checkin_stats('00000000-0000-0000-0000-0000000ea001') s) x), 'event stats count attendees, not bookings');
select tt.logout();
select tt.check((select count(*) = 1 from audit_logs where action = 'checkin.scan' and resource_type = 'booking'
  and metadata ->> 'registration_code' = 'TG-1024' and (metadata ->> 'quantity')::int = 2), 'each arrival is audited once with its derived quantity');
select tt.check(not exists (
  select 1 from bookings b where (select count(*) from checkins c join tickets t on t.id = c.ticket_id where t.booking_id = b.id) > b.quantity
), 'invariant: no booking has more check-ins than attendees');

\echo ''
\echo 'ALL NAMED GROUP CHECK-IN DATABASE TESTS PASSED'
rollback;
