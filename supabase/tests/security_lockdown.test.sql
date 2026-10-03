-- Phase 1 security tests (0017_security_lockdown.sql).
--
-- Run with supabase/tests/run_local.sh — a throwaway local PostgreSQL with
-- supabase/tests/local/supabase_shim.sql emulating Supabase's API roles,
-- auth.uid()/auth.role()/auth.jwt(), and default privileges. NEVER run this
-- file against a real project: it inserts fixture users, bookings and
-- tickets.
--
-- Each check impersonates an API request the way PostgREST does: SET ROLE to
-- anon / authenticated / service_role plus request.jwt.claims. Checks that
-- expect an error run in a subtransaction that is ALWAYS rolled back (even
-- if the statement unexpectedly succeeds), so a vulnerable baseline is
-- reported as FAIL without the exploit's side effects leaking into later
-- checks. Running with UP_TO=0016 shows which checks fail before the fix.

\set QUIET on
set client_min_messages = warning;
-- Silence per-check result rows; the report at the end prints them.
\o /dev/null

-- ---------------------------------------------------------------- harness
create schema tap;
create table tap.results (n serial primary key, name text not null, ok boolean not null, detail text);
create table tap.fx (k text primary key, id uuid, val text);
grant usage on schema tap to anon, authenticated, service_role;
grant select, insert on tap.results, tap.fx to anon, authenticated, service_role;
grant usage on all sequences in schema tap to anon, authenticated, service_role;

create function tap.ok(p_name text, p_ok boolean, p_detail text default null) returns void
language sql as $$ insert into tap.results (name, ok, detail) values (p_name, coalesce(p_ok, false), p_detail) $$;

-- Expects p_sql to raise (optionally a specific SQLSTATE). Always rolls back.
create function tap.throws(p_name text, p_sql text, p_state text default null) returns void
language plpgsql as $$
begin
  begin
    execute p_sql;
    raise exception using errcode = 'TAP01', message = 'statement succeeded';
  exception when others then
    if sqlstate = 'TAP01' then
      perform tap.ok(p_name, false, 'expected an error, statement succeeded');
    else
      perform tap.ok(p_name, p_state is null or sqlstate = p_state,
        sqlstate || ': ' || sqlerrm || case when p_state is not null and sqlstate <> p_state then ' (expected ' || p_state || ')' else '' end);
    end if;
  end;
end $$;

-- Expects p_sql to succeed. Rolled back unless p_keep.
create function tap.lives(p_name text, p_sql text, p_keep boolean default false) returns void
language plpgsql as $$
begin
  begin
    execute p_sql;
    if not p_keep then raise exception using errcode = 'TAP02', message = 'rollback'; end if;
    perform tap.ok(p_name, true);
  exception when others then
    if sqlstate = 'TAP02' then perform tap.ok(p_name, true);
    else perform tap.ok(p_name, false, sqlstate || ': ' || sqlerrm); end if;
  end;
end $$;

-- Compares the first column of p_sql (as text) with p_expected. Rolled back unless p_keep.
create function tap.is(p_name text, p_sql text, p_expected text, p_keep boolean default false) returns void
language plpgsql as $$
declare v text;
begin
  begin
    execute p_sql into v;
    if not p_keep then raise exception using errcode = 'TAP02', message = 'rollback'; end if;
    perform tap.ok(p_name, v is not distinct from p_expected, 'got ' || coalesce(v, 'NULL') || ', expected ' || coalesce(p_expected, 'NULL'));
  exception when others then
    if sqlstate = 'TAP02' then
      perform tap.ok(p_name, v is not distinct from p_expected, 'got ' || coalesce(v, 'NULL') || ', expected ' || coalesce(p_expected, 'NULL'));
    else perform tap.ok(p_name, false, sqlstate || ': ' || sqlerrm); end if;
  end;
end $$;

create function tap.login(p_role text, p_sub uuid default null, p_email text default null) returns void
language sql as $$
  select set_config('request.jwt.claims',
    json_build_object('role', p_role, 'sub', p_sub, 'email', p_email)::text, false);
$$;

grant execute on all functions in schema tap to anon, authenticated, service_role;

-- --------------------------------------------------------------- fixtures
-- Created as the superuser with triggers off (session_replication_role =
-- replica) so fixture roles can be set identically on the pre- and
-- post-lockdown schema. handle_new_user still has to run, so users are
-- inserted first with triggers on.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'admin@test'),
  ('00000000-0000-0000-0000-00000000000b', 'super@test'),
  ('00000000-0000-0000-0000-00000000000c', 'staff@test'),
  ('00000000-0000-0000-0000-000000000001', 'a@test'),
  ('00000000-0000-0000-0000-000000000002', 'b@test'),
  ('00000000-0000-0000-0000-000000000003', 'artist@test'),
  ('00000000-0000-0000-0000-000000000004', 'pending.artist@test'),
  ('00000000-0000-0000-0000-000000000005', 'applicant@test'),
  ('00000000-0000-0000-0000-000000000006', 'vendor.app@test'),
  ('00000000-0000-0000-0000-000000000007', 'vol.app@test');

set session_replication_role = replica;
update profiles set role = 'admin' where id = '00000000-0000-0000-0000-00000000000a';
update profiles set role = 'super_admin' where id = '00000000-0000-0000-0000-00000000000b';
update profiles set role = 'staff' where id = '00000000-0000-0000-0000-00000000000c';

insert into events (id, slug, name, event_date, capacity, price, status) values
  ('e0000000-0000-0000-0000-000000000001', 'sec-test', 'Security Test Event', '2030-01-01', 100, 500, 'on-sale'),
  ('e0000000-0000-0000-0000-000000000002', 'sec-empty', 'Event With No Bookings', '2030-01-02', 100, 500, 'draft');

insert into artists (id, user_id, name, email, status) values
  ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'Approved Artist', 'artist@test', 'approved'),
  ('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 'Pending Artist', 'pending.artist@test', 'pending');

insert into artist_availability (artist_id, date, status) values
  ('a0000000-0000-0000-0000-000000000001', '2030-02-01', 'available'),
  ('a0000000-0000-0000-0000-000000000002', '2030-02-01', 'available');

insert into collaborations (id, type, business_name, email, user_id) values
  ('c0000000-0000-0000-0000-000000000001', 'vendor', 'Test Vendor Co', 'vendor.app@test', '00000000-0000-0000-0000-000000000006');
insert into crew_applications (id, name, email, role_interest, category, user_id) values
  ('c0000000-0000-0000-0000-000000000002', 'Vol App', 'vol.app@test', 'Front of House', 'volunteer', '00000000-0000-0000-0000-000000000007');

insert into waitlist (event_id, name, email) values ('e0000000-0000-0000-0000-000000000001', 'Pat A', 'a@test');

insert into conversations (id, subject, created_by) values ('d0000000-0000-0000-0000-000000000001', 'Help', '00000000-0000-0000-0000-000000000001');
insert into conversation_participants (conversation_id, user_id, role) values ('d0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'owner');
set session_replication_role = origin;

-- A confirmed booking with issued tickets, and a still-pending one, both
-- for patron A, made through the same functions the Edge Functions use.
insert into tap.fx (k, id) select 'booking_confirmed', (create_pending_booking(
  '00000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'TST-CONF',
  'Pat A', 'a@test', null, 2, 1000, 'gen', 'order_conf')).id;
insert into tap.fx (k, id) select 'booking_pending', (create_pending_booking(
  '00000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'TST-PEND',
  'Pat A', 'a@test', null, 1, 500, 'gen', 'order_pend')).id;
select confirm_booking_and_issue_tickets((select id from tap.fx where k = 'booking_confirmed'));
insert into tap.fx (k, id, val)
  select 'ticket', id, token from tickets where booking_id = (select id from tap.fx where k = 'booking_confirmed') order by ticket_number limit 1;

-- ================================================================== TESTS

-- 1. Anonymous user cannot execute privileged booking RPCs -----------------
select tap.login('anon');
set role anon;
select tap.throws('01a anon cannot execute create_pending_booking',
  $q$select create_pending_booking(null, 'e0000000-0000-0000-0000-000000000001', 'X-ANON', 'x', 'x@x', null, 1, 0, 'gen', null)$q$, '42501');
select tap.throws('01b anon cannot execute confirm_booking_and_issue_tickets',
  $q$select confirm_booking_and_issue_tickets((select id from tap.fx where k = 'booking_pending'))$q$, '42501');
reset role;

-- 2. Authenticated normal user cannot confirm their own unpaid booking -----
select tap.login('authenticated', '00000000-0000-0000-0000-000000000001', 'a@test');
set role authenticated;
select tap.throws('02a patron cannot execute confirm_booking_and_issue_tickets (free tickets)',
  $q$select confirm_booking_and_issue_tickets((select id from tap.fx where k = 'booking_pending'))$q$, '42501');
select tap.throws('02b patron cannot execute create_pending_booking (arbitrary amount/user)',
  $q$select create_pending_booking('00000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'X-AUTH', 'x', 'x@x', null, 1, 0, 'gen', null)$q$, '42501');
reset role;

-- 2c. The Edge Functions' service-role path still works.
select tap.login('service_role');
set role service_role;
select tap.lives('02c service_role can still create + confirm a booking (Edge Function path)',
  $q$select confirm_booking_and_issue_tickets((create_pending_booking(
       '00000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'X-SVC',
       'Pat B', 'b@test', null, 1, 500, 'gen', 'order_svc')).id)$q$);
reset role;

-- 3/13. Artist applications --------------------------------------------------
select tap.login('authenticated', '00000000-0000-0000-0000-000000000005', 'applicant@test');
set role authenticated;
select tap.throws('03a user cannot insert an already-approved artist',
  $q$insert into artists (user_id, name, email, status) values ('00000000-0000-0000-0000-000000000005', 'Self Approved', 'applicant@test', 'approved')$q$);
select tap.throws('03b user cannot insert a rejected/reviewed artist row either',
  $q$insert into artists (user_id, name, email, status, reviewed_at) values ('00000000-0000-0000-0000-000000000005', 'X', 'applicant@test', 'pending', now())$q$);
select tap.throws('03c user cannot create an artist for another account',
  $q$insert into artists (user_id, name, email) values ('00000000-0000-0000-0000-000000000002', 'Hijack', 'b@test')$q$);
select tap.lives('13 legitimate artist application (own account, pending) still works',
  $q$insert into artists (user_id, name, email, genre, city, status) values ('00000000-0000-0000-0000-000000000005', 'New Artist', 'applicant@test', 'Folk', 'Hyderabad', 'pending')$q$);
select tap.lives('13b legitimate artist application with status omitted defaults to pending',
  $q$insert into artists (user_id, name, email) values ('00000000-0000-0000-0000-000000000005', 'New Artist', 'applicant@test')$q$);
reset role;

select tap.login('anon');
set role anon;
select tap.throws('03d anonymous user cannot create an artist for any account',
  $q$insert into artists (user_id, name, email) values ('00000000-0000-0000-0000-000000000002', 'Anon', 'b@test')$q$);
reset role;

select tap.login('authenticated', '00000000-0000-0000-0000-000000000003', 'artist@test');
set role authenticated;
select tap.throws('03e one artist row per account (unique artists.user_id)',
  $q$insert into artists (user_id, name, email) values ('00000000-0000-0000-0000-000000000003', 'Duplicate', 'artist@test')$q$, '23505');
reset role;

-- 4. User cannot approve their own artist ------------------------------------
select tap.login('authenticated', '00000000-0000-0000-0000-000000000004', 'pending.artist@test');
set role authenticated;
select tap.throws('04a pending artist cannot set own status to approved',
  $q$update artists set status = 'approved' where id = 'a0000000-0000-0000-0000-000000000002'$q$);
select tap.throws('04b pending artist cannot call approve_artist_application on themselves',
  $q$select approve_artist_application('a0000000-0000-0000-0000-000000000002')$q$);
select tap.lives('04c artist can still edit their own profile fields',
  $q$update artists set bio = 'updated', spotify = 'x' where id = 'a0000000-0000-0000-0000-000000000002'$q$);
reset role;

-- 5/6/14. Partner + crew/volunteer applications ------------------------------
select tap.login('authenticated', '00000000-0000-0000-0000-000000000005', 'applicant@test');
set role authenticated;
select tap.throws('05a user cannot insert an approved vendor application',
  $q$insert into collaborations (type, business_name, email, user_id, status) values ('vendor', 'V', 'applicant@test', '00000000-0000-0000-0000-000000000005', 'approved')$q$);
select tap.throws('05b user cannot insert an approved sponsor application',
  $q$insert into collaborations (type, business_name, email, user_id, status) values ('sponsor', 'S', 'applicant@test', '00000000-0000-0000-0000-000000000005', 'approved')$q$);
select tap.throws('05c user cannot insert an approved venue_host application',
  $q$insert into collaborations (type, business_name, email, user_id, status) values ('venue_host', 'H', 'applicant@test', '00000000-0000-0000-0000-000000000005', 'approved')$q$);
select tap.throws('06a user cannot insert an approved crew application',
  $q$insert into crew_applications (name, email, role_interest, category, user_id, status) values ('C', 'applicant@test', 'Sound', 'crew', '00000000-0000-0000-0000-000000000005', 'approved')$q$);
select tap.throws('06b user cannot insert an approved volunteer application',
  $q$insert into crew_applications (name, email, role_interest, category, user_id, status) values ('C', 'applicant@test', 'FOH', 'volunteer', '00000000-0000-0000-0000-000000000005', 'approved')$q$);
select tap.is('06c user cannot update their own application to approved (0 rows)',
  $q$with u as (update crew_applications set status = 'approved' where user_id = '00000000-0000-0000-0000-000000000005' returning 1) select count(*)::text from u$q$, '0');
select tap.lives('14a legitimate vendor application still works',
  $q$insert into collaborations (type, business_name, contact_name, email, phone, details, user_id) values ('vendor', 'Chai Co', 'Me', 'applicant@test', '1', 'd', '00000000-0000-0000-0000-000000000005')$q$);
select tap.lives('14b legitimate sponsor application still works',
  $q$insert into collaborations (type, business_name, email, user_id) values ('sponsor', 'Sponsor Co', 'applicant@test', '00000000-0000-0000-0000-000000000005')$q$);
select tap.lives('14c legitimate venue_host application still works',
  $q$insert into collaborations (type, business_name, email, user_id) values ('venue_host', 'Haveli', 'applicant@test', '00000000-0000-0000-0000-000000000005')$q$);
select tap.lives('14d legitimate crew application still works',
  $q$insert into crew_applications (name, email, phone, role_interest, category, message, user_id) values ('Me', 'applicant@test', '1', 'Sound', 'crew', 'm', '00000000-0000-0000-0000-000000000005')$q$);
select tap.lives('14e legitimate volunteer application still works',
  $q$insert into crew_applications (name, email, phone, role_interest, category, message, user_id) values ('Me', 'applicant@test', '1', 'FOH', 'volunteer', 'm', '00000000-0000-0000-0000-000000000005')$q$);
select tap.throws('06d user cannot file a private enquiry under another account',
  $q$insert into private_enquiries (type, name, email, user_id) values ('wedding', 'X', 'x@x', '00000000-0000-0000-0000-000000000002')$q$);
select tap.lives('14f signed-in private enquiry under own account still works',
  $q$insert into private_enquiries (type, name, email, user_id) values ('wedding', 'Me', 'applicant@test', '00000000-0000-0000-0000-000000000005')$q$);
reset role;

select tap.login('anon');
set role anon;
select tap.throws('06e anonymous user cannot insert an approved private enquiry',
  $q$insert into private_enquiries (type, name, email, status) values ('wedding', 'X', 'x@x', 'approved')$q$);
select tap.lives('14g anonymous private enquiry still works',
  $q$insert into private_enquiries (type, name, email, guest_count) values ('corporate_event', 'X', 'x@x', 40)$q$);
select tap.lives('14h anonymous contact enquiry still works',
  $q$insert into contact_enquiries (name, email, subject, inquiry_type, message) values ('X', 'x@x', 's', 'GENERAL', 'hello')$q$);
select tap.lives('14i anonymous waitlist join still works',
  $q$insert into waitlist (event_id, name, email) values ('e0000000-0000-0000-0000-000000000001', 'X', 'anon.wait@x')$q$);
select tap.throws('14j anonymous user cannot file a private enquiry under an account',
  $q$insert into private_enquiries (type, name, email, user_id) values ('wedding', 'X', 'x@x', '00000000-0000-0000-0000-000000000001')$q$);
reset role;

-- 7. Profile email ----------------------------------------------------------
select tap.login('authenticated', '00000000-0000-0000-0000-000000000002', 'b@test');
set role authenticated;
select tap.throws('07a user cannot change own profiles.email (identity spoofing)',
  $q$update profiles set email = 'a@test' where id = '00000000-0000-0000-0000-000000000002'$q$);
select tap.throws('07b user cannot change own passport_id',
  $q$update profiles set passport_id = 'TS-STOLEN' where id = '00000000-0000-0000-0000-000000000002'$q$);
select tap.is('07c user cannot modify another user''s profile (0 rows)',
  $q$with u as (update profiles set email = 'x@x', full_name = 'x' where id = '00000000-0000-0000-0000-000000000001' returning 1) select count(*)::text from u$q$, '0');
select tap.lives('07d user can still edit own full_name/phone (profile settings)',
  $q$update profiles set full_name = 'Pat B', phone = '+91 1' where id = '00000000-0000-0000-0000-000000000002'$q$);
reset role;

-- A profile row whose email was tampered with BEFORE this lockdown must not
-- unlock someone else's waitlist entries: authorization now reads the email
-- in the signed JWT, not profiles.email.
set session_replication_role = replica;
update profiles set email = 'a@test' where id = '00000000-0000-0000-0000-000000000002';
set session_replication_role = origin;
select tap.login('authenticated', '00000000-0000-0000-0000-000000000002', 'b@test');
set role authenticated;
select tap.is('07e tampered profiles.email does not expose another user''s waitlist entries',
  $q$select count(*)::text from waitlist where email = 'a@test'$q$, '0');
reset role;
set session_replication_role = replica;
update profiles set email = 'b@test' where id = '00000000-0000-0000-0000-000000000002';
set session_replication_role = origin;

select tap.login('authenticated', '00000000-0000-0000-0000-000000000001', 'a@test');
set role authenticated;
select tap.is('07f user still sees their own waitlist entries',
  $q$select count(*)::text from waitlist where email = 'a@test'$q$, '1');
reset role;

-- A real sign-in email change (Supabase Auth updating auth.users, no API
-- JWT) still flows through to profiles.email.
select set_config('request.jwt.claims', '', false);
update auth.users set email = 'b.new@test' where id = '00000000-0000-0000-0000-000000000002';
select tap.is('07g auth email change is synced into profiles.email',
  $q$select email from profiles where id = '00000000-0000-0000-0000-000000000002'$q$, 'b.new@test');
update auth.users set email = 'b@test' where id = '00000000-0000-0000-0000-000000000002';

-- 8. Roles -----------------------------------------------------------------
select tap.login('authenticated', '00000000-0000-0000-0000-000000000001', 'a@test');
set role authenticated;
select tap.throws('08a user cannot change own role',
  $q$update profiles set role = 'admin' where id = '00000000-0000-0000-0000-000000000001'$q$);
reset role;

select tap.login('authenticated', '00000000-0000-0000-0000-00000000000c', 'staff@test');
set role authenticated;
select tap.is('08b staff cannot promote another user (0 rows)',
  $q$with u as (update profiles set role = 'admin' where id = '00000000-0000-0000-0000-000000000001' returning 1) select count(*)::text from u$q$, '0');
reset role;

select tap.login('authenticated', '00000000-0000-0000-0000-00000000000a', 'admin@test');
set role authenticated;
select tap.lives('08c admin can still grant staff',
  $q$update profiles set role = 'staff' where id = '00000000-0000-0000-0000-000000000002'$q$);
select tap.throws('08d admin cannot grant super_admin',
  $q$update profiles set role = 'super_admin' where id = '00000000-0000-0000-0000-000000000002'$q$);
select tap.throws('08e admin cannot promote themselves to super_admin',
  $q$update profiles set role = 'super_admin' where id = '00000000-0000-0000-0000-00000000000a'$q$);
select tap.throws('08f admin cannot demote a super_admin',
  $q$update profiles set role = 'user' where id = '00000000-0000-0000-0000-00000000000b'$q$);
reset role;

select tap.login('authenticated', '00000000-0000-0000-0000-00000000000b', 'super@test');
set role authenticated;
select tap.throws('08g the last super_admin cannot be demoted',
  $q$update profiles set role = 'admin' where id = '00000000-0000-0000-0000-00000000000b'$q$);
select tap.lives('08h super_admin can grant and then revoke super_admin',
  $q$update profiles set role = 'super_admin' where id = '00000000-0000-0000-0000-000000000002';
     update profiles set role = 'user' where id = '00000000-0000-0000-0000-000000000002'$q$);
reset role;

-- Project owner via the SQL editor / Table Editor (no API JWT) can still
-- bootstrap the first admin, as supabase/README.md documents.
select set_config('request.jwt.claims', '', false);
select tap.lives('08i project owner (SQL editor, no JWT) can bootstrap an admin',
  $q$update profiles set role = 'admin' where id = '00000000-0000-0000-0000-000000000002'$q$);

-- 9. Cross-user data access --------------------------------------------------
select tap.login('authenticated', '00000000-0000-0000-0000-000000000002', 'b@test');
set role authenticated;
select tap.is('09a user cannot read another user''s bookings', $q$select count(*)::text from bookings where user_id = '00000000-0000-0000-0000-000000000001'$q$, '0');
select tap.is('09b user cannot read another user''s tickets', $q$select count(*)::text from tickets where user_id = '00000000-0000-0000-0000-000000000001'$q$, '0');
select tap.is('09c user cannot read another user''s profile', $q$select count(*)::text from profiles where id = '00000000-0000-0000-0000-000000000001'$q$, '0');
select tap.is('09d user cannot read another user''s conversation', $q$select count(*)::text from conversations where id = 'd0000000-0000-0000-0000-000000000001'$q$, '0');
reset role;
select tap.login('anon');
set role anon;
select tap.is('09e anon cannot read bookings', $q$select count(*)::text from bookings$q$, '0');
select tap.is('09f anon cannot read tickets', $q$select count(*)::text from tickets$q$, '0');
select tap.is('09g availability of a pending (unapproved) artist is not public',
  $q$select count(*)::text from artist_availability where artist_id = 'a0000000-0000-0000-0000-000000000002'$q$, '0');
select tap.is('09h availability of an approved artist is still public',
  $q$select count(*)::text from artist_availability where artist_id = 'a0000000-0000-0000-0000-000000000001'$q$, '1');
reset role;

-- 10. Event deletion cannot destroy transactional history ------------------
select tap.login('authenticated', '00000000-0000-0000-0000-00000000000a', 'admin@test');
set role authenticated;
select tap.throws('10a admin cannot delete an event that has bookings',
  $q$delete from events where id = 'e0000000-0000-0000-0000-000000000001'$q$, '23503');
select tap.lives('10b admin can still delete an event with no bookings',
  $q$delete from events where id = 'e0000000-0000-0000-0000-000000000002'$q$);
select tap.is('10c admin cannot hard-delete a booking via the API (0 rows)',
  $q$with d as (delete from bookings where id = (select id from tap.fx where k = 'booking_confirmed') returning 1) select count(*)::text from d$q$, '0');
reset role;
select tap.login('authenticated', '00000000-0000-0000-0000-00000000000c', 'staff@test');
set role authenticated;
select tap.is('10d staff cannot hard-delete tickets via the API (0 rows)',
  $q$with d as (delete from tickets where booking_id = (select id from tap.fx where k = 'booking_confirmed') returning 1) select count(*)::text from d$q$, '0');
reset role;
select tap.throws('10e even the owner cannot delete a booking that has issued tickets (FK restrict)',
  $q$delete from bookings where id = (select id from tap.fx where k = 'booking_confirmed')$q$, '23503');
select tap.is('10f booking history intact', $q$select count(*)::text from bookings where event_id = 'e0000000-0000-0000-0000-000000000001'$q$, '2');

-- 11. Authorized admin flows still work ------------------------------------
select tap.login('authenticated', '00000000-0000-0000-0000-00000000000a', 'admin@test');
set role authenticated;
select tap.lives('11a admin approve_artist_application works',
  $q$select approve_artist_application('a0000000-0000-0000-0000-000000000002')$q$);
select tap.lives('11b admin approve_collaboration works', $q$select approve_collaboration('c0000000-0000-0000-0000-000000000001')$q$, true);
select tap.is('11c approve_collaboration provisioned the vendor role',
  $q$select role::text from profiles where id = '00000000-0000-0000-0000-000000000006'$q$, 'vendor');
select tap.lives('11d admin approve_crew_application works', $q$select approve_crew_application('c0000000-0000-0000-0000-000000000002')$q$, true);
select tap.is('11e approve_crew_application provisioned the volunteer role',
  $q$select role::text from profiles where id = '00000000-0000-0000-0000-000000000007'$q$, 'volunteer');
select tap.lives('11f admin can still update a booking status',
  $q$update bookings set status = 'cancelled' where id = (select id from tap.fx where k = 'booking_pending')$q$);
select tap.lives('11g admin can still create/edit events',
  $q$insert into events (slug, name, event_date) values ('sec-new', 'New', '2031-01-01'); update events set featured = true where slug = 'sec-new'$q$);
select tap.lives('11h admin can request an approved artist for a session',
  $q$select create_assignment_request('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'hi')$q$);
select tap.throws('11i admin cannot request a pending (unapproved) artist',
  $q$select create_assignment_request('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'hi')$q$);
reset role;

select tap.login('authenticated', '00000000-0000-0000-0000-00000000000c', 'staff@test');
set role authenticated;
select tap.throws('11j staff cannot pull a patron into someone else''s conversation',
  $q$select assign_conversation('d0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005')$q$);
select tap.lives('11k staff can still assign a conversation to themselves',
  $q$select assign_conversation('d0000000-0000-0000-0000-000000000001')$q$);
reset role;

select tap.login('authenticated', '00000000-0000-0000-0000-000000000001', 'a@test');
set role authenticated;
select tap.lives('11l patron can still open a support conversation',
  $q$select get_or_create_support_conversation('Help')$q$);
reset role;

-- 12. Staff check-in still works -------------------------------------------
select tap.login('authenticated', '00000000-0000-0000-0000-000000000001', 'a@test');
set role authenticated;
select tap.throws('12a patron cannot check in a ticket',
  $q$select check_in_ticket((select val from tap.fx where k = 'ticket'), 'e0000000-0000-0000-0000-000000000001')$q$);
reset role;
select tap.login('authenticated', '00000000-0000-0000-0000-00000000000c', 'staff@test');
set role authenticated;
select tap.is('12b staff check-in of a valid ticket succeeds',
  $q$select check_in_ticket((select val from tap.fx where k = 'ticket'), 'e0000000-0000-0000-0000-000000000001') ->> 'result'$q$, 'valid', true);
select tap.is('12c second scan reports already_checked_in',
  $q$select check_in_ticket((select val from tap.fx where k = 'ticket'), 'e0000000-0000-0000-0000-000000000001') ->> 'result'$q$, 'already_checked_in');
reset role;

-- F. No SECURITY DEFINER function is callable beyond what it needs ---------
-- Allowlist: RLS helper predicates that policies call while evaluating anon
-- and authenticated queries (revoking them would break every policy that
-- uses them). They only ever describe the caller themself.
select tap.is('F1 no SECURITY DEFINER function in public is executable by anon except RLS helpers',
  $q$select coalesce(string_agg(p.proname, ', ' order by p.proname), '')
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prosecdef
       and has_function_privilege('anon', p.oid, 'execute')
       and p.proname not in ('current_role_name', 'is_admin', 'is_staff_or_admin', 'is_participant', 'is_own_assignment')$q$, '');
select tap.is('F2 no SECURITY DEFINER function in public is granted to PUBLIC',
  $q$select coalesce(string_agg(p.proname, ', ' order by p.proname), '')
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prosecdef
       and exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a where a.grantee = 0 and a.privilege_type = 'EXECUTE')$q$, '');
select tap.is('F3 booking/ticket issuing functions are executable by service_role only',
  $q$select coalesce(string_agg(p.proname || ':' || r, ', ' order by p.proname, r), '')
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     cross join unnest(array['anon', 'authenticated']) r
     where n.nspname = 'public' and p.proname in ('create_pending_booking', 'confirm_booking_and_issue_tickets')
       and has_function_privilege(r, p.oid, 'execute')$q$, '');
select tap.is('F4 trigger functions are not executable by API roles',
  $q$select coalesce(string_agg(distinct p.proname, ', ' order by p.proname), '')
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     cross join unnest(array['anon', 'authenticated']) r
     where n.nspname = 'public' and p.prorettype = 'trigger'::regtype
       and has_function_privilege(r, p.oid, 'execute')$q$, '');

-- ------------------------------------------------------------------ report
reset role;
\o
\pset format aligned
\pset tuples_only on
select case when ok then 'PASS' else 'FAIL' end || '  ' || name || case when ok or detail is null then '' else '   -- ' || detail end
from tap.results order by n;
\pset tuples_only off
select count(*) filter (where ok) as passed, count(*) filter (where not ok) as failed, count(*) as total from tap.results;
do $$
begin
  if exists (select 1 from tap.results where not ok) then
    raise exception 'security tests failed: % of %', (select count(*) from tap.results where not ok), (select count(*) from tap.results);
  end if;
end $$;
