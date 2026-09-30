-- Rollback for 0027_waitlist.sql: restores 0026's checkout / availability / settlement,
-- 0020's scheduled jobs and the old open waitlist. Entries keep their name/email/phone;
-- offer state and account links are dropped.
begin;

drop trigger if exists bookings_release_to_waitlist on bookings;
drop trigger if exists events_capacity_to_waitlist on events;
drop function if exists waitlist_on_booking_release();
drop function if exists waitlist_on_capacity_change();
drop function if exists join_waitlist(uuid, integer);
drop function if exists leave_waitlist(uuid);
drop function if exists my_waitlist();
drop function if exists admin_offer_waitlist(uuid);
drop function if exists expire_waitlist_offers();
drop function if exists offer_waitlist_seats(uuid);

-- 0026 / 0020 definitions
create or replace function create_pending_booking(p_user_id uuid, p_event_id uuid, p_registration_code text, p_attendee_name text,
  p_attendee_email text, p_attendee_phone text, p_quantity integer, p_amount integer, p_tier text, p_razorpay_order_id text,
  p_attendee_names text[] default null, p_details jsonb default null)
returns bookings
language plpgsql security definer set search_path = public
as $$
declare
  v_event events%rowtype;
  v_taken int;
  v_type event_ticket_types%rowtype;
  v_type_taken int;
  v_booking bookings%rowtype;
  v_names text[];
  v_err text;
  v_details jsonb := coalesce(p_details, '{}'::jsonb);
  v_instagram text;
  v_note text;
  v_collab text[];
  v_collab_note text;
  v_amount int := p_amount;
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
  if p_details is not null then
    -- Customer checkout: the event's range, its ticket type, its price.
    if p_quantity < v_event.booking_min_quantity or p_quantity > v_event.booking_max_quantity then
      raise exception 'INVALID_QUANTITY: % to % tickets per booking', v_event.booking_min_quantity, v_event.booking_max_quantity;
    end if;
    select * into v_type from event_ticket_types where event_id = p_event_id and code = p_tier and active;
    if v_type.id is null then
      raise exception 'INVALID_TICKET_TYPE: This ticket type is not available.';
    end if;
    if v_type.capacity is not null then
      select coalesce(sum(quantity), 0) into v_type_taken from bookings
       where event_id = p_event_id and tier = v_type.code and status in ('pending', 'confirmed');
      if v_type_taken + p_quantity > v_type.capacity then
        raise exception 'SOLD_OUT: Not enough % tickets left.', v_type.name;
      end if;
    end if;
    v_amount := ((booking_quote(p_event_id, p_tier, p_quantity)) ->> 'total')::int;
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
    p_attendee_phone, p_quantity, v_amount, p_tier, 'pending', p_razorpay_order_id, v_names,
    coalesce(v_details -> 'answers', '{}'::jsonb), v_instagram, v_note, v_collab, v_collab_note
  )
  returning * into v_booking;
  return v_booking;
end;
$$;
revoke execute on function create_pending_booking(uuid, uuid, text, text, text, text, int, int, text, text, text[], jsonb) from public, anon, authenticated;
grant execute on function create_pending_booking(uuid, uuid, text, text, text, text, int, int, text, text, text[], jsonb) to service_role;

create or replace function event_availability(p_event_id uuid)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'capacity', e.capacity,
    'taken', coalesce(b.taken, 0),
    'remaining', greatest(e.capacity - coalesce(b.taken, 0), 0),
    'sold_out', e.status = 'sold-out' or coalesce(b.taken, 0) >= e.capacity,
    'ticket_types', coalesce((
      select jsonb_agg(jsonb_build_object('code', t.code, 'name', t.name, 'description', t.description, 'price', t.price,
               'currency', t.currency,
               'remaining', case when t.capacity is null then null
                                 else greatest(t.capacity - coalesce((select sum(quantity) from bookings x
                                   where x.event_id = e.id and x.tier = t.code and x.status in ('pending', 'confirmed')), 0), 0) end)
             order by t.sort_order, t.price)
      from event_ticket_types t where t.event_id = e.id and t.active), '[]'::jsonb)
  )
  from events e
  left join lateral (select sum(quantity) as taken from bookings where event_id = e.id and status in ('pending', 'confirmed')) b on true
  where e.id = p_event_id and e.status <> 'draft';
$$;
grant execute on function event_availability(uuid) to anon, authenticated;

create or replace function settle_payment(p_order_id text, p_payment_id text, p_amount_paise bigint default null, p_source text default 'webhook')
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_event_id uuid;
  v_event events%rowtype;
  v_booking bookings%rowtype;
  v_taken int;
  v_reason text;
  v_late boolean := false;
begin
  if p_source not in ('webhook', 'verify') or coalesce(p_order_id, '') = '' or coalesce(p_payment_id, '') = '' then
    raise exception 'Invalid settlement request.';
  end if;
  -- Same lock order as create_pending_booking(): event, then booking.
  select event_id into v_event_id from bookings where razorpay_order_id = p_order_id;
  if v_event_id is null then
    return jsonb_build_object('result', 'not_found');
  end if;
  select * into v_event from events where id = v_event_id for update;
  select * into v_booking from bookings where razorpay_order_id = p_order_id for update;

  if v_booking.status = 'confirmed' then
    return jsonb_build_object('result', 'already_confirmed', 'booking_id', v_booking.id);
  end if;

  if p_amount_paise is not null and p_amount_paise <> v_booking.amount::bigint * 100 then
    v_reason := format('Paid amount ₹%s does not match the booking total ₹%s.', p_amount_paise / 100.0, v_booking.amount);
  elsif v_booking.status in ('cancelled', 'refunded') then
    v_reason := 'Payment arrived for a booking that was already cancelled.';
  elsif v_booking.status in ('expired', 'failed') then
    v_late := true;
    select coalesce(sum(quantity), 0) into v_taken from bookings
     where event_id = v_booking.event_id and status in ('pending', 'confirmed') and id <> v_booking.id;
    if v_taken + v_booking.quantity > v_event.capacity then
      v_reason := format('Paid after the checkout hold expired and the seats are gone (%s/%s taken).', v_taken, v_event.capacity);
    end if;
  elsif v_booking.status <> 'pending' then
    v_reason := format('Unexpected booking state %s.', v_booking.status);
  end if;

  if v_reason is not null then
    update bookings set razorpay_payment_id = p_payment_id, razorpay_signature_verified = true,
                        payment_status = 'needs_review', payment_updated_at = now()
     where id = v_booking.id;
    insert into audit_logs (actor_id, actor_email, actor_role, action, resource_type, resource_id, event_id, metadata)
    values (null, null, 'system', 'payment.needs_review', 'booking', v_booking.id::text, v_booking.event_id,
            jsonb_build_object('registration_code', v_booking.registration_code, 'status', v_booking.status, 'reason', v_reason,
                               'payment_id', p_payment_id, 'source', p_source));
    perform notify_permission_holders('payments.view', 'payment.review',
      'Payment needs review: ' || v_booking.registration_code, v_reason || ' Refund it in Razorpay or reseat the guest.',
      '/admin-portal/bookings?q=' || v_booking.registration_code, v_booking.event_id);
    return jsonb_build_object('result', 'needs_review', 'booking_id', v_booking.id, 'reason', v_reason);
  end if;

  update bookings set status = 'confirmed', razorpay_payment_id = p_payment_id, razorpay_signature_verified = true,
                      payment_status = 'captured', payment_updated_at = now()
   where id = v_booking.id;
  perform confirm_booking_and_issue_tickets(v_booking.id);
  if v_late then
    insert into audit_logs (actor_id, actor_email, actor_role, action, resource_type, resource_id, event_id, metadata)
    values (null, null, 'system', 'payment.late_accepted', 'booking', v_booking.id::text, v_booking.event_id,
            jsonb_build_object('registration_code', v_booking.registration_code, 'previous_status', v_booking.status, 'source', p_source));
  end if;
  return jsonb_build_object('result', 'confirmed', 'booking_id', v_booking.id, 'late', v_late);
end;
$$;
revoke execute on function settle_payment(text, text, bigint, text) from public, anon, authenticated;
grant execute on function settle_payment(text, text, bigint, text) to service_role;

create or replace function run_platform_jobs()
returns jsonb
language plpgsql security definer set search_path = public
as $$
begin
  return jsonb_build_object(
    'bookings_expired', expire_stale_bookings(),
    'requests_expired', expire_booking_requests(),
    'reminders', send_event_reminders(),
    'overdue_tasks', notify_overdue_tasks(),
    'expiring_access', notify_expiring_access(),
    'access_expiry_logged', log_expired_access());
end;
$$;
revoke execute on function run_platform_jobs() from public, anon, authenticated;
grant execute on function run_platform_jobs() to service_role;

drop function if exists waitlist_held_seats(uuid, uuid);

alter table bookings drop column if exists waitlist_entry_id;
drop policy if exists "waitlist: self read own" on waitlist;
drop policy if exists "waitlist: bookings staff read" on waitlist;
drop policy if exists "waitlist: anyone can join" on waitlist;
create policy "waitlist: anyone can join" on waitlist for insert with check (true);
drop index if exists waitlist_one_active_per_user;
drop index if exists waitlist_queue_idx;
alter table waitlist drop constraint if exists waitlist_offer_check;
alter table waitlist drop constraint if exists waitlist_status_check;
alter table waitlist drop constraint if exists waitlist_quantity_check;
alter table waitlist drop column if exists queue_no, drop column if exists resolved_at, drop column if exists booking_id,
  drop column if exists offer_expires_at, drop column if exists offered_at, drop column if exists status,
  drop column if exists quantity, drop column if exists user_id, drop column if exists updated_at;
delete from system_settings where key = 'waitlist.offer_hold_minutes';

commit;
