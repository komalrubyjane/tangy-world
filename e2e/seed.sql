-- LOCAL TEST DATA ONLY (scratch Supabase stack) — never run against production.
update profiles set role='super_admin' where email='root@tangy.test';
update profiles set role='admin' where email='manager@tangy.test';
update profiles set role='staff' where email in ('staff@tangy.test','staff2@tangy.test');

insert into events (slug, name, description, event_date, event_time, end_time, venue, capacity, price, status)
values ('vol-5-local', 'Tangy Sessions Vol. 5', 'Local test night for the admin system.', current_date, '7:00 PM', '10:30 PM', 'Bansilalpet Stepwell', 120, 899, 'on-sale'),
       ('vol-6-local', 'Tangy Sessions Vol. 6', 'Next month.', current_date + 21, '7:30 PM', null, 'Taramati Baradari', 200, 999, 'on-sale');
update events e set venue_id = v.id from venues v where v.name = e.venue and e.venue_id is null;

insert into event_assignments (event_id, assignee_role, assignee_id, title, assigned_by)
select e.id, 'staff', p.id, 'Front gate check-in', (select id from profiles where email='manager@tangy.test')
from events e, profiles p where e.slug='vol-5-local' and p.email='staff@tangy.test';
insert into event_tasks (assignment_id, title, priority, due_at)
select id, 'Collect radio + scanner phone from production desk', 'high', now() + interval '2 hours' from event_assignments where title='Front gate check-in';
insert into event_tasks (assignment_id, title, due_at)
select id, 'Brief volunteers on queue layout', now() + interval '3 hours' from event_assignments where title='Front gate check-in';

do $$
declare e1 uuid := (select id from events where slug='vol-5-local');
        e2 uuid := (select id from events where slug='vol-6-local');
        pat uuid := (select id from profiles where email='patron@tangy.test');
        b bookings;
begin
  b := create_pending_booking(pat, e1, 'TS-LOCAL001', 'Pat Patron', 'patron@tangy.test', '9000000001', 2, 2122, 'gen', 'order_local_1');
  perform confirm_booking_and_issue_tickets(b.id);
  update bookings set razorpay_payment_id='pay_local_1', razorpay_signature_verified=true, ticket_email_status='sent' where id=b.id;
  b := create_pending_booking(null, e1, 'TS-LOCAL002', 'Anika Rao', 'anika@example.test', '9000000002', 1, 1651, 'vip', 'order_local_2');
  perform confirm_booking_and_issue_tickets(b.id);
  update bookings set razorpay_payment_id='pay_local_2', razorpay_signature_verified=true, ticket_email_status='failed', ticket_email_error='Email service not configured' where id=b.id;
  b := create_pending_booking(null, e1, 'TS-LOCAL003', 'Dev Menon', 'dev@example.test', null, 3, 3183, 'gen', 'order_local_3');
  perform confirm_booking_and_issue_tickets(b.id);
  update bookings set razorpay_payment_id='pay_local_3', razorpay_signature_verified=true, ticket_email_status='sent' where id=b.id;
  b := create_pending_booking(null, e1, 'TS-LOCAL004', 'Unpaid Checkout', 'unpaid@example.test', null, 1, 1061, 'gen', 'order_local_4');
  update bookings set created_at = now() - interval '2 hours' where id=b.id;
  b := create_pending_booking(null, e2, 'TS-LOCAL005', 'Zara Khan', 'zara@example.test', null, 2, 2357, 'gen', 'order_local_5');
  perform confirm_booking_and_issue_tickets(b.id);
  update bookings set razorpay_payment_id='pay_local_5', razorpay_signature_verified=true, ticket_email_status='sent' where id=b.id;
end $$;

insert into collaborations (type, business_name, contact_name, email, phone, details, user_id)
select 'vendor', 'Irani Chai Cart', 'Vik', 'vendor@tangy.test', '9000000010', 'Chai + osmania biscuits, 2 counters', id from profiles where email='vendor@tangy.test';
insert into crew_applications (name, email, phone, role_interest, event_interest, message, category, user_id)
select 'Cam Crew', 'crew@tangy.test', '9000000011', 'Sound engineering', 'Vol. 5', 'Five years of live FOH mixing.', 'crew', id from profiles where email='crew@tangy.test';
insert into artists (name, email, genre, city, bio, status, user_id)
select 'Meera Qawwali Collective', 'crew@tangy.test', 'Qawwali', 'Hyderabad', 'Six-piece qawwali ensemble.', 'pending', id from profiles where email='crew@tangy.test';

insert into announcements (title, body, audience, event_id, status, priority)
select 'Gates open 6:15 PM', 'Doors are 15 minutes early tonight — be at the gate by 6:00 for the briefing.', 'staff', id, 'published', 'high' from events where slug='vol-5-local';
