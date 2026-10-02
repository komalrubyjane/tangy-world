-- Rollback for 0034_event_artist_workflow.sql. Restores the 0033 definitions of
-- every function 0034 replaced and the original conversation policies, and
-- drops the workflow functions, triggers and columns. Private Super Admin ↔
-- artist conversations are DELETED (export them first if they must be kept):
-- the conversation type they use no longer exists afterwards. Line-up
-- performance order / type / set length / notes, event categories and page
-- backgrounds are dropped.
begin;

drop trigger if exists event_artists_notify_removed on event_artists;
drop trigger if exists events_notify_publish on events;

-- Conversation policies as they were (0008).
drop policy if exists "conversations: participant or staff read" on conversations;
drop policy if exists "conversations: staff/admin update" on conversations;
drop policy if exists "conversations: creator or staff insert" on conversations;
drop policy if exists "participants: self or staff read" on conversation_participants;
drop policy if exists "participants: staff/admin manage" on conversation_participants;
drop policy if exists "messages: participant or staff read" on messages;
drop policy if exists "messages: participant or staff insert" on messages;
create policy "participants: self or staff read" on conversation_participants for select using (((user_id = auth.uid()) OR is_staff_or_admin()));
create policy "participants: staff/admin manage" on conversation_participants for all using (is_staff_or_admin());
create policy "conversations: creator or staff insert" on conversations for insert with check ((((created_by = auth.uid()) AND (conversation_type = 'general'::text) AND (external_user_id IS NULL)) OR is_staff_or_admin()));
create policy "conversations: participant or staff read" on conversations for select using ((is_participant(id) OR is_staff_or_admin()));
create policy "conversations: staff/admin update" on conversations for update using (is_staff_or_admin());
create policy "messages: participant or staff insert" on messages for insert with check (((sender_id = auth.uid()) AND (is_participant(conversation_id) OR is_staff_or_admin())));
create policy "messages: participant or staff read" on messages for select using ((is_participant(conversation_id) OR is_staff_or_admin()));

delete from conversations where conversation_type = 'artist_private';
alter table conversations drop constraint if exists conversations_conversation_type_check;
alter table conversations add constraint conversations_conversation_type_check check ((conversation_type = ANY (ARRAY['general'::text, 'artist_support'::text, 'sponsor_support'::text, 'vendor_support'::text, 'venue_support'::text])));

-- Functions as they were before 0034.
CREATE OR REPLACE FUNCTION public.notification_meta(p_type text)
 RETURNS TABLE(category text, pref text, priority text, email boolean, critical boolean)
 LANGUAGE sql
 IMMUTABLE
AS $function$
  with m as (
    select v.category, v.pref, v.priority, v.email, v.critical
    from (values
    ('message.new',             'messages',     'messages',             'normal',    true,  false),
    ('booking.requested',       'events',       'booking_requests',     'important', true,  false),
    ('booking.accepted',        'events',       'booking_requests',     'normal',    true,  false),
    ('booking.declined',        'events',       'booking_requests',     'normal',    true,  false),
    ('booking.expired',         'events',       'booking_requests',     'normal',    false, false),
    ('assignment.new',          'events',       'event_updates',        'normal',    true,  false),
    ('schedule.changed',        'events',       'schedule_changes',     'important', true,  false),
    ('event.updated',           'events',       'event_updates',        'important', true,  false),
    ('event.cancelled',         'events',       'event_updates',        'urgent',    true,  true),
    ('event.reminder',          'events',       'event_reminders',      'important', true,  false),
    ('announcement.published',  'events',       'announcements',        'normal',    true,  false),
    ('document.added',          'events',       'document_updates',     'normal',    true,  false),
    ('requirement.requested',   'requirements', 'requirement_requests', 'important', true,  false),
    ('requirement.submitted',   'requirements', 'requirement_reviews',  'normal',    true,  false),
    ('requirement.reviewed',    'requirements', 'requirement_reviews',  'important', true,  false),
    ('task.assigned',           'tasks',        'tasks',                'normal',    false, false),
    ('task.overdue',            'tasks',        'tasks',                'important', false, false),
    ('access.granted',          'events',       'access',               'important', true,  false),
    ('access.revoked',          'events',       'access',               'important', true,  true),
    ('access.expiring',         'events',       'access',               'important', false, false),
    ('access.requested',        'events',       'access',               'normal',    true,  false),
    ('access.declined',         'events',       'access',               'normal',    false, false),
    ('application.new',         'applications', 'applications',         'normal',    true,  false),
    ('application.approved',    'applications', 'applications',         'important', false, true),
    ('application.rejected',    'applications', 'applications',         'normal',    false, true),
    ('application.received',    'applications', 'applications',         'normal',    true,  true),
    ('enquiry.new',             'applications', 'applications',         'normal',    true,  false),
    ('media.reviewed',          'events',       'document_updates',     'normal',    false, false),
    ('media.submitted',         'events',       'document_updates',     'normal',    false, false),
    ('asset.submitted',         'events',       'document_updates',     'normal',    false, false),
    ('asset.reviewed',          'events',       'document_updates',     'normal',    true,  false),
    ('invoice.issued',          'payments',     'payment_updates',      'normal',    true,  false),
    ('invoice.paid',            'payments',     'payment_updates',      'normal',    true,  false),
    ('booking_payment.expired', 'payments',     'payment_updates',      'normal',    false, false),
    ('payment.late',            'payments',     'payment_updates',      'urgent',    true,  true),
    ('payment.review',          'payments',     'payment_updates',      'urgent',    true,  true),
    ('payment.webhook_failed',  'payments',     'payment_updates',      'urgent',    true,  true),
    ('waitlist.joined',         'events',       'event_updates',        'normal',    true,  true),
    ('waitlist.offer',          'events',       'event_updates',        'urgent',    true,  true),
    ('waitlist.offer_expired',  'events',       'event_updates',        'important', true,  true),
    ('waitlist.converted',      'events',       'event_updates',        'normal',    false, true)
  ) v(t, category, pref, priority, email, critical)
    where v.t = p_type
  )
  select * from m
  union all
  select 'system', 'system', 'normal', false, false where not exists (select 1 from m);
$function$;

CREATE OR REPLACE FUNCTION public.create_artist_request(p_event_id uuid, p_artist_id uuid, p_details jsonb DEFAULT '{}'::jsonb, p_send boolean DEFAULT true)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_id uuid;
  d jsonb := coalesce(p_details, '{}'::jsonb);
begin
  if not has_permission('events.manage') then
    raise exception 'You do not have permission to send booking requests.' using errcode = '42501';
  end if;
  if not exists (select 1 from artists where id = p_artist_id and status = 'approved' and user_id is not null) then
    raise exception 'Booking requests can only go to approved artists with an account.';
  end if;
  if exists (select 1 from events where id = p_event_id and status = 'cancelled') then
    raise exception 'This event is cancelled.';
  end if;
  if (d ->> 'proposed_end') is not null and (d ->> 'proposed_start') is not null and (d ->> 'proposed_end')::timestamptz <= (d ->> 'proposed_start')::timestamptz then
    raise exception 'The set must end after it starts.';
  end if;
  insert into assignment_requests (session_id, artist_id, requested_by, status, message, proposed_start, proposed_end, fee_offer, expires_at,
                                   performance_type, set_minutes, sets_count, call_time, soundcheck_at, technical_notes, hospitality_notes)
  values (p_event_id, p_artist_id, auth.uid(), case when p_send then 'pending' else 'draft' end::assignment_status,
          nullif(trim(coalesce(d ->> 'message', '')), ''),
          (d ->> 'proposed_start')::timestamptz, (d ->> 'proposed_end')::timestamptz, (d ->> 'fee_offer')::int,
          coalesce((d ->> 'expires_at')::timestamptz, now() + make_interval(days => setting_number('artists.request_default_days', 7)::int)),
          nullif(d ->> 'performance_type', ''), (d ->> 'set_minutes')::int, (d ->> 'sets_count')::int,
          (d ->> 'call_time')::timestamptz, (d ->> 'soundcheck_at')::timestamptz,
          nullif(trim(coalesce(d ->> 'technical_notes', '')), ''), nullif(trim(coalesce(d ->> 'hospitality_notes', '')), ''))
  returning id into v_id;
  perform audit_write(case when p_send then 'booking.request_sent' else 'booking.request_drafted' end, 'booking_request', v_id::text,
    jsonb_build_object('event_id', p_event_id, 'artist_id', p_artist_id));
  return v_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.respond_to_booking_request(p_request_id uuid, p_accept boolean, p_reason text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_req assignment_requests%rowtype;
begin
  perform expire_booking_requests();
  select * into v_req from assignment_requests where id = p_request_id for update;
  if v_req.id is null or not exists (select 1 from artists where id = v_req.artist_id and user_id = auth.uid()) then
    raise exception 'Request not found.';
  end if;
  if v_req.status = 'expired' then
    raise exception 'This request has expired. Message Tangy if you are still available.';
  end if;
  if v_req.status <> 'pending' then
    raise exception 'This request has already been answered.';
  end if;
  perform respond_to_assignment_request(p_request_id, p_accept);
  update assignment_requests set decline_reason = case when p_accept then null else nullif(trim(coalesce(p_reason, '')), '') end
    where id = p_request_id;
  if p_accept and v_req.proposed_start is not null then
    insert into event_artist_details (event_id, artist_id, performance_start, performance_end)
    values (v_req.session_id, v_req.artist_id, v_req.proposed_start, v_req.proposed_end)
    on conflict (event_id, artist_id) do update
      set performance_start = coalesce(event_artist_details.performance_start, excluded.performance_start),
          performance_end = coalesce(event_artist_details.performance_end, excluded.performance_end);
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.notify_on_event_artist()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user uuid;
  v_event events%rowtype;
begin
  select user_id into v_user from artists where id = new.artist_id;
  select * into v_event from events where id = new.event_id;
  perform notify(v_user, 'assignment.new', 'You''re on the lineup for ' || v_event.name,
    to_char(v_event.event_date, 'DD Mon YYYY') || coalesce(' · ' || v_event.venue, ''), '/artist/dashboard', new.event_id);
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.notify_on_event_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  r record;
  v_cancel boolean := new.status = 'cancelled' and old.status is distinct from 'cancelled';
begin
  if not v_cancel and new.event_date is not distinct from old.event_date and new.event_time is not distinct from old.event_time
     and new.end_time is not distinct from old.end_time and new.venue is not distinct from old.venue
     and new.venue_id is not distinct from old.venue_id and new.doors_at is not distinct from old.doors_at then
    return new;
  end if;
  for r in select * from event_member_ids(new.id) limit 2000 loop
    perform notify(r.user_id,
      case when v_cancel then 'event.cancelled' else 'event.updated' end,
      case when v_cancel then new.name || ' has been cancelled' else new.name || ' — details changed' end,
      case when v_cancel then 'Tangy will be in touch about next steps.'
           else concat_ws(' · ', to_char(new.event_date, 'DD Mon YYYY'), new.event_time, coalesce(new.venue, 'Venue TBC')) end,
      member_link(r.user_id, '?tab=events'), new.id);
  end loop;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.notify_on_booking_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user uuid;
  v_artist text;
  v_event events%rowtype;
begin
  select user_id, coalesce(stage_name, name) into v_user, v_artist from artists where id = new.artist_id;
  select * into v_event from events where id = new.session_id;
  if (tg_op = 'INSERT' and new.status = 'pending') or (tg_op = 'UPDATE' and old.status = 'draft' and new.status = 'pending') then
    perform notify(v_user, 'booking.requested', 'New session request: ' || v_event.name,
      concat_ws(' · ', to_char(v_event.event_date, 'DD Mon YYYY'), v_event.venue, left(new.message, 120)), '/artist/requests/' || new.id, new.session_id);
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    if new.status in ('accepted', 'declined', 'expired') then
      perform notify(new.requested_by,
        case new.status when 'accepted' then 'booking.accepted' when 'declined' then 'booking.declined' else 'booking.expired' end,
        v_artist || case new.status when 'accepted' then ' accepted ' when 'declined' then ' declined ' else ' did not answer ' end || v_event.name,
        new.decline_reason, '/admin-portal/events/' || new.session_id || '?tab=artists', new.session_id);
    elsif new.status = 'confirmed' then
      perform notify(v_user, 'booking.confirmed', 'Confirmed: ' || v_event.name, to_char(v_event.event_date, 'DD Mon YYYY'), '/artist/sessions/' || new.session_id, new.session_id);
    elsif new.status = 'cancelled' and old.status <> 'draft' then
      perform notify(v_user, 'booking.cancelled', 'Cancelled: ' || v_event.name, new.cancel_reason, '/artist/requests/' || new.id, new.session_id);
    end if;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.notify_on_artist_schedule()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user uuid;
  v_event text;
begin
  if tg_op = 'UPDATE' and new.call_time is not distinct from old.call_time and new.soundcheck_at is not distinct from old.soundcheck_at
     and new.performance_start is not distinct from old.performance_start and new.performance_end is not distinct from old.performance_end
     and new.wrap_at is not distinct from old.wrap_at and new.hotel is not distinct from old.hotel
     and new.pickup is not distinct from old.pickup and new.dropoff is not distinct from old.dropoff then
    return new;
  end if;
  if tg_op = 'INSERT' and new.call_time is null and new.performance_start is null and new.soundcheck_at is null then
    return new;
  end if;
  select a.user_id into v_user from artists a where a.id = new.artist_id;
  select name into v_event from events where id = new.event_id;
  perform notify(v_user, 'schedule.changed', 'Schedule updated: ' || v_event,
    concat_ws(' · ',
      'Performance ' || to_char(new.performance_start at time zone 'Asia/Kolkata', 'DD Mon, HH12:MI AM'),
      'Call ' || to_char(new.call_time at time zone 'Asia/Kolkata', 'HH12:MI AM'),
      'Soundcheck ' || to_char(new.soundcheck_at at time zone 'Asia/Kolkata', 'HH12:MI AM')),
    '/artist/calendar', new.event_id);
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.on_message_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_conv conversations%rowtype;
  v_sender profiles%rowtype;
  v_sender_is_admin boolean;
  r record;
  v_has_admin boolean;
begin
  update conversations
    set last_message_at = new.created_at,
        last_message_preview = left(regexp_replace(new.content, '\s+', ' ', 'g'), 140),
        updated_at = now()
    where id = new.conversation_id
    returning * into v_conv;
  if v_conv.conversation_type = 'general' or new.message_type = 'system' then
    return new;
  end if;

  select * into v_sender from profiles where id = new.sender_id;
  v_sender_is_admin := exists (select 1 from role_permissions where role = v_sender.role and permission = 'messages.manage');

  insert into audit_logs (actor_id, actor_email, actor_role, action, resource_type, resource_id, event_id, metadata)
  values (new.sender_id, v_sender.email, v_sender.role::text, 'message.sent', 'conversation', new.conversation_id::text,
          v_conv.related_session_id, jsonb_build_object('conversation_type', v_conv.conversation_type, 'message_id', new.id, 'length', length(new.content)));

  v_has_admin := false;
  for r in
    select cp.user_id, p.role from conversation_participants cp join profiles p on p.id = cp.user_id
    where cp.conversation_id = new.conversation_id and cp.user_id <> new.sender_id
  loop
    if exists (select 1 from role_permissions where role = r.role and permission = 'messages.manage') then
      v_has_admin := true;
      perform notify(r.user_id, 'message.new', 'New message from ' || coalesce(v_sender.full_name, v_sender.email),
        left(new.content, 140), '/admin/messages?c=' || new.conversation_id, v_conv.related_session_id);
    else
      perform notify(r.user_id, 'message.new', 'New message from Tangy', left(new.content, 140),
        portal_path(r.role) || '?tab=messages&c=' || new.conversation_id, v_conv.related_session_id);
    end if;
  end loop;

  -- A partner message nobody on the Tangy side has picked up yet goes to every messages.manage holder.
  if not v_sender_is_admin and not v_has_admin then
    perform notify_permission_holders('messages.manage', 'message.new',
      'New message from ' || coalesce(v_sender.full_name, v_sender.email),
      left(new.content, 140), '/admin/messages?c=' || new.conversation_id, v_conv.related_session_id);
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.admin_set_user_role(p_user_id uuid, p_role user_role, p_reason text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_old user_role;
begin
  if not has_permission('roles.manage') then
    raise exception 'Only a super admin can change roles.';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'You cannot change your own role.';
  end if;
  select role into v_old from profiles where id = p_user_id for update;
  if v_old is null then
    raise exception 'User not found.';
  end if;
  if v_old = p_role then
    return;
  end if;
  if v_old = 'super_admin' and (select count(*) from profiles where role = 'super_admin' and is_active) <= 1 then
    raise exception 'Cannot demote the last active super admin.';
  end if;

  update profiles set role = p_role where id = p_user_id;
  perform audit_write('user.role_changed', 'user', p_user_id::text,
    jsonb_build_object('from', v_old, 'to', p_role, 'reason', p_reason));
end;
$function$;

CREATE OR REPLACE FUNCTION public.run_platform_jobs(p_source text DEFAULT 'scheduler'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_run bigint;
  v_result jsonb;
begin
  -- One run at a time: an overlapping invocation is recorded and skipped.
  if not pg_try_advisory_xact_lock(hashtext('tangy.run_platform_jobs')) then
    insert into platform_job_runs (source, skipped, finished_at, result) values (left(coalesce(p_source, 'scheduler'), 40), true, now(), '{"skipped": "another run in progress"}');
    return jsonb_build_object('skipped', true);
  end if;
  insert into platform_job_runs (source) values (left(coalesce(p_source, 'scheduler'), 40)) returning id into v_run;
  v_result := jsonb_build_object(
    'bookings_expired', expire_stale_bookings(),
    'waitlist_offers_expired', expire_waitlist_offers(),
    'requests_expired', expire_booking_requests(),
    'reminders', send_event_reminders(),
    'overdue_tasks', notify_overdue_tasks(),
    'expiring_access', notify_expiring_access(),
    'access_expiry_logged', log_expired_access());
  update platform_job_runs set finished_at = now(), result = v_result where id = v_run;
  return v_result;
end;
$function$;

CREATE OR REPLACE FUNCTION public.admin_conversations(p_type text DEFAULT NULL::text, p_event_id uuid DEFAULT NULL::uuid, p_status text DEFAULT NULL::text, p_search text DEFAULT NULL::text, p_unread_only boolean DEFAULT false, p_limit integer DEFAULT 30, p_offset integer DEFAULT 0, p_assigned text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, subject text, conversation_type text, status conversation_status, priority text, event_id uuid, event_name text, partner_id uuid, partner_name text, partner_email text, partner_role text, assigned_admin_id uuid, assigned_admin_name text, last_message_at timestamp with time zone, last_message_preview text, last_partner_message_at timestamp with time zone, last_tangy_reply_at timestamp with time zone, unread integer, total_count bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not has_permission('messages.manage') then
    raise exception 'You do not have permission to view messages.';
  end if;
  return query
  with base as (
    select c.*, e.name as ev_name, p.full_name as p_name, p.email as p_email, p.role::text as p_role,
           a.full_name as a_name,
           (select max(m.created_at) from messages m where m.conversation_id = c.id and m.sender_id = c.external_user_id) as last_partner,
           (select max(m.created_at) from messages m where m.conversation_id = c.id and m.sender_id <> c.external_user_id) as last_tangy,
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
      and (p_status is null or c.status::text = p_status or (p_status = 'active' and c.status in ('open', 'pending')))
      and (p_assigned is null or (p_assigned = 'me' and c.assigned_admin_id = auth.uid()) or (p_assigned = 'none' and c.assigned_admin_id is null))
      and (p_search is null or p.full_name ilike '%' || p_search || '%' or p.email ilike '%' || p_search || '%'
           or c.subject ilike '%' || p_search || '%' or e.name ilike '%' || p_search || '%')
  )
  select b.id, b.subject, b.conversation_type, b.status, b.priority, b.related_session_id, b.ev_name,
         b.external_user_id, b.p_name, b.p_email, b.p_role, b.assigned_admin_id, b.a_name,
         b.last_message_at, b.last_message_preview, b.last_partner, b.last_tangy, b.unread_n, count(*) over ()
  from base b
  where not p_unread_only or b.unread_n > 0
  order by (b.priority = 'urgent') desc, (b.priority = 'high') desc, coalesce(b.last_message_at, b.created_at) desc
  limit least(greatest(p_limit, 1), 100) offset greatest(p_offset, 0);
end;
$function$;

CREATE OR REPLACE FUNCTION public.conversation_messages(p_conversation_id uuid, p_limit integer DEFAULT 100, p_before timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS TABLE(id uuid, sender_id uuid, sender_name text, from_tangy boolean, is_mine boolean, content text, message_type text, created_at timestamp with time zone, read_by_other boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_conv conversations%rowtype;
begin
  select * into v_conv from conversations where conversations.id = p_conversation_id;
  if v_conv.id is null or not (is_participant(p_conversation_id)
                               or (has_permission('messages.manage') and v_conv.conversation_type <> 'general')) then
    raise exception 'Conversation not found.';
  end if;
  return query
  select x.* from (
    select m.id, m.sender_id,
           case when m.sender_id = v_conv.external_user_id then coalesce(p.full_name, p.email)
                else coalesce(p.full_name, 'Tangy team') end,
           m.sender_id is distinct from v_conv.external_user_id,
           m.sender_id = auth.uid(),
           m.content, m.message_type, m.created_at,
           exists (select 1 from message_read_states rs
                   where rs.conversation_id = p_conversation_id and rs.user_id <> m.sender_id and rs.last_read_at >= m.created_at)
    from messages m left join profiles p on p.id = m.sender_id
    where m.conversation_id = p_conversation_id and (p_before is null or m.created_at < p_before)
    order by m.created_at desc
    limit least(greatest(p_limit, 1), 200)
  ) x order by x.created_at;
end;
$function$;

CREATE OR REPLACE FUNCTION public.send_message(p_conversation_id uuid, p_body text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_conv conversations%rowtype;
  v_admin boolean := has_permission('messages.manage');
  v_msg uuid;
begin
  select * into v_conv from conversations where id = p_conversation_id for update;
  if v_conv.id is null or not (is_participant(p_conversation_id) or (v_admin and v_conv.conversation_type <> 'general')) then
    raise exception 'Conversation not found.';
  end if;
  if length(trim(coalesce(p_body, ''))) not between 1 and 4000 then
    raise exception 'Messages must be between 1 and 4000 characters.';
  end if;
  if v_conv.status = 'closed' and not v_admin then
    raise exception 'This conversation is closed. Start a new message to reach Tangy.';
  end if;
  if v_admin and not is_participant(p_conversation_id) then
    insert into conversation_participants (conversation_id, user_id, role) values (p_conversation_id, auth.uid(), 'admin')
    on conflict do nothing;
  end if;
  insert into messages (conversation_id, sender_id, content) values (p_conversation_id, auth.uid(), trim(p_body))
  returning id into v_msg;
  update conversations
    set status = case when v_admin then 'pending'::conversation_status else 'open'::conversation_status end,
        assigned_admin_id = case when v_admin then coalesce(assigned_admin_id, auth.uid()) else assigned_admin_id end
    where id = p_conversation_id;
  return v_msg;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_conversation_status(p_conversation_id uuid, p_status conversation_status)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not has_permission('messages.manage') then
    raise exception 'You do not have permission to manage conversations.';
  end if;
  update conversations set status = p_status where id = p_conversation_id and conversation_type <> 'general';
  if not found then
    raise exception 'Conversation not found.';
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_conversation_meta(p_conversation_id uuid, p_priority text DEFAULT NULL::text, p_assign_to_me boolean DEFAULT NULL::boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not has_permission('messages.manage') then
    raise exception 'You do not have permission to manage conversations.';
  end if;
  update conversations
    set priority = coalesce(p_priority, priority),
        assigned_admin_id = case when p_assign_to_me is true then auth.uid() when p_assign_to_me is false then null else assigned_admin_id end
    where id = p_conversation_id and conversation_type <> 'general';
  if not found then
    raise exception 'Conversation not found.';
  end if;
  if p_assign_to_me is true then
    insert into conversation_participants (conversation_id, user_id, role) values (p_conversation_id, auth.uid(), 'admin')
    on conflict do nothing;
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.mark_conversation_read(p_conversation_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not (is_participant(p_conversation_id) or has_permission('messages.manage')) then
    raise exception 'Conversation not found.';
  end if;
  insert into message_read_states (conversation_id, user_id, last_read_at)
  values (p_conversation_id, auth.uid(), now())
  on conflict (conversation_id, user_id) do update set last_read_at = now();
  update notifications set read_at = now()
    where user_id = auth.uid() and read_at is null and type = 'message.new'
      and link like '%' || p_conversation_id::text;
end;
$function$;

CREATE OR REPLACE FUNCTION public.assign_conversation(p_conversation_id uuid, p_admin_id uuid DEFAULT auth.uid())
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not is_staff_or_admin() then
    raise exception 'Only staff/admin can assign conversations.';
  end if;
  update conversations set assigned_admin_id = p_admin_id, status = 'pending'
    where id = p_conversation_id;
  insert into conversation_participants (conversation_id, user_id, role)
    values (p_conversation_id, p_admin_id, 'admin')
    on conflict (conversation_id, user_id) do nothing;
end;
$function$;

CREATE OR REPLACE FUNCTION public.reopen_conversation(p_conversation_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not exists (
    select 1 from conversations
    where id = p_conversation_id and (created_by = auth.uid() or is_staff_or_admin())
  ) then
    raise exception 'Not authorized to reopen this conversation.';
  end if;
  update conversations set status = 'open' where id = p_conversation_id;
end;
$function$;

revoke execute on function run_platform_jobs(text) from public, anon, authenticated;

drop function if exists start_private_artist_conversation(uuid, text, text);
drop function if exists send_custom_notification(uuid, text, text, text);
drop function if exists save_event_lineup(uuid, jsonb);
drop function if exists update_event_artist(uuid, uuid, jsonb);
drop function if exists remove_event_artist(uuid, uuid, text);
drop function if exists assert_artist_bookable(events, artists, timestamptz, timestamptz, boolean);
drop function if exists assert_no_slot_overlap(uuid, uuid, timestamptz, timestamptz);
drop function if exists lock_artist_day(uuid, date);
drop function if exists notify_lineup_artist(uuid, uuid);
drop function if exists notify_on_event_artist_removed();
drop function if exists notify_on_event_publish();
drop function if exists find_available_artists(date, time, time, text, text, text, uuid);
drop function if exists artist_calendar(uuid, date, date);
drop function if exists artist_availability_summary(uuid);
drop function if exists admin_calendar(date, date);
drop function if exists artist_day_summary(date);
drop function if exists artist_day_status(uuid, date, time, time, uuid);
drop function if exists can_see_artist_schedule();
drop function if exists can_manage_conversation(uuid);
drop function if exists is_private_conversation(uuid);
drop function if exists send_availability_reminders();
drop function if exists role_label(user_role);

delete from system_settings where key = 'artists.availability_stale_days';
alter table events drop column if exists category;
alter table events drop column if exists page_background;
alter table event_artist_details
  drop column if exists performance_order, drop column if exists performance_type,
  drop column if exists set_minutes, drop column if exists notes;

commit;
