-- Tangy Sessions — Operations Platform (partner portals, messaging,
-- notifications, temporary volunteer check-in access).
--
-- Builds on 0017_admin_system.sql. Additive: no existing table is dropped and
-- no existing row is deleted. Reverse with supabase/rollbacks/0018_operations_platform.down.sql.
--
--  1. Permissions        messages.manage, volunteers.manage, access.grant
--  2. Event membership   one server-side answer to "is this user part of this
--                        event, and as what?" (artist / sponsor / vendor /
--                        venue / volunteer / crew / staff)
--  3. Artist logistics   call/soundcheck/performance times, hospitality,
--                        travel, fee — in a PRIVATE table (event_artists is
--                        public because it powers the public lineup)
--  4. Requirements       "what Tangy needs from you" + member responses
--  5. Documents          link-based documents shared per event/audience
--  6. Announcements      partner/volunteer audiences; public leak closed
--  7. Notifications      central table, RPCs, triggers
--  8. Partner messaging  artist/sponsor/vendor/venue ↔ Tangy admin ONLY
--  9. Temporary access   time-boxed, event-scoped volunteer check-in
-- 10. Check-in          honours temporary access (and nothing broader)
-- 11. Applications      artist approval now activates the artist role
-- 12. Command center, analytics, permission management

-- ===========================================================================
-- 1. PERMISSIONS
-- ===========================================================================

insert into role_permissions (role, permission) values
  ('super_admin', 'messages.manage'), ('super_admin', 'volunteers.manage'), ('super_admin', 'access.grant'),
  ('admin', 'messages.manage'), ('admin', 'volunteers.manage'), ('admin', 'access.grant')
on conflict do nothing;

-- Portal home per role (notification deep links).
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

-- ===========================================================================
-- 2. EVENT MEMBERSHIP
-- ===========================================================================

-- Sponsors can now be placed on an event team like vendors/volunteers.
alter table event_assignments drop constraint if exists event_assignments_assignee_role_check;
alter table event_assignments add constraint event_assignments_assignee_role_check
  check (assignee_role in ('crew', 'volunteer', 'vendor', 'staff', 'sponsor'));

-- Details the assignee needs (all readable by the assignee only; RLS on
-- event_assignments is already self-or-admin).
alter table event_assignments
  add column if not exists call_time timestamptz,
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz,
  add column if not exists instructions text,
  add column if not exists fee_amount integer,
  add column if not exists fee_status text not null default 'not_applicable';
alter table event_assignments drop constraint if exists event_assignments_fee_amount_check;
alter table event_assignments add constraint event_assignments_fee_amount_check check (fee_amount is null or fee_amount >= 0);
alter table event_assignments drop constraint if exists event_assignments_fee_status_check;
alter table event_assignments add constraint event_assignments_fee_status_check
  check (fee_status in ('not_applicable', 'pending', 'invoiced', 'paid'));
alter table event_assignments drop constraint if exists event_assignments_window_check;
alter table event_assignments add constraint event_assignments_window_check
  check (ends_at is null or starts_at is null or ends_at > starts_at);

-- Assignees may only confirm/decline — every other column (including the new
-- fee/instruction columns) is admin-only. Compares whole rows so future
-- columns are covered automatically.
create or replace function guard_event_assignment_response()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  -- Admins, and trusted maintenance with no end-user JWT (SQL editor /
  -- service role — same bootstrap rule as prevent_role_self_escalation).
  if is_staff_or_admin() or coalesce(auth.role(), '') not in ('authenticated', 'anon') then
    return new;
  end if;
  if (to_jsonb(new) - 'status' - 'updated_at') is distinct from (to_jsonb(old) - 'status' - 'updated_at') then
    raise exception 'Only staff/admin can change assignment details.';
  end if;
  if new.status is distinct from old.status
     and not (old.status = 'assigned' and new.status in ('confirmed', 'declined')) then
    raise exception 'You can only confirm or decline a pending assignment.';
  end if;
  return new;
end;
$$;

-- Partner assignments must point at an account holding that role (new rows only).
create or replace function validate_event_assignment()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_role user_role;
begin
  select role into v_role from profiles where id = new.assignee_id;
  if new.assignee_role = 'staff' and v_role not in ('staff', 'admin', 'super_admin') then
    raise exception 'Only staff/admin accounts can be assigned as event staff.';
  end if;
  if tg_op = 'INSERT' and new.assignee_role in ('sponsor', 'vendor', 'volunteer', 'crew')
     and v_role is distinct from new.assignee_role::user_role then
    raise exception 'This account is not an approved % (current role: %).', new.assignee_role, coalesce(v_role::text, 'none');
  end if;
  return new;
end;
$$;

-- The single answer to "is p_uid part of this event, and as what?".
-- Returns null when not a member. Used by every partner-facing policy/RPC.
create or replace function event_member_kind(p_event_id uuid, p_uid uuid default auth.uid())
returns text
language sql stable security definer set search_path = public
as $$
  select coalesce(
    (select 'artist' from event_artists ea join artists a on a.id = ea.artist_id
      where ea.event_id = p_event_id and a.user_id = p_uid and a.status = 'approved' limit 1),
    (select 'venue' from events e where e.id = p_event_id and e.venue_partner_id = p_uid),
    (select 'venue' from events e join venues v on v.id = e.venue_id where e.id = p_event_id and v.partner_profile_id = p_uid),
    (select assignee_role from event_assignments
      where event_id = p_event_id and assignee_id = p_uid and status <> 'declined'
      order by case assignee_role when 'staff' then 0 else 1 end limit 1),
    (select 'sponsor' from sponsor_deliverables where event_id = p_event_id and sponsor_profile_id = p_uid limit 1)
  )
  where p_uid is not null
    and exists (select 1 from profiles where id = p_uid and is_active);
$$;

-- Partners can read the events they belong to even before publication.
drop policy if exists "events: members read" on events;
create policy "events: members read" on events for select using (event_member_kind(id) is not null);

-- ===========================================================================
-- 3. ARTIST LOGISTICS (private)
-- ===========================================================================

create table if not exists event_artist_details (
  event_id uuid not null,
  artist_id uuid not null,
  call_time timestamptz,
  soundcheck_at timestamptz,
  performance_start timestamptz,
  performance_end timestamptz,
  instructions text,
  hospitality text,
  travel text,
  fee_amount integer check (fee_amount is null or fee_amount >= 0),
  fee_status text not null default 'not_applicable' check (fee_status in ('not_applicable', 'pending', 'invoiced', 'paid')),
  updated_at timestamptz not null default now(),
  primary key (event_id, artist_id),
  foreign key (event_id, artist_id) references event_artists (event_id, artist_id) on delete cascade,
  check (performance_end is null or performance_start is null or performance_end > performance_start)
);
create trigger event_artist_details_set_updated_at before update on event_artist_details
  for each row execute function set_updated_at();
create trigger event_artist_details_audit after insert or update or delete on event_artist_details
  for each row execute function audit_row_change('event_artist_details');

alter table event_artist_details enable row level security;
create policy "event_artist_details: own artist read" on event_artist_details for select
  using (exists (select 1 from artists a where a.id = artist_id and a.user_id = auth.uid()));
create policy "event_artist_details: event managers" on event_artist_details for all
  using (has_permission('events.manage')) with check (has_permission('events.manage'));

-- ===========================================================================
-- 4. REQUIREMENTS — what Tangy needs from a member, and their answer
-- ===========================================================================

create table if not exists event_requirements (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 200),
  details text check (details is null or length(details) <= 4000),
  due_at timestamptz,
  status text not null default 'requested' check (status in ('requested', 'submitted', 'accepted', 'changes_requested')),
  response text check (response is null or length(response) <= 5000),
  responded_at timestamptz,
  review_note text check (review_note is null or length(review_note) <= 2000),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists event_requirements_user_idx on event_requirements (user_id, status);
create index if not exists event_requirements_event_idx on event_requirements (event_id);
create trigger event_requirements_set_updated_at before update on event_requirements
  for each row execute function set_updated_at();
create trigger event_requirements_audit after insert or update or delete on event_requirements
  for each row execute function audit_row_change('event_requirement');

alter table event_requirements enable row level security;
create policy "event_requirements: own read" on event_requirements for select using (user_id = auth.uid());
create policy "event_requirements: event managers" on event_requirements for all
  using (has_permission('events.manage')) with check (has_permission('events.manage'));

-- A requirement can only be addressed to someone on the event.
create or replace function validate_event_requirement()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' and event_member_kind(new.event_id, new.user_id) is null then
    raise exception 'That person is not part of this event.';
  end if;
  return new;
end;
$$;
create trigger event_requirements_validate before insert on event_requirements
  for each row execute function validate_event_requirement();

-- Member answers a requirement (the only write a member can make).
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

create or replace function review_requirement(p_id uuid, p_accept boolean, p_note text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_req event_requirements%rowtype;
begin
  if not has_permission('events.manage') then
    raise exception 'You do not have permission to review requirements.';
  end if;
  select * into v_req from event_requirements where id = p_id for update;
  if v_req.id is null then
    raise exception 'Requirement not found.';
  end if;
  if v_req.status <> 'submitted' then
    raise exception 'Only submitted requirements can be reviewed.';
  end if;
  if not p_accept and length(trim(coalesce(p_note, ''))) = 0 then
    raise exception 'Tell them what needs to change.';
  end if;
  update event_requirements
    set status = case when p_accept then 'accepted' else 'changes_requested' end,
        review_note = nullif(trim(coalesce(p_note, '')), ''), reviewed_by = auth.uid(), reviewed_at = now()
    where id = p_id;
end;
$$;

-- ===========================================================================
-- 5. DOCUMENTS (links; file storage is a separate integration)
-- ===========================================================================

create table if not exists event_documents (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 200),
  url text not null check (url ~* '^https://[^\s]+$' and length(url) <= 2000),
  audience text not null default 'members'
    check (audience in ('members', 'artist', 'sponsor', 'vendor', 'venue', 'volunteer', 'crew', 'staff', 'user')),
  user_id uuid references profiles(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  check ((audience = 'user') = (user_id is not null))
);
create index if not exists event_documents_event_idx on event_documents (event_id);
create trigger event_documents_audit after insert or update or delete on event_documents
  for each row execute function audit_row_change('event_document');

alter table event_documents enable row level security;
create policy "event_documents: members read" on event_documents for select
  using (
    (audience = 'user' and user_id = auth.uid())
    or (audience = 'members' and event_member_kind(event_id) is not null)
    or (audience not in ('user', 'members') and event_member_kind(event_id) = audience)
  );
create policy "event_documents: event managers" on event_documents for all
  using (has_permission('events.manage')) with check (has_permission('events.manage'));

-- ===========================================================================
-- 6. ANNOUNCEMENTS — partner / volunteer audiences
-- ===========================================================================

alter table announcements drop constraint if exists announcements_audience_check;
alter table announcements add constraint announcements_audience_check
  check (audience in ('all', 'guest', 'patron', 'artist', 'staff', 'sponsor', 'vendor', 'venue', 'volunteer', 'crew', 'members'));

-- The public policy was `audience <> 'staff'`, which would publish every new
-- partner audience to anonymous visitors. Public = explicit allow-list, and
-- an event-scoped artist notice is for that event's artists only.
drop policy if exists "announcements: public read live" on announcements;
create policy "announcements: public read live" on announcements for select
  using (status = 'published' and publish_at <= now() and (expire_at is null or expire_at > now())
         and (audience in ('all', 'guest', 'patron') or (audience = 'artist' and event_id is null)));

-- Group notices (no event) reach everyone holding that role; event notices
-- reach that event's members of the matching kind (or all members).
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

drop policy if exists "announcements: members read relevant" on announcements;
create policy "announcements: members read relevant" on announcements for select
  using (status = 'published' and publish_at <= now() and (expire_at is null or expire_at > now())
         and can_read_member_announcement(audience, event_id));

-- ===========================================================================
-- 7. NOTIFICATIONS
-- ===========================================================================

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type ~ '^[a-z_]+\.[a-z_]+$'),
  title text not null check (length(title) between 1 and 200),
  body text check (body is null or length(body) <= 1000),
  link text check (link is null or (link ~ '^/' and length(link) <= 500)),
  event_id uuid references events(id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_created_idx on notifications (user_id, created_at desc);
create index if not exists notifications_user_unread_idx on notifications (user_id) where read_at is null;

alter table notifications enable row level security;
-- Read-only to the owner; every write goes through the functions below.
create policy "notifications: own read" on notifications for select using (user_id = auth.uid());

-- Internal: never callable from the browser.
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

create or replace function notify_permission_holders(p_permission text, p_type text, p_title text,
                                                     p_body text default null, p_link text default null,
                                                     p_event_id uuid default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  r record;
begin
  for r in
    select p.id from profiles p
    join role_permissions rp on rp.role = p.role and rp.permission = p_permission
    where p.is_active
  loop
    perform notify(r.id, p_type, p_title, p_body, p_link, p_event_id);
  end loop;
end;
$$;

revoke execute on function notify(uuid, text, text, text, text, uuid) from public, anon, authenticated;
revoke execute on function notify_permission_holders(text, text, text, text, text, uuid) from public, anon, authenticated;

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

create or replace function notification_unread_count()
returns integer
language sql stable security definer set search_path = public
as $$
  select count(*)::int from notifications where user_id = auth.uid() and read_at is null;
$$;

-- p_ids null = mark all read.
create or replace function mark_notifications_read(p_ids uuid[] default null)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_count int;
begin
  update notifications set read_at = now()
  where user_id = auth.uid() and read_at is null and (p_ids is null or id = any (p_ids));
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Assignment / task / requirement / application notifications ---------------

create or replace function notify_on_assignment()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_event events%rowtype;
  v_role user_role;
begin
  select * into v_event from events where id = new.event_id;
  select role into v_role from profiles where id = new.assignee_id;
  perform notify(new.assignee_id, 'assignment.new',
    'You''ve been added to ' || v_event.name,
    coalesce(new.title, 'Event team') || ' · ' || to_char(v_event.event_date, 'DD Mon YYYY'),
    case when new.assignee_role = 'staff' then '/admin/my-events' else portal_path(v_role) end, new.event_id);
  return new;
end;
$$;
create trigger event_assignments_notify after insert on event_assignments
  for each row execute function notify_on_assignment();

create or replace function notify_on_event_artist()
returns trigger
language plpgsql security definer set search_path = public
as $$
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
$$;
create trigger event_artists_notify after insert on event_artists
  for each row execute function notify_on_event_artist();

create or replace function notify_on_task()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_assignee uuid;
  v_event_id uuid;
  v_role user_role;
begin
  select ea.assignee_id, ea.event_id into v_assignee, v_event_id from event_assignments ea where ea.id = new.assignment_id;
  select role into v_role from profiles where id = v_assignee;
  perform notify(v_assignee, 'task.assigned', 'New task: ' || new.title,
    case when new.due_at is not null then 'Due ' || to_char(new.due_at at time zone 'Asia/Kolkata', 'DD Mon, HH12:MI AM') end,
    case when v_role in ('staff', 'admin', 'super_admin') then '/admin/tasks' else portal_path(v_role) end, v_event_id);
  return new;
end;
$$;
create trigger event_tasks_notify after insert on event_tasks
  for each row execute function notify_on_task();

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
create trigger event_requirements_notify after insert or update on event_requirements
  for each row execute function notify_on_requirement();

create or replace function notify_on_application()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_label text;
  v_name text;
begin
  if new.status <> 'pending' then
    return new;
  end if;
  if tg_table_name = 'collaborations' then
    v_label := replace(new.type::text, '_', ' '); v_name := new.business_name;
  elsif tg_table_name = 'crew_applications' then
    v_label := new.category; v_name := new.name;
  else
    v_label := 'artist'; v_name := new.name;
  end if;
  perform notify_permission_holders('applications.review', 'application.new',
    'New ' || v_label || ' application', v_name, '/admin/applications');
  return new;
end;
$$;
create trigger collaborations_notify after insert on collaborations for each row execute function notify_on_application();
create trigger crew_applications_notify after insert on crew_applications for each row execute function notify_on_application();
create trigger artists_application_notify after insert on artists for each row execute function notify_on_application();

-- Published member announcements notify the people they are addressed to.
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
create trigger announcements_notify after insert or update on announcements
  for each row execute function notify_on_announcement();

-- Portal feed: the announcements addressed to the caller (not the public overlay).
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

-- ===========================================================================
-- 8. PARTNER MESSAGING — artist / sponsor / vendor / venue ↔ Tangy admin
-- ===========================================================================
-- There is no user-to-user messaging: a partner can only open a thread with
-- "Tangy", and only admins (messages.manage) join or reply. Participants are
-- admin-managed (0008 policy), so a partner can never add another partner.
-- Transport is HTTPS/TLS; content is stored in Postgres behind RLS. This is
-- NOT end-to-end encrypted — Tangy admins must be able to read and reply.

alter table conversations
  add column if not exists conversation_type text not null default 'general',
  add column if not exists external_user_id uuid references auth.users(id) on delete set null;
alter table conversations drop constraint if exists conversations_conversation_type_check;
alter table conversations add constraint conversations_conversation_type_check
  check (conversation_type in ('general', 'artist_support', 'sponsor_support', 'vendor_support', 'venue_support'));
create index if not exists conversations_type_last_idx on conversations (conversation_type, last_message_at desc);
create index if not exists conversations_external_user_idx on conversations (external_user_id);
create index if not exists conversations_event_idx on conversations (related_session_id);

alter table messages drop constraint if exists messages_content_length_check;
alter table messages add constraint messages_content_length_check
  check (length(content) between 1 and 4000) not valid;

-- Non-admins may only create legacy website-support threads directly; partner
-- threads are created exclusively by the RPCs below.
drop policy if exists "conversations: creator or staff insert" on conversations;
create policy "conversations: creator or staff insert" on conversations for insert
  with check ((created_by = auth.uid() and conversation_type = 'general' and external_user_id is null) or is_staff_or_admin());

-- Which partner messaging lane (if any) this account may use.
create or replace function partner_kind(p_uid uuid default auth.uid())
returns text
language sql stable security definer set search_path = public
as $$
  select case
    when p.role in ('sponsor', 'vendor', 'venue', 'artist') then p.role::text
    when exists (select 1 from artists a where a.user_id = p.id and a.status = 'approved') then 'artist'
  end
  from profiles p where p.id = p_uid and p.is_active;
$$;

create or replace function start_partner_conversation(p_subject text, p_body text, p_event_id uuid default null)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_kind text := partner_kind();
  v_conv uuid;
begin
  if v_kind is null then
    raise exception 'Messaging is available to artists, sponsors, vendors and venue hosts.';
  end if;
  if p_event_id is not null and event_member_kind(p_event_id) is null then
    raise exception 'You are not part of this event.';
  end if;
  if length(trim(coalesce(p_body, ''))) not between 1 and 4000 then
    raise exception 'Messages must be between 1 and 4000 characters.';
  end if;
  -- One open thread per partner per event.
  select id into v_conv from conversations
    where external_user_id = auth.uid() and conversation_type = v_kind || '_support'
      and related_session_id is not distinct from p_event_id and status in ('open', 'pending')
    order by created_at desc limit 1;
  if v_conv is null then
    insert into conversations (subject, category, conversation_type, created_by, external_user_id, related_session_id, status)
    values (left(nullif(trim(p_subject), ''), 140), 'support', v_kind || '_support', auth.uid(), auth.uid(), p_event_id, 'open')
    returning id into v_conv;
    insert into conversation_participants (conversation_id, user_id, role) values (v_conv, auth.uid(), 'owner');
  end if;
  insert into messages (conversation_id, sender_id, content) values (v_conv, auth.uid(), trim(p_body));
  return v_conv;
end;
$$;

create or replace function admin_start_partner_conversation(p_user_id uuid, p_subject text, p_body text, p_event_id uuid default null)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_kind text := partner_kind(p_user_id);
  v_conv uuid;
begin
  if not has_permission('messages.manage') then
    raise exception 'You do not have permission to message partners.';
  end if;
  if v_kind is null then
    raise exception 'You can only message artists, sponsors, vendors and venue hosts.';
  end if;
  if p_event_id is not null and event_member_kind(p_event_id, p_user_id) is null then
    raise exception 'That partner is not part of this event.';
  end if;
  if length(trim(coalesce(p_body, ''))) not between 1 and 4000 then
    raise exception 'Messages must be between 1 and 4000 characters.';
  end if;
  insert into conversations (subject, category, conversation_type, created_by, external_user_id, related_session_id, assigned_admin_id, status)
  values (left(nullif(trim(p_subject), ''), 140), 'support', v_kind || '_support', auth.uid(), p_user_id, p_event_id, auth.uid(), 'pending')
  returning id into v_conv;
  insert into conversation_participants (conversation_id, user_id, role)
  values (v_conv, p_user_id, 'owner'), (v_conv, auth.uid(), 'admin');
  insert into messages (conversation_id, sender_id, content) values (v_conv, auth.uid(), trim(p_body));
  return v_conv;
end;
$$;

-- Reply in an existing thread. Partners: must be a participant and the thread
-- must not be closed. Admins: messages.manage; they join the thread on reply.
create or replace function send_message(p_conversation_id uuid, p_body text)
returns uuid
language plpgsql security definer set search_path = public
as $$
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
$$;

create or replace function set_conversation_status(p_conversation_id uuid, p_status conversation_status)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not has_permission('messages.manage') then
    raise exception 'You do not have permission to manage conversations.';
  end if;
  update conversations set status = p_status where id = p_conversation_id and conversation_type <> 'general';
  if not found then
    raise exception 'Conversation not found.';
  end if;
end;
$$;

-- Every message (any path): keep the thread preview current, audit partner
-- traffic (never the content), and notify the other side.
create or replace function on_message_created()
returns trigger
language plpgsql security definer set search_path = public
as $$
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
$$;
drop trigger if exists messages_after_insert on messages;
create trigger messages_after_insert after insert on messages
  for each row execute function on_message_created();

create or replace function mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
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
$$;

-- Partner inbox.
create or replace function my_conversations()
returns table (id uuid, subject text, conversation_type text, status conversation_status, event_id uuid, event_name text,
               last_message_at timestamptz, last_message_preview text, unread integer, created_at timestamptz)
language sql stable security definer set search_path = public
as $$
  select c.id, c.subject, c.conversation_type, c.status, c.related_session_id, e.name,
         c.last_message_at, c.last_message_preview,
         (select count(*)::int from messages m where m.conversation_id = c.id and m.sender_id <> auth.uid()
            and m.created_at > coalesce((select last_read_at from message_read_states rs
                                         where rs.conversation_id = c.id and rs.user_id = auth.uid()), '-infinity')),
         c.created_at
  from conversations c left join events e on e.id = c.related_session_id
  where c.conversation_type <> 'general' and is_participant(c.id)
  order by coalesce(c.last_message_at, c.created_at) desc
  limit 100;
$$;

-- Admin inbox (partner threads only; website support keeps its own inbox).
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

-- Messages in one thread, oldest first, with read state for the other side.
create or replace function conversation_messages(p_conversation_id uuid, p_limit int default 100, p_before timestamptz default null)
returns table (id uuid, sender_id uuid, sender_name text, from_tangy boolean, is_mine boolean, content text,
               message_type text, created_at timestamptz, read_by_other boolean)
language plpgsql stable security definer set search_path = public
as $$
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
$$;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'notifications') then
    execute 'alter publication supabase_realtime add table notifications';
  end if;
end $$;

-- ===========================================================================
-- 9. TEMPORARY ACCESS — volunteer check-in, explicitly granted, event-scoped,
--    time-boxed. "Active" is always computed from now(); nothing needs to run
--    for access to end.
-- ===========================================================================

create table if not exists temporary_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  permission text not null default 'checkin' check (permission in ('checkin')),
  granted_by uuid not null references auth.users(id),
  granted_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id),
  revoke_reason text check (revoke_reason is null or length(revoke_reason) <= 500),
  request_id uuid,
  expiry_logged_at timestamptz,
  check (expires_at > granted_at),
  check (expires_at <= granted_at + interval '24 hours'),
  check ((revoked_at is null) = (revoked_by is null))
);
create index if not exists temporary_access_lookup_idx on temporary_access (user_id, event_id, permission, expires_at desc);
create index if not exists temporary_access_event_idx on temporary_access (event_id);
create index if not exists temporary_access_open_idx on temporary_access (expires_at) where revoked_at is null and expiry_logged_at is null;

alter table temporary_access enable row level security;
create policy "temporary_access: own read" on temporary_access for select using (user_id = auth.uid());
create policy "temporary_access: volunteer managers read" on temporary_access for select using (has_permission('volunteers.manage'));
-- No insert/update/delete policies: grants change only through the RPCs below.

-- Grants are immutable facts; only revocation / expiry bookkeeping may change.
create or replace function guard_temporary_access()
returns trigger
language plpgsql
as $$
begin
  if new.user_id is distinct from old.user_id or new.event_id is distinct from old.event_id
     or new.permission is distinct from old.permission or new.granted_by is distinct from old.granted_by
     or new.granted_at is distinct from old.granted_at or new.expires_at is distinct from old.expires_at then
    raise exception 'A grant''s holder, event, permission and window cannot be changed. Revoke it and grant again.';
  end if;
  if old.revoked_at is not null and new.revoked_at is distinct from old.revoked_at then
    raise exception 'This grant has already been revoked.';
  end if;
  return new;
end;
$$;
create trigger temporary_access_guard before update on temporary_access
  for each row execute function guard_temporary_access();

create table if not exists access_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  permission text not null default 'checkin' check (permission in ('checkin')),
  message text check (message is null or length(message) <= 500),
  status text not null default 'pending' check (status in ('pending', 'granted', 'declined', 'cancelled')),
  decided_by uuid references auth.users(id),
  decided_at timestamptz,
  decision_note text check (decision_note is null or length(decision_note) <= 500),
  grant_id uuid references temporary_access(id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index if not exists access_requests_one_pending_idx on access_requests (user_id, event_id, permission) where status = 'pending';
create index if not exists access_requests_status_idx on access_requests (status, created_at desc);

alter table access_requests enable row level security;
create policy "access_requests: own read" on access_requests for select using (user_id = auth.uid());
create policy "access_requests: volunteer managers read" on access_requests for select using (has_permission('volunteers.manage'));

create or replace function has_active_access(p_event_id uuid, p_permission text default 'checkin', p_uid uuid default auth.uid())
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from temporary_access ta join profiles p on p.id = ta.user_id
    where ta.user_id = p_uid and ta.event_id = p_event_id and ta.permission = p_permission
      and ta.revoked_at is null and ta.granted_at <= now() and ta.expires_at > now()
      and p.is_active
  );
$$;

create or replace function access_state(ta temporary_access)
returns text
language sql stable
as $$
  select case
    when ta.revoked_at is not null then 'revoked'
    when ta.expires_at <= now() then 'expired'
    else 'active'
  end;
$$;

-- Records expiries in the audit log. Access itself never depends on this;
-- it's bookkeeping, run opportunistically (listing/check-in) and by pg_cron
-- when available.
create or replace function log_expired_access()
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  r record;
  v_n int := 0;
begin
  for r in
    select ta.*, p.email from temporary_access ta join profiles p on p.id = ta.user_id
    where ta.revoked_at is null and ta.expiry_logged_at is null and ta.expires_at <= now()
    for update of ta skip locked
  loop
    insert into audit_logs (actor_id, actor_email, actor_role, action, resource_type, resource_id, event_id, metadata)
    values (null, null, 'system', 'access.expired', 'temporary_access', r.id::text, r.event_id,
            jsonb_build_object('user_id', r.user_id, 'email', r.email, 'permission', r.permission,
                               'granted_at', r.granted_at, 'expires_at', r.expires_at));
    update temporary_access set expiry_logged_at = now() where id = r.id;
    v_n := v_n + 1;
  end loop;
  return v_n;
end;
$$;
revoke execute on function log_expired_access() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('tangy-log-expired-access', '*/5 * * * *', 'select public.log_expired_access()');
  end if;
end $$;

create or replace function grant_temporary_access(p_user_id uuid, p_event_id uuid, p_duration_minutes int, p_request_id uuid default null)
returns temporary_access
language plpgsql security definer set search_path = public
as $$
declare
  v_target profiles%rowtype;
  v_event events%rowtype;
  v_grant temporary_access%rowtype;
begin
  if not has_permission('access.grant') then
    raise exception 'You do not have permission to grant check-in access.';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'You cannot grant access to yourself.';
  end if;
  if p_duration_minutes not in (30, 60, 120, 180, 240, 360, 480, 720) then
    raise exception 'Choose a duration between 30 minutes and 12 hours.';
  end if;
  select * into v_target from profiles where id = p_user_id;
  if v_target.id is null or v_target.role <> 'volunteer' or not v_target.is_active then
    raise exception 'Temporary check-in access can only be granted to active volunteer accounts.';
  end if;
  select * into v_event from events where id = p_event_id;
  if v_event.id is null or v_event.status in ('draft', 'cancelled') or v_event.event_date < current_date - 1 then
    raise exception 'Check-in access can only be granted for a published, current or upcoming event.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || p_event_id::text, 0));
  if has_active_access(p_event_id, 'checkin', p_user_id) then
    raise exception 'This volunteer already has active check-in access for this event. Revoke it first to change the window.';
  end if;

  -- Granting check-in puts the volunteer on the event team (so they see its info).
  if not exists (select 1 from event_assignments where event_id = p_event_id and assignee_id = p_user_id
                 and assignee_role = 'volunteer' and status <> 'declined') then
    insert into event_assignments (event_id, assignee_role, assignee_id, title, status, assigned_by)
    values (p_event_id, 'volunteer', p_user_id, 'Check-in volunteer', 'confirmed', auth.uid());
  end if;

  insert into temporary_access (user_id, event_id, permission, granted_by, expires_at, request_id)
  values (p_user_id, p_event_id, 'checkin', auth.uid(), now() + make_interval(mins => p_duration_minutes), p_request_id)
  returning * into v_grant;

  if p_request_id is not null then
    update access_requests
      set status = 'granted', decided_by = auth.uid(), decided_at = now(), grant_id = v_grant.id
      where id = p_request_id and user_id = p_user_id and event_id = p_event_id and status = 'pending';
  end if;
  -- Any other pending request for this event is now satisfied.
  update access_requests set status = 'granted', decided_by = auth.uid(), decided_at = now(), grant_id = v_grant.id
    where user_id = p_user_id and event_id = p_event_id and status = 'pending';

  perform audit_write('access.granted', 'temporary_access', v_grant.id::text,
    jsonb_build_object('user_id', p_user_id, 'email', v_target.email, 'permission', 'checkin',
                       'granted_at', v_grant.granted_at, 'expires_at', v_grant.expires_at,
                       'duration_minutes', p_duration_minutes, 'request_id', p_request_id),
    p_event_id);
  perform notify(p_user_id, 'access.granted', 'Check-in access granted for ' || v_event.name,
    'Active until ' || to_char(v_grant.expires_at at time zone 'Asia/Kolkata', 'HH12:MI AM, DD Mon'),
    '/volunteer/dashboard?tab=checkin', p_event_id);
  return v_grant;
end;
$$;

create or replace function revoke_temporary_access(p_grant_id uuid, p_reason text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_grant temporary_access%rowtype;
  v_event text;
begin
  if not has_permission('access.grant') then
    raise exception 'You do not have permission to revoke check-in access.';
  end if;
  select * into v_grant from temporary_access where id = p_grant_id for update;
  if v_grant.id is null then
    raise exception 'Grant not found.';
  end if;
  if v_grant.revoked_at is not null then
    raise exception 'This access has already been revoked.';
  end if;
  if v_grant.expires_at <= now() then
    raise exception 'This access has already expired.';
  end if;
  update temporary_access set revoked_at = now(), revoked_by = auth.uid(), revoke_reason = nullif(trim(coalesce(p_reason, '')), '')
    where id = p_grant_id;
  select name into v_event from events where id = v_grant.event_id;
  perform audit_write('access.revoked', 'temporary_access', p_grant_id::text,
    jsonb_build_object('user_id', v_grant.user_id, 'permission', v_grant.permission, 'granted_at', v_grant.granted_at,
                       'expires_at', v_grant.expires_at, 'reason', nullif(trim(coalesce(p_reason, '')), '')),
    v_grant.event_id);
  perform notify(v_grant.user_id, 'access.revoked', 'Check-in access ended for ' || v_event,
    nullif(trim(coalesce(p_reason, '')), ''), '/volunteer/dashboard?tab=checkin', v_grant.event_id);
end;
$$;

create or replace function request_checkin_access(p_event_id uuid, p_message text default null)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
  v_me profiles%rowtype;
  v_event text;
begin
  select * into v_me from profiles where id = auth.uid();
  if v_me.id is null or v_me.role <> 'volunteer' or not v_me.is_active then
    raise exception 'Only volunteers can request check-in access.';
  end if;
  if event_member_kind(p_event_id) is distinct from 'volunteer' then
    raise exception 'You can only request access for an event you are volunteering at.';
  end if;
  if has_active_access(p_event_id) then
    raise exception 'You already have active check-in access for this event.';
  end if;
  if exists (select 1 from access_requests where user_id = auth.uid() and event_id = p_event_id and status = 'pending') then
    raise exception 'Your request is already with the event team.';
  end if;
  insert into access_requests (user_id, event_id, message) values (auth.uid(), p_event_id, nullif(trim(coalesce(p_message, '')), ''))
  returning id into v_id;
  select name into v_event from events where id = p_event_id;
  perform audit_write('access.requested', 'access_request', v_id::text,
    jsonb_build_object('permission', 'checkin'), p_event_id);
  perform notify_permission_holders('volunteers.manage', 'access.requested',
    coalesce(v_me.full_name, v_me.email) || ' requested check-in access', v_event, '/admin/volunteers?requests=1', p_event_id);
  return v_id;
end;
$$;

create or replace function decline_access_request(p_request_id uuid, p_note text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_req access_requests%rowtype;
begin
  if not has_permission('volunteers.manage') then
    raise exception 'You do not have permission to manage volunteers.';
  end if;
  update access_requests set status = 'declined', decided_by = auth.uid(), decided_at = now(),
         decision_note = nullif(trim(coalesce(p_note, '')), '')
    where id = p_request_id and status = 'pending'
    returning * into v_req;
  if v_req.id is null then
    raise exception 'Request not found or already handled.';
  end if;
  perform audit_write('access.request_declined', 'access_request', p_request_id::text,
    jsonb_build_object('user_id', v_req.user_id, 'note', v_req.decision_note), v_req.event_id);
  perform notify(v_req.user_id, 'access.declined', 'Check-in access request declined', v_req.decision_note,
    '/volunteer/dashboard?tab=checkin', v_req.event_id);
end;
$$;

-- Volunteer's own view (status computed server-side).
create or replace function my_checkin_access()
returns table (grant_id uuid, event_id uuid, event_name text, event_date date, venue text,
               granted_at timestamptz, expires_at timestamptz, state text, request_id uuid, request_status text, request_created_at timestamptz)
language sql stable security definer set search_path = public
as $$
  select ta.id, ta.event_id, e.name, e.event_date, e.venue, ta.granted_at, ta.expires_at, access_state(ta), null::uuid, null::text, null::timestamptz
  from temporary_access ta join events e on e.id = ta.event_id
  where ta.user_id = auth.uid() and ta.granted_at > now() - interval '30 days'
  union all
  select null, r.event_id, e.name, e.event_date, e.venue, null, null, 'requested', r.id, r.status, r.created_at
  from access_requests r join events e on e.id = r.event_id
  where r.user_id = auth.uid() and r.status in ('pending', 'declined') and r.created_at > now() - interval '30 days'
  order by 7 desc nulls last, 11 desc nulls last;
$$;

-- Admin Volunteers section.
create or replace function volunteers_overview(p_search text default null, p_event_id uuid default null,
                                               p_access text default null, p_limit int default 25, p_offset int default 0)
returns table (user_id uuid, full_name text, email text, phone text, is_active boolean, joined_at timestamptz,
               events jsonb, active_grant jsonb, last_grant jsonb, pending_requests jsonb, total_count bigint)
language plpgsql security definer set search_path = public
as $$
begin
  if not has_permission('volunteers.manage') then
    raise exception 'You do not have permission to manage volunteers.';
  end if;
  perform log_expired_access();
  return query
  with v as (
    select p.* from profiles p
    where p.role = 'volunteer'
      and (p_search is null or p.full_name ilike '%' || p_search || '%' or p.email ilike '%' || p_search || '%')
      and (p_event_id is null
           or exists (select 1 from event_assignments ea where ea.assignee_id = p.id and ea.event_id = p_event_id and ea.status <> 'declined')
           or exists (select 1 from temporary_access ta where ta.user_id = p.id and ta.event_id = p_event_id)
           or exists (select 1 from access_requests r where r.user_id = p.id and r.event_id = p_event_id))
  ), enriched as (
    select v.*,
      (select coalesce(jsonb_agg(jsonb_build_object('event_id', e.id, 'name', e.name, 'event_date', e.event_date, 'assignment_id', ea.id)
                                 order by e.event_date), '[]'::jsonb)
         from event_assignments ea join events e on e.id = ea.event_id
         where ea.assignee_id = v.id and ea.assignee_role = 'volunteer' and ea.status <> 'declined'
           and e.event_date >= current_date - 7) as evts,
      (select to_jsonb(x) from (
         select ta.id, ta.event_id, e.name as event_name, ta.granted_at, ta.expires_at
         from temporary_access ta join events e on e.id = ta.event_id
         where ta.user_id = v.id and ta.revoked_at is null and ta.expires_at > now() and ta.granted_at <= now()
           and (p_event_id is null or ta.event_id = p_event_id)
         order by ta.expires_at desc limit 1) x) as active_g,
      (select to_jsonb(x) from (
         select ta.id, ta.event_id, e.name as event_name, ta.granted_at, ta.expires_at, ta.revoked_at, access_state(ta) as state
         from temporary_access ta join events e on e.id = ta.event_id
         where ta.user_id = v.id and (p_event_id is null or ta.event_id = p_event_id)
         order by ta.granted_at desc limit 1) x) as last_g,
      (select coalesce(jsonb_agg(jsonb_build_object('id', r.id, 'event_id', r.event_id, 'event_name', e.name,
                                                    'message', r.message, 'created_at', r.created_at) order by r.created_at), '[]'::jsonb)
         from access_requests r join events e on e.id = r.event_id
         where r.user_id = v.id and r.status = 'pending') as pending_r
    from v
  )
  select en.id, en.full_name, en.email, en.phone, en.is_active, en.created_at, en.evts, en.active_g, en.last_g, en.pending_r,
         count(*) over ()
  from enriched en
  where p_access is null
     or (p_access = 'active' and en.active_g is not null)
     or (p_access = 'pending' and jsonb_array_length(en.pending_r) > 0)
     or (p_access = 'expired' and en.active_g is null and en.last_g is not null)
     or (p_access = 'none' and en.last_g is null)
  order by (jsonb_array_length(en.pending_r) > 0) desc, (en.active_g is not null) desc, en.full_name nulls last
  limit least(greatest(p_limit, 1), 100) offset greatest(p_offset, 0);
end;
$$;

create or replace function volunteer_access_activity(p_user_id uuid)
returns table (kind text, at timestamptz, event_name text, detail jsonb)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not has_permission('volunteers.manage') then
    raise exception 'You do not have permission to manage volunteers.';
  end if;
  return query
  select 'grant', ta.granted_at, e.name,
         jsonb_build_object('grant_id', ta.id, 'expires_at', ta.expires_at, 'state', access_state(ta),
                            'granted_by', (select coalesce(full_name, email) from profiles where id = ta.granted_by),
                            'revoked_at', ta.revoked_at, 'revoke_reason', ta.revoke_reason,
                            'revoked_by', (select coalesce(full_name, email) from profiles where id = ta.revoked_by))
  from temporary_access ta join events e on e.id = ta.event_id where ta.user_id = p_user_id
  union all
  select 'request', r.created_at, e.name, jsonb_build_object('status', r.status, 'message', r.message, 'decision_note', r.decision_note)
  from access_requests r join events e on e.id = r.event_id where r.user_id = p_user_id
  union all
  select 'checkin', c.checked_in_at, e.name, jsonb_build_object('method', c.method)
  from checkins c join events e on e.id = c.event_id where c.checked_in_by = p_user_id
  order by 2 desc
  limit 100;
end;
$$;

-- ===========================================================================
-- 10. CHECK-IN honours temporary access — for THAT event, until expiry.
-- ===========================================================================

-- Console path unchanged (role permission + assignment); volunteers only via an active grant.
create or replace function can_checkin_event(p_event_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select (has_permission('checkin.perform') and (has_permission('events.view_all') or is_assigned_to_event(p_event_id)))
      or has_active_access(p_event_id, 'checkin');
$$;

create or replace function can_view_event_attendees(p_event_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select has_permission('attendees.view_all')
      or (has_permission('attendees.view_assigned') and is_assigned_to_event(p_event_id))
      or has_active_access(p_event_id, 'checkin');
$$;

-- Navigation/gating convenience: an active grant adds checkin.perform.
create or replace function my_permissions()
returns text[]
language sql stable security definer set search_path = public
as $$
  select coalesce(array_agg(distinct perm order by perm), '{}') from (
    select permission as perm from role_permissions where role = current_role_name()
    union all
    select 'checkin.perform' from temporary_access ta
      where ta.user_id = auth.uid() and ta.revoked_at is null and ta.granted_at <= now() and ta.expires_at > now()
        and current_role_name() is not null
  ) x;
$$;

create or replace function check_in_ticket(p_token text, p_event_id uuid, p_method text default 'qr', p_notes text default null)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_ticket tickets%rowtype;
  v_booking bookings%rowtype;
  v_checkin checkins%rowtype;
  v_event_name text;
  v_by_name text;
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

  select * into v_ticket from tickets where token = trim(coalesce(p_token, '')) for update;
  if v_ticket.id is null then
    return jsonb_build_object('result', 'not_found', 'event_name', v_event_name);
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
    'registration_code', v_booking.registration_code,
    'event_name', v_event_name,
    'tier', v_ticket.tier,
    'checked_in_at', v_checkin.checked_in_at,
    'checked_in_by_name', v_by_name,
    'method', p_method
  );
end;
$$;

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
  case when can_checkin_event(t.event_id) and t.status = 'valid' then t.token end as token
from tickets t
join bookings b on b.id = t.booking_id
join events e on e.id = t.event_id
left join checkins c on c.ticket_id = t.id
where can_view_event_attendees(t.event_id);

revoke all on attendee_tickets from anon;
grant select on attendee_tickets to authenticated;

drop function if exists my_checkin_events();
create or replace function my_checkin_events()
returns table (id uuid, name text, event_date date, event_time text, venue text, status text, access_expires_at timestamptz)
language sql stable security definer set search_path = public
as $$
  select e.id, e.name, e.event_date, e.event_time, e.venue, e.status,
         case when not has_permission('checkin.perform') then
           (select max(ta.expires_at) from temporary_access ta
             where ta.user_id = auth.uid() and ta.event_id = e.id and ta.revoked_at is null and ta.expires_at > now())
         end
  from events e
  where e.status not in ('draft', 'cancelled') and can_checkin_event(e.id)
  order by abs(e.event_date - current_date), e.event_date desc;
$$;

create or replace function get_checkin_history(
  p_event_id uuid default null,
  p_mine boolean default false,
  p_limit int default 50,
  p_offset int default 0
) returns table (
  id uuid, checked_in_at timestamptz, method text, notes text,
  event_id uuid, event_name text, ticket_number text, tier text,
  registration_code text, attendee_name text,
  checked_in_by uuid, checked_in_by_name text, total_count bigint
)
language sql stable security definer set search_path = public
as $$
  select c.id, c.checked_in_at, c.method, c.notes,
         c.event_id, e.name, t.ticket_number, t.tier,
         b.registration_code, b.attendee_name,
         c.checked_in_by, coalesce(p.full_name, p.email),
         count(*) over ()
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

-- ===========================================================================
-- 11. APPLICATIONS — an approved artist becomes an `artist` account
-- ===========================================================================

create or replace function approve_artist_application(p_id uuid, p_notes text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_artist artists%rowtype;
begin
  if not has_permission('applications.review') then
    raise exception 'You do not have permission to review applications.';
  end if;
  select * into v_artist from artists where id = p_id for update;
  if v_artist.id is null then
    raise exception 'Application not found.';
  end if;
  if v_artist.status <> 'pending' then
    raise exception 'This application has already been reviewed (%).', v_artist.status;
  end if;

  update artists
    set status = 'approved', reviewed_at = now(), reviewed_by = auth.uid(), review_notes = p_notes
    where id = p_id;

  if v_artist.user_id is not null then
    update profiles set role = 'artist' where id = v_artist.user_id and role = 'user';
    insert into application_notifications (source_table, source_id, notification_type)
    values ('artists', p_id, 'approval')
    on conflict (source_table, source_id, notification_type) do nothing;
    perform notify(v_artist.user_id, 'application.approved', 'Welcome to Tangy — your artist application is approved',
      'Your artist portal is ready.', '/artist/dashboard');
  end if;

  perform audit_write('application.approved', 'artist', p_id::text,
    jsonb_build_object('type', 'artist', 'applicant', v_artist.name, 'notes', p_notes,
      'role_provisioned', v_artist.user_id is not null));
end;
$$;

-- In-app notice for partner/volunteer approvals (email stays with the Edge Function).
create or replace function notify_on_application_decision()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_role user_role;
  v_label text;
begin
  if new.user_id is null or new.status = old.status or new.status not in ('approved', 'rejected') then
    return new;
  end if;
  if tg_table_name = 'artists' then
    if new.status = 'approved' then return new; end if; -- handled in approve_artist_application
    v_label := 'artist';
  elsif tg_table_name = 'collaborations' then
    v_label := replace(new.type::text, '_', ' ');
  else
    v_label := new.category;
  end if;
  select role into v_role from profiles where id = new.user_id;
  perform notify(new.user_id,
    case when new.status = 'approved' then 'application.approved' else 'application.rejected' end,
    case when new.status = 'approved' then 'Your ' || v_label || ' application is approved'
         else 'Update on your ' || v_label || ' application' end,
    case when new.status = 'rejected' then new.decision_reason end,
    portal_path(v_role));
  return new;
end;
$$;
create trigger collaborations_decision_notify after update of status on collaborations
  for each row execute function notify_on_application_decision();
create trigger crew_applications_decision_notify after update of status on crew_applications
  for each row execute function notify_on_application_decision();
create trigger artists_decision_notify after update of status on artists
  for each row execute function notify_on_application_decision();

-- ===========================================================================
-- 12. EVENT COMMAND CENTER, ANALYTICS, PERMISSION MANAGEMENT
-- ===========================================================================

create or replace function event_command_center(p_event_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_event events%rowtype;
begin
  if not has_permission('events.view_all') then
    raise exception 'You do not have access to the event command center.';
  end if;
  select * into v_event from events where id = p_event_id;
  if v_event.id is null then
    raise exception 'Event not found.';
  end if;
  return jsonb_build_object(
    'artists', (select count(*) from event_artists where event_id = p_event_id),
    'artists_confirmed', (select count(*) from event_artists ea join artists a on a.id = ea.artist_id
                          where ea.event_id = p_event_id and a.status = 'approved'),
    'sponsors', (select count(distinct x.uid) from (
                   select assignee_id as uid from event_assignments where event_id = p_event_id and assignee_role = 'sponsor' and status <> 'declined'
                   union select sponsor_profile_id from sponsor_deliverables where event_id = p_event_id) x),
    'vendors', (select count(*) from event_assignments where event_id = p_event_id and assignee_role = 'vendor' and status <> 'declined'),
    'vendors_confirmed', (select count(*) from event_assignments where event_id = p_event_id and assignee_role = 'vendor' and status = 'confirmed'),
    'venue', jsonb_build_object('name', coalesce((select name from venues where id = v_event.venue_id), v_event.venue),
                                'host_linked', v_event.venue_partner_id is not null
                                  or exists (select 1 from venues v where v.id = v_event.venue_id and v.partner_profile_id is not null)),
    'staff', (select count(*) from event_assignments where event_id = p_event_id and assignee_role = 'staff' and status <> 'declined'),
    'crew', (select count(*) from event_assignments where event_id = p_event_id and assignee_role = 'crew' and status <> 'declined'),
    'volunteers', (select count(*) from event_assignments where event_id = p_event_id and assignee_role = 'volunteer' and status <> 'declined'),
    'volunteer_access_active', (select count(*) from temporary_access where event_id = p_event_id and revoked_at is null
                                and granted_at <= now() and expires_at > now()),
    'access_requests_pending', (select count(*) from access_requests where event_id = p_event_id and status = 'pending'),
    'capacity', v_event.capacity,
    'tickets_sold', (select count(*) from tickets where event_id = p_event_id and status <> 'cancelled'),
    'checked_in', (select count(*) from tickets where event_id = p_event_id and status = 'checked_in'),
    'messages_awaiting_reply', (select count(*) from conversations where related_session_id = p_event_id
                                and conversation_type <> 'general' and status = 'open'),
    'tasks_pending', (select count(*) from event_tasks t join event_assignments ea on ea.id = t.assignment_id
                      where ea.event_id = p_event_id and t.status <> 'done'),
    'requirements_open', (select count(*) from event_requirements where event_id = p_event_id and status in ('requested', 'changes_requested')),
    'requirements_to_review', (select count(*) from event_requirements where event_id = p_event_id and status = 'submitted'),
    'announcements_active', (select count(*) from announcements where event_id = p_event_id and status = 'published'
                             and publish_at <= now() and (expire_at is null or expire_at > now())),
    'documents', (select count(*) from event_documents where event_id = p_event_id)
  );
end;
$$;

-- Partner, volunteer and communication analytics (reports.view). Real counts only.
create or replace function report_platform_activity(p_from date default null, p_to date default null)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_from timestamptz := coalesce(p_from, current_date - 90)::timestamptz;
  v_to timestamptz := (coalesce(p_to, current_date) + 1)::timestamptz;
begin
  if not has_permission('reports.view') then
    raise exception 'You do not have access to reports.';
  end if;
  return jsonb_build_object(
    'partners', jsonb_build_object(
      'artists', (select count(*) from artists where status = 'approved'),
      'sponsors', (select count(*) from profiles where role = 'sponsor' and is_active),
      'vendors', (select count(*) from profiles where role = 'vendor' and is_active),
      'venue_hosts', (select count(*) from profiles where role = 'venue' and is_active),
      'volunteers', (select count(*) from profiles where role = 'volunteer' and is_active)),
    'volunteers', jsonb_build_object(
      'assignments', (select count(*) from event_assignments ea join events e on e.id = ea.event_id
                      where ea.assignee_role = 'volunteer' and ea.status <> 'declined' and e.event_date between v_from::date and v_to::date),
      'access_grants', (select count(*) from temporary_access where granted_at >= v_from and granted_at < v_to),
      'access_revoked', (select count(*) from temporary_access where revoked_at >= v_from and revoked_at < v_to),
      'access_requests', (select count(*) from access_requests where created_at >= v_from and created_at < v_to),
      'checkins_by_volunteers', (select count(*) from checkins c join profiles p on p.id = c.checked_in_by
                                 where p.role = 'volunteer' and c.checked_in_at >= v_from and c.checked_in_at < v_to)),
    'communication', jsonb_build_object(
      'conversations', (select count(*) from conversations where conversation_type <> 'general' and created_at >= v_from and created_at < v_to),
      'messages', (select count(*) from messages m join conversations c on c.id = m.conversation_id
                   where c.conversation_type <> 'general' and m.created_at >= v_from and m.created_at < v_to),
      'awaiting_reply', (select count(*) from conversations where conversation_type <> 'general' and status = 'open'),
      'by_type', (select coalesce(jsonb_object_agg(conversation_type, n), '{}'::jsonb) from (
                    select conversation_type, count(*) n from conversations
                    where conversation_type <> 'general' and created_at >= v_from and created_at < v_to group by 1) x),
      'median_first_reply_minutes', (
        select round(percentile_cont(0.5) within group (order by extract(epoch from first_reply - first_msg) / 60)::numeric, 0)
        from (
          select c.id,
                 (select min(created_at) from messages m where m.conversation_id = c.id and m.sender_id = c.external_user_id) as first_msg,
                 (select min(created_at) from messages m where m.conversation_id = c.id and m.sender_id <> c.external_user_id
                    and m.created_at > (select min(created_at) from messages m2 where m2.conversation_id = c.id and m2.sender_id = c.external_user_id)) as first_reply
          from conversations c
          where c.conversation_type <> 'general' and c.created_at >= v_from and c.created_at < v_to
        ) t where first_reply is not null)),
    'requirements', jsonb_build_object(
      'requested', (select count(*) from event_requirements where created_at >= v_from and created_at < v_to),
      'answered', (select count(*) from event_requirements where responded_at >= v_from and responded_at < v_to),
      'open', (select count(*) from event_requirements where status in ('requested', 'changes_requested')))
  );
end;
$$;

-- Super admin can grant/revoke permissions for admin and staff. `roles.manage`
-- is never delegable (it can mint super admins), and the super admin row is fixed.
create or replace function set_role_permission(p_role user_role, p_permission text, p_enabled boolean)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not has_permission('roles.manage') then
    raise exception 'Only a super admin can change role permissions.';
  end if;
  if p_role not in ('admin', 'staff') then
    raise exception 'Only the Admin / Manager and Staff roles can be edited.';
  end if;
  if p_permission = 'roles.manage' then
    raise exception 'Role management stays with Super Admins.';
  end if;
  if not exists (select 1 from role_permissions where role = 'super_admin' and permission = p_permission) then
    raise exception 'Unknown permission.';
  end if;
  if p_enabled then
    insert into role_permissions (role, permission) values (p_role, p_permission) on conflict do nothing;
  else
    delete from role_permissions where role = p_role and permission = p_permission;
  end if;
  if found then
    perform audit_write(case when p_enabled then 'permission.granted' else 'permission.revoked' end,
      'role_permission', p_role::text || ':' || p_permission, jsonb_build_object('role', p_role, 'permission', p_permission));
  end if;
end;
$$;

-- Grants for authenticated callers (every function re-checks inside).
grant execute on function event_member_kind(uuid, uuid), submit_requirement(uuid, text), review_requirement(uuid, boolean, text),
  my_notifications(int, timestamptz, boolean), notification_unread_count(), mark_notifications_read(uuid[]),
  portal_announcements(int), start_partner_conversation(text, text, uuid), admin_start_partner_conversation(uuid, text, text, uuid),
  send_message(uuid, text), set_conversation_status(uuid, conversation_status), mark_conversation_read(uuid),
  my_conversations(), admin_conversations(text, uuid, text, text, boolean, int, int), conversation_messages(uuid, int, timestamptz),
  grant_temporary_access(uuid, uuid, int, uuid), revoke_temporary_access(uuid, text), request_checkin_access(uuid, text),
  decline_access_request(uuid, text), my_checkin_access(), volunteers_overview(text, uuid, text, int, int),
  volunteer_access_activity(uuid), my_checkin_events(), event_command_center(uuid), report_platform_activity(date, date),
  set_role_permission(user_role, text, boolean)
to authenticated;

-- ===========================================================================
-- 13. PORTAL EVENTS — "what am I part of, and what do I need to know?"
-- ===========================================================================
-- One row per (event, capacity) for the caller only. Artist rows carry the
-- private logistics; assignment rows carry call times/instructions/fees.
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

-- Approval provisioning may now also activate the artist role (user -> artist),
-- alongside the partner roles 0017 already allowed. Everything else unchanged.
create or replace function prevent_role_self_escalation()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_jwt_role text := coalesce(auth.role(), '');
begin
  if new.role is not distinct from old.role and new.is_active is not distinct from old.is_active then
    return new;
  end if;

  -- No end-user JWT: SQL editor / migrations / service role (bootstrap path).
  if v_jwt_role not in ('authenticated', 'anon') then
    return new;
  end if;

  if new.id = auth.uid() then
    raise exception 'You cannot change your own role or account status.';
  end if;

  -- Application approval provisioning: user -> partner/artist role only, by a reviewer.
  if new.is_active is not distinct from old.is_active
     and old.role = 'user'
     and new.role in ('vendor', 'sponsor', 'volunteer', 'crew', 'venue', 'artist')
     and has_permission('applications.review') then
    return new;
  end if;

  if not has_permission('roles.manage') then
    raise exception 'Only a super admin can change roles or account status.';
  end if;
  return new;
end;
$$;
