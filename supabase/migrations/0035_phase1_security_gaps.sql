-- Tangy Sessions — Phase 1 security gaps on the platform-finalization schema.
-- Run after 0034.
--
-- Closes the Phase 1 issues that 0017–0034 had not yet covered (each one
-- verified against a database built from 0001–0034, see
-- tests/phase1_security_gaps.test.sql). Everything 0017–0034 already does is
-- left as it is — in particular:
--   * booking RPC lockdown (0017: create_pending_booking /
--     confirm_booking_and_issue_tickets are service_role only)
--   * role guard and Super Admin model (0018/0030: only roles.manage changes
--     roles, nobody changes their own role)
--   * event delete protection (prevent_event_delete_with_bookings trigger)
--     and no API delete on bookings/tickets/checkins
--   * crew/volunteer insert guard (guard_crew_application_insert)
--   * artist availability no longer public (0033)
--
-- SECURITY CHANGES ONLY: no row is deleted, migrated or rewritten. Existing
-- rows are only read (preflight). Idempotent: safe to run twice.
-- Rollback: rollbacks/0035_phase1_security_gaps.down.sql.
--
-- "API request" = arrived through PostgREST with an anon/authenticated JWT
-- (auth.role() in ('anon', 'authenticated')). The SQL editor, Table Editor
-- and service_role are the project owner's tools and stay unrestricted —
-- the same convention as 0018's prevent_role_self_escalation and
-- guard_crew_application_insert.

-- 0. PREFLIGHT (read-only) ------------------------------------------------

do $$
begin
  if to_regclass('public.role_permissions') is null
     or to_regprocedure('public.artist_day_status(uuid,date,time,time,uuid)') is null then
    raise exception 'STOP: 0035 expects the platform-finalization schema through 0034 (role_permissions, artist_day_status). Nothing was changed.';
  end if;
end $$;

-- One artist profile per account (step 2). Never resolves duplicates itself.
do $$
declare
  v_dupes text;
begin
  select string_agg(user_id::text || ' (' || n || ' rows)', ', ') into v_dupes
  from (select user_id, count(*) n from artists where user_id is not null group by user_id having count(*) > 1) d;
  if v_dupes is not null then
    raise exception 'STOP: artists.user_id has duplicates, so the unique index cannot be created: %. '
      'Decide by hand which artist row each account keeps, then re-run. Nothing was changed.', v_dupes;
  end if;
end $$;

-- Snapshot of every function ACL this migration touches, so the rollback
-- restores exactly what was there (not a guess). Owner-only table.
create table if not exists _security_0035_function_acl (
  signature text primary key,
  acl aclitem[]
);
alter table _security_0035_function_acl enable row level security;
revoke all on _security_0035_function_acl from public, anon, authenticated;

insert into _security_0035_function_acl (signature, acl)
select p.oid::regprocedure::text, p.proacl
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and (p.prosecdef or p.prorettype = 'trigger'::regtype)
on conflict (signature) do nothing;

-- 1. APPLICATIONS ENTER REVIEW — status can't be self-approved ------------

-- artists (direct insert policy "artists: self apply" still exists for the
-- legacy registration form), collaborations (vendor / sponsor / venue_host)
-- and private_enquiries accepted any status from the applicant, e.g.
-- 'approved' — which the partner dashboards and the public artist pages
-- read. contact_enquiries accepted 'replied'. Same approach as 0018's
-- guard_crew_application_insert: force the starting state and clear review
-- fields for API callers; the owner's tools and service_role are trusted.
create or replace function guard_application_start()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if coalesce(auth.role(), '') not in ('authenticated', 'anon') then
    return new;
  end if;
  if tg_table_name = 'contact_enquiries' then
    new.status := 'new';
    return new;
  end if;
  new.status := 'pending';
  if tg_table_name in ('artists', 'collaborations') then
    new.reviewed_by := null; new.reviewed_at := null; new.review_notes := null; new.decision_reason := null;
  end if;
  return new;
end;
$$;

drop trigger if exists artists_guard_start on artists;
create trigger artists_guard_start before insert on artists
  for each row execute function guard_application_start();
drop trigger if exists collaborations_guard_start on collaborations;
create trigger collaborations_guard_start before insert on collaborations
  for each row execute function guard_application_start();
drop trigger if exists private_enquiries_guard_start on private_enquiries;
create trigger private_enquiries_guard_start before insert on private_enquiries
  for each row execute function guard_application_start();
drop trigger if exists contact_enquiries_guard_start on contact_enquiries;
create trigger contact_enquiries_guard_start before insert on contact_enquiries
  for each row execute function guard_application_start();

-- 2. ONE ARTIST ROW PER ACCOUNT -------------------------------------------

-- artist_applications is already unique per user (0033) and reuses its
-- artist row, but the legacy direct insert can still add a second row once
-- the first is no longer pending (guard_duplicate_application only blocks a
-- second *pending* one). Several rows per account break every
-- .eq('user_id').maybeSingle() lookup of the artist portal.
create unique index if not exists artists_user_id_unique on artists (user_id) where user_id is not null;

-- 3. PROFILE IDENTITY — the sign-in email is not self-editable ------------

-- "profiles: self update" has no column granularity: a user could set
-- profiles.email to someone else's address. It is read as the recipient of
-- ticket / approval / notification emails and (step 4) authorized waitlist
-- reads. passport_id / member_since / created_at are identity facts too.
-- Role and is_active are already guarded by prevent_role_self_escalation.
create or replace function guard_profile_identity()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if coalesce(auth.role(), '') in ('authenticated', 'anon')
     and (new.id is distinct from old.id
          or new.email is distinct from old.email
          or new.passport_id is distinct from old.passport_id
          or new.member_since is distinct from old.member_since
          or new.created_at is distinct from old.created_at) then
    raise exception 'Email, passport and membership details cannot be changed here.';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_identity_change on profiles;
create trigger guard_profile_identity_change before update on profiles
  for each row execute function guard_profile_identity();

-- profiles.email is now only ever a copy of the Supabase Auth email; keep it
-- current when the user changes their sign-in email through Auth.
create or replace function sync_profile_email()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles set email = new.email where id = new.id and email is distinct from new.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed after update of email on auth.users
  for each row execute function sync_profile_email();

-- 4. WAITLIST — authorize by the signed JWT email, not profiles.email -----

-- 0009's policy is still in place next to 0027's user_id policy; a profile
-- email that was tampered with before step 3 would still unlock someone
-- else's anonymous (pre-0027) waitlist rows.
drop policy if exists "waitlist: self read own by email" on waitlist;
drop policy if exists "waitlist: self read own by verified email" on waitlist;
create policy "waitlist: self read own by verified email" on waitlist for select
  using (lower(email) = lower(auth.jwt() ->> 'email'));

-- 5. APPROVED ARTISTS ONLY — legacy assignment requests -------------------

-- create_booking_request / create_artist_request / save_event_lineup check
-- artists.status = 'approved'; the older create_assignment_request /
-- respond_to_assignment_request pair does not, and accepting writes
-- event_artists (the public line-up). Enforced on the table both functions
-- write, so their 0008 bodies stay untouched.
create or replace function guard_assignment_request_artist()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if coalesce(auth.role(), '') not in ('authenticated', 'anon') then
    return new;
  end if;
  if (tg_op = 'INSERT' or (new.status = 'accepted' and old.status is distinct from 'accepted'))
     and not exists (select 1 from artists where id = new.artist_id and status = 'approved') then
    raise exception 'Only an approved artist can be requested for, or accept, a session.';
  end if;
  return new;
end;
$$;

drop trigger if exists assignment_requests_guard_artist on assignment_requests;
create trigger assignment_requests_guard_artist before insert or update on assignment_requests
  for each row execute function guard_assignment_request_artist();

-- 6. CONVERSATION ASSIGNMENT — only the team joins as 'admin' -------------

-- assign_conversation(p_conversation_id, p_admin_id) never checks who
-- p_admin_id is: an admin could add any account (a patron, another partner)
-- as an 'admin' participant of someone's private thread. Every legitimate
-- 'admin' participant (send_message, set_conversation_meta,
-- admin_start_partner_conversation, start_private_artist_conversation,
-- create_assignment_request) is a staff/admin/super_admin account.
create or replace function guard_conversation_admin_participant()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role = 'admin'
     and coalesce(auth.role(), '') in ('authenticated', 'anon')
     and not exists (select 1 from profiles where id = new.user_id and role in ('staff', 'admin', 'super_admin')) then
    raise exception 'Conversations can only be assigned to Tangy team accounts.';
  end if;
  return new;
end;
$$;

drop trigger if exists conversation_participants_guard_admin on conversation_participants;
create trigger conversation_participants_guard_admin before insert or update on conversation_participants
  for each row execute function guard_conversation_admin_participant();

-- 7. FUNCTION PRIVILEGES --------------------------------------------------

-- PostgreSQL grants EXECUTE to PUBLIC and Supabase's default privileges to
-- anon/authenticated on every new function; 0017–0034 revoked that for the
-- payment/job/audit functions, but left 151 SECURITY DEFINER functions
-- callable without signing in. All but the ones below check the caller
-- themselves (has_permission / auth.uid() / participant checks) or are
-- intentionally public (event_availability, booking_quote,
-- invitation_preview) or are RLS helpers that policies evaluate for anon.
do $$
declare
  f record;
  v_anon boolean;
  v_auth boolean;
begin
  -- 7a. Trigger functions: never called directly (EXECUTE is not checked
  -- when a trigger fires), so API roles need no grant.
  for f in
    select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prorettype = 'trigger'::regtype
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
  end loop;

  -- 7b. Internal-only functions with no caller check: scheduled jobs that
  -- anyone could fire early, and lookups that answer for ANY user id
  -- (event_member_ids lists every account working an event). Only other
  -- SECURITY DEFINER functions call them (they run as the owner) — no
  -- policy, view, invoker function, Edge Function or screen does.
  for f in
    select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in (
      'send_event_reminders', 'notify_overdue_tasks', 'notify_expiring_access',
      'event_member_ids', 'partner_kind', 'member_link', 'notification_allowed', 'has_active_access')
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
    execute format('grant execute on function %s to service_role', f.sig);
  end loop;

  -- 7c. Remaining SECURITY DEFINER functions: drop the implicit PUBLIC
  -- grant but keep exactly the anon/authenticated access each one has now,
  -- so no screen, RPC or RLS policy changes behaviour.
  for f in
    select p.oid, p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef and p.prorettype <> 'trigger'::regtype
      and exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
                  where a.grantee = 0 and a.privilege_type = 'EXECUTE')
  loop
    v_anon := has_function_privilege('anon', f.oid, 'execute');
    v_auth := has_function_privilege('authenticated', f.oid, 'execute');
    execute format('revoke execute on function %s from public', f.sig);
    if v_anon then execute format('grant execute on function %s to anon', f.sig); end if;
    if v_auth then execute format('grant execute on function %s to authenticated', f.sig); end if;
    execute format('grant execute on function %s to service_role', f.sig);
  end loop;
end $$;
