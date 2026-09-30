-- Rollback for 0028_content_cms.sql. Drops the TV / diary / gallery tables
-- (their content is lost — export first), the content-media bucket policies,
-- artist slugs and the granular content permissions.
begin;

drop function if exists update_session_content(uuid, jsonb);

drop view if exists public_artists;
create view public_artists as
  select id, name, stage_name, genre, subgenre, city, bio, avatar_url, instagram, soundcloud, spotify, youtube,
         performance_type, applied_at
  from artists
  where status = 'approved';
grant select on public_artists to anon, authenticated;
drop trigger if exists artists_slug on artists;
drop function if exists artists_assign_slug();
alter table artists drop constraint if exists artists_slug_key;
alter table artists drop column if exists slug;

drop policy if exists "content-media: upload" on storage.objects;
drop policy if exists "content-media: update" on storage.objects;
drop policy if exists "content-media: delete" on storage.objects;
-- The content-media bucket is left in place: Storage blocks SQL deletes. Empty
-- and remove it from the Storage dashboard/API if it is no longer wanted.

drop table if exists gallery_photos;
drop table if exists gallery_albums;
drop table if exists diary_posts;
drop table if exists tv_videos;
drop function if exists content_guard_publish();
drop function if exists content_slugify(text);
drop function if exists content_can(text, text);

delete from role_permissions where permission in ('content.view', 'content.create', 'content.edit', 'content.publish', 'content.delete',
  'content.manage_tv', 'content.manage_diary', 'content.manage_media', 'content.manage_sessions');

commit;
