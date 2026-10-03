-- Tangy Sessions — Admin System database tests (RBAC, RLS, RPCs, audit).
--
-- Runs entirely inside one transaction that is ROLLED BACK at the end, so it
-- never leaves data behind. Requires migrations 0001–0017 applied to a local
-- Supabase database. Run with:  scripts/test-db.sh
--
-- Each role is impersonated exactly the way PostgREST does it: SET ROLE
-- authenticated/anon + request.jwt.claims. Every assertion therefore goes
-- through the real RLS policies and SECURITY DEFINER checks.

\set ON_ERROR_STOP 1
\set QUIET 1
begin;

-- Start from an empty transactional state so counts are deterministic even on
-- a local stack holding other test data. DELETE (not TRUNCATE ... CASCADE)
-- honours each foreign key's ON DELETE rule, so reference data seeded by the
-- migrations (permissions, settings, announcements) survives; the rollback at
-- the end restores everything else.
delete from conversations;
delete from bookings; delete from waitlist; delete from collaborations; delete from crew_applications; delete from application_reviews;
delete from announcements where audience = 'staff';
delete from events; delete from artists; delete from auth.users;
alter table audit_logs disable trigger audit_logs_append_only;
delete from audit_logs;  -- last: the deletes above are themselves audited
alter table audit_logs enable trigger audit_logs_append_only;

create schema tt;

-- ---------------------------------------------------------------------------
-- Helpers (schema tt — created inside the transaction, rolled back with it)
-- ---------------------------------------------------------------------------
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

create function tt.audits(p_action text) returns setof audit_logs language sql security definer as $$
  -- now() is the transaction start, so this sees only rows written by this run.
  select * from audit_logs where action = p_action and created_at >= now();
$$;

grant usage on schema tt to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Fixtures (as postgres — no JWT, the documented bootstrap path)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, aud, role, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000a001', 'root@dbtest.tangy.test',    'authenticated', 'authenticated', '{"full_name":"Root Super"}'),
  ('00000000-0000-0000-0000-00000000a002', 'manager@dbtest.tangy.test', 'authenticated', 'authenticated', '{"full_name":"Mira Manager"}'),
  ('00000000-0000-0000-0000-00000000a003', 'staff@dbtest.tangy.test',   'authenticated', 'authenticated', '{"full_name":"Sam Staff"}'),
  ('00000000-0000-0000-0000-00000000a004', 'staff2@dbtest.tangy.test',  'authenticated', 'authenticated', '{"full_name":"Tara Staff"}'),
  ('00000000-0000-0000-0000-00000000a005', 'patron@dbtest.tangy.test',  'authenticated', 'authenticated', '{"full_name":"Pat Patron"}'),
  ('00000000-0000-0000-0000-00000000a006', 'vendor@dbtest.tangy.test',  'authenticated', 'authenticated', '{"full_name":"Vik Vendor"}'),
  ('00000000-0000-0000-0000-00000000a007', 'crew@dbtest.tangy.test',    'authenticated', 'authenticated', '{"full_name":"Cam Crew"}');

update profiles set role = 'super_admin' where id = '00000000-0000-0000-0000-00000000a001';
update profiles set role = 'admin'       where id = '00000000-0000-0000-0000-00000000a002';
update profiles set role = 'staff'       where id in ('00000000-0000-0000-0000-00000000a003', '00000000-0000-0000-0000-00000000a004');

insert into events (id, slug, name, event_date, venue, capacity, price, status) values
  ('00000000-0000-0000-0000-0000000e0001', 'test-a', 'Test Night A', current_date, 'Test Hall', 5, 500, 'on-sale'),
  ('00000000-0000-0000-0000-0000000e0002', 'test-b', 'Test Night B', current_date + 7, 'Test Hall', 50, 700, 'on-sale'),
  ('00000000-0000-0000-0000-0000000e0003', 'test-draft', 'Test Draft', current_date + 30, null, 10, 0, 'draft');

\echo '--- 1. Permission sets'
select tt.login('00000000-0000-0000-0000-00000000a001');
select tt.check(array_length(my_permissions(), 1) = 39, 'super admin has all 39 permissions (29 + 9 content permissions from 0028 + staff.invite from 0030)');
select tt.login('00000000-0000-0000-0000-00000000a002');
select tt.check(array_length(my_permissions(), 1) = 31, 'admin has 31 permissions (21 + 9 content permissions from 0028 + staff.invite from 0030)');
select tt.check(not has_permission('settings.manage') and not has_permission('audit.view') and not has_permission('roles.manage'), 'admin lacks settings/audit/roles');
select tt.login('00000000-0000-0000-0000-00000000a003');
select tt.check(my_permissions() = array['announcements.view','attendees.view_assigned','checkin.history','checkin.perform','dashboard.view','events.view_assigned','tasks.view_own'], 'staff has exactly the 7 staff permissions');
select tt.check(not is_admin() and not is_staff_or_admin(), 'staff is not admin-level (is_staff_or_admin tightened)');
select tt.login('00000000-0000-0000-0000-00000000a005');
select tt.check(my_permissions() = '{}', 'patron has no console permissions');

\echo '--- 2. Role escalation is blocked'
select tt.login('00000000-0000-0000-0000-00000000a005');
select tt.expect_error($$update profiles set role = 'super_admin' where id = '00000000-0000-0000-0000-00000000a005'$$, '%cannot change your own role%', 'patron cannot self-promote via direct update');
select tt.login('00000000-0000-0000-0000-00000000a002');
select tt.expect_error($$update profiles set role = 'super_admin' where id = '00000000-0000-0000-0000-00000000a003'$$, '%Only a super admin%', 'admin cannot promote via direct update');
select tt.expect_error($$select admin_set_user_role('00000000-0000-0000-0000-00000000a003', 'admin')$$, '%Only a super admin%', 'admin cannot call admin_set_user_role');
select tt.expect_error($$update profiles set role = 'super_admin' where id = '00000000-0000-0000-0000-00000000a002'$$, '%cannot change your own role%', 'admin cannot self-promote');
select tt.login('00000000-0000-0000-0000-00000000a001');
select tt.expect_error($$select admin_set_user_role('00000000-0000-0000-0000-00000000a001', 'admin')$$, '%cannot change your own role%', 'super admin cannot change own role');
select admin_set_user_role('00000000-0000-0000-0000-00000000a007', 'staff', 'test promotion');
select tt.check((select role from profiles where id = '00000000-0000-0000-0000-00000000a007') = 'staff', 'super admin can change another user''s role');
select admin_set_user_role('00000000-0000-0000-0000-00000000a007', 'user', 'revert');
select tt.check(exists (select 1 from tt.audits('user.role_changed') where resource_id = '00000000-0000-0000-0000-00000000a007' and metadata ->> 'reason' = 'test promotion'), 'role change is audited with reason');

\echo '--- 3. Applications workflow'
select tt.login('00000000-0000-0000-0000-00000000a006');
insert into collaborations (id, type, business_name, contact_name, email, user_id)
  values ('00000000-0000-0000-0000-0000000c0001', 'vendor', 'Chai Cart Co', 'Vik', 'vendor@dbtest.tangy.test', '00000000-0000-0000-0000-00000000a006');
select tt.expect_error($$insert into collaborations (type, business_name, email, user_id) values ('sponsor', 'Spoof', 'x@y.z', '00000000-0000-0000-0000-00000000a005')$$, '%row-level security%', 'applicant cannot submit on someone else''s behalf');
select tt.check((select count(*) from applications_overview) = 1, 'applicant sees only their own application');
select tt.login('00000000-0000-0000-0000-00000000a007');
insert into crew_applications (id, name, email, role_interest, category, user_id)
  values ('00000000-0000-0000-0000-0000000c0002', 'Cam Crew', 'crew@dbtest.tangy.test', 'Sound', 'crew', '00000000-0000-0000-0000-00000000a007');

select tt.login('00000000-0000-0000-0000-00000000a003');
select tt.expect_error($$select approve_collaboration('00000000-0000-0000-0000-0000000c0001')$$, '%permission to review%', 'staff cannot approve applications');
select tt.check((select count(*) from applications_overview) = 0, 'staff cannot list applications');

select tt.login('00000000-0000-0000-0000-00000000a002');
select tt.check((select count(*) from applications_overview where status = 'pending') >= 2, 'admin sees all pending applications');
select approve_collaboration('00000000-0000-0000-0000-0000000c0001', 'Great fit for Vol. 5');
select tt.check((select status = 'approved' and reviewed_by = '00000000-0000-0000-0000-00000000a002' and review_notes is null and reviewed_at is not null
                      from collaborations where id = '00000000-0000-0000-0000-0000000c0001')
            and (select notes from application_reviews where source_table = 'collaborations' and source_id = '00000000-0000-0000-0000-0000000c0001') = 'Great fit for Vol. 5',
  'approval records status, reviewer and time; the note goes to the private review (0033)');
select tt.check((select role from profiles where id = '00000000-0000-0000-0000-00000000a006') = 'vendor', 'approval activates the vendor role');
select tt.check(exists (select 1 from vendor_profiles where id = '00000000-0000-0000-0000-00000000a006'), 'approval provisions vendor profile');
select tt.check(exists (select 1 from application_notifications where source_id = '00000000-0000-0000-0000-0000000c0001' and status = 'pending'), 'approval queues approval email');
select tt.expect_error($$select approve_collaboration('00000000-0000-0000-0000-0000000c0001')$$, '%already been reviewed%', 'cannot approve twice');
select reject_crew_application('00000000-0000-0000-0000-0000000c0002', 'No sound roles open this season');
select tt.check((select status = 'rejected' and decision_reason is not null from crew_applications where id = '00000000-0000-0000-0000-0000000c0002'), 'rejection kept with reason (not deleted)');
select tt.check((select role from profiles where id = '00000000-0000-0000-0000-00000000a007') = 'user', 'rejection does not grant a role');
select tt.expect_error($$select approve_crew_application('00000000-0000-0000-0000-0000000c0002')$$, '%already been reviewed%', 'rejected application is closed');
select tt.check((select count(*) from tt.audits('application.approved')) + (select count(*) from tt.audits('application.rejected')) = 2, 'approval and rejection are audited');

\echo '--- 4. Events + team assignments'
select tt.login('00000000-0000-0000-0000-00000000a003');
select tt.expect_error($$insert into events (slug, name, event_date) values ('staff-evt', 'Nope', current_date)$$, '%row-level security%', 'staff cannot create events');
select tt.expect_error($$insert into event_assignments (event_id, assignee_role, assignee_id, title) values ('00000000-0000-0000-0000-0000000e0001', 'staff', '00000000-0000-0000-0000-00000000a003', 'self')$$, '%row-level security%', 'staff cannot assign themselves');

select tt.login('00000000-0000-0000-0000-00000000a002');
update events set price = 550, status = 'on-sale' where id = '00000000-0000-0000-0000-0000000e0001';
select tt.check(exists (select 1 from tt.audits('event.updated') where resource_id = '00000000-0000-0000-0000-0000000e0001'
                             and metadata -> 'changed' ? 'price' and not (metadata -> 'changed' ? 'status')), 'event update audited with changed columns only');
insert into event_assignments (event_id, assignee_role, assignee_id, title)
  values ('00000000-0000-0000-0000-0000000e0001', 'staff', '00000000-0000-0000-0000-00000000a003', 'Front gate');
insert into event_assignments (event_id, assignee_role, assignee_id, title)
  values ('00000000-0000-0000-0000-0000000e0003', 'staff', '00000000-0000-0000-0000-00000000a003', 'Setup');
select tt.check((select assigned_by from event_assignments where title = 'Front gate') = '00000000-0000-0000-0000-00000000a002', 'assigned_by defaults to the acting admin');
select tt.expect_error($$insert into event_assignments (event_id, assignee_role, assignee_id, title) values ('00000000-0000-0000-0000-0000000e0001', 'staff', '00000000-0000-0000-0000-00000000a005', 'x')$$, '%Only staff/admin accounts%', 'a patron cannot be assigned as event staff');
insert into event_tasks (assignment_id, title, due_at)
  select id, 'Open gate at 6pm', now() from event_assignments where title = 'Front gate';

select tt.login('00000000-0000-0000-0000-00000000a003');
select tt.check((select array_agg(name order by name) from my_checkin_events()) = array['Test Night A'], 'staff check-in events = assigned, non-draft only');
select tt.check(exists (select 1 from events where id = '00000000-0000-0000-0000-0000000e0003'), 'assigned staff can read their draft event');
select tt.check((staff_dashboard() -> 'events' -> 0 ->> 'name') = 'Test Night A' and jsonb_array_length(staff_dashboard() -> 'tasks') = 1, 'staff dashboard shows assigned event and today''s task');
update event_tasks set status = 'done' where title = 'Open gate at 6pm';
select tt.check((select status from event_tasks where title = 'Open gate at 6pm') = 'done', 'staff can complete their own task');
select tt.expect_error($$update event_tasks set title = 'renamed' where title = 'Open gate at 6pm'$$, '%Only staff/admin can change task details%', 'staff cannot edit task details');
select tt.login('00000000-0000-0000-0000-00000000a004');
select tt.check((select count(*) from my_checkin_events()) = 0, 'unassigned staff sees no check-in events');
select tt.check(not exists (select 1 from events where id = '00000000-0000-0000-0000-0000000e0003'), 'unassigned staff cannot read the draft event');

\echo '--- 5. Bookings, tickets, payment gating'
select tt.logout();
set local role service_role;
select create_pending_booking('00000000-0000-0000-0000-00000000a005', '00000000-0000-0000-0000-0000000e0001', 'TS-TESTA001', 'Pat Patron', 'patron@dbtest.tangy.test', '9999999999', 2, 1100, 'gen', 'order_a1');
select create_pending_booking('00000000-0000-0000-0000-00000000a005', '00000000-0000-0000-0000-0000000e0002', 'TS-TESTB001', 'Pat Patron', 'patron@dbtest.tangy.test', null, 1, 700, 'vip', 'order_b1');
select create_pending_booking('00000000-0000-0000-0000-00000000a005', '00000000-0000-0000-0000-0000000e0001', 'TS-TESTA002', 'Pat Patron', 'patron@dbtest.tangy.test', null, 1, 550, 'gen', 'order_a2');
select count(*) from confirm_booking_and_issue_tickets((select id from bookings where registration_code = 'TS-TESTA001'));
select count(*) from confirm_booking_and_issue_tickets((select id from bookings where registration_code = 'TS-TESTB001'));
update bookings set razorpay_payment_id = 'pay_test_1', razorpay_signature_verified = true where registration_code in ('TS-TESTA001', 'TS-TESTB001');
select tt.logout();

select tt.login('00000000-0000-0000-0000-00000000a005');
select tt.expect_error($$select confirm_booking_and_issue_tickets((select id from bookings where registration_code = 'TS-TESTA002'))$$, '%permission denied%', 'patron cannot self-issue tickets for an unpaid booking (security fix)');
select tt.expect_error($$select create_pending_booking(auth.uid(), '00000000-0000-0000-0000-0000000e0001', 'TS-HACK', 'x', 'x@y.z', null, 1, 1, 'gen', null)$$, '%permission denied%', 'patron cannot create bookings directly');
update bookings set status = 'confirmed' where registration_code = 'TS-TESTA002'; -- RLS: silently 0 rows
select tt.check((select status from bookings where registration_code = 'TS-TESTA002') = 'pending', 'patron booking still pending after attempted tampering');
select tt.check((select count(*) from tickets) = 3, 'patron sees own tickets');
select tt.check((select count(*) from attendee_tickets) = 0, 'patron sees nothing in attendee_tickets');

select tt.login('00000000-0000-0000-0000-00000000a003');
select tt.check((select count(*) from bookings) = 0 and (select count(*) from tickets) = 0 and (select count(*) from checkins) = 0, 'staff cannot read bookings/tickets/checkins tables directly');
select tt.check((select count(*) from attendee_tickets) = 2 and (select bool_and(event_name = 'Test Night A') from attendee_tickets), 'staff attendee list is limited to assigned event');
select tt.check((select bool_and(attendee_email is null and attendee_phone is null) from attendee_tickets), 'staff do not see attendee contact details');
select tt.check((select count(*) from waitlist) = 0 and (select count(*) from conversations) = 0, 'staff no longer read waitlist/support inbox');

select tt.login('00000000-0000-0000-0000-00000000a002');
select tt.check((select count(*) from attendee_tickets) = 3 and (select bool_and(attendee_email is not null) from attendee_tickets), 'admin sees all attendees with contact details');
update bookings set status = 'confirmed' where registration_code = 'TS-TESTA002'; -- RLS: silently 0 rows
select tt.check((select status from bookings where registration_code = 'TS-TESTA002') = 'pending', 'booking still pending after admin direct-update attempt');

\echo '--- 6. QR check-in'
select tt.logout();
create temp table t_all_tokens as select token, ticket_number, event_id from tickets;
grant select on t_all_tokens to authenticated, anon;

select tt.login('00000000-0000-0000-0000-00000000a003');
select tt.check((check_in_ticket((select token from t_all_tokens where ticket_number = 'TS-TESTA001-01'), '00000000-0000-0000-0000-0000000e0001')) ->> 'result' = 'valid', 'valid QR checks in');
select tt.check((check_in_ticket((select token from t_all_tokens where ticket_number = 'TS-TESTA001-01'), '00000000-0000-0000-0000-0000000e0001')) ->> 'result' = 'already_checked_in', 'second scan reports already checked in');
select tt.check((check_in_ticket((select token from t_all_tokens where ticket_number = 'TS-TESTA001-01'), '00000000-0000-0000-0000-0000000e0001')) ->> 'checked_in_by_name' = 'Sam Staff', 'already-checked-in shows who checked them in');
select tt.check((check_in_ticket((select token from t_all_tokens where ticket_number = 'TS-TESTB001-01'), '00000000-0000-0000-0000-0000000e0001')) ->> 'result' = 'wrong_event', 'ticket for another event is rejected');
select tt.check((check_in_ticket('not-a-real-token', '00000000-0000-0000-0000-0000000e0001')) ->> 'result' = 'not_found', 'invalid QR is rejected');
select tt.check((check_in_ticket((select token from t_all_tokens where ticket_number = 'TS-TESTB001-01'), '00000000-0000-0000-0000-0000000e0002')) ->> 'result' = 'not_assigned', 'staff cannot check in for an unassigned event');
select tt.check((check_in_ticket((select token from t_all_tokens where ticket_number = 'TS-TESTA001-02'), '00000000-0000-0000-0000-0000000e0001', 'manual', 'QR cracked')) ->> 'method' = 'manual', 'manual check-in works and is labelled');
select tt.logout();
select tt.check((select count(*) from checkins where ticket_id = (select id from tickets where ticket_number = 'TS-TESTA001-01')) = 1, 'duplicate scans create exactly one attendance record');
select tt.check((select count(*) from tt.audits('checkin.manual')) = 1 and (select count(*) from tt.audits('checkin.scan')) = 1, 'scan and manual check-ins are audited separately');

select tt.login('00000000-0000-0000-0000-00000000a003');
select tt.check((event_checkin_stats('00000000-0000-0000-0000-0000000e0001') ->> 'checked_in')::int = 2, 'check-in stats reflect server state');
select tt.check((select count(*) from get_checkin_history(null, true)) = 2, 'staff check-in history shows own check-ins');
select tt.expect_error($$select event_checkin_stats('00000000-0000-0000-0000-0000000e0002')$$, '%do not have access%', 'staff cannot read stats for unassigned event');
select tt.login('00000000-0000-0000-0000-00000000a005');
select tt.expect_error($$select check_in_ticket('x', '00000000-0000-0000-0000-0000000e0001')$$, '%permission to check in%', 'patron cannot call check-in');
select tt.check((select count(*) from checkins) = 2, 'patron can read own check-ins (passport stamps)');

select tt.login('00000000-0000-0000-0000-00000000a001');
select update_system_setting('checkin.allow_manual', 'false');
select tt.login('00000000-0000-0000-0000-00000000a002');
select tt.check((check_in_ticket((select token from t_all_tokens where ticket_number = 'TS-TESTB001-01'), '00000000-0000-0000-0000-0000000e0002', 'manual')) ->> 'result' = 'manual_disabled', 'manual check-in blocked server-side when disabled');
select tt.check((check_in_ticket((select token from t_all_tokens where ticket_number = 'TS-TESTB001-01'), '00000000-0000-0000-0000-0000000e0002')) ->> 'result' = 'valid', 'admin can check in for any event');

\echo '--- 7. Booking administration'
select tt.login('00000000-0000-0000-0000-00000000a003');
select tt.expect_error($$select admin_cancel_booking((select booking_id from attendee_tickets limit 1), 'x')$$, '%permission to manage bookings%', 'staff cannot cancel bookings');
select tt.login('00000000-0000-0000-0000-00000000a002');
select tt.expect_error($$select admin_cancel_booking((select id from bookings where registration_code = 'TS-TESTA001'), 'change of plans')$$, '%already been checked in%', 'cannot cancel a booking with a checked-in ticket');
select tt.expect_error($$select admin_cancel_booking((select id from bookings where registration_code = 'TS-TESTA002'), '')$$, '%reason is required%', 'cancellation requires a reason');
select admin_cancel_booking((select id from bookings where registration_code = 'TS-TESTA002'), 'Duplicate checkout');
select tt.check((select status = 'cancelled' and cancel_reason = 'Duplicate checkout' and cancelled_by = '00000000-0000-0000-0000-00000000a002' from bookings where registration_code = 'TS-TESTA002'), 'booking cancelled with reason + actor');
select tt.expect_error($$select admin_record_refund((select id from bookings where registration_code = 'TS-TESTB001'), 'refund', '')$$, '%refund reference%', 'refund needs Razorpay reference');
select tt.expect_error($$select admin_record_refund((select id from bookings where registration_code = 'TS-TESTA002'), 'x', 'rfnd_1')$$, '%Only paid online bookings%', 'cannot record refund on an unpaid (pending->cancelled) booking');
select tt.check((admin_create_comp_booking('00000000-0000-0000-0000-0000000e0001', 'Guest Artist +1', 'guest@dbtest.tangy.test', null, 2, 'vip', 'Artist guest list')).status = 'confirmed', 'complimentary booking confirmed');
select tt.check((select amount = 0 and source = 'complimentary' from bookings where attendee_email = 'guest@dbtest.tangy.test')
                     and (select count(*) from tickets t join bookings b on b.id = t.booking_id where b.attendee_email = 'guest@dbtest.tangy.test') = 2, 'comp booking has amount 0 and issues tickets');
select tt.expect_error($$select admin_create_comp_booking('00000000-0000-0000-0000-0000000e0001', 'Too many', 'x@dbtest.tangy.test', null, 2, 'gen', 'overflow')$$, '%Not enough capacity%', 'comp booking respects capacity');
select tt.expect_error($$select admin_cancel_ticket((select id from tickets where ticket_number = 'TS-TESTA001-01'), 'x')$$, '%Only a valid%', 'cannot cancel a checked-in ticket');
select tt.expect_error($$delete from events where id = '00000000-0000-0000-0000-0000000e0001'$$, '%has bookings%', 'event with bookings cannot be deleted');
update events set status = 'cancelled' where id = '00000000-0000-0000-0000-0000000e0002';
select tt.check((select status from events where id = '00000000-0000-0000-0000-0000000e0002') = 'cancelled', 'events can be cancelled instead');
select tt.expect_error($$update events set status = 'live-ish' where id = '00000000-0000-0000-0000-0000000e0002'$$, '%events_status_check%', 'event status is constrained to known values');

\echo '--- 8. Announcements'
select tt.login('00000000-0000-0000-0000-00000000a002');
insert into announcements (title, body, audience, event_id, status) values
  ('Gate A opens 6pm', 'Staff briefing', 'staff', '00000000-0000-0000-0000-0000000e0001', 'published'),
  ('Night B load-in', 'Crew only', 'staff', '00000000-0000-0000-0000-0000000e0002', 'published'),
  ('All-staff note', 'General', 'staff', null, 'published'),
  ('Unpublished', 'Draft', 'all', null, 'draft'),
  ('Public notice', 'For everyone', 'all', null, 'published');
select tt.check((select author_id from announcements where title = 'Gate A opens 6pm') = '00000000-0000-0000-0000-00000000a002', 'announcement author recorded');
select tt.login('00000000-0000-0000-0000-00000000a003');
select tt.check((select array_agg(title order by title) from announcements where audience = 'staff') = array['All-staff note', 'Gate A opens 6pm'], 'staff see only announcements for their events + general staff notes');
select tt.expect_error($$insert into announcements (title, status) values ('staff post', 'published')$$, '%row-level security%', 'staff cannot publish announcements');
select tt.anon();
select tt.check(not exists (select 1 from announcements where audience = 'staff' or status <> 'published'), 'public never sees staff or unpublished announcements');
-- Production starts with no announcements (the mock seed is not part of
-- supabase/production-bootstrap/): what matters is that a live public one,
-- created through the CMS, reaches visitors.
select tt.check((select count(*) from announcements where title = 'Public notice' and audience = 'all') = 1, 'visitors see live public announcements');

\echo '--- 9. Settings'
select tt.login('00000000-0000-0000-0000-00000000a002');
select tt.check((select count(*) from system_settings) = 0, 'admin cannot read system settings table');
select tt.expect_error($$select update_system_setting('events.default_capacity', '300')$$, '%Only a super admin%', 'admin cannot change settings');
select tt.login('00000000-0000-0000-0000-00000000a003');
select tt.check((get_runtime_settings() ->> 'auth.admin_idle_timeout_minutes')::int = 60, 'console users get exposed runtime settings');
select tt.login('00000000-0000-0000-0000-00000000a005');
select tt.check(get_runtime_settings() = '{}', 'patrons get no runtime settings');
select tt.login('00000000-0000-0000-0000-00000000a001');
select tt.expect_error($$select update_system_setting('events.default_capacity', '"lots"')$$, '%Invalid value%', 'settings are type-validated');
select tt.expect_error($$select update_system_setting('stripe.secret_key', '"sk_live"')$$, '%Unknown setting%', 'arbitrary (secret) settings cannot be created');
select update_system_setting('events.default_capacity', '300');
select tt.check(exists (select 1 from tt.audits('settings.updated') where resource_id = 'events.default_capacity'), 'setting change audited');

\echo '--- 10. Deactivation'
select admin_set_user_active('00000000-0000-0000-0000-00000000a004', false, 'left the team');
select tt.login('00000000-0000-0000-0000-00000000a004');
select tt.check(my_permissions() = '{}' and not has_permission('checkin.perform'), 'deactivated account loses all permissions immediately');
select tt.expect_error($$select check_in_ticket('x', '00000000-0000-0000-0000-0000000e0001')$$, '%permission to check in%', 'deactivated staff cannot check in');
select tt.login('00000000-0000-0000-0000-00000000a001');
select tt.expect_error($$select admin_set_user_active('00000000-0000-0000-0000-00000000a001', false)$$, '%cannot deactivate your own%', 'super admin cannot deactivate themselves');

\echo '--- 11. Dashboards & reports'
select tt.login('00000000-0000-0000-0000-00000000a002');
select tt.check((admin_dashboard_summary() -> 'revenue' ->> 'total')::int = 1800, 'revenue = sum of confirmed paid bookings (1100 + 700, comp excluded)');
select tt.check((admin_dashboard_summary() -> 'tickets' ->> 'checked_in')::int = 3, 'dashboard check-in count is real');
select tt.check((admin_dashboard_summary() -> 'people' ->> 'staff')::int = 1, 'dashboard counts active staff only');
select tt.check((select tickets_sold from report_event_performance() where name = 'Test Night A') = 4
                     and (select check_in_rate from report_event_performance() where name = 'Test Night A') = 50.0, 'event performance report: sold + check-in rate');
select tt.check((select count(*) from report_revenue_by_month()) >= 1, 'revenue by month report');
select tt.check((select approved from report_applications() where type = 'vendor') = 1, 'applications report');
select tt.check((select checkins from report_staff_activity() where name = 'Sam Staff') = 2, 'staff activity report');
select tt.login('00000000-0000-0000-0000-00000000a003');
select tt.expect_error($$select admin_dashboard_summary()$$, '%do not have access%', 'staff cannot load org dashboard');
select tt.expect_error($$select * from report_event_performance()$$, '%do not have access%', 'staff cannot run reports');

\echo '--- 12. Audit log protection'
select tt.login('00000000-0000-0000-0000-00000000a003');
select log_auth_event('auth.login');
select tt.check((select count(*) from audit_logs) = 0, 'staff cannot read audit logs');
select tt.expect_error($$select audit_write('fake', 'x')$$, '%permission denied%', 'clients cannot write arbitrary audit rows');
select tt.login('00000000-0000-0000-0000-00000000a005');
select log_auth_event('auth.login');
select tt.login('00000000-0000-0000-0000-00000000a002');
select tt.check((select count(*) from audit_logs) = 0, 'admin (manager) cannot read audit logs');
select tt.login('00000000-0000-0000-0000-00000000a001');
select tt.check((select count(*) from audit_logs where action = 'auth.login') = 1, 'console login audited; patron login ignored');
select tt.check((select count(*) from audit_logs) > 10, 'super admin can read audit logs');
select tt.check(not exists (select 1 from audit_logs where metadata::text ilike '%token%' and metadata::text ~ '[0-9a-f]{40}'), 'audit metadata never contains ticket tokens');
select tt.logout();
select tt.expect_error($$update audit_logs set action = 'tampered'$$, '%append-only%', 'audit logs cannot be modified (even as owner)');
select tt.expect_error($$delete from audit_logs$$, '%append-only%', 'audit logs cannot be deleted (even as owner)');

\echo '--- 13. Bootstrap path still works'
update profiles set role = 'admin' where id = '00000000-0000-0000-0000-00000000a007';
select tt.check((select role from profiles where id = '00000000-0000-0000-0000-00000000a007') = 'admin', 'SQL editor / service role can still bootstrap roles');

\echo ''
\echo 'ALL ADMIN SYSTEM DATABASE TESTS PASSED'
rollback;
