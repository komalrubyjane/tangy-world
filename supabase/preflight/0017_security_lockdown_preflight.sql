-- READ-ONLY preflight for 0017_security_lockdown.sql. Run it in the
-- Supabase SQL editor BEFORE applying 0017. Every statement is a SELECT —
-- it changes nothing. Read each result set top to bottom.

-- 1. Which baseline is this database on?
--    Expect: has_0016 = true, has_platform_finalization = false,
--            has_0017 = false. If has_platform_finalization is true, STOP:
--            0017 targets the 0016 schema (it will refuse to run anyway).
select
  to_regprocedure('public.check_in_ticket(text,uuid)') is not null as has_0016,
  to_regclass('public.role_permissions') is not null               as has_platform_finalization,
  to_regprocedure('public.guard_artist_insert()') is not null       as has_0017;

-- 2. BLOCKING: accounts with more than one artist row. 0017 adds a unique
--    index on artists.user_id and stops if any appear here. Decide by hand
--    which row each account keeps; 0017 never deletes or detaches rows.
select user_id, count(*) as artist_rows, array_agg(id order by applied_at) as artist_ids,
       array_agg(status order by applied_at) as statuses
from public.artists
where user_id is not null
group by user_id
having count(*) > 1;

-- 3. Who can currently call each SECURITY DEFINER function through the API.
--    Before 0017 expect anon/authenticated = true almost everywhere — that
--    is the vulnerability.
select p.oid::regprocedure as function,
       has_function_privilege('anon', p.oid, 'execute')          as anon,
       has_function_privilege('authenticated', p.oid, 'execute') as authenticated,
       has_function_privilege('service_role', p.oid, 'execute')  as service_role
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef
order by 1;

-- 4. Foreign keys 0017 changes from CASCADE to RESTRICT (constraint names
--    are looked up dynamically; this just shows the current state).
select conrelid::regclass as table_name, conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where contype = 'f'
  and conrelid::regclass::text in ('bookings', 'tickets', 'checkins')
  and confrelid::regclass::text in ('events', 'bookings', 'tickets')
order by 1, 2;

-- -------------------------------------------------------------------------
-- 5–9: NOT blocking. Possible traces of the holes 0017 closes having been
-- used already. 0017 does not touch these rows — review them by hand.

-- 5. Artists that are approved but were never reviewed through the admin
--    approval RPC (which always sets reviewed_at).
select id, user_id, name, email, status, applied_at, reviewed_at
from public.artists
where status <> 'pending' and reviewed_at is null;

-- 6. Applications that are approved/rejected but have no approval-email
--    record (approve_* RPCs always queue one when user_id is set).
select 'collaborations' as source, c.id, c.user_id, c.type::text as kind, c.status, c.created_at
from public.collaborations c
where c.status = 'approved' and c.user_id is not null
  and not exists (select 1 from public.application_notifications n where n.source_table = 'collaborations' and n.source_id = c.id)
union all
select 'crew_applications', a.id, a.user_id, a.category, a.status, a.created_at
from public.crew_applications a
where a.status = 'approved' and a.user_id is not null
  and not exists (select 1 from public.application_notifications n where n.source_table = 'crew_applications' and n.source_id = a.id);

-- 7. Profiles whose email differs from the account's real sign-in email.
select p.id, p.email as profile_email, u.email as auth_email, p.role
from public.profiles p join auth.users u on u.id = p.id
where p.email is distinct from u.email;

-- 8. Confirmed bookings without a verified Razorpay signature (the
--    free-ticket RPC path, or the admin "CONFIRM" button).
select id, registration_code, user_id, event_id, amount, status, razorpay_order_id, razorpay_payment_id, created_at
from public.bookings
where status = 'confirmed' and not razorpay_signature_verified
order by created_at desc;

-- 9. Every super_admin / admin / staff account (check each is expected).
select p.id, p.email, p.role, p.updated_at
from public.profiles p
where p.role in ('super_admin', 'admin', 'staff')
order by p.role, p.email;
