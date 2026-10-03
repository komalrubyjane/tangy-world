-- Tangy Sessions — Phase 1 security lockdown. Run after 0016.
--
-- SECURITY CHANGES ONLY. No data is deleted, migrated or rewritten: every
-- statement below changes privileges, policies, triggers, functions or
-- constraint behaviour. Existing rows are only READ (preflight checks).
--
-- Targets the 0001–0016 schema on `main`. It refuses to run (step 0) on a
-- database that already has the feat/platform-finalization migrations
-- (0017_admin_system … 0034), because those redefine some of the same
-- functions; that baseline needs these fixes re-reviewed against its own
-- definitions instead of having them overwritten.
--
-- Tests: supabase/tests/security_lockdown.test.sql (run_local.sh).
-- Rollback (re-opens every hole below): supabase/rollbacks/0017_security_lockdown.down.sql.
--
-- "API request" below means a request that arrived through PostgREST with an
-- anon/authenticated JWT (auth.role() in ('anon', 'authenticated')). The
-- service_role key, the SQL editor and the Table Editor are the project
-- owner's own tools and are deliberately not restricted by the new guards —
-- that is also what lets the documented "set the first admin's role in the
-- Table Editor" bootstrap work, which 0003's guard currently blocks.

-- 0. PREFLIGHT — read-only checks; abort before changing anything ----------

do $$
begin
  if to_regclass('public.role_permissions') is not null then
    raise exception 'STOP: this database already has the platform-finalization migrations (public.role_permissions exists). '
      '0017_security_lockdown targets the 0016 schema and would overwrite functions those migrations redefine. Nothing was changed.';
  end if;
end $$;

-- artists.user_id becomes unique (one artist profile per account). If any
-- account already owns several artist rows, stop and report — never pick
-- one and delete or detach the others automatically.
do $$
declare
  v_dupes text;
begin
  select string_agg(user_id::text || ' (' || n || ' rows)', ', ')
    into v_dupes
  from (select user_id, count(*) n from artists where user_id is not null group by user_id having count(*) > 1) d;
  if v_dupes is not null then
    raise exception 'STOP: artists.user_id has duplicates, so the unique index cannot be created: %. '
      'Resolve them by hand (decide which artist row each account keeps), then re-run. Nothing was changed.', v_dupes;
  end if;
end $$;

-- 1. ARTISTS — self-insert only, always pending, one row per account -------

-- 0015 only required a non-null user_id, so anyone (even signed out) could
-- create an artist row for ANY account, with any status. RegisterPage.jsx
-- now verifies the email by OTP before inserting, so the applicant always
-- has a session at insert time and auth.uid() = user_id is satisfiable
-- (0015's reason for not requiring it no longer applies).
drop policy if exists "artists: requires linked account" on artists;
create policy "artists: authenticated self apply" on artists for insert
  with check (auth.uid() is not null and user_id = auth.uid());

-- The 0003 status guard is BEFORE UPDATE only; an INSERT could set
-- status = 'approved' directly and land in the public directory and the
-- admin's assignment picker.
create function guard_artist_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if coalesce(auth.role(), '') in ('anon', 'authenticated') and not is_admin() then
    if new.status is distinct from 'pending' or new.reviewed_at is not null then
      raise exception 'New artist applications must start as pending.';
    end if;
  end if;
  return new;
end;
$$;

create trigger guard_artist_insert_trigger
  before insert on artists
  for each row execute function guard_artist_insert();

create unique index artists_user_id_unique on artists (user_id) where user_id is not null;

-- 2. APPLICATIONS / ENQUIRIES — always enter the review queue --------------

-- collaborations / crew_applications / private_enquiries insert policies
-- never constrained `status`, so an applicant could file their own
-- application as 'approved' (the portals' isApproved check reads it).
-- contact_enquiries likewise lets the sender pre-mark a message 'replied'.
create function guard_application_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if coalesce(auth.role(), '') in ('anon', 'authenticated') and not is_admin() then
    if tg_table_name = 'contact_enquiries' then
      if new.status is distinct from 'new' then
        raise exception 'New enquiries must start as new.';
      end if;
    elsif new.status is distinct from 'pending' then
      raise exception 'New applications must start as pending.';
    end if;
  end if;
  return new;
end;
$$;

create trigger guard_collaboration_insert before insert on collaborations
  for each row execute function guard_application_insert();
create trigger guard_crew_application_insert before insert on crew_applications
  for each row execute function guard_application_insert();
create trigger guard_private_enquiry_insert before insert on private_enquiries
  for each row execute function guard_application_insert();
create trigger guard_contact_enquiry_insert before insert on contact_enquiries
  for each row execute function guard_application_insert();

-- private_enquiries accepted ANY user_id (check (true)), so anyone could
-- file enquiries into another account's dashboard. Anonymous enquiries
-- (user_id null) stay allowed, as the public forms rely on that.
drop policy if exists "private_enquiries: anyone can submit" on private_enquiries;
create policy "private_enquiries: submit as self or anonymously" on private_enquiries for insert
  with check (user_id is null or user_id = auth.uid());

-- 3. PROFILES — identity columns, role escalation, super admin -------------

-- "profiles: self update" has no column granularity: a user could set
-- profiles.email to someone else's address. That column is read as the
-- "authenticated" recipient by send-ticket-email / send-approval-email and
-- (until step 4) authorized waitlist reads. The real sign-in email lives in
-- auth.users; profiles.email is now only ever a copy of it.
create function guard_profile_identity()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if coalesce(auth.role(), '') in ('anon', 'authenticated') then
    if new.id is distinct from old.id
       or new.email is distinct from old.email
       or new.passport_id is distinct from old.passport_id
       or new.member_since is distinct from old.member_since
       or new.created_at is distinct from old.created_at then
      raise exception 'Email, passport and membership fields cannot be changed here.';
    end if;
  end if;
  return new;
end;
$$;

create trigger guard_profile_identity_change
  before update on profiles
  for each row execute function guard_profile_identity();

-- Keep the copy current when a user changes their sign-in email through
-- Supabase Auth (the only legitimate way to change it).
create function sync_profile_email()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles set email = new.email where id = new.id and email is distinct from new.email;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function sync_profile_email();

-- Replaces 0003's guard (same name, so the existing trigger keeps using it).
-- Unchanged: through the API only an admin may change a role.
-- New:
--   * only a super_admin may grant or revoke super_admin (previously any
--     admin could make themselves or anyone else super_admin, or demote one);
--   * the last remaining super_admin can never be demoted (any path);
--   * the project owner (SQL editor / Table Editor / service_role) is no
--     longer blocked, so the README's first-admin bootstrap works.
create or replace function prevent_role_self_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if coalesce(auth.role(), '') in ('anon', 'authenticated') then
      if not is_admin() then
        raise exception 'Only an admin can change a profile role.';
      end if;
      if (new.role = 'super_admin' or old.role = 'super_admin')
         and current_role_name() is distinct from 'super_admin' then
        raise exception 'Only a super admin can grant or revoke super admin.';
      end if;
    end if;
    if old.role = 'super_admin'
       and not exists (select 1 from profiles where role = 'super_admin' and id <> old.id) then
      raise exception 'Cannot remove the last super admin.';
    end if;
  end if;
  return new;
end;
$$;

-- 4. WAITLIST — authorize by the signed JWT email, not profiles.email ------

drop policy if exists "waitlist: self read own by email" on waitlist;
create policy "waitlist: self read own by verified email" on waitlist for select
  using (lower(email) = lower(auth.jwt() ->> 'email'));

-- 5. TRANSACTIONAL HISTORY — events/bookings can no longer cascade away ----

-- Deleting an event cascaded into bookings, tickets and check-ins (0001,
-- 0016); deleting a booking cascaded into its tickets and check-ins. Each
-- foreign key is re-created with ON DELETE RESTRICT: the same columns and
-- references, so every existing row still satisfies it and none is touched.
-- Deleting an event that has bookings now fails instead of erasing them; an
-- archive/cancel workflow replaces hard delete in a later phase.
do $$
declare
  fk record;
  v_conname text;
begin
  for fk in
    select * from (values
      ('bookings', 'event_id', 'events'),
      ('tickets',  'event_id', 'events'),
      ('checkins', 'event_id', 'events'),
      ('tickets',  'booking_id', 'bookings'),
      ('checkins', 'booking_id', 'bookings'),
      ('checkins', 'ticket_id', 'tickets')
    ) as t(tbl, col, ref)
  loop
    select c.conname into v_conname
    from pg_constraint c
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
    where c.contype = 'f'
      and c.conrelid = ('public.' || fk.tbl)::regclass
      and c.confrelid = ('public.' || fk.ref)::regclass
      and array_length(c.conkey, 1) = 1
      and a.attname = fk.col;

    if v_conname is null then
      raise exception 'STOP: expected foreign key %.% -> % not found. Nothing was changed.', fk.tbl, fk.col, fk.ref;
    end if;

    execute format('alter table public.%I drop constraint %I', fk.tbl, v_conname);
    execute format('alter table public.%I add constraint %I foreign key (%I) references public.%I (id) on delete restrict',
      fk.tbl, fk.tbl || '_' || fk.col || '_fkey', fk.col, fk.ref);
  end loop;
end $$;

-- Staff/admin had FOR ALL (including DELETE) on bookings, tickets and
-- check-ins. No screen deletes these rows; hard deletes now go only through
-- the project owner. Select/insert/update access is unchanged.
drop policy if exists "bookings: staff/admin full access" on bookings;
create policy "bookings: staff/admin read" on bookings for select using (is_staff_or_admin());
create policy "bookings: staff/admin insert" on bookings for insert with check (is_staff_or_admin());
create policy "bookings: staff/admin update" on bookings for update using (is_staff_or_admin());

drop policy if exists "tickets: staff/admin full access" on tickets;
create policy "tickets: staff/admin read" on tickets for select using (is_staff_or_admin());
create policy "tickets: staff/admin insert" on tickets for insert with check (is_staff_or_admin());
create policy "tickets: staff/admin update" on tickets for update using (is_staff_or_admin());

drop policy if exists "checkins: staff/admin only" on checkins;
create policy "checkins: staff/admin read" on checkins for select using (is_staff_or_admin());
create policy "checkins: staff/admin insert" on checkins for insert with check (is_staff_or_admin());
create policy "checkins: staff/admin update" on checkins for update using (is_staff_or_admin());

-- 6. PORTAL AUTHORIZATION — only approved artists get booking workflows ----

-- Unchanged from 0008 except the approved-artist check: an admin could send
-- (and a pending/rejected artist accept) a session assignment, which writes
-- event_artists — the public line-up.
create or replace function create_assignment_request(p_session_id uuid, p_artist_id uuid, p_message text default null)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_request_id uuid;
  v_conversation_id uuid;
  v_artist_user_id uuid;
begin
  if not is_staff_or_admin() then
    raise exception 'Only staff/admin can request an artist assignment.';
  end if;

  select user_id into v_artist_user_id from artists where id = p_artist_id and status = 'approved';
  if not found then
    raise exception 'Only an approved artist can be requested for a session.';
  end if;
  if v_artist_user_id is null then
    raise exception 'Artist has no linked user account.';
  end if;

  insert into conversations (subject, category, status, created_by, assigned_admin_id, related_session_id, related_artist_id)
    values ('Session assignment request', 'assignment', 'open', auth.uid(), auth.uid(), p_session_id, p_artist_id)
    returning id into v_conversation_id;
  insert into conversation_participants (conversation_id, user_id, role) values
    (v_conversation_id, auth.uid(), 'admin'),
    (v_conversation_id, v_artist_user_id, 'member');

  insert into assignment_requests (session_id, artist_id, requested_by, message, conversation_id)
    values (p_session_id, p_artist_id, auth.uid(), p_message, v_conversation_id)
    returning id into v_request_id;

  insert into messages (conversation_id, sender_id, content, message_type)
    values (v_conversation_id, auth.uid(), coalesce(p_message, 'You have a new session assignment request.'), 'text');

  return v_request_id;
end;
$$;

create or replace function respond_to_assignment_request(p_request_id uuid, p_accept boolean)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_req assignment_requests%rowtype;
begin
  select * into v_req from assignment_requests where id = p_request_id;
  if v_req.id is null then
    raise exception 'Assignment request not found.';
  end if;
  if v_req.status <> 'pending' then
    raise exception 'This request has already been responded to.';
  end if;
  if not exists (select 1 from artists where id = v_req.artist_id and user_id = auth.uid()) then
    raise exception 'Not authorized to respond to this request.';
  end if;
  if p_accept and not exists (select 1 from artists where id = v_req.artist_id and status = 'approved') then
    raise exception 'Only an approved artist can accept a session assignment.';
  end if;

  update assignment_requests
    set status = case when p_accept then 'accepted' else 'declined' end,
        responded_at = now()
    where id = p_request_id;

  if p_accept then
    insert into event_artists (event_id, artist_id) values (v_req.session_id, v_req.artist_id)
      on conflict do nothing;
  end if;

  if v_req.conversation_id is not null then
    insert into messages (conversation_id, sender_id, content, message_type)
      values (v_req.conversation_id, auth.uid(),
        case when p_accept then 'Accepted the assignment request.' else 'Declined the assignment request.' end,
        'system');
  end if;
end;
$$;

-- Unchanged from 0008 except the assignee check: staff could pass ANY user
-- id, adding e.g. another patron as a participant of someone's private
-- support conversation.
create or replace function assign_conversation(p_conversation_id uuid, p_admin_id uuid default auth.uid())
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not is_staff_or_admin() then
    raise exception 'Only staff/admin can assign conversations.';
  end if;
  if not exists (select 1 from profiles where id = p_admin_id and role in ('staff', 'admin', 'super_admin')) then
    raise exception 'Conversations can only be assigned to staff or admin accounts.';
  end if;
  update conversations set assigned_admin_id = p_admin_id, status = 'pending'
    where id = p_conversation_id;
  insert into conversation_participants (conversation_id, user_id, role)
    values (p_conversation_id, p_admin_id, 'admin')
    on conflict (conversation_id, user_id) do nothing;
end;
$$;

-- artist_availability was readable by anyone for every artist row,
-- including pending and rejected applicants.
drop policy if exists "artist_availability: public read" on artist_availability;
create policy "artist_availability: read approved or own" on artist_availability for select
  using (exists (
    select 1 from artists a
    where a.id = artist_id and (a.status = 'approved' or a.user_id = auth.uid())
  ));

-- 7. FUNCTION PRIVILEGES — least privilege for every SECURITY DEFINER -----

-- PostgreSQL grants EXECUTE on new functions to PUBLIC, and Supabase's
-- default privileges grant it to anon and authenticated, so every function
-- in `public` was callable through /rest/v1/rpc by anyone. Most check the
-- caller themselves; create_pending_booking and
-- confirm_booking_and_issue_tickets check nothing, so any visitor could
-- create a booking at any price for any user and confirm it into valid QR
-- tickets without paying. Runs last, so it also covers the functions this
-- migration creates. Fails closed: a SECURITY DEFINER function not named
-- below ends up callable by service_role only.
do $$
declare
  f record;
begin
  for f in
    select p.oid::regprocedure as sig, p.proname, p.prosecdef, p.prorettype = 'trigger'::regtype as is_trigger
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and (p.prosecdef or p.prorettype = 'trigger'::regtype)
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);

    if f.is_trigger then
      -- Trigger functions are never called directly; EXECUTE is not checked
      -- when a trigger fires, so this does not affect the triggers.
      continue;
    end if;

    execute format('grant execute on function %s to service_role', f.sig);

    if f.proname in ('current_role_name', 'is_admin', 'is_staff_or_admin', 'is_participant', 'is_own_assignment') then
      -- RLS policy helpers: evaluated inside policies for anon and
      -- authenticated queries, so both roles must be able to execute them.
      -- They only describe the caller (their own role / membership).
      execute format('grant execute on function %s to anon, authenticated', f.sig);
    elsif f.proname in (
      'get_or_create_support_conversation', 'reopen_conversation', 'assign_conversation',
      'create_assignment_request', 'respond_to_assignment_request', 'cancel_assignment_request',
      'approve_crew_application', 'reject_crew_application',
      'approve_collaboration', 'reject_collaboration',
      'approve_artist_application', 'reject_artist_application',
      'check_in_ticket'
    ) then
      -- Client RPCs: each verifies auth.uid() / role / ownership inside.
      execute format('grant execute on function %s to authenticated', f.sig);
    end if;
    -- create_pending_booking, confirm_booking_and_issue_tickets and any
    -- unlisted function: service_role only (the razorpay-* Edge Functions).
  end loop;
end $$;
