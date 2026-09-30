-- Tangy Sessions — content CMS: Tangy TV, Diary, Gallery, artist pages and
-- session copy, with granular content permissions.
--
-- Before this, Tangy TV channels lived in each admin's browser localStorage
-- (edits never reached visitors), and the diary / gallery / artists shown on
-- the public site were hard-coded in src/data/mockData.js.
--
-- Permissions (content.manage stays for announcements):
--   content.view            see drafts in the console
--   content.create          add items            } combined with the area
--   content.edit            change items         } permission below
--   content.publish         publish / unpublish (enforced by trigger)
--   content.delete          delete items
--   content.manage_tv       Tangy TV
--   content.manage_diary    Diary
--   content.manage_media    Gallery albums/photos and the content-media bucket
--   content.manage_sessions public copy of sessions (description, story,
--                           image, tags, featured) via update_session_content()
-- admin and super_admin get all of them; staff get none.
--
-- Visitors read only published items (published_at in the past).
-- Seeds: the TV channels and gallery photos already bundled with the site
-- are imported as published. The old static diary copy is imported as DRAFTS
-- for the team to review — it was placeholder marketing text.
--
-- Rollback: rollbacks/0028_content_cms.down.sql

begin;

-- Permissions -----------------------------------------------------------------------------
insert into role_permissions (role, permission)
select r::user_role, p from unnest(array['super_admin', 'admin']) r,
  unnest(array['content.view', 'content.create', 'content.edit', 'content.publish', 'content.delete',
               'content.manage_tv', 'content.manage_diary', 'content.manage_media', 'content.manage_sessions']) p
on conflict do nothing;

-- action ∈ view/create/edit/publish/delete, area ∈ tv/diary/media
create or replace function content_can(p_action text, p_area text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select has_permission('content.' || p_action) and has_permission('content.manage_' || p_area);
$$;
grant execute on function content_can(text, text) to authenticated;

-- Publishing requires content.publish, whoever edits the row.
create or replace function content_guard_publish()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is not null and (
     (tg_op = 'INSERT' and new.status = 'published')
     or (tg_op = 'UPDATE' and (new.status = 'published') is distinct from (old.status = 'published'))
     or (tg_op = 'UPDATE' and old.status = 'published' and new.published_at is distinct from old.published_at))
     and not has_permission('content.publish') then
    raise exception 'You do not have permission to publish or unpublish content.';
  end if;
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  if tg_op = 'INSERT' then
    new.created_by := coalesce(auth.uid(), new.created_by);
  end if;
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  new.updated_at := now();
  return new;
end;
$$;

create or replace function content_slugify(p_text text)
returns text
language sql immutable
as $$
  select nullif(trim(both '-' from regexp_replace(lower(coalesce(p_text, '')), '[^a-z0-9]+', '-', 'g')), '');
$$;

-- Tangy TV -----------------------------------------------------------------------------------
create table if not exists tv_videos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 80),
  title text not null check (length(btrim(title)) between 1 and 160),
  description text check (length(description) <= 4000),
  video_url text not null check (video_url ~ '^(/|https://)'),
  thumbnail_url text check (thumbnail_url ~ '^(/|https://)'),
  duration_seconds integer check (duration_seconds > 0),
  category text check (length(category) <= 60),
  event_id uuid references events(id) on delete set null,
  in_player boolean not null default true,     -- plays on the retro TV set
  featured boolean not null default false,
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tv_videos_public_idx on tv_videos (status, sort_order, published_at desc);

-- Diary ---------------------------------------------------------------------------------------
create table if not exists diary_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 80),
  title text not null check (length(btrim(title)) between 1 and 160),
  excerpt text check (length(excerpt) <= 400),
  body text not null default '' check (length(body) <= 50000),
  cover_url text check (cover_url ~ '^(/|https://)'),
  location text check (length(location) <= 120),
  author_name text check (length(author_name) <= 120),
  tags text[] not null default '{}',
  event_id uuid references events(id) on delete set null,
  seo_description text check (length(seo_description) <= 200),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists diary_posts_public_idx on diary_posts (status, published_at desc);

-- Gallery -------------------------------------------------------------------------------------
create table if not exists gallery_albums (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 80),
  title text not null check (length(btrim(title)) between 1 and 160),
  description text check (length(description) <= 2000),
  cover_url text check (cover_url ~ '^(/|https://)'),
  event_id uuid references events(id) on delete set null,
  taken_on date,
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists gallery_photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references gallery_albums(id) on delete cascade,
  image_url text not null check (image_url ~ '^(/|https://)'),
  caption text check (length(caption) <= 300),
  alt_text text not null check (length(btrim(alt_text)) between 1 and 300),   -- required for accessibility
  credit text check (length(credit) <= 120),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists gallery_photos_album_idx on gallery_photos (album_id, sort_order);

-- Triggers --------------------------------------------------------------------------------------
drop trigger if exists tv_videos_guard on tv_videos;
create trigger tv_videos_guard before insert or update on tv_videos for each row execute function content_guard_publish();
drop trigger if exists diary_posts_guard on diary_posts;
create trigger diary_posts_guard before insert or update on diary_posts for each row execute function content_guard_publish();
drop trigger if exists gallery_albums_guard on gallery_albums;
create trigger gallery_albums_guard before insert or update on gallery_albums for each row execute function content_guard_publish();

drop trigger if exists tv_videos_audit on tv_videos;
create trigger tv_videos_audit after insert or update or delete on tv_videos for each row execute function audit_row_change('tv_video');
drop trigger if exists diary_posts_audit on diary_posts;
create trigger diary_posts_audit after insert or update or delete on diary_posts for each row execute function audit_row_change('diary_post');
drop trigger if exists gallery_albums_audit on gallery_albums;
create trigger gallery_albums_audit after insert or update or delete on gallery_albums for each row execute function audit_row_change('gallery_album');

-- RLS ----------------------------------------------------------------------------------------------
alter table tv_videos enable row level security;
alter table diary_posts enable row level security;
alter table gallery_albums enable row level security;
alter table gallery_photos enable row level security;

drop policy if exists "tv_videos: public published" on tv_videos;
create policy "tv_videos: public published" on tv_videos for select using (status = 'published' and published_at <= now());
drop policy if exists "tv_videos: console read" on tv_videos;
create policy "tv_videos: console read" on tv_videos for select to authenticated using (content_can('view', 'tv'));
drop policy if exists "tv_videos: create" on tv_videos;
create policy "tv_videos: create" on tv_videos for insert to authenticated with check (content_can('create', 'tv'));
drop policy if exists "tv_videos: edit" on tv_videos;
create policy "tv_videos: edit" on tv_videos for update to authenticated using (content_can('edit', 'tv')) with check (content_can('edit', 'tv'));
drop policy if exists "tv_videos: delete" on tv_videos;
create policy "tv_videos: delete" on tv_videos for delete to authenticated using (content_can('delete', 'tv'));

drop policy if exists "diary_posts: public published" on diary_posts;
create policy "diary_posts: public published" on diary_posts for select using (status = 'published' and published_at <= now());
drop policy if exists "diary_posts: console read" on diary_posts;
create policy "diary_posts: console read" on diary_posts for select to authenticated using (content_can('view', 'diary'));
drop policy if exists "diary_posts: create" on diary_posts;
create policy "diary_posts: create" on diary_posts for insert to authenticated with check (content_can('create', 'diary'));
drop policy if exists "diary_posts: edit" on diary_posts;
create policy "diary_posts: edit" on diary_posts for update to authenticated using (content_can('edit', 'diary')) with check (content_can('edit', 'diary'));
drop policy if exists "diary_posts: delete" on diary_posts;
create policy "diary_posts: delete" on diary_posts for delete to authenticated using (content_can('delete', 'diary'));

drop policy if exists "gallery_albums: public published" on gallery_albums;
create policy "gallery_albums: public published" on gallery_albums for select using (status = 'published' and published_at <= now());
drop policy if exists "gallery_albums: console read" on gallery_albums;
create policy "gallery_albums: console read" on gallery_albums for select to authenticated using (content_can('view', 'media'));
drop policy if exists "gallery_albums: create" on gallery_albums;
create policy "gallery_albums: create" on gallery_albums for insert to authenticated with check (content_can('create', 'media'));
drop policy if exists "gallery_albums: edit" on gallery_albums;
create policy "gallery_albums: edit" on gallery_albums for update to authenticated using (content_can('edit', 'media')) with check (content_can('edit', 'media'));
drop policy if exists "gallery_albums: delete" on gallery_albums;
create policy "gallery_albums: delete" on gallery_albums for delete to authenticated using (content_can('delete', 'media'));

drop policy if exists "gallery_photos: public published" on gallery_photos;
create policy "gallery_photos: public published" on gallery_photos for select
  using (exists (select 1 from gallery_albums a where a.id = album_id and a.status = 'published' and a.published_at <= now()));
drop policy if exists "gallery_photos: console read" on gallery_photos;
create policy "gallery_photos: console read" on gallery_photos for select to authenticated using (content_can('view', 'media'));
drop policy if exists "gallery_photos: create" on gallery_photos;
create policy "gallery_photos: create" on gallery_photos for insert to authenticated with check (content_can('edit', 'media'));
drop policy if exists "gallery_photos: edit" on gallery_photos;
create policy "gallery_photos: edit" on gallery_photos for update to authenticated using (content_can('edit', 'media')) with check (content_can('edit', 'media'));
drop policy if exists "gallery_photos: delete" on gallery_photos;
create policy "gallery_photos: delete" on gallery_photos for delete to authenticated using (content_can('edit', 'media'));

grant select on tv_videos, diary_posts, gallery_albums, gallery_photos to anon, authenticated;
grant insert, update, delete on tv_videos, diary_posts, gallery_albums, gallery_photos to authenticated;

-- Media bucket ---------------------------------------------------------------------------------------
-- Public-read (files are served by URL; drafts' files live under random
-- paths). Uploads/changes need a content area permission.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('content-media', 'content-media', true, 52428800,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'video/mp4', 'video/webm'])
on conflict (id) do nothing;

drop policy if exists "content-media: upload" on storage.objects;
create policy "content-media: upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'content-media' and (public.content_can('create', 'media') or public.content_can('create', 'tv') or public.content_can('create', 'diary')
                                               or public.content_can('edit', 'media') or public.content_can('edit', 'tv') or public.content_can('edit', 'diary')));
drop policy if exists "content-media: update" on storage.objects;
create policy "content-media: update" on storage.objects for update to authenticated
  using (bucket_id = 'content-media' and (public.content_can('edit', 'media') or public.content_can('edit', 'tv') or public.content_can('edit', 'diary')));
drop policy if exists "content-media: delete" on storage.objects;
create policy "content-media: delete" on storage.objects for delete to authenticated
  using (bucket_id = 'content-media' and (public.content_can('delete', 'media') or public.content_can('delete', 'tv') or public.content_can('delete', 'diary')));

-- Artist pages ---------------------------------------------------------------------------------------
alter table artists add column if not exists slug text;
create or replace function artists_assign_slug()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_base text;
  v_slug text;
  n int := 1;
begin
  if new.slug is not null then
    if new.slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(new.slug) > 80 then
      raise exception 'INVALID_SLUG: use lowercase letters, numbers and hyphens.';
    end if;
    return new;
  end if;
  v_base := coalesce(content_slugify(coalesce(nullif(btrim(new.stage_name), ''), new.name)), 'artist');
  v_base := left(v_base, 70);
  v_slug := v_base;
  while exists (select 1 from artists where slug = v_slug and id <> new.id) loop
    n := n + 1;
    v_slug := v_base || '-' || n;
  end loop;
  new.slug := v_slug;
  return new;
end;
$$;
drop trigger if exists artists_slug on artists;
create trigger artists_slug before insert or update of slug on artists for each row execute function artists_assign_slug();
do $$
declare r record;
begin
  for r in select id from artists where slug is null order by applied_at nulls last, id loop
    update artists set slug = null where id = r.id;   -- the trigger assigns a unique slug
  end loop;
end $$;
alter table artists drop constraint if exists artists_slug_key;
alter table artists add constraint artists_slug_key unique (slug);

create or replace view public_artists as
  select id, name, stage_name, genre, subgenre, city, bio, avatar_url, instagram, soundcloud, spotify, youtube,
         performance_type, applied_at, slug
  from artists
  where status = 'approved'::application_status;
grant select on public_artists to anon, authenticated;

-- Session copy (content.manage_sessions; pricing/capacity stay with events.manage) --------------------
create or replace function update_session_content(p_event_id uuid, p_fields jsonb)
returns events
language plpgsql security definer set search_path = public
as $$
declare
  v_event events%rowtype;
  v_bad text;
begin
  if not (has_permission('content.manage_sessions') and has_permission('content.edit')) then
    raise exception 'You do not have permission to edit session content.';
  end if;
  select k into v_bad from jsonb_object_keys(coalesce(p_fields, '{}'::jsonb)) k
   where k not in ('description', 'story', 'image_url', 'tags', 'featured') limit 1;
  if v_bad is not null then
    raise exception 'INVALID_FIELD: % cannot be edited here.', v_bad;
  end if;
  if p_fields ? 'image_url' and nullif(p_fields ->> 'image_url', '') !~ '^(/|https://)' then
    raise exception 'INVALID_FIELD: image_url must be a site path or https URL.';
  end if;
  update events set
    description = case when p_fields ? 'description' then nullif(btrim(p_fields ->> 'description'), '') else description end,
    story = case when p_fields ? 'story' then nullif(btrim(p_fields ->> 'story'), '') else story end,
    image_url = case when p_fields ? 'image_url' then nullif(btrim(p_fields ->> 'image_url'), '') else image_url end,
    tags = case when p_fields ? 'tags' then array(select jsonb_array_elements_text(p_fields -> 'tags')) else tags end,
    featured = case when p_fields ? 'featured' then (p_fields ->> 'featured')::boolean else featured end
  where id = p_event_id
  returning * into v_event;
  if v_event.id is null then
    raise exception 'EVENT_NOT_FOUND';
  end if;
  return v_event;
end;
$$;
revoke execute on function update_session_content(uuid, jsonb) from public, anon;
grant execute on function update_session_content(uuid, jsonb) to authenticated;

-- Seeds (existing site media) ---------------------------------------------------------------------------
insert into tv_videos (slug, title, video_url, sort_order, status, published_at, category) values
  ('damini-bhattacharya-live', 'Damini Bhattacharya — Live Session', '/media/background-video/Video-daminibhattacharya-live.mp4', 1, 'published', now(), 'Live sessions'),
  ('field-recording-22402', 'Field Recording — Vol. 22402', '/media/background-video/Video-22402.mp4', 2, 'published', now(), 'Field recordings'),
  ('field-recording-22653', 'Field Recording — Vol. 22653', '/media/background-video/Video-22653.mp4', 3, 'published', now(), 'Field recordings'),
  ('field-recording-37256', 'Field Recording — Vol. 37256', '/media/background-video/Video-37256.mp4', 4, 'published', now(), 'Field recordings'),
  ('field-recording-46723', 'Field Recording — Vol. 46723', '/media/background-video/Video-46723.mp4', 5, 'published', now(), 'Field recordings'),
  ('field-recording-63639', 'Field Recording — Vol. 63639', '/media/background-video/Video-63639.mp4', 6, 'published', now(), 'Field recordings'),
  ('field-recording-66802', 'Field Recording — Vol. 66802', '/media/background-video/Video-66802.mp4', 7, 'published', now(), 'Field recordings'),
  ('field-recording-76353', 'Field Recording — Vol. 76353', '/media/background-video/Video-76353.mp4', 8, 'published', now(), 'Field recordings')
on conflict (slug) do nothing;

insert into gallery_albums (slug, title, description, cover_url, sort_order, status, published_at) values
  ('tangy-sessions', 'Tangy Sessions', 'Moments from Tangy nights.', '/media/gallery/tangy1.jpg', 1, 'published', now())
on conflict (slug) do nothing;
insert into gallery_photos (album_id, image_url, alt_text, caption, sort_order)
select a.id, v.src, v.alt, v.caption, v.n
from gallery_albums a, (values
  (1, '/media/gallery/tangy1.jpg', 'The stepwell entrance lit for a Tangy session', 'Stepwell entrance'),
  (2, '/media/gallery/tangy2.jpg', 'The stage being set up before the gates open', 'Stage setup'),
  (3, '/media/gallery/tangy3.jpg', 'The crowd during a set', 'Crowd'),
  (4, '/media/gallery/tangy4.jpg', 'The venue at night', 'Night ambience'),
  (5, '/media/gallery/tangy5.jpg', 'The DJ booth', 'DJ booth'),
  (6, '/media/gallery/tangy6.jpg', 'Lights over the stage', 'Light show'),
  (7, '/media/gallery/tngy7.jpg', 'Steps descending into the stepwell', 'The descent'),
  (8, '/media/gallery/tangy8.jpg', 'Sound check before the show', 'Sound check'),
  (9, '/media/gallery/tangy9.jpg', 'After hours at the venue', 'After hours'),
  (10, '/media/gallery/tangy10.jpg', 'A set in progress', 'Sonic rituals')
) v(n, src, alt, caption)
where a.slug = 'tangy-sessions' and not exists (select 1 from gallery_photos p where p.album_id = a.id);

insert into diary_posts (slug, title, excerpt, body, cover_url, location, status) values
  ('why-we-play-inside-a-stepwell', 'Why we play inside a stepwell', null,
   'The stepwell echoes before the crowd arrives. Water dripping against 350-year-old stone, acoustic instruments humming without amplification. The air smells like rain and ancient limestone.',
   '/media/gallery/tangy1.jpg', 'Bansilalpet Stepwell', 'draft'),
  ('monsoon-acoustic-sessions', 'Monsoon acoustic sessions', null,
   'When the lights dropped at midnight, the crowd stood completely still under rain-soaked arches. No phones in the air. Just violin ragas vibrating through granite masonry.',
   '/media/gallery/tangy3.jpg', 'Taramati Baradari', 'draft'),
  ('how-we-choose-our-venues', 'How we choose our venues',
   'Here is what we look for when scouting a Tangy Sessions space.',
   'Three rules: the walls must be at least 100 years old. The acoustics must work without amplification. And there must be a story buried in the stone — a story the music can excavate and bring back to life.',
   '/media/gallery/tangy5.jpg', 'Hyderabad', 'draft'),
  ('field-notes-before-the-show', 'Field notes: before the show',
   'The hours before the gates open — from chai setup to microphone placement to the last acoustic checks.',
   'Clay chai stalls are assembled at the entrance. Ribbon microphones are suspended above the water basin. Sound check: we drop a glass bottle and listen to it echo inside the stone chamber.',
   '/media/gallery/tangy9.jpg', 'Bansilalpet Stepwell', 'draft')
on conflict (slug) do nothing;

commit;
