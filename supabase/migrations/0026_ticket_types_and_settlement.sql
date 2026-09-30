-- Tangy Sessions — per-event ticket types (server-authoritative pricing) and
-- safe payment settlement.
--
-- PRICING. Ticket prices were hard-coded twice — base + ₹500 (VIP) and
-- base + ₹1,200 (Backstage) in BookingPage.jsx and in razorpay-create-order.
--  1. event_ticket_types: per event, per type (code, name, description,
--     price in rupees, optional per-type capacity, sort order, active).
--     Backfilled for every existing event with exactly today's prices, so
--     nothing changes for customers until an admin edits them. New events get
--     a single "General Admission" type at events.price.
--  2. events.price follows the lowest active ticket price (it is the "from"
--     price shown in listings).
--  3. booking_quote(event, type, quantity): subtotal, GST and total computed
--     here (bookings.tax_percent setting, default 18). The storefront shows
--     it; create_pending_booking() charges it — for customer checkouts the
--     client never supplies an amount.
--  4. event_availability(event): public seat counts (no personal data) for
--     session pages: capacity, taken, remaining, per-type remaining.
--
-- SETTLEMENT. razorpay-verify-payment and razorpay-webhook used to set
-- status = 'confirmed' on ANY booking with a captured payment: an expired
-- checkout (seats already released, possibly resold) became an extra,
-- over-capacity booking, and a booking an admin had cancelled was silently
-- re-confirmed.
--  5. settle_payment(order, payment, amount?, source) is now the only way a
--     paid booking is confirmed. It locks the event, then the booking, and:
--       pending                       -> confirmed (+ tickets)
--       confirmed                     -> no-op (idempotent)
--       expired / failed, seats free  -> confirmed (+ tickets), audited as a late payment
--       expired / failed, no seats    -> NOT confirmed; payment_status 'needs_review',
--                                        payments staff alerted to refund or reseat
--       cancelled / refunded          -> NOT confirmed; 'needs_review'
--       amount differs from quote     -> NOT confirmed; 'needs_review'
--     No automatic refunds: Razorpay's refund API is not called from here.
--
-- Rollback: rollbacks/0026_ticket_types_and_settlement.down.sql

begin;

insert into system_settings (key, value, value_type, category, label, description, exposed) values
  ('bookings.tax_percent', '18', 'integer', 'Bookings', 'GST on tickets (%)', 'Tax added to ticket subtotals at checkout.', true)
on conflict (key) do nothing;

-- 1. Ticket types ----------------------------------------------------------------------
create table if not exists event_ticket_types (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  code text not null check (code ~ '^[a-z][a-z0-9_]{0,31}$'),
  name text not null check (length(btrim(name)) between 1 and 80),
  description text check (description is null or length(description) <= 500),
  price integer not null check (price >= 0 and price <= 1000000),
  currency text not null default 'INR' check (currency = 'INR'),
  capacity integer check (capacity is null or capacity > 0),
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, code)
);
create index if not exists event_ticket_types_event_idx on event_ticket_types (event_id, sort_order);
alter table event_ticket_types enable row level security;
drop policy if exists "event_ticket_types: public read active" on event_ticket_types;
create policy "event_ticket_types: public read active" on event_ticket_types for select
  using (active and exists (select 1 from events e where e.id = event_id and e.status <> 'draft'));
drop policy if exists "event_ticket_types: managers" on event_ticket_types;
create policy "event_ticket_types: managers" on event_ticket_types for all
  using (has_permission('events.manage')) with check (has_permission('events.manage'));

-- Today's storefront prices, as data (deterministic backfill; see header).
insert into event_ticket_types (event_id, code, name, description, price, sort_order)
select e.id, t.code, t.name, t.description, e.price + t.markup, t.sort_order
from events e
cross join (values
  ('gen', 'General Admission', 'Entry to the session and main performance.', 0, 1),
  ('vip', 'VIP Heritage Pass', 'Reserved front-tier seating, complimentary filter coffee & vintage poster print.', 500, 2),
  ('premium', 'Backstage Collective Pass', 'Access to the post-midnight artist jam session, vinyl record & signed ticket stub.', 1200, 3)
) t(code, name, description, markup, sort_order)
on conflict (event_id, code) do nothing;

-- New events start with one General Admission type at their listed price.
create or replace function seed_event_ticket_type()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into event_ticket_types (event_id, code, name, price, sort_order)
  values (new.id, 'gen', 'General Admission', coalesce(new.price, 0), 1)
  on conflict (event_id, code) do nothing;
  return new;
end;
$$;
drop trigger if exists events_seed_ticket_type on events;
create trigger events_seed_ticket_type after insert on events for each row execute function seed_event_ticket_type();

-- 2. events.price = lowest active ticket price ("from ₹…").
create or replace function sync_event_from_price()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_event uuid := coalesce(new.event_id, old.event_id);
  v_min int;
begin
  select min(price) into v_min from event_ticket_types where event_id = v_event and active;
  if v_min is not null then
    update events set price = v_min where id = v_event and price is distinct from v_min;
  end if;
  return null;
end;
$$;
drop trigger if exists event_ticket_types_sync_price on event_ticket_types;
create trigger event_ticket_types_sync_price after insert or update or delete on event_ticket_types
  for each row execute function sync_event_from_price();

create or replace function touch_ticket_type()
returns trigger language plpgsql as $$ begin new.updated_at := now(); return new; end; $$;
drop trigger if exists event_ticket_types_touch on event_ticket_types;
create trigger event_ticket_types_touch before update on event_ticket_types for each row execute function touch_ticket_type();

-- 3. The authoritative quote ---------------------------------------------------------
create or replace function booking_quote(p_event_id uuid, p_ticket_type text, p_quantity integer)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  t event_ticket_types%rowtype;
  v_sub bigint;
  v_tax bigint;
begin
  if p_quantity is null or p_quantity < 1 or p_quantity > 50 then
    raise exception 'INVALID_QUANTITY: Choose a valid number of tickets.';
  end if;
  select tt.* into t from event_ticket_types tt join events e on e.id = tt.event_id
   where tt.event_id = p_event_id and tt.code = p_ticket_type and tt.active and e.status <> 'draft';
  if t.id is null then
    raise exception 'INVALID_TICKET_TYPE: This ticket type is not available.';
  end if;
  v_sub := t.price::bigint * p_quantity;
  v_tax := round(v_sub * setting_number('bookings.tax_percent', 18) / 100.0);
  return jsonb_build_object('ticket_type', t.code, 'name', t.name, 'unit_price', t.price, 'quantity', p_quantity,
    'subtotal', v_sub, 'tax', v_tax, 'total', v_sub + v_tax, 'currency', t.currency,
    'tax_percent', setting_number('bookings.tax_percent', 18));
end;
$$;
grant execute on function booking_quote(uuid, text, integer) to anon, authenticated;

-- 4. Public availability (counts only) -----------------------------------------------
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

-- Checkout: price from ticket types (customer path) ------------------------------------
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

-- 5. Settlement -------------------------------------------------------------------------
alter table bookings drop constraint if exists bookings_payment_status_check;
alter table bookings add constraint bookings_payment_status_check
  check (payment_status = any (array['created', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded', 'not_required', 'needs_review']));

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

-- flag_late_payment() alerted after an expired booking was confirmed; that path
-- now goes through settle_payment(), which decides and audits explicitly.
drop trigger if exists bookings_flag_late_payment on bookings;
create or replace function touch_payment_updated_at()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status or new.razorpay_payment_id is distinct from old.razorpay_payment_id then
    new.payment_updated_at := now();
  end if;
  return new;
end;
$$;
drop trigger if exists bookings_touch_payment on bookings;
create trigger bookings_touch_payment before update on bookings for each row execute function touch_payment_updated_at();

commit;
