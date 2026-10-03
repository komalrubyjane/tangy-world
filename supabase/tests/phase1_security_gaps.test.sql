-- Tangy Sessions — Phase 1 security (0035_phase1_security_gaps.sql), plus
-- regression checks for the Phase 1 protections 0017–0034 already provide.
-- One transaction, rolled back at the end. Run: scripts/test-db.sh
-- (or scripts/test-db-local.sh without Docker).

\set ON_ERROR_STOP 1
\set QUIET 1
begin;

delete from conversations;
delete from bookings; delete from waitlist; delete from collaborations; delete from crew_applications;
delete from private_enquiries; delete from contact_enquiries; delete from assignment_requests;
delete from events; delete from artists; delete from auth.users;

create schema tt;
create function tt.login(p_uid uuid, p_email text default null) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated', 'email', p_email)::text, true);
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
-- Rows a statement affects, without keeping its effect.
create function tt.affected(p_sql text) returns int language plpgsql as $$
declare n int;
begin
  begin
    execute p_sql;
    get diagnostics n = row_count;
    raise exception using errcode = 'TT001', message = 'rollback';
  exception when sqlstate 'TT001' then
    return n;
  end;
end $$;
grant usage on schema tt to anon, authenticated;
grant execute on all functions in schema tt to anon, authenticated;

insert into auth.users (id, email, aud, role, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000e501', 'admin@p1.tangy.test',    'authenticated', 'authenticated', '{"full_name":"Ada Admin"}'),
  ('00000000-0000-0000-0000-00000000e502', 'admin2@p1.tangy.test',   'authenticated', 'authenticated', '{"full_name":"Ari Admin"}'),
  ('00000000-0000-0000-0000-00000000e503', 'super@p1.tangy.test',    'authenticated', 'authenticated', '{"full_name":"Sia Super"}'),
  ('00000000-0000-0000-0000-00000000e504', 'pat.a@p1.tangy.test',    'authenticated', 'authenticated', '{"full_name":"Pat A"}'),
  ('00000000-0000-0000-0000-00000000e505', 'pat.b@p1.tangy.test',    'authenticated', 'authenticated', '{"full_name":"Pat B"}'),
  ('00000000-0000-0000-0000-00000000e506', 'artist@p1.tangy.test',   'authenticated', 'authenticated', '{"full_name":"Approved Artist"}'),
  ('00000000-0000-0000-0000-00000000e507', 'pending@p1.tangy.test',  'authenticated', 'authenticated', '{"full_name":"Pending Artist"}'),
  ('00000000-0000-0000-0000-00000000e508', 'applicant@p1.tangy.test','authenticated', 'authenticated', '{"full_name":"New Applicant"}');
update profiles set role = 'admin' where id in ('00000000-0000-0000-0000-00000000e501', '00000000-0000-0000-0000-00000000e502');
update profiles set role = 'super_admin' where id = '00000000-0000-0000-0000-00000000e503';
update profiles set role = 'artist' where id = '00000000-0000-0000-0000-00000000e506';

insert into events (id, slug, name, event_date, capacity, price, status) values
  ('00000000-0000-0000-0000-00000000e5e1', 'p1-session', 'P1 Session', current_date + 30, 100, 500, 'on-sale');
insert into artists (id, user_id, name, email, status) values
  ('00000000-0000-0000-0000-00000000e5a1', '00000000-0000-0000-0000-00000000e506', 'Approved Artist', 'artist@p1.tangy.test', 'approved'),
  ('00000000-0000-0000-0000-00000000e5a2', '00000000-0000-0000-0000-00000000e507', 'Pending Artist', 'pending@p1.tangy.test', 'pending');
insert into artist_availability (artist_id, date, status) values
  ('00000000-0000-0000-0000-00000000e5a2', current_date + 40, 'available');
insert into bookings (id, registration_code, user_id, event_id, attendee_name, attendee_email, quantity, amount, status) values
  ('00000000-0000-0000-0000-00000000e5b1', 'P1-0001', '00000000-0000-0000-0000-00000000e504', '00000000-0000-0000-0000-00000000e5e1',
   'Pat A', 'pat.a@p1.tangy.test', 1, 590, 'confirmed');
-- A pre-0027 anonymous waitlist row (email only, no user_id).
insert into waitlist (event_id, name, email) values ('00000000-0000-0000-0000-00000000e5e1', 'Pat A', 'pat.a@p1.tangy.test');

\echo '--- 1. Function privileges'
select tt.check(not exists (
  select 1 from pg_proc p cross join unnest(array['anon', 'authenticated']) r
  where p.pronamespace = 'public'::regnamespace and p.proname in ('create_pending_booking', 'confirm_booking_and_issue_tickets')
    and has_function_privilege(r, p.oid, 'execute')), 'booking/ticket issuing RPCs: not executable by anon or authenticated (0017)');
select tt.check((select bool_and(has_function_privilege('service_role', oid, 'execute')) from pg_proc
  where pronamespace = 'public'::regnamespace and proname in ('create_pending_booking', 'confirm_booking_and_issue_tickets')),
  'booking/ticket issuing RPCs: still executable by service_role (Edge Functions)');
select tt.check(not exists (
  select 1 from pg_proc p cross join unnest(array['anon', 'authenticated']) r
  where p.pronamespace = 'public'::regnamespace and p.prorettype = 'trigger'::regtype
    and has_function_privilege(r, p.oid, 'execute')), 'no trigger function is executable by anon or authenticated');
select tt.check(not exists (
  select 1 from pg_proc p cross join unnest(array['anon', 'authenticated']) r
  where p.pronamespace = 'public'::regnamespace and p.proname in (
    'send_event_reminders', 'notify_overdue_tasks', 'notify_expiring_access',
    'event_member_ids', 'partner_kind', 'member_link', 'notification_allowed', 'has_active_access')
    and has_function_privilege(r, p.oid, 'execute')), 'internal job/lookup functions: not executable by anon or authenticated');
select tt.check(not exists (
  select 1 from pg_proc p where p.pronamespace = 'public'::regnamespace and p.prosecdef
    and exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
                where a.grantee = 0 and a.privilege_type = 'EXECUTE')), 'no SECURITY DEFINER function is granted to PUBLIC');
select tt.check(not exists (
  select 1 from pg_policies pol
  cross join lateral (select p.oid from pg_proc p where p.pronamespace = 'public'::regnamespace and p.prosecdef
                      and (coalesce(pol.qual, '') || ' ' || coalesce(pol.with_check, '')) ~ ('\m' || p.proname || '\(')) f
  where not has_function_privilege('authenticated', f.oid, 'execute')), 'every function an RLS policy calls is still executable by authenticated');
select tt.check(has_function_privilege('anon', 'has_permission(text)', 'execute') and has_function_privilege('anon', 'is_admin()', 'execute')
  and has_function_privilege('anon', 'event_availability(uuid)', 'execute'), 'RLS helpers and public RPCs stay callable without signing in');
select tt.anon();
select tt.check((select count(*) from events where id = '00000000-0000-0000-0000-00000000e5e1') = 1, 'visitors still see published sessions');
select tt.check((select count(*) from event_availability('00000000-0000-0000-0000-00000000e5e1')) >= 1, 'visitors still get live availability');
select tt.expect_error($$select * from event_member_ids('00000000-0000-0000-0000-00000000e5e1')$$, '%permission denied%', 'visitors cannot list the accounts working a session');
select tt.expect_error($$select send_event_reminders()$$, '%permission denied%', 'visitors cannot fire the reminder job');
select tt.logout();

\echo '--- 2. Applications always start in review'
select tt.login('00000000-0000-0000-0000-00000000e508', 'applicant@p1.tangy.test');
create temp table ins (k text, status text, reviewed boolean) on commit drop;
grant all on ins to authenticated;
with r as (insert into artists (user_id, name, email, status, reviewed_at) values
  ('00000000-0000-0000-0000-00000000e508', 'Self Approved', 'applicant@p1.tangy.test', 'approved', now()) returning status, reviewed_at)
  insert into ins select 'artist', status::text, reviewed_at is not null from r;
select tt.check((select status = 'pending' and not reviewed from ins where k = 'artist'), 'an artist inserted as approved is stored as pending, unreviewed');
select tt.expect_error($$insert into artists (user_id, name, email) values ('00000000-0000-0000-0000-00000000e505', 'Hijack', 'x@x')$$,
  '%row-level security%', 'nobody can create an artist profile for another account');
with r as (insert into collaborations (type, business_name, email, user_id, status) values
  ('vendor', 'Chai Co', 'applicant@p1.tangy.test', '00000000-0000-0000-0000-00000000e508', 'approved') returning status)
  insert into ins select 'vendor', status::text, false from r;
with r as (insert into collaborations (type, business_name, email, user_id, status) values
  ('sponsor', 'Sponsor Co', 'applicant@p1.tangy.test', '00000000-0000-0000-0000-00000000e508', 'approved') returning status)
  insert into ins select 'sponsor', status::text, false from r;
with r as (insert into collaborations (type, business_name, email, user_id, status) values
  ('venue_host', 'Haveli', 'applicant@p1.tangy.test', '00000000-0000-0000-0000-00000000e508', 'approved') returning status)
  insert into ins select 'venue', status::text, false from r;
with r as (insert into crew_applications (name, email, role_interest, category, user_id, status) values
  ('New Applicant', 'applicant@p1.tangy.test', 'Sound', 'crew', '00000000-0000-0000-0000-00000000e508', 'approved') returning status)
  insert into ins select 'crew', status::text, false from r;
with r as (insert into private_enquiries (type, name, email, user_id, status) values
  ('wedding', 'New Applicant', 'applicant@p1.tangy.test', '00000000-0000-0000-0000-00000000e508', 'approved') returning status)
  insert into ins select 'private', status::text, false from r;
with r as (insert into contact_enquiries (name, email, message, user_id, status) values
  ('New Applicant', 'applicant@p1.tangy.test', 'hello', '00000000-0000-0000-0000-00000000e508', 'replied') returning status)
  insert into ins select 'contact', status from r;
select tt.check((select bool_and(status = 'pending') from ins where k in ('vendor', 'sponsor', 'venue')),
  'vendor / sponsor / venue applications inserted as approved are stored as pending');
select tt.check((select status = 'pending' from ins where k = 'crew'), 'crew applications stay pending (0018 guard)');
select tt.check((select status = 'pending' from ins where k = 'private'), 'a private enquiry inserted as approved is stored as pending');
select tt.check((select status = 'new' from ins where k = 'contact'), 'a contact enquiry inserted as replied is stored as new');
select tt.logout();

\echo '--- 3. One artist profile per account'
select tt.login('00000000-0000-0000-0000-00000000e506', 'artist@p1.tangy.test');
select tt.expect_error($$insert into artists (user_id, name, email) values ('00000000-0000-0000-0000-00000000e506', 'Second', 'artist@p1.tangy.test')$$,
  '%artists_user_id_unique%', 'an account with an artist profile cannot create a second one');
select tt.logout();

\echo '--- 4. Profile identity'
select tt.login('00000000-0000-0000-0000-00000000e505', 'pat.b@p1.tangy.test');
select tt.expect_error($$update profiles set email = 'pat.a@p1.tangy.test' where id = auth.uid()$$, '%cannot be changed%', 'a user cannot change their profile email');
select tt.expect_error($$update profiles set passport_id = 'TS-STOLEN' where id = auth.uid()$$, '%cannot be changed%', 'a user cannot change their passport id');
select tt.expect_error($$update profiles set member_since = '2000-01-01' where id = auth.uid()$$, '%cannot be changed%', 'a user cannot backdate their membership');
update profiles set full_name = 'Pat Bee', phone = '+91 1' where id = auth.uid();
select tt.check((select full_name = 'Pat Bee' from profiles where id = auth.uid()), 'a user can still edit their name and phone');
select tt.check(tt.affected($$update profiles set full_name = 'x' where id = '00000000-0000-0000-0000-00000000e504'$$) = 0, 'a user cannot edit another profile');
select tt.expect_error($$update profiles set role = 'admin' where id = auth.uid()$$, '%own role%', 'a user cannot change their own role (0018)');
select tt.logout();
update auth.users set email = 'pat.b.new@p1.tangy.test' where id = '00000000-0000-0000-0000-00000000e505';
select tt.check((select email = 'pat.b.new@p1.tangy.test' from profiles where id = '00000000-0000-0000-0000-00000000e505'), 'a sign-in email change in Auth is copied to the profile');
update auth.users set email = 'pat.b@p1.tangy.test' where id = '00000000-0000-0000-0000-00000000e505';

\echo '--- 5. Waitlist reads use the verified sign-in email'
-- Simulates a profile email tampered with before 0035.
update profiles set email = 'pat.a@p1.tangy.test' where id = '00000000-0000-0000-0000-00000000e505';
select tt.login('00000000-0000-0000-0000-00000000e505', 'pat.b@p1.tangy.test');
select tt.check((select count(*) from waitlist) = 0, 'a tampered profile email does not expose another person''s waitlist entry');
select tt.logout();
update profiles set email = 'pat.b@p1.tangy.test' where id = '00000000-0000-0000-0000-00000000e505';
select tt.login('00000000-0000-0000-0000-00000000e504', 'pat.a@p1.tangy.test');
select tt.check((select count(*) from waitlist) = 1, 'the owner of that email still sees their entry');
select tt.logout();

\echo '--- 6. Roles and Super Admin (0018/0030)'
select tt.login('00000000-0000-0000-0000-00000000e501', 'admin@p1.tangy.test');
select tt.expect_error($$update profiles set role = 'super_admin' where id = '00000000-0000-0000-0000-00000000e505'$$, '%super admin%', 'an admin cannot grant super_admin');
select tt.expect_error($$update profiles set role = 'user' where id = '00000000-0000-0000-0000-00000000e503'$$, '%super admin%', 'an admin cannot demote a super_admin');
select tt.login('00000000-0000-0000-0000-00000000e503', 'super@p1.tangy.test');
select tt.expect_error($$update profiles set role = 'admin' where id = auth.uid()$$, '%own role%', 'the super_admin cannot demote themselves (no lock-out)');
select tt.logout();

\echo '--- 7. Booking history survives event deletion'
select tt.login('00000000-0000-0000-0000-00000000e501', 'admin@p1.tangy.test');
select tt.expect_error($$delete from events where id = '00000000-0000-0000-0000-00000000e5e1'$$, '%has bookings%', 'an admin cannot delete a session that has bookings');
select tt.check(tt.affected($$delete from bookings$$) = 0, 'bookings cannot be deleted through the API');
select tt.check(tt.affected($$delete from tickets$$) = 0 and tt.affected($$delete from checkins$$) = 0, 'tickets and check-ins cannot be deleted through the API');
select tt.logout();
select tt.expect_error($$delete from events where id = '00000000-0000-0000-0000-00000000e5e1'$$, '%has bookings%', 'not even the project owner deletes a session with bookings');
select tt.check((select count(*) from bookings where event_id = '00000000-0000-0000-0000-00000000e5e1') = 1, 'the booking is intact');

\echo '--- 8. Only approved artists get session workflows'
select tt.login('00000000-0000-0000-0000-00000000e501', 'admin@p1.tangy.test');
select tt.expect_error($$select create_assignment_request('00000000-0000-0000-0000-00000000e5e1', '00000000-0000-0000-0000-00000000e5a2', 'join us')$$,
  '%approved artist%', 'a pending artist cannot be requested for a session');
create temp table req on commit drop as
  select create_assignment_request('00000000-0000-0000-0000-00000000e5e1', '00000000-0000-0000-0000-00000000e5a1', 'join us') as id;
grant select on req to authenticated;
select tt.check((select count(*) from req) = 1, 'an approved artist can still be requested');
-- The admin rejects the artist after the request went out.
update artists set status = 'rejected' where id = '00000000-0000-0000-0000-00000000e5a1';
select tt.login('00000000-0000-0000-0000-00000000e506', 'artist@p1.tangy.test');
select tt.expect_error($$select respond_to_assignment_request((select id from req), true)$$, '%approved artist%', 'an artist who is no longer approved cannot accept');
select respond_to_assignment_request((select id from req), false);
select tt.check((select status = 'declined' from assignment_requests where id = (select id from req)), 'they can still decline');
select tt.anon();
select tt.check((select count(*) from artist_availability) = 0, 'artist availability is not public (0033)');
select tt.logout();

\echo '--- 9. Conversations are only assigned to the Tangy team'
select tt.login('00000000-0000-0000-0000-00000000e504', 'pat.a@p1.tangy.test');
create temp table conv on commit drop as select get_or_create_support_conversation('Help') as id;
grant select on conv to authenticated;
select tt.login('00000000-0000-0000-0000-00000000e501', 'admin@p1.tangy.test');
select tt.expect_error($$select assign_conversation((select id from conv), '00000000-0000-0000-0000-00000000e505')$$,
  '%team accounts%', 'an admin cannot add a patron to someone else''s conversation');
select assign_conversation((select id from conv), '00000000-0000-0000-0000-00000000e502');
select tt.check(exists (select 1 from conversation_participants where conversation_id = (select id from conv)
  and user_id = '00000000-0000-0000-0000-00000000e502' and role = 'admin'), 'assigning to another admin still works');
select tt.logout();

\echo ''
\echo 'ALL PHASE 1 SECURITY DATABASE TESTS PASSED'
rollback;
