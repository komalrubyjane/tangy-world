-- ============================================================================
-- TANGY WORLD — LOCAL DEMO DATASET (NOT PRODUCTION DATA)
--
-- Loaded by scripts/demo-data.sh seed on a LOCAL stack only. Everything here
-- is fictional and identifiable:
--   * every id starts with de300000-0000-4000-8000-  (see pg_temp.d below)
--   * every account email ends with @demo.tangy.local
--   * social links point at example.com
-- scripts/demo-data.sh remove deletes exactly these records.
-- The accounts themselves are created first by the script through the auth
-- admin API (same ids), so they can sign in locally with the email OTP code
-- that lands in the local Mailpit inbox.
-- Dates are relative to today so the dataset stays meaningful.
-- Images are generated demo artwork (public/media/demo) or empty-venue photos —
-- never real performers' photos or posters, which must not front fictional people.
-- ============================================================================

\set ON_ERROR_STOP 1
\o /dev/null
begin;

create function pg_temp.d(n bigint) returns uuid language sql immutable
as $$ select ('de300000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid $$;
-- IST wall-clock time on a day offset from today.
create function pg_temp.at(days int, hhmm text) returns timestamptz language sql stable
as $$ select ((current_date + days)::text || ' ' || hhmm)::timestamp at time zone 'Asia/Kolkata' $$;

-- ---------------------------------------------------------------- roles
update profiles set role = 'admin'       where id = pg_temp.d(101);
update profiles set role = 'staff'       where id = pg_temp.d(102);
update profiles set role = 'super_admin' where id = pg_temp.d(103);
update profiles set role = 'artist'      where id in (pg_temp.d(110), pg_temp.d(111), pg_temp.d(112), pg_temp.d(113));
update profiles set role = 'sponsor'     where id between pg_temp.d(120) and pg_temp.d(123);
update profiles set role = 'vendor'      where id between pg_temp.d(130) and pg_temp.d(133);
update profiles set role = 'venue'       where id between pg_temp.d(140) and pg_temp.d(142);
update profiles set role = 'volunteer'   where id between pg_temp.d(150) and pg_temp.d(154);
update profiles set role = 'crew'        where id between pg_temp.d(160) and pg_temp.d(161);
update profiles set phone = '+91 98480 ' || lpad((right(id::text, 3)::int)::text, 5, '0') where id::text like 'de300000-%';

-- ---------------------------------------------------------------- venues
insert into venues (id, name, address, city, capacity, contact_name, contact_email, contact_phone, notes, partner_profile_id, is_active, access_info, parking, loading_bay) values
  (pg_temp.d(201), 'Chowmahalla Courtyard (demo)', 'Motigalli, Khilwat', 'Hyderabad', 220, 'Farah Siddiqui', 'farah@demo.tangy.local', '+91 98480 00140', 'Stone courtyard; acoustic sets only after 9 PM.', pg_temp.d(140), true, 'Gate 2, east wall', 'Paid parking at Khilwat grounds', 'Lane behind the clock tower'),
  (pg_temp.d(202), 'Shamirpet Banyan Grove (demo)', 'Shamirpet Lake Road', 'Hyderabad', 150, 'Rahul Menon', 'rahul.menon@demo.tangy.local', '+91 98480 00141', 'Open-air under a 200-year-old banyan; rain plan: barn.', pg_temp.d(141), true, 'Main farm gate', 'Field parking, 80 cars', 'Farm track to the barn'),
  (pg_temp.d(203), 'Paigah Haveli Terrace (demo)', 'Pisal Banda', 'Hyderabad', 90, 'Nandini Rao', 'nandini@demo.tangy.local', '+91 98480 00142', 'Rooftop terrace; stairs only.', pg_temp.d(142), true, 'Side entrance', 'Street parking', 'None — hand carry'),
  (pg_temp.d(204), 'Stepwell Pavilion (demo)', 'Bansilalpet', 'Hyderabad', 60, 'Tangy production desk', 'ops@demo.tangy.local', '+91 98480 00101', 'Restored stepwell; capacity limited by the steps.', null, true, 'North ramp', 'Metro + short walk', 'North ramp, small vans only');

-- ---------------------------------------------------------------- partner profiles
insert into sponsor_profiles (id, organization_name, sponsorship_tier, website, contact_designation) values
  (pg_temp.d(120), 'Saffron Tea Co. (demo)', 'Title', 'https://example.com/demo/saffron-tea', 'Brand manager'),
  (pg_temp.d(121), 'Deccan Loom Studio (demo)', 'Presenting', 'https://example.com/demo/deccan-loom', 'Founder'),
  (pg_temp.d(122), 'Charminar Audio Labs (demo)', 'Associate', 'https://example.com/demo/charminar-audio', 'Partnerships lead'),
  (pg_temp.d(123), 'Irani Bakehouse (demo)', 'Community', 'https://example.com/demo/irani-bakehouse', 'Owner');
insert into vendor_profiles (id, business_name, category, gstin, phone, description) values
  (pg_temp.d(130), 'Kulhad Chai Cart (demo)', 'Food & beverage', null, '+91 98480 00130', 'Clay-cup chai and bun maska.'),
  (pg_temp.d(131), 'Lantern & Loom Decor (demo)', 'Decor', '36AAAAA0000A1Z5', '+91 98480 00131', 'Lanterns, drapes and floor seating.'),
  (pg_temp.d(132), 'Echo Sound Rentals (demo)', 'Sound & light', '36BBBBB0000B1Z5', '+91 98480 00132', 'Acoustic PA, ribbon mics, stage lights.'),
  (pg_temp.d(133), 'Biryani Box Kitchen (demo)', 'Food & beverage', null, '+91 98480 00133', 'Dum biryani and mirchi ka salan.');
insert into venue_profiles (id, property_name, location, capacity, description) values
  (pg_temp.d(140), 'Chowmahalla Courtyard (demo)', 'Khilwat, Hyderabad', 220, 'Heritage courtyard host.'),
  (pg_temp.d(141), 'Shamirpet Banyan Grove (demo)', 'Shamirpet', 150, 'Farm and grove host.'),
  (pg_temp.d(142), 'Paigah Haveli Terrace (demo)', 'Pisal Banda', 90, 'Rooftop terrace host.');
insert into volunteer_profiles (id, availability, skills, emergency_contact) values
  (pg_temp.d(150), 'Weekends', 'Gate check-in, crowd flow', '+91 98480 90150'),
  (pg_temp.d(151), 'Evenings', 'Hospitality, first aid (certified)', '+91 98480 90151'),
  (pg_temp.d(152), 'Weekends', 'Photography', '+91 98480 90152'),
  (pg_temp.d(153), 'Flexible', 'Registration desk, Telugu/Urdu/English', '+91 98480 90153'),
  (pg_temp.d(154), 'Evenings', 'Stage runner', '+91 98480 90154');
insert into crew_profiles (id, department, shift_preference, certifications) values
  (pg_temp.d(160), 'Sound', 'Evening', 'Live sound mixing'),
  (pg_temp.d(161), 'Lighting', 'Night', 'Rigging safety');

-- Approved applications (portals open only after approval, as in production).
insert into collaborations (type, business_name, contact_name, email, user_id, status, details, reviewed_by, reviewed_at)
select c.type::collaboration_type, c.biz, p.full_name, p.email, p.id, 'approved', 'Demo application', pg_temp.d(101), now() - interval '30 days'
from (values (120, 'sponsor', 'Saffron Tea Co. (demo)'), (121, 'sponsor', 'Deccan Loom Studio (demo)'), (122, 'sponsor', 'Charminar Audio Labs (demo)'),
             (123, 'sponsor', 'Irani Bakehouse (demo)'), (130, 'vendor', 'Kulhad Chai Cart (demo)'), (131, 'vendor', 'Lantern & Loom Decor (demo)'),
             (132, 'vendor', 'Echo Sound Rentals (demo)'), (133, 'vendor', 'Biryani Box Kitchen (demo)'),
             (140, 'venue_host', 'Chowmahalla Courtyard (demo)'), (141, 'venue_host', 'Shamirpet Banyan Grove (demo)'), (142, 'venue_host', 'Paigah Haveli Terrace (demo)')) c(n, type, biz)
join profiles p on p.id = pg_temp.d(c.n);
-- One pending sponsor application from a patron (shows in Applications).
insert into collaborations (type, business_name, contact_name, email, user_id, status, details)
select 'sponsor', 'Hyderabad Craft Brewers (demo)', full_name, email, id, 'pending', 'Would like to sponsor the monsoon series.' from profiles where id = pg_temp.d(175);
insert into crew_applications (name, email, role_interest, category, user_id, status, reviewed_by, reviewed_at)
select p.full_name, p.email, c.role_interest, c.category, p.id, 'approved', pg_temp.d(101), now() - interval '20 days'
from (values (150, 'Gate', 'volunteer'), (151, 'Hospitality', 'volunteer'), (152, 'Photography', 'volunteer'), (153, 'Registration', 'volunteer'),
             (154, 'Runner', 'volunteer'), (160, 'Sound', 'crew'), (161, 'Lighting', 'crew')) c(n, role_interest, category)
join profiles p on p.id = pg_temp.d(c.n);
insert into crew_applications (name, email, role_interest, category, user_id, status)
select full_name, email, 'Social media', 'volunteer', id, 'pending' from profiles where id = pg_temp.d(176);

-- ---------------------------------------------------------------- artists
insert into artists (id, user_id, name, stage_name, slug, email, genre, subgenre, city, bio, instagram, soundcloud, spotify, youtube, performance_type, experience_level, avatar_url, status, applied_at, reviewed_at, reviewed_by) values
  (pg_temp.d(401), pg_temp.d(110), 'Ananya Rao', null, 'ananya-rao', 'ananya.rao@demo.tangy.local', 'Carnatic', 'Violin', 'Hyderabad', 'A Carnatic violinist who plays long, unhurried alapanas in stone spaces. Trained under a Chennai guru-shishya lineage; now writing for violin and field recordings.', 'https://example.com/demo/ananya-rao', null, null, null, 'Solo', 'Professional', '/media/demo/portrait-ananya-rao.svg', 'approved', now() - interval '200 days', now() - interval '190 days', pg_temp.d(101)),
  (pg_temp.d(402), pg_temp.d(111), 'Kabir Sethi', null, 'kabir-sethi', 'kabir.sethi@demo.tangy.local', 'Percussion', 'Tabla', 'Hyderabad', 'Tabla player of the Farukhabad gharana who loves a call-and-response with the crowd. Leads the Rhythm at the Stepwell circles.', 'https://example.com/demo/kabir-sethi', null, null, null, 'Solo', 'Professional', '/media/demo/portrait-kabir-sethi.svg', 'approved', now() - interval '180 days', now() - interval '170 days', pg_temp.d(101)),
  (pg_temp.d(403), pg_temp.d(112), 'Deccan Folk Collective', 'The Charminar Collective', 'the-charminar-collective', 'charminar.collective@demo.tangy.local', 'Folk', 'Deccani folk', 'Hyderabad', 'A six-piece that digs up Dakhni folk songs — harmonium, dholak, sarangi and three voices.', 'https://example.com/demo/charminar-collective', null, null, null, 'Band', 'Professional', '/media/demo/portrait-the-charminar-collective.svg', 'approved', now() - interval '160 days', now() - interval '150 days', pg_temp.d(101)),
  (pg_temp.d(404), pg_temp.d(113), 'Zoya Qadri', null, 'zoya-qadri', 'zoya.qadri@demo.tangy.local', 'Qawwali', 'Sufi', 'Hyderabad', 'Qawwali vocalist carrying on her grandfather''s repertoire, with a small party of clapping chorus and harmonium.', 'https://example.com/demo/zoya-qadri', null, null, null, 'Ensemble', 'Professional', '/media/demo/portrait-zoya-qadri.svg', 'approved', now() - interval '150 days', now() - interval '140 days', pg_temp.d(101)),
  (pg_temp.d(405), null, 'Vihaan Menon', null, 'vihaan-menon', 'vihaan.menon@demo.tangy.local', 'Indie', 'Acoustic', 'Bengaluru', 'Singer-songwriter with a nylon-string guitar and songs about trains, rain and leaving home.', 'https://example.com/demo/vihaan-menon', null, null, null, 'Solo', 'Emerging', '/media/demo/portrait-vihaan-menon.svg', 'approved', now() - interval '140 days', now() - interval '130 days', pg_temp.d(101)),
  (pg_temp.d(406), null, 'Ira Deshpande', null, 'ira-deshpande', 'ira.deshpande@demo.tangy.local', 'Hindustani', 'Khayal', 'Pune', 'Khayal singer who pairs evening ragas with the light going down over the city.', 'https://example.com/demo/ira-deshpande', null, null, null, 'Solo', 'Professional', '/media/demo/portrait-ira-deshpande.svg', 'approved', now() - interval '120 days', now() - interval '110 days', pg_temp.d(101)),
  (pg_temp.d(407), null, 'Moss & Monsoon', null, 'moss-and-monsoon', 'moss.monsoon@demo.tangy.local', 'Ambient', 'Field recordings', 'Hyderabad', 'An ambient duo building slow pieces from rain, tanpura drones and tape loops.', 'https://example.com/demo/moss-and-monsoon', null, null, null, 'Duo', 'Emerging', '/media/demo/portrait-moss-and-monsoon.svg', 'approved', now() - interval '100 days', now() - interval '90 days', pg_temp.d(101)),
  (pg_temp.d(408), null, 'Arjun Pillai', null, 'arjun-pillai', 'arjun.pillai@demo.tangy.local', 'Dhrupad', 'Vocal', 'Hyderabad', 'Dhrupad vocalist; dawn concerts only, if he can help it.', 'https://example.com/demo/arjun-pillai', null, null, null, 'Solo', 'Professional', '/media/demo/portrait-arjun-pillai.svg', 'approved', now() - interval '90 days', now() - interval '80 days', pg_temp.d(101)),
  (pg_temp.d(409), null, 'Noor Ensemble', null, 'noor-ensemble', 'noor.ensemble@demo.tangy.local', 'Fusion', 'Oud & sitar', 'Hyderabad', 'Oud, sitar and a frame drum trading melodies across the Deccan and the Gulf.', 'https://example.com/demo/noor-ensemble', null, null, null, 'Band', 'Professional', '/media/demo/portrait-noor-ensemble.svg', 'approved', now() - interval '80 days', now() - interval '70 days', pg_temp.d(101)),
  (pg_temp.d(410), null, 'Tara Iyer', null, 'tara-iyer', 'tara.iyer@demo.tangy.local', 'Dance', 'Kathak', 'Hyderabad', 'Kathak dancer and teacher who runs movement labs for complete beginners.', 'https://example.com/demo/tara-iyer', null, null, null, 'Solo', 'Professional', '/media/demo/portrait-tara-iyer.svg', 'approved', now() - interval '70 days', now() - interval '60 days', pg_temp.d(101)),
  (pg_temp.d(411), null, 'Lakshmi Varadan', null, 'lakshmi-varadan', 'lakshmi.varadan@demo.tangy.local', 'Veena', 'Carnatic', 'Chennai', 'Veena player applying for the winter series.', null, null, null, null, 'Solo', 'Professional', null, 'pending', now() - interval '3 days', null, null),
  (pg_temp.d(412), null, 'Rohit Bhat', null, 'rohit-bhat', 'rohit.bhat@demo.tangy.local', 'EDM', 'Techno', 'Mumbai', 'Techno producer (not a fit for acoustic heritage venues).', null, null, null, null, 'DJ', 'Emerging', null, 'rejected', now() - interval '40 days', now() - interval '35 days', pg_temp.d(101));

-- ---------------------------------------------------------------- sessions
insert into events (id, slug, name, description, story, event_date, event_time, end_time, venue, venue_id, venue_partner_id, image_url, capacity, price, status, featured, tags, created_by, booking_min_quantity, booking_max_quantity, booking_questions) values
  (pg_temp.d(301), 'heritage-after-dark', 'Heritage After Dark', 'Carnatic violin and Deccani folk under the Chowmahalla arches, lit only by lanterns. Doors open at 6:30 PM; floor seating with a few chairs on request.', 'The courtyard goes quiet at nine — then the violin starts.', current_date + 10, '7:00 PM', '10:00 PM', 'Chowmahalla Courtyard (demo)', pg_temp.d(201), pg_temp.d(140), '/media/demo/cover-01.svg', 180, 1200, 'on-sale', true, array['Heritage', 'Carnatic', 'Folk'], pg_temp.d(101), 1, 8,
   '[{"id":"seating","type":"single_select","label":"Seating preference","required":false,"options":["Floor cushion","Chair"]},{"id":"chairs","type":"number","label":"People who need a chair","required":false,"min":0,"max":8}]'),
  (pg_temp.d(302), 'rhythm-at-the-stepwell', 'Rhythm at the Stepwell', 'A tabla circle on the steps of the Bansilalpet stepwell. Kabir leads; you clap along. Almost sold out.', null, current_date + 5, '6:30 PM', '8:30 PM', 'Stepwell Pavilion (demo)', pg_temp.d(204), null, '/media/gallery/tangy5.jpg', 60, 900, 'on-sale', true, array['Percussion', 'Stepwell'], pg_temp.d(101), 1, 6, '[]'),
  (pg_temp.d(303), 'monsoon-sessions', 'Monsoon Sessions', 'Qawwali by candlelight while the rain comes down on the banyan. Sold out — join the waitlist.', 'Bring a shawl; the grove gets cold after the rain.', current_date + 18, '7:30 PM', '11:00 PM', 'Shamirpet Banyan Grove (demo)', pg_temp.d(202), pg_temp.d(141), '/media/demo/cover-03.svg', 40, 1500, 'sold-out', false, array['Qawwali', 'Monsoon'], pg_temp.d(101), 1, 4, '[]'),
  (pg_temp.d(304), 'sunset-baithak', 'Sunset Baithak', 'An evening khayal baithak on the Paigah terrace as the sun goes down.', null, current_date - 20, '5:30 PM', '8:00 PM', 'Paigah Haveli Terrace (demo)', pg_temp.d(203), pg_temp.d(142), '/media/gallery/tangy4.jpg', 90, 1000, 'past', false, array['Hindustani', 'Baithak'], pg_temp.d(101), 1, 6, '[]'),
  (pg_temp.d(305), 'indie-under-the-banyan', 'Indie Under the Banyan', 'Draft: an acoustic indie afternoon at the grove. Lineup and pricing still being finalised.', null, current_date + 40, '4:00 PM', '7:00 PM', 'Shamirpet Banyan Grove (demo)', pg_temp.d(202), pg_temp.d(141), '/media/demo/cover-06.svg', 120, 700, 'draft', false, array['Indie', 'Acoustic'], pg_temp.d(101), 1, 6, '[]'),
  (pg_temp.d(306), 'qawwali-by-candlelight', 'Qawwali by Candlelight', 'Cancelled because of a venue restoration; ticket holders were contacted.', null, current_date + 7, '8:00 PM', '11:00 PM', 'Chowmahalla Courtyard (demo)', pg_temp.d(201), pg_temp.d(140), '/media/demo/cover-08.svg', 150, 1300, 'cancelled', false, array['Qawwali'], pg_temp.d(101), 1, 6, '[]'),
  (pg_temp.d(307), 'dhrupad-at-dawn', 'Dhrupad at Dawn', 'A 5:30 AM dhrupad concert as the city wakes up. Chai at the gate.', null, current_date + 75, '5:30 AM', '7:30 AM', 'Stepwell Pavilion (demo)', pg_temp.d(204), null, '/media/demo/cover-09.svg', 60, 1100, 'on-sale', false, array['Dhrupad', 'Dawn'], pg_temp.d(101), 1, 4, '[]'),
  (pg_temp.d(308), 'field-recording-workshop', 'Field Recording Workshop', 'A three-hour workshop with Moss & Monsoon: recording rain, stone and crowds with a phone and a cheap mic. Bring headphones.', null, current_date + 14, '10:00 AM', '1:00 PM', 'Paigah Haveli Terrace (demo)', pg_temp.d(203), pg_temp.d(142), '/media/demo/cover-02.svg', 20, 1500, 'on-sale', false, array['Workshop', 'Field recording'], pg_temp.d(101), 1, 2,
   '[{"id":"level","type":"single_select","label":"Your recording experience","required":true,"options":["None","Some","Lots"]},{"id":"device","type":"text","label":"What will you record on?","required":false}]'),
  (pg_temp.d(309), 'kathak-movement-lab', 'Kathak Movement Lab', 'A beginners'' kathak lab with Tara Iyer — footwork, spins and a short piece by the end. Wear something you can move in.', null, current_date + 25, '11:00 AM', '1:00 PM', 'Chowmahalla Courtyard (demo)', pg_temp.d(201), pg_temp.d(140), '/media/demo/cover-10.svg', 30, 800, 'on-sale', false, array['Workshop', 'Dance', 'Kathak'], pg_temp.d(101), 1, 3, '[]'),
  (pg_temp.d(310), 'courtyard-live-friday', 'Courtyard Live: Friday Edition', 'Tonight: Noor Ensemble and Vihaan Menon in the courtyard. Check-in is open at the gate.', null, current_date, '7:00 PM', '10:00 PM', 'Chowmahalla Courtyard (demo)', pg_temp.d(201), pg_temp.d(140), '/media/demo/cover-02.svg', 120, 1000, 'on-sale', true, array['Fusion', 'Indie'], pg_temp.d(101), 1, 8, '[]');
update events set doors_at = (event_date::text || ' 18:30')::timestamp at time zone 'Asia/Kolkata' where id = pg_temp.d(310);

-- Ticket types beyond the General Admission each event gets automatically.
update event_ticket_types set name = 'Floor seating', description = 'Cushions on the courtyard floor.' where event_id = pg_temp.d(301) and code = 'gen';
insert into event_ticket_types (event_id, code, name, description, price, capacity, sort_order) values
  (pg_temp.d(301), 'chair', 'Chair seating', 'Numbered chairs along the arches.', 1500, 40, 2),
  (pg_temp.d(301), 'patron', 'Patron pass', 'Chair seating, a signed poster and a drink with the artists.', 2500, 12, 3),
  (pg_temp.d(302), 'student', 'Student', 'Show a valid student ID at the gate.', 600, 15, 2),
  (pg_temp.d(307), 'early', 'Early bird', 'First 20 tickets.', 900, 20, 0),
  (pg_temp.d(308), 'kit', 'Workshop + mic kit', 'Includes a clip-on lavalier mic to keep.', 2400, 8, 2);
update event_ticket_types set price = 1100, name = 'Standard' where event_id = pg_temp.d(307) and code = 'gen';

insert into event_artists (event_id, artist_id) values
  (pg_temp.d(301), pg_temp.d(401)), (pg_temp.d(301), pg_temp.d(403)),
  (pg_temp.d(302), pg_temp.d(402)),
  (pg_temp.d(303), pg_temp.d(404)),
  (pg_temp.d(304), pg_temp.d(406)),
  (pg_temp.d(305), pg_temp.d(405)),
  (pg_temp.d(306), pg_temp.d(404)),
  (pg_temp.d(307), pg_temp.d(408)),
  (pg_temp.d(308), pg_temp.d(407)),
  (pg_temp.d(309), pg_temp.d(410)),
  (pg_temp.d(310), pg_temp.d(409)), (pg_temp.d(310), pg_temp.d(405));
insert into event_artist_details (event_id, artist_id, call_time, soundcheck_at, performance_start, performance_end, instructions, fee_amount, fee_status, green_room, meals) values
  (pg_temp.d(301), pg_temp.d(401), pg_temp.at(10, '16:30'), pg_temp.at(10, '17:00'), pg_temp.at(10, '19:15'), pg_temp.at(10, '20:15'), 'Acoustic set; one ribbon mic for the violin.', 25000, 'pending', 'East pavilion room', 'Dinner after set'),
  (pg_temp.d(310), pg_temp.d(409), pg_temp.at(0, '16:00'), pg_temp.at(0, '17:00'), pg_temp.at(0, '19:30'), pg_temp.at(0, '20:30'), 'Oud needs a chair without arms.', 30000, 'invoiced', 'Clock tower room', 'Dinner before set');

-- ---------------------------------------------------------------- team & partners on events
insert into event_assignments (id, event_id, assignee_role, assignee_id, title, status, assigned_by, call_time, starts_at, ends_at, instructions, team, fee_amount, fee_status, package, setup_at, breakdown_at, loading_access, onsite_contact) values
  (pg_temp.d(1301), pg_temp.d(310), 'staff', pg_temp.d(102), 'Gate lead', 'confirmed', pg_temp.d(101), pg_temp.at(0, '17:30'), pg_temp.at(0, '18:00'), pg_temp.at(0, '22:30'), 'Run the QR check-in at Gate 2.', 'gate', null, 'not_applicable', null, null, null, null, null),
  (pg_temp.d(1302), pg_temp.d(310), 'volunteer', pg_temp.d(150), 'Gate check-in', 'confirmed', pg_temp.d(101), pg_temp.at(0, '17:45'), pg_temp.at(0, '18:00'), pg_temp.at(0, '21:00'), 'Scan booking QRs and tick who has arrived.', 'gate', null, 'not_applicable', null, null, null, null, null),
  (pg_temp.d(1303), pg_temp.d(310), 'volunteer', pg_temp.d(151), 'Hospitality', 'assigned', pg_temp.d(101), pg_temp.at(0, '18:00'), pg_temp.at(0, '18:15'), pg_temp.at(0, '22:00'), 'Green room and water station.', 'hospitality', null, 'not_applicable', null, null, null, null, null),
  (pg_temp.d(1304), pg_temp.d(310), 'vendor', pg_temp.d(130), 'Chai stall', 'confirmed', pg_temp.d(101), null, null, null, 'Stall by the east arch; no open flame near drapes.', null, 6000, 'invoiced', null, pg_temp.at(0, '15:00'), pg_temp.at(0, '23:00'), 'Lane behind the clock tower, 3–5 PM', 'Farah · +91 98480 00140'),
  (pg_temp.d(1305), pg_temp.d(310), 'vendor', pg_temp.d(132), 'Sound & light', 'confirmed', pg_temp.d(101), null, null, null, 'Acoustic PA, two ribbon mics, warm wash only.', null, 18000, 'pending', null, pg_temp.at(0, '13:00'), pg_temp.at(0, '23:30'), 'Lane behind the clock tower from 1 PM', 'Farah · +91 98480 00140'),
  (pg_temp.d(1306), pg_temp.d(301), 'sponsor', pg_temp.d(120), 'Title sponsor', 'confirmed', pg_temp.d(101), null, null, null, 'Logo on the stage banner and tickets.', null, null, 'not_applicable', 'Title — banner, tickets, social', null, null, null, null),
  (pg_temp.d(1307), pg_temp.d(301), 'vendor', pg_temp.d(131), 'Lanterns & seating', 'assigned', pg_temp.d(101), null, null, null, '120 lanterns, 150 cushions, 40 chairs.', null, 22000, 'pending', null, pg_temp.at(10, '12:00'), pg_temp.at(10, '23:30'), 'Gate 2 from noon', 'Farah · +91 98480 00140'),
  (pg_temp.d(1308), pg_temp.d(301), 'volunteer', pg_temp.d(153), 'Registration desk', 'assigned', pg_temp.d(101), pg_temp.at(10, '17:30'), pg_temp.at(10, '18:00'), pg_temp.at(10, '21:30'), null, 'registration', null, 'not_applicable', null, null, null, null, null),
  (pg_temp.d(1309), pg_temp.d(310), 'crew', pg_temp.d(160), 'Front of house sound', 'confirmed', pg_temp.d(101), pg_temp.at(0, '15:00'), pg_temp.at(0, '15:30'), pg_temp.at(0, '23:00'), null, 'production', 8000, 'pending', null, null, null, null, null),
  (pg_temp.d(1310), pg_temp.d(303), 'sponsor', pg_temp.d(121), 'Presenting partner', 'confirmed', pg_temp.d(101), null, null, null, null, null, null, 'not_applicable', 'Presenting — stage mention, shawls for the audience', null, null, null, null);
insert into sponsor_deliverables (id, sponsor_profile_id, event_id, title, description, status, due_date, kind) values
  (pg_temp.d(1601), pg_temp.d(120), pg_temp.d(301), 'Stage banner logo', 'Vector logo for the 3 m banner.', 'pending', current_date + 4, 'logo_placement'),
  (pg_temp.d(1602), pg_temp.d(120), pg_temp.d(301), 'Instagram collab post', 'Joint post the week of the show.', 'pending', current_date + 8, 'social_mention'),
  (pg_temp.d(1603), pg_temp.d(121), pg_temp.d(303), 'Shawl sampling', '40 shawls at the gate.', 'delivered', current_date - 2, 'sampling');
insert into partner_invoices (id, event_id, partner_id, direction, invoice_number, amount, issued_date, due_date, status, paid_date, notes, created_by) values
  (pg_temp.d(1501), pg_temp.d(310), pg_temp.d(130), 'payable', 'DEMO-KCC-014', 6000, current_date - 3, current_date + 12, 'issued', null, 'Chai stall — Friday edition', pg_temp.d(101)),
  (pg_temp.d(1502), pg_temp.d(304), pg_temp.d(132), 'payable', 'DEMO-ESR-009', 16000, current_date - 25, current_date - 10, 'paid', current_date - 12, 'Sound — Sunset Baithak', pg_temp.d(101)),
  (pg_temp.d(1503), pg_temp.d(301), pg_temp.d(120), 'receivable', 'DEMO-TS-SP-003', 150000, current_date - 5, current_date + 20, 'issued', null, 'Title sponsorship — Heritage After Dark', pg_temp.d(101));
insert into event_requirements (id, event_id, user_id, title, details, due_at, status, priority, created_by) values
  (pg_temp.d(1801), pg_temp.d(301), pg_temp.d(110), 'Technical rider', 'Mic preferences and monitor needs for the violin set.', now() + interval '3 days', 'requested', 'high', pg_temp.d(101)),
  (pg_temp.d(1802), pg_temp.d(310), pg_temp.d(132), 'Power plan', 'Confirm load in kW and cable runs.', now() - interval '1 day', 'submitted', 'normal', pg_temp.d(101));

-- Volunteer check-in access: one live, one expired, one revoked.
insert into temporary_access (id, user_id, event_id, granted_by, granted_at, expires_at) values
  (pg_temp.d(1401), pg_temp.d(150), pg_temp.d(310), pg_temp.d(101), now() - interval '1 hour', now() + interval '6 hours'),
  (pg_temp.d(1402), pg_temp.d(152), pg_temp.d(304), pg_temp.d(101), now() - interval '20 days', now() - interval '20 days' + interval '8 hours');
insert into temporary_access (id, user_id, event_id, granted_by, granted_at, expires_at, revoked_at, revoked_by, revoke_reason) values
  (pg_temp.d(1403), pg_temp.d(154), pg_temp.d(310), pg_temp.d(101), now() - interval '2 hours', now() + interval '5 hours', now() - interval '1 hour', pg_temp.d(101), 'Moved to the stage team');

insert into event_tasks (id, event_id, assignment_id, title, description, priority, due_at, status, team, created_by) values
  (pg_temp.d(1201), pg_temp.d(310), pg_temp.d(1302), 'Test the gate scanner', 'Scan the demo QR before doors.', 'high', pg_temp.at(0, '18:00'), 'pending', 'gate', pg_temp.d(101)),
  (pg_temp.d(1202), pg_temp.d(310), pg_temp.d(1303), 'Stock the green room', 'Water, towels, lemons, honey.', 'normal', pg_temp.at(0, '18:30'), 'in_progress', 'hospitality', pg_temp.d(101)),
  (pg_temp.d(1203), pg_temp.d(301), null, 'Confirm lantern count with decor', null, 'normal', now() + interval '2 days', 'pending', 'production', pg_temp.d(101)),
  (pg_temp.d(1204), pg_temp.d(301), null, 'Print chair numbers', null, 'low', now() - interval '1 day', 'blocked', 'registration', pg_temp.d(101)),
  (pg_temp.d(1205), pg_temp.d(304), null, 'Return rented rugs', null, 'normal', now() - interval '18 days', 'done', 'production', pg_temp.d(101));

-- ---------------------------------------------------------------- bookings & tickets
-- Helper: a confirmed online booking with named attendees and issued tickets.
create function pg_temp.book(p_n int, p_event int, p_user int, p_code text, p_names text[], p_tier text, p_amount int, p_days_ago int)
returns uuid language plpgsql as $$
declare v uuid := pg_temp.d(p_n);
begin
  insert into bookings (id, registration_code, user_id, event_id, attendee_name, attendee_email, attendee_phone, quantity, amount, tier, status,
                        source, razorpay_order_id, razorpay_payment_id, razorpay_signature_verified, payment_status, payment_updated_at, attendee_names, created_at, ticket_email_status, ticket_email_sent_at)
  select v, p_code, p.id, pg_temp.d(p_event), p_names[1], p.email, p.phone, array_length(p_names, 1), p_amount, p_tier, 'pending',
         'online', 'order_DEMO' || p_n, 'pay_DEMO' || p_n, true, 'captured', now() - make_interval(days => p_days_ago), p_names, now() - make_interval(days => p_days_ago), 'sent', now() - make_interval(days => p_days_ago)
  from profiles p where p.id = pg_temp.d(p_user);
  perform confirm_booking_and_issue_tickets(v);
  return v;
end $$;

select pg_temp.book(501, 301, 170, 'TS-DEMO-501', array['Meera Kulkarni'], 'gen', 1416, 6);
select pg_temp.book(502, 301, 171, 'TS-DEMO-502', array['Arvind Shah', 'Leela Shah', 'Karan Shah', 'Diya Shah', 'Nikhil Shah'], 'chair', 8850, 4);
select pg_temp.book(503, 301, 172, 'TS-DEMO-503', array['Sana Ahmed', 'Imran Ahmed', 'Farida Ahmed'], 'gen', 4248, 3);
select pg_temp.book(504, 301, 173, 'TS-DEMO-504', array['Rhea Dsouza', 'Aaron Dsouza'], 'patron', 5900, 2);
-- Rhythm at the Stepwell: 56 of 60 seats taken (almost sold out).
select pg_temp.book(505, 302, 170, 'TS-DEMO-505', array['Meera Kulkarni', 'Ashwin Kulkarni', 'Pooja Kulkarni', 'Tanvi Kulkarni', 'Om Kulkarni', 'Veda Kulkarni'], 'gen', 6372, 9);
select pg_temp.book(500 + g, 302, 170 + (g % 8), 'TS-DEMO-' || (500 + g), array_fill('Guest'::text, array[5]) , 'gen', 5310, 5)
from generate_series(20, 29) g;
-- Monsoon Sessions: 40 of 40 (sold out).
select pg_temp.book(530 + g, 303, 170 + (g % 8), 'TS-DEMO-' || (530 + g), array_fill('Guest'::text, array[4]), 'gen', 7080, 12)
from generate_series(0, 9) g;
-- Sunset Baithak (past): attended, one party partly.
select pg_temp.book(550, 304, 174, 'TS-DEMO-550', array['Vikram Rao', 'Anita Rao', 'Siddharth Rao', 'Maya Rao'], 'gen', 4720, 28);
select pg_temp.book(551, 304, 175, 'TS-DEMO-551', array['Harsh Vardhan', 'Nisha Vardhan'], 'gen', 2360, 26);
-- Courtyard Live tonight: a 5-person party (3 in), a 3-person party (1 in), a 2-person party (none yet).
select pg_temp.book(560, 310, 176, 'TS-DEMO-560', array['Priya Nair', 'Rohan Nair', 'Aditi Nair', 'Kiran Nair', 'Lakshmi Nair'], 'gen', 5900, 7);
select pg_temp.book(561, 310, 177, 'TS-DEMO-561', array['Sameer Khan', 'Ayesha Khan', 'Zaid Khan'], 'gen', 3540, 5);
select pg_temp.book(562, 310, 178, 'TS-DEMO-562', array['Divya Menon', 'Arjun Menon'], 'gen', 2360, 2);
select pg_temp.book(563, 310, 179, 'TS-DEMO-563', array['Ravi Teja'], 'gen', 1180, 1);
-- Workshops.
select pg_temp.book(570, 308, 171, 'TS-DEMO-570', array['Arvind Shah', 'Leela Shah'], 'kit', 5664, 3);
select pg_temp.book(571, 309, 172, 'TS-DEMO-571', array['Sana Ahmed'], 'gen', 944, 1);

-- Other booking states.
insert into bookings (id, registration_code, user_id, event_id, attendee_name, attendee_email, quantity, amount, tier, status, source, payment_status, attendee_names, created_at, razorpay_order_id, razorpay_payment_id, cancelled_at, cancel_reason, expired_at, refunded_amount, refund_reference) values
  (pg_temp.d(580), 'TS-DEMO-580', pg_temp.d(173), pg_temp.d(307), 'Rhea Dsouza', 'rhea.dsouza@demo.tangy.local', 2, 1888, 'early', 'pending', 'online', 'created', array['Rhea Dsouza', 'Aaron Dsouza'], now(), 'order_DEMO580', null, null, null, null, 0, null),
  (pg_temp.d(581), 'TS-DEMO-581', pg_temp.d(174), pg_temp.d(301), 'Vikram Rao', 'vikram.rao@demo.tangy.local', 2, 2832, 'gen', 'cancelled', 'online', 'refunded', array['Vikram Rao', 'Anita Rao'], now() - interval '8 days', 'order_DEMO581', 'pay_DEMO581', now() - interval '5 days', 'Customer could not attend', null, 2832, 'rfnd_DEMO581'),
  (pg_temp.d(582), 'TS-DEMO-582', pg_temp.d(175), pg_temp.d(301), 'Harsh Vardhan', 'harsh.vardhan@demo.tangy.local', 1, 1416, 'gen', 'failed', 'online', 'failed', array['Harsh Vardhan'], now() - interval '2 days', 'order_DEMO582', null, null, null, null, 0, null),
  (pg_temp.d(583), 'TS-DEMO-583', pg_temp.d(176), pg_temp.d(302), 'Priya Nair', 'priya.nair@demo.tangy.local', 2, 2124, 'gen', 'expired', 'online', 'created', array['Priya Nair', 'Rohan Nair'], now() - interval '1 day', 'order_DEMO583', null, null, null, now() - interval '1 day' + interval '30 minutes', 0, null),
  (pg_temp.d(584), 'TS-DEMO-584', pg_temp.d(177), pg_temp.d(303), 'Sameer Khan', 'sameer.khan@demo.tangy.local', 2, 3540, 'gen', 'expired', 'online', 'needs_review', array['Sameer Khan', 'Ayesha Khan'], now() - interval '3 days', 'order_DEMO584', 'pay_DEMO584', null, null, now() - interval '3 days' + interval '30 minutes', 0, null),
  (pg_temp.d(585), 'TS-DEMO-585', pg_temp.d(178), pg_temp.d(306), 'Divya Menon', 'divya.menon@demo.tangy.local', 2, 3068, 'gen', 'cancelled', 'online', 'refunded', array['Divya Menon', 'Arjun Menon'], now() - interval '14 days', 'order_DEMO585', 'pay_DEMO585', now() - interval '4 days', 'Session cancelled by Tangy', null, 3068, 'rfnd_DEMO585');
update bookings set razorpay_signature_verified = true where id in (pg_temp.d(581), pg_temp.d(584), pg_temp.d(585));
insert into bookings (id, registration_code, event_id, attendee_name, attendee_email, quantity, amount, tier, status, source, payment_status, attendee_names, customer_note) values
  (pg_temp.d(590), 'TS-DEMO-590', pg_temp.d(310), 'Guest list — Noor Ensemble +2', 'noor.ensemble@demo.tangy.local', 2, 0, 'gen', 'pending', 'complimentary', 'not_required', array['Hamid Ali', 'Sara Ali'], 'Artist guests');
select confirm_booking_and_issue_tickets(pg_temp.d(590));
update bookings set booking_answers = '{"seating":"Chair","chairs":2}', contact_instagram = 'arvind.shah.demo', collab_interests = array['video_photo'], collab_note = 'Happy to share photos from the night.' where id = pg_temp.d(502);
insert into audit_logs (actor_id, actor_email, actor_role, action, resource_type, resource_id, event_id, metadata)
values (null, null, 'system', 'payment.needs_review', 'booking', pg_temp.d(584)::text, pg_temp.d(303),
        jsonb_build_object('registration_code', 'TS-DEMO-584', 'reason', 'Paid after the checkout hold expired and the seats are gone (40/40 taken or held).', 'source', 'webhook', 'demo', true));

-- Check-ins: tonight 3/5 and 1/3; past session 4/4 and 1/2.
create function pg_temp.checkin(p_booking int, p_count int, p_method text, p_minutes_ago int) returns void language plpgsql as $$
declare v_batch uuid := gen_random_uuid(); t record;
begin
  for t in select * from tickets where booking_id = pg_temp.d(p_booking) and status = 'valid' order by ticket_number limit p_count loop
    insert into checkins (booking_id, event_id, ticket_id, checked_in_by, method, checked_in_at, batch_id)
    values (t.booking_id, t.event_id, t.id, pg_temp.d(102), p_method, now() - make_interval(mins => p_minutes_ago), v_batch);
    update tickets set status = 'checked_in' where id = t.id;
  end loop;
end $$;
select pg_temp.checkin(560, 3, 'qr', 25);
select pg_temp.checkin(561, 1, 'manual', 10);
select pg_temp.checkin(550, 4, 'qr', 28 * 1440);
select pg_temp.checkin(551, 1, 'qr', 26 * 1440);

-- ---------------------------------------------------------------- waitlist (Monsoon Sessions, sold out)
insert into waitlist (id, event_id, user_id, name, email, quantity, status, offered_at, offer_expires_at, booking_id, resolved_at, created_at) values
  (pg_temp.d(1101), pg_temp.d(303), pg_temp.d(170), 'Meera Kulkarni', 'meera.kulkarni@demo.tangy.local', 2, 'offered', now() - interval '30 minutes', now() + interval '90 minutes', null, null, now() - interval '6 days'),
  (pg_temp.d(1102), pg_temp.d(303), pg_temp.d(171), 'Arvind Shah', 'arvind.shah@demo.tangy.local', 3, 'waiting', null, null, null, null, now() - interval '5 days'),
  (pg_temp.d(1103), pg_temp.d(303), pg_temp.d(172), 'Sana Ahmed', 'sana.ahmed@demo.tangy.local', 1, 'waiting', null, null, null, null, now() - interval '4 days'),
  (pg_temp.d(1104), pg_temp.d(303), pg_temp.d(173), 'Rhea Dsouza', 'rhea.dsouza@demo.tangy.local', 2, 'expired', now() - interval '3 days', now() - interval '3 days' + interval '2 hours', null, now() - interval '3 days' + interval '2 hours', now() - interval '7 days'),
  (pg_temp.d(1105), pg_temp.d(303), pg_temp.d(174), 'Vikram Rao', 'vikram.rao@demo.tangy.local', 1, 'cancelled', null, null, null, now() - interval '2 days', now() - interval '8 days'),
  (pg_temp.d(1106), pg_temp.d(303), pg_temp.d(175), 'Harsh Vardhan', 'harsh.vardhan@demo.tangy.local', 2, 'skipped', null, null, null, now() - interval '1 day', now() - interval '9 days'),
  (pg_temp.d(1107), pg_temp.d(302), pg_temp.d(176), 'Priya Nair', 'priya.nair@demo.tangy.local', 2, 'converted', now() - interval '10 days', now() - interval '10 days' + interval '2 hours', pg_temp.d(528), now() - interval '10 days' + interval '20 minutes', now() - interval '12 days');

-- ---------------------------------------------------------------- partner messages (partner ↔ Tangy only; NOT end-to-end encrypted)
create function pg_temp.thread(p_n int, p_partner int, p_type text, p_subject text, p_event int, p_status text, p_msgs text[]) returns void language plpgsql as $$
declare v uuid := pg_temp.d(p_n); i int;
begin
  insert into conversations (id, subject, category, conversation_type, created_by, external_user_id, related_session_id, status, assigned_admin_id, created_at)
  values (v, p_subject, 'support', p_type, pg_temp.d(p_partner), pg_temp.d(p_partner), case when p_event is null then null else pg_temp.d(p_event) end, p_status::conversation_status, pg_temp.d(101), now() - interval '4 days');
  insert into conversation_participants (conversation_id, user_id, role) values (v, pg_temp.d(p_partner), 'owner'), (v, pg_temp.d(101), 'admin');
  for i in 1 .. array_length(p_msgs, 1) loop
    insert into messages (conversation_id, sender_id, content, created_at)
    values (v, case when i % 2 = 1 then pg_temp.d(p_partner) else pg_temp.d(101) end, p_msgs[i], now() - interval '4 days' + make_interval(hours => i * 5));
  end loop;
end $$;
select pg_temp.thread(601, 110, 'artist_support', 'Violin mic for Heritage After Dark', 301, 'pending', array[
  'Hi team — could we use a ribbon mic for the violin rather than a clip-on?',
  'Yes, Echo Sound is bringing two ribbon mics. Soundcheck is at 5 PM.',
  'Perfect, thank you. I''ll bring my own stand.']);
select pg_temp.thread(602, 120, 'sponsor_support', 'Banner logo files', 301, 'open', array[
  'Attaching our logo guidelines — is the 3 m banner still on?',
  'It is. Please upload the vector in the Brand assets tab so the printer can pick it up.',
  'Uploaded. Can we also do a tasting table near the gate?']);
select pg_temp.thread(603, 130, 'vendor_support', 'Stall position tonight', 310, 'open', array[
  'Where exactly is the chai stall tonight?',
  'East arch, next to the water station. Load-in via the lane behind the clock tower from 3 PM.',
  'Got it — we will be there by 3:30.']);
select pg_temp.thread(604, 140, 'venue_support', 'Curfew and noise limits', 301, 'resolved', array[
  'Reminder: amplified sound must end by 10 PM at the courtyard.',
  'Understood — the set closes at 9:45 and the last half hour is acoustic.']);

-- ---------------------------------------------------------------- content
insert into tv_videos (id, slug, title, description, video_url, category, in_player, featured, sort_order, status, published_at) values
  (pg_temp.d(701), 'demo-heritage-after-dark-teaser', 'Heritage After Dark — teaser', 'Draft teaser for the courtyard session (demo).', '/media/background-video/Video-63639.mp4', 'Teasers', false, false, 20, 'draft', null),
  (pg_temp.d(702), 'demo-monsoon-sessions-trailer', 'Monsoon Sessions — trailer', 'Scheduled to go live next week (demo).', '/media/background-video/Video-66802.mp4', 'Teasers', true, false, 21, 'published', now() + interval '7 days');
insert into diary_posts (id, slug, title, excerpt, body, cover_url, location, author_name, tags, status, published_at) values
  (pg_temp.d(801), 'demo-lanterns-at-chowmahalla', 'Lanterns at Chowmahalla', 'How 120 lanterns and zero spotlights lit the courtyard.', 'We turned off every floodlight in the courtyard and hung 120 lanterns from the arches instead.

The violin sounded warmer. Nobody could explain why, but everybody noticed.', '/media/demo/cover-01.svg', 'Chowmahalla Courtyard', 'Tangy team', array['behind the scenes', 'venues'], 'published', now() - interval '10 days'),
  (pg_temp.d(802), 'demo-a-tabla-circle-on-the-steps', 'A tabla circle on the steps', 'Sixty people, one tabla, and a stepwell that answers back.', 'Kabir started slow. By the third cycle the whole stepwell was clapping the theka back at him.

We recorded it — it is on Tangy TV.', '/media/gallery/tangy5.jpg', 'Stepwell Pavilion', 'Tangy team', array['stories'], 'published', now() - interval '20 days'),
  (pg_temp.d(803), 'demo-what-the-rain-brought', 'What the rain brought', 'Notes from the first monsoon session at the banyan grove.', 'The rain arrived ten minutes before Zoya did. Nobody left.

Shawls from Deccan Loom went around the audience within minutes.', '/media/demo/cover-03.svg', 'Shamirpet Banyan Grove', 'Tangy team', array['stories', 'monsoon'], 'published', now() - interval '30 days'),
  (pg_temp.d(804), 'demo-sunset-baithak-field-notes', 'Sunset Baithak — field notes', 'The terrace, the kites and a raga timed to the sunset.', 'We started Yaman at 6:05 PM, when the sun touched the Paigah domes.

The kites stopped. The pigeons did not.', '/media/gallery/tangy4.jpg', 'Paigah Haveli Terrace', 'Tangy team', array['field notes'], 'published', now() - interval '18 days'),
  (pg_temp.d(805), 'demo-dawn-concerts-why', 'Why we are doing dawn concerts', 'Draft: the case for 5:30 AM.', 'Draft — to be finished before Dhrupad at Dawn goes on sale.', null, 'Hyderabad', 'Tangy team', array['announcements'], 'draft', null),
  (pg_temp.d(806), 'demo-kathak-lab-preview', 'Kathak lab — a preview', 'Scheduled for next week.', 'Tara Iyer on teaching kathak to people who have never danced.', '/media/demo/cover-10.svg', 'Chowmahalla Courtyard', 'Tangy team', array['workshops'], 'published', now() + interval '6 days');
insert into gallery_albums (id, slug, title, description, cover_url, event_id, taken_on, sort_order, status, published_at) values
  (pg_temp.d(901), 'demo-sunset-baithak', 'Sunset Baithak', 'The terrace at golden hour (demo album).', '/media/gallery/tangy4.jpg', pg_temp.d(304), current_date - 20, 2, 'published', now() - interval '18 days'),
  (pg_temp.d(902), 'demo-rhythm-at-the-stepwell', 'Rhythm at the Stepwell — rehearsal', 'Rehearsal photos (demo album).', '/media/gallery/tangy5.jpg', pg_temp.d(302), current_date - 12, 3, 'published', now() - interval '11 days'),
  (pg_temp.d(903), 'demo-monsoon-scouting', 'Monsoon scouting (draft)', 'Venue scouting shots — not for publication yet.', '/media/demo/cover-03.svg', pg_temp.d(303), current_date - 40, 9, 'draft', null);
insert into gallery_photos (id, album_id, image_url, caption, alt_text, credit, sort_order) values
  (pg_temp.d(1701), pg_temp.d(901), '/media/gallery/tangy4.jpg', 'The venue at dusk', 'A stepwell venue lit for an evening session', 'Tangy team', 1),
  (pg_temp.d(1702), pg_temp.d(901), '/media/demo/cover-09.svg', 'Tanpura drone', 'A tanpura being tuned in the fading light', 'Tangy team', 2),
  (pg_temp.d(1703), pg_temp.d(901), '/media/demo/cover-06.svg', 'Lamps', 'Brass lamps lit along the parapet', 'Tangy team', 3),
  (pg_temp.d(1704), pg_temp.d(902), '/media/gallery/tangy5.jpg', 'Petals on the water', 'Flower petals floating in a stepwell pool', 'Tangy team', 1),
  (pg_temp.d(1705), pg_temp.d(902), '/media/demo/cover-02.svg', 'Soundcheck', 'Microphones set up at the bottom of the stepwell', 'Tangy team', 2),
  (pg_temp.d(1706), pg_temp.d(903), '/media/demo/cover-03.svg', 'Scouting', 'A banyan grove after rain', 'Tangy team', 1);
insert into announcements (id, title, body, category, character, destination, audience, priority, event_id, status, publish_at, expire_at, author_id) values
  (pg_temp.d(1001), 'Heritage After Dark is on sale', 'Carnatic violin and Deccani folk under the Chowmahalla arches. Floor, chair and patron tickets.', 'SESSION', 'violinist', '/sessions/heritage-after-dark', 'all', 'high', pg_temp.d(301), 'published', now() - interval '2 days', now() + interval '10 days', pg_temp.d(101)),
  (pg_temp.d(1002), 'Monsoon Sessions waitlist is open', 'Sold out — join the waitlist and we will hold seats for you if any come back.', 'SESSION', 'violinist', '/sessions/monsoon-sessions', 'all', 'normal', pg_temp.d(303), 'scheduled', now() + interval '1 day', now() + interval '18 days', pg_temp.d(101)),
  (pg_temp.d(1003), 'Gate team briefing at 5:30 PM', 'Everyone on gate duty tonight: briefing at the clock tower at 5:30 PM.', 'TEAM', 'violinist', null, 'staff', 'high', pg_temp.d(310), 'published', now() - interval '3 hours', now() + interval '12 hours', pg_temp.d(101)),
  (pg_temp.d(1004), 'Winter series call for artists', 'Draft — not yet published.', 'GENERAL', 'violinist', '/join', 'all', 'low', null, 'draft', now() + interval '30 days', now() + interval '60 days', pg_temp.d(101));

-- Enquiries (signed-in patrons, 0025).
insert into contact_enquiries (name, email, subject, message, inquiry_type, user_id) values
  ('Rhea Dsouza', 'rhea.dsouza@demo.tangy.local', 'Wheelchair access at Chowmahalla?', 'My father uses a wheelchair — is the courtyard step-free?', 'GENERAL', pg_temp.d(173));
insert into private_enquiries (type, name, email, phone, preferred_date, guest_count, message, user_id) values
  ('wedding', 'Divya Menon', 'divya.menon@demo.tangy.local', '+91 98480 00178', current_date + 90, 150, 'Venue: Shamirpet
Guests: 100-200

Sufi evening for a sangeet.', pg_temp.d(178));

-- A few notifications so bells and inboxes aren't empty.
select notify(pg_temp.d(101), 'payment.review', 'Payment needs review: TS-DEMO-584', 'Paid after the checkout hold expired and the seats are gone. Refund it in Razorpay or reseat the guest.', '/admin-portal/bookings/' || pg_temp.d(584), pg_temp.d(303));
select notify(pg_temp.d(170), 'waitlist.offer', 'A seat opened up: Monsoon Sessions', 'We''re holding 2 seats for you. Book now to keep them.', '/sessions/monsoon-sessions', pg_temp.d(303));

insert into event_availability_signal (event_id) select id from events where id::text like 'de300000-%' on conflict do nothing;

-- Uploaded demo media in the private content-media bucket (the files are
-- uploaded by scripts/demo-data.sh): a published album cover (visible to
-- everyone), a draft post cover and a draft video still (private).
update gallery_albums set cover_url = '/storage/content-media/gallery/de300000-demo/stepwell-rehearsal.jpg' where id = pg_temp.d(902);
update diary_posts set cover_url = '/storage/content-media/diary/de300000-demo/dawn-draft-cover.jpg' where id = pg_temp.d(805);
update tv_videos set thumbnail_url = '/storage/content-media/tv/de300000-demo/teaser-still.jpg' where id = pg_temp.d(701);

commit;
\o
