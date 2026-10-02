-- Tangy Sessions — account invitations and event-scoped volunteer access (0030).
-- One transaction, rolled back at the end. Run: scripts/test-db.sh

\set ON_ERROR_STOP 1
\set QUIET 1
begin;

delete from event_assignments; delete from crew_applications; delete from account_invitations;
delete from bookings; delete from waitlist; delete from collaborations;
delete from private_enquiries; delete from contact_enquiries;
delete from conversations; delete from notifications; delete from email_outbox;
delete from events; delete from artists; delete from auth.users;

create schema tt;
create function tt.login(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;
create function tt.anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('role', 'anon', true);
end $$;
create function tt.logout() returns void language plpgsql as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
end $$;
create function tt.expect_error(p_sql text, p_pattern text, p_label text) returns void language plpgsql as $$
begin
  execute p_sql;
  raise exception 'FAIL [%]: expected an error matching "%", but the statement succeeded', p_label, p_pattern;
exception when others then
  if sqlerrm like 'FAIL [%' then raise; end if;
  if sqlerrm not ilike p_pattern then
    raise exception 'FAIL [%]: expected error matching "%", got "%"', p_label, p_pattern, sqlerrm;
  end if;
  raise notice 'ok  %', p_label;
end $$;
create function tt.check(p_cond boolean, p_label text) returns void language plpgsql as $$
begin
  if p_cond is not true then
    raise exception 'FAIL [%]', p_label;
  end if;
  raise notice 'ok  %', p_label;
end $$;
create function tt.role_of(p_uid uuid) returns text language sql security definer as $$
  select role::text from profiles where id = p_uid;
$$;
create function tt.hash(p_token text) returns text language sql as $$
  select encode(extensions.digest(p_token, 'sha256'), 'hex');
$$;
create function tt.inv(p_email text) returns account_invitations language sql security definer as $$
  select * from account_invitations where email = p_email
  order by (accepted_at is null and revoked_at is null) desc, created_at desc limit 1;
$$;
create function tt.app_status(p_uid uuid) returns text language sql security definer as $$
  select status::text from crew_applications where user_id = p_uid order by created_at desc limit 1;
$$;
create function tt.app_id(p_uid uuid) returns uuid language sql security definer as $$
  select id from crew_applications where user_id = p_uid order by created_at desc limit 1;
$$;
create function tt.vol_place(p_uid uuid, p_event uuid) returns boolean language sql security definer as $$
  select exists (select 1 from event_assignments where assignee_id = p_uid and event_id = p_event and assignee_role = 'volunteer');
$$;
grant usage on schema tt to anon, authenticated;
grant execute on all functions in schema tt to anon, authenticated;

-- Tokens are 64 hex characters; only their hashes are stored.
\set tok_admin   '''aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'''
\set tok_super   '''bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'''
\set tok_staff   '''cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc'''
\set tok_staff2  '''dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd'''
\set tok_old     '''eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'''
\set tok_rev     '''ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'''

insert into auth.users (id, email, aud, role, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000c100', 'root@inv.tangy.test',   'authenticated', 'authenticated', '{"full_name":"Root Super"}'),
  ('00000000-0000-0000-0000-00000000c101', 'mgr@inv.tangy.test',    'authenticated', 'authenticated', '{"full_name":"Mira Manager"}'),
  ('00000000-0000-0000-0000-00000000c102', 'staff@inv.tangy.test',  'authenticated', 'authenticated', '{"full_name":"Sam Staff"}'),
  ('00000000-0000-0000-0000-00000000c103', 'newadmin@inv.tangy.test','authenticated', 'authenticated', '{}'),
  ('00000000-0000-0000-0000-00000000c104', 'other@inv.tangy.test',  'authenticated', 'authenticated', '{}'),
  ('00000000-0000-0000-0000-00000000c105', 'newsuper@inv.tangy.test','authenticated', 'authenticated', '{}'),
  ('00000000-0000-0000-0000-00000000c106', 'member@inv.tangy.test', 'authenticated', 'authenticated', '{"full_name":"Meera Member"}');
update profiles set role = 'super_admin' where id = '00000000-0000-0000-0000-00000000c100';
update profiles set role = 'admin' where id = '00000000-0000-0000-0000-00000000c101';
update profiles set role = 'staff' where id = '00000000-0000-0000-0000-00000000c102';

insert into events (id, slug, name, event_date, venue, capacity, price, status) values
  ('00000000-0000-0000-0000-00000000c601', 'inv-night', 'Volunteer Night', current_date + 5, 'Stepwell', 40, 1000, 'on-sale'),
  ('00000000-0000-0000-0000-00000000c602', 'inv-draft', 'Draft Night', current_date + 9, 'Baradari', 40, 1000, 'draft');

\echo '--- 1. Who can invite whom'
select tt.anon();
select tt.expect_error($$select create_account_invitation('x@inv.tangy.test', 'X', 'staff', $$ || quote_literal(tt.hash(:tok_staff)) || $$)$$,
  '%permission denied%', 'signed-out visitors cannot create invitations');
select tt.expect_error($$select * from account_invitations$$, '%permission denied%', 'the invitations table is not readable by visitors');
select tt.login('00000000-0000-0000-0000-00000000c102');
select tt.expect_error($$select create_account_invitation('x@inv.tangy.test', 'X', 'staff', $$ || quote_literal(tt.hash(:tok_staff)) || $$)$$,
  '%permission to invite%', 'staff cannot invite');
select tt.expect_error($$select * from account_invitations$$, '%permission denied%', 'the invitations table is not readable by console users either');
select tt.login('00000000-0000-0000-0000-00000000c101');
select tt.expect_error($$select create_account_invitation('newadmin@inv.tangy.test', 'New Admin', 'admin', $$ || quote_literal(tt.hash(:tok_admin)) || $$)$$,
  '%permission to invite%', 'an Admin / Manager cannot invite an admin');
select tt.expect_error($$select create_account_invitation('newsuper@inv.tangy.test', 'New Super', 'super_admin', $$ || quote_literal(tt.hash(:tok_super)) || $$)$$,
  '%permission to invite%', 'an Admin / Manager cannot invite a super admin');
select tt.expect_error($$select create_account_invitation('member@inv.tangy.test', 'Meera', 'user', $$ || quote_literal(tt.hash(:tok_staff)) || $$)$$,
  '%Super Admin, Admin / Manager and Staff%', 'invitations cannot carry a non-console role');
select create_account_invitation('Other@Inv.Tangy.Test ', 'Olu Other', 'staff', tt.hash(:tok_staff));
select tt.check((tt.inv('other@inv.tangy.test')).role = 'staff', 'an Admin / Manager can invite staff (email normalised)');
select tt.check((tt.inv('other@inv.tangy.test')).token_hash = tt.hash(:tok_staff), 'only the token hash is stored');
select tt.check((tt.inv('other@inv.tangy.test')).expires_at > now() + interval '71 hours', 'invitations expire after 72 hours');
select tt.check((select count(*) from list_account_invitations() where email = 'other@inv.tangy.test') = 1, 'the console lists invitations');
select tt.expect_error($$select create_account_invitation('staff@inv.tangy.test', 'Sam', 'staff', $$ || quote_literal(tt.hash(:tok_staff2)) || $$)$$,
  '%already has staff access%', 'cannot invite an account that already has the role');
select tt.expect_error($$select create_account_invitation('mgr@inv.tangy.test', 'Me', 'staff', $$ || quote_literal(tt.hash(:tok_staff2)) || $$)$$,
  '%cannot invite yourself%', 'cannot invite yourself');

select tt.login('00000000-0000-0000-0000-00000000c100');
select create_account_invitation('newadmin@inv.tangy.test', 'New Admin', 'admin', tt.hash(:tok_admin));
select create_account_invitation('newsuper@inv.tangy.test', 'New Super', 'super_admin', tt.hash(:tok_super));
select tt.check((tt.inv('newsuper@inv.tangy.test')).invited_by = '00000000-0000-0000-0000-00000000c100', 'a super admin invites a super admin; the inviter is recorded');
select tt.check((select count(*) from audit_logs where action = 'user.invited' and metadata ->> 'email' like '%@inv.tangy.test') = 3, 'every invitation is audited');

\echo '--- 2. Preview and acceptance'
select tt.anon();
select tt.check(invitation_preview(:tok_admin) ->> 'role' = 'admin' and invitation_preview(:tok_admin) ->> 'state' = 'pending', 'the link previews its role without signing in');
select tt.check(invitation_preview(repeat('0', 64)) ->> 'state' = 'invalid', 'an unknown token is invalid');
select tt.check(invitation_preview('not-a-token') ->> 'state' = 'invalid', 'a malformed token is invalid');
select tt.expect_error($$select accept_account_invitation($$ || quote_literal(:tok_admin) || $$)$$, '%permission denied%', 'accepting needs a signed-in account');

select tt.login('00000000-0000-0000-0000-00000000c104');
select tt.expect_error($$select accept_account_invitation($$ || quote_literal(:tok_admin) || $$)$$, '%different email%', 'another account cannot use the link');
select tt.check(tt.role_of('00000000-0000-0000-0000-00000000c104') = 'user', '… and gains nothing');
select tt.expect_error($$update profiles set role = 'admin' where id = auth.uid()$$, '%cannot change your own role%', 'direct self-promotion is still blocked');

select tt.login('00000000-0000-0000-0000-00000000c103');
select tt.check(accept_account_invitation(:tok_admin) = 'admin', 'the invited address accepts');
select tt.check(tt.role_of('00000000-0000-0000-0000-00000000c103') = 'admin', 'the account becomes Admin / Manager (the invitation decides the role)');
select tt.check((tt.inv('newadmin@inv.tangy.test')).accepted_by = '00000000-0000-0000-0000-00000000c103', 'acceptance is recorded');
select tt.expect_error($$select accept_account_invitation($$ || quote_literal(:tok_admin) || $$)$$, '%already been used%', 'the link is single-use');
select tt.check(invitation_preview(:tok_admin) ->> 'state' = 'accepted', 'the preview shows it as used');

select tt.login('00000000-0000-0000-0000-00000000c105');
select tt.check(accept_account_invitation(:tok_super) = 'super_admin', 'an invited super admin accepts');
select tt.check(tt.role_of('00000000-0000-0000-0000-00000000c105') = 'super_admin', 'the account becomes Super Admin');
select tt.check((select count(*) from audit_logs where action = 'user.invitation_accepted' and resource_id in ('00000000-0000-0000-0000-00000000c103', '00000000-0000-0000-0000-00000000c105')) = 2, 'acceptances are audited');

\echo '--- 3. Expiry, replacement and revocation'
select tt.logout();
select tt.login('00000000-0000-0000-0000-00000000c100');
select create_account_invitation('member@inv.tangy.test', 'Meera', 'staff', tt.hash(:tok_old));
select create_account_invitation('member@inv.tangy.test', 'Meera', 'staff', tt.hash(:tok_staff2));
select tt.check(invitation_preview(:tok_old) ->> 'state' = 'revoked', 'a new invitation replaces the earlier open one');
select tt.login('00000000-0000-0000-0000-00000000c106');
select tt.expect_error($$select accept_account_invitation($$ || quote_literal(:tok_old) || $$)$$, '%withdrawn%', 'a replaced link no longer works');
select tt.logout();
update account_invitations set created_at = now() - interval '4 days', expires_at = now() - interval '1 day' where token_hash = tt.hash(:tok_staff2);
select tt.login('00000000-0000-0000-0000-00000000c106');
select tt.expect_error($$select accept_account_invitation($$ || quote_literal(:tok_staff2) || $$)$$, '%expired%', 'an expired link does not work');
select tt.check(tt.role_of('00000000-0000-0000-0000-00000000c106') = 'user', '… and the role is unchanged');

select tt.login('00000000-0000-0000-0000-00000000c101');
select tt.expect_error($$select revoke_account_invitation($$ || quote_literal((tt.inv('newsuper@inv.tangy.test')).id) || $$)$$,
  '%permission to manage%', 'an Admin / Manager cannot manage super admin invitations');
select tt.login('00000000-0000-0000-0000-00000000c100');
select create_account_invitation('member@inv.tangy.test', 'Meera', 'staff', tt.hash(:tok_rev));
select revoke_account_invitation((tt.inv('member@inv.tangy.test')).id);
select tt.login('00000000-0000-0000-0000-00000000c106');
select tt.expect_error($$select accept_account_invitation($$ || quote_literal(:tok_rev) || $$)$$, '%withdrawn%', 'a revoked link does not work');
select tt.check(tt.role_of('00000000-0000-0000-0000-00000000c106') = 'user', 'the member is still a member');

\echo '--- 4. Volunteer applications'
-- A member applies for a session.
select tt.login('00000000-0000-0000-0000-00000000c106');
insert into crew_applications (name, email, role_interest, category, user_id, event_id, status, reviewed_by)
values ('Meera', 'member@inv.tangy.test', 'Front of House', 'volunteer', auth.uid(), '00000000-0000-0000-0000-00000000c601', 'approved', auth.uid());
select tt.check(tt.app_status('00000000-0000-0000-0000-00000000c106') = 'pending', 'a submitted application always starts pending (a forged "approved" is ignored)');
select tt.expect_error($$insert into crew_applications (name, email, role_interest, category, user_id, event_id)
  values ('Meera', 'member@inv.tangy.test', 'x', 'volunteer', auth.uid(), '00000000-0000-0000-0000-00000000c601')$$,
  '%DUPLICATE_APPLICATION%', 'one pending application per session');
select tt.expect_error($$insert into crew_applications (name, email, role_interest, category, user_id, event_id)
  values ('Meera', 'member@inv.tangy.test', 'x', 'volunteer', auth.uid(), '00000000-0000-0000-0000-00000000c602')$$,
  '%not open for volunteers%', 'draft sessions are not open for volunteers');
select tt.expect_error($$insert into crew_applications (name, email, role_interest, category, user_id, event_id)
  values ('Meera', 'member@inv.tangy.test', 'x', 'crew', auth.uid(), '00000000-0000-0000-0000-00000000c601')$$,
  '%Only volunteer applications%', 'only volunteer applications name a session');

-- Staff apply for a session; they must name one.
select tt.login('00000000-0000-0000-0000-00000000c102');
select tt.expect_error($$insert into crew_applications (name, email, role_interest, category, user_id)
  values ('Sam', 'staff@inv.tangy.test', 'x', 'volunteer', auth.uid())$$,
  '%Choose the session%', 'staff must choose the session they want to volunteer at');
insert into crew_applications (name, email, role_interest, category, user_id, event_id)
values ('Sam', 'staff@inv.tangy.test', 'Setup', 'volunteer', auth.uid(), '00000000-0000-0000-0000-00000000c601');
select tt.check(tt.app_status('00000000-0000-0000-0000-00000000c102') = 'pending', 'a staff member applies for volunteer access');
select tt.expect_error($$select approve_crew_application($$ || quote_literal(tt.app_id('00000000-0000-0000-0000-00000000c102')) || $$)$$,
  '%permission to review%', 'staff cannot approve volunteer applications');

-- Admin / Manager reviews.
select tt.login('00000000-0000-0000-0000-00000000c101');
select approve_crew_application(tt.app_id('00000000-0000-0000-0000-00000000c106'));
select tt.check(tt.role_of('00000000-0000-0000-0000-00000000c106') = 'volunteer', 'approving a member makes them a Volunteer');
select tt.check(tt.vol_place('00000000-0000-0000-0000-00000000c106', '00000000-0000-0000-0000-00000000c601'), '… with a place on the chosen session''s team');
select approve_crew_application(tt.app_id('00000000-0000-0000-0000-00000000c102'));
select tt.check(tt.role_of('00000000-0000-0000-0000-00000000c102') = 'staff', 'approving staff keeps the staff role (staff never auto-become volunteers)');
select tt.check(tt.vol_place('00000000-0000-0000-0000-00000000c102', '00000000-0000-0000-0000-00000000c601'), '… and grants volunteer access for that session only');

\echo '--- 5. Volunteer access is not admin access'
select tt.login('00000000-0000-0000-0000-00000000c102');
select tt.check(not is_assigned_to_event('00000000-0000-0000-0000-00000000c601'), 'a volunteer place does not give staff access to the session');
select tt.expect_error($$select event_health('00000000-0000-0000-0000-00000000c601')$$, '%do not have access%', 'staff-volunteer cannot open the session''s admin health view');
select tt.login('00000000-0000-0000-0000-00000000c106');
select tt.check(cardinality(my_permissions()) = 0, 'the Volunteer role has no console permissions');
select tt.expect_error($$select event_health('00000000-0000-0000-0000-00000000c601')$$, '%do not have access%', 'a volunteer cannot call admin event RPCs');
select tt.check(event_member_kind('00000000-0000-0000-0000-00000000c601') = 'volunteer', 'the volunteer is still a member of the session team');
select tt.logout();
insert into event_assignments (event_id, assignee_role, assignee_id, title, status, assigned_by)
values ('00000000-0000-0000-0000-00000000c601', 'staff', '00000000-0000-0000-0000-00000000c102', 'Door', 'confirmed', '00000000-0000-0000-0000-00000000c100');
select tt.login('00000000-0000-0000-0000-00000000c102');
select tt.check(is_assigned_to_event('00000000-0000-0000-0000-00000000c601'), 'a staff assignment still gives staff access');

\echo ''
\echo 'ALL INVITATION AND VOLUNTEER DATABASE TESTS PASSED'
rollback;
