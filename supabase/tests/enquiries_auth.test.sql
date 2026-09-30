-- Tangy Sessions — authentication-first enquiries + notification privacy (0025).
-- One transaction, rolled back at the end. Run: scripts/test-db.sh

\set ON_ERROR_STOP 1
\set QUIET 1
begin;

delete from bookings; delete from waitlist; delete from collaborations; delete from crew_applications;
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
create function tt.notes(p_uid uuid, p_type text) returns bigint language sql security definer as $$
  select count(*) from notifications where user_id = p_uid and type = p_type;
$$;
grant usage on schema tt to anon, authenticated;
grant execute on all functions in schema tt to anon, authenticated;

insert into auth.users (id, email, aud, role, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000e501', 'admin@enq.tangy.test', 'authenticated', 'authenticated', '{"full_name":"Mira Manager"}'),
  ('00000000-0000-0000-0000-00000000e502', 'asha@enq.tangy.test',  'authenticated', 'authenticated', '{"full_name":"Asha Rao"}'),
  ('00000000-0000-0000-0000-00000000e503', 'bela@enq.tangy.test',  'authenticated', 'authenticated', '{"full_name":"Bela Das"}'),
  ('00000000-0000-0000-0000-00000000e504', 'vik@enq.tangy.test',   'authenticated', 'authenticated', '{"full_name":"Vik Vendor"}');
update profiles set role = 'admin' where id = '00000000-0000-0000-0000-00000000e501';
update profiles set role = 'vendor' where id = '00000000-0000-0000-0000-00000000e504';

\echo '--- 1. Signed-out visitors cannot submit'
select tt.anon();
select tt.expect_error($$insert into contact_enquiries (name, email, subject, message) values ('Anon', 'a@x.test', 'Hi', 'hello')$$, '%row-level security%', 'anonymous contact enquiry refused');
select tt.expect_error($$insert into private_enquiries (type, name, email, message) values ('private_gathering', 'Anon', 'a@x.test', 'party')$$, '%row-level security%', 'anonymous private-session enquiry refused');
select tt.expect_error($$insert into collaborations (type, business_name, contact_name, email) values ('sponsor', 'Anon Co', 'Anon', 'a@x.test')$$, '%row-level security%', 'anonymous sponsor application refused');
select tt.expect_error($$insert into artists (name, email, user_id, status) values ('Anon', 'a@x.test', '00000000-0000-0000-0000-00000000e503', 'pending')$$, '%row-level security%', 'anonymous artist application refused');

\echo '--- 2. Signed-in users submit as themselves only'
select tt.login('00000000-0000-0000-0000-00000000e502');
select tt.expect_error($$insert into artists (name, email, user_id, status) values ('Bela?', 'b@x.test', '00000000-0000-0000-0000-00000000e503', 'pending')$$, '%row-level security%', 'artist application on someone else''s account refused (was allowed before 0025)');
select tt.expect_error($$insert into contact_enquiries (name, email, subject, message, user_id) values ('Asha', 'asha@enq.tangy.test', 'Hi', 'x', '00000000-0000-0000-0000-00000000e503')$$, '%row-level security%', 'contact enquiry as another user refused');
insert into contact_enquiries (name, email, subject, message, user_id) values ('Asha Rao', 'asha@enq.tangy.test', 'Parking', 'Is there parking at the stepwell?', auth.uid());
insert into private_enquiries (type, name, email, message, user_id) values ('private_gathering', 'Asha Rao', 'asha@enq.tangy.test', 'Birthday session for 30', auth.uid());
insert into collaborations (type, business_name, contact_name, email, user_id) values ('sponsor', 'Saffron Tea', 'Asha Rao', 'asha@enq.tangy.test', auth.uid());
insert into crew_applications (name, email, role_interest, category, user_id) values ('Asha Rao', 'asha@enq.tangy.test', 'Sound', 'volunteer', auth.uid());
insert into artists (name, email, user_id, status) values ('Asha Rao', 'asha@enq.tangy.test', auth.uid(), 'pending');
select tt.check((select count(*) from contact_enquiries) = 1 and (select count(*) from private_enquiries) = 1, 'the applicant can read their own enquiries');
select tt.check((select role = 'user' from profiles where id = auth.uid()), 'applying for sponsor / volunteer / artist grants no role');

\echo '--- 3. Duplicates'
select tt.expect_error($$insert into collaborations (type, business_name, contact_name, email, user_id) values ('sponsor', 'Saffron Tea 2', 'Asha', 'asha@enq.tangy.test', auth.uid())$$, '%DUPLICATE_APPLICATION%pending sponsor%', 'second pending sponsor application refused');
insert into collaborations (type, business_name, contact_name, email, user_id) values ('vendor', 'Asha Chai', 'Asha', 'asha@enq.tangy.test', auth.uid());
select tt.check((select count(*) from collaborations where user_id = auth.uid()) = 2, 'a different kind (vendor) is a separate application');
select tt.expect_error($$insert into crew_applications (name, email, role_interest, category, user_id) values ('Asha', 'asha@enq.tangy.test', 'Lights', 'volunteer', auth.uid())$$, '%DUPLICATE_APPLICATION%', 'second pending volunteer application refused');
select tt.expect_error($$insert into artists (name, email, user_id, status) values ('Asha again', 'asha@enq.tangy.test', auth.uid(), 'pending')$$, '%DUPLICATE_APPLICATION%', 'second pending artist application refused');
select tt.expect_error($$insert into contact_enquiries (name, email, subject, message, user_id) values ('Asha', 'asha@enq.tangy.test', 'Parking', '  is there PARKING at the stepwell? ', auth.uid())$$, '%DUPLICATE_APPLICATION%', 'the same contact message twice is a double submit');
insert into contact_enquiries (name, email, subject, message, user_id) values ('Asha', 'asha@enq.tangy.test', 'Food', 'Is food served?', auth.uid());
select tt.check((select count(*) from contact_enquiries) = 2, 'a different message goes through');
select tt.logout();
update collaborations set status = 'rejected' where type = 'sponsor' and user_id = '00000000-0000-0000-0000-00000000e502';
select tt.login('00000000-0000-0000-0000-00000000e502');
insert into collaborations (type, business_name, contact_name, email, user_id) values ('sponsor', 'Saffron Tea', 'Asha Rao', 'asha@enq.tangy.test', auth.uid());
select tt.check((select count(*) from collaborations where user_id = auth.uid() and type = 'sponsor') = 2, 'after a decision the person may apply again');

\echo '--- 4. Isolation'
select tt.login('00000000-0000-0000-0000-00000000e503');
select tt.check((select count(*) from contact_enquiries) = 0 and (select count(*) from private_enquiries) = 0 and (select count(*) from collaborations) = 0,
  'another user cannot read Asha''s enquiries or applications');
select tt.login('00000000-0000-0000-0000-00000000e504');
select tt.check((select count(*) from contact_enquiries) = 0, 'a partner account cannot read enquiries');

\echo '--- 5. Receipts and alerts'
select tt.logout();
select tt.check(tt.notes('00000000-0000-0000-0000-00000000e502', 'application.received') = 8, 'the applicant got a receipt for each accepted submission (8)');
select tt.check((select bool_and(body like '%doesn''t change your account%') from notifications where type = 'application.received'), 'receipts say applying doesn''t change the account');
select tt.check(tt.notes('00000000-0000-0000-0000-00000000e501', 'enquiry.new') = 3, 'admins alerted to the private + 2 contact enquiries');
select tt.check((select link from notifications where type = 'enquiry.new' and title like '%private session%' limit 1) = '/admin-portal/ops/enquiries'
  and (select bool_and(link = '/admin-portal/ops/contact') from notifications where type = 'enquiry.new' and title like '%message%'), 'alerts link to the right admin inbox');
select tt.check((select count(*) from email_outbox where notification_type = 'application.received' and user_id = '00000000-0000-0000-0000-00000000e502') >= 1,
  'receipt email queued (sent once email is configured)');

\echo '--- 6. Message privacy in email'
select notify('00000000-0000-0000-0000-00000000e503', 'message.new', 'New message from Tangy', 'Your contract is attached — call me on 98xxxx', '/dashboard?tab=messages');
select tt.check((select body from notifications where user_id = '00000000-0000-0000-0000-00000000e503' and type = 'message.new') like '%contract is attached%',
  'in-app notification (recipient only) keeps the preview');
select tt.check((select body not like '%contract%' and body like '%Open it to read%' from email_outbox where user_id = '00000000-0000-0000-0000-00000000e503' and notification_type = 'message.new'),
  'the email carries no message text');
select tt.login('00000000-0000-0000-0000-00000000e502');
select tt.expect_error($$select notify(auth.uid(), 'application.received', 'spoof')$$, '%permission denied%', 'users still cannot create notifications themselves');

\echo ''
\echo 'ALL ENQUIRY AUTH DATABASE TESTS PASSED'
rollback;
