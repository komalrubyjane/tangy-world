-- Rollback for 0030_invitations_and_volunteer_access.sql: no invitations
-- table (its rows are dropped — accepted roles stay on profiles), the 0018
-- role guard / staff scoping / volunteer approval, 0018's assignment check and 0025's duplicate guard.
-- crew_applications.event_id is dropped (event_interest keeps the session name).
begin;

drop trigger if exists crew_applications_guard_insert on crew_applications;
drop function if exists guard_crew_application_insert();
drop index if exists crew_applications_event_id_idx;
alter table crew_applications drop column if exists event_id;

drop function if exists accept_account_invitation(text);
drop function if exists invitation_preview(text);
drop function if exists list_account_invitations(int);
drop function if exists revoke_account_invitation(uuid);
drop function if exists set_invitation_email_status(uuid, text);
drop function if exists create_account_invitation(text, text, user_role, text);
drop function if exists invitation_state(account_invitations);
drop function if exists can_invite_role(user_role);
drop function if exists console_role_rank(user_role);
drop table if exists account_invitations;
delete from role_permissions where permission = 'staff.invite';

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

create or replace function is_assigned_to_event(p_event_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select current_role_name() is not null and exists (
    select 1 from event_assignments
    where event_id = p_event_id and assignee_id = auth.uid() and status <> 'declined'
  );
$$;

create or replace function approve_crew_application(p_id uuid, p_notes text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_app crew_applications%rowtype;
begin
  if not has_permission('applications.review') then
    raise exception 'You do not have permission to review applications.';
  end if;
  select * into v_app from crew_applications where id = p_id for update;
  if v_app.id is null then
    raise exception 'Application not found.';
  end if;
  if v_app.status <> 'pending' then
    raise exception 'This application has already been reviewed (%).', v_app.status;
  end if;

  update crew_applications
    set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), review_notes = p_notes
    where id = p_id;

  if v_app.user_id is not null then
    if v_app.category = 'volunteer' then
      insert into volunteer_profiles (id) values (v_app.user_id) on conflict (id) do nothing;
      update profiles set role = 'volunteer' where id = v_app.user_id and role = 'user';
    else
      insert into crew_profiles (id) values (v_app.user_id) on conflict (id) do nothing;
      update profiles set role = 'crew' where id = v_app.user_id and role = 'user';
    end if;

    insert into application_notifications (source_table, source_id, notification_type)
    values ('crew_applications', p_id, 'approval')
    on conflict (source_table, source_id, notification_type) do nothing;
  end if;

  perform audit_write('application.approved', 'crew_application', p_id::text,
    jsonb_build_object('type', v_app.category, 'applicant', v_app.name, 'notes', p_notes,
      'role_provisioned', v_app.user_id is not null));
end;
$$;

create or replace function guard_duplicate_application()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_label text;
  v_dup boolean := false;
begin
  if new.user_id is null then
    return new;
  end if;
  -- Serialise this user's submissions so two quick clicks can't both pass.
  perform pg_advisory_xact_lock(hashtext('application:' || new.user_id::text));
  if tg_table_name = 'collaborations' then
    v_label := replace(new.type::text, '_', ' ');
    v_dup := exists (select 1 from collaborations where user_id = new.user_id and type = new.type and status = 'pending');
  elsif tg_table_name = 'crew_applications' then
    v_label := coalesce(new.category, 'crew');
    v_dup := exists (select 1 from crew_applications where user_id = new.user_id and category is not distinct from new.category and status = 'pending');
  elsif tg_table_name = 'artists' then
    v_label := 'artist';
    v_dup := exists (select 1 from artists where user_id = new.user_id and status = 'pending');
  elsif tg_table_name = 'private_enquiries' then
    v_label := 'private session';
    v_dup := exists (select 1 from private_enquiries where user_id = new.user_id and type = new.type and status = 'pending');
  elsif tg_table_name = 'contact_enquiries' then
    -- The same message twice within a day is a double submit, not a new enquiry.
    if exists (select 1 from contact_enquiries where user_id = new.user_id and created_at > now() - interval '24 hours'
               and lower(btrim(message)) = lower(btrim(new.message))) then
      raise exception 'DUPLICATE_APPLICATION: We already have this message — the team will reply soon.';
    end if;
    return new;
  end if;
  if v_dup then
    raise exception 'DUPLICATE_APPLICATION: You already have a pending % application — we''ll be in touch.', v_label;
  end if;
  return new;
end;
$$;

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

commit;
