-- Tangy Sessions — close a privilege-escalation gap in 0002_rls.sql.
--
-- "profiles: self update" (0002) lets a signed-in user PATCH their own profiles
-- row, but a bare RLS policy has no column granularity — as written, that also
-- lets them PATCH their own `role` straight to 'admin' or 'super_admin' via the
-- REST API. This trigger blocks any change to `role` unless the actor is
-- already an admin. Artist status is authorized separately via the `artists`
-- table (user_id + status='approved'), never via profiles.role, so this
-- doesn't need an exception for artist self-signup.

create function prevent_role_self_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role and not is_admin() then
    raise exception 'Only an admin can change a profile role.';
  end if;
  return new;
end;
$$;

create trigger guard_profile_role_change
  before update on profiles
  for each row execute function prevent_role_self_escalation();

-- Same gap on artists: "artists: self update own profile" (0002) lets an artist
-- PATCH any column on their own row, including `status` — self-approving their
-- own application. Only an admin should be able to change application status.
create function prevent_artist_status_self_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status is distinct from old.status and not is_admin() then
    raise exception 'Only an admin can change an artist application status.';
  end if;
  return new;
end;
$$;

create trigger guard_artist_status_change
  before update on artists
  for each row execute function prevent_artist_status_self_escalation();
