-- Tangy Sessions — Operations Platform database tests (0018).
--
-- Partner portals, requirements, documents, announcements, notifications,
-- partner↔admin messaging and temporary volunteer check-in access — each
-- attempted as the real role through RLS/RPCs, including the attacks that
-- must fail. One transaction, rolled back at the end. Run: scripts/test-db.sh

\set ON_ERROR_STOP 1
\set QUIET 1
begin;

-- Hermetic start (rolled back at the end; see admin_system.test.sql).
delete from bookings; delete from waitlist; delete from collaborations; delete from crew_applications;
delete from announcements where audience <> 'all' and audience <> 'guest' and audience <> 'patron';
delete from conversations;
delete from events; delete from artists; delete from auth.users;
alter table audit_logs disable trigger audit_logs_append_only;
delete from audit_logs;
alter table audit_logs enable trigger audit_logs_append_only;

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
create function tt.audits(p_action text) returns setof audit_logs language sql security definer as $$
  select * from audit_logs where action = p_action and created_at >= now();
$$;
create function tt.notes(p_uid uuid, p_type text) returns bigint language sql security definer as $$
  select count(*) from notifications where user_id = p_uid and type = p_type;
$$;
create function tt.attendance(p_ticket text) returns bigint language sql security definer as $$
  select count(*) from checkins where ticket_id = (select id from tickets where ticket_number = p_ticket);
$$;
create function tt.tok(p_ticket text) returns text language sql security definer as $$
  select token from tickets where ticket_number = p_ticket;
$$;
grant usage on schema tt to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Fixtures
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, aud, role, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000b0001', 'root@ops.tangy.test',    'authenticated', 'authenticated', '{"full_name":"Root Super"}'),
  ('00000000-0000-0000-0000-0000000b0002', 'manager@ops.tangy.test', 'authenticated', 'authenticated', '{"full_name":"Mira Manager"}'),
  ('00000000-0000-0000-0000-0000000b0003', 'staff@ops.tangy.test',   'authenticated', 'authenticated', '{"full_name":"Sam Staff"}'),
  ('00000000-0000-0000-0000-0000000b0004', 'artist1@ops.tangy.test', 'authenticated', 'authenticated', '{"full_name":"Asha Artist"}'),
  ('00000000-0000-0000-0000-0000000b0005', 'artist2@ops.tangy.test', 'authenticated', 'authenticated', '{"full_name":"Bela Artist"}'),
  ('00000000-0000-0000-0000-0000000b0006', 'sponsor1@ops.tangy.test','authenticated', 'authenticated', '{"full_name":"Sona Sponsor"}'),
  ('00000000-0000-0000-0000-0000000b0007', 'sponsor2@ops.tangy.test','authenticated', 'authenticated', '{"full_name":"Tej Sponsor"}'),
  ('00000000-0000-0000-0000-0000000b0008', 'vendor1@ops.tangy.test', 'authenticated', 'authenticated', '{"full_name":"Vik Vendor"}'),
  ('00000000-0000-0000-0000-0000000b0009', 'venue1@ops.tangy.test',  'authenticated', 'authenticated', '{"full_name":"Hema Host"}'),
  ('00000000-0000-0000-0000-0000000b0010', 'vol1@ops.tangy.test',    'authenticated', 'authenticated', '{"full_name":"Rohan Das"}'),
  ('00000000-0000-0000-0000-0000000b0011', 'vol2@ops.tangy.test',    'authenticated', 'authenticated', '{"full_name":"Ananya V"}'),
  ('00000000-0000-0000-0000-0000000b0012', 'patron@ops.tangy.test',  'authenticated', 'authenticated', '{"full_name":"Pat Patron"}');

update profiles set role = 'super_admin' where id = '00000000-0000-0000-0000-0000000b0001';
update profiles set role = 'admin'       where id = '00000000-0000-0000-0000-0000000b0002';
update profiles set role = 'staff'       where id = '00000000-0000-0000-0000-0000000b0003';
update profiles set role = 'artist'      where id in ('00000000-0000-0000-0000-0000000b0004', '00000000-0000-0000-0000-0000000b0005');
update profiles set role = 'sponsor'     where id in ('00000000-0000-0000-0000-0000000b0006', '00000000-0000-0000-0000-0000000b0007');
update profiles set role = 'vendor'      where id = '00000000-0000-0000-0000-0000000b0008';
update profiles set role = 'venue'       where id = '00000000-0000-0000-0000-0000000b0009';
update profiles set role = 'volunteer'   where id in ('00000000-0000-0000-0000-0000000b0010', '00000000-0000-0000-0000-0000000b0011');

insert into artists (id, user_id, name, email, status) values
  ('00000000-0000-0000-0000-0000000aa001', '00000000-0000-0000-0000-0000000b0004', 'Asha Artist', 'artist1@ops.tangy.test', 'approved'),
  ('00000000-0000-0000-0000-0000000aa002', '00000000-0000-0000-0000-0000000b0005', 'Bela Artist', 'artist2@ops.tangy.test', 'approved');

insert into events (id, slug, name, event_date, venue, capacity, price, status, venue_partner_id) values
  ('00000000-0000-0000-0000-00000000f001', 'ops-a', 'Arjuna Session', current_date, 'Stepwell', 50, 500, 'on-sale', '00000000-0000-0000-0000-0000000b0009'),
  ('00000000-0000-0000-0000-00000000f002', 'ops-b', 'Tangy Live', current_date + 10, 'Baradari', 50, 700, 'on-sale', null),
  ('00000000-0000-0000-0000-00000000f003', 'ops-c', 'Called Off', current_date + 3, 'Baradari', 50, 700, 'cancelled', null);

insert into event_artists (event_id, artist_id) values
  ('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-0000000aa001'),
  ('00000000-0000-0000-0000-00000000f002', '00000000-0000-0000-0000-0000000aa002');
insert into event_artist_details (event_id, artist_id, call_time, performance_start, performance_end, hospitality, fee_amount, fee_status) values
  ('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-0000000aa001', now() + interval '3 hours', now() + interval '5 hours', now() + interval '6 hours', 'Green room B', 25000, 'invoiced'),
  ('00000000-0000-0000-0000-00000000f002', '00000000-0000-0000-0000-0000000aa002', null, null, null, 'Secret rider', 90000, 'pending');

insert into event_assignments (event_id, assignee_role, assignee_id, title, assigned_by, instructions) values
  ('00000000-0000-0000-0000-00000000f001', 'vendor', '00000000-0000-0000-0000-0000000b0008', 'Chai counter', '00000000-0000-0000-0000-0000000b0002', 'Loading bay opens 2 PM'),
  ('00000000-0000-0000-0000-00000000f001', 'sponsor', '00000000-0000-0000-0000-0000000b0006', 'Title sponsor', '00000000-0000-0000-0000-0000000b0002', null),
  ('00000000-0000-0000-0000-00000000f002', 'sponsor', '00000000-0000-0000-0000-0000000b0007', 'Stage sponsor', '00000000-0000-0000-0000-0000000b0002', null),
  ('00000000-0000-0000-0000-00000000f001', 'volunteer', '00000000-0000-0000-0000-0000000b0010', 'Gate volunteer', '00000000-0000-0000-0000-0000000b0002', null),
  ('00000000-0000-0000-0000-00000000f001', 'staff', '00000000-0000-0000-0000-0000000b0003', 'Front gate', '00000000-0000-0000-0000-0000000b0002', null);

do $$
declare b bookings;
begin
  b := create_pending_booking(null, '00000000-0000-0000-0000-00000000f001', 'TS-OPA001', 'Guest One', 'g1@example.test', null, 3, 1500, 'gen', 'order_opa1');
  perform confirm_booking_and_issue_tickets(b.id);
  b := create_pending_booking(null, '00000000-0000-0000-0000-00000000f002', 'TS-OPB001', 'Guest Two', 'g2@example.test', null, 1, 700, 'gen', 'order_opb1');
  perform confirm_booking_and_issue_tickets(b.id);
end $$;

\echo '--- 1. Permissions'
select tt.login('00000000-0000-0000-0000-0000000b0002');
select tt.check(my_permissions() @> array['messages.manage', 'volunteers.manage', 'access.grant'], 'admin has messaging/volunteer/access permissions');
select tt.login('00000000-0000-0000-0000-0000000b0003');
select tt.check(not (my_permissions() && array['messages.manage', 'volunteers.manage', 'access.grant']), 'staff has none of them');
select tt.login('00000000-0000-0000-0000-0000000b0010');
select tt.check(my_permissions() = '{}', 'a volunteer has no console permissions');

\echo '--- 2. Event membership is event-scoped'
select tt.logout();
select tt.check(event_member_kind('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-0000000b0004') = 'artist'
            and event_member_kind('00000000-0000-0000-0000-00000000f002', '00000000-0000-0000-0000-0000000b0004') is null, 'artist A is on event A, not event B');
select tt.check(event_member_kind('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-0000000b0008') = 'vendor'
            and event_member_kind('00000000-0000-0000-0000-00000000f002', '00000000-0000-0000-0000-0000000b0008') is null, 'vendor A is on event A, not event B');
select tt.check(event_member_kind('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-0000000b0009') = 'venue', 'venue host is a member via venue_partner_id');
select tt.check(event_member_kind('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-0000000b0003') = 'staff', 'staff kind wins for staff assignments');

select tt.login('00000000-0000-0000-0000-0000000b0004');
select tt.check((select array_agg(name) from my_portal_events()) = array['Arjuna Session']
            and (select member_kind from my_portal_events()) = 'artist'
            and (select hospitality from my_portal_events()) = 'Green room B', 'artist portal lists only their event, with private logistics');
select tt.check((select count(*) from event_artist_details) = 1, 'artist reads only their own logistics row');
select tt.check(not exists (select 1 from event_artist_details where hospitality = 'Secret rider'), 'artist cannot read another artist''s rider/fee');
select tt.check((select count(*) from event_artists) = 2, 'public lineup (event_artists) stays readable');

select tt.login('00000000-0000-0000-0000-0000000b0008');
select tt.check((select array_agg(member_kind || ':' || name) from my_portal_events()) = array['vendor:Arjuna Session']
            and (select instructions from my_portal_events()) = 'Loading bay opens 2 PM', 'vendor portal: assigned event + instructions');
select tt.check((select count(*) from event_assignments) = 1, 'vendor sees only their own assignment (not sponsor data)');
select tt.expect_error($$update event_assignments set fee_status = 'paid' where assignee_id = auth.uid()$$, '%Only staff/admin can change assignment details%', 'vendor cannot edit their own fee/instructions');

select tt.login('00000000-0000-0000-0000-0000000b0006');
select tt.check((select array_agg(name) from my_portal_events()) = array['Arjuna Session'], 'sponsor 1 sees only their event');
select tt.check(not exists (select 1 from event_assignments where assignee_id = '00000000-0000-0000-0000-0000000b0007'), 'sponsor cannot see another sponsor''s assignment');
select tt.check(not exists (select 1 from event_assignments where assignee_role = 'vendor'), 'sponsor cannot see vendor data');

select tt.login('00000000-0000-0000-0000-0000000b0009');
select tt.check((select array_agg(member_kind || ':' || name) from my_portal_events()) = array['venue:Arjuna Session'], 'venue host sees only the event they host');

\echo '--- 3. Requirements'
select tt.login('00000000-0000-0000-0000-0000000b0002');
insert into event_requirements (event_id, user_id, title, details)
  values ('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-0000000b0004', 'Tech rider', 'Send your input list');
select tt.expect_error($$insert into event_requirements (event_id, user_id, title) values ('00000000-0000-0000-0000-00000000f002', '00000000-0000-0000-0000-0000000b0004', 'x')$$, '%not part of this event%', 'requirements only for event members');
select tt.check(tt.notes('00000000-0000-0000-0000-0000000b0004', 'requirement.requested') = 1, 'artist notified of the requirement');

select tt.login('00000000-0000-0000-0000-0000000b0005');
select tt.check((select count(*) from event_requirements) = 0, 'another artist cannot see it');
select tt.expect_error($$select submit_requirement((select id from event_requirements limit 1), 'hi')$$, '%not found%', 'another artist cannot answer it (not even by id)');

select tt.login('00000000-0000-0000-0000-0000000b0004');
update event_requirements set status = 'accepted';
select tt.check((select status from event_requirements) = 'requested', 'artist cannot self-accept by direct update (RLS)');
select submit_requirement((select id from event_requirements limit 1), '16 channels, 2 vocal mics');
select tt.check((select status from event_requirements) = 'submitted', 'artist submits their response');
select tt.check(tt.notes('00000000-0000-0000-0000-0000000b0002', 'requirement.submitted') = 1, 'event managers notified of the response');
select tt.login('00000000-0000-0000-0000-0000000b0002');
select review_requirement((select id from event_requirements limit 1), true, null);
select tt.check((select status from event_requirements) = 'accepted' and tt.notes('00000000-0000-0000-0000-0000000b0004', 'requirement.reviewed') = 1, 'admin accepts; artist notified');

\echo '--- 4. Documents'
insert into event_documents (event_id, title, url, audience) values ('00000000-0000-0000-0000-00000000f001', 'Stage plot', 'https://docs.example.test/plot', 'artist');
insert into event_documents (event_id, title, url, audience, user_id) values ('00000000-0000-0000-0000-00000000f001', 'Vendor pass', 'https://docs.example.test/pass', 'user', '00000000-0000-0000-0000-0000000b0008');
select tt.expect_error($$insert into event_documents (event_id, title, url) values ('00000000-0000-0000-0000-00000000f001', 'x', 'http://insecure.test')$$, '%check constraint%', 'only https document links');
select tt.login('00000000-0000-0000-0000-0000000b0004');
select tt.check((select array_agg(title) from event_documents) = array['Stage plot'], 'artist sees the artist document only');
select tt.login('00000000-0000-0000-0000-0000000b0008');
select tt.check((select array_agg(title) from event_documents) = array['Vendor pass'], 'vendor sees only their personal document');
select tt.login('00000000-0000-0000-0000-0000000b0005');
select tt.check((select count(*) from event_documents) = 0, 'artist on another event sees none');

\echo '--- 5. Announcements'
select tt.login('00000000-0000-0000-0000-0000000b0002');
insert into announcements (title, body, audience, event_id, status) values
  ('Loading bay moved', 'Use gate 3', 'vendor', '00000000-0000-0000-0000-00000000f001', 'published'),
  ('Volunteer meetup', 'Sunday 5pm', 'volunteer', null, 'published'),
  ('Soundcheck 4:30', 'For artists on Arjuna', 'artist', '00000000-0000-0000-0000-00000000f001', 'published');
select tt.anon();
select tt.check(not exists (select 1 from announcements where title in ('Loading bay moved', 'Volunteer meetup', 'Soundcheck 4:30')), 'partner/volunteer/event-artist notices are not public');
select tt.login('00000000-0000-0000-0000-0000000b0012');
select tt.check(not exists (select 1 from announcements where title in ('Loading bay moved', 'Volunteer meetup', 'Soundcheck 4:30')), 'a patron cannot read them either');
select tt.login('00000000-0000-0000-0000-0000000b0008');
select tt.check((select array_agg(title) from portal_announcements()) = array['Loading bay moved'], 'vendor sees the vendor notice for their event only');
select tt.check(tt.notes('00000000-0000-0000-0000-0000000b0008', 'announcement.published') = 1, 'vendor notified');
select tt.login('00000000-0000-0000-0000-0000000b0006');
select tt.check(not exists (select 1 from announcements where title = 'Loading bay moved'), 'sponsor cannot read the vendor notice');
select tt.login('00000000-0000-0000-0000-0000000b0011');
select tt.check((select array_agg(title) from portal_announcements()) = array['Volunteer meetup'], 'volunteer group notice reaches every volunteer');
select tt.check(tt.notes('00000000-0000-0000-0000-0000000b0011', 'announcement.published') = 1, 'volunteers get the group notification');
select tt.login('00000000-0000-0000-0000-0000000b0005');
select tt.check(not exists (select 1 from portal_announcements() where title = 'Soundcheck 4:30'), 'event-artist notice does not reach an artist on another event');
select tt.login('00000000-0000-0000-0000-0000000b0004');
select tt.check(exists (select 1 from portal_announcements() where title = 'Soundcheck 4:30'), 'artist on the event sees it');

\echo '--- 6. Messaging: partner ↔ Tangy only'
select tt.login('00000000-0000-0000-0000-0000000b0004');
select start_partner_conversation('Soundcheck', 'Can we move soundcheck to 4:30?', '00000000-0000-0000-0000-00000000f001');
select tt.check((select count(*) from my_conversations()) = 1 and (select conversation_type from my_conversations()) = 'artist_support', 'artist opens an artist_support thread');
select start_partner_conversation('Soundcheck', 'Also need a DI box', '00000000-0000-0000-0000-00000000f001');
select tt.check((select count(*) from my_conversations()) = 1, 'second message reuses the open thread for that event');
select tt.expect_error($$select start_partner_conversation('x', 'hello', '00000000-0000-0000-0000-00000000f002')$$, '%not part of this event%', 'artist cannot open a thread about an event they are not on');
select tt.expect_error($$insert into conversation_participants (conversation_id, user_id) values ((select id from conversations limit 1), '00000000-0000-0000-0000-0000000b0005')$$, '%row-level security%', 'artist cannot add another artist to their thread');
select tt.expect_error($$insert into conversations (subject, created_by, conversation_type, external_user_id) values ('dm', auth.uid(), 'artist_support', '00000000-0000-0000-0000-0000000b0005')$$, '%row-level security%', 'artist cannot hand-craft a partner thread');
select tt.check(tt.notes('00000000-0000-0000-0000-0000000b0002', 'message.new') >= 1 and tt.notes('00000000-0000-0000-0000-0000000b0001', 'message.new') >= 1, 'unclaimed partner message notifies messages.manage holders');
select tt.check(exists (select 1 from tt.audits('message.sent') where not (metadata ? 'content')), 'message.sent audited without content');

select tt.login('00000000-0000-0000-0000-0000000b0005');
select tt.check((select count(*) from my_conversations()) = 0 and (select count(*) from messages) = 0 and (select count(*) from conversations) = 0, 'another artist sees no conversations/messages');
select tt.expect_error($$select send_message((select id from conversations where external_user_id = '00000000-0000-0000-0000-0000000b0004'), 'hi')$$, '%not found%', 'another artist cannot post into it');

select tt.login('00000000-0000-0000-0000-0000000b0010');
select tt.expect_error($$select start_partner_conversation('x', 'hello', null)$$, '%available to artists, sponsors, vendors and venue hosts%', 'volunteers cannot use partner messaging');
select tt.login('00000000-0000-0000-0000-0000000b0012');
select tt.expect_error($$select start_partner_conversation('x', 'hello', null)$$, '%available to artists%', 'customers cannot use partner messaging');
select tt.login('00000000-0000-0000-0000-0000000b0003');
select tt.expect_error($$select * from admin_conversations()$$, '%permission%', 'staff cannot open the partner inbox');

select tt.login('00000000-0000-0000-0000-0000000b0002');
select tt.check((select unread from admin_conversations()) = 2 and (select partner_name from admin_conversations()) = 'Asha Artist', 'admin inbox shows the thread with 2 unread');
select send_message((select id from admin_conversations()), 'Yes — soundcheck moved to 4:30 PM.');
select tt.check((select status from conversations limit 1) = 'pending' and is_participant((select id from conversations limit 1)), 'admin reply joins the thread and marks it awaiting partner');
select tt.check(tt.notes('00000000-0000-0000-0000-0000000b0004', 'message.new') = 1, 'artist notified of the reply');
select tt.expect_error($$select admin_start_partner_conversation('00000000-0000-0000-0000-0000000b0010', 'x', 'hi', null)$$, '%only message artists, sponsors, vendors and venue hosts%', 'admin cannot open private messaging with a volunteer');
select tt.expect_error($$select admin_start_partner_conversation('00000000-0000-0000-0000-0000000b0012', 'x', 'hi', null)$$, '%only message artists%', 'admin cannot open private messaging with a customer');
select admin_start_partner_conversation('00000000-0000-0000-0000-0000000b0006', 'Branding', 'Logo placement confirmed.', '00000000-0000-0000-0000-00000000f001');
select tt.check((select count(*) from admin_conversations(p_type => 'sponsor_support')) = 1, 'admin starts a sponsor thread');

select tt.login('00000000-0000-0000-0000-0000000b0004');
select mark_conversation_read((select id from my_conversations()));
select tt.check((select unread from my_conversations()) = 0, 'artist reads the reply');
select tt.login('00000000-0000-0000-0000-0000000b0002');
select tt.check((select read_by_other from conversation_messages((select id from conversations where conversation_type = 'artist_support')) where from_tangy) is true, 'admin sees the reply was read');
select tt.login('00000000-0000-0000-0000-0000000b0007');
select tt.check((select count(*) from conversations) = 0, 'sponsor 2 cannot see sponsor 1''s thread');

\echo '--- 7. Notifications are private'
select tt.login('00000000-0000-0000-0000-0000000b0005');
select tt.check(not exists (select 1 from notifications where user_id <> auth.uid()), 'users only read their own notifications');
select tt.expect_error($$insert into notifications (user_id, type, title) values (auth.uid(), 'x.y', 'spoof')$$, '%row-level security%', 'users cannot create notifications');
select tt.expect_error($$select notify('00000000-0000-0000-0000-0000000b0004', 'x.y', 'spoof')$$, '%permission denied%', 'notify() is not callable from the API');
select tt.login('00000000-0000-0000-0000-0000000b0004');
select tt.check(notification_unread_count() > 0, 'artist has unread notifications');
select mark_notifications_read(null);
select tt.check(notification_unread_count() = 0, 'mark all read');

\echo '--- 8. Temporary volunteer check-in access'
select tt.login('00000000-0000-0000-0000-0000000b0010');
select tt.expect_error($$select check_in_ticket(tt.tok('TS-OPA001-01'), '00000000-0000-0000-0000-00000000f001')$$, '%permission to check in%', 'volunteer without a grant cannot check in');
select tt.check((select count(*) from attendee_tickets) = 0, 'volunteer without a grant sees no attendees');
select tt.expect_error($$select grant_temporary_access(auth.uid(), '00000000-0000-0000-0000-00000000f001', 120)$$, '%permission to grant%', 'volunteer cannot grant themselves access');
select tt.expect_error($$select grant_temporary_access('00000000-0000-0000-0000-0000000b0011', '00000000-0000-0000-0000-00000000f001', 120)$$, '%permission to grant%', 'volunteer cannot grant access to another volunteer');
select tt.expect_error($$insert into temporary_access (user_id, event_id, granted_by, expires_at) values (auth.uid(), '00000000-0000-0000-0000-00000000f001', auth.uid(), now() + interval '1 hour')$$, '%row-level security%', 'volunteer cannot insert a grant directly');
select tt.login('00000000-0000-0000-0000-0000000b0003');
select tt.expect_error($$select grant_temporary_access('00000000-0000-0000-0000-0000000b0010', '00000000-0000-0000-0000-00000000f001', 120)$$, '%permission to grant%', 'staff cannot grant access');

select tt.login('00000000-0000-0000-0000-0000000b0002');
select tt.expect_error($$select grant_temporary_access('00000000-0000-0000-0000-0000000b0012', '00000000-0000-0000-0000-00000000f001', 120)$$, '%only be granted to active volunteer%', 'access only for volunteer accounts');
select tt.expect_error($$select grant_temporary_access('00000000-0000-0000-0000-0000000b0010', '00000000-0000-0000-0000-00000000f001', 5)$$, '%between 30 minutes and 12 hours%', 'duration must be an allowed window');
select tt.expect_error($$select grant_temporary_access('00000000-0000-0000-0000-0000000b0010', '00000000-0000-0000-0000-00000000f003', 120)$$, '%published, current or upcoming%', 'no access for a cancelled event');
select grant_temporary_access('00000000-0000-0000-0000-0000000b0010', '00000000-0000-0000-0000-00000000f001', 120);
select tt.check((select expires_at from temporary_access) = now() + interval '120 minutes', 'server sets expiry = now + duration');
select tt.check(exists (select 1 from tt.audits('access.granted') where metadata ->> 'user_id' = '00000000-0000-0000-0000-0000000b0010'), 'grant audited (by, to, event, window)');
select tt.check(tt.notes('00000000-0000-0000-0000-0000000b0010', 'access.granted') = 1, 'volunteer notified of the grant');
select tt.expect_error($$select grant_temporary_access('00000000-0000-0000-0000-0000000b0010', '00000000-0000-0000-0000-00000000f001', 60)$$, '%already has active check-in access%', 'one active grant per volunteer per event');

select tt.login('00000000-0000-0000-0000-0000000b0010');
select tt.check('checkin.perform' = any (my_permissions()), 'active grant surfaces checkin.perform for the terminal');
select tt.check((select array_agg(name) from my_checkin_events()) = array['Arjuna Session'], 'volunteer terminal lists only the granted event');
select tt.check((check_in_ticket(tt.tok('TS-OPA001-01'), '00000000-0000-0000-0000-00000000f001')) ->> 'result' = 'valid', 'volunteer checks in a valid ticket');
select tt.check((check_in_ticket(tt.tok('TS-OPA001-01'), '00000000-0000-0000-0000-00000000f001')) ->> 'result' = 'already_checked_in', 'duplicate scan is rejected (idempotent)');
select tt.check(tt.attendance('TS-OPA001-01') = 1, 'one ticket = one attendance record');
select tt.check((check_in_ticket(tt.tok('TS-OPB001-01'), '00000000-0000-0000-0000-00000000f001')) ->> 'result' = 'wrong_event', 'other event''s ticket rejected');
select tt.expect_error($$select check_in_ticket(tt.tok('TS-OPB001-01'), '00000000-0000-0000-0000-00000000f002')$$, '%permission to check in%', 'grant does not extend to another event');
select tt.check((select count(*) from attendee_tickets) = 3 and (select bool_and(attendee_email is null) from attendee_tickets), 'volunteer sees granted-event attendees, no contact details');
select tt.check((select count(*) from get_checkin_history('00000000-0000-0000-0000-00000000f001')) = 1, 'volunteer sees their own scans');
update temporary_access set expires_at = now() + interval '5 days';
select tt.check((select expires_at from temporary_access) = now() + interval '120 minutes', 'volunteer cannot extend their own expiry (no update path)');
select tt.expect_error($$select revoke_temporary_access((select id from temporary_access limit 1))$$, '%permission to revoke%', 'volunteer cannot revoke/alter grants');
select tt.expect_error($$select * from volunteers_overview()$$, '%permission to manage volunteers%', 'volunteer cannot open the volunteer admin');

-- Even a direct SQL edit can't move the window.
select tt.logout();
select tt.expect_error($$update temporary_access set expires_at = expires_at + interval '1 hour'$$, '%cannot be changed%', 'grant windows are immutable even for SQL edits');

\echo '--- 9. Automatic expiry'
alter table temporary_access disable trigger temporary_access_guard;
update temporary_access set granted_at = now() - interval '3 hours', expires_at = now() - interval '1 minute';
alter table temporary_access enable trigger temporary_access_guard;
select tt.login('00000000-0000-0000-0000-0000000b0010');
select tt.check(not ('checkin.perform' = any (my_permissions())), 'after expiry: no checkin.perform');
select tt.check((check_in_ticket(tt.tok('TS-OPA001-02'), '00000000-0000-0000-0000-00000000f001')) ->> 'result' = 'access_expired', 'after expiry: check-in DENIED with no cleanup');
select tt.check(tt.attendance('TS-OPA001-02') = 0, 'expired grant wrote no attendance');
select tt.check((select count(*) from attendee_tickets) = 0 and (select count(*) from my_checkin_events()) = 0, 'after expiry: attendee list and terminal events are gone');
select tt.check(exists (select 1 from tt.audits('access.expired') where actor_role = 'system'), 'expiry recorded in the audit log');
select tt.check((select state from my_checkin_access() where grant_id is not null limit 1) = 'expired', 'volunteer sees EXPIRED');

\echo '--- 10. Request → grant → revoke'
select request_checkin_access('00000000-0000-0000-0000-00000000f001', 'Need access for the second gate');
select tt.expect_error($$select request_checkin_access('00000000-0000-0000-0000-00000000f001', null)$$, '%already with the event team%', 'no duplicate pending requests');
select tt.check(tt.notes('00000000-0000-0000-0000-0000000b0002', 'access.requested') = 1, 'volunteer managers notified of the request');
select tt.login('00000000-0000-0000-0000-0000000b0011');
select tt.expect_error($$select request_checkin_access('00000000-0000-0000-0000-00000000f001', null)$$, '%event you are volunteering at%', 'cannot request for an event you are not volunteering at');

select tt.login('00000000-0000-0000-0000-0000000b0002');
select tt.check((select jsonb_array_length(pending_requests) from volunteers_overview(p_access => 'pending')) = 1, 'admin Volunteers section shows the pending request');
select grant_temporary_access('00000000-0000-0000-0000-0000000b0010', '00000000-0000-0000-0000-00000000f001', 180,
  (select id from access_requests where status = 'pending'));
select tt.check((select status from access_requests) = 'granted' and (select grant_id from access_requests) is not null, 'request marked granted and linked to the grant');
select tt.check((select (active_grant ->> 'event_name') from volunteers_overview(p_access => 'active')) = 'Arjuna Session', 'volunteer listed with active access');
select revoke_temporary_access((select id from temporary_access where revoked_at is null and expires_at > now()), 'Gate closed');
select tt.check(exists (select 1 from tt.audits('access.revoked') where metadata ->> 'reason' = 'Gate closed'), 'revoke audited with reason');
select tt.expect_error($$select revoke_temporary_access((select id from temporary_access where revoked_at is not null limit 1))$$, '%already been revoked%', 'cannot revoke twice');
select tt.login('00000000-0000-0000-0000-0000000b0010');
select tt.check((check_in_ticket(tt.tok('TS-OPA001-02'), '00000000-0000-0000-0000-00000000f001')) ->> 'result' = 'access_expired', 'after revoke: check-in denied');

select tt.login('00000000-0000-0000-0000-0000000b0002');
insert into event_assignments (event_id, assignee_role, assignee_id, title) values ('00000000-0000-0000-0000-00000000f002', 'volunteer', '00000000-0000-0000-0000-0000000b0011', 'Ushering');
select tt.login('00000000-0000-0000-0000-0000000b0011');
select request_checkin_access('00000000-0000-0000-0000-00000000f002', null);
select tt.login('00000000-0000-0000-0000-0000000b0002');
select decline_access_request((select id from access_requests where status = 'pending'), 'Enough staff that night');
select tt.check((select status from access_requests where user_id = '00000000-0000-0000-0000-0000000b0011') = 'declined'
            and tt.notes('00000000-0000-0000-0000-0000000b0011', 'access.declined') = 1, 'decline recorded and volunteer notified');
select tt.check((select count(*) from volunteer_access_activity('00000000-0000-0000-0000-0000000b0010')) >= 4, 'volunteer activity: grants, request, check-in');

\echo '--- 11. Staff check-in path unchanged'
select tt.login('00000000-0000-0000-0000-0000000b0003');
select tt.check((check_in_ticket(tt.tok('TS-OPA001-03'), '00000000-0000-0000-0000-00000000f001')) ->> 'result' = 'valid', 'assigned staff still checks in');
select tt.check((check_in_ticket(tt.tok('TS-OPB001-01'), '00000000-0000-0000-0000-00000000f002')) ->> 'result' = 'not_assigned', 'staff still blocked on another event');

\echo '--- 12. Admin vs Super Admin'
select tt.login('00000000-0000-0000-0000-0000000b0002');
select tt.expect_error($$select set_role_permission('staff', 'reports.view', true)$$, '%Only a super admin%', 'admin cannot change role permissions');
select tt.check((event_command_center('00000000-0000-0000-0000-00000000f001') ->> 'artists')::int = 1
            and (event_command_center('00000000-0000-0000-0000-00000000f001') ->> 'vendors')::int = 1
            and (event_command_center('00000000-0000-0000-0000-00000000f001') ->> 'checked_in')::int = 2, 'command center counts are real');
select tt.check((report_platform_activity() -> 'communication' ->> 'messages')::int = 4, 'communication analytics count real messages');
select tt.login('00000000-0000-0000-0000-0000000b0003');
select tt.expect_error($$select event_command_center('00000000-0000-0000-0000-00000000f001')$$, '%command center%', 'staff cannot open the command center');
select tt.expect_error($$select report_platform_activity()$$, '%access to reports%', 'staff cannot read platform analytics');

select tt.login('00000000-0000-0000-0000-0000000b0001');
select set_role_permission('staff', 'reports.view', true);
select tt.check(exists (select 1 from tt.audits('permission.granted')), 'permission grant audited');
select tt.expect_error($$select set_role_permission('admin', 'roles.manage', true)$$, '%stays with Super Admins%', 'roles.manage is never delegable');
select tt.expect_error($$select set_role_permission('super_admin', 'audit.view', false)$$, '%Only the Admin / Manager and Staff%', 'the super admin row is fixed');
select tt.login('00000000-0000-0000-0000-0000000b0003');
select tt.check('reports.view' = any (my_permissions()), 'granted permission takes effect for staff');
select tt.login('00000000-0000-0000-0000-0000000b0005');
select tt.expect_error($$select set_role_permission('artist', 'dashboard.view', true)$$, '%Only a super admin%', 'artist cannot escalate permissions');
select tt.expect_error($$update profiles set role = 'admin' where id = auth.uid()$$, '%cannot change your own role%', 'artist cannot escalate their role');

\echo '--- 13. Artist application → artist account'
select tt.login('00000000-0000-0000-0000-0000000b0012');
insert into artists (name, email, user_id, status) values ('Pat Sings', 'patron@ops.tangy.test', auth.uid(), 'pending');
select tt.check(tt.notes('00000000-0000-0000-0000-0000000b0002', 'application.new') = 1, 'new application notifies reviewers');
select tt.login('00000000-0000-0000-0000-0000000b0002');
select approve_artist_application((select id from artists where name = 'Pat Sings'));
select tt.check((select role from profiles where id = '00000000-0000-0000-0000-0000000b0012') = 'artist'
            and tt.notes('00000000-0000-0000-0000-0000000b0012', 'application.approved') = 1, 'approval activates the artist role (no admin perms) and notifies');
select tt.login('00000000-0000-0000-0000-0000000b0012');
select tt.check(my_permissions() = '{}', 'a new artist has no console permissions');

\echo ''
\echo 'ALL OPERATIONS PLATFORM DATABASE TESTS PASSED'
rollback;
