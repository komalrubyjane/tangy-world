-- LOCAL TEST DATA ONLY. Puts the E2E fixtures back to their starting state.
-- Only the two applications the super admin suite reviews go back to pending;
-- the platform suite's partner accounts stay approved.
update collaborations set status='pending', reviewed_by=null, reviewed_at=null, review_notes=null, decision_reason=null where email = 'vendor@tangy.test';
update crew_applications set status='pending', reviewed_by=null, reviewed_at=null, review_notes=null, decision_reason=null where email = 'crew@tangy.test';
update profiles set role='user' where email in ('vendor@tangy.test','crew@tangy.test');
delete from vendor_profiles where id in (select id from profiles where email = 'vendor@tangy.test');
delete from application_notifications;
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
