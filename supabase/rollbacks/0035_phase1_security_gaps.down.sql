-- Rollback for 0035_phase1_security_gaps.sql — returns to the 0034 state.
--
-- WARNING: re-opens what 0035 closed (self-approved artists / partner
-- applications / enquiries, self-editable profile email, waitlist reads via
-- profiles.email, pending artists on legacy assignment requests, non-team
-- 'admin' conversation participants, internal functions callable by anyone).
-- Changes no rows: the unique index on artists.user_id is dropped, the ACL
-- snapshot table 0035 created is dropped after it has been used.

-- 7. Function privileges: restore each function's ACL exactly as 0035
--    recorded it before changing anything.
do $$
declare
  s record;
  a record;
  v_owner oid;
begin
  if to_regclass('public._security_0035_function_acl') is null then
    raise exception 'STOP: _security_0035_function_acl is missing — cannot restore function privileges exactly. Nothing was changed.';
  end if;
  for s in select signature, acl from _security_0035_function_acl loop
    if to_regprocedure(s.signature) is null then
      continue;  -- function no longer exists
    end if;
    select proowner into v_owner from pg_proc where oid = to_regprocedure(s.signature);
    execute format('revoke all on function %s from public, anon, authenticated, service_role', s.signature);
    for a in select * from aclexplode(coalesce(s.acl, acldefault('f', v_owner))) where grantee <> v_owner loop
      execute format('grant execute on function %s to %s', s.signature,
        case when a.grantee = 0 then 'public' else quote_ident((select rolname from pg_roles where oid = a.grantee)) end);
    end loop;
  end loop;
end $$;
drop table if exists _security_0035_function_acl;

-- 6.
drop trigger if exists conversation_participants_guard_admin on conversation_participants;
drop function if exists guard_conversation_admin_participant();

-- 5.
drop trigger if exists assignment_requests_guard_artist on assignment_requests;
drop function if exists guard_assignment_request_artist();

-- 4. (0009's policy, as it was)
drop policy if exists "waitlist: self read own by verified email" on waitlist;
drop policy if exists "waitlist: self read own by email" on waitlist;
create policy "waitlist: self read own by email" on waitlist for select
  using (email = (select email from profiles where id = auth.uid()));

-- 3.
drop trigger if exists on_auth_user_email_changed on auth.users;
drop function if exists sync_profile_email();
drop trigger if exists guard_profile_identity_change on profiles;
drop function if exists guard_profile_identity();

-- 2.
drop index if exists artists_user_id_unique;

-- 1.
drop trigger if exists artists_guard_start on artists;
drop trigger if exists collaborations_guard_start on collaborations;
drop trigger if exists private_enquiries_guard_start on private_enquiries;
drop trigger if exists contact_enquiries_guard_start on contact_enquiries;
drop function if exists guard_application_start();
