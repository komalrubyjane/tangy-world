-- REVERSE of 0024_event_booking_form.sql — run by hand only, BEFORE
-- rollbacks/0023_named_group_checkin.down.sql.
--
-- Restores 0023's create_pending_booking (no booking details) and
-- attendee_tickets, and drops the event booking-form configuration and the
-- per-booking details. DATA: booking answers, Instagram handles, notes and
-- collaboration interests are DROPPED — export them first if they must be
-- kept. Bookings, attendees, tickets and check-ins are untouched.

begin;

drop function if exists create_pending_booking(uuid, uuid, text, text, text, text, int, int, text, text, text[], jsonb);
create or replace function create_pending_booking(p_user_id uuid, p_event_id uuid, p_registration_code text, p_attendee_name text,
  p_attendee_email text, p_attendee_phone text, p_quantity integer, p_amount integer, p_tier text, p_razorpay_order_id text,
  p_attendee_names text[] default null)
returns bookings
language plpgsql security definer set search_path = public
as $$
declare
  v_capacity int;
  v_taken int;
  v_booking bookings%rowtype;
  v_names text[];
begin
  if p_attendee_names is not null then
    if not valid_attendee_names(p_attendee_names, p_quantity) then
      raise exception 'INVALID_ATTENDEE_NAMES';
    end if;
    select array_agg(btrim(n) order by i) into v_names from unnest(p_attendee_names) with ordinality u(n, i);
  end if;
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
    attendee_phone, quantity, amount, tier, status, razorpay_order_id, attendee_names
  ) values (
    p_registration_code, p_user_id, p_event_id, p_attendee_name, p_attendee_email,
    p_attendee_phone, p_quantity, p_amount, p_tier, 'pending', p_razorpay_order_id, v_names
  )
  returning * into v_booking;
  return v_booking;
end;
$$;
revoke execute on function create_pending_booking(uuid, uuid, text, text, text, text, int, int, text, text, text[]) from public, anon, authenticated;
grant execute on function create_pending_booking(uuid, uuid, text, text, text, text, int, int, text, text, text[]) to service_role;

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
  case when can_checkin_event(t.event_id) and t.status = 'valid' then t.token end as token,
  t.attendee_name as guest_name,
  case when can_checkin_event(t.event_id) and b.status = 'confirmed' and party.remaining > 0 then b.group_token end as group_token,
  party.party_size,
  party.checked_in as party_checked_in,
  party.remaining as party_remaining
from tickets t
join bookings b on b.id = t.booking_id
join events e on e.id = t.event_id
left join checkins c on c.ticket_id = t.id
cross join lateral (
  select count(*) filter (where x.status <> 'cancelled')::int as party_size,
         count(*) filter (where x.status = 'checked_in')::int as checked_in,
         count(*) filter (where x.status = 'valid')::int as remaining
  from tickets x where x.booking_id = t.booking_id
) party
where can_view_event_attendees(t.event_id);

revoke all on attendee_tickets from anon;
grant select on attendee_tickets to authenticated;

alter table bookings drop constraint if exists bookings_collab_note_check;
alter table bookings drop column if exists collab_note;
alter table bookings drop constraint if exists bookings_collab_interests_check;
alter table bookings drop column if exists collab_interests;
alter table bookings drop constraint if exists bookings_customer_note_check;
alter table bookings drop column if exists customer_note;
alter table bookings drop constraint if exists bookings_contact_instagram_check;
alter table bookings drop column if exists contact_instagram;
alter table bookings drop constraint if exists bookings_booking_answers_check;
alter table bookings drop column if exists booking_answers;
drop function if exists booking_answers_error(jsonb, jsonb, int);

alter table events drop constraint if exists events_booking_questions_check;
alter table events drop column if exists booking_questions;
alter table events drop constraint if exists events_booking_quantity_check;
alter table events drop column if exists booking_max_quantity;
alter table events drop column if exists booking_min_quantity;
drop function if exists valid_booking_questions(jsonb);

commit;
