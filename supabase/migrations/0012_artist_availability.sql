-- Tangy Sessions — real artist availability calendar (Phase 3 follow-up).
--
-- CalendarPage.jsx previously held availability entirely in local React
-- state with a "SAVE" button that showed a success message and persisted
-- nothing — a real fake-functionality bug, not just missing polish. This
-- table is the fix. Only 'available'/'tentative'/'unavailable' are
-- self-settable; 'booked' is never stored here — it's derived from real
-- confirmed performances (event_artists) so an artist can't misrepresent
-- their own booking status.

create table artist_availability (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references artists(id) on delete cascade,
  date date not null,
  status text not null check (status in ('available', 'tentative', 'unavailable')),
  updated_at timestamptz not null default now(),
  unique (artist_id, date)
);

create index artist_availability_artist_id_idx on artist_availability (artist_id);

create trigger artist_availability_set_updated_at before update on artist_availability
  for each row execute function set_updated_at();

alter table artist_availability enable row level security;

create policy "artist_availability: public read" on artist_availability for select using (true);
-- Public read (not just self/admin) mirrors "artists: public read approved"
-- in 0002_rls.sql — admin scheduling a session needs to see every approved
-- artist's availability, not just their own.

create policy "artist_availability: self manage" on artist_availability for insert
  with check (exists (select 1 from artists where id = artist_id and user_id = auth.uid()));
create policy "artist_availability: self update" on artist_availability for update
  using (exists (select 1 from artists where id = artist_id and user_id = auth.uid()));
create policy "artist_availability: self delete" on artist_availability for delete
  using (exists (select 1 from artists where id = artist_id and user_id = auth.uid()));
create policy "artist_availability: admin manage" on artist_availability for all
  using (is_admin());
