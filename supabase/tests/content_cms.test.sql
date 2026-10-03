-- Tangy Sessions — content CMS: TV, diary, gallery, artist pages, session copy (0028).
-- One transaction, rolled back at the end. Run: scripts/test-db.sh

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
grant usage on schema tt to anon, authenticated;
grant execute on all functions in schema tt to anon, authenticated;

insert into auth.users (id, email, aud, role, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000c501', 'admin@cms.tangy.test', 'authenticated', 'authenticated', '{"full_name":"Mira Manager"}'),
  ('00000000-0000-0000-0000-00000000c502', 'staff@cms.tangy.test', 'authenticated', 'authenticated', '{"full_name":"Sam Staff"}'),
  ('00000000-0000-0000-0000-00000000c503', 'pat@cms.tangy.test',   'authenticated', 'authenticated', '{"full_name":"Pat Patron"}');
update profiles set role = 'admin' where id = '00000000-0000-0000-0000-00000000c501';
update profiles set role = 'staff' where id = '00000000-0000-0000-0000-00000000c502';
insert into events (id, slug, name, event_date, venue, capacity, price, status, description) values
  ('00000000-0000-0000-0000-00000000c601', 'cms-night', 'CMS Night', current_date + 5, 'Stepwell', 50, 1000, 'on-sale', 'Old copy');

-- Test-owned CMS content, created here and rolled back with the suite. The
-- suite must not depend on content seeded by migrations: production starts
-- with an EMPTY CMS (supabase/production-bootstrap/ drops 0028's seed), and
-- the visibility / edit-rights checks below need real published and draft
-- rows to be meaningful rather than trivially true on empty tables.
insert into tv_videos (slug, title, video_url, sort_order, status, published_at) values
  ('test-tv-live',  'Test TV — Live',  '/media/test/live.mp4',  1, 'published', now()),
  ('test-tv-field', 'Test TV — Field', '/media/test/field.mp4', 2, 'published', now()),
  ('test-tv-draft', 'Test TV — Draft', '/media/test/draft.mp4', 3, 'draft', null);
insert into gallery_albums (id, slug, title, status, published_at) values
  ('00000000-0000-0000-0000-00000000c711', 'test-album',       'Test album',       'published', now()),
  ('00000000-0000-0000-0000-00000000c712', 'test-draft-album', 'Test draft album', 'draft',     null);
insert into gallery_photos (album_id, image_url, alt_text, sort_order) values
  ('00000000-0000-0000-0000-00000000c711', '/media/test/1.jpg', 'Test photo one',   1),
  ('00000000-0000-0000-0000-00000000c711', '/media/test/2.jpg', 'Test photo two',   2),
  ('00000000-0000-0000-0000-00000000c711', '/media/test/3.jpg', 'Test photo three', 3),
  ('00000000-0000-0000-0000-00000000c712', '/media/test/4.jpg', 'Test photo in a draft album', 1);
insert into diary_posts (slug, title, body, status) values
  ('test-draft-one', 'Test draft one', 'Draft text', 'draft'),
  ('test-draft-two', 'Test draft two', 'Draft text', 'draft');

\echo '--- 1. Visitors see published content only'
select tt.anon();
select tt.check((select count(*) from tv_videos where slug like 'test-tv-%') = 2 and not exists (select 1 from tv_videos where slug = 'test-tv-draft'),
  'visitors see published TV videos, not drafts');
select tt.check((select count(*) = 0 from diary_posts), 'imported diary drafts are not public');
select tt.check((select count(*) from gallery_photos where album_id = '00000000-0000-0000-0000-00000000c711') = 3
  and not exists (select 1 from gallery_photos where album_id = '00000000-0000-0000-0000-00000000c712'), 'published album photos are public, draft album photos are not');
select tt.expect_error($$insert into tv_videos (slug, title, video_url) values ('x', 'X', '/x.mp4')$$, '%row-level security%', 'visitors cannot add videos');
select tt.login('00000000-0000-0000-0000-00000000c503');
select tt.check((select count(*) = 0 from diary_posts), 'a patron cannot see drafts');
select tt.expect_error($$insert into diary_posts (slug, title) values ('mine', 'Mine')$$, '%row-level security%', 'a patron cannot write the diary');
with u as (update tv_videos set title = 'Hacked' returning id) select tt.check(not exists (select 1 from u), 'a patron cannot edit videos');
select tt.login('00000000-0000-0000-0000-00000000c502');
select tt.check((select count(*) = 0 from diary_posts), 'staff without content permissions cannot see drafts');
select tt.expect_error($$insert into tv_videos (slug, title, video_url) values ('staff-vid', 'Staff', '/x.mp4')$$, '%row-level security%', 'staff cannot add videos by default');

\echo '--- 2. Granular permissions: an editor who cannot publish'
select tt.logout();
insert into role_permissions (role, permission) values
  ('staff', 'content.view'), ('staff', 'content.create'), ('staff', 'content.edit'), ('staff', 'content.manage_diary');
select tt.login('00000000-0000-0000-0000-00000000c502');
select tt.check((select count(*) from diary_posts where slug like 'test-draft-%') = 2, 'a diary editor sees drafts');
insert into diary_posts (slug, title, body) values ('green-room', 'The green room', 'Draft text');
select tt.check((select created_by = auth.uid() and status = 'draft' from diary_posts where slug = 'green-room'), 'the editor drafts a post (author recorded)');
select tt.expect_error($$insert into diary_posts (slug, title, status) values ('sneaky', 'Sneaky', 'published')$$, '%permission to publish%', 'the editor cannot publish on create');
select tt.expect_error($$update diary_posts set status = 'published' where slug = 'green-room'$$, '%permission to publish%', 'the editor cannot publish a draft');
update diary_posts set body = 'Better draft text' where slug = 'green-room';
select tt.check((select body = 'Better draft text' from diary_posts where slug = 'green-room'), 'the editor can edit a draft');
with d as (delete from diary_posts where slug = 'green-room' returning id) select tt.check(not exists (select 1 from d), 'without content.delete nothing is deleted');
select tt.expect_error($$insert into tv_videos (slug, title, video_url) values ('staff-vid', 'Staff', '/x.mp4')$$, '%row-level security%', 'diary rights do not extend to Tangy TV');
select tt.check((select count(*) = 0 from gallery_albums where status = 'draft'), 'nor to gallery drafts');

\echo '--- 3. Publishing'
select tt.login('00000000-0000-0000-0000-00000000c501');
update diary_posts set status = 'published' where slug = 'green-room';
select tt.check((select published_at is not null from diary_posts where slug = 'green-room'), 'an admin publishes; published_at is stamped');
insert into diary_posts (slug, title, status, published_at) values ('tomorrow', 'Tomorrow', 'published', now() + interval '1 day');
select tt.anon();
select tt.check((select string_agg(slug, ',') = 'green-room' from diary_posts), 'visitors see the published post, not the scheduled one');
select tt.login('00000000-0000-0000-0000-00000000c502');
select tt.expect_error($$update diary_posts set status = 'draft' where slug = 'green-room'$$, '%permission to publish%', 'the editor cannot unpublish either');
select tt.login('00000000-0000-0000-0000-00000000c501');
update diary_posts set status = 'archived' where slug = 'green-room';
select tt.anon();
select tt.check((select count(*) = 0 from diary_posts), 'archived posts leave the public site');

\echo '--- 4. Validation'
select tt.login('00000000-0000-0000-0000-00000000c501');
select tt.expect_error($$insert into tv_videos (slug, title, video_url) values ('Bad Slug!', 'X', '/x.mp4')$$, '%check constraint%', 'slugs must be url-safe');
select tt.expect_error($$insert into tv_videos (slug, title, video_url) values ('test-tv-live', 'Dup', '/x.mp4')$$, '%duplicate key%', 'slugs are unique');
select tt.expect_error($$insert into tv_videos (slug, title, video_url) values ('js', 'X', 'javascript:alert(1)')$$, '%check constraint%', 'video URLs must be site paths or https');
select tt.expect_error($$insert into tv_videos (slug, title, video_url) values ('plain-http', 'X', 'http://example.com/v.mp4')$$, '%check constraint%', 'plain http media is refused');
select tt.expect_error($$insert into tv_videos (slug, title, video_url) values ('blank', '   ', '/x.mp4')$$, '%check constraint%', 'titles cannot be blank');
insert into gallery_albums (id, slug, title) values ('00000000-0000-0000-0000-00000000c701', 'backstage', 'Backstage');
select tt.expect_error($$insert into gallery_photos (album_id, image_url, alt_text) values ('00000000-0000-0000-0000-00000000c701', '/p.jpg', ' ')$$, '%check constraint%', 'photos need alt text');
insert into gallery_photos (album_id, image_url, alt_text) values ('00000000-0000-0000-0000-00000000c701', '/p.jpg', 'Backstage before the show');
select tt.anon();
select tt.check((select count(*) = 0 from gallery_photos where album_id = '00000000-0000-0000-0000-00000000c701'), 'photos in a draft album stay private');

\echo '--- 5. Tangy TV edits reach everyone'
select tt.login('00000000-0000-0000-0000-00000000c501');
update tv_videos set title = 'Test TV — Live at the Stepwell' where slug = 'test-tv-live';
insert into tv_videos (slug, title, video_url, status) values ('new-drop', 'New drop', 'https://cdn.example.com/new.mp4', 'published');
select tt.anon();
select tt.check((select title = 'Test TV — Live at the Stepwell' from tv_videos where slug = 'test-tv-live')
  and exists (select 1 from tv_videos where slug = 'new-drop'), 'an admin''s TV change is what every visitor gets');
select tt.logout();
select tt.check((select count(*) >= 2 from audit_logs where resource_type = 'tv_video' and actor_id = '00000000-0000-0000-0000-00000000c501'), 'TV changes are audited with the editor');

\echo '--- 6. Media bucket'
select tt.login('00000000-0000-0000-0000-00000000c501');
insert into storage.objects (bucket_id, name, owner) values ('content-media', 'tv/abc/new.mp4', auth.uid());
select tt.check(true, 'a content manager can upload media');
select tt.login('00000000-0000-0000-0000-00000000c503');
select tt.expect_error($$insert into storage.objects (bucket_id, name, owner) values ('content-media', 'tv/x/evil.mp4', auth.uid())$$, '%row-level security%', 'a patron cannot upload media');
with u as (update storage.objects set name = 'tv/abc/replaced.mp4' where bucket_id = 'content-media' returning name) select tt.check(not exists (select 1 from u), 'a patron cannot overwrite media');
select tt.logout();
select tt.check((select file_size_limit = 52428800 and 'video/mp4' = any (allowed_mime_types) and not ('text/html' = any (allowed_mime_types)) from storage.buckets where id = 'content-media'),
  'the bucket limits size and file types (no HTML uploads)');

\echo '--- 7. Artist pages'
insert into artists (name, stage_name, email, status) values ('Ravi Kumar', 'DJ Ravi', 'r1@cms.tangy.test', 'approved'), ('Ravi K', 'DJ Ravi', 'r2@cms.tangy.test', 'approved'),
  ('Pending Person', null, 'p@cms.tangy.test', 'pending');
select tt.check((select array_agg(slug order by email) = array['dj-ravi', 'dj-ravi-2'] from artists where email like 'r_@cms.tangy.test'), 'artists get unique slugs from their stage name');
select tt.expect_error($$update artists set slug = 'Not OK' where email = 'r1@cms.tangy.test'$$, '%INVALID_SLUG%', 'custom slugs are validated');
select tt.anon();
select tt.check((select count(*) = 1 from public_artists where slug = 'dj-ravi') and not exists (select 1 from public_artists where name = 'Pending Person'), 'public artist pages: approved only, by slug');

\echo '--- 8. Session copy'
select tt.login('00000000-0000-0000-0000-00000000c501');
select tt.check((select (update_session_content('00000000-0000-0000-0000-00000000c601', '{"description":"New copy","featured":true}')).description = 'New copy'), 'a content manager edits session copy');
select tt.expect_error($$select update_session_content('00000000-0000-0000-0000-00000000c601', '{"price":1}')$$, '%INVALID_FIELD%', 'price is not editable as content');
select tt.expect_error($$select update_session_content('00000000-0000-0000-0000-00000000c601', '{"image_url":"javascript:x"}')$$, '%INVALID_FIELD%', 'image URLs are validated');
select tt.login('00000000-0000-0000-0000-00000000c503');
select tt.expect_error($$select update_session_content('00000000-0000-0000-0000-00000000c601', '{"description":"x"}')$$, '%permission%', 'a patron cannot edit session copy');
select tt.logout();
select tt.check((select price = 1000 and featured from events where id = '00000000-0000-0000-0000-00000000c601'), 'price untouched, featured set');

\echo ''
\echo 'ALL CONTENT CMS DATABASE TESTS PASSED'
rollback;
