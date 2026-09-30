-- REVERSE of 0026_ticket_types_and_settlement.sql — run by hand only, BEFORE
-- rollbacks/0025_enquiries_auth_first.down.sql.
--
-- Restores 0024's create_pending_booking (amount supplied by the caller) and
-- 0020's late-payment trigger, and drops ticket types, the quote,
-- availability and settle_payment(). Redeploy the pre-0026 Edge Functions
-- (razorpay-create-order computes the price itself; verify/webhook confirm
-- directly) together with this rollback.
--
-- DATA: event_ticket_types (per-type prices) are dropped; events.price keeps
-- the last "from" price. Bookings whose payment was held for review
-- (payment_status 'needs_review') go back to 'captured' with their booking
-- status unchanged — they still need a human decision.

begin;

drop trigger if exists bookings_touch_payment on bookings;
drop function if exists touch_payment_updated_at();
drop trigger if exists bookings_flag_late_payment on bookings;
create trigger bookings_flag_late_payment before update on bookings
  for each row execute function flag_late_payment();

drop function if exists settle_payment(text, text, bigint, text);
update bookings set payment_status = 'captured' where payment_status = 'needs_review';
alter table bookings drop constraint if exists bookings_payment_status_check;
alter table bookings add constraint bookings_payment_status_check
  check (payment_status = any (array['created', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded', 'not_required']));

create or replace function create_pending_booking(p_user_id uuid, p_event_id uuid, p_registration_code text, p_attendee_name text,
  p_attendee_email text, p_attendee_phone text, p_quantity integer, p_amount integer, p_tier text, p_razorpay_order_id text,
  p_attendee_names text[] default null, p_details jsonb default null)
returns bookings
language plpgsql security definer set search_path = public
as $$
declare
  v_event events%rowtype;
  v_taken int;
  v_booking bookings%rowtype;
  v_names text[];
  v_err text;
  v_details jsonb := coalesce(p_details, '{}'::jsonb);
  v_instagram text;
  v_note text;
  v_collab text[];
  v_collab_note text;
begin
  if p_attendee_names is not null then
    if not valid_attendee_names(p_attendee_names, p_quantity) then
      raise exception 'INVALID_ATTENDEE_NAMES';
    end if;
    select array_agg(btrim(n) order by i) into v_names from unnest(p_attendee_names) with ordinality u(n, i);
  end if;
  perform expire_stale_bookings();
  select * into v_event from events where id = p_event_id for update;
  if v_event.id is null then
    raise exception 'EVENT_NOT_FOUND';
  end if;
  -- The event's own range applies to customer checkouts (details present);
  -- admin/complimentary paths keep their own limits.
  if p_details is not null and (p_quantity < v_event.booking_min_quantity or p_quantity > v_event.booking_max_quantity) then
    raise exception 'INVALID_QUANTITY: % to % tickets per booking', v_event.booking_min_quantity, v_event.booking_max_quantity;
  end if;
  if p_details is not null then
    if jsonb_typeof(v_details) <> 'object' then
      raise exception 'INVALID_DETAILS: Booking details are malformed.';
    end if;
    v_err := booking_answers_error(v_event.booking_questions, v_details -> 'answers', p_quantity);
    if v_err is not null then
      raise exception 'INVALID_DETAILS: %', v_err;
    end if;
    v_instagram := nullif(ltrim(btrim(coalesce(v_details ->> 'instagram', '')), '@'), '');
    if v_instagram is not null and v_instagram !~ '^[A-Za-z0-9._]{1,30}$' then
      raise exception 'INVALID_DETAILS: Check your Instagram handle.';
    end if;
    v_note := nullif(btrim(coalesce(v_details ->> 'note', '')), '');
    v_collab_note := nullif(btrim(coalesce(v_details ->> 'collab_note', '')), '');
    if length(v_note) > 1000 or length(v_collab_note) > 1000 then
      raise exception 'INVALID_DETAILS: Messages can be up to 1000 characters.';
    end if;
    if v_details ? 'collab_interests' then
      if jsonb_typeof(v_details -> 'collab_interests') <> 'array' then
        raise exception 'INVALID_DETAILS: Collaboration interests are malformed.';
      end if;
      select nullif(array_agg(distinct x), '{}') into v_collab from jsonb_array_elements_text(v_details -> 'collab_interests') x;
      if v_collab is not null and not v_collab <@ array['artist', 'sponsor', 'volunteer', 'event_team', 'sound_technical', 'video_photo', 'editing', 'graphic_design', 'other']::text[] then
        raise exception 'INVALID_DETAILS: Unknown collaboration interest.';
      end if;
    end if;
  end if;
  select coalesce(sum(quantity), 0) into v_taken
  from bookings
  where event_id = p_event_id and status in ('pending', 'confirmed');
  if v_taken + p_quantity > v_event.capacity then
    raise exception 'SOLD_OUT';
  end if;
  insert into bookings (
    registration_code, user_id, event_id, attendee_name, attendee_email,
    attendee_phone, quantity, amount, tier, status, razorpay_order_id, attendee_names,
    booking_answers, contact_instagram, customer_note, collab_interests, collab_note
  ) values (
    p_registration_code, p_user_id, p_event_id, p_attendee_name, p_attendee_email,
    p_attendee_phone, p_quantity, p_amount, p_tier, 'pending', p_razorpay_order_id, v_names,
    coalesce(v_details -> 'answers', '{}'::jsonb), v_instagram, v_note, v_collab, v_collab_note
  )
  returning * into v_booking;
  return v_booking;
end;
$$;
revoke execute on function create_pending_booking(uuid, uuid, text, text, text, text, int, int, text, text, text[], jsonb) from public, anon, authenticated;
grant execute on function create_pending_booking(uuid, uuid, text, text, text, text, int, int, text, text, text[], jsonb) to service_role;

drop function if exists event_availability(uuid);
drop function if exists booking_quote(uuid, text, integer);
drop trigger if exists events_seed_ticket_type on events;
drop function if exists seed_event_ticket_type();
drop table if exists event_ticket_types cascade;
drop function if exists sync_event_from_price();
drop function if exists touch_ticket_type();
delete from system_settings where key = 'bookings.tax_percent';

commit;
