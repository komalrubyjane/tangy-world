-- Tangy Sessions — programmes and recorded attendance (0031).
-- One transaction, rolled back at the end. Run: scripts/test-db.sh

\set ON_ERROR_STOP 1
\set QUIET 1
begin;

delete from programmes; delete from bookings; delete from waitlist; delete from collaborations; delete from crew_applications;
delete from private_enquiries; delete from contact_enquiries;
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
grant usage on schema tt to anon, authenticated;
grant execute on all functions in schema tt to anon, authenticated;

insert into auth.users (id, email, aud, role, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000d100', 'editor@prog.tangy.test', 'authenticated', 'authenticated', '{}'),
  ('00000000-0000-0000-0000-00000000d101', 'staff@prog.tangy.test',  'authenticated', 'authenticated', '{}'),
  ('00000000-0000-0000-0000-00000000d102', 'fan@prog.tangy.test',    'authenticated', 'authenticated', '{}');
update profiles set role = 'admin' where id = '00000000-0000-0000-0000-00000000d100';
update profiles set role = 'staff' where id = '00000000-0000-0000-0000-00000000d101';

insert into events (id, slug, name, event_date, venue, capacity, price, status, attendance_recorded) values
  ('00000000-0000-0000-0000-00000000d601', 'prog-past', 'Past Night', current_date - 100, 'Stepwell', 60, 900, 'past', 58),
  ('00000000-0000-0000-0000-00000000d602', 'prog-next', 'Next Night', current_date + 10, 'Stepwell', 60, 900, 'on-sale', null);

\echo '--- 1. Editing'
select tt.login('00000000-0000-0000-0000-00000000d100');
insert into programmes (id, slug, title, year, description, status) values
  ('00000000-0000-0000-0000-00000000d701', 'season-test', 'Season Test', 2025, 'A test season.', 'draft');
insert into programme_events (programme_id, event_id, position) values
  ('00000000-0000-0000-0000-00000000d701', '00000000-0000-0000-0000-00000000d601', 0),
  ('00000000-0000-0000-0000-00000000d701', '00000000-0000-0000-0000-00000000d602', 1);
select tt.check((select count(*) from programme_events where programme_id = '00000000-0000-0000-0000-00000000d701') = 2, 'a content editor creates a programme and links sessions');
select tt.check((select created_by from programmes where slug = 'season-test') = '00000000-0000-0000-0000-00000000d100', 'the author is recorded');
select tt.expect_error($$insert into programmes (slug, title, year) values ('Bad Slug', 'x', 2025)$$, '%check constraint%', 'slugs are url-safe');
select tt.expect_error($$insert into programmes (slug, title, year, cover_url) values ('x', 'x', 2025, 'javascript:alert(1)')$$, '%check constraint%', 'cover links must be site paths or https');

select tt.login('00000000-0000-0000-0000-00000000d101');
select tt.expect_error($$insert into programmes (slug, title, year) values ('staff-try', 'x', 2025)$$, '%row-level security%', 'staff cannot create programmes');
select tt.check((select count(*) from programmes) = 0, 'staff cannot see draft programmes');

\echo '--- 2. Publishing and visibility'
select tt.anon();
select tt.check((select count(*) from programmes) = 0, 'visitors do not see drafts');
select tt.check((select count(*) from programme_events) = 0, 'visitors do not see a draft programme''s sessions');
select tt.login('00000000-0000-0000-0000-00000000d100');
update programmes set status = 'published' where slug = 'season-test';
select tt.check((select published_at is not null from programmes where slug = 'season-test'), 'publishing stamps published_at');
select tt.anon();
select tt.check((select count(*) from programmes where slug = 'season-test') = 1, 'visitors see the published programme');
select tt.check((select count(*) from programme_events) = 2, '… and its sessions');
update programmes set title = 'Hacked' where slug = 'season-test';
select tt.check((select title from programmes where slug = 'season-test') = 'Season Test', 'visitors cannot edit programmes (RLS matches no rows)');
select tt.login('00000000-0000-0000-0000-00000000d102');
select tt.check((select count(*) from programmes) = 1, 'signed-in members see published programmes');
delete from programme_events;
select tt.check((select count(*) from programme_events) = 2, '… nothing was removed');
select tt.logout();
update programmes set published_at = now() + interval '3 days' where slug = 'season-test';
select tt.anon();
select tt.check((select count(*) from programmes) = 0, 'a scheduled programme is hidden until its publish time');

\echo '--- 3. Recorded attendance'
select tt.logout();
select tt.check((select attendance_recorded from events where slug = 'prog-past') = 58, 'past sessions keep a recorded head count');
select tt.expect_error($$update events set attendance_recorded = -1 where slug = 'prog-past'$$, '%check constraint%', 'attendance cannot be negative');
select tt.check(exists (select 1 from audit_logs where resource_type = 'programme'), 'programme changes are audited');

\echo ''
\echo 'ALL PROGRAMME DATABASE TESTS PASSED'
rollback;
