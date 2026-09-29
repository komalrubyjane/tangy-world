-- Tangy Sessions — REVERSE of 0017_admin_system.sql. Not applied automatically;
-- run by hand only if you need to roll the admin system back.
--
-- Restores every function/policy 0017 replaced to its 0016 definition. It DROPS
-- the tables 0017 created (audit_logs, announcements, system_settings, venues,
-- role_permissions), so export anything you want to keep from those first.
-- Columns 0017 added to existing tables are dropped too; no pre-existing column
-- or row is touched. The two security fixes (payment RPC grants, pgcrypto
-- search_path) are intentionally NOT reverted.

begin;

-- Reports / dashboards / settings / check-in helpers
drop function if exists report_staff_activity(date, date);
drop function if exists report_applications(date, date);
drop function if exists report_revenue_by_month(date, date);
drop function if exists report_event_performance(date, date);
drop function if exists staff_dashboard();
drop function if exists admin_dashboard_summary();
drop function if exists update_system_setting(text, jsonb);
drop function if exists get_runtime_settings();
drop function if exists get_checkin_history(uuid, boolean, int, int);
drop function if exists event_checkin_stats(uuid);
drop function if exists my_checkin_events();
drop view if exists attendee_tickets;
drop view if exists applications_overview;
drop function if exists admin_create_comp_booking(uuid, text, text, text, int, text, text);
drop function if exists admin_cancel_ticket(uuid, text);
drop function if exists admin_record_refund(uuid, text, text);
drop function if exists admin_cancel_booking(uuid, text);
drop function if exists admin_set_user_active(uuid, boolean, text);
drop function if exists admin_set_user_role(uuid, user_role, text);
drop function if exists log_auth_event(text);
drop function if exists log_user_invited(uuid, text, user_role, boolean);

-- Triggers on pre-existing tables
drop trigger if exists events_audit on events;
drop trigger if exists events_set_updated_at on events;
drop trigger if exists events_prevent_delete_with_bookings on events;
drop trigger if exists event_assignments_audit on event_assignments;
drop trigger if exists event_assignments_validate on event_assignments;
drop trigger if exists event_artists_audit on event_artists;
drop trigger if exists bookings_system_audit on bookings;
drop function if exists prevent_event_delete_with_bookings();
drop function if exists validate_event_assignment();
drop function if exists audit_booking_system_change();

-- New tables
drop table if exists announcements;
drop table if exists system_settings;
alter table events drop column if exists venue_id;
drop table if exists venues;
drop function if exists audit_row_change();
drop function if exists audit_write(text, text, text, jsonb, uuid);
drop table if exists audit_logs;
drop function if exists audit_logs_block_mutation();

-- Check-in RPC -> 0016 version
drop function if exists check_in_ticket(text, uuid, text, text);
create function check_in_ticket(p_token text, p_event_id uuid)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_ticket tickets%rowtype;
  v_booking bookings%rowtype;
  v_checkin checkins%rowtype;
begin
  if not is_staff_or_admin() then
    raise exception 'Only staff/admin can check in tickets.';
  end if;
  select * into v_ticket from tickets where token = p_token for update;
  if v_ticket.id is null then
    return jsonb_build_object('result', 'not_found');
  end if;
  select * into v_booking from bookings where id = v_ticket.booking_id;
  if v_ticket.event_id <> p_event_id then
    return jsonb_build_object('result', 'wrong_event', 'ticket_number', v_ticket.ticket_number);
  end if;
  if v_ticket.status = 'cancelled' then
    return jsonb_build_object('result', 'cancelled', 'ticket_number', v_ticket.ticket_number);
  end if;
  if v_booking.status <> 'confirmed' then
    return jsonb_build_object('result', 'payment_not_confirmed', 'ticket_number', v_ticket.ticket_number);
  end if;
  select * into v_checkin from checkins where ticket_id = v_ticket.id;
  if v_checkin.id is not null then
    return jsonb_build_object('result', 'already_checked_in', 'ticket_number', v_ticket.ticket_number,
      'attendee_name', v_booking.attendee_name, 'tier', v_ticket.tier, 'checked_in_at', v_checkin.checked_in_at);
  end if;
  insert into checkins (booking_id, ticket_id, event_id, checked_in_by)
  values (v_ticket.booking_id, v_ticket.id, v_ticket.event_id, auth.uid())
  returning * into v_checkin;
  update tickets set status = 'checked_in' where id = v_ticket.id;
  return jsonb_build_object('result', 'valid', 'ticket_number', v_ticket.ticket_number,
    'attendee_name', v_booking.attendee_name, 'event_name', (select name from events where id = p_event_id),
    'tier', v_ticket.tier, 'checked_in_at', v_checkin.checked_in_at);
end;
$$;

-- Application RPCs -> 0015 versions
drop function if exists approve_collaboration(uuid, text);
drop function if exists reject_collaboration(uuid, text);
drop function if exists approve_crew_application(uuid, text);
drop function if exists reject_crew_application(uuid, text);
drop function if exists approve_artist_application(uuid, text);
drop function if exists reject_artist_application(uuid, text);

create function approve_collaboration(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_collab collaborations%rowtype;
begin
  if not is_admin() then raise exception 'Only an admin can approve applications.'; end if;
  select * into v_collab from collaborations where id = p_id;
  if v_collab.id is null then raise exception 'Application not found.'; end if;
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
    values ('collaborations', p_id, 'approval') on conflict (source_table, source_id, notification_type) do nothing;
  end if;
end; $$;

create function reject_collaboration(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Only an admin can reject collaborations.'; end if;
  update collaborations set status = 'rejected' where id = p_id;
end; $$;

create function approve_crew_application(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_app crew_applications%rowtype;
begin
  if not is_admin() then raise exception 'Only an admin can approve applications.'; end if;
  select * into v_app from crew_applications where id = p_id;
  if v_app.id is null then raise exception 'Application not found.'; end if;
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
    values ('crew_applications', p_id, 'approval') on conflict (source_table, source_id, notification_type) do nothing;
  end if;
end; $$;

create function reject_crew_application(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Only an admin can reject applications.'; end if;
  update crew_applications set status = 'rejected' where id = p_id;
end; $$;

create function approve_artist_application(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_artist artists%rowtype;
begin
  if not is_admin() then raise exception 'Only an admin can approve applications.'; end if;
  select * into v_artist from artists where id = p_id;
  if v_artist.id is null then raise exception 'Application not found.'; end if;
  update artists set status = 'approved', reviewed_at = now() where id = p_id;
  if v_artist.user_id is not null then
    insert into application_notifications (source_table, source_id, notification_type)
    values ('artists', p_id, 'approval') on conflict (source_table, source_id, notification_type) do nothing;
  end if;
end; $$;

create function reject_artist_application(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Only an admin can reject applications.'; end if;
  update artists set status = 'rejected', reviewed_at = now() where id = p_id;
end; $$;

-- Policies -> 0016 state
drop policy if exists "events: assigned staff read" on events;
drop policy if exists "bookings: admin read all" on bookings;
create policy "bookings: staff/admin full access" on bookings for all using (is_staff_or_admin());
drop policy if exists "tickets: admin read all" on tickets;
create policy "tickets: staff/admin full access" on tickets for all using (is_staff_or_admin());
drop policy if exists "checkins: admin read all" on checkins;
drop policy if exists "checkins: self read own" on checkins;
create policy "checkins: staff/admin only" on checkins for all using (is_staff_or_admin());
drop policy if exists "waitlist: admin read" on waitlist;
create policy "waitlist: staff/admin read" on waitlist for select using (is_staff_or_admin());

-- Role guard -> 0003 version
create or replace function prevent_role_self_escalation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not is_admin() then
    raise exception 'Only an admin can change a profile role.';
  end if;
  return new;
end; $$;

create or replace function is_staff_or_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(current_role_name() in ('staff', 'admin', 'super_admin'), false);
$$;

create or replace function current_role_name()
returns user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

drop function if exists can_view_event_attendees(uuid);
drop function if exists is_assigned_to_event(uuid);
drop function if exists my_permissions();
drop function if exists has_permission(text);
drop function if exists is_super_admin();
drop table if exists role_permissions;

-- Columns added by 0017
alter table event_assignments drop constraint if exists event_assignments_assignee_role_check;
delete from event_assignments where assignee_role = 'staff';
alter table event_assignments add constraint event_assignments_assignee_role_check
  check (assignee_role in ('crew', 'volunteer', 'vendor'));
alter table event_assignments alter column assigned_by drop default;

alter table checkins drop constraint if exists checkins_method_check;
alter table checkins drop column if exists method, drop column if exists notes;
alter table bookings drop constraint if exists bookings_source_check;
alter table bookings drop column if exists source, drop column if exists cancelled_at, drop column if exists cancelled_by,
  drop column if exists cancel_reason, drop column if exists refund_reference;
alter table events drop constraint if exists events_status_check;
alter table events drop column if exists end_time, drop column if exists created_by, drop column if exists updated_at;
alter table artists drop column if exists reviewed_by, drop column if exists review_notes, drop column if exists decision_reason;
alter table collaborations drop column if exists reviewed_by, drop column if exists reviewed_at, drop column if exists review_notes, drop column if exists decision_reason;
alter table crew_applications drop column if exists reviewed_by, drop column if exists reviewed_at, drop column if exists review_notes, drop column if exists decision_reason;
alter table profiles drop column if exists is_active, drop column if exists deactivated_at, drop column if exists deactivated_by;

commit;
