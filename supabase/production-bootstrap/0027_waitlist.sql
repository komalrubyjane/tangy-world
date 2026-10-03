-- Tangy Sessions — server-authoritative waitlist with seat offers.
--
-- The old waitlist was a name/email list anyone could insert into, with no
-- order, offers or holds. The table is extended (existing rows keep their
-- data; anonymous legacy rows have no account, so they are listed for the
-- team but never auto-offered).
--
--   join (signed in, session sold out)  -> waiting, ordered by joined_at
--   seats free up                        -> the next waiting party that fits
--     (booking cancelled / expired / failed / refunded, capacity raised, an
--      offer expiring or declined)          is OFFERED: its seats are HELD
--                                           until offer_expires_at
--                                           (waitlist.offer_hold_minutes)
--   the holder starts checkout           -> converted (the pending booking
--                                           now holds the seats; booking_id)
--   the offer lapses                     -> expired, seats offered onwards
--   leave                                -> cancelled
--
-- Order is strict first-come-first-served: a party that doesn't fit yet is
-- not skipped by a smaller party behind it.
--
-- Seats held by live offers count against capacity everywhere
-- (create_pending_booking, event_availability, settle_payment), so a
-- released seat can only be claimed by the person it was offered to. Every
-- offer decision runs under the event's row lock (the same lock checkout
-- takes), so two people can never be given the same seat.
--
-- Rollback: rollbacks/0027_waitlist.down.sql

begin;

insert into system_settings (key, value, value_type, category, label, description, exposed) values
  ('waitlist.offer_hold_minutes', '120', 'integer', 'Bookings', 'Waitlist offer hold (minutes)',
   'How long a released seat is held for the next person on the waitlist before it passes to the next.', true)
on conflict (key) do nothing;

-- Table ---------------------------------------------------------------------------------
alter table waitlist add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table waitlist add column if not exists quantity integer not null default 1;
alter table waitlist add column if not exists status text not null default 'waiting';
alter table waitlist add column if not exists offered_at timestamptz;
alter table waitlist add column if not exists offer_expires_at timestamptz;
alter table waitlist add column if not exists booking_id uuid references bookings(id) on delete set null;
alter table waitlist add column if not exists resolved_at timestamptz;
alter table waitlist add column if not exists updated_at timestamptz not null default now();
-- Strict arrival order (created_at can tie within a transaction).
alter table waitlist add column if not exists queue_no bigserial;
alter table waitlist drop constraint if exists waitlist_quantity_check;
alter table waitlist add constraint waitlist_quantity_check check (quantity between 1 and 50);
alter table waitlist drop constraint if exists waitlist_status_check;
alter table waitlist add constraint waitlist_status_check check (status in ('waiting', 'offered', 'converted', 'expired', 'cancelled', 'skipped'));
alter table waitlist drop constraint if exists waitlist_offer_check;
alter table waitlist add constraint waitlist_offer_check check (status <> 'offered' or (offered_at is not null and offer_expires_at is not null));
-- One live entry per person per session.
create unique index if not exists waitlist_one_active_per_user on waitlist (event_id, user_id) where status in ('waiting', 'offered') and user_id is not null;
create index if not exists waitlist_queue_idx on waitlist (event_id, status, queue_no);

alter table bookings add column if not exists waitlist_entry_id uuid references waitlist(id) on delete set null;

-- Only the RPCs below write the waitlist.
drop policy if exists "waitlist: anyone can join" on waitlist;
drop policy if exists "waitlist: self read own" on waitlist;
create policy "waitlist: self read own" on waitlist for select to authenticated using (user_id = auth.uid());
drop policy if exists "waitlist: bookings staff read" on waitlist;
create policy "waitlist: bookings staff read" on waitlist for select using (has_permission('bookings.view_all'));

-- Capacity helpers ------------------------------------------------------------------------
-- Seats held by live offers, optionally excluding one person's own offer.
create or replace function waitlist_held_seats(p_event_id uuid, p_except_user uuid default null)
returns integer
language sql stable security definer set search_path = public
as $$
  select coalesce(sum(quantity), 0)::int from waitlist
  where event_id = p_event_id and status = 'offered' and offer_expires_at > now()
    and (p_except_user is null or user_id is distinct from p_except_user);
$$;
revoke execute on function waitlist_held_seats(uuid, uuid) from public, anon, authenticated;

-- Offer engine: call with the event row locked (it locks it itself too).
create or replace function offer_waitlist_seats(p_event_id uuid)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_event events%rowtype;
  v_free int;
  v_hold int := setting_number('waitlist.offer_hold_minutes', 120)::int;
  r record;
  v_offered int := 0;
begin
  select * into v_event from events where id = p_event_id for update;
  if v_event.id is null or v_event.status in ('draft', 'cancelled', 'past') or v_event.event_date < current_date then
    return 0;
  end if;
  -- Lapsed offers first, so their seats flow onwards in this same pass.
  update waitlist set status = 'expired', resolved_at = now(), updated_at = now()
   where event_id = p_event_id and status = 'offered' and offer_expires_at <= now();
  select v_event.capacity
         - coalesce((select sum(quantity) from bookings where event_id = p_event_id and status in ('pending', 'confirmed')), 0)
         - waitlist_held_seats(p_event_id)
    into v_free;
  for r in select * from waitlist
           where event_id = p_event_id and status = 'waiting' and user_id is not null
           order by queue_no for update loop
    exit when v_free <= 0 or r.quantity > v_free;   -- strict FIFO: never skip the head of the queue
    update waitlist set status = 'offered', offered_at = now(), offer_expires_at = now() + make_interval(mins => v_hold), updated_at = now()
     where id = r.id;
    v_free := v_free - r.quantity;
    v_offered := v_offered + 1;
    perform notify(r.user_id, 'waitlist.offer', 'A seat opened up: ' || v_event.name,
      format('We''re holding %s seat%s for you until %s. Book now to keep them.', r.quantity, case when r.quantity = 1 then '' else 's' end,
             to_char(now() at time zone coalesce(v_event.timezone, 'Asia/Kolkata') + make_interval(mins => v_hold), 'HH12:MI AM, DD Mon')),
      '/sessions/' || v_event.slug, p_event_id);
    insert into audit_logs (actor_id, actor_email, actor_role, action, resource_type, resource_id, event_id, metadata)
    values (null, null, 'system', 'waitlist.offered', 'waitlist', r.id::text, p_event_id,
            jsonb_build_object('quantity', r.quantity, 'hold_minutes', v_hold));
  end loop;
  return v_offered;
end;
$$;
revoke execute on function offer_waitlist_seats(uuid) from public, anon, authenticated;

-- Seats freed by a booking leaving capacity, or by a capacity increase.
create or replace function waitlist_on_booking_release()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if old.status in ('pending', 'confirmed') and new.status not in ('pending', 'confirmed') then
    perform offer_waitlist_seats(new.event_id);
  end if;
  return new;
end;
$$;
drop trigger if exists bookings_release_to_waitlist on bookings;
create trigger bookings_release_to_waitlist after update of status on bookings
  for each row execute function waitlist_on_booking_release();

create or replace function waitlist_on_capacity_change()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.capacity > old.capacity then
    perform offer_waitlist_seats(new.id);
  end if;
  return new;
end;
$$;
drop trigger if exists events_capacity_to_waitlist on events;
create trigger events_capacity_to_waitlist after update of capacity on events
  for each row execute function waitlist_on_capacity_change();

-- Lapsed offers (run by run_platform_jobs every 5 minutes; safe to call anytime).
create or replace function expire_waitlist_offers()
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  r record;
  v_n int := 0;
begin
  for r in select w.id, w.user_id, w.event_id, e.name, e.slug from waitlist w join events e on e.id = w.event_id
           where w.status = 'offered' and w.offer_expires_at <= now() for update of w skip locked loop
    update waitlist set status = 'expired', resolved_at = now(), updated_at = now() where id = r.id;
    perform notify(r.user_id, 'waitlist.offer_expired', 'Your held seat was released: ' || r.name,
      'The hold ran out, so the seat went to the next person on the waitlist. You can join the waitlist again.', '/sessions/' || r.slug, r.event_id);
    v_n := v_n + 1;
  end loop;
  for r in select distinct event_id from waitlist where status = 'waiting' and user_id is not null loop
    perform offer_waitlist_seats(r.event_id);
  end loop;
  return v_n;
end;
$$;
revoke execute on function expire_waitlist_offers() from public, anon, authenticated;

-- Member RPCs ------------------------------------------------------------------------------
create or replace function join_waitlist(p_event_id uuid, p_quantity integer default 1)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_me profiles%rowtype;
  v_event events%rowtype;
  v_free int;
  v_id uuid;
  v_pos int;
begin
  select * into v_me from profiles where id = auth.uid() and is_active;
  if v_me.id is null then
    raise exception 'Sign in to join the waitlist.';
  end if;
  select * into v_event from events where id = p_event_id for update;
  if v_event.id is null or v_event.status in ('draft', 'cancelled', 'past') or v_event.event_date < current_date then
    raise exception 'WAITLIST_CLOSED: This session isn''t taking waitlist entries.';
  end if;
  if p_quantity is null or p_quantity < v_event.booking_min_quantity or p_quantity > v_event.booking_max_quantity then
    raise exception 'INVALID_QUANTITY: % to % people per booking', v_event.booking_min_quantity, v_event.booking_max_quantity;
  end if;
  if exists (select 1 from waitlist where event_id = p_event_id and user_id = v_me.id and status in ('waiting', 'offered')) then
    raise exception 'ALREADY_WAITLISTED: You''re already on the waitlist for this session.';
  end if;
  v_free := v_event.capacity
            - coalesce((select sum(quantity) from bookings where event_id = p_event_id and status in ('pending', 'confirmed')), 0)
            - waitlist_held_seats(p_event_id);
  if v_event.status <> 'sold-out' and v_free >= p_quantity
     and not exists (select 1 from waitlist where event_id = p_event_id and status = 'waiting' and user_id is not null) then
    raise exception 'SEATS_AVAILABLE: Seats are available — book them directly.';
  end if;
  insert into waitlist (event_id, user_id, name, email, phone, quantity, status)
  values (p_event_id, v_me.id, coalesce(v_me.full_name, v_me.email), v_me.email, v_me.phone, p_quantity, 'waiting')
  returning id into v_id;
  select count(*) into v_pos from waitlist w, waitlist me
   where me.id = v_id and w.event_id = me.event_id and w.status = 'waiting' and w.user_id is not null and w.queue_no <= me.queue_no;
  perform notify(v_me.id, 'waitlist.joined', 'You''re on the waitlist: ' || v_event.name,
    format('Position %s. If seats open up we''ll hold them for you and let you know.', v_pos), '/sessions/' || v_event.slug, p_event_id);
  return jsonb_build_object('id', v_id, 'position', v_pos, 'status', 'waiting');
end;
$$;

create or replace function leave_waitlist(p_event_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_row waitlist%rowtype;
begin
  select * into v_row from waitlist where event_id = p_event_id and user_id = auth.uid() and status in ('waiting', 'offered') for update;
  if v_row.id is null then
    raise exception 'You''re not on the waitlist for this session.';
  end if;
  update waitlist set status = 'cancelled', resolved_at = now(), updated_at = now() where id = v_row.id;
  if v_row.status = 'offered' then
    perform offer_waitlist_seats(p_event_id);   -- the declined seats go to the next person
  end if;
end;
$$;

create or replace function my_waitlist()
returns table (id uuid, event_id uuid, event_name text, event_slug text, event_date date, quantity integer, status text,
               queue_position bigint, joined_at timestamptz, offer_expires_at timestamptz, booking_id uuid)
language sql stable security definer set search_path = public
as $$
  select w.id, w.event_id, e.name, e.slug, e.event_date, w.quantity,
         case when w.status = 'offered' and w.offer_expires_at <= now() then 'expired' else w.status end,
         case when w.status = 'waiting' then (select count(*) from waitlist x where x.event_id = w.event_id and x.status = 'waiting'
                                               and x.user_id is not null and x.queue_no <= w.queue_no) end,
         w.created_at, w.offer_expires_at, w.booking_id
  from waitlist w join events e on e.id = w.event_id
  where w.user_id = auth.uid()
  order by w.created_at desc;
$$;

-- Admin: run the offer engine now (e.g. after releasing seats).
create or replace function admin_offer_waitlist(p_event_id uuid)
returns integer
language plpgsql security definer set search_path = public
as $$
begin
  if not has_permission('bookings.manage') then
    raise exception 'You do not have permission to manage the waitlist.';
  end if;
  return offer_waitlist_seats(p_event_id);
end;
$$;

-- Admin: take someone off the waitlist (duplicate, request, no-show...).
-- A held offer's seats pass straight to the next person.
create or replace function admin_remove_waitlist_entry(p_entry_id uuid, p_reason text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_row waitlist%rowtype;
begin
  if not has_permission('bookings.manage') then
    raise exception 'You do not have permission to manage the waitlist.';
  end if;
  select * into v_row from waitlist where id = p_entry_id for update;
  if v_row.id is null or v_row.status not in ('waiting', 'offered') then
    raise exception 'This waitlist entry is no longer active.';
  end if;
  update waitlist set status = 'skipped', resolved_at = now(), updated_at = now() where id = v_row.id;
  perform audit_write('waitlist.removed', 'waitlist', v_row.id::text,
    jsonb_build_object('previous_status', v_row.status, 'reason', nullif(btrim(p_reason), '')), v_row.event_id);
  if v_row.status = 'offered' then
    perform offer_waitlist_seats(v_row.event_id);
  end if;
end;
$$;

revoke execute on function join_waitlist(uuid, integer), leave_waitlist(uuid), my_waitlist(), admin_offer_waitlist(uuid), admin_remove_waitlist_entry(uuid, text) from public, anon;
grant execute on function join_waitlist(uuid, integer), leave_waitlist(uuid), my_waitlist(), admin_offer_waitlist(uuid), admin_remove_waitlist_entry(uuid, text) to authenticated;

-- Checkout honours holds --------------------------------------------------------------------
create or replace function create_pending_booking(p_user_id uuid, p_event_id uuid, p_registration_code text, p_attendee_name text,
  p_attendee_email text, p_attendee_phone text, p_quantity integer, p_amount integer, p_tier text, p_razorpay_order_id text,
  p_attendee_names text[] default null, p_details jsonb default null)
returns bookings
language plpgsql security definer set search_path = public
as $$
declare
  v_event events%rowtype;
  v_taken int;
  v_held int;
  v_offer waitlist%rowtype;
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
  -- A live waitlist offer lets its holder use the seats held for them.
  if p_user_id is not null then
    select * into v_offer from waitlist
     where event_id = p_event_id and user_id = p_user_id and status = 'offered' and offer_expires_at > now() for update;
  end if;
  if v_offer.id is not null and p_quantity > v_offer.quantity
     and v_event.capacity - coalesce((select sum(quantity) from bookings where event_id = p_event_id and status in ('pending', 'confirmed')), 0)
         - waitlist_held_seats(p_event_id) < p_quantity - v_offer.quantity then
    raise exception 'SOLD_OUT: Your waitlist offer holds % seat%.', v_offer.quantity, case when v_offer.quantity = 1 then '' else 's' end;
  end if;
  select coalesce(sum(quantity), 0) into v_taken
  from bookings
  where event_id = p_event_id and status in ('pending', 'confirmed');
  v_held := waitlist_held_seats(p_event_id, p_user_id);
  if v_taken + v_held + p_quantity > v_event.capacity then
    raise exception 'SOLD_OUT';
  end if;
  insert into bookings (
    registration_code, user_id, event_id, attendee_name, attendee_email,
    attendee_phone, quantity, amount, tier, status, razorpay_order_id, attendee_names,
    booking_answers, contact_instagram, customer_note, collab_interests, collab_note, waitlist_entry_id
  ) values (
    p_registration_code, p_user_id, p_event_id, p_attendee_name, p_attendee_email,
    p_attendee_phone, p_quantity, v_amount, p_tier, 'pending', p_razorpay_order_id, v_names,
    coalesce(v_details -> 'answers', '{}'::jsonb), v_instagram, v_note, v_collab, v_collab_note, v_offer.id
  )
  returning * into v_booking;
  if v_offer.id is not null then
    -- The pending booking now holds these seats (with its own checkout timer).
    update waitlist set status = 'converted', booking_id = v_booking.id, resolved_at = now(), updated_at = now() where id = v_offer.id;
    insert into audit_logs (actor_id, actor_email, actor_role, action, resource_type, resource_id, event_id, metadata)
    values (p_user_id, p_attendee_email, 'user', 'waitlist.converted', 'waitlist', v_offer.id::text, p_event_id,
            jsonb_build_object('booking_id', v_booking.id, 'registration_code', v_booking.registration_code));
  end if;
  return v_booking;
end;
$$;
revoke execute on function create_pending_booking(uuid, uuid, text, text, text, text, int, int, text, text, text[], jsonb) from public, anon, authenticated;
grant execute on function create_pending_booking(uuid, uuid, text, text, text, text, int, int, text, text, text[], jsonb) to service_role;

-- Availability counts held seats (and the queue length) ------------------------------------
create or replace function event_availability(p_event_id uuid)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'capacity', e.capacity,
    'taken', coalesce(b.taken, 0) + waitlist_held_seats(e.id),
    'remaining', greatest(e.capacity - coalesce(b.taken, 0) - waitlist_held_seats(e.id), 0),
    'sold_out', e.status = 'sold-out' or coalesce(b.taken, 0) + waitlist_held_seats(e.id) >= e.capacity,
    'waitlist', (select count(*) from waitlist w where w.event_id = e.id and w.status in ('waiting', 'offered') and w.user_id is not null),
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

-- Late payments respect held seats too -----------------------------------------------------
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
    v_taken := v_taken + waitlist_held_seats(v_booking.event_id);
    if v_taken + v_booking.quantity > v_event.capacity then
      v_reason := format('Paid after the checkout hold expired and the seats are gone (%s/%s taken or held).', v_taken, v_event.capacity);
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

-- Scheduled jobs gain offer expiry ------------------------------------------------------------
create or replace function run_platform_jobs()
returns jsonb
language plpgsql security definer set search_path = public
as $$
begin
  return jsonb_build_object(
    'bookings_expired', expire_stale_bookings(),
    'waitlist_offers_expired', expire_waitlist_offers(),
    'requests_expired', expire_booking_requests(),
    'reminders', send_event_reminders(),
    'overdue_tasks', notify_overdue_tasks(),
    'expiring_access', notify_expiring_access(),
    'access_expiry_logged', log_expired_access());
end;
$$;
revoke execute on function run_platform_jobs() from public, anon, authenticated;
grant execute on function run_platform_jobs() to service_role;

commit;
