-- Tangy Sessions — Admin System: RBAC, audit log, staff event scoping,
-- application review metadata, venues, announcements, system settings,
-- booking administration, check-in history and reporting RPCs.
-- Run after 0016_payments_tickets_checkin.sql. Reverse with
-- supabase/rollbacks/0017_admin_system.down.sql (drops only what this file adds; never touches
-- pre-existing rows).
--
-- Hierarchy: super_admin > admin (a.k.a. "Admin / Manager") > staff. All three
-- already exist in user_role (0001) — no new enum values are needed.
--
-- What this file changes about EXISTING behavior (all deliberate):
--
-- 1. SECURITY FIX — create_pending_booking() and confirm_booking_and_issue_tickets()
--    (0016) are SECURITY DEFINER and were executable by any signed-in user via
--    PostgREST. Calling confirm_booking_and_issue_tickets() on your own pending
--    booking issued valid tickets without paying. Both are now service_role-only
--    (the razorpay-* Edge Functions already call them with the service role key).
--
-- 2. SECURITY FIX — is_staff_or_admin() granted the `staff` role global access to
--    every booking, ticket, check-in, support conversation and event assignment
--    (including write access to assignments/tasks). It now means admin-level only;
--    staff get narrow, event-scoped access through explicit policies and RPCs below
--    (only the events they are assigned to via event_assignments).
--
-- 3. SECURITY FIX — the role-change guard (0003) only required is_admin(), so any
--    admin could promote anyone (including themselves via another admin) to
--    super_admin. Role/activation changes now require super_admin, can never
--    target your own account, and cannot remove the last active super_admin.
--    Approval RPCs can still provision user -> vendor/sponsor/venue/crew/volunteer.
--    Direct SQL (dashboard/service role — no end-user JWT) is still allowed, which
--    is how the very first super_admin gets bootstrapped (supabase/README.md §2).
--
-- 4. Admin booking status edits no longer happen by direct UPDATE (the old UI
--    could flip an unpaid booking to 'confirmed' — fabricated payment
--    confirmation). Cancel / record-refund / cancel-ticket / complimentary
--    booking go through audited RPCs; payment confirmation stays exclusively with
--    the Razorpay Edge Functions.
--
-- 5. Application approve/reject only transition from 'pending', and record
--    reviewer, review time, notes and reason. Rejected applications are kept.
--
-- 6. BUG FIX — ticket issuance called gen_random_bytes() with a search_path that
--    excludes Supabase's `extensions` schema, so it failed after every successful
--    payment (see section 4).

-- ===========================================================================
-- 1. ACCOUNT ACTIVATION + PERMISSIONS
-- ===========================================================================

alter table profiles
  add column if not exists is_active boolean not null default true,
  add column if not exists deactivated_at timestamptz,
  add column if not exists deactivated_by uuid references auth.users(id) on delete set null;

create index if not exists profiles_role_idx on profiles (role);

-- A deactivated account keeps its row (and history) but resolves to NO role,
-- so every is_admin()/has_permission() check fails immediately server-side.
create or replace function current_role_name()
returns user_role
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and is_active;
$$;

create or replace function is_super_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(current_role_name() = 'super_admin', false);
$$;

-- See header note 2. Kept (not renamed) because ~40 existing policies/RPCs
-- reference it; every one of them is admin tooling.
create or replace function is_staff_or_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select is_admin();
$$;

create table if not exists role_permissions (
  role user_role not null,
  permission text not null,
  primary key (role, permission)
);

alter table role_permissions enable row level security;
-- Readable by any admin-console user so the UI can explain the matrix;
-- changed only by migration/SQL (never from the app).
create policy "role_permissions: console read" on role_permissions for select
  using (current_role_name() in ('staff', 'admin', 'super_admin'));

insert into role_permissions (role, permission)
select 'super_admin'::user_role, p from unnest(array[
  'dashboard.view', 'applications.view', 'applications.review',
  'events.view_all', 'events.manage', 'events.view_assigned',
  'bookings.view_all', 'bookings.manage', 'payments.view',
  'attendees.view_all', 'attendees.view_assigned',
  'checkin.perform', 'checkin.history',
  'content.manage', 'announcements.view',
  'team.manage', 'tasks.view_own', 'entities.manage',
  'users.view', 'users.manage', 'roles.manage',
  'reports.view', 'audit.view', 'settings.manage', 'ai.use', 'operations.manage'
]) as p
union all
select 'admin'::user_role, p from unnest(array[
  'dashboard.view', 'applications.view', 'applications.review',
  'events.view_all', 'events.manage',
  'bookings.view_all', 'bookings.manage', 'payments.view',
  'attendees.view_all', 'checkin.perform', 'checkin.history',
  'content.manage', 'announcements.view',
  'team.manage', 'entities.manage', 'users.view',
  'reports.view', 'operations.manage'
]) as p
union all
select 'staff'::user_role, p from unnest(array[
  'dashboard.view', 'events.view_assigned', 'attendees.view_assigned',
  'checkin.perform', 'checkin.history', 'announcements.view', 'tasks.view_own'
]) as p
on conflict do nothing;

create or replace function has_permission(p_permission text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from role_permissions
    where role = current_role_name() and permission = p_permission
  );
$$;

-- The frontend loads this once per session to build navigation. It is a
-- convenience only — every write/read below re-checks server-side.
create or replace function my_permissions()
returns text[]
language sql stable security definer set search_path = public
as $$
  select coalesce(array_agg(permission order by permission), '{}')
  from role_permissions where role = current_role_name();
$$;

-- ===========================================================================
-- 2. AUDIT LOG (append-only)
-- ===========================================================================

create table if not exists audit_logs (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  -- No foreign keys on purpose: audit rows must outlive the users/events they
  -- describe, and an ON DELETE SET NULL action would be an UPDATE (blocked below).
  actor_id uuid,
  actor_email text,
  actor_role text,
  action text not null,
  resource_type text not null,
  resource_id text,
  event_id uuid,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists audit_logs_created_at_idx on audit_logs (created_at desc);
create index if not exists audit_logs_actor_id_idx on audit_logs (actor_id);
create index if not exists audit_logs_action_idx on audit_logs (action);
create index if not exists audit_logs_resource_idx on audit_logs (resource_type, resource_id);

alter table audit_logs enable row level security;
create policy "audit_logs: super admin read" on audit_logs for select using (has_permission('audit.view'));
-- No insert/update/delete policies: rows are written only by audit_write()
-- (SECURITY DEFINER), and the trigger below blocks update/delete for everyone,
-- including the service role. Retention/cleanup is a deliberate SQL-level act.

create or replace function audit_logs_block_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_logs is append-only.';
end;
$$;

create trigger audit_logs_append_only before update or delete on audit_logs
  for each row execute function audit_logs_block_mutation();

create or replace function audit_write(
  p_action text,
  p_resource_type text,
  p_resource_id text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_event_id uuid default null
) returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_email text;
  v_role text;
begin
  if auth.uid() is not null then
    select email, role::text into v_email, v_role from profiles where id = auth.uid();
  end if;
  insert into audit_logs (actor_id, actor_email, actor_role, action, resource_type, resource_id, event_id, metadata)
  values (auth.uid(), v_email, coalesce(v_role, case when auth.uid() is null then 'system' end),
          p_action, p_resource_type, p_resource_id, p_event_id, coalesce(p_metadata, '{}'::jsonb));
end;
$$;

revoke execute on function audit_write(text, text, text, jsonb, uuid) from public, anon, authenticated;
grant execute on function audit_write(text, text, text, jsonb, uuid) to service_role;

-- Generic row-change auditor. TG_ARGV[0] = resource type label. Records which
-- columns changed and their before/after values, minus anything sensitive.
create or replace function audit_row_change()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_old jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else '{}'::jsonb end;
  v_new jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else '{}'::jsonb end;
  v_changed text[];
  v_before jsonb := '{}'::jsonb;
  v_after jsonb := '{}'::jsonb;
  v_key text;
  v_id text := coalesce(v_new ->> 'id', v_old ->> 'id');
  v_event uuid;
  v_action text := tg_argv[0] || case tg_op when 'INSERT' then '.created' when 'UPDATE' then '.updated' else '.deleted' end;
begin
  if tg_op = 'UPDATE' then
    select array_agg(k) into v_changed
    from jsonb_object_keys(v_new) k
    where k not in ('updated_at', 'token') and v_new -> k is distinct from v_old -> k;
    if v_changed is null then
      return new;
    end if;
    foreach v_key in array v_changed loop
      v_before := v_before || jsonb_build_object(v_key, v_old -> v_key);
      v_after := v_after || jsonb_build_object(v_key, v_new -> v_key);
    end loop;
  end if;

  if tg_table_name = 'events' then
    v_event := v_id::uuid;
  elsif (v_new ? 'event_id' or v_old ? 'event_id') then
    v_event := nullif(coalesce(v_new ->> 'event_id', v_old ->> 'event_id'), '')::uuid;
  end if;

  perform audit_write(
    v_action,
    tg_argv[0],
    v_id,
    case tg_op
      when 'UPDATE' then jsonb_build_object('changed', to_jsonb(v_changed), 'before', v_before, 'after', v_after)
      when 'INSERT' then jsonb_build_object('name', coalesce(v_new ->> 'name', v_new ->> 'title'))
      else jsonb_build_object('name', coalesce(v_old ->> 'name', v_old ->> 'title'))
    end,
    v_event
  );
  return coalesce(new, old);
end;
$$;

create trigger events_audit after insert or update or delete on events
  for each row execute function audit_row_change('event');
create trigger event_assignments_audit after insert or update or delete on event_assignments
  for each row execute function audit_row_change('assignment');
create trigger event_artists_audit after insert or delete on event_artists
  for each row execute function audit_row_change('event_artist');

-- Payment-state changes made by the system (Razorpay webhook / verify function,
-- which run with no end-user JWT). Admin booking changes go through the RPCs in
-- section 7, which write their own, richer audit rows.
create or replace function audit_booking_system_change()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null and new.status is distinct from old.status then
    perform audit_write('booking.status_changed', 'booking', new.id::text,
      jsonb_build_object('from', old.status, 'to', new.status, 'registration_code', new.registration_code, 'source', 'payment_system'),
      new.event_id);
  end if;
  return new;
end;
$$;

create trigger bookings_system_audit after update on bookings
  for each row execute function audit_booking_system_change();

-- Login/logout are recorded by the admin console itself (Supabase Auth has no
-- database hook we can attach to without extra infrastructure). Only console
-- roles are logged; repeated calls within a minute are collapsed.
create or replace function log_auth_event(p_action text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if p_action not in ('auth.login', 'auth.logout', 'auth.session_expired') then
    raise exception 'Unsupported auth event.';
  end if;
  if not has_permission('dashboard.view') then
    return;
  end if;
  if exists (
    select 1 from audit_logs
    where actor_id = auth.uid() and action = p_action and created_at > now() - interval '1 minute'
  ) then
    return;
  end if;
  perform audit_write(p_action, 'session', auth.uid()::text, '{}'::jsonb);
end;
$$;

-- ===========================================================================
-- 3. ROLE / ACCOUNT ADMINISTRATION (super admin only)
-- ===========================================================================

create or replace function prevent_role_self_escalation()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_jwt_role text := coalesce(auth.role(), '');
begin
  if new.role is not distinct from old.role and new.is_active is not distinct from old.is_active then
    return new;
  end if;

  -- No end-user JWT: SQL editor / migrations / service role. This is the
  -- bootstrap path for the first super_admin.
  if v_jwt_role not in ('authenticated', 'anon') then
    return new;
  end if;

  if new.id = auth.uid() then
    raise exception 'You cannot change your own role or account status.';
  end if;

  -- Application approval provisioning (approve_collaboration /
  -- approve_crew_application): user -> partner role only, by an admin.
  if new.is_active is not distinct from old.is_active
     and old.role = 'user'
     and new.role in ('vendor', 'sponsor', 'volunteer', 'crew', 'venue')
     and has_permission('applications.review') then
    return new;
  end if;

  if not has_permission('roles.manage') then
    raise exception 'Only a super admin can change roles or account status.';
  end if;
  return new;
end;
$$;

create or replace function admin_set_user_role(p_user_id uuid, p_role user_role, p_reason text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_old user_role;
begin
  if not has_permission('roles.manage') then
    raise exception 'Only a super admin can change roles.';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'You cannot change your own role.';
  end if;
  select role into v_old from profiles where id = p_user_id for update;
  if v_old is null then
    raise exception 'User not found.';
  end if;
  if v_old = p_role then
    return;
  end if;
  if v_old = 'super_admin' and (select count(*) from profiles where role = 'super_admin' and is_active) <= 1 then
    raise exception 'Cannot demote the last active super admin.';
  end if;

  update profiles set role = p_role where id = p_user_id;
  perform audit_write('user.role_changed', 'user', p_user_id::text,
    jsonb_build_object('from', v_old, 'to', p_role, 'reason', p_reason));
end;
$$;

create or replace function admin_set_user_active(p_user_id uuid, p_active boolean, p_reason text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_profile profiles%rowtype;
begin
  if not has_permission('users.manage') then
    raise exception 'Only a super admin can activate or deactivate accounts.';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'You cannot deactivate your own account.';
  end if;
  select * into v_profile from profiles where id = p_user_id for update;
  if v_profile.id is null then
    raise exception 'User not found.';
  end if;
  if v_profile.is_active = p_active then
    return;
  end if;
  if not p_active and v_profile.role = 'super_admin'
     and (select count(*) from profiles where role = 'super_admin' and is_active) <= 1 then
    raise exception 'Cannot deactivate the last active super admin.';
  end if;

  update profiles
    set is_active = p_active,
        deactivated_at = case when p_active then null else now() end,
        deactivated_by = case when p_active then null else auth.uid() end
    where id = p_user_id;
  perform audit_write(case when p_active then 'user.reactivated' else 'user.deactivated' end,
    'user', p_user_id::text, jsonb_build_object('reason', p_reason, 'role', v_profile.role));
end;
$$;

-- Audit hook for the admin-invite-user Edge Function, called with the
-- inviting Super Admin's own JWT so the row records the real actor.
create or replace function log_user_invited(p_user_id uuid, p_email text, p_role user_role, p_existing boolean)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not has_permission('users.manage') then
    raise exception 'Only a super admin can invite users.';
  end if;
  perform audit_write('user.invited', 'user', p_user_id::text,
    jsonb_build_object('email', p_email, 'role', p_role, 'existing_account', p_existing));
end;
$$;

-- ===========================================================================
-- 4. STAFF EVENT SCOPING
-- ===========================================================================

alter table event_assignments drop constraint if exists event_assignments_assignee_role_check;
alter table event_assignments add constraint event_assignments_assignee_role_check
  check (assignee_role in ('crew', 'volunteer', 'vendor', 'staff'));
alter table event_assignments alter column assigned_by set default auth.uid();

create or replace function is_assigned_to_event(p_event_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select current_role_name() is not null and exists (
    select 1 from event_assignments
    where event_id = p_event_id and assignee_id = auth.uid() and status <> 'declined'
  );
$$;

-- "Can this console user see attendee-level data for this event?"
create or replace function can_view_event_attendees(p_event_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select has_permission('attendees.view_all')
      or (has_permission('attendees.view_assigned') and is_assigned_to_event(p_event_id));
$$;

-- A staff assignment must point at a console account; partner assignments are unchanged.
create or replace function validate_event_assignment()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.assignee_role = 'staff'
     and not exists (select 1 from profiles where id = new.assignee_id and role in ('staff', 'admin', 'super_admin')) then
    raise exception 'Only staff/admin accounts can be assigned as event staff.';
  end if;
  return new;
end;
$$;

create trigger event_assignments_validate before insert or update on event_assignments
  for each row execute function validate_event_assignment();

-- Assigned staff can read the events they work, even while still in draft.
create policy "events: assigned staff read" on events for select using (is_assigned_to_event(id));

-- BOOKINGS / TICKETS / CHECKINS: replace the old blanket staff/admin policies.
-- Staff never read these tables directly — they use attendee_tickets and the
-- check-in RPCs below, which scope to assigned events and mask contact details.
drop policy if exists "bookings: staff/admin full access" on bookings;
create policy "bookings: admin read all" on bookings for select using (has_permission('bookings.view_all'));

drop policy if exists "tickets: staff/admin full access" on tickets;
create policy "tickets: admin read all" on tickets for select using (has_permission('bookings.view_all'));

drop policy if exists "checkins: staff/admin only" on checkins;
create policy "checkins: admin read all" on checkins for select using (has_permission('bookings.view_all'));
-- Patron passport "stamps" (UserLoginModal) count your own check-ins.
create policy "checkins: self read own" on checkins for select
  using (exists (select 1 from bookings b where b.id = booking_id and b.user_id = auth.uid()));

drop policy if exists "waitlist: staff/admin read" on waitlist;
create policy "waitlist: admin read" on waitlist for select using (is_admin());

-- BUG FIX — confirm_booking_and_issue_tickets() (0016) calls gen_random_bytes()
-- with search_path = public, but on Supabase pgcrypto is installed in the
-- `extensions` schema, so ticket issuance after a successful payment failed with
-- "function gen_random_bytes(integer) does not exist".
alter function confirm_booking_and_issue_tickets(uuid) set search_path = public, extensions;

-- See header note 1.
revoke execute on function create_pending_booking(uuid, uuid, text, text, text, text, int, int, text, text) from public, anon, authenticated;
grant execute on function create_pending_booking(uuid, uuid, text, text, text, text, int, int, text, text) to service_role;
revoke execute on function confirm_booking_and_issue_tickets(uuid) from public, anon, authenticated;
grant execute on function confirm_booking_and_issue_tickets(uuid) to service_role;

-- ===========================================================================
-- 5. VENUES (directory of physical venues; venue_profiles stay = partner accounts)
-- ===========================================================================

create table if not exists venues (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  address text,
  city text default 'Hyderabad',
  capacity int check (capacity is null or capacity >= 0),
  contact_name text,
  contact_email text,
  contact_phone text,
  notes text,
  partner_profile_id uuid references profiles(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger venues_set_updated_at before update on venues for each row execute function set_updated_at();
create trigger venues_audit after insert or update or delete on venues
  for each row execute function audit_row_change('venue');

alter table venues enable row level security;
create policy "venues: console read" on venues for select
  using (has_permission('events.view_all') or has_permission('events.view_assigned'));
create policy "venues: admin manage" on venues for all
  using (has_permission('entities.manage')) with check (has_permission('entities.manage'));

-- ===========================================================================
-- 6. EVENTS — extra fields, safety
-- ===========================================================================

alter table events
  add column if not exists end_time text,
  add column if not exists venue_id uuid references venues(id) on delete set null,
  add column if not exists created_by uuid references auth.users(id) on delete set null default auth.uid(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists events_event_date_idx on events (event_date);
create index if not exists events_venue_id_idx on events (venue_id);

-- Existing convention (0001): draft | on-sale | sold-out | past | cancelled.
-- NOT VALID: enforced for new/updated rows without re-checking historic data.
alter table events drop constraint if exists events_status_check;
alter table events add constraint events_status_check
  check (status in ('draft', 'on-sale', 'sold-out', 'past', 'cancelled')) not valid;

create trigger events_set_updated_at before update on events for each row execute function set_updated_at();

-- Backfill the venue directory from the free-text venue names already on events.
insert into venues (name)
select distinct trim(venue) from events where coalesce(trim(venue), '') <> ''
on conflict (name) do nothing;
update events e set venue_id = v.id from venues v where e.venue_id is null and v.name = trim(e.venue);

-- events -> bookings is ON DELETE CASCADE (0001): deleting an event with any
-- bookings would silently destroy payment records. Cancel it instead.
create or replace function prevent_event_delete_with_bookings()
returns trigger
language plpgsql
as $$
begin
  if exists (select 1 from bookings where event_id = old.id) then
    raise exception 'This event has bookings — cancel it instead of deleting it.';
  end if;
  return old;
end;
$$;

create trigger events_prevent_delete_with_bookings before delete on events
  for each row execute function prevent_event_delete_with_bookings();

-- ===========================================================================
-- 7. BOOKINGS ADMINISTRATION
-- ===========================================================================

alter table bookings
  add column if not exists source text not null default 'online',
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by uuid references auth.users(id) on delete set null,
  add column if not exists cancel_reason text,
  add column if not exists refund_reference text;

alter table bookings drop constraint if exists bookings_source_check;
alter table bookings add constraint bookings_source_check check (source in ('online', 'complimentary'));

create index if not exists bookings_status_idx on bookings (status);
create index if not exists bookings_created_at_idx on bookings (created_at desc);
create index if not exists tickets_status_idx on tickets (status);

create or replace function admin_cancel_booking(p_booking_id uuid, p_reason text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_booking bookings%rowtype;
begin
  if not has_permission('bookings.manage') then
    raise exception 'You do not have permission to manage bookings.';
  end if;
  if coalesce(trim(p_reason), '') = '' then
    raise exception 'A cancellation reason is required.';
  end if;
  select * into v_booking from bookings where id = p_booking_id for update;
  if v_booking.id is null then
    raise exception 'Booking not found.';
  end if;
  if v_booking.status not in ('pending', 'confirmed') then
    raise exception 'Only pending or confirmed bookings can be cancelled.';
  end if;
  if exists (select 1 from tickets where booking_id = p_booking_id and status = 'checked_in') then
    raise exception 'A ticket on this booking has already been checked in.';
  end if;

  update bookings
    set status = 'cancelled', cancelled_at = now(), cancelled_by = auth.uid(), cancel_reason = p_reason
    where id = p_booking_id;
  update tickets set status = 'cancelled' where booking_id = p_booking_id and status = 'valid';

  perform audit_write('booking.cancelled', 'booking', p_booking_id::text,
    jsonb_build_object('reason', p_reason, 'previous_status', v_booking.status,
      'registration_code', v_booking.registration_code, 'amount', v_booking.amount),
    v_booking.event_id);
end;
$$;

-- Records a refund that was actually issued in the Razorpay dashboard. It does
-- NOT move money; it only keeps Tangy's records (and ticket validity) in sync.
create or replace function admin_record_refund(p_booking_id uuid, p_reason text, p_reference text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_booking bookings%rowtype;
begin
  if not (has_permission('bookings.manage') and has_permission('payments.view')) then
    raise exception 'You do not have permission to record refunds.';
  end if;
  if coalesce(trim(p_reason), '') = '' or coalesce(trim(p_reference), '') = '' then
    raise exception 'A reason and the Razorpay refund reference are required.';
  end if;
  select * into v_booking from bookings where id = p_booking_id for update;
  if v_booking.id is null then
    raise exception 'Booking not found.';
  end if;
  -- A refund only makes sense where Razorpay actually captured money.
  if v_booking.status not in ('confirmed', 'cancelled') or v_booking.source <> 'online'
     or v_booking.amount <= 0 or v_booking.razorpay_payment_id is null then
    raise exception 'Only paid online bookings can be marked refunded.';
  end if;

  update bookings
    set status = 'refunded', refund_reference = p_reference,
        cancel_reason = coalesce(cancel_reason, p_reason),
        cancelled_at = coalesce(cancelled_at, now()), cancelled_by = coalesce(cancelled_by, auth.uid())
    where id = p_booking_id;
  update tickets set status = 'cancelled' where booking_id = p_booking_id and status = 'valid';

  perform audit_write('payment.refund_recorded', 'booking', p_booking_id::text,
    jsonb_build_object('reason', p_reason, 'refund_reference', p_reference, 'amount', v_booking.amount,
      'previous_status', v_booking.status, 'registration_code', v_booking.registration_code),
    v_booking.event_id);
end;
$$;

create or replace function admin_cancel_ticket(p_ticket_id uuid, p_reason text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_ticket tickets%rowtype;
begin
  if not has_permission('bookings.manage') then
    raise exception 'You do not have permission to manage tickets.';
  end if;
  if coalesce(trim(p_reason), '') = '' then
    raise exception 'A reason is required.';
  end if;
  select * into v_ticket from tickets where id = p_ticket_id for update;
  if v_ticket.id is null then
    raise exception 'Ticket not found.';
  end if;
  if v_ticket.status <> 'valid' then
    raise exception 'Only a valid (not yet checked-in) ticket can be cancelled.';
  end if;
  update tickets set status = 'cancelled' where id = p_ticket_id;
  perform audit_write('ticket.cancelled', 'ticket', p_ticket_id::text,
    jsonb_build_object('reason', p_reason, 'ticket_number', v_ticket.ticket_number, 'booking_id', v_ticket.booking_id),
    v_ticket.event_id);
end;
$$;

-- Guest-list / complimentary admissions: amount 0, source 'complimentary',
-- capacity-checked exactly like a paid booking. Never represents a payment.
create or replace function admin_create_comp_booking(
  p_event_id uuid,
  p_attendee_name text,
  p_attendee_email text,
  p_attendee_phone text,
  p_quantity int,
  p_tier text,
  p_note text
) returns bookings
language plpgsql security definer set search_path = public
as $$
declare
  v_capacity int;
  v_taken int;
  v_code text;
  v_booking bookings%rowtype;
  v_chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i int;
begin
  if not has_permission('bookings.manage') then
    raise exception 'You do not have permission to create bookings.';
  end if;
  if coalesce(trim(p_attendee_name), '') = '' or coalesce(trim(p_attendee_email), '') = '' then
    raise exception 'Attendee name and email are required.';
  end if;
  if p_attendee_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Attendee email is not valid.';
  end if;
  if p_quantity is null or p_quantity < 1 or p_quantity > 10 then
    raise exception 'Quantity must be between 1 and 10.';
  end if;
  if p_tier not in ('gen', 'vip', 'premium') then
    raise exception 'Invalid ticket tier.';
  end if;
  if coalesce(trim(p_note), '') = '' then
    raise exception 'A note explaining the complimentary booking is required.';
  end if;

  select capacity into v_capacity from events where id = p_event_id and status <> 'cancelled' for update;
  if v_capacity is null then
    raise exception 'Event not found or cancelled.';
  end if;
  select coalesce(sum(quantity), 0) into v_taken from bookings
    where event_id = p_event_id and status in ('pending', 'confirmed');
  if v_taken + p_quantity > v_capacity then
    raise exception 'Not enough capacity left for this event.';
  end if;

  loop
    v_code := 'TS-';
    for i in 1..8 loop
      v_code := v_code || substr(v_chars, 1 + floor(random() * length(v_chars))::int, 1);
    end loop;
    exit when not exists (select 1 from bookings where registration_code = v_code);
  end loop;

  insert into bookings (registration_code, user_id, event_id, attendee_name, attendee_email, attendee_phone,
                        quantity, amount, tier, status, source, cancel_reason)
  values (v_code, null, p_event_id, trim(p_attendee_name), lower(trim(p_attendee_email)), nullif(trim(p_attendee_phone), ''),
          p_quantity, 0, p_tier, 'pending', 'complimentary', null)
  returning * into v_booking;

  perform confirm_booking_and_issue_tickets(v_booking.id);
  select * into v_booking from bookings where id = v_booking.id;

  perform audit_write('booking.comp_created', 'booking', v_booking.id::text,
    jsonb_build_object('note', p_note, 'quantity', p_quantity, 'tier', p_tier, 'registration_code', v_code),
    p_event_id);
  return v_booking;
end;
$$;

-- ===========================================================================
-- 8. CHECK-IN (staff scoped, idempotent, method-aware)
-- ===========================================================================

alter table checkins
  add column if not exists method text not null default 'qr',
  add column if not exists notes text;
alter table checkins drop constraint if exists checkins_method_check;
alter table checkins add constraint checkins_method_check check (method in ('qr', 'manual'));
create index if not exists checkins_checked_in_by_idx on checkins (checked_in_by);
create index if not exists checkins_checked_in_at_idx on checkins (checked_in_at desc);

drop function if exists check_in_ticket(text, uuid);

-- Same contract as 0016 (the `result` values are unchanged) plus:
--   'not_assigned'    — caller may check in, but not for this event
--   'manual_disabled' — manual check-in turned off in System Settings
-- and richer payloads (booking code, event, who checked in).
create or replace function check_in_ticket(p_token text, p_event_id uuid, p_method text default 'qr', p_notes text default null)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_ticket tickets%rowtype;
  v_booking bookings%rowtype;
  v_checkin checkins%rowtype;
  v_event_name text;
  v_by_name text;
begin
  if not has_permission('checkin.perform') then
    raise exception 'You do not have permission to check in tickets.';
  end if;
  if p_method not in ('qr', 'manual') then
    raise exception 'Invalid check-in method.';
  end if;
  if not (has_permission('events.view_all') or is_assigned_to_event(p_event_id)) then
    return jsonb_build_object('result', 'not_assigned');
  end if;
  if p_method = 'manual' and coalesce((select (value)::text::boolean from system_settings where key = 'checkin.allow_manual'), true) = false then
    return jsonb_build_object('result', 'manual_disabled');
  end if;

  select name into v_event_name from events where id = p_event_id;

  select * into v_ticket from tickets where token = trim(coalesce(p_token, '')) for update;
  if v_ticket.id is null then
    return jsonb_build_object('result', 'not_found', 'event_name', v_event_name);
  end if;

  select * into v_booking from bookings where id = v_ticket.booking_id;

  if v_ticket.event_id <> p_event_id then
    return jsonb_build_object('result', 'wrong_event', 'ticket_number', v_ticket.ticket_number,
      'event_name', v_event_name,
      'ticket_event_name', (select name from events where id = v_ticket.event_id));
  end if;

  if v_ticket.status = 'cancelled' then
    return jsonb_build_object('result', 'cancelled', 'ticket_number', v_ticket.ticket_number, 'event_name', v_event_name);
  end if;

  if v_booking.status <> 'confirmed' then
    return jsonb_build_object('result', 'payment_not_confirmed', 'ticket_number', v_ticket.ticket_number, 'event_name', v_event_name);
  end if;

  select * into v_checkin from checkins where ticket_id = v_ticket.id;
  if v_checkin.id is not null then
    select coalesce(full_name, email) into v_by_name from profiles where id = v_checkin.checked_in_by;
    return jsonb_build_object(
      'result', 'already_checked_in',
      'ticket_number', v_ticket.ticket_number,
      'attendee_name', v_booking.attendee_name,
      'registration_code', v_booking.registration_code,
      'event_name', v_event_name,
      'tier', v_ticket.tier,
      'checked_in_at', v_checkin.checked_in_at,
      'checked_in_by_name', v_by_name,
      'method', v_checkin.method
    );
  end if;

  insert into checkins (booking_id, ticket_id, event_id, checked_in_by, method, notes)
  values (v_ticket.booking_id, v_ticket.id, v_ticket.event_id, auth.uid(), p_method, nullif(trim(p_notes), ''))
  returning * into v_checkin;

  update tickets set status = 'checked_in' where id = v_ticket.id;

  select coalesce(full_name, email) into v_by_name from profiles where id = auth.uid();

  perform audit_write(case when p_method = 'manual' then 'checkin.manual' else 'checkin.scan' end,
    'ticket', v_ticket.id::text,
    jsonb_build_object('ticket_number', v_ticket.ticket_number, 'registration_code', v_booking.registration_code, 'notes', nullif(trim(p_notes), '')),
    p_event_id);

  return jsonb_build_object(
    'result', 'valid',
    'ticket_number', v_ticket.ticket_number,
    'attendee_name', v_booking.attendee_name,
    'registration_code', v_booking.registration_code,
    'event_name', v_event_name,
    'tier', v_ticket.tier,
    'checked_in_at', v_checkin.checked_in_at,
    'checked_in_by_name', v_by_name,
    'method', p_method
  );
end;
$$;

-- Ticket-level attendee list. Deliberately NOT security_invoker: staff have no
-- direct access to bookings/tickets, so this view is their only path, and it
-- filters rows to events they can see and hides contact details from staff.
create or replace view attendee_tickets as
select
  t.id as ticket_id,
  t.ticket_number,
  t.tier,
  t.status as ticket_status,
  t.created_at as issued_at,
  b.id as booking_id,
  b.registration_code,
  b.status as booking_status,
  b.source as booking_source,
  b.attendee_name,
  case when has_permission('attendees.view_all') then b.attendee_email end as attendee_email,
  case when has_permission('attendees.view_all') then b.attendee_phone end as attendee_phone,
  e.id as event_id,
  e.name as event_name,
  e.event_date,
  c.checked_in_at,
  c.method as checkin_method,
  -- Only the credential holder's own ops need the token (manual check-in).
  case when has_permission('checkin.perform') and t.status = 'valid' then t.token end as token
from tickets t
join bookings b on b.id = t.booking_id
join events e on e.id = t.event_id
left join checkins c on c.ticket_id = t.id
where can_view_event_attendees(t.event_id);

revoke all on attendee_tickets from anon;
grant select on attendee_tickets to authenticated;

create or replace function my_checkin_events()
returns table (id uuid, name text, event_date date, event_time text, venue text, status text)
language sql stable security definer set search_path = public
as $$
  select e.id, e.name, e.event_date, e.event_time, e.venue, e.status
  from events e
  where has_permission('checkin.perform')
    and e.status not in ('draft', 'cancelled')
    and (has_permission('events.view_all') or is_assigned_to_event(e.id))
  order by abs(e.event_date - current_date), e.event_date desc;
$$;

create or replace function event_checkin_stats(p_event_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
begin
  if not can_view_event_attendees(p_event_id) then
    raise exception 'You do not have access to this event.';
  end if;
  return (
    select jsonb_build_object(
      'tickets_issued', count(*) filter (where t.status <> 'cancelled'),
      'checked_in', count(*) filter (where t.status = 'checked_in'),
      'remaining', count(*) filter (where t.status = 'valid'),
      'cancelled', count(*) filter (where t.status = 'cancelled'),
      'manual', (select count(*) from checkins c where c.event_id = p_event_id and c.method = 'manual')
    )
    from tickets t where t.event_id = p_event_id
  );
end;
$$;

create or replace function get_checkin_history(
  p_event_id uuid default null,
  p_mine boolean default false,
  p_limit int default 50,
  p_offset int default 0
) returns table (
  id uuid, checked_in_at timestamptz, method text, notes text,
  event_id uuid, event_name text, ticket_number text, tier text,
  registration_code text, attendee_name text,
  checked_in_by uuid, checked_in_by_name text, total_count bigint
)
language sql stable security definer set search_path = public
as $$
  select c.id, c.checked_in_at, c.method, c.notes,
         c.event_id, e.name, t.ticket_number, t.tier,
         b.registration_code, b.attendee_name,
         c.checked_in_by, coalesce(p.full_name, p.email),
         count(*) over ()
  from checkins c
  join events e on e.id = c.event_id
  left join tickets t on t.id = c.ticket_id
  left join bookings b on b.id = c.booking_id
  left join profiles p on p.id = c.checked_in_by
  where has_permission('checkin.history')
    and can_view_event_attendees(c.event_id)
    and (p_event_id is null or c.event_id = p_event_id)
    and (not p_mine or c.checked_in_by = auth.uid())
  order by c.checked_in_at desc
  limit least(greatest(p_limit, 1), 200) offset greatest(p_offset, 0);
$$;

-- ===========================================================================
-- 9. APPLICATIONS — explicit review lifecycle
-- ===========================================================================

alter table artists
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists review_notes text,
  add column if not exists decision_reason text;
alter table collaborations
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_notes text,
  add column if not exists decision_reason text;
alter table crew_applications
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_notes text,
  add column if not exists decision_reason text;

create index if not exists collaborations_status_idx on collaborations (status);
create index if not exists crew_applications_status_idx on crew_applications (status);

drop function if exists approve_collaboration(uuid);
drop function if exists reject_collaboration(uuid);
drop function if exists approve_crew_application(uuid);
drop function if exists reject_crew_application(uuid);
drop function if exists approve_artist_application(uuid);
drop function if exists reject_artist_application(uuid);

create function approve_collaboration(p_id uuid, p_notes text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_collab collaborations%rowtype;
begin
  if not has_permission('applications.review') then
    raise exception 'You do not have permission to review applications.';
  end if;
  select * into v_collab from collaborations where id = p_id for update;
  if v_collab.id is null then
    raise exception 'Application not found.';
  end if;
  if v_collab.status <> 'pending' then
    raise exception 'This application has already been reviewed (%).', v_collab.status;
  end if;

  update collaborations
    set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), review_notes = p_notes
    where id = p_id;

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

  perform audit_write('application.approved', 'collaboration', p_id::text,
    jsonb_build_object('type', v_collab.type, 'applicant', v_collab.business_name, 'notes', p_notes,
      'role_provisioned', v_collab.user_id is not null));
end;
$$;

create function reject_collaboration(p_id uuid, p_reason text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_collab collaborations%rowtype;
begin
  if not has_permission('applications.review') then
    raise exception 'You do not have permission to review applications.';
  end if;
  select * into v_collab from collaborations where id = p_id for update;
  if v_collab.id is null then
    raise exception 'Application not found.';
  end if;
  if v_collab.status <> 'pending' then
    raise exception 'This application has already been reviewed (%).', v_collab.status;
  end if;
  update collaborations
    set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(), decision_reason = p_reason
    where id = p_id;
  perform audit_write('application.rejected', 'collaboration', p_id::text,
    jsonb_build_object('type', v_collab.type, 'applicant', v_collab.business_name, 'reason', p_reason));
end;
$$;

create function approve_crew_application(p_id uuid, p_notes text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_app crew_applications%rowtype;
begin
  if not has_permission('applications.review') then
    raise exception 'You do not have permission to review applications.';
  end if;
  select * into v_app from crew_applications where id = p_id for update;
  if v_app.id is null then
    raise exception 'Application not found.';
  end if;
  if v_app.status <> 'pending' then
    raise exception 'This application has already been reviewed (%).', v_app.status;
  end if;

  update crew_applications
    set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), review_notes = p_notes
    where id = p_id;

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

  perform audit_write('application.approved', 'crew_application', p_id::text,
    jsonb_build_object('type', v_app.category, 'applicant', v_app.name, 'notes', p_notes,
      'role_provisioned', v_app.user_id is not null));
end;
$$;

create function reject_crew_application(p_id uuid, p_reason text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_app crew_applications%rowtype;
begin
  if not has_permission('applications.review') then
    raise exception 'You do not have permission to review applications.';
  end if;
  select * into v_app from crew_applications where id = p_id for update;
  if v_app.id is null then
    raise exception 'Application not found.';
  end if;
  if v_app.status <> 'pending' then
    raise exception 'This application has already been reviewed (%).', v_app.status;
  end if;
  update crew_applications
    set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(), decision_reason = p_reason
    where id = p_id;
  perform audit_write('application.rejected', 'crew_application', p_id::text,
    jsonb_build_object('type', v_app.category, 'applicant', v_app.name, 'reason', p_reason));
end;
$$;

create function approve_artist_application(p_id uuid, p_notes text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_artist artists%rowtype;
begin
  if not has_permission('applications.review') then
    raise exception 'You do not have permission to review applications.';
  end if;
  select * into v_artist from artists where id = p_id for update;
  if v_artist.id is null then
    raise exception 'Application not found.';
  end if;
  if v_artist.status <> 'pending' then
    raise exception 'This application has already been reviewed (%).', v_artist.status;
  end if;

  update artists
    set status = 'approved', reviewed_at = now(), reviewed_by = auth.uid(), review_notes = p_notes
    where id = p_id;

  if v_artist.user_id is not null then
    insert into application_notifications (source_table, source_id, notification_type)
    values ('artists', p_id, 'approval')
    on conflict (source_table, source_id, notification_type) do nothing;
  end if;

  perform audit_write('application.approved', 'artist', p_id::text,
    jsonb_build_object('type', 'artist', 'applicant', v_artist.name, 'notes', p_notes));
end;
$$;

create function reject_artist_application(p_id uuid, p_reason text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_artist artists%rowtype;
begin
  if not has_permission('applications.review') then
    raise exception 'You do not have permission to review applications.';
  end if;
  select * into v_artist from artists where id = p_id for update;
  if v_artist.id is null then
    raise exception 'Application not found.';
  end if;
  if v_artist.status <> 'pending' then
    raise exception 'This application has already been reviewed (%).', v_artist.status;
  end if;
  update artists
    set status = 'rejected', reviewed_at = now(), reviewed_by = auth.uid(), decision_reason = p_reason
    where id = p_id;
  perform audit_write('application.rejected', 'artist', p_id::text,
    jsonb_build_object('type', 'artist', 'applicant', v_artist.name, 'reason', p_reason));
end;
$$;

-- One queryable list across the three intake tables. security_invoker: the
-- caller's own RLS applies (admins see all; applicants see only their own).
create or replace view applications_overview with (security_invoker = true) as
select
  'artists'::text as source_table, a.id, 'artist'::text as type, a.user_id,
  a.name as applicant_name, a.email as applicant_email, null::text as phone,
  a.applied_at as submitted_at, a.status, a.reviewed_by, a.reviewed_at, a.review_notes, a.decision_reason,
  concat_ws(' · ', a.genre, a.city) as summary,
  jsonb_build_object('genre', a.genre, 'city', a.city, 'bio', a.bio, 'experience_level', a.experience_level,
    'instagram', a.instagram, 'soundcloud', a.soundcloud, 'spotify', a.spotify) as details
from artists a
union all
select
  'collaborations', c.id, case c.type when 'venue_host' then 'venue' else c.type::text end, c.user_id,
  coalesce(c.business_name, c.contact_name), c.email, c.phone,
  c.created_at, c.status, c.reviewed_by, c.reviewed_at, c.review_notes, c.decision_reason,
  c.business_name,
  jsonb_build_object('business_name', c.business_name, 'contact_name', c.contact_name, 'details', c.details)
from collaborations c
union all
select
  'crew_applications', r.id, r.category, r.user_id,
  r.name, r.email, r.phone,
  r.created_at, r.status, r.reviewed_by, r.reviewed_at, r.review_notes, r.decision_reason,
  concat_ws(' · ', r.role_interest, r.event_interest),
  jsonb_build_object('role_interest', r.role_interest, 'event_interest', r.event_interest, 'message', r.message)
from crew_applications r;

revoke all on applications_overview from anon;
grant select on applications_overview to authenticated;

-- ===========================================================================
-- 10. ANNOUNCEMENTS (replaces the browser-localStorage mock store)
-- ===========================================================================

create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  body text not null default '',
  category text not null default 'GENERAL',
  character text not null default 'violinist',
  destination text,
  audience text not null default 'all' check (audience in ('all', 'guest', 'patron', 'artist', 'staff')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  event_id uuid references events(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'published', 'expired', 'archived')),
  publish_at timestamptz not null default now(),
  expire_at timestamptz,
  author_id uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists announcements_status_publish_idx on announcements (status, publish_at desc);
create index if not exists announcements_event_id_idx on announcements (event_id);

create trigger announcements_set_updated_at before update on announcements for each row execute function set_updated_at();
create trigger announcements_audit after insert or update or delete on announcements
  for each row execute function audit_row_change('announcement');

alter table announcements enable row level security;

create policy "announcements: public read live" on announcements for select
  using (status = 'published' and audience <> 'staff' and publish_at <= now()
         and (expire_at is null or expire_at > now()));
create policy "announcements: staff read relevant" on announcements for select
  using (has_permission('announcements.view') and status = 'published' and publish_at <= now()
         and (expire_at is null or expire_at > now())
         and (event_id is null or has_permission('events.view_all') or is_assigned_to_event(event_id)));
create policy "announcements: content managers" on announcements for all
  using (has_permission('content.manage')) with check (has_permission('content.manage'));

-- Existing editorial announcements that previously lived only as the mock
-- store's seed (src/data/mock/announcements.js) — carried over as-is so the
-- public site's announcement overlay keeps the same content.
insert into announcements (title, body, category, character, destination, audience, priority, publish_at, expire_at, status, author_id)
select * from (values
  ('NEW TANGY SESSION', 'An evening at Bansilalpet Stepwell — Vol. 4 tickets are now on sale.', 'SESSION', 'violinist', '/book/vol-4', 'all', 'high', '2026-08-01T00:00:00Z'::timestamptz, '2026-09-19T23:59:00Z'::timestamptz, 'published', null::uuid),
  ('ARTIST APPLICATIONS OPEN', 'The curation desk is reviewing new artist submissions for 2027.', 'ARTIST', 'guitarist', '/artist/register', 'guest', 'normal', '2026-07-01T00:00:00Z', '2026-12-31T23:59:00Z', 'published', null),
  ('CONTACT SHEETS DIGITIZED', 'The full 35mm contact sheet archive from Vol. 1-3 is now browsable.', 'ARCHIVE', 'kathak', '/archive/contact-sheets', 'all', 'low', '2026-06-01T00:00:00Z', null, 'draft', null),
  ('VOLUNTEER REGISTRATION OPEN', 'Sign up to join the crew for Vol. 4 — front of house and backstage roles open.', 'GENERAL', 'hiphop', '/collaborate', 'guest', 'normal', '2026-08-02T00:00:00Z', '2026-09-19T23:59:00Z', 'published', null),
  ('VENUE PARTNERSHIP: OLD CITY HAVELI', 'A new heritage venue joins the Tangy circuit for 2027.', 'CULTURE', 'veena', '/crew', 'all', 'normal', '2026-08-08T00:00:00Z', null, 'published', null)
) as seed(title, body, category, character, destination, audience, priority, publish_at, expire_at, status, author_id)
where not exists (select 1 from announcements);

-- ===========================================================================
-- 11. SYSTEM SETTINGS (super admin; non-secret configuration only)
-- ===========================================================================

create table if not exists system_settings (
  key text primary key check (key ~ '^[a-z_]+\.[a-z_]+$'),
  value jsonb not null,
  value_type text not null check (value_type in ('boolean', 'integer', 'string')),
  category text not null,
  label text not null,
  description text,
  -- Exposed settings are readable by every console user (get_runtime_settings)
  -- because the UI needs them to behave correctly (e.g. idle timeout).
  exposed boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table system_settings enable row level security;
create policy "system_settings: super admin read" on system_settings for select using (has_permission('settings.manage'));
-- No write policies: update_system_setting() is the only write path.

insert into system_settings (key, value, value_type, category, label, description, exposed) values
  ('general.organization_name', '"Tangy Sessions"', 'string', 'General', 'Organization name', 'Shown in the admin console header.', true),
  ('general.support_email', '"hello@tangysessions.com"', 'string', 'General', 'Support email', 'Public contact address referenced in admin tooling.', true),
  ('events.default_capacity', '200', 'integer', 'Event defaults', 'Default capacity', 'Pre-filled capacity for new events.', true),
  ('events.default_price', '799', 'integer', 'Event defaults', 'Default base price (₹)', 'Pre-filled base ticket price for new events. Tier markups are fixed in the payment function.', true),
  ('checkin.allow_manual', 'true', 'boolean', 'Check-in', 'Allow manual check-in', 'When off, only QR scans are accepted (enforced server-side).', true),
  ('notifications.send_approval_emails', 'true', 'boolean', 'Notifications', 'Send approval emails', 'Automatically email applicants when their application is approved.', true),
  ('auth.admin_idle_timeout_minutes', '60', 'integer', 'Authentication', 'Admin idle timeout (minutes)', 'Console sessions sign out after this much inactivity. 0 disables.', true)
on conflict (key) do nothing;

create or replace function get_runtime_settings()
returns jsonb
language sql stable security definer set search_path = public
as $$
  select case when has_permission('dashboard.view')
    then coalesce(jsonb_object_agg(key, value), '{}'::jsonb) else '{}'::jsonb end
  from system_settings where exposed;
$$;

create or replace function update_system_setting(p_key text, p_value jsonb)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_setting system_settings%rowtype;
begin
  if not has_permission('settings.manage') then
    raise exception 'Only a super admin can change system settings.';
  end if;
  select * into v_setting from system_settings where key = p_key for update;
  if v_setting.key is null then
    raise exception 'Unknown setting.';
  end if;
  if (v_setting.value_type = 'boolean' and jsonb_typeof(p_value) <> 'boolean')
     or (v_setting.value_type = 'string' and (jsonb_typeof(p_value) <> 'string' or length(p_value #>> '{}') > 500))
     or (v_setting.value_type = 'integer' and (jsonb_typeof(p_value) <> 'number' or (p_value #>> '{}')::numeric % 1 <> 0 or (p_value #>> '{}')::numeric < 0)) then
    raise exception 'Invalid value for this setting.';
  end if;
  if v_setting.value = p_value then
    return;
  end if;
  update system_settings set value = p_value, updated_at = now(), updated_by = auth.uid() where key = p_key;
  perform audit_write('settings.updated', 'setting', p_key,
    jsonb_build_object('before', v_setting.value, 'after', p_value));
end;
$$;

-- ===========================================================================
-- 12. DASHBOARDS & REPORTS (server-side aggregation, real data only)
-- ===========================================================================

create or replace function admin_dashboard_summary()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_result jsonb;
  v_payments boolean := has_permission('payments.view');
begin
  if not (has_permission('dashboard.view') and has_permission('events.view_all')) then
    raise exception 'You do not have access to the organization dashboard.';
  end if;

  select jsonb_build_object(
    'events', (select jsonb_build_object(
        'total', count(*),
        'draft', count(*) filter (where status = 'draft'),
        'on_sale', count(*) filter (where status = 'on-sale'),
        'sold_out', count(*) filter (where status = 'sold-out'),
        'cancelled', count(*) filter (where status = 'cancelled'),
        'upcoming', count(*) filter (where event_date > current_date and status not in ('draft', 'cancelled')),
        'today', count(*) filter (where event_date = current_date and status not in ('draft', 'cancelled')),
        'past', count(*) filter (where event_date < current_date and status <> 'cancelled')
      ) from events),
    'bookings', (select jsonb_build_object(
        'confirmed', count(*) filter (where status = 'confirmed'),
        'pending', count(*) filter (where status = 'pending'),
        'failed', count(*) filter (where status = 'failed'),
        'cancelled', count(*) filter (where status = 'cancelled'),
        'refunded', count(*) filter (where status = 'refunded'),
        'complimentary', count(*) filter (where source = 'complimentary' and status = 'confirmed'),
        'last_7_days', count(*) filter (where status = 'confirmed' and created_at > now() - interval '7 days')
      ) from bookings),
    'revenue', case when v_payments then (select jsonb_build_object(
        'total', coalesce(sum(amount) filter (where status = 'confirmed'), 0),
        'last_30_days', coalesce(sum(amount) filter (where status = 'confirmed' and created_at > now() - interval '30 days'), 0),
        'refunded', coalesce(sum(amount) filter (where status = 'refunded'), 0)
      ) from bookings) end,
    'tickets', (select jsonb_build_object(
        'issued', count(*) filter (where status <> 'cancelled'),
        'checked_in', count(*) filter (where status = 'checked_in')
      ) from tickets),
    'applications', (select jsonb_build_object(
        'pending', count(*) filter (where status = 'pending'),
        'by_type', coalesce((select jsonb_object_agg(type, n) from (
            select type, count(*) n from applications_overview where status = 'pending' group by type) x), '{}'::jsonb)
      ) from applications_overview),
    'people', jsonb_build_object(
        'super_admins', (select count(*) from profiles where role = 'super_admin' and is_active),
        'admins', (select count(*) from profiles where role = 'admin' and is_active),
        'staff', (select count(*) from profiles where role = 'staff' and is_active),
        'deactivated', (select count(*) from profiles where not is_active),
        'users_total', (select count(*) from profiles),
        'artists', (select count(*) from artists where status = 'approved'),
        'sponsors', (select count(*) from sponsor_profiles),
        'vendors', (select count(*) from vendor_profiles),
        'venue_partners', (select count(*) from venue_profiles),
        'venues', (select count(*) from venues where is_active),
        'crew', (select count(*) from crew_profiles),
        'volunteers', (select count(*) from volunteer_profiles)
      ),
    'health', jsonb_build_object(
        'ticket_emails_failed', (select count(*) from bookings where status = 'confirmed' and ticket_email_status = 'failed'),
        'approval_emails_failed', (select count(*) from application_notifications where status = 'failed'),
        'webhooks_unprocessed', (select count(*) from payment_webhook_events where not processed),
        'stale_pending_bookings', (select count(*) from bookings where status = 'pending' and created_at < now() - interval '30 minutes'),
        'on_sale_past_date', (select count(*) from events where status in ('on-sale', 'sold-out') and event_date < current_date),
        'open_tasks_overdue', (select count(*) from event_tasks where status <> 'done' and due_at < now())
      )
  ) into v_result;
  return v_result;
end;
$$;

create or replace function staff_dashboard()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
begin
  if not has_permission('dashboard.view') then
    raise exception 'You do not have access to the dashboard.';
  end if;
  return jsonb_build_object(
    'events', coalesce((
      select jsonb_agg(row_to_json(x) order by x.event_date) from (
        select e.id, e.name, e.event_date, e.event_time, e.end_time, e.venue, e.status,
               ea.id as assignment_id, ea.title as assignment_title, ea.status as assignment_status,
               (select count(*) from tickets t where t.event_id = e.id and t.status <> 'cancelled') as tickets_issued,
               (select count(*) from tickets t where t.event_id = e.id and t.status = 'checked_in') as checked_in
        from event_assignments ea join events e on e.id = ea.event_id
        where ea.assignee_id = auth.uid() and ea.status <> 'declined' and e.event_date >= current_date - 1
      ) x), '[]'::jsonb),
    'tasks', coalesce((
      select jsonb_agg(row_to_json(x) order by x.due_at nulls last) from (
        select t.id, t.title, t.description, t.priority, t.status, t.due_at, e.id as event_id, e.name as event_name
        from event_tasks t
        join event_assignments ea on ea.id = t.assignment_id
        join events e on e.id = ea.event_id
        where ea.assignee_id = auth.uid() and t.status <> 'done'
          and (t.due_at is null or t.due_at < (current_date + 1)::timestamptz or e.event_date <= current_date + 1)
      ) x), '[]'::jsonb),
    'checkins_by_me_today', (select count(*) from checkins where checked_in_by = auth.uid() and checked_in_at >= current_date)
  );
end;
$$;

create or replace function report_event_performance(p_from date default null, p_to date default null)
returns table (
  event_id uuid, name text, event_date date, status text, venue text, capacity int,
  tickets_sold bigint, complimentary bigint, revenue bigint, checked_in bigint,
  check_in_rate numeric, sell_through numeric, bookings_pending bigint, bookings_cancelled bigint, bookings_refunded bigint
)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not has_permission('reports.view') then
    raise exception 'You do not have access to reports.';
  end if;
  return query
  select e.id, e.name, e.event_date, e.status, e.venue, e.capacity,
         coalesce(b.sold, 0), coalesce(b.comp, 0),
         case when has_permission('payments.view') then coalesce(b.revenue, 0) end,
         coalesce(tk.checked_in, 0),
         case when coalesce(tk.issued, 0) > 0 then round(100.0 * tk.checked_in / tk.issued, 1) end,
         case when e.capacity > 0 then round(100.0 * coalesce(b.sold, 0) / e.capacity, 1) end,
         coalesce(b.pending, 0), coalesce(b.cancelled, 0), coalesce(b.refunded, 0)
  from events e
  left join lateral (
    select sum(bk.quantity) filter (where bk.status = 'confirmed') as sold,
           sum(bk.quantity) filter (where bk.status = 'confirmed' and bk.source = 'complimentary') as comp,
           sum(bk.amount) filter (where bk.status = 'confirmed') as revenue,
           count(*) filter (where bk.status = 'pending') as pending,
           count(*) filter (where bk.status = 'cancelled') as cancelled,
           count(*) filter (where bk.status = 'refunded') as refunded
    from bookings bk where bk.event_id = e.id
  ) b on true
  left join lateral (
    select count(*) filter (where tt.status <> 'cancelled') as issued,
           count(*) filter (where tt.status = 'checked_in') as checked_in
    from tickets tt where tt.event_id = e.id
  ) tk on true
  where e.status <> 'draft'
    and (p_from is null or e.event_date >= p_from)
    and (p_to is null or e.event_date <= p_to)
  order by e.event_date desc;
end;
$$;

create or replace function report_revenue_by_month(p_from date default null, p_to date default null)
returns table (month date, bookings bigint, tickets bigint, revenue bigint, refunded bigint)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not (has_permission('reports.view') and has_permission('payments.view')) then
    raise exception 'You do not have access to revenue reports.';
  end if;
  return query
  select date_trunc('month', bk.created_at)::date,
         count(*) filter (where bk.status = 'confirmed'),
         coalesce(sum(bk.quantity) filter (where bk.status = 'confirmed'), 0),
         coalesce(sum(bk.amount) filter (where bk.status = 'confirmed'), 0),
         coalesce(sum(bk.amount) filter (where bk.status = 'refunded'), 0)
  from bookings bk
  where (p_from is null or bk.created_at >= p_from)
    and (p_to is null or bk.created_at < p_to + 1)
  group by 1 order by 1 desc;
end;
$$;

create or replace function report_applications(p_from date default null, p_to date default null)
returns table (type text, pending bigint, approved bigint, rejected bigint, avg_review_hours numeric)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not (has_permission('reports.view') and has_permission('applications.view')) then
    raise exception 'You do not have access to application reports.';
  end if;
  return query
  select a.type,
         count(*) filter (where a.status = 'pending'),
         count(*) filter (where a.status = 'approved'),
         count(*) filter (where a.status = 'rejected'),
         round(avg(extract(epoch from (a.reviewed_at - a.submitted_at)) / 3600) filter (where a.reviewed_at is not null), 1)
  from applications_overview a
  where (p_from is null or a.submitted_at >= p_from)
    and (p_to is null or a.submitted_at < p_to + 1)
  group by a.type order by a.type;
end;
$$;

create or replace function report_staff_activity(p_from date default null, p_to date default null)
returns table (user_id uuid, name text, role text, events_assigned bigint, checkins bigint, manual_checkins bigint, tasks_done bigint, tasks_open bigint)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not has_permission('reports.view') then
    raise exception 'You do not have access to reports.';
  end if;
  return query
  select p.id, coalesce(p.full_name, p.email), p.role::text,
         (select count(distinct ea.event_id) from event_assignments ea where ea.assignee_id = p.id and ea.status <> 'declined'),
         (select count(*) from checkins c where c.checked_in_by = p.id
            and (p_from is null or c.checked_in_at >= p_from) and (p_to is null or c.checked_in_at < p_to + 1)),
         (select count(*) from checkins c where c.checked_in_by = p.id and c.method = 'manual'
            and (p_from is null or c.checked_in_at >= p_from) and (p_to is null or c.checked_in_at < p_to + 1)),
         (select count(*) from event_tasks t join event_assignments ea on ea.id = t.assignment_id where ea.assignee_id = p.id and t.status = 'done'),
         (select count(*) from event_tasks t join event_assignments ea on ea.id = t.assignment_id where ea.assignee_id = p.id and t.status <> 'done')
  from profiles p
  where p.role in ('staff', 'admin', 'super_admin', 'crew', 'volunteer')
    and (exists (select 1 from event_assignments ea where ea.assignee_id = p.id)
         or exists (select 1 from checkins c where c.checked_in_by = p.id))
  order by 5 desc, 2;
end;
$$;

-- Internal-only helpers never need to be called over the API.
revoke execute on function audit_row_change() from public, anon, authenticated;
revoke execute on function audit_booking_system_change() from public, anon, authenticated;
