-- Tangy Sessions — role-specific profile tables for the four account types
-- that need more than `profiles` carries, plus self-read access to your own
-- application record (collaborations / crew_applications / private_enquiries
-- already exist but only ever supported insert-and-forget from the public
-- forms; now that they can carry a user_id, the applicant should be able to
-- check their own status).

create table vendor_profiles (
  id uuid primary key references profiles(id) on delete cascade,
  business_name text,
  category text,
  gstin text,
  phone text,
  description text,
  updated_at timestamptz not null default now()
);

create table sponsor_profiles (
  id uuid primary key references profiles(id) on delete cascade,
  organization_name text,
  sponsorship_tier text,
  website text,
  contact_designation text,
  updated_at timestamptz not null default now()
);

create table volunteer_profiles (
  id uuid primary key references profiles(id) on delete cascade,
  availability text,
  skills text,
  emergency_contact text,
  updated_at timestamptz not null default now()
);

create table crew_profiles (
  id uuid primary key references profiles(id) on delete cascade,
  department text,
  shift_preference text,
  certifications text,
  updated_at timestamptz not null default now()
);

create trigger vendor_profiles_set_updated_at before update on vendor_profiles for each row execute function set_updated_at();
create trigger sponsor_profiles_set_updated_at before update on sponsor_profiles for each row execute function set_updated_at();
create trigger volunteer_profiles_set_updated_at before update on volunteer_profiles for each row execute function set_updated_at();
create trigger crew_profiles_set_updated_at before update on crew_profiles for each row execute function set_updated_at();

alter table vendor_profiles enable row level security;
alter table sponsor_profiles enable row level security;
alter table volunteer_profiles enable row level security;
alter table crew_profiles enable row level security;

-- Self access is read + update only — a role-specific profile row is created
-- by an admin at the moment they approve/promote the application (see
-- collaborations/crew_applications) and self-insert would let a plain
-- 'user' account fabricate a vendor/sponsor/etc. profile before ever being
-- approved. This does not by itself grant the role — profiles.role is
-- separately guarded by the 0003 self-escalation trigger — but the row
-- shouldn't exist unapproved either.
create policy "vendor_profiles: self read" on vendor_profiles for select using (auth.uid() = id);
create policy "vendor_profiles: self update" on vendor_profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "vendor_profiles: admin full access" on vendor_profiles for all using (is_admin());

create policy "sponsor_profiles: self read" on sponsor_profiles for select using (auth.uid() = id);
create policy "sponsor_profiles: self update" on sponsor_profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "sponsor_profiles: admin full access" on sponsor_profiles for all using (is_admin());

create policy "volunteer_profiles: self read" on volunteer_profiles for select using (auth.uid() = id);
create policy "volunteer_profiles: self update" on volunteer_profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "volunteer_profiles: admin full access" on volunteer_profiles for all using (is_admin());

create policy "crew_profiles: self read" on crew_profiles for select using (auth.uid() = id);
create policy "crew_profiles: self update" on crew_profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "crew_profiles: admin full access" on crew_profiles for all using (is_admin());

-- Applicants can now see their own application/enquiry once it's linked to
-- their account (user_id set at submit time, or backfilled by an admin).
create policy "collaborations: self read own" on collaborations for select using (auth.uid() = user_id);
create policy "crew_applications: self read own" on crew_applications for select using (auth.uid() = user_id);
create policy "private_enquiries: self read own" on private_enquiries for select using (auth.uid() = user_id);
