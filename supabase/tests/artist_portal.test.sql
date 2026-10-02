-- Tangy Sessions — artist portal and applications (0032 / 0033).
-- One transaction, rolled back at the end. Run: scripts/test-db.sh

\set ON_ERROR_STOP 1
\set QUIET 1
begin;

delete from programmes; delete from bookings; delete from waitlist; delete from collaborations; delete from crew_applications;
delete from private_enquiries; delete from contact_enquiries; delete from assignment_requests;
delete from conversations; delete from notifications; delete from email_outbox; delete from application_reviews;
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
create function tt.app(p_uid uuid) returns artist_applications language sql security definer as $$
  select * from artist_applications where user_id = p_uid;
$$;
create function tt.req_status(p_id uuid) returns text language sql security definer as $$
  select status::text from assignment_requests where id = p_id;
$$;
create function tt.notes(p_uid uuid, p_type text) returns bigint language sql security definer as $$
  select count(*) from notifications where user_id = p_uid and type = p_type;
$$;
grant usage on schema tt to anon, authenticated;
grant execute on all functions in schema tt to anon, authenticated;

insert into auth.users (id, email, aud, role, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000e100', 'mgr@art.tangy.test',   'authenticated', 'authenticated', '{}'),
  ('00000000-0000-0000-0000-00000000e101', 'staff@art.tangy.test', 'authenticated', 'authenticated', '{}'),
  ('00000000-0000-0000-0000-00000000e102', 'ira@art.tangy.test',   'authenticated', 'authenticated', '{}'),
  ('00000000-0000-0000-0000-00000000e103', 'om@art.tangy.test',    'authenticated', 'authenticated', '{}'),
  ('00000000-0000-0000-0000-00000000e104', 'kai@art.tangy.test',   'authenticated', 'authenticated', '{}'),
  ('00000000-0000-0000-0000-00000000e105', 'noor@art.tangy.test',  'authenticated', 'authenticated', '{}');
update profiles set role = 'admin' where id = '00000000-0000-0000-0000-00000000e100';
update profiles set role = 'staff' where id = '00000000-0000-0000-0000-00000000e101';

insert into events (id, slug, name, event_date, venue, capacity, price, status) values
  ('00000000-0000-0000-0000-00000000e601', 'art-night', 'Art Night', current_date + 20, 'Stepwell', 60, 900, 'on-sale'),
  ('00000000-0000-0000-0000-00000000e602', 'art-other', 'Other Night', current_date + 20, 'Courtyard', 60, 900, 'on-sale');

\echo '--- 1. Applying'
select tt.login('00000000-0000-0000-0000-00000000e102');
insert into artist_applications (status, data) values ('approved', '{"about":{"full_name":"Ira K"}}');
select tt.check((tt.app('00000000-0000-0000-0000-00000000e102')).status = 'draft', 'a new application always starts as a draft');
update artist_applications set data = '{"about":{"full_name":"Ira Kaur","stage_name":"Ira","city":"Pune"},"artistry":{"artist_type":"Solo Artist","primary_genre":"Hindustani","short_bio":"Khayal."}}', current_step = 3;
select tt.check((tt.app('00000000-0000-0000-0000-00000000e102')).current_step = 3, 'the draft saves progress');
select tt.expect_error($$update artist_applications set status = 'approved'$$, '%Use Submit%', 'the applicant cannot set a status');
select tt.expect_error($$select submit_artist_application()$$, '%performance video%media consent%', 'submitting needs the performance video and consents');
select tt.expect_error($$update artist_applications set video_url = 'https://evil.example.com/v.mp4'$$, '%check constraint%', 'only YouTube / Vimeo links are accepted');
update artist_applications set video_url = 'https://www.youtube.com/watch?v=abc123', media_consent = true, accuracy_confirmed = true;
select submit_artist_application();
select tt.check((tt.app('00000000-0000-0000-0000-00000000e102')).status = 'submitted', 'the application is submitted');
select tt.check((select status::text from artists where user_id = '00000000-0000-0000-0000-00000000e102') = 'pending', '… and the artist record is pending review');
select tt.check(tt.notes('00000000-0000-0000-0000-00000000e100', 'application.new') = 1, 'reviewers are notified');
update artist_applications set data = '{}';
select tt.check((tt.app('00000000-0000-0000-0000-00000000e102')).data <> '{}', 'a submitted application cannot be edited');

select tt.login('00000000-0000-0000-0000-00000000e103');
select tt.check((select count(*) from artist_applications) = 0, 'another person cannot read the application');
select tt.login('00000000-0000-0000-0000-00000000e101');
select tt.check((select count(*) from artist_applications) = 0, 'staff cannot read applications');
select tt.expect_error($$select review_artist_application((select id from artist_applications limit 1), 'approve')$$, '%permission%', 'staff cannot review');

\echo '--- 2. Review cycle'
select tt.login('00000000-0000-0000-0000-00000000e100');
select review_artist_application((tt.app('00000000-0000-0000-0000-00000000e102')).id, 'start_review');
select review_artist_application((tt.app('00000000-0000-0000-0000-00000000e102')).id, 'request_info', array['Technical rider required'], 'Please add your rider.', 'Promising — needs rider.');
select tt.check((tt.app('00000000-0000-0000-0000-00000000e102')).status = 'needs_information', 'the team requests more information');
select tt.check(tt.notes('00000000-0000-0000-0000-00000000e102', 'application.info_requested') = 1, 'the applicant is told what is needed');
select tt.check((select notes from application_reviews where source_table = 'artist_applications') = 'Promising — needs rider.', 'internal notes are stored for reviewers');
select tt.login('00000000-0000-0000-0000-00000000e102');
select tt.check((select count(*) from application_reviews) = 0, 'the applicant cannot read internal notes');
select tt.check((tt.app('00000000-0000-0000-0000-00000000e102')).info_request ->> 'message' = 'Please add your rider.', 'the applicant sees the request');
update artist_applications set data = jsonb_set(data, '{technical}', '{"rider":"2 vocal mics"}');
select submit_artist_application();
select tt.check(tt.notes('00000000-0000-0000-0000-00000000e100', 'application.resubmitted') = 1, 'reviewers are told about the resubmission');
select tt.login('00000000-0000-0000-0000-00000000e100');
select tt.expect_error($$select review_artist_application((select id from artist_applications limit 1), 'reject')$$, '%internal reason%', 'rejecting needs an internal reason');
select review_artist_application((tt.app('00000000-0000-0000-0000-00000000e102')).id, 'approve');
select tt.check((tt.app('00000000-0000-0000-0000-00000000e102')).status = 'approved', 'approval completes the application');
select tt.check((select role from profiles where id = '00000000-0000-0000-0000-00000000e102') = 'artist', '… provisions the artist role server-side');
select tt.check((select status::text from artists where user_id = '00000000-0000-0000-0000-00000000e102') = 'approved', '… and approves the artist record');

\echo '--- 2b. Declined and withdrawn applications'
select tt.login('00000000-0000-0000-0000-00000000e104');
insert into artist_applications (data) values ('{"about":{"full_name":"Kai Rao","stage_name":"Kai","city":"Goa"},"artistry":{"artist_type":"DJ","primary_genre":"Electronic","short_bio":"Late sets."}}');
update artist_applications set video_url = 'https://vimeo.com/123456', media_consent = true, accuracy_confirmed = true;
select submit_artist_application();
select tt.login('00000000-0000-0000-0000-00000000e100');
select review_artist_application((tt.app('00000000-0000-0000-0000-00000000e104')).id, 'reject', null, 'Thank you — not this season.', 'Internal: style does not fit the stepwell.');
select tt.check((tt.app('00000000-0000-0000-0000-00000000e104')).status = 'rejected', 'a reviewer can decline an application');
select tt.check(tt.notes('00000000-0000-0000-0000-00000000e104', 'application.rejected') = 1, 'the applicant is told about the decision');
select tt.login('00000000-0000-0000-0000-00000000e104');
select tt.check((tt.app('00000000-0000-0000-0000-00000000e104')).public_message = 'Thank you — not this season.', 'the applicant sees the message from the team');
select tt.check((select body from notifications where type = 'application.rejected') = 'Thank you — not this season.', 'the applicant’s notice carries the public message, not the internal reason');
select tt.check((select count(*) from application_reviews) = 0, 'the internal reason stays private');
select tt.expect_error($$select withdraw_artist_application()$$, '%no open application%', 'a decided application cannot be withdrawn');
select tt.login('00000000-0000-0000-0000-00000000e105');
insert into artist_applications (data) values ('{"about":{"full_name":"Noor Ali","stage_name":"Noor","city":"Lucknow"},"artistry":{"artist_type":"Vocalist","primary_genre":"Ghazal","short_bio":"Ghazals."}}');
update artist_applications set video_url = 'https://youtu.be/abc123', media_consent = true, accuracy_confirmed = true;
select submit_artist_application();
select withdraw_artist_application();
select tt.check((tt.app('00000000-0000-0000-0000-00000000e105')).status = 'withdrawn', 'an applicant can withdraw a submitted application');
select tt.login('00000000-0000-0000-0000-00000000e100');
select tt.expect_error(format($$select review_artist_application(%L, 'approve')$$, (tt.app('00000000-0000-0000-0000-00000000e105')).id), '%not awaiting a decision%', 'a withdrawn application cannot be approved');

\echo '--- 3. Private notes on every application kind'
select tt.logout();
insert into collaborations (type, business_name, email, user_id) values ('vendor', 'Om Snacks', 'om@art.tangy.test', '00000000-0000-0000-0000-00000000e103');
select tt.login('00000000-0000-0000-0000-00000000e100');
select approve_collaboration((select id from collaborations limit 1), 'Internal: late paperwork last year.');
select tt.check((select review_notes from collaborations limit 1) is null, 'notes never land on the applicant''s row');
select tt.check((select review_notes from applications_overview where source_table = 'collaborations') like 'Internal:%', 'reviewers still see them in the overview');
select tt.login('00000000-0000-0000-0000-00000000e103');
select tt.check((select review_notes from applications_overview where source_table = 'collaborations') is null, 'the applicant sees no notes');

\echo '--- 4. Availability is private'
select tt.login('00000000-0000-0000-0000-00000000e102');
select tt.check(set_artist_availability(current_date + 19, current_date + 21, 'unavailable', 'Travelling from Bengaluru') = 3, 'an artist marks a date range');
select tt.anon();
select tt.check((select count(*) from artist_availability) = 0, 'visitors cannot read availability');
select tt.login('00000000-0000-0000-0000-00000000e103');
select tt.check((select count(*) from artist_availability) = 0, 'other people cannot read it');
select tt.expect_error($$select set_artist_availability(current_date, current_date, 'available')$$, '%approved artist%', 'only approved artists set availability');

\echo '--- 5. Booking requests'
select tt.login('00000000-0000-0000-0000-00000000e100');
select tt.check((artist_schedule_check((select id from artists where user_id = '00000000-0000-0000-0000-00000000e102'), current_date + 20) -> 'availability' ->> 'status') = 'unavailable',
  'the team sees the artist is unavailable before sending');
create temp table r as select create_artist_request('00000000-0000-0000-0000-00000000e601', (select id from artists where user_id = '00000000-0000-0000-0000-00000000e102'),
  jsonb_build_object('performance_type', 'Acoustic set', 'set_minutes', 60, 'fee_offer', 25000, 'call_time', (current_date + 20)::text || ' 17:00+05:30'), false) as id;
grant select on r to authenticated;
select tt.check(tt.req_status((select id from r)) = 'draft', 'a request can be saved as a draft');
select tt.login('00000000-0000-0000-0000-00000000e102');
select tt.check((select count(*) from assignment_requests) = 0, 'the artist does not see drafts');
select tt.login('00000000-0000-0000-0000-00000000e100');
select manage_artist_request((select id from r), 'send');
select tt.check(tt.notes('00000000-0000-0000-0000-00000000e102', 'booking.requested') = 1, 'sending notifies the artist');
select tt.login('00000000-0000-0000-0000-00000000e102');
select mark_artist_request_viewed((select id from r));
select tt.check((select viewed_at is not null from assignment_requests), 'opening the request marks it viewed');
update assignment_requests set status = 'confirmed';
select tt.check(tt.req_status((select id from r)) = 'pending', 'the artist cannot set statuses directly (RLS matches no rows)');
select respond_to_booking_request((select id from r), true, null);
select tt.check(tt.req_status((select id from r)) = 'accepted', 'the artist accepts');
select tt.check(exists (select 1 from event_artists where event_id = '00000000-0000-0000-0000-00000000e601'), '… and joins the line-up');
select tt.expect_error($$select manage_artist_request((select id from r), 'confirm')$$, '%permission%', 'the artist cannot confirm');
select tt.login('00000000-0000-0000-0000-00000000e100');
select tt.check(tt.notes('00000000-0000-0000-0000-00000000e100', 'booking.accepted') = 1, 'the team is told');
select manage_artist_request((select id from r), 'confirm');
select tt.check(tt.req_status((select id from r)) = 'confirmed', 'the team confirms');
select tt.check((select call_time is not null from event_artist_details where event_id = '00000000-0000-0000-0000-00000000e601'), '… and the call time reaches the artist''s logistics');
select tt.expect_error($$select manage_artist_request((select id from r), 'complete')$$, '%not happened%', 'a future session cannot be completed');
select tt.check(jsonb_array_length(artist_schedule_check((select id from artists where user_id = '00000000-0000-0000-0000-00000000e102'), current_date + 20) -> 'sessions') >= 1,
  'the conflict check now shows the booked session');
select tt.login('00000000-0000-0000-0000-00000000e102');
select tt.check(set_artist_availability(current_date + 19, current_date + 21, 'tentative') = 2, 'a range skips the booked day …');
select tt.check((select status from artist_availability where date = current_date + 20 and artist_id = (select id from artists where user_id = auth.uid())) is distinct from 'tentative',
  '… which keeps its booking');
-- On the night itself (the venue's calendar day, whatever the UTC date) the team can close it.
select tt.logout();
update events set event_date = (now() at time zone 'Asia/Kolkata')::date where id = '00000000-0000-0000-0000-00000000e601';
select tt.login('00000000-0000-0000-0000-00000000e100');
select manage_artist_request((select id from r), 'complete');
select tt.check(tt.req_status((select id from r)) = 'completed', 'a session is completed on the venue''s own date');

\echo '--- 6. Documents are private'
select tt.login('00000000-0000-0000-0000-00000000e102');
insert into artist_documents (artist_id, kind, title, storage_path) values ((select id from artists where user_id = auth.uid()), 'rider', 'Tech rider', 'x/rider.pdf');
select tt.login('00000000-0000-0000-0000-00000000e103');
select tt.check((select count(*) from artist_documents) = 0, 'other people cannot see an artist''s documents');
select tt.anon();
select tt.check((select count(*) from artist_documents) = 0, 'visitors cannot see documents');
select tt.logout();
select tt.check((select public from storage.buckets where id = 'artist-documents') = false, 'the documents bucket is private');

\echo ''
\echo 'ALL ARTIST PORTAL DATABASE TESTS PASSED'
rollback;
