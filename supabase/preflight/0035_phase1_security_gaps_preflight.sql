-- READ-ONLY preflight for 0035_phase1_security_gaps.sql. Run it in the SQL
-- editor BEFORE applying 0035. Every statement is a SELECT; nothing changes.

-- 1. Baseline. Expect: has_0034 = true, has_0035 = false.
select
  to_regclass('public.role_permissions') is not null                                  as has_0017,
  to_regprocedure('public.artist_day_status(uuid,date,time,time,uuid)') is not null   as has_0034,
  to_regprocedure('public.guard_application_start()') is not null                     as has_0035;

-- 2. BLOCKING: accounts with more than one artist row. 0035 adds a unique
--    index on artists.user_id and stops if anything appears here. Decide by
--    hand which row each account keeps — 0035 never deletes or detaches rows.
select user_id, count(*) as artist_rows, array_agg(id order by applied_at) as artist_ids,
       array_agg(status order by applied_at) as statuses
from public.artists where user_id is not null
group by user_id having count(*) > 1;

-- 3. SECURITY DEFINER functions callable without signing in (before 0035
--    this is ~150 rows; after it, only functions that check the caller
--    themselves, the intentionally public ones and the RLS helpers).
select p.oid::regprocedure as function, p.prorettype = 'trigger'::regtype as is_trigger
from pg_proc p
where p.pronamespace = 'public'::regnamespace and p.prosecdef
  and has_function_privilege('anon', p.oid, 'execute')
order by 1;

-- 4–7: NOT blocking. Possible traces of the holes 0035 closes having been
-- used already. 0035 does not touch these rows — review them by hand.

-- 4. Approved artists / partner applications that no reviewer approved
--    (the approve_* functions always record reviewed_by).
select 'artists' as source, id, user_id, status::text, reviewed_by from public.artists
  where status <> 'pending' and reviewed_by is null
union all
select 'collaborations', id, user_id, status::text, reviewed_by from public.collaborations
  where status <> 'pending' and reviewed_by is null;

-- 5. Private enquiries not pending and contact enquiries not new that no one
--    on the team has touched (no audit entry for them).
select 'private_enquiries' as source, e.id, e.user_id, e.status::text, e.created_at from public.private_enquiries e
  where e.status <> 'pending'
    and not exists (select 1 from public.audit_logs a where a.resource_id = e.id::text and a.actor_id is not null)
union all
select 'contact_enquiries', e.id, e.user_id, e.status, e.created_at from public.contact_enquiries e
  where e.status <> 'new'
    and not exists (select 1 from public.audit_logs a where a.resource_id = e.id::text and a.actor_id is not null);

-- 6. Profiles whose email differs from the real sign-in email.
select p.id, p.email as profile_email, u.email as auth_email, p.role
from public.profiles p join auth.users u on u.id = p.id
where p.email is distinct from u.email;

-- 7. Conversation participants marked 'admin' who are not on the team.
select cp.conversation_id, cp.user_id, p.role, cp.joined_at
from public.conversation_participants cp join public.profiles p on p.id = cp.user_id
where cp.role = 'admin' and p.role not in ('staff', 'admin', 'super_admin');
