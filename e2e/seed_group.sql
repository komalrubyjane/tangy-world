-- LOCAL TEST DATA ONLY: named-attendee group bookings for e2e/groupcheckin.mjs
-- (created by the suite itself; reset.sql removes them so other suites never
-- see them). Real bookings through the real functions: names captured on the
-- pending booking -> payment confirmed -> one named ticket per attendee.
delete from bookings where registration_code like 'TS-GRP%';
do $$
declare
  v5 uuid := (select id from events where slug = 'vol-5-local');
  v6 uuid := (select id from events where slug = 'vol-6-local');
  r record;
  b bookings;
begin
  for r in select * from (values
      ('TS-GRP5',     'v5', array['Rahul Sharma', 'Priya Mehta', 'Arjun Nair', 'Kavya Singh', 'Neha Verma']),   -- 3 now, 2 later
      ('TS-GRP1',     'v5', array['Priya Nair']),                                                               -- one-person booking
      ('TS-GRPMIX',   'v5', array['Meera Iyer', 'Dev Iyer', 'Asha Iyer', 'Ravi Iyer', 'Tara Iyer']),           -- manual, then QR
      ('TS-GRPRACE',  'v5', array['Isha Reddy', 'Kavi Reddy', 'Lata Reddy', 'Mohan Reddy', 'Nila Reddy']),     -- same person, two gates
      ('TS-GRP10',    'v5', array['A. One', 'B. Two', 'C. Three', 'D. Four', 'E. Five', 'F. Six', 'G. Seven', 'H. Eight', 'I. Nine', 'J. Ten']),
      ('TS-GRP2',     'v5', array['Sam Iyer', 'Sam Iyer']),                                                     -- duplicate names, both arrive
      ('TS-GRPOTHER', 'v5', array['Omar Ali', 'Zoya Ali']),                                                     -- someone else's attendees
      ('TS-GRPCXL',   'v5', array['Cyrus Bhatt', 'Dia Bhatt', 'Ela Bhatt']),                                    -- cancelled before the event
      ('TS-GRPV6',    'v6', array['Zoya Khan', 'Kiran Khan', 'Nia Khan'])                                       -- Vol. 6 pass shown at Vol. 5
    ) v(code, ev, names) loop
    b := create_pending_booking(null, case when r.ev = 'v5' then v5 else v6 end, r.code, r.names[1],
           lower(replace(split_part(r.names[1], ' ', 1), '.', '')) || '@example.test', null, cardinality(r.names), 500 * cardinality(r.names), 'gen',
           'order_' || lower(r.code), r.names);
    perform confirm_booking_and_issue_tickets(b.id);
    update bookings set razorpay_payment_id = 'pay_' || lower(r.code), razorpay_signature_verified = true, ticket_email_status = 'sent' where id = b.id;
  end loop;
end $$;
