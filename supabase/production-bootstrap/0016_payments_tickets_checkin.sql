-- Tangy Sessions — complete the payments → tickets → QR → check-in flow.
-- Run after 0015_application_lifecycle.sql.
--
-- Inspection findings this migration addresses (see also the razorpay-*
-- Edge Functions, which already correctly: authenticate the buyer,
-- server-compute the amount from events.price + tier markup + 18% tax,
-- verify the Razorpay HMAC signature, and process the webhook idempotently
-- via payment_webhook_events — none of that is rebuilt here):
--
-- 1. "bookings: self create own" (0002_rls.sql) has NO status restriction —
--    any authenticated patron could insert a booking with status='confirmed'
--    and an arbitrary amount directly via the REST API, bypassing Razorpay
--    entirely. Closed by removing client INSERT on bookings altogether — the
--    only real writers now are the SECURITY DEFINER RPCs below (invoked with
--    the service-role key from the Edge Functions) and the webhook itself.
--
-- 2. No capacity/overselling protection existed anywhere — create_pending_booking
--    below is the sole path a pending booking can be created through, and it
--    takes a row lock on the event before checking capacity, so concurrent
--    buyers serialize instead of racing past the check.
--
-- 3. No per-ticket identity — one booking (possibly quantity > 1) had one
--    registration_code and, via checkins.unique(booking_id), could only ever
--    check in as a single unit. `tickets` gives every individual admission
--    its own row, its own unpredictable token (what the QR actually
--    encodes — never a database id, never PII), and its own check-in state.
--
-- 4. Check-in was a bare client-side insert into `checkins` relying only on
--    RLS + a unique constraint — it never checked booking.status='confirmed',
--    never checked ticket.status='cancelled', and searched by the (public,
--    guessable-ish) registration_code rather than a real credential.
--    check_in_ticket() below is the single, atomic, server-validated path.
--
-- 5. bookings had no `tier` column (tier was priced but never stored) and no
--    'failed' status — payment failures just left a pending booking with no
--    terminal state. Both added; the webhook now handles payment.failed too.

-- 1. CLOSE THE FAKE-CONFIRMED-BOOKING GAP -----------------------------------

drop policy "bookings: self create own" on bookings;
-- No replacement insert policy: the client no longer inserts bookings at
-- all. create_pending_booking() (SECURITY DEFINER, called with the
-- service-role key from razorpay-create-order) and the webhook are the only
-- writers now — see "bookings: staff/admin full access" (unchanged) for the
-- one remaining legitimate direct-write path (admin tooling).

alter type booking_status add value if not exists 'failed';

alter table bookings add column if not exists tier text;

-- 2. CAPACITY-SAFE PENDING BOOKING CREATION ---------------------------------

create function create_pending_booking(
  p_user_id uuid,
  p_event_id uuid,
  p_registration_code text,
  p_attendee_name text,
  p_attendee_email text,
  p_attendee_phone text,
  p_quantity int,
  p_amount int,
  p_tier text,
  p_razorpay_order_id text
) returns bookings
language plpgsql
security definer set search_path = public
as $$
declare
  v_capacity int;
  v_taken int;
  v_booking bookings%rowtype;
begin
  -- Row lock on the event for the rest of this transaction — a concurrent
  -- call for the same event blocks here instead of racing past the count
  -- below, which is what actually prevents overselling the last few seats.
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

-- 3. TICKETS -----------------------------------------------------------------

create table tickets (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  ticket_number text not null unique,
  token text not null unique,
  tier text,
  status text not null default 'valid' check (status in ('valid', 'checked_in', 'cancelled')),
  created_at timestamptz not null default now()
);

create index tickets_booking_id_idx on tickets (booking_id);
create index tickets_event_id_idx on tickets (event_id);
create index tickets_user_id_idx on tickets (user_id);
create index tickets_token_idx on tickets (token);

alter table tickets enable row level security;
create policy "tickets: self read own" on tickets for select using (auth.uid() = user_id);
create policy "tickets: staff/admin full access" on tickets for all using (is_staff_or_admin());
-- No insert/update policy for anon/authenticated — tickets are only ever
-- created/updated by the SECURITY DEFINER functions below.

-- Idempotent: called from BOTH razorpay-verify-payment (client-triggered,
-- immediate) and the webhook (authoritative, may retry) for the same
-- booking. The row lock on `bookings` means a concurrent second call for
-- the same booking waits for the first to finish, then sees tickets already
-- exist and does nothing — exactly-once ticket issuance regardless of which
-- caller wins the race or how many times the webhook retries.
create function confirm_booking_and_issue_tickets(p_booking_id uuid)
returns setof tickets
language plpgsql
security definer set search_path = public
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

-- 4. CHECK-INS — move to per-ticket -----------------------------------------

alter table checkins drop constraint if exists checkins_booking_id_key;
alter table checkins add column if not exists ticket_id uuid references tickets(id) on delete cascade;
alter table checkins add constraint checkins_ticket_id_key unique (ticket_id);

-- Server-validated, single atomic path for a check-in scan. The client
-- (checkinService.js) never decides validity or writes `checkins` directly
-- anymore — it calls this and renders whatever `result` comes back.
-- `is_staff_or_admin()` reads the REAL calling session's role (SECURITY
-- DEFINER changes table-permission checks, not auth.uid()), so this can't
-- be reached by an ordinary patron even calling the RPC directly.
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
    return jsonb_build_object(
      'result', 'already_checked_in',
      'ticket_number', v_ticket.ticket_number,
      'attendee_name', v_booking.attendee_name,
      'tier', v_ticket.tier,
      'checked_in_at', v_checkin.checked_in_at
    );
  end if;

  insert into checkins (booking_id, ticket_id, event_id, checked_in_by)
  values (v_ticket.booking_id, v_ticket.id, v_ticket.event_id, auth.uid())
  returning * into v_checkin;

  update tickets set status = 'checked_in' where id = v_ticket.id;

  return jsonb_build_object(
    'result', 'valid',
    'ticket_number', v_ticket.ticket_number,
    'attendee_name', v_booking.attendee_name,
    'event_name', (select name from events where id = p_event_id),
    'tier', v_ticket.tier,
    'checked_in_at', v_checkin.checked_in_at
  );
end;
$$;

-- 5. TICKET EMAIL IDEMPOTENCY (mirrors application_notifications' pattern,
--    but 1:1 with a booking rather than a separate table — one email per
--    booking, covering every ticket in it) --------------------------------

alter table bookings add column if not exists ticket_email_status text not null default 'pending' check (ticket_email_status in ('pending', 'sent', 'failed'));
alter table bookings add column if not exists ticket_email_error text;
alter table bookings add column if not exists ticket_email_sent_at timestamptz;
