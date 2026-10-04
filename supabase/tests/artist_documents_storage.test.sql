-- Tangy Sessions — artist-documents storage ownership (0036).
--
-- Writes and reads storage.objects as each role with RLS on — the same
-- checks Storage runs for uploads, signed URLs (SELECT) and deletes. Paths
-- are <artist id>/<file>, as the artist portal uploads them
-- (src/artist/portal/pages/InboxPages.jsx). Before 0036 the "own" policies
-- compared the folder with artists.name, so every artist-own case failed.
-- Uses only its own fixtures (deletes nothing); one transaction, rolled back.
-- Run: scripts/test-db.sh

\set ON_ERROR_STOP 1
\set QUIET 1
begin;

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
create function tt.sees(p_name text) returns boolean language sql as $$
  select exists (select 1 from storage.objects where bucket_id = 'artist-documents' and name = p_name);
$$;
create function tt.exists_(p_name text) returns boolean language sql security definer as $$
  select exists (select 1 from storage.objects where bucket_id = 'artist-documents' and name = p_name);
$$;
grant usage on schema tt to anon, authenticated;

insert into auth.users (id, email, aud, role, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000d0001', 'test-asha@docs.tangy.test',    'authenticated', 'authenticated', '{"full_name":"Test Asha"}'),
  ('00000000-0000-0000-0000-0000000d0002', 'test-bela@docs.tangy.test',    'authenticated', 'authenticated', '{"full_name":"Test Bela"}'),
  ('00000000-0000-0000-0000-0000000d0003', 'test-patron@docs.tangy.test',  'authenticated', 'authenticated', '{"full_name":"Test Patron"}'),
  ('00000000-0000-0000-0000-0000000d0004', 'test-staff@docs.tangy.test',   'authenticated', 'authenticated', '{"full_name":"Test Staff"}'),
  ('00000000-0000-0000-0000-0000000d0005', 'test-manager@docs.tangy.test', 'authenticated', 'authenticated', '{"full_name":"Test Manager"}');
update profiles set role = 'artist' where id in ('00000000-0000-0000-0000-0000000d0001', '00000000-0000-0000-0000-0000000d0002');
update profiles set role = 'staff'  where id = '00000000-0000-0000-0000-0000000d0004';
update profiles set role = 'admin'  where id = '00000000-0000-0000-0000-0000000d0005';
-- Display names deliberately differ from the ids: the 0033 bug compared the folder with artists.name.
insert into artists (id, user_id, name, email, status) values
  ('00000000-0000-0000-0000-00000000ad01', '00000000-0000-0000-0000-0000000d0001', 'Test Asha', 'test-asha@docs.tangy.test', 'approved'),
  ('00000000-0000-0000-0000-00000000ad02', '00000000-0000-0000-0000-0000000d0002', 'Test Bela', 'test-bela@docs.tangy.test', 'pending');

\echo '--- 1. Policies'
select tt.check((select count(*) from pg_policies where schemaname = 'storage' and tablename = 'objects'
  and policyname in ('artist-documents: own read', 'artist-documents: own upload', 'artist-documents: own delete', 'artist-documents: team read')) = 4,
  'the four artist-documents policies exist');
select tt.check(not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
  and policyname like 'artist-documents: own %' and coalesce(qual, with_check) !~ 'foldername\(objects\.name\)'),
  'every own policy reads the folder from storage.objects.name');
select tt.check((select public from storage.buckets where id = 'artist-documents') = false, 'the documents bucket stays private');

\echo '--- 2. Own folder'
select tt.login('00000000-0000-0000-0000-0000000d0001');
insert into storage.objects (bucket_id, name, owner) values ('artist-documents', '00000000-0000-0000-0000-00000000ad01/1700000000000-rider.pdf', auth.uid());
select tt.check(tt.sees('00000000-0000-0000-0000-00000000ad01/1700000000000-rider.pdf'), 'artist can upload and read (sign) their own document');
select tt.login('00000000-0000-0000-0000-0000000d0002');
insert into storage.objects (bucket_id, name, owner) values ('artist-documents', '00000000-0000-0000-0000-00000000ad02/press-kit.pdf', auth.uid());
select tt.check(tt.sees('00000000-0000-0000-0000-00000000ad02/press-kit.pdf'), 'an artist with a pending application can upload their own document');

\echo '--- 3. Another artist''s folder'
select tt.check(not tt.sees('00000000-0000-0000-0000-00000000ad01/1700000000000-rider.pdf'), 'artist cannot read another artist''s document');
select tt.expect_error($$insert into storage.objects (bucket_id, name, owner) values ('artist-documents', '00000000-0000-0000-0000-00000000ad01/planted.pdf', auth.uid())$$,
  '%row-level security%', 'artist cannot upload into another artist''s folder');
select tt.expect_error($$insert into storage.objects (bucket_id, name, owner) values ('artist-documents', 'Test Bela/named.pdf', auth.uid())$$,
  '%row-level security%', 'a folder named after the display name is not an ownership match');
select tt.expect_error($$insert into storage.objects (bucket_id, name, owner) values ('artist-documents', '00000000-0000-0000-0000-0000000d0002/by-user-id.pdf', auth.uid())$$,
  '%row-level security%', 'a folder named after the auth user id is not an ownership match');
select set_config('storage.allow_delete_query', 'true', true);
delete from storage.objects where bucket_id = 'artist-documents' and name = '00000000-0000-0000-0000-00000000ad01/1700000000000-rider.pdf';
select tt.check(tt.exists_('00000000-0000-0000-0000-00000000ad01/1700000000000-rider.pdf'), 'artist cannot delete another artist''s document');

\echo '--- 4. Other roles'
select tt.login('00000000-0000-0000-0000-0000000d0003');
select tt.check(not tt.sees('00000000-0000-0000-0000-00000000ad01/1700000000000-rider.pdf'), 'a signed-in non-artist cannot read artist documents');
select tt.expect_error($$insert into storage.objects (bucket_id, name, owner) values ('artist-documents', '00000000-0000-0000-0000-00000000ad01/x.pdf', auth.uid())$$,
  '%row-level security%', 'a signed-in non-artist cannot upload artist documents');
select tt.login('00000000-0000-0000-0000-0000000d0004');
select tt.check(not tt.sees('00000000-0000-0000-0000-00000000ad01/1700000000000-rider.pdf'), 'staff (no entities.manage) cannot read artist documents');
select tt.login('00000000-0000-0000-0000-0000000d0005');
select tt.check(tt.sees('00000000-0000-0000-0000-00000000ad01/1700000000000-rider.pdf'), 'team (entities.manage) can read artist documents');
select tt.expect_error($$insert into storage.objects (bucket_id, name, owner) values ('artist-documents', '00000000-0000-0000-0000-00000000ad01/admin.pdf', auth.uid())$$,
  '%row-level security%', 'team cannot upload into an artist''s folder');
select tt.anon();
select tt.check(not tt.sees('00000000-0000-0000-0000-00000000ad01/1700000000000-rider.pdf'), 'anonymous cannot read artist documents');
select tt.expect_error($$insert into storage.objects (bucket_id, name, owner) values ('artist-documents', '00000000-0000-0000-0000-00000000ad01/anon.pdf', null)$$,
  '%row-level security%', 'anonymous cannot upload artist documents');

\echo '--- 5. Delete own'
select tt.login('00000000-0000-0000-0000-0000000d0001');
delete from storage.objects where bucket_id = 'artist-documents' and name = '00000000-0000-0000-0000-00000000ad01/1700000000000-rider.pdf';
select tt.check(not tt.exists_('00000000-0000-0000-0000-00000000ad01/1700000000000-rider.pdf'), 'artist can delete their own document');
select tt.logout();

\echo ''
\echo 'ALL ARTIST DOCUMENTS STORAGE DATABASE TESTS PASSED'
rollback;
