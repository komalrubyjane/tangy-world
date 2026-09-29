-- Tangy Sessions — event booking form (replaces the old Google Form).
--
-- Required checkout stays short: booker name, mobile, email, number of people
-- and every attendee's name (0023). Everything else is optional or
-- configured per event, and validated here — the browser and the
-- razorpay-create-order Edge Function check too, but this is authoritative.
--
--  1. events.booking_min_quantity / booking_max_quantity — tickets per
--     booking for this event (defaults 1..10, the old form's range).
--  2. events.booking_questions — the event's extra questions, e.g. chair
--     seating, area of the city, date of birth, gender. JSON array of
--       { id, type, label, required, help?, options?, min?, max? }
--     type: text | long_text | number | date | single_select | multi_select | boolean
--     Validated by valid_booking_questions(). Events without questions show none.
--  3. bookings.booking_answers — answers keyed by question id, checked against
--     the event's questions when the booking is created (required, type,
--     options, bounds; unknown keys refused).
--  4. bookings.contact_instagram (optional, stored without "@"),
--     bookings.customer_note (optional "anything else"),
--     bookings.collab_interests / collab_note (optional, structured: artist,
--     sponsor, volunteer, … — shown to admins as leads; never grants a role).
--  5. create_pending_booking(…, p_details jsonb) validates all of it plus the
--     event's quantity range. Previous Tangy attendance is not asked — admins
--     see it derived from booking history.
--  6. attendee_tickets gains payment_status and checked_in_by_name (exports).
--
-- Answers live on the booking row: readable by the booker (own bookings) and
-- by admins with booking access, never by staff or the public. The question
-- config on events is public (it is only the form).
--
-- Rollback: rollbacks/0024_event_booking_form.down.sql

begin;

-- 1–2. Event configuration ----------------------------------------------------------
create or replace function valid_booking_questions(p_questions jsonb)
returns boolean
language plpgsql immutable
as $$
declare
  q jsonb;
  v_ids text[] := '{}';
begin
  if p_questions is null or jsonb_typeof(p_questions) <> 'array' or jsonb_array_length(p_questions) > 20 then
    return false;
  end if;
  for q in select * from jsonb_array_elements(p_questions) loop
    if jsonb_typeof(q) <> 'object'
       or coalesce(q ->> 'id', '') !~ '^[a-z][a-z0-9_]{0,39}$'
       or q ->> 'id' = any (v_ids)
       or coalesce(q ->> 'type', '') not in ('text', 'long_text', 'number', 'date', 'single_select', 'multi_select', 'boolean')
       or length(btrim(coalesce(q ->> 'label', ''))) not between 1 and 200
       or (q ? 'required' and jsonb_typeof(q -> 'required') <> 'boolean')
       or length(coalesce(q ->> 'help', '')) > 300
       or exists (select 1 from jsonb_object_keys(q) k where k not in ('id', 'type', 'label', 'required', 'help', 'options', 'min', 'max')) then
      return false;
    end if;
    if q ->> 'type' in ('single_select', 'multi_select') then
      -- coalesce: a missing key gives NULL, which must reject, not slip through.
      if coalesce(jsonb_typeof(q -> 'options'), '') <> 'array' or jsonb_array_length(q -> 'options') not between 1 and 30
         or exists (select 1 from jsonb_array_elements(q -> 'options') o where jsonb_typeof(o) <> 'string' or length(btrim(o #>> '{}')) not between 1 and 100) then
        return false;
      end if;
    elsif q ? 'options' then
      return false;
    end if;
    if (q ? 'min' or q ? 'max') and (q ->> 'type' <> 'number'
        or (q ? 'min' and jsonb_typeof(q -> 'min') <> 'number') or (q ? 'max' and jsonb_typeof(q -> 'max') <> 'number')) then
      return false;
    end if;
    v_ids := v_ids || (q ->> 'id');
  end loop;
  return true;
end;
$$;

alter table events add column if not exists booking_min_quantity integer not null default 1;
alter table events add column if not exists booking_max_quantity integer not null default 10;
alter table events add constraint events_booking_quantity_check
  check (booking_min_quantity between 1 and 50 and booking_max_quantity between booking_min_quantity and 50);
alter table events add column if not exists booking_questions jsonb not null default '[]'::jsonb;
alter table events add constraint events_booking_questions_check check (valid_booking_questions(booking_questions));
comment on column events.booking_questions is 'Optional per-event booking questions (see 0024). Public: it is only the form definition.';

-- 3–4. Booking details ----------------------------------------------------------------
alter table bookings add column if not exists booking_answers jsonb not null default '{}'::jsonb;
alter table bookings add constraint bookings_booking_answers_check check (jsonb_typeof(booking_answers) = 'object');
alter table bookings add column if not exists contact_instagram text;
alter table bookings add constraint bookings_contact_instagram_check check (contact_instagram is null or contact_instagram ~ '^[A-Za-z0-9._]{1,30}$');
alter table bookings add column if not exists customer_note text;
alter table bookings add constraint bookings_customer_note_check check (customer_note is null or length(customer_note) between 1 and 1000);
alter table bookings add column if not exists collab_interests text[];
alter table bookings add constraint bookings_collab_interests_check check (collab_interests is null or collab_interests <@
  array['artist', 'sponsor', 'volunteer', 'event_team', 'sound_technical', 'video_photo', 'editing', 'graphic_design', 'other']::text[]);
alter table bookings add column if not exists collab_note text;
alter table bookings add constraint bookings_collab_note_check check (collab_note is null or length(collab_note) between 1 and 1000);
comment on column bookings.booking_answers is 'Answers to the event''s booking_questions at the time of booking, keyed by question id.';

-- Answers against the event's questions: returns NULL when valid, else a
-- user-safe reason. Number questions count people in this booking (e.g. "how
-- many need a chair?"), so they are capped at the booking's size.
create or replace function booking_answers_error(p_questions jsonb, p_answers jsonb, p_quantity int)
returns text
language plpgsql stable
as $$
declare
  q jsonb;
  a jsonb;
  v_num numeric;
begin
  if p_answers is null then p_answers := '{}'::jsonb; end if;
  if jsonb_typeof(p_answers) <> 'object' then
    return 'Answers are malformed.';
  end if;
  if exists (select 1 from jsonb_object_keys(p_answers) k
             where not exists (select 1 from jsonb_array_elements(p_questions) x where x ->> 'id' = k)) then
    return 'An answer does not match this event''s questions.';
  end if;
  for q in select * from jsonb_array_elements(p_questions) loop
    a := p_answers -> (q ->> 'id');
    if a is null or a = 'null'::jsonb or (jsonb_typeof(a) = 'string' and btrim(a #>> '{}') = '') or (jsonb_typeof(a) = 'array' and jsonb_array_length(a) = 0) then
      if coalesce((q ->> 'required')::boolean, false) then
        return format('Please answer: %s', q ->> 'label');
      end if;
      continue;
    end if;
    case q ->> 'type'
      when 'text' then
        if jsonb_typeof(a) <> 'string' or length(a #>> '{}') > 300 then return format('Check your answer to: %s', q ->> 'label'); end if;
      when 'long_text' then
        if jsonb_typeof(a) <> 'string' or length(a #>> '{}') > 2000 then return format('Check your answer to: %s', q ->> 'label'); end if;
      when 'number' then
        if jsonb_typeof(a) <> 'number' then return format('Enter a number for: %s', q ->> 'label'); end if;
        v_num := (a #>> '{}')::numeric;
        if v_num <> trunc(v_num) or v_num < coalesce((q ->> 'min')::numeric, 0)
           or v_num > least(coalesce((q ->> 'max')::numeric, p_quantity), p_quantity) then
          return format('Enter a whole number from %s to %s for: %s', coalesce(q ->> 'min', '0'),
                        least(coalesce((q ->> 'max')::numeric, p_quantity), p_quantity), q ->> 'label');
        end if;
      when 'date' then
        if jsonb_typeof(a) <> 'string' or (a #>> '{}') !~ '^\d{4}-\d{2}-\d{2}$' then return format('Enter a date for: %s', q ->> 'label'); end if;
        begin
          if (a #>> '{}')::date > current_date or (a #>> '{}')::date < date '1900-01-01' then return format('Enter a valid date for: %s', q ->> 'label'); end if;
        exception when others then return format('Enter a valid date for: %s', q ->> 'label');
        end;
      when 'single_select' then
        if jsonb_typeof(a) <> 'string' or not (q -> 'options') ? (a #>> '{}') then return format('Choose an option for: %s', q ->> 'label'); end if;
      when 'multi_select' then
        if jsonb_typeof(a) <> 'array' or exists (select 1 from jsonb_array_elements(a) x where jsonb_typeof(x) <> 'string' or not (q -> 'options') ? (x #>> '{}')) then
          return format('Choose from the options for: %s', q ->> 'label');
        end if;
      when 'boolean' then
        if jsonb_typeof(a) <> 'boolean' then return format('Answer yes or no: %s', q ->> 'label'); end if;
    end case;
  end loop;
  return null;
end;
$$;

-- 5. Booking creation validates the whole form ---------------------------------------
drop function if exists create_pending_booking(uuid, uuid, text, text, text, text, int, int, text, text, text[]);
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

-- 6. Exports: payment state and who checked each attendee in ---------------------
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
  party.remaining as party_remaining,
  b.payment_status,
  (select coalesce(p.full_name, p.email) from profiles p where p.id = c.checked_in_by) as checked_in_by_name
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

commit;
