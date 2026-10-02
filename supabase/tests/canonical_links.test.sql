-- Tangy Sessions — canonical console links in new notifications (0021).
--
-- Drives the real 0018 generators that still pass /admin/... links
-- (assignment, task, application, message, volunteer access request) and
-- checks that what lands in notifications and email_outbox is the canonical
-- /admin-portal/... path, while partner portal links are left untouched.
-- One transaction, rolled back at the end. Run: scripts/test-db.sh

\set ON_ERROR_STOP 1
\set QUIET 1
begin;

delete from bookings; delete from waitlist; delete from collaborations; delete from crew_applications;
delete from conversations; delete from notifications; delete from email_outbox; delete from notification_preferences;
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
create function tt.check(p_cond boolean, p_label text) returns void language plpgsql as $$
begin
  if p_cond is not true then
    raise exception 'FAIL [%]', p_label;
  end if;
  raise notice 'ok  %', p_label;
end $$;
create function tt.link(p_uid uuid, p_type text) returns text language sql security definer as $$
  select link from notifications where user_id = p_uid and type = p_type order by created_at desc limit 1;
$$;
grant usage on schema tt to authenticated;

insert into auth.users (id, email, aud, role, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000d0001', 'manager@links.tangy.test', 'authenticated', 'authenticated', '{"full_name":"Mira Manager"}'),
  ('00000000-0000-0000-0000-0000000d0002', 'staff@links.tangy.test',   'authenticated', 'authenticated', '{"full_name":"Sam Staff"}'),
  ('00000000-0000-0000-0000-0000000d0003', 'vendor@links.tangy.test',  'authenticated', 'authenticated', '{"full_name":"Vik Vendor"}'),
  ('00000000-0000-0000-0000-0000000d0004', 'vol@links.tangy.test',     'authenticated', 'authenticated', '{"full_name":"Rohan Das"}');
update profiles set role = 'admin'     where id = '00000000-0000-0000-0000-0000000d0001';
update profiles set role = 'staff'     where id = '00000000-0000-0000-0000-0000000d0002';
update profiles set role = 'vendor'    where id = '00000000-0000-0000-0000-0000000d0003';
update profiles set role = 'volunteer' where id = '00000000-0000-0000-0000-0000000d0004';
insert into events (id, slug, name, event_date, venue, capacity, price, status) values
  ('00000000-0000-0000-0000-0000000fd001', 'links-a', 'Links Night', current_date + 2, 'Stepwell', 50, 500, 'on-sale');

\echo '--- 1. Helper'
select tt.check(canonical_console_link('/admin/messages?c=1') = '/admin-portal/messages?c=1', '/admin/... is rewritten');
select tt.check(canonical_console_link('/admin') = '/admin-portal' and canonical_console_link('/admin?x=1') = '/admin-portal?x=1', 'bare /admin and /admin?query are rewritten');
select tt.check(canonical_console_link('/admin-portal/tasks') = '/admin-portal/tasks', 'canonical links are unchanged');
select tt.check(canonical_console_link('/administrator') = '/administrator' and canonical_console_link('/vendor/dashboard') = '/vendor/dashboard'
  and canonical_console_link(null) is null, 'other paths and null are unchanged');

\echo '--- 2. 0018 generators now produce canonical links'
insert into event_assignments (id, event_id, assignee_role, assignee_id, title, assigned_by) values
  ('00000000-0000-0000-0000-0000000da001', '00000000-0000-0000-0000-0000000fd001', 'staff', '00000000-0000-0000-0000-0000000d0002', 'Front gate', '00000000-0000-0000-0000-0000000d0001'),
  ('00000000-0000-0000-0000-0000000da002', '00000000-0000-0000-0000-0000000fd001', 'vendor', '00000000-0000-0000-0000-0000000d0003', 'Chai counter', '00000000-0000-0000-0000-0000000d0001'),
  ('00000000-0000-0000-0000-0000000da003', '00000000-0000-0000-0000-0000000fd001', 'volunteer', '00000000-0000-0000-0000-0000000d0004', 'Gate', '00000000-0000-0000-0000-0000000d0001');
select tt.check(tt.link('00000000-0000-0000-0000-0000000d0002', 'assignment.new') = '/admin-portal/my-events', 'staff assignment → /admin-portal/my-events');
select tt.check(tt.link('00000000-0000-0000-0000-0000000d0003', 'assignment.new') = '/vendor/dashboard', 'partner assignment keeps its portal link');

insert into event_tasks (assignment_id, title, due_at) values ('00000000-0000-0000-0000-0000000da001', 'Collect scanner', now() + interval '2 hours');
select tt.check(tt.link('00000000-0000-0000-0000-0000000d0002', 'task.assigned') = '/admin-portal/tasks', 'staff task → /admin-portal/tasks');

insert into collaborations (type, business_name, contact_name, email, status) values ('vendor', 'Links Chai', 'Lina', 'lina@links.tangy.test', 'pending');
select tt.check(tt.link('00000000-0000-0000-0000-0000000d0001', 'application.new') = '/admin-portal/applications', 'new application → /admin-portal/applications');

select tt.login('00000000-0000-0000-0000-0000000d0003');
select start_partner_conversation('Loading', 'Need loading bay access', '00000000-0000-0000-0000-0000000fd001');
select tt.logout();
select tt.check(tt.link('00000000-0000-0000-0000-0000000d0001', 'message.new') ~ '^/admin-portal/messages/[0-9a-f-]{36}$', 'partner message → /admin-portal/messages/:id');
select tt.check((select link from email_outbox where user_id = '00000000-0000-0000-0000-0000000d0001' and notification_type = 'message.new' limit 1)
  ~ '^/admin-portal/messages/', 'queued email carries the canonical link too');

select tt.login('00000000-0000-0000-0000-0000000d0004');
select request_checkin_access('00000000-0000-0000-0000-0000000fd001', 'Second gate');
select tt.logout();
select tt.check(tt.link('00000000-0000-0000-0000-0000000d0001', 'access.requested') = '/admin-portal/volunteers?requests=1', 'volunteer access request → /admin-portal/volunteers');

select tt.check(not exists (select 1 from notifications where link ~ '^/admin([/?#]|$)')
  and not exists (select 1 from email_outbox where link ~ '^/admin([/?#]|$)'), 'no new notification or email uses a legacy /admin link');

\echo ''
\echo 'ALL CANONICAL LINK DATABASE TESTS PASSED'
rollback;
