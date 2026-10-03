-- Tangy Sessions — application → admin approval → automatic email lifecycle.
-- Run after 0014_artist_spotify.sql.
--
-- Three things, none of which touch the existing security model:
--
-- 1. Close the anonymous-application gap on collaborations/crew_applications
--    (both previously "anyone can apply" / insert with check (true)) by
--    requiring a real, authenticated auth.uid() that matches the row's own
--    user_id. artists is handled differently — see the note above its policy
--    below, it is NOT tightened the same way.
--
-- 2. application_notifications — a small, generic, admin-only table that
--    tracks whether an approval email has been sent for a given application,
--    so re-approving (or retrying) never sends a duplicate. One row per
--    (source_table, source_id, notification_type) — the unique constraint
--    IS the idempotency guarantee.
--
-- 3. Extend approve_collaboration / approve_crew_application (already the
--    sole, atomic, admin-only path that provisions a role — see
--    0011_role_portals.sql) to also insert a 'pending' notification row in
--    the same transaction as the approval. Add approve_artist_application /
--    reject_artist_application, replacing the direct `.update()` the admin
--    UI previously used on `artists` (src/admin/sections/ArtistsSection.jsx),
--    so artist approval gets the same atomic notification-row guarantee.
--    Artist role provisioning itself is intentionally UNCHANGED — artists.status
--    stays the authoritative "is this artist approved" signal, never
--    profiles.role (see 0003_role_security.sql's own note on this).
--
-- The actual email SEND happens in a separate step (the send-approval-email
-- Edge Function, called by the client after a successful approval RPC) —
-- never from inside Postgres, and never with a provider secret anywhere near
-- the browser. This migration only creates the row that function reads/writes.

-- 1. AUTHENTICATED-ONLY APPLICATIONS ----------------------------------------

drop policy "collaborations: anyone can apply" on collaborations;
create policy "collaborations: authenticated self apply" on collaborations for insert
  with check (auth.uid() is not null and auth.uid() = user_id);

drop policy "crew_applications: anyone can apply" on crew_applications;
create policy "crew_applications: authenticated self apply" on crew_applications for insert
  with check (auth.uid() is not null and auth.uid() = user_id);

-- artists is NOT tightened to auth.uid() = user_id: src/artist/services/authService.js's
-- applyAsArtist() calls supabase.auth.signUp() immediately followed by this
-- insert, and if the project has email confirmation enabled, there is no
-- active session yet at that exact moment (auth.uid() reads null) even
-- though a real auth.users row now exists. Requiring auth.uid() = user_id
-- here would silently break every new artist application under that
-- configuration. Instead, still close the fully-anonymous-application gap
-- the same way in spirit: require a real, non-null user_id, which (thanks to
-- the existing `references auth.users(id)` foreign key) can only ever be a
-- genuine account — you just can no longer apply with no account at all.
drop policy "artists: anyone can apply" on artists;
create policy "artists: requires linked account" on artists for insert
  with check (user_id is not null);

-- 2. APPLICATION_NOTIFICATIONS ------------------------------------------

create table application_notifications (
  id uuid primary key default gen_random_uuid(),
  source_table text not null check (source_table in ('collaborations', 'crew_applications', 'artists')),
  source_id uuid not null,
  notification_type text not null default 'approval' check (notification_type in ('approval', 'rejection')),
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_table, source_id, notification_type)
);

create index application_notifications_status_idx on application_notifications (status);

create trigger application_notifications_set_updated_at before update on application_notifications
  for each row execute function set_updated_at();

alter table application_notifications enable row level security;
create policy "application_notifications: admin full access" on application_notifications for all using (is_admin());

-- 3. APPROVAL RPCs — now also queue the notification, atomically -----------

create or replace function approve_collaboration(p_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_collab collaborations%rowtype;
begin
  if not is_admin() then
    raise exception 'Only an admin can approve applications.';
  end if;
  select * into v_collab from collaborations where id = p_id;
  if v_collab.id is null then
    raise exception 'Application not found.';
  end if;

  update collaborations set status = 'approved' where id = p_id;

  if v_collab.user_id is not null then
    if v_collab.type = 'vendor' then
      insert into vendor_profiles (id, business_name) values (v_collab.user_id, v_collab.business_name) on conflict (id) do nothing;
      update profiles set role = 'vendor' where id = v_collab.user_id and role = 'user';
    elsif v_collab.type = 'sponsor' then
      insert into sponsor_profiles (id, organization_name) values (v_collab.user_id, v_collab.business_name) on conflict (id) do nothing;
      update profiles set role = 'sponsor' where id = v_collab.user_id and role = 'user';
    elsif v_collab.type = 'venue_host' then
      insert into venue_profiles (id, property_name) values (v_collab.user_id, v_collab.business_name) on conflict (id) do nothing;
      update profiles set role = 'venue' where id = v_collab.user_id and role = 'user';
    end if;

    insert into application_notifications (source_table, source_id, notification_type)
    values ('collaborations', p_id, 'approval')
    on conflict (source_table, source_id, notification_type) do nothing;
  end if;
end;
$$;

create or replace function approve_crew_application(p_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_app crew_applications%rowtype;
begin
  if not is_admin() then
    raise exception 'Only an admin can approve applications.';
  end if;
  select * into v_app from crew_applications where id = p_id;
  if v_app.id is null then
    raise exception 'Application not found.';
  end if;

  update crew_applications set status = 'approved' where id = p_id;

  if v_app.user_id is not null then
    if v_app.category = 'volunteer' then
      insert into volunteer_profiles (id) values (v_app.user_id) on conflict (id) do nothing;
      update profiles set role = 'volunteer' where id = v_app.user_id and role = 'user';
    else
      insert into crew_profiles (id) values (v_app.user_id) on conflict (id) do nothing;
      update profiles set role = 'crew' where id = v_app.user_id and role = 'user';
    end if;

    insert into application_notifications (source_table, source_id, notification_type)
    values ('crew_applications', p_id, 'approval')
    on conflict (source_table, source_id, notification_type) do nothing;
  end if;
end;
$$;

-- New — mirrors the two RPCs above, for the one role-application flow
-- (artists) that previously had no RPC at all (src/admin/sections/ArtistsSection.jsx
-- called `supabase.from('artists').update({status})` directly). Role
-- provisioning for artists stays exactly as it already was (artists.status,
-- not profiles.role) — this only adds the same admin-gate + atomic
-- notification-row guarantee the other two flows already had.
create function approve_artist_application(p_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_artist artists%rowtype;
begin
  if not is_admin() then
    raise exception 'Only an admin can approve applications.';
  end if;
  select * into v_artist from artists where id = p_id;
  if v_artist.id is null then
    raise exception 'Application not found.';
  end if;

  update artists set status = 'approved', reviewed_at = now() where id = p_id;

  if v_artist.user_id is not null then
    insert into application_notifications (source_table, source_id, notification_type)
    values ('artists', p_id, 'approval')
    on conflict (source_table, source_id, notification_type) do nothing;
  end if;
end;
$$;

create function reject_artist_application(p_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Only an admin can reject applications.';
  end if;
  update artists set status = 'rejected', reviewed_at = now() where id = p_id;
end;
$$;
