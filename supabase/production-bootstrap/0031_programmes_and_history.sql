-- Tangy Sessions — programmes and session history.
-- Run after 0030_invitations_and_volunteer_access.sql. Reverse with
-- supabase/rollbacks/0031_programmes_and_history.down.sql.
--
-- 1. PROGRAMMES. A programme is a published season/series (e.g. "Monsoon
--    Sessions 2025") that groups sessions. Same content model as TV / diary /
--    gallery (0028): draft → published (scheduled by published_at) →
--    archived, publish needs content.publish, every change audited. Editing
--    uses the sessions content area (content.manage_sessions).
-- 2. RECORDED ATTENDANCE. events.attendance_recorded — the head count for a
--    past session, for nights held before online ticketing (where bookings
--    and check-ins can't say how many came). Null when unknown; the public
--    session archive shows it only when set.

create table if not exists programmes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 80),
  title text not null check (length(trim(title)) between 1 and 120),
  year int not null check (year between 2000 and 2100),
  season text check (season is null or length(season) <= 40),
  description text not null default '' check (length(description) <= 4000),
  venue text check (venue is null or length(venue) <= 200),
  cover_url text check (cover_url is null or cover_url ~ '^(/|https://)\S+$'),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  sort_order int not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists programmes_year_idx on programmes (year desc, sort_order);

create table if not exists programme_events (
  programme_id uuid not null references programmes(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  position int not null default 0,
  primary key (programme_id, event_id)
);
create index if not exists programme_events_event_idx on programme_events (event_id);

create trigger programmes_guard before insert or update on programmes for each row execute function content_guard_publish();
create trigger programmes_audit after insert or update or delete on programmes for each row execute function audit_row_change('programme');

alter table programmes enable row level security;
create policy "programmes: public published" on programmes for select using (status = 'published' and published_at <= now());
create policy "programmes: console read" on programmes for select to authenticated using (content_can('view', 'sessions'));
create policy "programmes: create" on programmes for insert to authenticated with check (content_can('create', 'sessions'));
create policy "programmes: edit" on programmes for update to authenticated using (content_can('edit', 'sessions')) with check (content_can('edit', 'sessions'));
create policy "programmes: delete" on programmes for delete to authenticated using (content_can('delete', 'sessions'));

alter table programme_events enable row level security;
-- Visible with its programme; the event itself still follows the events policies.
create policy "programme_events: public published" on programme_events for select
  using (exists (select 1 from programmes p where p.id = programme_id and p.status = 'published' and p.published_at <= now()));
create policy "programme_events: console read" on programme_events for select to authenticated using (content_can('view', 'sessions'));
create policy "programme_events: write" on programme_events for all to authenticated
  using (content_can('edit', 'sessions')) with check (content_can('edit', 'sessions'));

grant select on programmes, programme_events to anon, authenticated;
grant insert, update, delete on programmes, programme_events to authenticated;

alter table events add column if not exists attendance_recorded int check (attendance_recorded is null or attendance_recorded >= 0);
