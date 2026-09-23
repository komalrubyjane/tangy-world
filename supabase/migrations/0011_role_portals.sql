-- Tangy Sessions — real role-specific portal backend (Phase 3).
-- Run after 0010_venue_role.sql.
--
-- Design decisions (see also src/pages/dashboards/* and supabase/README.md):
--
-- 1. Crew and Volunteer share ONE application intake (crew_applications),
--    distinguished by a new `category` column — the row shape (name/email/
--    phone/role_interest/message/status) is identical, only the workflow
--    framing differs, so a parallel table would just duplicate RLS.
--
-- 2. Crew/Volunteer/Vendor event staffing shares ONE `event_assignments`
--    table (assignee_role distinguishes them) instead of three near-
--    identical tables — same reasoning.
--
-- 3. Sponsor gets `sponsor_deliverables` (a real, simple sponsor<->event
--    need). Venue gets `venue_profiles` (mirrors the existing vendor/
--    sponsor/volunteer/crew_profiles pattern) plus a nullable
--    events.venue_partner_id so "which events is my venue hosting" is a
--    real query, not a placeholder.
--
-- 4. NOT built: venue_spaces, sponsor "campaigns" as a separate object,
--    vendor/sponsor payment tracking, private-session "projects" — none of
--    these have a real backend workflow at Tangy today.
--
-- 5. Approval now provisions the role for real via SECURITY DEFINER RPCs
--    (approve_crew_application / approve_collaboration below) — the client
--    never writes profiles.role or a *_profiles row directly on approval.

-- CREW vs VOLUNTEER — same table, distinguished by category ------------

alter table crew_applications
  add column if not exists category text not null default 'crew' check (category in ('crew', 'volunteer'));

create index if not exists crew_applications_category_idx on crew_applications (category);

-- VENUE_PROFILES ---------------------------------------------------------

create table venue_profiles (
  id uuid primary key references profiles(id) on delete cascade,
  property_name text,
  location text,
  capacity int,
  description text,
  updated_at timestamptz not null default now()
);

create trigger venue_profiles_set_updated_at before update on venue_profiles
  for each row execute function set_updated_at();

alter table venue_profiles enable row level security;
create policy "venue_profiles: self read" on venue_profiles for select using (auth.uid() = id);
create policy "venue_profiles: self update" on venue_profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "venue_profiles: admin full access" on venue_profiles for all using (is_admin());

-- Which approved venue partner is hosting a given event (nullable — most
-- events don't have one on file yet).
alter table events add column if not exists venue_partner_id uuid references profiles(id) on delete set null;
create index if not exists events_venue_partner_id_idx on events (venue_partner_id);

-- EVENT_ASSIGNMENTS — crew/volunteer/vendor staffing for an event --------

create type event_assignment_status as enum ('assigned', 'confirmed', 'declined', 'completed');

create table event_assignments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  assignee_role text not null check (assignee_role in ('crew', 'volunteer', 'vendor')),
  assignee_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  status event_assignment_status not null default 'assigned',
  notes text,
  assigned_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index event_assignments_event_id_idx on event_assignments (event_id);
create index event_assignments_assignee_id_idx on event_assignments (assignee_id);

create trigger event_assignments_set_updated_at before update on event_assignments
  for each row execute function set_updated_at();

alter table event_assignments enable row level security;

create policy "event_assignments: self or staff read" on event_assignments for select
  using (assignee_id = auth.uid() or is_staff_or_admin());
create policy "event_assignments: staff/admin write" on event_assignments for all
  using (is_staff_or_admin());
-- Assignee can respond (confirm/decline) — column/transition granularity is
-- enforced by the trigger below, the same pattern as 0003_role_security.sql.
create policy "event_assignments: assignee respond" on event_assignments for update
  using (assignee_id = auth.uid());

create function guard_event_assignment_response()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if is_staff_or_admin() then
    return new;
  end if;
  if new.event_id is distinct from old.event_id
     or new.assignee_role is distinct from old.assignee_role
     or new.assignee_id is distinct from old.assignee_id
     or new.title is distinct from old.title
     or new.notes is distinct from old.notes
     or new.assigned_by is distinct from old.assigned_by then
    raise exception 'Only staff/admin can change assignment details.';
  end if;
  if new.status is distinct from old.status
     and not (old.status = 'assigned' and new.status in ('confirmed', 'declined')) then
    raise exception 'You can only confirm or decline a pending assignment.';
  end if;
  return new;
end;
$$;

create trigger guard_event_assignment_response_trigger before update on event_assignments
  for each row execute function guard_event_assignment_response();

-- EVENT_TASKS — lightweight per-assignment checklist (crew TASKS tab) ----

create table event_tasks (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references event_assignments(id) on delete cascade,
  title text not null,
  description text,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  due_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index event_tasks_assignment_id_idx on event_tasks (assignment_id);

create trigger event_tasks_set_updated_at before update on event_tasks
  for each row execute function set_updated_at();

create function is_own_assignment(p_assignment_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from event_assignments
    where id = p_assignment_id and assignee_id = auth.uid()
  );
$$;

alter table event_tasks enable row level security;

create policy "event_tasks: assignee or staff read" on event_tasks for select
  using (is_own_assignment(assignment_id) or is_staff_or_admin());
create policy "event_tasks: staff/admin write" on event_tasks for all
  using (is_staff_or_admin());
create policy "event_tasks: assignee update status" on event_tasks for update
  using (is_own_assignment(assignment_id));

create function guard_event_task_status()
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

create trigger guard_event_task_status_trigger before update on event_tasks
  for each row execute function guard_event_task_status();

-- SPONSOR_DELIVERABLES ----------------------------------------------------

create table sponsor_deliverables (
  id uuid primary key default gen_random_uuid(),
  sponsor_profile_id uuid not null references sponsor_profiles(id) on delete cascade,
  event_id uuid references events(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'delivered')),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sponsor_deliverables_sponsor_profile_id_idx on sponsor_deliverables (sponsor_profile_id);

create trigger sponsor_deliverables_set_updated_at before update on sponsor_deliverables
  for each row execute function set_updated_at();

alter table sponsor_deliverables enable row level security;
create policy "sponsor_deliverables: self read" on sponsor_deliverables for select
  using (sponsor_profile_id = auth.uid() or is_staff_or_admin());
create policy "sponsor_deliverables: admin write" on sponsor_deliverables for all
  using (is_admin());

-- APPROVAL RPCs — status change + role/profile provisioning, atomically --
-- and admin-only. The client never writes profiles.role or inserts into a
-- *_profiles table directly for an approval; it only ever calls these.

create function approve_crew_application(p_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_app crew_applications%rowtype;
begin
  if not is_admin() then
    raise exception 'Only an admin can approve applications.';
  end if;
  select * into v_app from crew_applications where id = p_id;
  if v_app.id is null then
    raise exception 'Application not found.';
  end if;

  update crew_applications set status = 'approved' where id = p_id;

  -- No linked account (applied while signed out) — status is approved, but
  -- there's no profile to provision a role onto.
  if v_app.user_id is not null then
    if v_app.category = 'volunteer' then
      insert into volunteer_profiles (id) values (v_app.user_id) on conflict (id) do nothing;
      update profiles set role = 'volunteer' where id = v_app.user_id and role = 'user';
    else
      insert into crew_profiles (id) values (v_app.user_id) on conflict (id) do nothing;
      update profiles set role = 'crew' where id = v_app.user_id and role = 'user';
    end if;
  end if;
end;
$$;

create function reject_crew_application(p_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Only an admin can reject applications.';
  end if;
  update crew_applications set status = 'rejected' where id = p_id;
end;
$$;

create function approve_collaboration(p_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_collab collaborations%rowtype;
begin
  if not is_admin() then
    raise exception 'Only an admin can approve collaborations.';
  end if;
  select * into v_collab from collaborations where id = p_id;
  if v_collab.id is null then
    raise exception 'Collaboration not found.';
  end if;

  update collaborations set status = 'approved' where id = p_id;

  if v_collab.user_id is not null then
    if v_collab.type = 'vendor' then
      insert into vendor_profiles (id, business_name) values (v_collab.user_id, v_collab.business_name) on conflict (id) do nothing;
      update profiles set role = 'vendor' where id = v_collab.user_id and role = 'user';
    elsif v_collab.type = 'sponsor' then
      insert into sponsor_profiles (id, organization_name) values (v_collab.user_id, v_collab.business_name) on conflict (id) do nothing;
      update profiles set role = 'sponsor' where id = v_collab.user_id and role = 'user';
    elsif v_collab.type = 'venue_host' then
      insert into venue_profiles (id, property_name) values (v_collab.user_id, v_collab.business_name) on conflict (id) do nothing;
      update profiles set role = 'venue' where id = v_collab.user_id and role = 'user';
    end if;
  end if;
end;
$$;

create function reject_collaboration(p_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Only an admin can reject collaborations.';
  end if;
  update collaborations set status = 'rejected' where id = p_id;
end;
$$;
