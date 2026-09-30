-- Removes the LOCAL demo dataset (supabase/demo/demo_seed.sql): every row whose
-- id starts with de300000-0000-4000-8000- or that belongs to a demo event /
-- demo account. The demo auth accounts themselves are deleted afterwards by
-- scripts/demo-data.sh through the auth admin API. Audit log rows written
-- about demo records stay (the audit log is append-only by design).
\set ON_ERROR_STOP 1
begin;
create function pg_temp.demo(u uuid) returns boolean language sql immutable as $$ select u::text like 'de300000-0000-4000-8000-%' $$;
delete from checkins where pg_temp.demo(event_id) or pg_temp.demo(booking_id);
delete from tickets where pg_temp.demo(event_id) or pg_temp.demo(booking_id);
delete from waitlist where pg_temp.demo(id) or pg_temp.demo(event_id) or pg_temp.demo(user_id);
delete from bookings where pg_temp.demo(id) or pg_temp.demo(event_id) or pg_temp.demo(user_id);
delete from messages where conversation_id in (select id from conversations where pg_temp.demo(id) or pg_temp.demo(external_user_id));
delete from conversation_participants where conversation_id in (select id from conversations where pg_temp.demo(id) or pg_temp.demo(external_user_id));
delete from conversations where pg_temp.demo(id) or pg_temp.demo(external_user_id);
delete from event_tasks where pg_temp.demo(id) or pg_temp.demo(event_id);
delete from event_requirements where pg_temp.demo(id) or pg_temp.demo(event_id);
delete from temporary_access where pg_temp.demo(id) or pg_temp.demo(event_id);
delete from partner_invoices where pg_temp.demo(id) or pg_temp.demo(event_id);
delete from sponsor_deliverables where pg_temp.demo(id) or pg_temp.demo(sponsor_profile_id);
delete from event_assignments where pg_temp.demo(id) or pg_temp.demo(event_id) or pg_temp.demo(assignee_id);
delete from event_artist_details where pg_temp.demo(event_id) or pg_temp.demo(artist_id);
delete from event_artists where pg_temp.demo(event_id) or pg_temp.demo(artist_id);
delete from announcements where pg_temp.demo(id) or pg_temp.demo(event_id);
delete from gallery_albums where pg_temp.demo(id);
delete from diary_posts where pg_temp.demo(id);
delete from tv_videos where pg_temp.demo(id);
delete from contact_enquiries where pg_temp.demo(user_id);
delete from private_enquiries where pg_temp.demo(user_id);
delete from collaborations where pg_temp.demo(user_id);
delete from crew_applications where pg_temp.demo(user_id);
delete from notifications where pg_temp.demo(user_id) or pg_temp.demo(event_id);
delete from email_outbox where pg_temp.demo(user_id);
delete from events where pg_temp.demo(id);
delete from venues where pg_temp.demo(id);
delete from artists where pg_temp.demo(id) or pg_temp.demo(user_id);
delete from sponsor_profiles where pg_temp.demo(id);
delete from vendor_profiles where pg_temp.demo(id);
delete from venue_profiles where pg_temp.demo(id);
delete from volunteer_profiles where pg_temp.demo(id);
delete from crew_profiles where pg_temp.demo(id);
commit;
