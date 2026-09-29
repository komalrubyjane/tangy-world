-- Tangy Sessions — Platform finalization database tests (0019/0020).
--
-- Artist privacy, profile completion, media curation, booking requests,
-- requirements, private documents & storage, sponsor assets, invoices,
-- volunteer teams, tasks, notification preferences + email outbox, booking
-- expiry and late payments, event health, operations overview and search —
-- each attempted as the real role, including the attacks that must fail.
-- One transaction, rolled back at the end. Run: scripts/test-db.sh

\set ON_ERROR_STOP 1
\set QUIET 1
begin;

-- Hermetic start (rolled back at the end; see admin_system.test.sql).
delete from bookings; delete from waitlist; delete from collaborations; delete from crew_applications;
delete from announcements where audience <> 'all' and audience <> 'guest' and audience <> 'patron';
delete from conversations;
delete from partner_invoices; delete from sponsor_assets; delete from email_outbox; delete from notification_preferences;
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
create function tt.prio(p_uid uuid, p_type text) returns text language sql security definer as $$
  select priority from notifications where user_id = p_uid and type = p_type order by created_at desc limit 1;
$$;
create function tt.outbox(p_uid uuid, p_type text) returns bigint language sql security definer as $$
  select count(*) from email_outbox where user_id = p_uid and notification_type = p_type;
$$;
grant usage on schema tt to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Fixtures
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, aud, role, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000c0001', 'root@fin.tangy.test',    'authenticated', 'authenticated', '{"full_name":"Root Super"}'),
  ('00000000-0000-0000-0000-0000000c0002', 'manager@fin.tangy.test', 'authenticated', 'authenticated', '{"full_name":"Mira Manager"}'),
  ('00000000-0000-0000-0000-0000000c0003', 'staff@fin.tangy.test',   'authenticated', 'authenticated', '{"full_name":"Sam Staff"}'),
  ('00000000-0000-0000-0000-0000000c0004', 'staff2@fin.tangy.test',  'authenticated', 'authenticated', '{"full_name":"Tara Staff"}'),
  ('00000000-0000-0000-0000-0000000c0005', 'artist1@fin.tangy.test', 'authenticated', 'authenticated', '{"full_name":"Asha Artist"}'),
  ('00000000-0000-0000-0000-0000000c0006', 'artist2@fin.tangy.test', 'authenticated', 'authenticated', '{"full_name":"Bela Artist"}'),
  ('00000000-0000-0000-0000-0000000c0007', 'sponsor1@fin.tangy.test','authenticated', 'authenticated', '{"full_name":"Sona Sponsor"}'),
  ('00000000-0000-0000-0000-0000000c0008', 'sponsor2@fin.tangy.test','authenticated', 'authenticated', '{"full_name":"Tej Sponsor"}'),
  ('00000000-0000-0000-0000-0000000c0009', 'vendor1@fin.tangy.test', 'authenticated', 'authenticated', '{"full_name":"Vik Vendor"}'),
  ('00000000-0000-0000-0000-0000000c0010', 'vol1@fin.tangy.test',    'authenticated', 'authenticated', '{"full_name":"Rohan Das"}'),
  ('00000000-0000-0000-0000-0000000c0011', 'vol2@fin.tangy.test',    'authenticated', 'authenticated', '{"full_name":"Ananya V"}'),
  ('00000000-0000-0000-0000-0000000c0012', 'patron@fin.tangy.test',  'authenticated', 'authenticated', '{"full_name":"Pat Patron"}');
update profiles set role = 'super_admin' where id = '00000000-0000-0000-0000-0000000c0001';
update profiles set role = 'admin'       where id = '00000000-0000-0000-0000-0000000c0002';
update profiles set role = 'staff'       where id in ('00000000-0000-0000-0000-0000000c0003', '00000000-0000-0000-0000-0000000c0004');
update profiles set role = 'artist'      where id in ('00000000-0000-0000-0000-0000000c0005', '00000000-0000-0000-0000-0000000c0006');
update profiles set role = 'sponsor'     where id in ('00000000-0000-0000-0000-0000000c0007', '00000000-0000-0000-0000-0000000c0008');
update profiles set role = 'vendor'      where id = '00000000-0000-0000-0000-0000000c0009';
update profiles set role = 'volunteer'   where id in ('00000000-0000-0000-0000-0000000c0010', '00000000-0000-0000-0000-0000000c0011');

insert into artists (id, user_id, name, email, genre, city, status) values
  ('00000000-0000-0000-0000-00000000ac01', '00000000-0000-0000-0000-0000000c0005', 'Asha Artist', 'artist1@fin.tangy.test', 'Qawwali', 'Hyderabad', 'approved'),
  ('00000000-0000-0000-0000-00000000ac02', '00000000-0000-0000-0000-0000000c0006', 'Bela Artist', 'artist2@fin.tangy.test', 'Folk', 'Pune', 'approved');

insert into events (id, slug, name, event_date, venue, capacity, price, status) values
  ('00000000-0000-0000-0000-0000000fe001', 'fin-a', 'Arjuna Session', current_date + 2, 'Stepwell', 3, 500, 'on-sale'),
  ('00000000-0000-0000-0000-0000000fe002', 'fin-b', 'Tangy Live', current_date + 20, 'Baradari', 50, 700, 'on-sale'),
  ('00000000-0000-0000-0000-0000000fe003', 'fin-c', 'Last Season', current_date - 10, 'Baradari', 50, 700, 'past');
insert into event_artists (event_id, artist_id) values ('00000000-0000-0000-0000-0000000fe001', '00000000-0000-0000-0000-00000000ac01');
insert into event_assignments (event_id, assignee_role, assignee_id, title, assigned_by, team) values
  ('00000000-0000-0000-0000-0000000fe001', 'staff', '00000000-0000-0000-0000-0000000c0003', 'Front gate', '00000000-0000-0000-0000-0000000c0002', null),
  ('00000000-0000-0000-0000-0000000fe001', 'vendor', '00000000-0000-0000-0000-0000000c0009', 'Chai counter', '00000000-0000-0000-0000-0000000c0002', null),
  ('00000000-0000-0000-0000-0000000fe001', 'sponsor', '00000000-0000-0000-0000-0000000c0007', 'Title sponsor', '00000000-0000-0000-0000-0000000c0002', null),
  ('00000000-0000-0000-0000-0000000fe001', 'volunteer', '00000000-0000-0000-0000-0000000c0010', 'Gate', '00000000-0000-0000-0000-0000000c0002', 'gate'),
  ('00000000-0000-0000-0000-0000000fe001', 'volunteer', '00000000-0000-0000-0000-0000000c0011', 'Hospitality', '00000000-0000-0000-0000-0000000c0002', 'hospitality');

\echo '--- 1. Artist privacy: public view, private profile, admin notes'
select tt.anon();
select tt.check((select count(*) from public_artists) = 2, 'anonymous visitors see approved artists via public_artists');
select tt.expect_error($$select email from public_artists$$, '%column "email" does not exist%', 'public_artists has no email column');
select tt.check((select count(*) from artists) = 0, 'anonymous visitors can no longer read the artists table (email leak closed)');
select tt.login('00000000-0000-0000-0000-0000000c0012');
select tt.check((select count(*) from artists) = 0, 'a signed-in customer cannot read artist rows either');
select tt.login('00000000-0000-0000-0000-0000000c0005');
insert into artist_private_profiles (artist_id, phone, technical_rider, dietary_restrictions)
  values ('00000000-0000-0000-0000-00000000ac01', '9000000001', '16 channels, 2 vocal mics', 'No peanuts');
select tt.check((select phone from artist_private_profiles) = '9000000001', 'artist writes their own private profile');
select tt.expect_error($$insert into artist_private_profiles (artist_id, phone) values ('00000000-0000-0000-0000-00000000ac02', 'x')$$, '%row-level security%', 'artist cannot write another artist''s private profile');
select tt.check((select count(*) from artist_admin_notes) = 0, 'artist cannot read admin notes');
select tt.login('00000000-0000-0000-0000-0000000c0006');
select tt.check((select count(*) from artist_private_profiles) = 0, 'another artist cannot read the private profile');
select tt.login('00000000-0000-0000-0000-0000000c0007');
select tt.check((select count(*) from artist_private_profiles) = 0 and (select count(*) from artists) = 0, 'a sponsor cannot read artist private data');
select tt.login('00000000-0000-0000-0000-0000000c0002');
insert into artist_admin_notes (artist_id, internal_notes, default_fee, contract_status) values ('00000000-0000-0000-0000-00000000ac01', 'Great live draw', 30000, 'sent');
select tt.check((select dietary_restrictions from artist_private_profiles where artist_id = '00000000-0000-0000-0000-00000000ac01') = 'No peanuts', 'partner managers read the private profile');
select tt.login('00000000-0000-0000-0000-0000000c0005');
select tt.check(not exists (select 1 from artist_admin_notes), 'artist still cannot read their own admin notes');

\echo '--- 2. Real profile completion'
select tt.check((artist_profile_completion() ->> 'total')::int = 15 and (artist_profile_completion() ->> 'done')::int = 6
  and (artist_profile_completion() ->> 'percent')::int = round(100.0 * 6 / 15),
  'completion is computed from 15 defined fields (6 filled: name, genre, city, email, phone, rider)');
update artists set stage_name = 'Asha', bio = repeat('Qawwali singer from the Deccan. ', 3), instagram = 'asha' where id = '00000000-0000-0000-0000-00000000ac01';
select tt.check((artist_profile_completion() ->> 'done')::int = 9 and artist_profile_completion() -> 'missing' ? 'Spotify', 'completion rises with real edits and lists what is missing');
select tt.login('00000000-0000-0000-0000-0000000c0006');
select tt.expect_error($$select artist_profile_completion('00000000-0000-0000-0000-00000000ac01')$$, '%do not have access%', 'another artist cannot read someone else''s completion');

select tt.login('00000000-0000-0000-0000-0000000c0005');
select tt.expect_error($$insert into artist_availability (artist_id, date, status) values ('00000000-0000-0000-0000-00000000ac01', current_date + 2, 'unavailable')$$, '%confirmed performance on this date%', 'artist cannot overwrite a booked date with availability');
insert into artist_availability (artist_id, date, status) values ('00000000-0000-0000-0000-00000000ac01', current_date + 5, 'tentative');
select tt.check((select status from artist_availability where artist_id = '00000000-0000-0000-0000-00000000ac01' and date = current_date + 5) = 'tentative', 'artist sets availability on a free date');

\echo '--- 3. Media curation'
select tt.login('00000000-0000-0000-0000-0000000c0005');
insert into artist_media (id, artist_id, storage_path, file_name, media_type, status)
  values ('00000000-0000-0000-0000-0000000d0001', '00000000-0000-0000-0000-00000000ac01', '00000000-0000-0000-0000-00000000ac01/demo.mp3', 'demo.mp3', 'demo', 'uploaded');
select tt.expect_error($$update artist_media set status = 'approved' where id = '00000000-0000-0000-0000-0000000d0001'$$, '%approval is done by Tangy%', 'artist cannot approve their own media');
select tt.expect_error($$insert into artist_media (artist_id, storage_path, file_name, status) values ('00000000-0000-0000-0000-00000000ac01', 'x/y.mp3', 'y.mp3', 'approved')$$, '%starts as uploaded%', 'artist cannot insert pre-approved media');
update artist_media set status = 'under_review' where id = '00000000-0000-0000-0000-0000000d0001';
select tt.check((select status from artist_media) = 'under_review', 'artist submits media for review');
select tt.check(tt.notes('00000000-0000-0000-0000-0000000c0002', 'media.submitted') = 1, 'curators notified when media is submitted for review');
select tt.login('00000000-0000-0000-0000-0000000c0002');
update artist_media set status = 'approved', review_note = 'Lovely' where id = '00000000-0000-0000-0000-0000000d0001';
select tt.check((select reviewed_by from artist_media) = '00000000-0000-0000-0000-0000000c0002' and tt.notes('00000000-0000-0000-0000-0000000c0005', 'media.reviewed') = 1, 'curator approves; reviewer stamped; artist notified');

\echo '--- 4. Booking requests'
select tt.login('00000000-0000-0000-0000-0000000c0003');
select tt.expect_error($$select create_booking_request('00000000-0000-0000-0000-0000000fe002', '00000000-0000-0000-0000-00000000ac02', 'x')$$, '%permission%', 'staff cannot send booking requests');
select tt.login('00000000-0000-0000-0000-0000000c0002');
select create_booking_request('00000000-0000-0000-0000-0000000fe002', '00000000-0000-0000-0000-00000000ac02', 'Headline set?',
  (current_date + 20)::timestamp + time '20:00', (current_date + 20)::timestamp + time '21:30', 40000, null);
select create_booking_request('00000000-0000-0000-0000-0000000fe003', '00000000-0000-0000-0000-00000000ac02', 'Old one', null, null, null, now() - interval '1 minute');
select tt.check(tt.notes('00000000-0000-0000-0000-0000000c0006', 'booking.requested') = 2 and tt.outbox('00000000-0000-0000-0000-0000000c0006', 'booking.requested') >= 1,
  'artist notified in-app and by email of booking requests');
select tt.login('00000000-0000-0000-0000-0000000c0005');
select tt.check((select count(*) from my_booking_requests()) = 0, 'another artist sees none of them');
select tt.expect_error($$select respond_to_booking_request((select id from assignment_requests limit 1), true)$$, '%not found%', 'another artist cannot answer them');
select tt.login('00000000-0000-0000-0000-0000000c0006');
select tt.check((select count(*) from my_booking_requests()) = 2 and (select count(*) from my_booking_requests() where status = 'expired') = 1, 'artist sees both; the past-deadline one is expired');
select tt.expect_error($$select respond_to_booking_request((select id from my_booking_requests() where status = 'expired'), true)$$, '%expired%', 'expired request cannot be accepted');
select respond_to_booking_request((select id from my_booking_requests() where status = 'pending'), true);
select tt.check(event_member_kind('00000000-0000-0000-0000-0000000fe002', auth.uid()) = 'artist'
  and (select performance_start from event_artist_details where artist_id = '00000000-0000-0000-0000-00000000ac02') is not null,
  'accepting joins the lineup and records the proposed slot');
select tt.check(tt.notes('00000000-0000-0000-0000-0000000c0002', 'booking.accepted') = 1, 'the requesting admin is notified');
select tt.check(tt.notes('00000000-0000-0000-0000-0000000c0006', 'schedule.changed') = 0, 'no self-notification: the artist accepted the slot themselves');

\echo '--- 5. Requirements: priority, attachments, close'
select tt.login('00000000-0000-0000-0000-0000000c0002');
insert into event_requirements (id, event_id, user_id, title, priority, due_at)
  values ('00000000-0000-0000-0000-0000000a0001', '00000000-0000-0000-0000-0000000fe001', '00000000-0000-0000-0000-0000000c0005', 'Tech rider', 'urgent', now() - interval '1 hour');
select tt.check(tt.prio('00000000-0000-0000-0000-0000000c0005', 'requirement.requested') = 'urgent', 'urgent requirement → urgent notification');
select tt.login('00000000-0000-0000-0000-0000000c0005');
select tt.expect_error($$select submit_requirement('00000000-0000-0000-0000-0000000a0001', 'see file', 'requirements/other/x.pdf')$$, '%uploaded to this requirement%', 'attachment must live in this requirement''s folder');
select submit_requirement('00000000-0000-0000-0000-0000000a0001', 'Rider attached', 'requirements/00000000-0000-0000-0000-0000000a0001/rider.pdf');
select tt.expect_error($$select close_requirement('00000000-0000-0000-0000-0000000a0001')$$, '%permission%', 'artist cannot close a requirement');
select tt.login('00000000-0000-0000-0000-0000000c0002');
select review_requirement('00000000-0000-0000-0000-0000000a0001', false, 'Add the input list');
select tt.login('00000000-0000-0000-0000-0000000c0005');
select submit_requirement('00000000-0000-0000-0000-0000000a0001', 'Input list added', null);
select tt.check((select status from event_requirements) = 'submitted' and (select attachment_path from event_requirements) like 'requirements/%', 'artist re-submits after changes requested; attachment kept');
select tt.login('00000000-0000-0000-0000-0000000c0002');
select close_requirement('00000000-0000-0000-0000-0000000a0001');
select tt.check((select status from event_requirements) = 'closed' and (select closed_by from event_requirements) = auth.uid(), 'admin closes the requirement');

\echo '--- 6. Private documents & storage'
select tt.expect_error($$insert into event_documents (event_id, title, storage_path) values ('00000000-0000-0000-0000-0000000fe001', 'x', 'events/00000000-0000-0000-0000-0000000fe002/x.pdf')$$, '%check constraint%', 'storage path must be under its own event');
select tt.expect_error($$insert into event_documents (event_id, title, url, storage_path) values ('00000000-0000-0000-0000-0000000fe001', 'x', 'https://a.test', 'events/00000000-0000-0000-0000-0000000fe001/x.pdf')$$, '%check constraint%', 'a document is a link or a file, not both');
insert into event_documents (event_id, title, category, storage_path, audience) values
  ('00000000-0000-0000-0000-0000000fe001', 'Stage plot', 'tech_rider', 'events/00000000-0000-0000-0000-0000000fe001/plot.pdf', 'artist'),
  ('00000000-0000-0000-0000-0000000fe001', 'Old brief', 'event_brief', 'events/00000000-0000-0000-0000-0000000fe001/old.pdf', 'members');
update event_documents set expires_at = now() - interval '1 day' where title = 'Old brief';
select tt.check(tt.notes('00000000-0000-0000-0000-0000000c0005', 'document.added') >= 1, 'artist notified of the new document');
select tt.login('00000000-0000-0000-0000-0000000c0005');
select tt.check(can_read_event_file('events/00000000-0000-0000-0000-0000000fe001/plot.pdf'), 'artist on the event may read the artist document file');
select tt.check(not can_read_event_file('events/00000000-0000-0000-0000-0000000fe001/old.pdf') and not exists (select 1 from event_documents where title = 'Old brief'), 'expired documents are hidden (row and file)');
select tt.expect_error($$insert into storage.objects (bucket_id, name) values ('event-documents', 'events/00000000-0000-0000-0000-0000000fe001/evil.pdf')$$, '%row-level security%', 'artist cannot upload event documents');
select tt.login('00000000-0000-0000-0000-0000000c0009');
select tt.check(not can_read_event_file('events/00000000-0000-0000-0000-0000000fe001/plot.pdf'), 'vendor cannot read the artist-only file');
select tt.check(not can_read_event_file('requirements/00000000-0000-0000-0000-0000000a0001/rider.pdf'), 'vendor cannot read another member''s requirement attachment');
select tt.login('00000000-0000-0000-0000-0000000c0006');
select tt.check(not can_read_event_file('events/00000000-0000-0000-0000-0000000fe001/plot.pdf'), 'artist on another event cannot read it');

\echo '--- 7. Sponsor brand assets'
select tt.login('00000000-0000-0000-0000-0000000c0007');
insert into sponsor_assets (id, sponsor_id, kind, title, storage_path) values
  ('00000000-0000-0000-0000-0000000b5001', auth.uid(), 'logo', 'Primary logo', '00000000-0000-0000-0000-0000000c0007/logo.png');
select tt.expect_error($$insert into sponsor_assets (sponsor_id, title, storage_path) values ('00000000-0000-0000-0000-0000000c0008', 'x', '00000000-0000-0000-0000-0000000c0008/x.png')$$, '%row-level security%', 'sponsor cannot submit assets for another sponsor');
update sponsor_assets set status = 'approved';
select tt.check((select status from sponsor_assets) = 'submitted', 'sponsor cannot approve their own asset');
select tt.check(tt.notes('00000000-0000-0000-0000-0000000c0002', 'asset.submitted') = 1, 'partner managers notified of the submission');
select tt.login('00000000-0000-0000-0000-0000000c0008');
select tt.check((select count(*) from sponsor_assets) = 0, 'another sponsor cannot see it');
select tt.login('00000000-0000-0000-0000-0000000c0002');
update sponsor_assets set status = 'approved' where id = '00000000-0000-0000-0000-0000000b5001';
select tt.check((select reviewed_by from sponsor_assets) = auth.uid() and tt.notes('00000000-0000-0000-0000-0000000c0007', 'asset.reviewed') = 1, 'admin approves; sponsor notified');

\echo '--- 8. Invoices'
insert into partner_invoices (event_id, partner_id, invoice_number, amount, status, issued_date, due_date) values
  ('00000000-0000-0000-0000-0000000fe001', '00000000-0000-0000-0000-0000000c0009', 'TNG-001', 12000, 'issued', current_date - 20, current_date - 5),
  ('00000000-0000-0000-0000-0000000fe001', '00000000-0000-0000-0000-0000000c0009', 'TNG-002', 5000, 'draft', null, null),
  ('00000000-0000-0000-0000-0000000fe001', '00000000-0000-0000-0000-0000000c0007', 'TNG-003', 90000, 'issued', current_date, current_date + 30);
select tt.expect_error($$insert into partner_invoices (partner_id, invoice_number, amount, status) values ('00000000-0000-0000-0000-0000000c0009', 'TNG-004', 1, 'paid')$$, '%check constraint%', 'a paid invoice needs a paid date');
select tt.login('00000000-0000-0000-0000-0000000c0009');
select tt.check((select array_agg(invoice_number) from partner_invoices) = array['TNG-001'], 'vendor sees only their own issued invoice (not drafts, not the sponsor''s)');
select tt.check((select invoice_state(i) from partner_invoices i) = 'overdue', 'overdue is derived from the due date');
select tt.check(tt.notes(auth.uid(), 'invoice.issued') = 1, 'vendor notified of the issued invoice');
select tt.expect_error($$insert into partner_invoices (partner_id, invoice_number, amount) values (auth.uid(), 'SELF-1', 1)$$, '%row-level security%', 'vendor cannot create invoices');
select tt.login('00000000-0000-0000-0000-0000000c0003');
select tt.check((select count(*) from partner_invoices) = 0, 'staff cannot read financial records');

\echo '--- 9. Volunteer teams'
select tt.login('00000000-0000-0000-0000-0000000c0002');
insert into announcements (title, body, audience, event_id, target_team, status) values
  ('Gate team: 5pm briefing', 'Meet at gate 2', 'volunteer', '00000000-0000-0000-0000-0000000fe001', 'gate', 'published');
select tt.expect_error($$insert into announcements (title, audience, target_team, status) values ('x', 'volunteer', 'gate', 'draft')$$, '%check constraint%', 'team notices must belong to an event');
select tt.login('00000000-0000-0000-0000-0000000c0010');
select tt.check(exists (select 1 from portal_announcements() where title = 'Gate team: 5pm briefing') and tt.notes(auth.uid(), 'announcement.published') = 1, 'gate volunteer sees and is notified of the gate notice');
select tt.login('00000000-0000-0000-0000-0000000c0011');
select tt.check(not exists (select 1 from announcements where title = 'Gate team: 5pm briefing') and tt.notes(auth.uid(), 'announcement.published') = 0, 'hospitality volunteer does not');

\echo '--- 10. Tasks'
select tt.login('00000000-0000-0000-0000-0000000c0002');
insert into event_tasks (id, event_id, title, priority, team, due_at) values
  ('00000000-0000-0000-0000-00000000fa01', '00000000-0000-0000-0000-0000000fe001', 'Set up gate barriers', 'urgent', 'gate', now() - interval '1 hour');
select tt.check((select status from event_tasks) = 'pending' and (select created_by from event_tasks) = auth.uid(), 'event-level task with urgent priority');
select tt.login('00000000-0000-0000-0000-0000000c0003');
select tt.check((select count(*) from event_tasks) = 1, 'assigned staff sees the event task');
update event_tasks set status = 'blocked' where id = '00000000-0000-0000-0000-00000000fa01';
select tt.expect_error($$update event_tasks set title = 'x' where id = '00000000-0000-0000-0000-00000000fa01'$$, '%Only staff/admin can change task details%', 'staff cannot edit task details');
update event_tasks set status = 'done' where id = '00000000-0000-0000-0000-00000000fa01';
select tt.check((select completed_by from event_tasks) = auth.uid() and (select completed_at from event_tasks) is not null, 'completion stamped with who and when');
select tt.login('00000000-0000-0000-0000-0000000c0004');
select tt.check((select count(*) from event_tasks) = 0, 'unassigned staff cannot see it');

\echo '--- 11. Notification preferences + email outbox'
select tt.login('00000000-0000-0000-0000-0000000c0005');
select tt.check((my_notification_preferences() -> 'prefs' -> 'messages' ->> 'in_app')::boolean, 'defaults: messages on');
select set_notification_preference('messages', false, false);
select set_notification_preference('event_updates', true, false);
select tt.expect_error($$select set_notification_preference('evil', true, true)$$, '%Unknown notification preference%', 'unknown preference keys are rejected');
select tt.login('00000000-0000-0000-0000-0000000c0002');
select admin_start_partner_conversation('00000000-0000-0000-0000-0000000c0005', 'Hi', 'Soundcheck at 4?', '00000000-0000-0000-0000-0000000fe001');
select tt.check(tt.notes('00000000-0000-0000-0000-0000000c0005', 'message.new') = 0 and tt.outbox('00000000-0000-0000-0000-0000000c0005', 'message.new') = 0, 'messages switched off: no in-app, no email');
update events set status = 'cancelled' where id = '00000000-0000-0000-0000-0000000fe001';
select tt.check(tt.notes('00000000-0000-0000-0000-0000000c0005', 'event.cancelled') = 1, 'critical: cancellation still delivered in-app');
select tt.check(tt.outbox('00000000-0000-0000-0000-0000000c0005', 'event.cancelled') = 0 and tt.outbox('00000000-0000-0000-0000-0000000c0009', 'event.cancelled') = 1, 'email follows each user''s preference');
update events set status = 'on-sale' where id = '00000000-0000-0000-0000-0000000fe001';
select tt.login('00000000-0000-0000-0000-0000000c0009');
select start_partner_conversation('Loading', 'Need loading bay access', '00000000-0000-0000-0000-0000000fe001');
select start_partner_conversation('Loading', 'Also a trolley', '00000000-0000-0000-0000-0000000fe001');
select tt.check(tt.outbox('00000000-0000-0000-0000-0000000c0002', 'message.new') = 1, 'chat emails are de-duplicated per thread (15 min window)');
select tt.expect_error($$select * from claim_email_batch(5)$$, '%permission denied%', 'users cannot drain the email outbox');
select tt.check((select count(*) from email_outbox) = 0, 'users cannot read the email outbox');

\echo '--- 12. Booking expiry + late payment'
select tt.logout();
do $$
declare b bookings;
begin
  b := create_pending_booking(null, '00000000-0000-0000-0000-0000000fe001', 'FIN-P1', 'Guest One', 'g1@example.test', null, 2, 1000, 'gen', 'ord_p1');
  b := create_pending_booking(null, '00000000-0000-0000-0000-0000000fe001', 'FIN-P2', 'Guest Two', 'g2@example.test', null, 1, 500, 'gen', 'ord_p2');
end $$;
select tt.expect_error($$select create_pending_booking(null, '00000000-0000-0000-0000-0000000fe001', 'FIN-P3', 'x', 'x@example.test', null, 1, 500, 'gen', 'ord_p3')$$, '%SOLD_OUT%', 'held seats count against capacity');
update bookings set created_at = now() - interval '45 minutes' where registration_code in ('FIN-P1', 'FIN-P2');
update bookings set razorpay_payment_id = 'pay_in_flight' where registration_code = 'FIN-P2';
select create_pending_booking(null, '00000000-0000-0000-0000-0000000fe001', 'FIN-P3', 'Guest Three', 'g3@example.test', null, 2, 1000, 'gen', 'ord_p3');
select tt.check((select status from bookings where registration_code = 'FIN-P1') = 'expired'
  and (select status from bookings where registration_code = 'FIN-P2') = 'pending', 'stale unpaid hold expired server-side; a hold with a payment is never expired');
select tt.check(exists (select 1 from tt.audits('booking.expired') where metadata ->> 'registration_code' = 'FIN-P1'), 'expiry audited');
select tt.login('00000000-0000-0000-0000-0000000c0012');
select tt.expect_error($$select expire_stale_bookings()$$, '%permission denied%', 'customers cannot trigger expiry');
select tt.logout();
update bookings set status = 'confirmed', razorpay_payment_id = 'pay_late' where registration_code = 'FIN-P1';
select tt.check(exists (select 1 from tt.audits('payment.late')) and tt.notes('00000000-0000-0000-0000-0000000c0002', 'payment.late') = 1, 'a payment after expiry still confirms, and finance is alerted');

\echo '--- 13. Event health (explicit rules)'
select tt.login('00000000-0000-0000-0000-0000000c0002');
select tt.check((event_health('00000000-0000-0000-0000-0000000fe003') ->> 'state') = 'completed', 'past event → completed');
select tt.check((event_health('00000000-0000-0000-0000-0000000fe001') ->> 'state') = 'needs_attention'
  and (event_health('00000000-0000-0000-0000-0000000fe001') -> 'reasons') ? '1 artist without a performance time',
  'event with an artist missing a performance time needs attention (explicit reason)');
delete from event_assignments where event_id = '00000000-0000-0000-0000-0000000fe001' and assignee_role = 'staff';
select tt.check((event_health('00000000-0000-0000-0000-0000000fe001') ->> 'state') = 'at_risk'
  and (event_health('00000000-0000-0000-0000-0000000fe001') -> 'reasons') ? 'No staff assigned',
  'event in 2 days with no staff assigned is at risk');
insert into event_assignments (event_id, assignee_role, assignee_id, title) values
  ('00000000-0000-0000-0000-0000000fe001', 'staff', '00000000-0000-0000-0000-0000000c0003', 'Front gate');
select tt.check((event_health('00000000-0000-0000-0000-0000000fe002') ->> 'state') in ('needs_attention', 'ready'), 'event in 20 days is not at risk');
update events set status = 'cancelled' where id = '00000000-0000-0000-0000-0000000fe002';
select tt.check((event_health('00000000-0000-0000-0000-0000000fe002') ->> 'state') = 'cancelled', 'cancelled event → cancelled');
select tt.login('00000000-0000-0000-0000-0000000c0004');
select tt.expect_error($$select event_health('00000000-0000-0000-0000-0000000fe001')$$, '%do not have access%', 'unassigned staff cannot read another event''s health');

\echo '--- 14. Operations overview + global search'
select tt.login('00000000-0000-0000-0000-0000000c0002');
select tt.check((admin_operations_overview() -> 'metrics' ->> 'upcoming_events')::int >= 1, 'admin operations overview returns real counts');
select tt.check(exists (select 1 from admin_search('Asha') where kind = 'artist') and exists (select 1 from admin_search('FIN-P') where kind = 'booking'), 'admin search finds artists and bookings');
select tt.login('00000000-0000-0000-0000-0000000c0003');
select tt.expect_error($$select admin_operations_overview()$$, '%do not have access%', 'staff cannot read the global overview');
select tt.check(exists (select 1 from admin_search('Arjuna') where kind = 'event') and not exists (select 1 from admin_search('Tangy Live'))
  and not exists (select 1 from admin_search('FIN-P') where kind = 'booking'), 'staff search is scoped to assigned events, no bookings');
select tt.login('00000000-0000-0000-0000-0000000c0005');
select tt.check((select count(*) from admin_search('Arjuna')) = 0, 'partners get no console search results');

\echo '--- 15. Platform jobs are server-only'
select tt.expect_error($$select run_platform_jobs()$$, '%permission denied%', 'users cannot run platform jobs');
select tt.expect_error($$select notify(auth.uid(), 'x.y', 'spoof')$$, '%permission denied%', 'users cannot create notifications');

\echo ''
\echo 'ALL PLATFORM FINALIZATION DATABASE TESTS PASSED'
rollback;
