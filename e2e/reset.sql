-- LOCAL TEST DATA ONLY. Puts the E2E fixtures back to their starting state.
-- Only the two applications the super admin suite reviews go back to pending;
-- the platform suite's partner accounts stay approved.
update collaborations set status='pending', reviewed_by=null, reviewed_at=null, review_notes=null, decision_reason=null where email = 'vendor@tangy.test';
update crew_applications set status='pending', reviewed_by=null, reviewed_at=null, review_notes=null, decision_reason=null where email = 'crew@tangy.test';
update profiles set role='user' where email in ('vendor@tangy.test','crew@tangy.test');
delete from vendor_profiles where id in (select id from profiles where email = 'vendor@tangy.test');
delete from application_notifications;
-- Events the suites created (waitlist/content suites add bookings, waitlist rows and ticket types to theirs).
delete from waitlist where event_id in (select id from events where slug like 'e2e-%') or user_id in (select id from profiles where email like '%@tangy.test');
delete from bookings where event_id in (select id from events where slug like 'e2e-%');
delete from events where slug like 'e2e-%';
delete from event_assignments where title = 'Gate check-in';
delete from announcements where title like 'E2E %';

-- Operations platform state (0018)
delete from conversations where conversation_type <> 'general';
delete from notifications;
delete from temporary_access;
delete from access_requests;
delete from event_requirements;
delete from event_documents;
delete from event_artist_details;
update event_assignments set call_time = null, starts_at = null, ends_at = null, instructions = null, fee_amount = null, fee_status = 'not_applicable'
  where assignee_id in (select id from profiles where email like '%@tangy.test');
delete from role_permissions where role = 'staff' and permission = 'reports.view';

-- Platform finalization state (0020) for portals.mjs / mobile.mjs
delete from assignment_requests where artist_id in (select id from artists where email = 'artist@tangy.test');
delete from event_artists where artist_id in (select id from artists where email = 'artist@tangy.test')
  and event_id <> (select id from events where slug = 'vol-5-local');
delete from artist_availability where artist_id in (select id from artists where email = 'artist@tangy.test');
delete from artist_media where artist_id in (select id from artists where email = 'artist@tangy.test');
delete from artist_private_profiles where artist_id in (select id from artists where email = 'artist@tangy.test');
update artists set stage_name = null, avatar_url = null where email = 'artist@tangy.test';
delete from sponsor_assets;
delete from sponsor_deliverables;
delete from partner_invoices;
delete from notification_preferences;
update events set doors_at = null where slug = 'vol-5-local';
-- Last, so fixture updates above (they fire event-change triggers) leave no notifications behind.
delete from notifications;
delete from email_outbox;
-- Storage metadata for files the suites uploaded (local stack only).
set storage.allow_delete_query = 'true';
delete from storage.objects where bucket_id in ('artist-media', 'artist-avatars', 'sponsor-assets', 'event-documents') and name like '%e2e-%';
reset storage.allow_delete_query;

-- Group check-in fixtures (seed_group.sql, 0023) and the suite's customer
-- checkout never leak into other suites.
delete from bookings where registration_code like 'TS-GRP%';
delete from bookings where user_id = (select id from profiles where email = 'patron@tangy.test') and registration_code not like 'TS-LOCAL%';
-- Booking-form configuration (0024) back to defaults for the checkout suite.
update events set booking_min_quantity = 1, booking_max_quantity = 10, booking_questions = '[]'::jsonb where slug in ('vol-5-local', 'vol-6-local');
delete from payment_webhook_events where event_id like '%pay_e2e_%';
-- Waitlist / enquiry / content suites (0025–0028): their fixtures and anything they created.
delete from contact_enquiries where email like '%@tangy.test';
delete from private_enquiries where email like '%@tangy.test';
delete from diary_posts where slug like 'e2e-%';
delete from gallery_albums where slug like 'e2e-%';
delete from tv_videos where slug like 'e2e-%';
update tv_videos set title = 'Field Recording — Vol. 22402' where slug = 'field-recording-22402';
