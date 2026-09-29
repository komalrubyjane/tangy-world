-- REVERSE of 0023_named_group_checkin.sql — run by hand only, BEFORE
-- rollbacks/0022_artist_storage_policies.down.sql.
--
-- Restores 0020's create_pending_booking, 0016/0017's
-- confirm_booking_and_issue_tickets, 0018's check_in_ticket, attendee_tickets
-- and get_checkin_history, and drops everything 0023 added.
--
-- DATA: attendee names (bookings.attendee_names, tickets.attendee_name) are
-- DROPPED — export them first if they must be kept. Attendance is NOT touched:
-- every checkins row written by a group check-in is an ordinary per-ticket row
-- and stays, with its ticket still 'checked_in' (only batch_id grouping goes;
-- the per-arrival audit_logs rows remain). Group QR codes stop working;
-- per-ticket QRs keep working.

begin;

drop function if exists booking_checkin_history(uuid);

-- check_in_ticket as in 0018
drop function if exists check_in_ticket(text, uuid, text, text, uuid[], boolean);
drop function if exists booking_attendees_state(uuid);
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
  if not (has_permission('checkin.perform') or has_active_access(p_event_id, 'checkin')) then
    -- A grant that existed for this event but has ended gets a clear answer.
    if exists (select 1 from temporary_access where user_id = auth.uid() and event_id = p_event_id) then
      perform log_expired_access();
      return jsonb_build_object('result', 'access_expired');
    end if;
    raise exception 'You do not have permission to check in tickets.';
  end if;
  if p_method not in ('qr', 'manual') then
    raise exception 'Invalid check-in method.';
  end if;
  if not can_checkin_event(p_event_id) then
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
    jsonb_build_object('ticket_number', v_ticket.ticket_number, 'registration_code', v_booking.registration_code,
                       'notes', nullif(trim(p_notes), ''),
                       'via', case when has_permission('checkin.perform') then 'role' else 'temporary_access' end),
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

-- attendee_tickets as in 0018
drop view if exists attendee_tickets;
create view attendee_tickets as
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
  case when can_checkin_event(t.event_id) and t.status = 'valid' then t.token end as token
from tickets t
join bookings b on b.id = t.booking_id
join events e on e.id = t.event_id
left join checkins c on c.ticket_id = t.id
where can_view_event_attendees(t.event_id);
revoke all on attendee_tickets from anon;
grant select on attendee_tickets to authenticated;

-- get_checkin_history as in 0018
drop function if exists get_checkin_history(uuid, boolean, integer, integer);
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
  where ((has_permission('checkin.history') and can_view_event_attendees(c.event_id))
         -- volunteers see only their own scans, and only while their grant is live
         or (has_active_access(c.event_id, 'checkin') and c.checked_in_by = auth.uid()))
    and (p_event_id is null or c.event_id = p_event_id)
    and (not p_mine or c.checked_in_by = auth.uid())
  order by c.checked_in_at desc
  limit least(greatest(p_limit, 1), 200) offset greatest(p_offset, 0);
$$;

-- confirm_booking_and_issue_tickets as in 0016 (search_path per 0017)
create or replace function confirm_booking_and_issue_tickets(p_booking_id uuid)
returns setof tickets
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  v_booking bookings%rowtype;
  i int;
begin
  select * into v_booking from bookings where id = p_booking_id for update;
  if v_booking.id is null then
    raise exception 'BOOKING_NOT_FOUND';
  end if;

  if v_booking.status <> 'confirmed' then
    update bookings set status = 'confirmed' where id = p_booking_id;
  end if;

  if not exists (select 1 from tickets where booking_id = p_booking_id) then
    for i in 1..v_booking.quantity loop
      insert into tickets (booking_id, event_id, user_id, ticket_number, token, tier, status)
      values (
        p_booking_id,
        v_booking.event_id,
        v_booking.user_id,
        v_booking.registration_code || '-' || lpad(i::text, 2, '0'),
        encode(gen_random_bytes(20), 'hex'),
        v_booking.tier,
        'valid'
      );
    end loop;
  end if;

  return query select * from tickets where booking_id = p_booking_id order by ticket_number;
end;
$$;
revoke execute on function confirm_booking_and_issue_tickets(uuid) from public, anon, authenticated;
grant execute on function confirm_booking_and_issue_tickets(uuid) to service_role;

-- create_pending_booking as in 0020
drop function if exists create_pending_booking(uuid, uuid, text, text, text, text, int, int, text, text, text[]);
create or replace function create_pending_booking(p_user_id uuid, p_event_id uuid, p_registration_code text, p_attendee_name text,
  p_attendee_email text, p_attendee_phone text, p_quantity integer, p_amount integer, p_tier text, p_razorpay_order_id text)
returns bookings
language plpgsql security definer set search_path = public
as $$
declare
  v_capacity int;
  v_taken int;
  v_booking bookings%rowtype;
begin
  perform expire_stale_bookings();
  select capacity into v_capacity from events where id = p_event_id for update;
  if v_capacity is null then
    raise exception 'EVENT_NOT_FOUND';
  end if;
  select coalesce(sum(quantity), 0) into v_taken
  from bookings
  where event_id = p_event_id and status in ('pending', 'confirmed');
  if v_taken + p_quantity > v_capacity then
    raise exception 'SOLD_OUT';
  end if;
  insert into bookings (
    registration_code, user_id, event_id, attendee_name, attendee_email,
    attendee_phone, quantity, amount, tier, status, razorpay_order_id
  ) values (
    p_registration_code, p_user_id, p_event_id, p_attendee_name, p_attendee_email,
    p_attendee_phone, p_quantity, p_amount, p_tier, 'pending', p_razorpay_order_id
  )
  returning * into v_booking;
  return v_booking;
end;
$$;
revoke execute on function create_pending_booking(uuid, uuid, text, text, text, text, int, int, text, text) from public, anon, authenticated;
grant execute on function create_pending_booking(uuid, uuid, text, text, text, text, int, int, text, text) to service_role;

drop index if exists checkins_batch_id_idx;
alter table checkins drop column if exists batch_id;
drop index if exists bookings_group_token_key;
alter table bookings drop column if exists group_token;
alter table tickets drop constraint if exists tickets_attendee_name_check;
alter table tickets drop column if exists attendee_name;
alter table bookings drop constraint if exists bookings_attendee_names_check;
alter table bookings drop column if exists attendee_names;
drop function if exists valid_attendee_names(text[], int);

commit;
