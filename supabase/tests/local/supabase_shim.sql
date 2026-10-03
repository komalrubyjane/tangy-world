-- LOCAL TEST SHIM — emulates just enough of a hosted Supabase project for
-- the migrations in supabase/migrations/ to apply to a plain PostgreSQL 16
-- cluster, and for the security tests to exercise RLS and function
-- privileges as the real API roles would. NEVER run this against a real
-- Supabase project — it creates roles and schemas Supabase already owns.
--
-- What it reproduces (because the security model depends on it):
--   * the anon / authenticated / service_role API roles (service_role
--     bypasses RLS, exactly like the hosted service_role key)
--   * Supabase's default privileges: every table AND function created in
--     `public` is granted to anon, authenticated and service_role, on top of
--     PostgreSQL's own default EXECUTE-to-PUBLIC on functions. This is what
--     made 0016's booking RPCs callable by anyone; without reproducing it
--     the tests would pass for the wrong reason.
--   * auth.users plus auth.uid() / auth.role() / auth.jwt(), reading the
--     same request.jwt.claims GUC PostgREST sets per request.
--   * storage.buckets / storage.objects / storage.foldername() (0013).
--   * the supabase_realtime publication (0008).
--
-- What it does NOT reproduce: GoTrue, PostgREST itself, Edge Functions,
-- Storage API, Realtime. Tests impersonate an API request by switching
-- role + setting request.jwt.claims, which is what PostgREST does.

create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;

create schema auth;
grant usage on schema auth to anon, authenticated, service_role;

-- Subset of GoTrue's auth.users columns that migrations and tests touch.
create table auth.users (
  id uuid primary key,
  aud varchar(255),
  role varchar(255),
  email varchar(255),
  phone text,
  email_confirmed_at timestamptz,
  last_sign_in_at timestamptz,
  raw_app_meta_data jsonb default '{}'::jsonb,
  raw_user_meta_data jsonb default '{}'::jsonb,
  is_anonymous boolean not null default false,
  banned_until timestamptz,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')
  )::jsonb;
$$;

create function auth.uid() returns uuid language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid;
$$;

create function auth.role() returns text language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text;
$$;

grant execute on all functions in schema auth to anon, authenticated, service_role;

create schema storage;
grant usage on schema storage to anon, authenticated, service_role;

create table storage.buckets (
  id text primary key,
  name text not null,
  owner uuid,
  owner_id text,
  public boolean default false,
  avif_autodetection boolean default false,
  file_size_limit bigint,
  allowed_mime_types text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets(id),
  name text,
  owner uuid,
  owner_id text,
  metadata jsonb,
  user_metadata jsonb,
  version text,
  path_tokens text[] generated always as (string_to_array(name, '/')) stored,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_accessed_at timestamptz default now()
);
alter table storage.objects enable row level security;
grant all on storage.objects to anon, authenticated, service_role;

create function storage.foldername(name text) returns text[] language sql immutable as $$
  select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1];
$$;
create function storage.filename(name text) returns text language sql immutable as $$
  select (string_to_array(name, '/'))[array_length(string_to_array(name, '/'), 1)];
$$;
create function storage.extension(name text) returns text language sql immutable as $$
  select reverse(split_part(reverse(name), '.', 1));
$$;
grant execute on all functions in schema storage to anon, authenticated, service_role;

create publication supabase_realtime;

-- Supabase's default privileges for objects the migration role creates.
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

-- Supabase installs extensions into their own schema and puts it on the
-- search_path; later migrations call extensions.gen_random_bytes() etc.
create schema extensions;
grant usage on schema extensions to anon, authenticated, service_role;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;
alter database postgres set search_path to "$user", public, extensions;
