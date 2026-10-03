-- Tangy Sessions — core schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) on a fresh project.

create extension if not exists "pgcrypto";

create type user_role as enum ('user', 'artist', 'staff', 'admin', 'super_admin');
create type application_status as enum ('pending', 'approved', 'rejected');
create type booking_status as enum ('pending', 'confirmed', 'cancelled', 'refunded');
create type collaboration_type as enum ('vendor', 'sponsor', 'venue_host');
create type enquiry_type as enum ('private_gathering', 'corporate_event', 'wedding', 'heritage_experience', 'general');

-- PROFILES — one row per authenticated user (normal patrons + staff/admin).
-- Artist accounts also get a profile row (role='artist') in addition to their artists row.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  role user_role not null default 'user',
  member_since timestamptz not null default now(),
  passport_id text unique,
  created_at timestamptz not null default now()
);

create function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, passport_id)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    'TS-' || upper(substr(md5(random()::text || new.id::text), 1, 8))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ARTISTS — application + public directory profile.
create table artists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  genre text,
  city text,
  bio text,
  instagram text,
  soundcloud text,
  experience_level text,
  avatar_url text,
  status application_status not null default 'pending',
  applied_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- EVENTS / SESSIONS
create table events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  event_date date not null,
  event_time text,
  venue text,
  image_url text,
  capacity int not null default 0,
  price int not null default 0,
  status text not null default 'draft', -- draft | on-sale | sold-out | past | cancelled
  featured boolean not null default false,
  tags text[] default '{}',
  story text,
  created_at timestamptz not null default now()
);

create table event_artists (
  event_id uuid references events(id) on delete cascade,
  artist_id uuid references artists(id) on delete cascade,
  primary key (event_id, artist_id)
);

-- BOOKINGS — one row per ticket order.
create table bookings (
  id uuid primary key default gen_random_uuid(),
  registration_code text unique not null,
  user_id uuid references auth.users(id) on delete set null,
  event_id uuid references events(id) on delete cascade,
  attendee_name text not null,
  attendee_email text not null,
  attendee_phone text,
  quantity int not null default 1 check (quantity > 0),
  amount int not null default 0,
  status booking_status not null default 'pending',
  razorpay_order_id text,
  razorpay_payment_id text,
  created_at timestamptz not null default now()
);

-- CHECK-INS
create table checkins (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,
  event_id uuid references events(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  checked_in_by uuid references auth.users(id),
  unique (booking_id)
);

-- WAITLIST
create table waitlist (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  created_at timestamptz not null default now(),
  unique (event_id, email)
);

-- CREW / VOLUNTEER APPLICATIONS
create table crew_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  role_interest text not null,
  event_interest text,
  message text,
  status application_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- COLLABORATIONS — vendors / sponsors / venue & host applications
create table collaborations (
  id uuid primary key default gen_random_uuid(),
  type collaboration_type not null,
  business_name text not null,
  contact_name text,
  email text not null,
  phone text,
  details text,
  status application_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- PRIVATE ENQUIRIES — gatherings / corporate / weddings / heritage
create table private_enquiries (
  id uuid primary key default gen_random_uuid(),
  type enquiry_type not null default 'general',
  name text not null,
  email text not null,
  phone text,
  preferred_date date,
  guest_count int,
  message text,
  status application_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- CONTACT ENQUIRIES — general contact form
create table contact_enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  inquiry_type text,
  message text not null,
  status text not null default 'new', -- new | read | replied
  created_at timestamptz not null default now()
);

create index bookings_user_id_idx on bookings (user_id);
create index bookings_event_id_idx on bookings (event_id);
create index checkins_event_id_idx on checkins (event_id);
create index artists_status_idx on artists (status);
create index events_status_idx on events (status);
