-- Tangy Sessions — artist-media / artist-avatars storage ownership (0022).
--
-- Writes and reads storage.objects as each role with RLS on — the same
-- checks Storage runs for uploads, signed URLs (SELECT) and deletes. Before
-- 0022 the "self" policies compared the folder with artists.name, so every
-- artist-own case below failed. One transaction, rolled back at the end.
-- Run: scripts/test-db.sh

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
-- What the caller can see (the SELECT policy Storage uses to sign URLs).
create function tt.sees(p_bucket text, p_name text) returns boolean language sql as $$
  select exists (select 1 from storage.objects where bucket_id = p_bucket and name = p_name);
$$;
create function tt.exists_(p_bucket text, p_name text) returns boolean language sql security definer as $$
  select exists (select 1 from storage.objects where bucket_id = p_bucket and name = p_name);
$$;
grant usage on schema tt to anon, authenticated;

insert into auth.users (id, email, aud, role, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000e0001', 'asha@store.tangy.test',    'authenticated', 'authenticated', '{"full_name":"Asha Artist"}'),
  ('00000000-0000-0000-0000-0000000e0002', 'bela@store.tangy.test',    'authenticated', 'authenticated', '{"full_name":"Bela Artist"}'),
  ('00000000-0000-0000-0000-0000000e0003', 'sponsor@store.tangy.test', 'authenticated', 'authenticated', '{"full_name":"Sona Sponsor"}'),
  ('00000000-0000-0000-0000-0000000e0004', 'staff@store.tangy.test',   'authenticated', 'authenticated', '{"full_name":"Sam Staff"}'),
  ('00000000-0000-0000-0000-0000000e0005', 'manager@store.tangy.test', 'authenticated', 'authenticated', '{"full_name":"Mira Manager"}');
update profiles set role = 'artist'  where id in ('00000000-0000-0000-0000-0000000e0001', '00000000-0000-0000-0000-0000000e0002');
update profiles set role = 'sponsor' where id = '00000000-0000-0000-0000-0000000e0003';
update profiles set role = 'staff'   where id = '00000000-0000-0000-0000-0000000e0004';
update profiles set role = 'admin'   where id = '00000000-0000-0000-0000-0000000e0005';
-- Display names deliberately differ from the ids: the 0013 bug compared the folder with artists.name.
insert into artists (id, user_id, name, email, status) values
  ('00000000-0000-0000-0000-00000000ae01', '00000000-0000-0000-0000-0000000e0001', 'Asha Artist', 'asha@store.tangy.test', 'approved'),
  ('00000000-0000-0000-0000-00000000ae02', '00000000-0000-0000-0000-0000000e0002', 'Bela Artist', 'bela@store.tangy.test', 'approved');

\echo '--- 1. Artist media: own folder'
select tt.login('00000000-0000-0000-0000-0000000e0001');
insert into storage.objects (bucket_id, name, owner) values ('artist-media', '00000000-0000-0000-0000-00000000ae01/demo.mp3', auth.uid());
select tt.check(tt.sees('artist-media', '00000000-0000-0000-0000-00000000ae01/demo.mp3'), 'artist can upload and read (sign) their own media');
select tt.login('00000000-0000-0000-0000-0000000e0002');
insert into storage.objects (bucket_id, name, owner) values ('artist-media', '00000000-0000-0000-0000-00000000ae02/set.mp4', auth.uid());
select tt.check(tt.sees('artist-media', '00000000-0000-0000-0000-00000000ae02/set.mp4'), 'second artist uploads their own media');

\echo '--- 2. Artist media: another artist'
select tt.check(not tt.sees('artist-media', '00000000-0000-0000-0000-00000000ae01/demo.mp3'), 'artist cannot read another artist''s media');
select tt.expect_error($$insert into storage.objects (bucket_id, name, owner) values ('artist-media', '00000000-0000-0000-0000-00000000ae01/planted.mp3', auth.uid())$$,
  '%row-level security%', 'artist cannot upload into another artist''s folder');
select tt.expect_error($$insert into storage.objects (bucket_id, name, owner) values ('artist-media', 'Bela Artist/named.mp3', auth.uid())$$,
  '%row-level security%', 'a folder named after the display name is not an ownership match');
select set_config('storage.allow_delete_query', 'true', true);
delete from storage.objects where bucket_id = 'artist-media' and name = '00000000-0000-0000-0000-00000000ae01/demo.mp3';
select tt.check(tt.exists_('artist-media', '00000000-0000-0000-0000-00000000ae01/demo.mp3'), 'artist cannot delete another artist''s media');

\echo '--- 3. Artist media: delete own'
select tt.login('00000000-0000-0000-0000-0000000e0001');
delete from storage.objects where bucket_id = 'artist-media' and name = '00000000-0000-0000-0000-00000000ae01/demo.mp3';
select tt.check(not tt.exists_('artist-media', '00000000-0000-0000-0000-00000000ae01/demo.mp3'), 'artist can delete their own media');

\echo '--- 4. Artist avatars (public bucket — reads are public by design)'
insert into storage.objects (bucket_id, name, owner) values ('artist-avatars', '00000000-0000-0000-0000-00000000ae01/avatar.jpg', auth.uid());
select tt.check(tt.exists_('artist-avatars', '00000000-0000-0000-0000-00000000ae01/avatar.jpg'), 'artist can upload their own avatar');
update storage.objects set metadata = '{"v":2}' where bucket_id = 'artist-avatars' and name = '00000000-0000-0000-0000-00000000ae01/avatar.jpg';
select tt.logout();
select tt.check((select metadata ->> 'v' from storage.objects where bucket_id = 'artist-avatars' and name = '00000000-0000-0000-0000-00000000ae01/avatar.jpg') = '2', 'artist can replace their own avatar');
select tt.login('00000000-0000-0000-0000-0000000e0002');
select tt.expect_error($$insert into storage.objects (bucket_id, name, owner) values ('artist-avatars', '00000000-0000-0000-0000-00000000ae01/evil.jpg', auth.uid())$$,
  '%row-level security%', 'artist cannot upload an avatar into another artist''s folder');
update storage.objects set metadata = '{"v":666}' where bucket_id = 'artist-avatars' and name = '00000000-0000-0000-0000-00000000ae01/avatar.jpg';
delete from storage.objects where bucket_id = 'artist-avatars' and name = '00000000-0000-0000-0000-00000000ae01/avatar.jpg';
select tt.logout();
select tt.check((select metadata ->> 'v' from storage.objects where bucket_id = 'artist-avatars' and name = '00000000-0000-0000-0000-00000000ae01/avatar.jpg') = '2',
  'artist cannot overwrite or delete another artist''s avatar');
select tt.login('00000000-0000-0000-0000-0000000e0001');
delete from storage.objects where bucket_id = 'artist-avatars' and name = '00000000-0000-0000-0000-00000000ae01/avatar.jpg';
select tt.check(not tt.exists_('artist-avatars', '00000000-0000-0000-0000-00000000ae01/avatar.jpg'), 'artist can delete their own avatar');

\echo '--- 5. Other roles'
select tt.login('00000000-0000-0000-0000-0000000e0003');
select tt.check(not tt.sees('artist-media', '00000000-0000-0000-0000-00000000ae02/set.mp4'), 'sponsor cannot read artist media');
select tt.expect_error($$insert into storage.objects (bucket_id, name, owner) values ('artist-media', '00000000-0000-0000-0000-00000000ae02/x.mp3', auth.uid())$$,
  '%row-level security%', 'sponsor cannot upload artist media');
select tt.expect_error($$insert into storage.objects (bucket_id, name, owner) values ('artist-avatars', '00000000-0000-0000-0000-00000000ae02/x.jpg', auth.uid())$$,
  '%row-level security%', 'sponsor cannot upload an artist avatar');
select tt.login('00000000-0000-0000-0000-0000000e0004');
select tt.check(not tt.sees('artist-media', '00000000-0000-0000-0000-00000000ae02/set.mp4'), 'staff (no curation permission) cannot read artist media');
select tt.anon();
select tt.check(not tt.sees('artist-media', '00000000-0000-0000-0000-00000000ae02/set.mp4'), 'anonymous cannot read artist media');
select tt.login('00000000-0000-0000-0000-0000000e0005');
select tt.check(tt.sees('artist-media', '00000000-0000-0000-0000-00000000ae02/set.mp4'), 'curator (entities.manage) can preview artist media');

\echo ''
\echo 'ALL ARTIST STORAGE DATABASE TESTS PASSED'
rollback;
