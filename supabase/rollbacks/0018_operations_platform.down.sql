-- Tangy Sessions — REVERSE of 0018_operations_platform.sql. Not applied
-- automatically; run by hand only to roll the operations platform back.
--
-- Restores every function/view/policy 0018 replaced to its 0017 (or 0011)
-- definition, and DROPS what 0018 created: notifications, event requirements,
-- event documents, private artist logistics, temporary access grants and
-- access requests. Export those first if you need them.
-- Rows that only exist because of 0018 features are removed so the older
-- constraints can be restored: sponsor event assignments, announcements with
-- the new partner/volunteer audiences, and partner (non-'general') conversations.
-- No other pre-existing row is touched.

begin;

do $$ begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('tangy-log-expired-access');
  end if;
exception when others then null;
end $$;

-- Restore the 0017 check-in surface before dropping what it referenced
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

drop function if exists my_checkin_events();
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

create or replace function guard_event_assignment_response()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if is_staff_or_admin() then
    return new;
  end if;
  if new.event_id is distinct from old.event_id
     or new.assignee_role is distinct from old.assignee_role
     or new.assignee_id is distinct from old.assignee_id
     or new.title is distinct from old.title
     or new.notes is distinct from old.notes
     or new.assigned_by is distinct from old.assigned_by then
    raise exception 'Only staff/admin can change assignment details.';
  end if;
  if new.status is distinct from old.status
     and not (old.status = 'assigned' and new.status in ('confirmed', 'declined')) then
    raise exception 'You can only confirm or decline a pending assignment.';
  end if;
  return new;
end;
$$;

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

create or replace function can_view_event_attendees(p_event_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select has_permission('attendees.view_all')
      or (has_permission('attendees.view_assigned') and is_assigned_to_event(p_event_id));
$$;

create or replace function my_permissions()
returns text[]
language sql stable security definer set search_path = public
as $$
  select coalesce(array_agg(permission order by permission), '{}')
  from role_permissions where role = current_role_name();
$$;

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

create or replace function approve_artist_application(p_id uuid, p_notes text default null)
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

-- Triggers 0018 added to existing tables
drop trigger if exists event_assignments_notify on event_assignments;
drop trigger if exists event_artists_notify on event_artists;
drop trigger if exists event_tasks_notify on event_tasks;
drop trigger if exists collaborations_notify on collaborations;
drop trigger if exists crew_applications_notify on crew_applications;
drop trigger if exists artists_application_notify on artists;
drop trigger if exists announcements_notify on announcements;
drop trigger if exists messages_after_insert on messages;
drop trigger if exists collaborations_decision_notify on collaborations;
drop trigger if exists crew_applications_decision_notify on crew_applications;
drop trigger if exists artists_decision_notify on artists;

-- New tables (cascade removes their policies/triggers/publication membership)
drop table if exists access_requests cascade;
drop table if exists temporary_access cascade;
drop function if exists guard_temporary_access();
drop function if exists access_state(temporary_access);
drop function if exists has_active_access(uuid, text, uuid);
drop table if exists notifications cascade;
drop function if exists notify_permission_holders(text, text, text, text, text, uuid);
drop function if exists notify(uuid, text, text, text, text, uuid);
drop table if exists event_documents cascade;
drop table if exists event_requirements cascade;
drop table if exists event_artist_details cascade;

-- New RPCs / helpers
drop function if exists my_portal_events(boolean);
drop function if exists set_role_permission(user_role, text, boolean);
drop function if exists report_platform_activity(date, date);
drop function if exists event_command_center(uuid);
drop function if exists notify_on_application_decision();
drop function if exists volunteer_access_activity(uuid);
drop function if exists volunteers_overview(text, uuid, text, int, int);
drop function if exists my_checkin_access();
drop function if exists decline_access_request(uuid, text);
drop function if exists request_checkin_access(uuid, text);
drop function if exists revoke_temporary_access(uuid, text);
drop function if exists grant_temporary_access(uuid, uuid, int, uuid);
drop function if exists log_expired_access();
drop function if exists can_checkin_event(uuid);
drop function if exists conversation_messages(uuid, int, timestamptz);
drop function if exists admin_conversations(text, uuid, text, text, boolean, int, int);
drop function if exists my_conversations();
drop function if exists mark_conversation_read(uuid);
drop function if exists on_message_created();
drop function if exists set_conversation_status(uuid, conversation_status);
drop function if exists send_message(uuid, text);
drop function if exists admin_start_partner_conversation(uuid, text, text, uuid);
drop function if exists start_partner_conversation(text, text, uuid);
drop function if exists partner_kind(uuid);
drop function if exists portal_announcements(int);
drop function if exists notify_on_announcement();
drop function if exists notify_on_application();
drop function if exists notify_on_requirement();
drop function if exists notify_on_task();
drop function if exists notify_on_event_artist();
drop function if exists notify_on_assignment();
drop function if exists mark_notifications_read(uuid[]);
drop function if exists notification_unread_count();
drop function if exists my_notifications(int, timestamptz, boolean);
drop function if exists review_requirement(uuid, boolean, text);
drop function if exists submit_requirement(uuid, text);
drop function if exists validate_event_requirement();

-- Policies
drop policy if exists "events: members read" on events;
drop policy if exists "announcements: members read relevant" on announcements;
drop function if exists can_read_member_announcement(text, uuid);
drop policy if exists "announcements: public read live" on announcements;
create policy "announcements: public read live" on announcements for select
  using (status = 'published' and audience <> 'staff' and publish_at <= now()
         and (expire_at is null or expire_at > now()));
drop policy if exists "conversations: creator or staff insert" on conversations;
create policy "conversations: creator or staff insert" on conversations for insert
  with check (created_by = auth.uid() or is_staff_or_admin());

drop function if exists event_member_kind(uuid, uuid);

-- Rows that only exist for 0018 features, then the older constraints
delete from announcements where audience in ('sponsor', 'vendor', 'venue', 'volunteer', 'crew', 'members');
alter table announcements drop constraint if exists announcements_audience_check;
alter table announcements add constraint announcements_audience_check
  check (audience in ('all', 'guest', 'patron', 'artist', 'staff'));

delete from conversations where conversation_type <> 'general';
alter table conversations drop constraint if exists conversations_conversation_type_check;
alter table conversations drop column if exists conversation_type, drop column if exists external_user_id;
alter table messages drop constraint if exists messages_content_length_check;

delete from event_assignments where assignee_role = 'sponsor';
alter table event_assignments drop constraint if exists event_assignments_assignee_role_check;
alter table event_assignments add constraint event_assignments_assignee_role_check
  check (assignee_role in ('crew', 'volunteer', 'vendor', 'staff'));
alter table event_assignments drop constraint if exists event_assignments_fee_amount_check;
alter table event_assignments drop constraint if exists event_assignments_fee_status_check;
alter table event_assignments drop constraint if exists event_assignments_window_check;
alter table event_assignments
  drop column if exists call_time, drop column if exists starts_at, drop column if exists ends_at,
  drop column if exists instructions, drop column if exists fee_amount, drop column if exists fee_status;

delete from role_permissions where permission in ('messages.manage', 'volunteers.manage', 'access.grant');
drop function if exists portal_path(user_role);

commit;
