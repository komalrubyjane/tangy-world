-- Rollback for 0017_security_lockdown.sql — restores the 0016 definitions.
--
-- WARNING: this RE-OPENS the vulnerabilities 0017 closed (self-approved
-- artists and applications, profile email spoofing, super-admin abuse,
-- event deletes cascading into bookings/tickets/check-ins). Only run it to
-- back out a broken deploy, and re-apply 0017 as soon as possible.
--
-- One deliberate exception: function EXECUTE privileges are NOT restored.
-- Restoring them would let any visitor call create_pending_booking /
-- confirm_booking_and_issue_tickets and mint free tickets. If you truly
-- need the 0016 grants back, uncomment the block at the end.
--
-- Data: like 0017, this changes no rows. The unique index on
-- artists.user_id is dropped; nothing else depends on it.

-- 1. artists
drop trigger if exists guard_artist_insert_trigger on artists;
drop function if exists guard_artist_insert();
drop index if exists artists_user_id_unique;
drop policy if exists "artists: authenticated self apply" on artists;
create policy "artists: requires linked account" on artists for insert
  with check (user_id is not null);

-- 2. applications / enquiries
drop trigger if exists guard_collaboration_insert on collaborations;
drop trigger if exists guard_crew_application_insert on crew_applications;
drop trigger if exists guard_private_enquiry_insert on private_enquiries;
drop trigger if exists guard_contact_enquiry_insert on contact_enquiries;
drop function if exists guard_application_insert();
drop policy if exists "private_enquiries: submit as self or anonymously" on private_enquiries;
create policy "private_enquiries: anyone can submit" on private_enquiries for insert with check (true);

-- 3. profiles
drop trigger if exists guard_profile_identity_change on profiles;
drop function if exists guard_profile_identity();
drop trigger if exists on_auth_user_email_changed on auth.users;
drop function if exists sync_profile_email();

create or replace function prevent_role_self_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role and not is_admin() then
    raise exception 'Only an admin can change a profile role.';
  end if;
  return new;
end;
$$;

-- 4. waitlist
drop policy if exists "waitlist: self read own by verified email" on waitlist;
create policy "waitlist: self read own by email" on waitlist for select
  using (email = (select email from profiles where id = auth.uid()));

-- 5. transactional foreign keys back to ON DELETE CASCADE
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
    if v_conname is not null then
      execute format('alter table public.%I drop constraint %I', fk.tbl, v_conname);
    end if;
    execute format('alter table public.%I add constraint %I foreign key (%I) references public.%I (id) on delete cascade',
      fk.tbl, fk.tbl || '_' || fk.col || '_fkey', fk.col, fk.ref);
  end loop;
end $$;

drop policy if exists "bookings: staff/admin read" on bookings;
drop policy if exists "bookings: staff/admin insert" on bookings;
drop policy if exists "bookings: staff/admin update" on bookings;
create policy "bookings: staff/admin full access" on bookings for all using (is_staff_or_admin());

drop policy if exists "tickets: staff/admin read" on tickets;
drop policy if exists "tickets: staff/admin insert" on tickets;
drop policy if exists "tickets: staff/admin update" on tickets;
create policy "tickets: staff/admin full access" on tickets for all using (is_staff_or_admin());

drop policy if exists "checkins: staff/admin read" on checkins;
drop policy if exists "checkins: staff/admin insert" on checkins;
drop policy if exists "checkins: staff/admin update" on checkins;
create policy "checkins: staff/admin only" on checkins for all using (is_staff_or_admin());

-- 6. portal authorization (0008 bodies)
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

  select user_id into v_artist_user_id from artists where id = p_artist_id;
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

create or replace function assign_conversation(p_conversation_id uuid, p_admin_id uuid default auth.uid())
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not is_staff_or_admin() then
    raise exception 'Only staff/admin can assign conversations.';
  end if;
  update conversations set assigned_admin_id = p_admin_id, status = 'pending'
    where id = p_conversation_id;
  insert into conversation_participants (conversation_id, user_id, role)
    values (p_conversation_id, p_admin_id, 'admin')
    on conflict (conversation_id, user_id) do nothing;
end;
$$;

drop policy if exists "artist_availability: read approved or own" on artist_availability;
create policy "artist_availability: public read" on artist_availability for select using (true);

-- 7. Function privileges — intentionally left at 0017's least privilege.
-- To restore 0016's (vulnerable) grants, uncomment:
-- do $$
-- declare f record;
-- begin
--   for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--            where n.nspname = 'public' and (p.prosecdef or p.prorettype = 'trigger'::regtype)
--   loop
--     execute format('grant execute on function %s to public, anon, authenticated', f.sig);
--   end loop;
-- end $$;
