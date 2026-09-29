-- Tangy Sessions — REVERSE of 0020_platform_finalization.sql. Not applied
-- automatically; run by hand only, then rollbacks/0019_platform_enum_values.down.sql.
--
-- Restores every function/policy 0020 replaced to its earlier (0011/0016/0018)
-- definition and DROPS what 0020 created: private artist profiles, admin
-- artist notes, sponsor assets, partner invoices, notification preferences,
-- the email outbox and reminder log. Export those first if you need them.
--
-- Rows that only exist because of 0020 features are adjusted so the older
-- constraints can be restored (all noted inline): expired bookings ->
-- cancelled, expired requests -> cancelled, closed requirements -> accepted,
-- blocked tasks -> pending, urgent -> high, event-level tasks (no assignee)
-- deleted, storage-backed documents deleted, media statuses mapped back.
--
-- MANUAL STEP: objects in the 'event-documents' and 'sponsor-assets' buckets
-- must be removed through the Storage API/dashboard before those buckets can
-- be deleted; this script drops their policies and leaves the (private,
-- now inaccessible) buckets in place.

begin;

do $$ begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('tangy-platform-jobs');
  end if;
exception when others then null;
end $$;

-- Triggers added to existing tables
drop trigger if exists events_validate_timezone on events;
drop trigger if exists artist_availability_guard on artist_availability;
drop trigger if exists events_notify_change on events;
drop trigger if exists artist_media_guard on artist_media;
drop trigger if exists artist_media_review_notify on artist_media;
drop trigger if exists event_artist_details_notify on event_artist_details;
drop trigger if exists event_assignments_schedule_notify on event_assignments;
drop trigger if exists event_documents_notify on event_documents;
drop trigger if exists assignment_requests_notify on assignment_requests;
drop trigger if exists sponsor_deliverables_completion on sponsor_deliverables;
drop trigger if exists event_tasks_validate on event_tasks;
drop trigger if exists event_tasks_audit on event_tasks;
drop trigger if exists bookings_flag_late_payment on bookings;

-- New tables
drop table if exists email_outbox cascade;
drop table if exists notification_preferences cascade;
drop table if exists event_reminders_sent cascade;
drop table if exists partner_invoices cascade;
drop table if exists sponsor_assets cascade;
drop table if exists artist_admin_notes cascade;
drop table if exists artist_private_profiles cascade;
drop view if exists public_artists;

-- Storage policies (buckets: see MANUAL STEP above)
drop policy if exists "event-documents: read" on storage.objects;
drop policy if exists "event-documents: upload" on storage.objects;
drop policy if exists "event-documents: managers delete" on storage.objects;
drop policy if exists "sponsor-assets: own upload" on storage.objects;
drop policy if exists "sponsor-assets: read" on storage.objects;
drop policy if exists "sponsor-assets: delete" on storage.objects;

-- Policies
drop policy if exists "artists: partner managers read" on artists;
create policy "artists: public read approved" on artists for select using (status = 'approved');
drop policy if exists "artist_media: curators" on artist_media;
drop policy if exists "artist-media: curators read" on storage.objects;
drop policy if exists "venues: hosts read own" on venues;
drop policy if exists "event_tasks: event staff read" on event_tasks;
drop policy if exists "event_tasks: event staff update" on event_tasks;
drop policy if exists "event_documents: members read" on event_documents;
create policy "event_documents: members read" on event_documents for select
  using (
    (audience = 'user' and user_id = auth.uid())
    or (audience = 'members' and event_member_kind(event_id) is not null)
    or (audience not in ('user', 'members') and event_member_kind(event_id) = audience)
  );

-- Announcements: back to the 0018 two-argument audience check
drop policy if exists "announcements: members read relevant" on announcements;
drop function if exists portal_announcements(int);
drop function if exists can_read_member_announcement(text, uuid, text);
create or replace function can_read_member_announcement(p_audience text, p_event_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select case
    when p_event_id is null then
      p_audience in ('sponsor', 'vendor', 'venue', 'volunteer', 'crew', 'artist')
      and p_audience = current_role_name()::text
    else
      coalesce(event_member_kind(p_event_id) in (p_audience)
               or (p_audience in ('members', 'all') and event_member_kind(p_event_id) is not null), false)
  end;
$$;

create policy "announcements: members read relevant" on announcements for select
  using (status = 'published' and publish_at <= now() and (expire_at is null or expire_at > now())
         and can_read_member_announcement(audience, event_id));
create or replace function portal_announcements(p_limit int default 20)
returns table (id uuid, title text, body text, priority text, audience text, event_id uuid, event_name text, publish_at timestamptz)
language sql stable security definer set search_path = public
as $$
  select a.id, a.title, a.body, a.priority, a.audience, a.event_id, e.name, a.publish_at
  from announcements a left join events e on e.id = a.event_id
  where a.status = 'published' and a.publish_at <= now() and (a.expire_at is null or a.expire_at > now())
    and can_read_member_announcement(a.audience, a.event_id)
  order by (a.priority = 'high') desc, a.publish_at desc
  limit least(greatest(p_limit, 1), 50);
$$;

-- New functions
drop function if exists run_platform_jobs();
drop function if exists admin_search(text, int);
drop function if exists admin_operations_overview();
drop function if exists event_health(uuid);
drop function if exists record_webhook_failure(text, text);
drop function if exists flag_late_payment();
drop function if exists expire_stale_bookings();
drop function if exists set_conversation_meta(uuid, text, boolean);
drop function if exists notify_expiring_access();
drop function if exists notify_overdue_tasks();
drop function if exists send_event_reminders();
drop function if exists event_starts_at(events);
drop function if exists notify_on_invoice();
drop function if exists stamp_asset_review();
drop function if exists notify_on_sponsor_asset();
drop function if exists notify_on_media_review();
drop function if exists notify_on_booking_request();
drop function if exists notify_on_document();
drop function if exists notify_on_event_change();
drop function if exists notify_on_assignment_schedule();
drop function if exists notify_on_artist_schedule();
drop function if exists member_link(uuid, text);
drop function if exists event_member_ids(uuid);
drop function if exists complete_email(uuid, boolean, text);
drop function if exists claim_email_batch(int);
drop function if exists set_notification_preference(text, boolean, boolean);
drop function if exists my_notification_preferences();
drop function if exists notification_allowed(uuid, text, text);
drop function if exists notification_pref_keys();
drop function if exists notification_meta(text);
drop function if exists invoice_state(partner_invoices);
drop function if exists validate_event_task();
drop function if exists stamp_deliverable_completion();
drop function if exists can_write_event_file(text);
drop function if exists can_read_event_file(text);
drop function if exists close_requirement(uuid);
drop function if exists my_booking_requests();
drop function if exists expire_booking_requests();
drop function if exists respond_to_booking_request(uuid, boolean, text);
drop function if exists create_booking_request(uuid, uuid, text, timestamptz, timestamptz, integer, timestamptz);
drop function if exists guard_artist_media();
drop function if exists artist_profile_completion(uuid);
drop function if exists validate_event_timezone();
drop function if exists guard_artist_availability();
drop function if exists setting_number(text, numeric);

-- Functions restored to their 0018 signatures
drop function if exists notify(uuid, text, text, text, text, uuid, text);
create or replace function notify(p_user_id uuid, p_type text, p_title text, p_body text default null,
                                  p_link text default null, p_event_id uuid default null)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if p_user_id is null or p_user_id = auth.uid() then
    return; -- nobody is notified about their own action
  end if;
  if not exists (select 1 from profiles where id = p_user_id and is_active) then
    return;
  end if;
  insert into notifications (user_id, type, title, body, link, event_id)
  values (p_user_id, p_type, left(p_title, 200), left(p_body, 1000), p_link, p_event_id);
end;
$$;

revoke execute on function notify(uuid, text, text, text, text, uuid) from public, anon, authenticated;
revoke execute on function notify_permission_holders(text, text, text, text, text, uuid) from service_role;
drop function if exists my_notifications(int, timestamptz, boolean, text);
create or replace function my_notifications(p_limit int default 20, p_before timestamptz default null, p_unread_only boolean default false)
returns setof notifications
language sql stable security definer set search_path = public
as $$
  select * from notifications
  where user_id = auth.uid()
    and (p_before is null or created_at < p_before)
    and (not p_unread_only or read_at is null)
  order by created_at desc
  limit least(greatest(p_limit, 1), 100);
$$;

drop function if exists submit_requirement(uuid, text, text);
create or replace function submit_requirement(p_id uuid, p_response text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_req event_requirements%rowtype;
begin
  select * into v_req from event_requirements where id = p_id for update;
  if v_req.id is null or v_req.user_id <> auth.uid() then
    raise exception 'Requirement not found.';
  end if;
  if v_req.status not in ('requested', 'changes_requested') then
    raise exception 'This requirement has already been answered.';
  end if;
  if length(trim(coalesce(p_response, ''))) = 0 then
    raise exception 'Please add your response.';
  end if;
  update event_requirements
    set status = 'submitted', response = trim(p_response), responded_at = now()
    where id = p_id;
end;
$$;

drop function if exists admin_conversations(text, uuid, text, text, boolean, int, int, text);
create or replace function admin_conversations(
  p_type text default null, p_event_id uuid default null, p_status text default null,
  p_search text default null, p_unread_only boolean default false, p_limit int default 30, p_offset int default 0)
returns table (id uuid, subject text, conversation_type text, status conversation_status, event_id uuid, event_name text,
               partner_id uuid, partner_name text, partner_email text, partner_role text,
               assigned_admin_name text, last_message_at timestamptz, last_message_preview text,
               unread integer, total_count bigint)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not has_permission('messages.manage') then
    raise exception 'You do not have permission to view messages.';
  end if;
  return query
  with base as (
    select c.*, e.name as ev_name, p.full_name as p_name, p.email as p_email, p.role::text as p_role,
           a.full_name as a_name,
           (select count(*)::int from messages m where m.conversation_id = c.id and m.sender_id = c.external_user_id
              and m.created_at > coalesce((select last_read_at from message_read_states rs
                                           where rs.conversation_id = c.id and rs.user_id = auth.uid()), '-infinity')) as unread_n
    from conversations c
    left join events e on e.id = c.related_session_id
    left join profiles p on p.id = c.external_user_id
    left join profiles a on a.id = c.assigned_admin_id
    where c.conversation_type <> 'general'
      and (p_type is null or c.conversation_type = p_type)
      and (p_event_id is null or c.related_session_id = p_event_id)
      and (p_status is null or c.status::text = p_status)
      and (p_search is null or p.full_name ilike '%' || p_search || '%' or p.email ilike '%' || p_search || '%'
           or c.subject ilike '%' || p_search || '%')
  )
  select b.id, b.subject, b.conversation_type, b.status, b.related_session_id, b.ev_name,
         b.external_user_id, b.p_name, b.p_email, b.p_role, b.a_name,
         b.last_message_at, b.last_message_preview, b.unread_n, count(*) over ()
  from base b
  where not p_unread_only or b.unread_n > 0
  order by coalesce(b.last_message_at, b.created_at) desc
  limit least(greatest(p_limit, 1), 100) offset greatest(p_offset, 0);
end;
$$;

grant execute on function my_notifications(int, timestamptz, boolean), submit_requirement(uuid, text),
  admin_conversations(text, uuid, text, text, boolean, int, int), portal_announcements(int) to authenticated;

create or replace function guard_event_task_status()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if is_staff_or_admin() then
    return new;
  end if;
  if new.assignment_id is distinct from old.assignment_id
     or new.title is distinct from old.title
     or new.description is distinct from old.description
     or new.priority is distinct from old.priority
     or new.due_at is distinct from old.due_at then
    raise exception 'Only staff/admin can change task details.';
  end if;
  return new;
end;
$$;

create or replace function create_pending_booking(
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

create or replace function portal_path(p_role user_role)
returns text
language sql immutable
as $$
  select case p_role
    when 'artist' then '/artist/dashboard'
    when 'sponsor' then '/sponsor/dashboard'
    when 'vendor' then '/vendor/dashboard'
    when 'venue' then '/venue/dashboard'
    when 'volunteer' then '/volunteer/dashboard'
    when 'crew' then '/crew/dashboard'
    when 'staff' then '/admin'
    when 'admin' then '/admin'
    when 'super_admin' then '/admin'
    else '/dashboard'
  end;
$$;

create or replace function notify_on_requirement()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_role user_role;
  v_event text;
begin
  select role into v_role from profiles where id = new.user_id;
  select name into v_event from events where id = new.event_id;
  if tg_op = 'INSERT' then
    perform notify(new.user_id, 'requirement.requested', 'Tangy needs: ' || new.title, v_event,
      portal_path(v_role) || '?tab=requirements', new.event_id);
  elsif new.status = 'submitted' and old.status is distinct from 'submitted' then
    perform notify_permission_holders('events.manage', 'requirement.submitted',
      'Response received: ' || new.title, v_event, '/admin/events/' || new.event_id || '?tab=requirements', new.event_id);
  elsif new.status in ('accepted', 'changes_requested') and old.status = 'submitted' then
    perform notify(new.user_id, 'requirement.reviewed',
      case when new.status = 'accepted' then 'Accepted: ' else 'Changes requested: ' end || new.title,
      new.review_note, portal_path(v_role) || '?tab=requirements', new.event_id);
  end if;
  return new;
end;
$$;

create or replace function notify_on_announcement()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  r record;
begin
  if new.status <> 'published' or new.publish_at > now()
     or (tg_op = 'UPDATE' and old.status = 'published') then
    return new;
  end if;
  if new.audience not in ('staff', 'sponsor', 'vendor', 'venue', 'volunteer', 'crew', 'artist', 'members') then
    return new; -- public/editorial announcements use the site overlay, not notifications
  end if;
  for r in
    select distinct p.id, p.role from profiles p
    where p.is_active and (
      (new.event_id is null and p.role::text = new.audience)
      or (new.event_id is not null and (
            (new.audience = 'members' and event_member_kind(new.event_id, p.id) is not null)
         or event_member_kind(new.event_id, p.id) = new.audience))
    )
    limit 2000
  loop
    perform notify(r.id, 'announcement.published', new.title, left(new.body, 200),
      case when r.role in ('staff', 'admin', 'super_admin') then '/admin/announcements' else portal_path(r.role) || '?tab=announcements' end,
      new.event_id);
  end loop;
  return new;
end;
$$;

-- Restore 0018's my_portal_events
drop function if exists my_portal_events(boolean);
create or replace function my_portal_events(p_include_past boolean default false)
returns table (
  event_id uuid, name text, event_date date, event_time text, end_time text, event_status text,
  image_url text, description text, venue_name text, venue_address text, venue_city text,
  member_kind text, responsibility text, assignment_id uuid, assignment_status text,
  call_time timestamptz, starts_at timestamptz, ends_at timestamptz, soundcheck_at timestamptz,
  instructions text, hospitality text, travel text, fee_amount integer, fee_status text,
  open_requirements integer, tangy_contact text
)
language sql stable security definer set search_path = public
as $$
  with mine as (
    select ea.event_id, 'artist'::text as kind, 'Performing artist'::text as resp, null::uuid as asg_id, 'confirmed'::text as asg_status,
           d.call_time, d.performance_start as starts_at, d.performance_end as ends_at, d.soundcheck_at,
           d.instructions, d.hospitality, d.travel, d.fee_amount, coalesce(d.fee_status, 'not_applicable') as fee_status
    from event_artists ea
    join artists a on a.id = ea.artist_id and a.user_id = auth.uid() and a.status = 'approved'
    left join event_artist_details d on d.event_id = ea.event_id and d.artist_id = ea.artist_id
    union all
    select x.event_id, x.assignee_role, x.title, x.id, x.status::text, x.call_time, x.starts_at, x.ends_at, null,
           x.instructions, null, null, x.fee_amount, x.fee_status
    from event_assignments x
    where x.assignee_id = auth.uid() and x.status <> 'declined'
    union all
    select e.id, 'venue', 'Venue host', null, 'confirmed', null, null, null, null, null, null, null, null, 'not_applicable'
    from events e left join venues v on v.id = e.venue_id
    where e.venue_partner_id = auth.uid() or v.partner_profile_id = auth.uid()
    union all
    select distinct sd.event_id, 'sponsor', 'Sponsor', null::uuid, 'confirmed', null::timestamptz, null::timestamptz, null::timestamptz,
           null::timestamptz, null, null, null, null::int, 'not_applicable'
    from sponsor_deliverables sd
    where sd.sponsor_profile_id = auth.uid() and sd.event_id is not null
      and not exists (select 1 from event_assignments x where x.event_id = sd.event_id and x.assignee_id = auth.uid()
                      and x.assignee_role = 'sponsor' and x.status <> 'declined')
  )
  select e.id, e.name, e.event_date, e.event_time, e.end_time, e.status, e.image_url, e.description,
         coalesce(v.name, e.venue), v.address, v.city,
         m.kind, m.resp, m.asg_id, m.asg_status, m.call_time, m.starts_at, m.ends_at, m.soundcheck_at,
         m.instructions, m.hospitality, m.travel, m.fee_amount, m.fee_status,
         (select count(*)::int from event_requirements r where r.event_id = e.id and r.user_id = auth.uid()
            and r.status in ('requested', 'changes_requested')),
         (select coalesce(p.full_name, 'Tangy team') from profiles p where p.id = e.created_by)
  from mine m
  join events e on e.id = m.event_id
  left join venues v on v.id = e.venue_id
  where exists (select 1 from profiles where id = auth.uid() and is_active)
    and (p_include_past or e.event_date >= current_date - 1)
  order by e.event_date, e.name;
$$;
grant execute on function my_portal_events(boolean) to authenticated;

-- Restore 0008's respond_to_assignment_request (as originally written)
create or replace function respond_to_assignment_request(p_request_id uuid, p_accept boolean)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_req assignment_requests%rowtype;
begin
  select * into v_req from assignment_requests where id = p_request_id;
  if v_req.id is null then
    raise exception 'Assignment request not found.';
  end if;
  if v_req.status <> 'pending' then
    raise exception 'This request has already been responded to.';
  end if;
  if not exists (select 1 from artists where id = v_req.artist_id and user_id = auth.uid()) then
    raise exception 'Not authorized to respond to this request.';
  end if;

  update assignment_requests
    set status = case when p_accept then 'accepted' else 'declined' end,
        responded_at = now()
    where id = p_request_id;

  if p_accept then
    insert into event_artists (event_id, artist_id) values (v_req.session_id, v_req.artist_id)
      on conflict do nothing;
  end if;

  if v_req.conversation_id is not null then
    insert into messages (conversation_id, sender_id, content, message_type)
      values (v_req.conversation_id, auth.uid(),
        case when p_accept then 'Accepted the assignment request.' else 'Declined the assignment request.' end,
        'system');
  end if;
end;
$$;

-- Rows that only exist for 0020 features, then columns/constraints
update bookings set status = 'cancelled', cancel_reason = coalesce(cancel_reason, 'Checkout hold expired') where status = 'expired';
update assignment_requests set status = 'cancelled' where status = 'expired';
alter table bookings drop constraint if exists bookings_payment_status_check;
alter table bookings drop column if exists payment_status, drop column if exists payment_updated_at,
  drop column if exists refunded_amount, drop column if exists expired_at;
drop index if exists bookings_pending_created_idx;
alter table payment_webhook_events drop column if exists processing_error, drop column if exists processed_at;

alter table conversations drop constraint if exists conversations_priority_check;
alter table conversations drop column if exists priority;

alter table notifications drop constraint if exists notifications_category_check;
alter table notifications drop constraint if exists notifications_priority_check;
drop index if exists notifications_user_category_idx;
alter table notifications drop column if exists category, drop column if exists priority;

alter table temporary_access drop column if exists expiring_notified_at;

delete from event_tasks where assignment_id is null;
update event_tasks set status = 'pending' where status = 'blocked';
update event_tasks set priority = 'high' where priority = 'urgent';
alter table event_tasks drop constraint if exists event_tasks_status_check;
alter table event_tasks add constraint event_tasks_status_check check (status in ('pending', 'in_progress', 'done'));
alter table event_tasks drop constraint if exists event_tasks_priority_check;
alter table event_tasks add constraint event_tasks_priority_check check (priority in ('low', 'normal', 'high'));
alter table event_tasks drop constraint if exists event_tasks_team_check;
drop index if exists event_tasks_event_idx;
alter table event_tasks alter column assignment_id set not null;
alter table event_tasks drop column if exists event_id, drop column if exists team, drop column if exists created_by,
  drop column if exists completed_by, drop column if exists completed_at, drop column if exists overdue_notified_at;

update announcements set target_team = null where target_team is not null;
alter table announcements drop constraint if exists announcements_target_team_check;
alter table announcements drop column if exists target_team;

alter table event_assignments drop constraint if exists event_assignments_team_check;
alter table event_assignments drop column if exists setup_at, drop column if exists breakdown_at, drop column if exists loading_access,
  drop column if exists venue_access, drop column if exists onsite_contact, drop column if exists team, drop column if exists package;
alter table venues drop column if exists access_info, drop column if exists parking, drop column if exists loading_bay,
  drop column if exists setup_notes, drop column if exists map_url;

alter table sponsor_deliverables drop constraint if exists sponsor_deliverables_kind_check;
alter table sponsor_deliverables drop column if exists kind, drop column if exists completed_at, drop column if exists proof_url;

delete from event_documents where storage_path is not null;
alter table event_documents drop constraint if exists event_documents_source_check;
alter table event_documents drop constraint if exists event_documents_storage_path_check;
alter table event_documents drop constraint if exists event_documents_category_check;
alter table event_documents alter column url set not null;
alter table event_documents drop column if exists description, drop column if exists category, drop column if exists storage_path,
  drop column if exists file_name, drop column if exists file_size_bytes, drop column if exists expires_at;

update event_requirements set status = 'accepted' where status = 'closed';
alter table event_requirements drop constraint if exists event_requirements_status_check;
alter table event_requirements add constraint event_requirements_status_check
  check (status in ('requested', 'submitted', 'accepted', 'changes_requested'));
alter table event_requirements drop constraint if exists event_requirements_priority_check;
alter table event_requirements drop column if exists priority, drop column if exists attachment_path,
  drop column if exists closed_at, drop column if exists closed_by;

alter table assignment_requests drop column if exists proposed_start, drop column if exists proposed_end,
  drop column if exists fee_offer, drop column if exists expires_at, drop column if exists decline_reason;

alter table artist_media drop constraint if exists artist_media_status_check;
update artist_media set status = case when status in ('approved', 'rejected') then status when status = 'archived' then 'rejected' else 'pending' end;
alter table artist_media alter column status set default 'pending';
alter table artist_media add constraint artist_media_status_check check (status in ('pending', 'approved', 'rejected'));
create trigger guard_artist_media_status before insert or update on artist_media
  for each row execute function prevent_artist_media_self_approval();
alter table artist_media drop constraint if exists artist_media_media_type_check;
alter table artist_media drop column if exists media_type, drop column if exists mime_type, drop column if exists title,
  drop column if exists review_note, drop column if exists reviewed_by, drop column if exists reviewed_at;

alter table event_artist_details drop column if exists wrap_at, drop column if exists accommodation, drop column if exists meals,
  drop column if exists green_room, drop column if exists rider_notes, drop column if exists pickup, drop column if exists dropoff,
  drop column if exists hotel, drop column if exists transport_notes;

alter table artists drop column if exists stage_name, drop column if exists subgenre, drop column if exists youtube,
  drop column if exists performance_type;
alter table events drop column if exists timezone, drop column if exists doors_at;

delete from system_settings where key in ('bookings.pending_timeout_minutes', 'notifications.event_reminder_hours', 'artists.request_default_days');

commit;
