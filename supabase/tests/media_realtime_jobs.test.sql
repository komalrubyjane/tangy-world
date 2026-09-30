-- Tangy Sessions — private content media, availability signal, waitlist
-- allocation policy, scheduled-job runs (0029).
-- One transaction, rolled back at the end. Run: scripts/test-db.sh
-- (Concurrent job runs across two sessions: scripts/test-jobs-concurrency.sh)

\set ON_ERROR_STOP 1
\set QUIET 1
begin;

delete from bookings; delete from waitlist; delete from notifications; delete from email_outbox;
delete from collaborations; delete from crew_applications; delete from private_enquiries; delete from contact_enquiries;
delete from conversations; delete from events; delete from artists; delete from auth.users;
delete from diary_posts; delete from gallery_albums; delete from tv_videos;

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
create function tt.sees(p_name text) returns boolean language sql as $$
  select exists (select 1 from storage.objects where bucket_id = 'content-media' and name = p_name);
$$;
create function tt.wl(p_user uuid) returns text language sql security definer as $$
  select status from waitlist where user_id = p_user order by created_at desc limit 1;
$$;
grant usage on schema tt to anon, authenticated;
grant execute on all functions in schema tt to anon, authenticated;

insert into auth.users (id, email, aud, role, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000f501', 'admin@mrj.tangy.test', 'authenticated', 'authenticated', '{"full_name":"Mira Manager"}'),
  ('00000000-0000-0000-0000-00000000f502', 'staff@mrj.tangy.test', 'authenticated', 'authenticated', '{"full_name":"Sam Staff"}'),
  ('00000000-0000-0000-0000-00000000f503', 'pat@mrj.tangy.test',   'authenticated', 'authenticated', '{"full_name":"Pat Patron"}'),
  ('00000000-0000-0000-0000-00000000f504', 'big@mrj.tangy.test',   'authenticated', 'authenticated', '{"full_name":"Big Party"}'),
  ('00000000-0000-0000-0000-00000000f505', 'solo@mrj.tangy.test',  'authenticated', 'authenticated', '{"full_name":"Solo"}');
update profiles set role = 'admin' where id = '00000000-0000-0000-0000-00000000f501';
update profiles set role = 'staff' where id = '00000000-0000-0000-0000-00000000f502';

\echo '--- 1. Private content media'
select tt.check((select not public from storage.buckets where id = 'content-media'), 'the content-media bucket is private');
select tt.login('00000000-0000-0000-0000-00000000f501');
insert into storage.objects (bucket_id, name, owner) values ('content-media', 'diary/aaa/draft-cover.jpg', auth.uid()), ('content-media', 'tv/bbb/clip.mp4', auth.uid());
insert into diary_posts (slug, title, body, cover_url) values ('mrj-post', 'Draft post', 'Body', '/storage/content-media/diary/aaa/draft-cover.jpg');
select tt.check(tt.sees('diary/aaa/draft-cover.jpg'), 'a content editor can see (sign) a draft''s media');
select tt.anon();
select tt.check(not tt.sees('diary/aaa/draft-cover.jpg'), 'a visitor cannot see a draft''s media');
select tt.check(not tt.sees('tv/bbb/clip.mp4'), 'nor unreferenced uploads');
select tt.login('00000000-0000-0000-0000-00000000f503');
select tt.check(not tt.sees('diary/aaa/draft-cover.jpg'), 'a signed-in patron cannot see it either');
select tt.login('00000000-0000-0000-0000-00000000f502');
select tt.check(not tt.sees('diary/aaa/draft-cover.jpg'), 'staff without content rights cannot see it');
select tt.login('00000000-0000-0000-0000-00000000f501');
update diary_posts set status = 'published' where slug = 'mrj-post';
select tt.anon();
select tt.check(tt.sees('diary/aaa/draft-cover.jpg'), 'once the post is published its cover becomes visible');
select tt.login('00000000-0000-0000-0000-00000000f501');
update diary_posts set status = 'archived' where slug = 'mrj-post';
select tt.anon();
select tt.check(not tt.sees('diary/aaa/draft-cover.jpg'), 'archiving hides it again');
select tt.login('00000000-0000-0000-0000-00000000f501');
insert into tv_videos (slug, title, video_url, status, published_at) values ('mrj-later', 'Later', '/storage/content-media/tv/bbb/clip.mp4', 'published', now() + interval '1 day');
select tt.anon();
select tt.check(not tt.sees('tv/bbb/clip.mp4'), 'media of scheduled (future) content stays private');
select tt.login('00000000-0000-0000-0000-00000000f503');
select tt.expect_error($$insert into storage.objects (bucket_id, name, owner) values ('content-media', 'gallery/x/evil.jpg', auth.uid())$$, '%row-level security%', 'a patron cannot upload');

select tt.logout();
select tt.check((select bool_and(file_size_limit is not null and allowed_mime_types is not null) from storage.buckets
  where id in ('artist-avatars', 'artist-media', 'content-media', 'event-documents', 'sponsor-assets')), 'every bucket has a size limit and a MIME allowlist');
select tt.check((select not ('text/html' = any (allowed_mime_types) or 'image/svg+xml' = any (allowed_mime_types)) from storage.buckets where id = 'artist-avatars'),
  'the public avatars bucket accepts neither HTML nor SVG');

\echo '--- 2. Availability signal'
select tt.logout();
insert into events (id, slug, name, event_date, venue, capacity, price, status) values
  ('00000000-0000-0000-0000-00000000f601', 'mrj-live', 'Live Night', current_date + 5, 'Stepwell', 3, 500, 'on-sale'),
  ('00000000-0000-0000-0000-00000000f602', 'mrj-draft', 'Draft Night', current_date + 9, 'Baradari', 3, 500, 'draft');
create temp table v0 on commit drop as select version from event_availability_signal where event_id = '00000000-0000-0000-0000-00000000f601';
grant select on v0 to anon, authenticated;
select create_pending_booking(null, '00000000-0000-0000-0000-00000000f601', 'MRJ-1', 'A', 'a@x.test', null, 1, 0, 'gen', null);
select tt.check((select version from event_availability_signal where event_id = '00000000-0000-0000-0000-00000000f601') > (select version from v0), 'a new booking bumps the session''s availability signal');
select tt.anon();
select tt.check((select count(*) = 1 from event_availability_signal), 'visitors can read the signal of published sessions only (not drafts)');
select tt.check((select count(*) = 0 from event_availability_signal where row_to_json(event_availability_signal)::text ~* 'email|name|amount'), 'the signal carries no booking data');
select tt.expect_error($$update event_availability_signal set version = 0$$, '%permission denied%', 'visitors cannot write the signal');
select tt.check((select count(*) = 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'event_availability_signal'), 'the signal is published over realtime');

\echo '--- 3. Waitlist allocation policy'
select tt.logout();
select create_pending_booking(null, '00000000-0000-0000-0000-00000000f601', 'MRJ-2', 'B', 'b@x.test', null, 2, 0, 'gen', null);
select tt.login('00000000-0000-0000-0000-00000000f504');
select join_waitlist('00000000-0000-0000-0000-00000000f601', 2);
select tt.login('00000000-0000-0000-0000-00000000f505');
select join_waitlist('00000000-0000-0000-0000-00000000f601', 1);
select tt.logout();
update bookings set status = 'cancelled' where registration_code = 'MRJ-1';
select tt.check(tt.wl('00000000-0000-0000-0000-00000000f504') = 'waiting' and tt.wl('00000000-0000-0000-0000-00000000f505') = 'waiting',
  'strict_order (default): 1 free seat is not offered past the 2-person party at the head');
update system_settings set value = '"first_fit"' where key = 'waitlist.allocation';
select tt.check(offer_waitlist_seats('00000000-0000-0000-0000-00000000f601') = 1 and tt.wl('00000000-0000-0000-0000-00000000f505') = 'offered'
  and tt.wl('00000000-0000-0000-0000-00000000f504') = 'waiting', 'first_fit: the seat goes to the earliest party that fits');
select tt.check((select metadata ->> 'allocation' = 'first_fit' from audit_logs where action = 'waitlist.offered' order by id desc limit 1), 'the offer records the policy used');
update system_settings set value = '"strict_order"' where key = 'waitlist.allocation';

\echo '--- 4. Scheduled jobs'
update waitlist set offer_expires_at = now() - interval '1 minute' where user_id = '00000000-0000-0000-0000-00000000f505';
create temp table run1 on commit drop as select run_platform_jobs('test') as r;
select tt.check((select (r ->> 'waitlist_offers_expired')::int = 1 from run1), 'run once: the expired offer is processed');
select tt.check(tt.wl('00000000-0000-0000-0000-00000000f505') = 'expired', 'the offer is marked expired');
create temp table run2 on commit drop as select run_platform_jobs('test') as r;
select tt.check((select (r ->> 'waitlist_offers_expired')::int = 0 and (r ->> 'bookings_expired')::int = 0 from run2), 'run twice: already-processed records are not processed again');
select tt.check((select count(*) = 2 and bool_and(finished_at is not null and not skipped) from platform_job_runs where source = 'test'), 'both runs are recorded in platform_job_runs');
select tt.check((select count(*) = 1 from notifications where type = 'waitlist.offer_expired'), 'the holder is told once, not twice');
select tt.login('00000000-0000-0000-0000-00000000f503');
select tt.expect_error($$select run_platform_jobs('me')$$, '%permission denied%', 'clients cannot run the jobs');
select tt.check((select count(*) = 0 from platform_job_runs), 'nor read the run log');

\echo ''
\echo 'ALL MEDIA / REALTIME / JOBS DATABASE TESTS PASSED'
rollback;
