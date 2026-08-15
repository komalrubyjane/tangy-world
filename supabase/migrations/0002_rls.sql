-- Tangy Sessions — row-level security
-- Run after 0001_schema.sql. Authorization is enforced here (DB-level), never only in the frontend.

create function current_role_name()
returns user_role
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create function is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(current_role_name() in ('admin', 'super_admin'), false);
$$;

create function is_staff_or_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(current_role_name() in ('staff', 'admin', 'super_admin'), false);
$$;

-- PROFILES
alter table profiles enable row level security;

create policy "profiles: self read" on profiles for select using (auth.uid() = id);
create policy "profiles: self update" on profiles for update using (auth.uid() = id);
create policy "profiles: admin read all" on profiles for select using (is_admin());
create policy "profiles: admin update all" on profiles for update using (is_admin());

-- ARTISTS
alter table artists enable row level security;

create policy "artists: public read approved" on artists for select using (status = 'approved');
create policy "artists: self read own application" on artists for select using (auth.uid() = user_id);
create policy "artists: anyone can apply" on artists for insert with check (true);
create policy "artists: self update own profile" on artists for update using (auth.uid() = user_id);
create policy "artists: admin full access" on artists for all using (is_admin());

-- EVENTS
alter table events enable row level security;

create policy "events: public read published" on events for select using (status <> 'draft');
create policy "events: admin full access" on events for all using (is_admin());

-- EVENT_ARTISTS
alter table event_artists enable row level security;

create policy "event_artists: public read" on event_artists for select using (true);
create policy "event_artists: admin write" on event_artists for all using (is_admin());

-- BOOKINGS
alter table bookings enable row level security;

create policy "bookings: self read own" on bookings for select using (auth.uid() = user_id);
create policy "bookings: self create own" on bookings for insert with check (auth.uid() = user_id);
create policy "bookings: staff/admin full access" on bookings for all using (is_staff_or_admin());

-- CHECKINS
alter table checkins enable row level security;

create policy "checkins: staff/admin only" on checkins for all using (is_staff_or_admin());

-- WAITLIST — public can join (even signed out), only staff/admin can read the list.
alter table waitlist enable row level security;

create policy "waitlist: anyone can join" on waitlist for insert with check (true);
create policy "waitlist: staff/admin read" on waitlist for select using (is_staff_or_admin());

-- CREW_APPLICATIONS
alter table crew_applications enable row level security;

create policy "crew_applications: anyone can apply" on crew_applications for insert with check (true);
create policy "crew_applications: admin manage" on crew_applications for all using (is_admin());

-- COLLABORATIONS
alter table collaborations enable row level security;

create policy "collaborations: anyone can apply" on collaborations for insert with check (true);
create policy "collaborations: admin manage" on collaborations for all using (is_admin());

-- PRIVATE_ENQUIRIES
alter table private_enquiries enable row level security;

create policy "private_enquiries: anyone can submit" on private_enquiries for insert with check (true);
create policy "private_enquiries: admin manage" on private_enquiries for all using (is_admin());

-- CONTACT_ENQUIRIES
alter table contact_enquiries enable row level security;

create policy "contact_enquiries: anyone can submit" on contact_enquiries for insert with check (true);
create policy "contact_enquiries: admin manage" on contact_enquiries for all using (is_admin());
