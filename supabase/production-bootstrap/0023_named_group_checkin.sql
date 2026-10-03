-- Tangy Sessions — named attendees + one group QR per booking + partial check-in.
--
-- Existing model (kept): a booking for N guests gets N `tickets` rows at
-- payment, and attendance is one `checkins` row per ticket (unique(ticket_id),
-- with checked_in_by / checked_in_at). A ticket therefore already IS one
-- attendee with individual check-in state and history; this migration gives it
-- a name and lets one booking-level QR admit whichever named attendees are
-- physically present. No competing attendance table is added.
--
--  1. bookings.attendee_names text[] — the names entered before payment
--     (validated here: one non-blank name per ticket). Tickets don't exist
--     until payment is confirmed, so this is where they wait.
--  2. tickets.attendee_name — copied from attendee_names[i] onto ticket i when
--     tickets are issued; the source of truth afterwards. Historical tickets
--     stay NULL (shown as "Guest N") — no names are invented.
--  3. bookings.group_token — opaque 40-hex credential; QR TANGY:BOOKING:<token>.
--     Never a database id or personal data. Per-ticket QRs (TANGY:TICKET:…)
--     keep working unchanged.
--  4. checkins.batch_id — rows written by one check-in action share it
--     ("7:18 PM · Kavya, Neha · Staff B"). Existing rows: batch_id = id.
--  5. check_in_ticket(p_token, p_event_id, p_method, p_notes, p_attendee_ids,
--     p_preview) — the one server-side check-in function for QR and manual.
--     A group token locks the BOOKING row (serialising every check-in and
--     cancellation of that booking), then locks the selected tickets, and
--     admits them all or none: every id must be a distinct, non-cancelled,
--     not-yet-checked-in ticket of THIS booking (hence this event). The
--     quantity is derived from the selection; the client never sends a count.
--     Two staff selecting the same person: the second is refused.
--  6. Read models: attendee_tickets.guest_name + group token + party counts;
--     get_checkin_history.guest_name + batch_id; booking_checkin_history()
--     returns one row per checked-in attendee.
--
-- Reports need no change: they already count tickets (attendees), not bookings.
--
-- Rollback: rollbacks/0023_named_group_checkin.down.sql

begin;

-- 1–3. Names and the group credential -------------------------------------------
create or replace function valid_attendee_names(p_names text[], p_quantity int)
returns boolean
language sql immutable
as $$
  select p_names is null
      or (cardinality(p_names) = p_quantity
          and not exists (select 1 from unnest(p_names) n where n is null or length(btrim(n)) = 0 or length(btrim(n)) > 120));
$$;

alter table bookings add column if not exists attendee_names text[];
alter table bookings add constraint bookings_attendee_names_check check (valid_attendee_names(attendee_names, quantity));
comment on column bookings.attendee_names is
  'Attendee names entered before payment, one per ticket (ticket i gets name i when issued). NULL for bookings made before 0023 and complimentary admissions.';

alter table tickets add column if not exists attendee_name text;
alter table tickets add constraint tickets_attendee_name_check
  check (attendee_name is null or (length(btrim(attendee_name)) between 1 and 120));
comment on column tickets.attendee_name is 'The named attendee for this admission. NULL for tickets issued before 0023 (never invented).';

alter table bookings add column if not exists group_token text;
update bookings set group_token = encode(extensions.gen_random_bytes(20), 'hex') where group_token is null;
alter table bookings alter column group_token set default encode(extensions.gen_random_bytes(20), 'hex');
alter table bookings alter column group_token set not null;
create unique index if not exists bookings_group_token_key on bookings (group_token);
comment on column bookings.group_token is
  'Opaque group check-in credential (QR TANGY:BOOKING:<token>): resolves to the booking server-side; contains no ids or personal data.';

-- 4. Arrival batches -------------------------------------------------------------
alter table checkins add column if not exists batch_id uuid;
update checkins set batch_id = id where batch_id is null;  -- deterministic: each existing row is its own arrival
alter table checkins alter column batch_id set default gen_random_uuid();
alter table checkins alter column batch_id set not null;
create index if not exists checkins_batch_id_idx on checkins (batch_id);

-- Booking creation takes the names (validated) -----------------------------------
drop function if exists create_pending_booking(uuid, uuid, text, text, text, text, int, int, text, text);
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

-- Ticket issuance names each ticket (idempotent as before) ------------------------
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
      insert into tickets (booking_id, event_id, user_id, ticket_number, token, tier, status, attendee_name)
      values (
        p_booking_id,
        v_booking.event_id,
        v_booking.user_id,
        v_booking.registration_code || '-' || lpad(i::text, 2, '0'),
        encode(gen_random_bytes(20), 'hex'),
        v_booking.tier,
        'valid',
        v_booking.attendee_names[i]
      );
    end loop;
  end if;

  return query select * from tickets where booking_id = p_booking_id order by ticket_number;
end;
$$;
revoke execute on function confirm_booking_and_issue_tickets(uuid) from public, anon, authenticated;
grant execute on function confirm_booking_and_issue_tickets(uuid) to service_role;

-- 5. One check-in function for tickets and groups ---------------------------------
-- Internal: a booking's attendees with their individual state (ticket order).
create or replace function booking_attendees_state(p_booking_id uuid)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', t.id, 'ticket_number', t.ticket_number, 'name', t.attendee_name,
           'status', t.status, 'checked_in_at', c.checked_in_at, 'method', c.method,
           'checked_in_by_name', coalesce(p.full_name, p.email)) order by t.ticket_number), '[]'::jsonb)
  from tickets t
  left join checkins c on c.ticket_id = t.id
  left join profiles p on p.id = c.checked_in_by
  where t.booking_id = p_booking_id and t.status <> 'cancelled';
$$;
revoke execute on function booking_attendees_state(uuid) from public, anon, authenticated;

drop function if exists check_in_ticket(text, uuid, text, text);
create or replace function check_in_ticket(p_token text, p_event_id uuid, p_method text default 'qr', p_notes text default null,
                                           p_attendee_ids uuid[] default null, p_preview boolean default false)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_token text := trim(coalesce(p_token, ''));
  v_ticket tickets%rowtype;
  v_booking bookings%rowtype;
  v_checkin checkins%rowtype;
  v_event_name text;
  v_by_name text;
  v_party int;
  v_checked int;
  v_remaining int;
  v_selected int;
  v_locked int;
  v_bad int;
  v_taken text[];
  v_batch uuid;
  v_now timestamptz := now();
  v_base jsonb;
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

  select * into v_ticket from tickets where token = v_token for update;

  -- ---------------------------------------------------------------- booking (group) QR
  if v_ticket.id is null then
    select * into v_booking from bookings where group_token = v_token for update;
    if v_booking.id is null then
      return jsonb_build_object('result', 'not_found', 'event_name', v_event_name);
    end if;
    if v_booking.event_id <> p_event_id then
      return jsonb_build_object('result', 'wrong_event', 'group', true, 'registration_code', v_booking.registration_code,
        'event_name', v_event_name, 'ticket_event_name', (select name from events where id = v_booking.event_id));
    end if;
    if v_booking.status in ('cancelled', 'refunded') then
      return jsonb_build_object('result', 'cancelled', 'group', true, 'registration_code', v_booking.registration_code, 'event_name', v_event_name);
    end if;
    if v_booking.status <> 'confirmed' then
      return jsonb_build_object('result', 'payment_not_confirmed', 'group', true, 'registration_code', v_booking.registration_code, 'event_name', v_event_name);
    end if;

    select count(*) filter (where status <> 'cancelled'), count(*) filter (where status = 'checked_in'), count(*) filter (where status = 'valid')
      into v_party, v_checked, v_remaining
      from tickets where booking_id = v_booking.id;
    if v_party = 0 then
      return jsonb_build_object('result', 'cancelled', 'group', true, 'registration_code', v_booking.registration_code, 'event_name', v_event_name);
    end if;

    v_base := jsonb_build_object('group', true, 'registration_code', v_booking.registration_code, 'booked_by', v_booking.attendee_name,
      'tier', v_booking.tier, 'event_name', v_event_name, 'party_size', v_party);

    if v_remaining = 0 then
      return v_base || jsonb_build_object('result', 'already_checked_in', 'checked_in', v_checked, 'remaining', 0,
        'attendees', booking_attendees_state(v_booking.id));
    end if;
    if p_preview then
      return v_base || jsonb_build_object('result', 'ready', 'checked_in', v_checked, 'remaining', v_remaining,
        'attendees', booking_attendees_state(v_booking.id));
    end if;

    -- The selection: at least one, no repeats.
    v_selected := coalesce(cardinality(p_attendee_ids), 0);
    if v_selected = 0 or (select count(distinct x) from unnest(p_attendee_ids) x) <> v_selected
       or exists (select 1 from unnest(p_attendee_ids) x where x is null) then
      return v_base || jsonb_build_object('result', 'invalid_selection', 'checked_in', v_checked, 'remaining', v_remaining,
        'attendees', booking_attendees_state(v_booking.id));
    end if;

    -- Lock exactly the selected attendees of THIS booking. Anything else
    -- (another booking, another event, a forged or cancelled id) is missing
    -- from the locked set and refuses the whole request.
    select count(*), count(*) filter (where status <> 'valid'),
           array_agg(coalesce(attendee_name, 'Guest ' || ltrim(right(ticket_number, 2), '0')) order by ticket_number) filter (where status = 'checked_in')
      into v_locked, v_bad, v_taken
      from (select id, status, attendee_name, ticket_number from tickets
            where booking_id = v_booking.id and id = any (p_attendee_ids) and status <> 'cancelled'
            order by ticket_number for update) s;
    if v_locked <> v_selected then
      return v_base || jsonb_build_object('result', 'invalid_attendee', 'checked_in', v_checked, 'remaining', v_remaining,
        'attendees', booking_attendees_state(v_booking.id));
    end if;
    if v_bad > 0 then
      return v_base || jsonb_build_object('result', 'attendee_already_checked_in', 'already', to_jsonb(v_taken),
        'checked_in', v_checked, 'remaining', v_remaining, 'attendees', booking_attendees_state(v_booking.id));
    end if;

    v_batch := gen_random_uuid();
    insert into checkins (booking_id, ticket_id, event_id, checked_in_by, method, notes, batch_id, checked_in_at)
    select v_booking.id, t.id, t.event_id, auth.uid(), p_method, nullif(trim(p_notes), ''), v_batch, v_now
    from tickets t where t.id = any (p_attendee_ids);
    update tickets set status = 'checked_in' where id = any (p_attendee_ids);

    select coalesce(full_name, email) into v_by_name from profiles where id = auth.uid();
    perform audit_write(case when p_method = 'manual' then 'checkin.manual' else 'checkin.scan' end,
      'booking', v_booking.id::text,
      jsonb_build_object('registration_code', v_booking.registration_code, 'quantity', v_selected,
                         'checked_in', v_checked + v_selected, 'party_size', v_party, 'batch_id', v_batch,
                         'ticket_numbers', (select jsonb_agg(ticket_number order by ticket_number) from tickets where id = any (p_attendee_ids)),
                         'notes', nullif(trim(p_notes), ''),
                         'via', case when has_permission('checkin.perform') then 'role' else 'temporary_access' end),
      p_event_id);

    return v_base || jsonb_build_object('result', 'valid', 'quantity', v_selected,
      'checked_in', v_checked + v_selected, 'remaining', v_remaining - v_selected,
      'admitted', (select jsonb_agg(coalesce(attendee_name, 'Guest ' || ltrim(right(ticket_number, 2), '0')) order by ticket_number) from tickets where id = any (p_attendee_ids)),
      'checked_in_at', v_now, 'checked_in_by_name', v_by_name, 'method', p_method,
      'attendees', booking_attendees_state(v_booking.id));
  end if;

  -- ---------------------------------------------------------------- one ticket (unchanged behaviour)
  if p_attendee_ids is not null and not (cardinality(p_attendee_ids) = 1 and p_attendee_ids[1] = v_ticket.id) then
    return jsonb_build_object('result', 'invalid_attendee', 'ticket_number', v_ticket.ticket_number);
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
      'guest_name', v_ticket.attendee_name,
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
    'guest_name', v_ticket.attendee_name,
    'registration_code', v_booking.registration_code,
    'event_name', v_event_name,
    'tier', v_ticket.tier,
    'checked_in_at', v_checkin.checked_in_at,
    'checked_in_by_name', v_by_name,
    'method', p_method
  );
end;
$$;
revoke execute on function check_in_ticket(text, uuid, text, text, uuid[], boolean) from public, anon;
grant execute on function check_in_ticket(text, uuid, text, text, uuid[], boolean) to authenticated;

-- 6. Read models --------------------------------------------------------------------
-- 0018's columns plus, at the end: the named attendee, the booking's group
-- credential (same rule as the ticket token: only callers who may check in
-- this event, only while guests remain) and the party counts.
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
  checked_in_by uuid, checked_in_by_name text, total_count bigint,
  guest_name text, batch_id uuid
)
language sql stable security definer set search_path = public
as $$
  select c.id, c.checked_in_at, c.method, c.notes,
         c.event_id, e.name, t.ticket_number, t.tier,
         b.registration_code, b.attendee_name,
         c.checked_in_by, coalesce(p.full_name, p.email),
         count(*) over (),
         t.attendee_name, c.batch_id
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

-- One row per checked-in attendee of a booking, newest first.
create or replace function booking_checkin_history(p_booking_id uuid)
returns table (checked_in_at timestamptz, ticket_number text, attendee_name text, method text,
               checked_in_by_name text, batch_id uuid)
language plpgsql stable security definer set search_path = public
as $$
declare
  v_event uuid := (select event_id from bookings where id = p_booking_id);
begin
  if v_event is null or not (can_view_event_attendees(v_event) or has_permission('bookings.view_all')) then
    raise exception 'You do not have access to this booking.';
  end if;
  return query
    select c.checked_in_at, t.ticket_number, t.attendee_name, c.method, coalesce(p.full_name, p.email), c.batch_id
    from checkins c join tickets t on t.id = c.ticket_id left join profiles p on p.id = c.checked_in_by
    where t.booking_id = p_booking_id
    order by c.checked_in_at desc, t.ticket_number;
end;
$$;
revoke execute on function booking_checkin_history(uuid) from public, anon;
grant execute on function booking_checkin_history(uuid) to authenticated;

commit;
