-- ============================================================================
-- TANGY WORLD — LOCAL DEMO ARCHIVE (NOT PRODUCTION DATA)
--
-- Loaded after demo_seed.sql by scripts/demo-data.sh seed (LOCAL stack only).
-- A fictional history so the archive, gallery, TV, diary and programme pages
-- can be reviewed: past sessions 2022–2026, more artists, programmes, albums,
-- photos, recordings, diary posts and announcements. None of these events
-- happened; venue names carry "(demo)". Generated — edit the generator, not
-- this file, if the dataset needs to change. Removed by demo_remove.sql (same
-- de300000-0000-4000-8000- id prefix).
-- ============================================================================
\set ON_ERROR_STOP 1
\o /dev/null
begin;
create function pg_temp.d(n bigint) returns uuid language sql immutable
as $$ select ('de300000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid $$;

-- venues
insert into venues (id, name, address, city, capacity, notes, is_active) values
  (pg_temp.d(2101), 'Taramati Baradari Pavilion (demo)', 'Gandipet Road', 'Hyderabad', 250, 'Twelve-arch pavilion on a hill; carries sound without amplification.', true),
  (pg_temp.d(2102), 'Qutb Shahi Stepwell Lawns (demo)', 'Ibrahim Bagh', 'Hyderabad', 180, 'Lawns beside a restored stepwell; dusk sessions only.', true),
  (pg_temp.d(2103), 'Old City Haveli Courtyard (demo)', 'Shah Ali Banda', 'Hyderabad', 120, 'A family haveli courtyard opened for listening evenings.', true);

-- artists (generated monogram portraits — never real performers)
insert into artists (id, name, slug, email, genre, subgenre, city, bio, instagram, performance_type, experience_level, avatar_url, status, applied_at, reviewed_at) values
  (pg_temp.d(4101), 'Rukhsana Begum', 'rukhsana-begum', 'rukhsana-begum@demo.tangy.local', 'Ghazal', 'Dakhni ghazal', 'Hyderabad', 'A ghazal singer who sings Dakhni poets the way her grandmother sang them at home — slow, close and unamplified.', 'https://example.com/demo/rukhsana-begum', 'Solo', 'Professional', '/media/demo/portrait-rukhsana-begum.svg', 'approved', now() - interval '400 days', now() - interval '390 days'),
  (pg_temp.d(4102), 'The Lantern Quartet', 'the-lantern-quartet', 'the-lantern-quartet@demo.tangy.local', 'Chamber', 'Strings', 'Hyderabad', 'A string quartet arranging film songs and folk tunes for stone courtyards.', 'https://example.com/demo/the-lantern-quartet', 'Band', 'Professional', '/media/demo/portrait-the-lantern-quartet.svg', 'approved', now() - interval '430 days', now() - interval '420 days'),
  (pg_temp.d(4103), 'Rafiq Ansari', 'rafiq-ansari', 'rafiq-ansari@demo.tangy.local', 'Hindustani', 'Sarod', 'Kolkata', 'Sarod player of the Maihar gharana; plays long alaps and short encores.', 'https://example.com/demo/rafiq-ansari', 'Solo', 'Professional', '/media/demo/portrait-rafiq-ansari.svg', 'approved', now() - interval '460 days', now() - interval '450 days'),
  (pg_temp.d(4104), 'Meghna Pillai', 'meghna-pillai', 'meghna-pillai@demo.tangy.local', 'Indie', 'Folk-pop', 'Kochi', 'Writes bilingual songs about coastlines and inland cities; plays a small-bodied guitar.', 'https://example.com/demo/meghna-pillai', 'Solo', 'Emerging', '/media/demo/portrait-meghna-pillai.svg', 'approved', now() - interval '490 days', now() - interval '480 days'),
  (pg_temp.d(4105), 'Banyan Drum Circle', 'banyan-drum-circle', 'banyan-drum-circle@demo.tangy.local', 'Percussion', 'Community drumming', 'Hyderabad', 'An open drum circle — dholak, daf and frame drums — where anyone can join the last song.', 'https://example.com/demo/banyan-drum-circle', 'Ensemble', 'Emerging', '/media/demo/portrait-banyan-drum-circle.svg', 'approved', now() - interval '520 days', now() - interval '510 days'),
  (pg_temp.d(4106), 'Farhan & the Deccan Strings', 'farhan-and-the-deccan-strings', 'farhan-and-the-deccan-strings@demo.tangy.local', 'Fusion', 'Rabab & cello', 'Hyderabad', 'Rabab, cello and percussion meeting somewhere between Kabul, Hyderabad and Lisbon.', 'https://example.com/demo/farhan-and-the-deccan-strings', 'Band', 'Professional', '/media/demo/portrait-farhan-and-the-deccan-strings.svg', 'approved', now() - interval '550 days', now() - interval '540 days'),
  (pg_temp.d(4107), 'Kavitha Raman', 'kavitha-raman', 'kavitha-raman@demo.tangy.local', 'Carnatic', 'Vocal', 'Bengaluru', 'Carnatic vocalist known for unhurried ragam-tanam-pallavi sets at dawn.', 'https://example.com/demo/kavitha-raman', 'Solo', 'Professional', '/media/demo/portrait-kavitha-raman.svg', 'approved', now() - interval '580 days', now() - interval '570 days'),
  (pg_temp.d(4108), 'Aditya Rao', 'aditya-rao', 'aditya-rao@demo.tangy.local', 'Hindustani', 'Bansuri', 'Hyderabad', 'Bansuri player who likes rooms with an echo and audiences who sit on the floor.', 'https://example.com/demo/aditya-rao', 'Solo', 'Professional', '/media/demo/portrait-aditya-rao.svg', 'approved', now() - interval '610 days', now() - interval '600 days'),
  (pg_temp.d(4109), 'Saba Mirza', 'saba-mirza', 'saba-mirza@demo.tangy.local', 'Poetry', 'Spoken word', 'Hyderabad', 'Spoken-word poet writing in Urdu and English about the Old City.', 'https://example.com/demo/saba-mirza', 'Solo', 'Emerging', '/media/demo/portrait-saba-mirza.svg', 'approved', now() - interval '640 days', now() - interval '630 days'),
  (pg_temp.d(4110), 'Nizam Street Brass', 'nizam-street-brass', 'nizam-street-brass@demo.tangy.local', 'Brass', 'Wedding brass', 'Hyderabad', 'A wedding brass band that learned jazz standards on the side.', 'https://example.com/demo/nizam-street-brass', 'Band', 'Professional', '/media/demo/portrait-nizam-street-brass.svg', 'approved', now() - interval '670 days', now() - interval '660 days'),
  (pg_temp.d(4111), 'Leela Sundaram', 'leela-sundaram', 'leela-sundaram@demo.tangy.local', 'Dance', 'Bharatanatyam', 'Chennai', 'Bharatanatyam dancer who performs on stone floors with live nattuvangam.', 'https://example.com/demo/leela-sundaram', 'Solo', 'Professional', '/media/demo/portrait-leela-sundaram.svg', 'approved', now() - interval '700 days', now() - interval '690 days'),
  (pg_temp.d(4112), 'Rhea Fernandes', 'rhea-fernandes', 'rhea-fernandes@demo.tangy.local', 'Jazz', 'Vocal', 'Goa', 'Jazz vocalist with a trio, singing standards and Konkani songs.', 'https://example.com/demo/rhea-fernandes', 'Solo', 'Professional', '/media/demo/portrait-rhea-fernandes.svg', 'approved', now() - interval '730 days', now() - interval '720 days'),
  (pg_temp.d(4113), 'Dhol Tasha Pathak (demo)', 'dhol-tasha-pathak', 'dhol-tasha-pathak@demo.tangy.local', 'Percussion', 'Dhol-tasha', 'Pune', 'A twenty-drummer pathak — loud, joyful, outdoors only.', 'https://example.com/demo/dhol-tasha-pathak', 'Ensemble', 'Emerging', '/media/demo/portrait-dhol-tasha-pathak.svg', 'approved', now() - interval '760 days', now() - interval '750 days'),
  (pg_temp.d(4114), 'Imran Qureshi', 'imran-qureshi', 'imran-qureshi@demo.tangy.local', 'Qawwali', 'Harmonium', 'Hyderabad', 'Leads a qawwali party with harmonium, tabla and a clapping chorus of six.', 'https://example.com/demo/imran-qureshi', 'Ensemble', 'Professional', '/media/demo/portrait-imran-qureshi.svg', 'approved', now() - interval '790 days', now() - interval '780 days'),
  (pg_temp.d(4115), 'Yamini Das', 'yamini-das', 'yamini-das@demo.tangy.local', 'Ambient', 'Electronic & tanpura', 'Hyderabad', 'Builds slow electronic pieces around a tanpura drone; plays sunrise sets.', 'https://example.com/demo/yamini-das', 'Solo', 'Emerging', '/media/demo/portrait-yamini-das.svg', 'approved', now() - interval '820 days', now() - interval '810 days');

-- past sessions (absolute dates — they are history)
insert into events (id, slug, name, description, story, event_date, event_time, end_time, venue, venue_id, image_url, capacity, price, status, featured, tags, attendance_recorded) values
  (pg_temp.d(3101), 'stepwell-sessions-2022', 'Stepwell Sessions', 'The first season night on the restored steps: tabla and bansuri, 45 people on the stone.', 'Forty-five people, no microphones, and a stepwell that turned out to be an instrument.', '2022-02-12'::date, '7:00 PM', '10:00 PM', 'Stepwell Pavilion (demo)', pg_temp.d(204), '/media/demo/cover-06.svg', 45, 600, 'past', false, array['Music', 'Heritage']::text[], 45),
  (pg_temp.d(3102), 'city-in-concert-2022', 'City in Concert', 'Strings and songs in a family haveli courtyard opened for one evening.', null, '2022-06-18'::date, '7:00 PM', '10:00 PM', 'Old City Haveli Courtyard (demo)', pg_temp.d(2103), '/media/demo/cover-10.svg', 120, 800, 'past', false, array['Music', 'Courtyard']::text[], 112),
  (pg_temp.d(3103), 'monsoon-sessions-2022', 'Monsoon Sessions', 'Qawwali under the banyan as the first heavy rain of the year arrived.', 'The tarpaulins went up at 7:40. Nobody went home.', '2022-08-06'::date, '7:00 PM', '10:00 PM', 'Shamirpet Banyan Grove (demo)', pg_temp.d(202), '/media/demo/cover-04.svg', 140, 900, 'past', false, array['Music', 'Monsoon']::text[], 131),
  (pg_temp.d(3104), 'sounds-of-the-deccan-2022', 'Sounds of the Deccan', 'Dakhni folk and ghazal under the twelve arches of the Baradari.', null, '2022-11-19'::date, '7:00 PM', '10:00 PM', 'Taramati Baradari Pavilion (demo)', pg_temp.d(2101), '/media/demo/cover-01.svg', 220, 1000, 'past', false, array['Music', 'Heritage']::text[], 204),
  (pg_temp.d(3105), 'indie-under-the-banyan-2023', 'Indie Under the Banyan', 'Two songwriters, two guitars, one very old tree.', null, '2023-01-21'::date, '7:00 PM', '10:00 PM', 'Shamirpet Banyan Grove (demo)', pg_temp.d(202), '/media/demo/cover-09.svg', 140, 700, 'past', false, array['Music', 'Indie']::text[], 118),
  (pg_temp.d(3106), 'roots-and-resonance-2023', 'Roots & Resonance', 'Carnatic violin meets Hindustani sarod in the Chowmahalla courtyard.', 'The jugalbandi ran forty minutes over. The courtyard staff stayed.', '2023-03-11'::date, '7:00 PM', '10:00 PM', 'Chowmahalla Courtyard (demo)', pg_temp.d(201), '/media/demo/cover-02.svg', 200, 1200, 'past', false, array['Music', 'Courtyard']::text[], 187),
  (pg_temp.d(3107), 'monsoon-sessions-2023', 'Monsoon Sessions', 'Qawwali and ambient rain recordings — sold out in an afternoon.', null, '2023-07-29'::date, '7:00 PM', '10:00 PM', 'Shamirpet Banyan Grove (demo)', pg_temp.d(202), '/media/demo/cover-04.svg', 140, 900, 'past', false, array['Music', 'Monsoon']::text[], 140),
  (pg_temp.d(3108), 'field-recording-walk-2023', 'Field Recording Walk', 'A morning workshop: record water, stone and birds around the stepwell with a phone.', null, '2023-09-09'::date, '7:00 PM', '10:00 PM', 'Qutb Shahi Stepwell Lawns (demo)', pg_temp.d(2102), '/media/demo/cover-07.svg', 25, 1500, 'past', false, array['Workshop', 'Heritage']::text[], 24),
  (pg_temp.d(3109), 'city-in-concert-2023', 'City in Concert', 'Rabab, cello and jazz voice at the Baradari for the year-end night.', null, '2023-12-16'::date, '7:00 PM', '10:00 PM', 'Taramati Baradari Pavilion (demo)', pg_temp.d(2101), '/media/demo/cover-01.svg', 220, 1100, 'past', false, array['Music', 'Heritage']::text[], 215),
  (pg_temp.d(3110), 'sunset-baithak-2024', 'Sunset Baithak', 'Khayal and bansuri on the Paigah terrace as the sun went down.', null, '2024-02-17'::date, '7:00 PM', '10:00 PM', 'Paigah Haveli Terrace (demo)', pg_temp.d(203), '/media/demo/cover-05.svg', 90, 1000, 'past', false, array['Music', 'Baithak']::text[], 88),
  (pg_temp.d(3111), 'courtyard-sessions-2024', 'Courtyard Sessions', 'Oud, sitar and a string quartet across the long courtyard.', null, '2024-04-13'::date, '7:00 PM', '10:00 PM', 'Chowmahalla Courtyard (demo)', pg_temp.d(201), '/media/demo/cover-03.svg', 200, 1200, 'past', false, array['Music', 'Courtyard']::text[], 192),
  (pg_temp.d(3112), 'kathak-movement-lab-2024', 'Kathak Movement Lab', 'A beginners’ kathak lab: footwork, spins and a short piece by the end.', null, '2024-05-25'::date, '7:00 PM', '10:00 PM', 'Old City Haveli Courtyard (demo)', pg_temp.d(2103), '/media/demo/cover-11.svg', 30, 1200, 'past', false, array['Workshop', 'Dance']::text[], 28),
  (pg_temp.d(3113), 'monsoon-sessions-2024', 'Monsoon Sessions', 'Cancelled — the grove flooded two days before. Ticket holders were refunded and invited to Deccan Resonance.', null, '2024-08-03'::date, '7:00 PM', '10:00 PM', 'Shamirpet Banyan Grove (demo)', pg_temp.d(202), '/media/demo/cover-04.svg', 150, 1000, 'cancelled', false, array['Music', 'Monsoon']::text[], null),
  (pg_temp.d(3114), 'deccan-resonance-2024', 'Deccan Resonance', 'A long night of Deccani music: folk, ghazal and qawwali in one programme.', 'Three ensembles, one stage, and the latest finish we have ever had.', '2024-09-21'::date, '7:00 PM', '10:00 PM', 'Taramati Baradari Pavilion (demo)', pg_temp.d(2101), '/media/demo/cover-01.svg', 250, 1200, 'past', false, array['Music', 'Heritage']::text[], 241),
  (pg_temp.d(3115), 'night-at-the-stepwell-2024', 'Night at the Stepwell', 'Tabla and an open drum circle on the steps — the last song was everyone’s.', null, '2024-11-30'::date, '7:00 PM', '10:00 PM', 'Stepwell Pavilion (demo)', pg_temp.d(204), '/media/demo/cover-06.svg', 60, 1100, 'past', false, array['Music', 'Heritage']::text[], 60),
  (pg_temp.d(3116), 'dhrupad-at-dawn-2025', 'Dhrupad at Dawn', 'Dhrupad and Carnatic vocal at 5:30 AM as the city woke up.', null, '2025-01-18'::date, '7:00 PM', '10:00 PM', 'Stepwell Pavilion (demo)', pg_temp.d(204), '/media/demo/cover-10.svg', 60, 1100, 'past', false, array['Music', 'Dawn']::text[], 54),
  (pg_temp.d(3117), 'heritage-after-dark-2025', 'Heritage After Dark', 'Carnatic violin and Dakhni folk under lanterns in the Chowmahalla courtyard.', 'We turned off every floodlight and hung lanterns from the arches instead.', '2025-03-08'::date, '7:00 PM', '10:00 PM', 'Chowmahalla Courtyard (demo)', pg_temp.d(201), '/media/demo/cover-02.svg', 200, 1400, 'past', false, array['Music', 'Courtyard']::text[], 198),
  (pg_temp.d(3118), 'poetry-at-the-haveli-2025', 'Poetry at the Haveli', 'Urdu and English spoken word, with ghazal between the readings.', null, '2025-04-12'::date, '7:00 PM', '10:00 PM', 'Old City Haveli Courtyard (demo)', pg_temp.d(2103), '/media/demo/cover-07.svg', 80, 600, 'past', false, array['Poetry', 'Courtyard']::text[], 74),
  (pg_temp.d(3119), 'monsoon-sessions-2025', 'Monsoon Sessions', 'Qawwali by candlelight while the rain came down on the banyan.', 'The power went out at 9:12. The qawwali did not stop.', '2025-07-26'::date, '7:00 PM', '10:00 PM', 'Shamirpet Banyan Grove (demo)', pg_temp.d(202), '/media/demo/cover-04.svg', 150, 1100, 'past', false, array['Music', 'Monsoon']::text[], 150),
  (pg_temp.d(3120), 'brass-on-the-lawns-2025', 'Brass on the Lawns', 'Wedding brass and dhol-tasha on the stepwell lawns — the loud one.', null, '2025-09-13'::date, '7:00 PM', '10:00 PM', 'Qutb Shahi Stepwell Lawns (demo)', pg_temp.d(2102), '/media/demo/cover-03.svg', 180, 900, 'past', false, array['Music', 'Outdoor']::text[], 166),
  (pg_temp.d(3121), 'sounds-of-the-deccan-2025', 'Sounds of the Deccan', 'Rabab, sarod and Bharatanatyam across the Baradari arches.', null, '2025-11-22'::date, '7:00 PM', '10:00 PM', 'Taramati Baradari Pavilion (demo)', pg_temp.d(2101), '/media/demo/cover-01.svg', 250, 1300, 'past', false, array['Music', 'Heritage']::text[], 236),
  (pg_temp.d(3122), 'sunrise-ambient-2026', 'Sunrise Ambient', 'Tanpura drones and ambient electronics as the sun rose over the stepwell.', null, '2026-01-10'::date, '7:00 PM', '10:00 PM', 'Qutb Shahi Stepwell Lawns (demo)', pg_temp.d(2102), '/media/demo/cover-09.svg', 100, 900, 'past', false, array['Music', 'Dawn']::text[], 87),
  (pg_temp.d(3123), 'courtyard-sessions-2026', 'Courtyard Sessions', 'Oud and sitar, then a jazz trio, in the long courtyard.', null, '2026-03-14'::date, '7:00 PM', '10:00 PM', 'Chowmahalla Courtyard (demo)', pg_temp.d(201), '/media/demo/cover-03.svg', 200, 1400, 'past', false, array['Music', 'Courtyard']::text[], 201),
  (pg_temp.d(3124), 'rhythm-at-the-stepwell-2026', 'Rhythm at the Stepwell', 'The spring tabla circle on the steps — sold out in an hour.', null, '2026-05-16'::date, '7:00 PM', '10:00 PM', 'Stepwell Pavilion (demo)', pg_temp.d(204), '/media/demo/cover-06.svg', 60, 1000, 'past', false, array['Music', 'Heritage']::text[], 60),
  (pg_temp.d(3125), 'monsoon-sessions-2026', 'Monsoon Sessions', 'Postponed — moved to a date later in the season because of the forecast; ticket holders could transfer or refund.', null, '2026-08-08'::date, '7:00 PM', '10:00 PM', 'Shamirpet Banyan Grove (demo)', pg_temp.d(202), '/media/demo/cover-04.svg', 150, 1200, 'cancelled', false, array['Music', 'Monsoon']::text[], null);
update events set event_time = '5:30 AM', end_time = '7:30 AM' where id in (pg_temp.d(3116), pg_temp.d(3122));
insert into event_artists (event_id, artist_id) values
  (pg_temp.d(3101), pg_temp.d(402)),
  (pg_temp.d(3101), pg_temp.d(4108)),
  (pg_temp.d(3102), pg_temp.d(4102)),
  (pg_temp.d(3102), pg_temp.d(405)),
  (pg_temp.d(3103), pg_temp.d(404)),
  (pg_temp.d(3103), pg_temp.d(4114)),
  (pg_temp.d(3104), pg_temp.d(403)),
  (pg_temp.d(3104), pg_temp.d(4101)),
  (pg_temp.d(3105), pg_temp.d(405)),
  (pg_temp.d(3105), pg_temp.d(4104)),
  (pg_temp.d(3106), pg_temp.d(401)),
  (pg_temp.d(3106), pg_temp.d(4103)),
  (pg_temp.d(3107), pg_temp.d(404)),
  (pg_temp.d(3107), pg_temp.d(407)),
  (pg_temp.d(3108), pg_temp.d(407)),
  (pg_temp.d(3109), pg_temp.d(4106)),
  (pg_temp.d(3109), pg_temp.d(4112)),
  (pg_temp.d(3110), pg_temp.d(406)),
  (pg_temp.d(3110), pg_temp.d(4108)),
  (pg_temp.d(3111), pg_temp.d(409)),
  (pg_temp.d(3111), pg_temp.d(4102)),
  (pg_temp.d(3112), pg_temp.d(410)),
  (pg_temp.d(3113), pg_temp.d(404)),
  (pg_temp.d(3114), pg_temp.d(403)),
  (pg_temp.d(3114), pg_temp.d(4114)),
  (pg_temp.d(3114), pg_temp.d(4101)),
  (pg_temp.d(3115), pg_temp.d(402)),
  (pg_temp.d(3115), pg_temp.d(4105)),
  (pg_temp.d(3116), pg_temp.d(408)),
  (pg_temp.d(3116), pg_temp.d(4107)),
  (pg_temp.d(3117), pg_temp.d(401)),
  (pg_temp.d(3117), pg_temp.d(403)),
  (pg_temp.d(3118), pg_temp.d(4109)),
  (pg_temp.d(3118), pg_temp.d(4101)),
  (pg_temp.d(3119), pg_temp.d(404)),
  (pg_temp.d(3119), pg_temp.d(4114)),
  (pg_temp.d(3119), pg_temp.d(407)),
  (pg_temp.d(3120), pg_temp.d(4110)),
  (pg_temp.d(3120), pg_temp.d(4113)),
  (pg_temp.d(3121), pg_temp.d(4106)),
  (pg_temp.d(3121), pg_temp.d(4103)),
  (pg_temp.d(3121), pg_temp.d(4111)),
  (pg_temp.d(3122), pg_temp.d(4115)),
  (pg_temp.d(3122), pg_temp.d(407)),
  (pg_temp.d(3123), pg_temp.d(409)),
  (pg_temp.d(3123), pg_temp.d(4112)),
  (pg_temp.d(3124), pg_temp.d(402)),
  (pg_temp.d(3124), pg_temp.d(4105)),
  (pg_temp.d(3125), pg_temp.d(404));

-- programmes
insert into programmes (id, slug, title, year, season, description, venue, cover_url, status, published_at, sort_order) values
  (pg_temp.d(2501), 'stepwell-season-2022', 'Stepwell Season', 2022, 'Winter', 'The first full season: four nights, from the restored stepwell to the Baradari arches.', 'Stepwell Pavilion and the Baradari', '/media/demo/cover-06.svg', 'published', now() - interval '1000 days', 0),
  (pg_temp.d(2502), 'city-in-concert-2023', 'City in Concert', 2023, 'Year-round', 'A year of nights across five venues — songwriters, jugalbandi and the year-end Baradari concert.', 'Across the city', '/media/demo/cover-01.svg', 'published', now() - interval '800 days', 1),
  (pg_temp.d(2503), 'monsoon-sessions-2023', 'Monsoon Sessions', 2023, 'Monsoon', 'Music for the rain, under the banyan, plus a field-recording walk.', 'Shamirpet Banyan Grove', '/media/demo/cover-04.svg', 'published', now() - interval '800 days', 2),
  (pg_temp.d(2504), 'courtyard-sessions-2024', 'Courtyard Sessions', 2024, 'Spring', 'Spring in the courtyards: baithak, ensembles and a kathak lab.', 'Chowmahalla and the Old City', '/media/demo/cover-03.svg', 'published', now() - interval '600 days', 3),
  (pg_temp.d(2505), 'deccan-resonance-2024', 'Deccan Resonance', 2024, 'Autumn', 'An autumn programme of Deccani music — the monsoon night was cancelled and folded into it.', 'Taramati Baradari', '/media/demo/cover-01.svg', 'published', now() - interval '600 days', 4),
  (pg_temp.d(2506), 'heritage-after-dark-2025', 'Heritage After Dark', 2025, 'Winter–Spring', 'Lantern-lit nights: dawn dhrupad, the courtyard concert and poetry at the haveli.', 'Courtyards and terraces', '/media/demo/cover-02.svg', 'published', now() - interval '400 days', 5),
  (pg_temp.d(2507), 'monsoon-sessions-2025', 'Monsoon Sessions', 2025, 'Monsoon', 'The monsoon programme and its loud cousin, brass on the lawns.', 'Banyan Grove and the stepwell lawns', '/media/demo/cover-04.svg', 'published', now() - interval '400 days', 6),
  (pg_temp.d(2508), 'season-2026', 'Season 2026', 2026, 'Year-round', 'This year’s programme so far — sunrise sets, courtyards, the stepwell, and the sessions on sale now.', 'Across the city', '/media/demo/cover-09.svg', 'published', now() - interval '200 days', 7);
insert into programme_events (programme_id, event_id, position) values
  (pg_temp.d(2501), pg_temp.d(3101), 0),
  (pg_temp.d(2501), pg_temp.d(3102), 1),
  (pg_temp.d(2501), pg_temp.d(3103), 2),
  (pg_temp.d(2501), pg_temp.d(3104), 3),
  (pg_temp.d(2502), pg_temp.d(3105), 0),
  (pg_temp.d(2502), pg_temp.d(3106), 1),
  (pg_temp.d(2502), pg_temp.d(3109), 2),
  (pg_temp.d(2503), pg_temp.d(3107), 0),
  (pg_temp.d(2503), pg_temp.d(3108), 1),
  (pg_temp.d(2504), pg_temp.d(3110), 0),
  (pg_temp.d(2504), pg_temp.d(3111), 1),
  (pg_temp.d(2504), pg_temp.d(3112), 2),
  (pg_temp.d(2505), pg_temp.d(3113), 0),
  (pg_temp.d(2505), pg_temp.d(3114), 1),
  (pg_temp.d(2505), pg_temp.d(3115), 2),
  (pg_temp.d(2506), pg_temp.d(3116), 0),
  (pg_temp.d(2506), pg_temp.d(3117), 1),
  (pg_temp.d(2506), pg_temp.d(3118), 2),
  (pg_temp.d(2507), pg_temp.d(3119), 0),
  (pg_temp.d(2507), pg_temp.d(3120), 1),
  (pg_temp.d(2507), pg_temp.d(3121), 2),
  (pg_temp.d(2508), pg_temp.d(3122), 0),
  (pg_temp.d(2508), pg_temp.d(3123), 1),
  (pg_temp.d(2508), pg_temp.d(3124), 2),
  (pg_temp.d(2508), pg_temp.d(3125), 3),
  (pg_temp.d(2508), pg_temp.d(301), 4),
  (pg_temp.d(2508), pg_temp.d(302), 5),
  (pg_temp.d(2508), pg_temp.d(303), 6);

-- gallery albums + photos (generated demo artwork; two empty-venue photos in Tangy Spaces)
insert into gallery_albums (id, slug, title, description, cover_url, event_id, taken_on, sort_order, status, published_at) values
  (pg_temp.d(9101), 'stepwell-sessions-2022', 'Stepwell Sessions — 2022', 'Photos from Stepwell Sessions at Stepwell Pavilion, 2022 (demo album).', '/media/demo/cover-06.svg', pg_temp.d(3101), '2022-02-12'::date, 10, 'published', '2022-02-12'::date::timestamptz + interval '3 days'),
  (pg_temp.d(9102), 'monsoon-sessions-2022', 'Monsoon Sessions — 2022', 'Photos from Monsoon Sessions at Shamirpet Banyan Grove, 2022 (demo album).', '/media/demo/cover-04.svg', pg_temp.d(3103), '2022-08-06'::date, 11, 'published', '2022-08-06'::date::timestamptz + interval '3 days'),
  (pg_temp.d(9103), 'sounds-of-the-deccan-2022', 'Sounds of the Deccan — 2022', 'Photos from Sounds of the Deccan at Taramati Baradari Pavilion, 2022 (demo album).', '/media/demo/cover-01.svg', pg_temp.d(3104), '2022-11-19'::date, 12, 'published', '2022-11-19'::date::timestamptz + interval '3 days'),
  (pg_temp.d(9104), 'roots-and-resonance-2023', 'Roots & Resonance — 2023', 'Photos from Roots & Resonance at Chowmahalla Courtyard, 2023 (demo album).', '/media/demo/cover-02.svg', pg_temp.d(3106), '2023-03-11'::date, 13, 'published', '2023-03-11'::date::timestamptz + interval '3 days'),
  (pg_temp.d(9105), 'monsoon-sessions-2023', 'Monsoon Sessions — 2023', 'Photos from Monsoon Sessions at Shamirpet Banyan Grove, 2023 (demo album).', '/media/demo/cover-04.svg', pg_temp.d(3107), '2023-07-29'::date, 14, 'published', '2023-07-29'::date::timestamptz + interval '3 days'),
  (pg_temp.d(9106), 'city-in-concert-2023', 'City in Concert — 2023', 'Photos from City in Concert at Taramati Baradari Pavilion, 2023 (demo album).', '/media/demo/cover-01.svg', pg_temp.d(3109), '2023-12-16'::date, 15, 'published', '2023-12-16'::date::timestamptz + interval '3 days'),
  (pg_temp.d(9107), 'courtyard-sessions-2024', 'Courtyard Sessions — 2024', 'Photos from Courtyard Sessions at Chowmahalla Courtyard, 2024 (demo album).', '/media/demo/cover-03.svg', pg_temp.d(3111), '2024-04-13'::date, 16, 'published', '2024-04-13'::date::timestamptz + interval '3 days'),
  (pg_temp.d(9108), 'deccan-resonance-2024', 'Deccan Resonance — 2024', 'Photos from Deccan Resonance at Taramati Baradari Pavilion, 2024 (demo album).', '/media/demo/cover-01.svg', pg_temp.d(3114), '2024-09-21'::date, 17, 'published', '2024-09-21'::date::timestamptz + interval '3 days'),
  (pg_temp.d(9109), 'night-at-the-stepwell-2024', 'Night at the Stepwell — 2024', 'Photos from Night at the Stepwell at Stepwell Pavilion, 2024 (demo album).', '/media/demo/cover-06.svg', pg_temp.d(3115), '2024-11-30'::date, 18, 'published', '2024-11-30'::date::timestamptz + interval '3 days'),
  (pg_temp.d(9110), 'dhrupad-at-dawn-2025', 'Dhrupad at Dawn — 2025', 'Photos from Dhrupad at Dawn at Stepwell Pavilion, 2025 (demo album).', '/media/demo/cover-10.svg', pg_temp.d(3116), '2025-01-18'::date, 19, 'published', '2025-01-18'::date::timestamptz + interval '3 days'),
  (pg_temp.d(9111), 'heritage-after-dark-2025', 'Heritage After Dark — 2025', 'Photos from Heritage After Dark at Chowmahalla Courtyard, 2025 (demo album).', '/media/demo/cover-02.svg', pg_temp.d(3117), '2025-03-08'::date, 20, 'published', '2025-03-08'::date::timestamptz + interval '3 days'),
  (pg_temp.d(9112), 'monsoon-sessions-2025', 'Monsoon Sessions — 2025', 'Photos from Monsoon Sessions at Shamirpet Banyan Grove, 2025 (demo album).', '/media/demo/cover-04.svg', pg_temp.d(3119), '2025-07-26'::date, 21, 'published', '2025-07-26'::date::timestamptz + interval '3 days'),
  (pg_temp.d(9113), 'brass-on-the-lawns-2025', 'Brass on the Lawns — 2025', 'Photos from Brass on the Lawns at Qutb Shahi Stepwell Lawns, 2025 (demo album).', '/media/demo/cover-03.svg', pg_temp.d(3120), '2025-09-13'::date, 22, 'published', '2025-09-13'::date::timestamptz + interval '3 days'),
  (pg_temp.d(9114), 'sounds-of-the-deccan-2025', 'Sounds of the Deccan — 2025', 'Photos from Sounds of the Deccan at Taramati Baradari Pavilion, 2025 (demo album).', '/media/demo/cover-01.svg', pg_temp.d(3121), '2025-11-22'::date, 23, 'published', '2025-11-22'::date::timestamptz + interval '3 days'),
  (pg_temp.d(9115), 'courtyard-sessions-2026', 'Courtyard Sessions — 2026', 'Photos from Courtyard Sessions at Chowmahalla Courtyard, 2026 (demo album).', '/media/demo/cover-03.svg', pg_temp.d(3123), '2026-03-14'::date, 24, 'published', '2026-03-14'::date::timestamptz + interval '3 days'),
  (pg_temp.d(9116), 'rhythm-at-the-stepwell-2026', 'Rhythm at the Stepwell — 2026', 'Photos from Rhythm at the Stepwell at Stepwell Pavilion, 2026 (demo album).', '/media/demo/cover-06.svg', pg_temp.d(3124), '2026-05-16'::date, 25, 'published', '2026-05-16'::date::timestamptz + interval '3 days'),
  (pg_temp.d(9117), 'artist-portraits', 'Artist Portraits', 'Portraits of artists who have played Tangy nights (demo).', '/media/demo/portrait-rukhsana-begum.svg', null, current_date - 30, 40, 'published', now() - interval '20 days'),
  (pg_temp.d(9118), 'tangy-volunteers', 'Tangy Volunteers', 'The gate, the chai station and the people who make the nights run (demo).', '/media/demo/cover-11.svg', null, current_date - 50, 41, 'published', now() - interval '35 days'),
  (pg_temp.d(9119), 'tangy-spaces', 'Tangy Spaces', 'The venues by daylight — before anyone arrives (demo).', '/media/demo/cover-12.svg', null, current_date - 70, 42, 'published', now() - interval '50 days');
insert into gallery_photos (id, album_id, image_url, caption, alt_text, credit, sort_order) values
  (pg_temp.d(17101), pg_temp.d(9101), '/media/demo/photo-01.svg', 'The room before doors', 'Demo artwork standing in for a photo: the room before doors, Stepwell Sessions 2022', 'Demo artwork', 1),
  (pg_temp.d(17102), pg_temp.d(9101), '/media/demo/photo-02.svg', 'Soundcheck', 'Demo artwork standing in for a photo: soundcheck, Stepwell Sessions 2022', 'Demo artwork', 2),
  (pg_temp.d(17103), pg_temp.d(9101), '/media/demo/photo-03.svg', 'First piece', 'Demo artwork standing in for a photo: first piece, Stepwell Sessions 2022', 'Demo artwork', 3),
  (pg_temp.d(17104), pg_temp.d(9101), '/media/demo/photo-04.svg', 'The audience on the floor', 'Demo artwork standing in for a photo: the audience on the floor, Stepwell Sessions 2022', 'Demo artwork', 4),
  (pg_temp.d(17105), pg_temp.d(9102), '/media/demo/photo-04.svg', 'Soundcheck', 'Demo artwork standing in for a photo: soundcheck, Monsoon Sessions 2022', 'Demo artwork', 1),
  (pg_temp.d(17106), pg_temp.d(9102), '/media/demo/photo-05.svg', 'First piece', 'Demo artwork standing in for a photo: first piece, Monsoon Sessions 2022', 'Demo artwork', 2),
  (pg_temp.d(17107), pg_temp.d(9102), '/media/demo/photo-06.svg', 'The audience on the floor', 'Demo artwork standing in for a photo: the audience on the floor, Monsoon Sessions 2022', 'Demo artwork', 3),
  (pg_temp.d(17108), pg_temp.d(9102), '/media/demo/photo-07.svg', 'Lanterns', 'Demo artwork standing in for a photo: lanterns, Monsoon Sessions 2022', 'Demo artwork', 4),
  (pg_temp.d(17109), pg_temp.d(9103), '/media/demo/photo-07.svg', 'First piece', 'Demo artwork standing in for a photo: first piece, Sounds of the Deccan 2022', 'Demo artwork', 1),
  (pg_temp.d(17110), pg_temp.d(9103), '/media/demo/photo-08.svg', 'The audience on the floor', 'Demo artwork standing in for a photo: the audience on the floor, Sounds of the Deccan 2022', 'Demo artwork', 2),
  (pg_temp.d(17111), pg_temp.d(9103), '/media/demo/photo-09.svg', 'Lanterns', 'Demo artwork standing in for a photo: lanterns, Sounds of the Deccan 2022', 'Demo artwork', 3),
  (pg_temp.d(17112), pg_temp.d(9103), '/media/demo/photo-10.svg', 'Between sets', 'Demo artwork standing in for a photo: between sets, Sounds of the Deccan 2022', 'Demo artwork', 4),
  (pg_temp.d(17113), pg_temp.d(9104), '/media/demo/photo-10.svg', 'The audience on the floor', 'Demo artwork standing in for a photo: the audience on the floor, Roots & Resonance 2023', 'Demo artwork', 1),
  (pg_temp.d(17114), pg_temp.d(9104), '/media/demo/photo-11.svg', 'Lanterns', 'Demo artwork standing in for a photo: lanterns, Roots & Resonance 2023', 'Demo artwork', 2),
  (pg_temp.d(17115), pg_temp.d(9104), '/media/demo/photo-12.svg', 'Between sets', 'Demo artwork standing in for a photo: between sets, Roots & Resonance 2023', 'Demo artwork', 3),
  (pg_temp.d(17116), pg_temp.d(9104), '/media/demo/photo-13.svg', 'Encore', 'Demo artwork standing in for a photo: encore, Roots & Resonance 2023', 'Demo artwork', 4),
  (pg_temp.d(17117), pg_temp.d(9105), '/media/demo/photo-13.svg', 'Lanterns', 'Demo artwork standing in for a photo: lanterns, Monsoon Sessions 2023', 'Demo artwork', 1),
  (pg_temp.d(17118), pg_temp.d(9105), '/media/demo/photo-14.svg', 'Between sets', 'Demo artwork standing in for a photo: between sets, Monsoon Sessions 2023', 'Demo artwork', 2),
  (pg_temp.d(17119), pg_temp.d(9105), '/media/demo/photo-15.svg', 'Encore', 'Demo artwork standing in for a photo: encore, Monsoon Sessions 2023', 'Demo artwork', 3),
  (pg_temp.d(17120), pg_temp.d(9105), '/media/demo/photo-16.svg', 'After the last song', 'Demo artwork standing in for a photo: after the last song, Monsoon Sessions 2023', 'Demo artwork', 4),
  (pg_temp.d(17121), pg_temp.d(9106), '/media/demo/photo-16.svg', 'Between sets', 'Demo artwork standing in for a photo: between sets, City in Concert 2023', 'Demo artwork', 1),
  (pg_temp.d(17122), pg_temp.d(9106), '/media/demo/photo-17.svg', 'Encore', 'Demo artwork standing in for a photo: encore, City in Concert 2023', 'Demo artwork', 2),
  (pg_temp.d(17123), pg_temp.d(9106), '/media/demo/photo-18.svg', 'After the last song', 'Demo artwork standing in for a photo: after the last song, City in Concert 2023', 'Demo artwork', 3),
  (pg_temp.d(17124), pg_temp.d(9106), '/media/demo/photo-19.svg', 'The room before doors', 'Demo artwork standing in for a photo: the room before doors, City in Concert 2023', 'Demo artwork', 4),
  (pg_temp.d(17125), pg_temp.d(9107), '/media/demo/photo-19.svg', 'Encore', 'Demo artwork standing in for a photo: encore, Courtyard Sessions 2024', 'Demo artwork', 1),
  (pg_temp.d(17126), pg_temp.d(9107), '/media/demo/photo-20.svg', 'After the last song', 'Demo artwork standing in for a photo: after the last song, Courtyard Sessions 2024', 'Demo artwork', 2),
  (pg_temp.d(17127), pg_temp.d(9107), '/media/demo/photo-21.svg', 'The room before doors', 'Demo artwork standing in for a photo: the room before doors, Courtyard Sessions 2024', 'Demo artwork', 3),
  (pg_temp.d(17128), pg_temp.d(9107), '/media/demo/photo-22.svg', 'Soundcheck', 'Demo artwork standing in for a photo: soundcheck, Courtyard Sessions 2024', 'Demo artwork', 4),
  (pg_temp.d(17129), pg_temp.d(9108), '/media/demo/photo-22.svg', 'After the last song', 'Demo artwork standing in for a photo: after the last song, Deccan Resonance 2024', 'Demo artwork', 1),
  (pg_temp.d(17130), pg_temp.d(9108), '/media/demo/photo-23.svg', 'The room before doors', 'Demo artwork standing in for a photo: the room before doors, Deccan Resonance 2024', 'Demo artwork', 2),
  (pg_temp.d(17131), pg_temp.d(9108), '/media/demo/photo-24.svg', 'Soundcheck', 'Demo artwork standing in for a photo: soundcheck, Deccan Resonance 2024', 'Demo artwork', 3),
  (pg_temp.d(17132), pg_temp.d(9108), '/media/demo/photo-01.svg', 'First piece', 'Demo artwork standing in for a photo: first piece, Deccan Resonance 2024', 'Demo artwork', 4),
  (pg_temp.d(17133), pg_temp.d(9109), '/media/demo/photo-01.svg', 'The room before doors', 'Demo artwork standing in for a photo: the room before doors, Night at the Stepwell 2024', 'Demo artwork', 1),
  (pg_temp.d(17134), pg_temp.d(9109), '/media/demo/photo-02.svg', 'Soundcheck', 'Demo artwork standing in for a photo: soundcheck, Night at the Stepwell 2024', 'Demo artwork', 2),
  (pg_temp.d(17135), pg_temp.d(9109), '/media/demo/photo-03.svg', 'First piece', 'Demo artwork standing in for a photo: first piece, Night at the Stepwell 2024', 'Demo artwork', 3),
  (pg_temp.d(17136), pg_temp.d(9109), '/media/demo/photo-04.svg', 'The audience on the floor', 'Demo artwork standing in for a photo: the audience on the floor, Night at the Stepwell 2024', 'Demo artwork', 4),
  (pg_temp.d(17137), pg_temp.d(9110), '/media/demo/photo-04.svg', 'Soundcheck', 'Demo artwork standing in for a photo: soundcheck, Dhrupad at Dawn 2025', 'Demo artwork', 1),
  (pg_temp.d(17138), pg_temp.d(9110), '/media/demo/photo-05.svg', 'First piece', 'Demo artwork standing in for a photo: first piece, Dhrupad at Dawn 2025', 'Demo artwork', 2),
  (pg_temp.d(17139), pg_temp.d(9110), '/media/demo/photo-06.svg', 'The audience on the floor', 'Demo artwork standing in for a photo: the audience on the floor, Dhrupad at Dawn 2025', 'Demo artwork', 3),
  (pg_temp.d(17140), pg_temp.d(9110), '/media/demo/photo-07.svg', 'Lanterns', 'Demo artwork standing in for a photo: lanterns, Dhrupad at Dawn 2025', 'Demo artwork', 4),
  (pg_temp.d(17141), pg_temp.d(9111), '/media/demo/photo-07.svg', 'First piece', 'Demo artwork standing in for a photo: first piece, Heritage After Dark 2025', 'Demo artwork', 1),
  (pg_temp.d(17142), pg_temp.d(9111), '/media/demo/photo-08.svg', 'The audience on the floor', 'Demo artwork standing in for a photo: the audience on the floor, Heritage After Dark 2025', 'Demo artwork', 2),
  (pg_temp.d(17143), pg_temp.d(9111), '/media/demo/photo-09.svg', 'Lanterns', 'Demo artwork standing in for a photo: lanterns, Heritage After Dark 2025', 'Demo artwork', 3),
  (pg_temp.d(17144), pg_temp.d(9111), '/media/demo/photo-10.svg', 'Between sets', 'Demo artwork standing in for a photo: between sets, Heritage After Dark 2025', 'Demo artwork', 4),
  (pg_temp.d(17145), pg_temp.d(9112), '/media/demo/photo-10.svg', 'The audience on the floor', 'Demo artwork standing in for a photo: the audience on the floor, Monsoon Sessions 2025', 'Demo artwork', 1),
  (pg_temp.d(17146), pg_temp.d(9112), '/media/demo/photo-11.svg', 'Lanterns', 'Demo artwork standing in for a photo: lanterns, Monsoon Sessions 2025', 'Demo artwork', 2),
  (pg_temp.d(17147), pg_temp.d(9112), '/media/demo/photo-12.svg', 'Between sets', 'Demo artwork standing in for a photo: between sets, Monsoon Sessions 2025', 'Demo artwork', 3),
  (pg_temp.d(17148), pg_temp.d(9112), '/media/demo/photo-13.svg', 'Encore', 'Demo artwork standing in for a photo: encore, Monsoon Sessions 2025', 'Demo artwork', 4),
  (pg_temp.d(17149), pg_temp.d(9113), '/media/demo/photo-13.svg', 'Lanterns', 'Demo artwork standing in for a photo: lanterns, Brass on the Lawns 2025', 'Demo artwork', 1),
  (pg_temp.d(17150), pg_temp.d(9113), '/media/demo/photo-14.svg', 'Between sets', 'Demo artwork standing in for a photo: between sets, Brass on the Lawns 2025', 'Demo artwork', 2),
  (pg_temp.d(17151), pg_temp.d(9113), '/media/demo/photo-15.svg', 'Encore', 'Demo artwork standing in for a photo: encore, Brass on the Lawns 2025', 'Demo artwork', 3),
  (pg_temp.d(17152), pg_temp.d(9113), '/media/demo/photo-16.svg', 'After the last song', 'Demo artwork standing in for a photo: after the last song, Brass on the Lawns 2025', 'Demo artwork', 4),
  (pg_temp.d(17153), pg_temp.d(9114), '/media/demo/photo-16.svg', 'Between sets', 'Demo artwork standing in for a photo: between sets, Sounds of the Deccan 2025', 'Demo artwork', 1),
  (pg_temp.d(17154), pg_temp.d(9114), '/media/demo/photo-17.svg', 'Encore', 'Demo artwork standing in for a photo: encore, Sounds of the Deccan 2025', 'Demo artwork', 2),
  (pg_temp.d(17155), pg_temp.d(9114), '/media/demo/photo-18.svg', 'After the last song', 'Demo artwork standing in for a photo: after the last song, Sounds of the Deccan 2025', 'Demo artwork', 3),
  (pg_temp.d(17156), pg_temp.d(9114), '/media/demo/photo-19.svg', 'The room before doors', 'Demo artwork standing in for a photo: the room before doors, Sounds of the Deccan 2025', 'Demo artwork', 4),
  (pg_temp.d(17157), pg_temp.d(9115), '/media/demo/photo-19.svg', 'Encore', 'Demo artwork standing in for a photo: encore, Courtyard Sessions 2026', 'Demo artwork', 1),
  (pg_temp.d(17158), pg_temp.d(9115), '/media/demo/photo-20.svg', 'After the last song', 'Demo artwork standing in for a photo: after the last song, Courtyard Sessions 2026', 'Demo artwork', 2),
  (pg_temp.d(17159), pg_temp.d(9115), '/media/demo/photo-21.svg', 'The room before doors', 'Demo artwork standing in for a photo: the room before doors, Courtyard Sessions 2026', 'Demo artwork', 3),
  (pg_temp.d(17160), pg_temp.d(9115), '/media/demo/photo-22.svg', 'Soundcheck', 'Demo artwork standing in for a photo: soundcheck, Courtyard Sessions 2026', 'Demo artwork', 4),
  (pg_temp.d(17161), pg_temp.d(9116), '/media/demo/photo-22.svg', 'After the last song', 'Demo artwork standing in for a photo: after the last song, Rhythm at the Stepwell 2026', 'Demo artwork', 1),
  (pg_temp.d(17162), pg_temp.d(9116), '/media/demo/photo-23.svg', 'The room before doors', 'Demo artwork standing in for a photo: the room before doors, Rhythm at the Stepwell 2026', 'Demo artwork', 2),
  (pg_temp.d(17163), pg_temp.d(9116), '/media/demo/photo-24.svg', 'Soundcheck', 'Demo artwork standing in for a photo: soundcheck, Rhythm at the Stepwell 2026', 'Demo artwork', 3),
  (pg_temp.d(17164), pg_temp.d(9116), '/media/demo/photo-01.svg', 'First piece', 'Demo artwork standing in for a photo: first piece, Rhythm at the Stepwell 2026', 'Demo artwork', 4),
  (pg_temp.d(17165), pg_temp.d(9117), '/media/demo/portrait-rukhsana-begum.svg', 'Rukhsana Begum', 'Demo monogram portrait for Rukhsana Begum', 'Tangy archive (demo)', 1),
  (pg_temp.d(17166), pg_temp.d(9117), '/media/demo/portrait-the-lantern-quartet.svg', 'The Lantern Quartet', 'Demo monogram portrait for The Lantern Quartet', 'Tangy archive (demo)', 2),
  (pg_temp.d(17167), pg_temp.d(9117), '/media/demo/portrait-rafiq-ansari.svg', 'Rafiq Ansari', 'Demo monogram portrait for Rafiq Ansari', 'Tangy archive (demo)', 3),
  (pg_temp.d(17168), pg_temp.d(9117), '/media/demo/portrait-meghna-pillai.svg', 'Meghna Pillai', 'Demo monogram portrait for Meghna Pillai', 'Tangy archive (demo)', 4),
  (pg_temp.d(17169), pg_temp.d(9117), '/media/demo/portrait-banyan-drum-circle.svg', 'Banyan Drum Circle', 'Demo monogram portrait for Banyan Drum Circle', 'Tangy archive (demo)', 5),
  (pg_temp.d(17170), pg_temp.d(9117), '/media/demo/portrait-farhan-and-the-deccan-strings.svg', 'Farhan & the Deccan Strings', 'Demo monogram portrait for Farhan & the Deccan Strings', 'Tangy archive (demo)', 6),
  (pg_temp.d(17171), pg_temp.d(9118), '/media/demo/photo-07.svg', 'At the gate', 'Demo artwork standing in for a photo: at the gate', 'Tangy archive (demo)', 1),
  (pg_temp.d(17172), pg_temp.d(9118), '/media/demo/photo-08.svg', 'Chai station', 'Demo artwork standing in for a photo: chai station', 'Tangy archive (demo)', 2),
  (pg_temp.d(17173), pg_temp.d(9118), '/media/demo/photo-09.svg', 'Carrying rugs', 'Demo artwork standing in for a photo: carrying rugs', 'Tangy archive (demo)', 3),
  (pg_temp.d(17174), pg_temp.d(9118), '/media/demo/photo-10.svg', 'Briefing', 'Demo artwork standing in for a photo: briefing', 'Tangy archive (demo)', 4),
  (pg_temp.d(17175), pg_temp.d(9118), '/media/demo/photo-11.svg', 'Lighting the lamps', 'Demo artwork standing in for a photo: lighting the lamps', 'Tangy archive (demo)', 5),
  (pg_temp.d(17176), pg_temp.d(9118), '/media/demo/photo-12.svg', 'Packing up', 'Demo artwork standing in for a photo: packing up', 'Tangy archive (demo)', 6),
  (pg_temp.d(17177), pg_temp.d(9119), '/media/gallery/tangy4.jpg', 'Evening at the stepwell', 'A stepwell venue lit for an evening session', 'Tangy archive (demo)', 1),
  (pg_temp.d(17178), pg_temp.d(9119), '/media/gallery/tangy5.jpg', 'Petals on the water', 'Flower petals floating in a stepwell pool', 'Tangy archive (demo)', 2),
  (pg_temp.d(17179), pg_temp.d(9119), '/media/demo/photo-15.svg', 'Banyan roots', 'Demo artwork standing in for a photo: banyan roots', 'Tangy archive (demo)', 3),
  (pg_temp.d(17180), pg_temp.d(9119), '/media/demo/photo-16.svg', 'Terrace parapet', 'Demo artwork standing in for a photo: terrace parapet', 'Tangy archive (demo)', 4),
  (pg_temp.d(17181), pg_temp.d(9119), '/media/demo/photo-17.svg', 'Baradari arches', 'Demo artwork standing in for a photo: baradari arches', 'Tangy archive (demo)', 5),
  (pg_temp.d(17182), pg_temp.d(9119), '/media/demo/photo-18.svg', 'Haveli doorway', 'Demo artwork standing in for a photo: haveli doorway', 'Tangy archive (demo)', 6);

-- Tangy TV (local video files; no external links)
insert into tv_videos (id, slug, title, description, video_url, thumbnail_url, duration_seconds, category, event_id, in_player, featured, sort_order, status, published_at) values
  (pg_temp.d(7101), 'roots-and-resonance-2023-live-jugalbandi', 'Roots & Resonance 2023 — Live jugalbandi', 'Live jugalbandi from Roots & Resonance (2023). Demo recording record.', '/media/background-video/Video-22402.mp4', '/media/demo/cover-02.svg', 1260, 'Live sessions', pg_temp.d(3106), true, false, 30, 'published', '2023-03-11'::date::timestamptz + interval '7 days'),
  (pg_temp.d(7102), 'monsoon-sessions-2023-rain-set', 'Monsoon Sessions 2023 — Rain set', 'Rain set from Monsoon Sessions (2023). Demo recording record.', '/media/background-video/Video-22653.mp4', '/media/demo/cover-05.svg', 980, 'Live sessions', pg_temp.d(3107), true, false, 31, 'published', '2023-07-29'::date::timestamptz + interval '8 days'),
  (pg_temp.d(7103), 'deccan-resonance-2024-full-night-highlights', 'Deccan Resonance 2024 — Full night highlights', 'Full night highlights from Deccan Resonance (2024). Demo recording record.', '/media/background-video/Video-37256.mp4', '/media/demo/cover-03.svg', 640, 'Highlights', pg_temp.d(3114), true, false, 32, 'published', '2024-09-21'::date::timestamptz + interval '9 days'),
  (pg_temp.d(7104), 'night-at-the-stepwell-2024-the-last-song', 'Night at the Stepwell 2024 — The last song', 'The last song from Night at the Stepwell (2024). Demo recording record.', '/media/background-video/Video-46723.mp4', '/media/demo/cover-09.svg', 420, 'Live sessions', pg_temp.d(3115), true, false, 33, 'published', '2024-11-30'::date::timestamptz + interval '10 days'),
  (pg_temp.d(7105), 'dhrupad-at-dawn-2025-dawn-raga', 'Dhrupad at Dawn 2025 — Dawn raga', 'Dawn raga from Dhrupad at Dawn (2025). Demo recording record.', '/media/background-video/Video-63639.mp4', '/media/demo/cover-02.svg', 1500, 'Live sessions', pg_temp.d(3116), true, false, 34, 'published', '2025-01-18'::date::timestamptz + interval '11 days'),
  (pg_temp.d(7106), 'heritage-after-dark-2025-lantern-set', 'Heritage After Dark 2025 — Lantern set', 'Lantern set from Heritage After Dark (2025). Demo recording record.', '/media/background-video/Video-66802.mp4', '/media/demo/cover-07.svg', 1140, 'Live sessions', pg_temp.d(3117), true, false, 35, 'published', '2025-03-08'::date::timestamptz + interval '12 days'),
  (pg_temp.d(7107), 'monsoon-sessions-2025-power-cut-qawwali', 'Monsoon Sessions 2025 — Power cut qawwali', 'Power cut qawwali from Monsoon Sessions (2025). Demo recording record.', '/media/background-video/Video-76353.mp4', '/media/demo/cover-10.svg', 860, 'Live sessions', pg_temp.d(3119), false, true, 36, 'published', '2025-07-26'::date::timestamptz + interval '13 days'),
  (pg_temp.d(7108), 'brass-on-the-lawns-2025-brass-on-the-lawns', 'Brass on the Lawns 2025 — Brass on the lawns', 'Brass on the lawns from Brass on the Lawns (2025). Demo recording record.', '/media/background-video/Video-22402.mp4', '/media/demo/cover-10.svg', 300, 'Highlights', pg_temp.d(3120), false, false, 37, 'published', '2025-09-13'::date::timestamptz + interval '14 days'),
  (pg_temp.d(7109), 'sounds-of-the-deccan-2025-rabab-and-sarod', 'Sounds of the Deccan 2025 — Rabab & sarod', 'Rabab & sarod from Sounds of the Deccan (2025). Demo recording record.', '/media/background-video/Video-22653.mp4', '/media/demo/cover-09.svg', 1320, 'Live sessions', pg_temp.d(3121), false, false, 38, 'published', '2025-11-22'::date::timestamptz + interval '15 days'),
  (pg_temp.d(7110), 'courtyard-sessions-2026-courtyard-jazz', 'Courtyard Sessions 2026 — Courtyard jazz', 'Courtyard jazz from Courtyard Sessions (2026). Demo recording record.', '/media/background-video/Video-37256.mp4', '/media/demo/cover-12.svg', 900, 'Live sessions', pg_temp.d(3123), false, false, 39, 'published', '2026-03-14'::date::timestamptz + interval '16 days'),
  (pg_temp.d(7111), 'rhythm-at-the-stepwell-2026-behind-the-circle', 'Rhythm at the Stepwell 2026 — Behind the circle', 'Behind the circle from Rhythm at the Stepwell (2026). Demo recording record.', '/media/background-video/Video-46723.mp4', '/media/demo/cover-04.svg', 360, 'Behind the scenes', pg_temp.d(3124), false, false, 40, 'published', '2026-05-16'::date::timestamptz + interval '17 days'),
  (pg_temp.d(7112), 'sunrise-ambient-2026-sunrise-rough-cut', 'Sunrise Ambient 2026 — Sunrise — rough cut', 'Sunrise — rough cut from Sunrise Ambient (2026). Demo recording record.', '/media/background-video/Video-63639.mp4', '/media/demo/cover-08.svg', 540, 'Behind the scenes', pg_temp.d(3122), false, false, 41, 'draft', null),
  (pg_temp.d(7113), 'city-in-concert-2023-year-end-2023-old-cut', 'City in Concert 2023 — Year-end 2023 (old cut)', 'Year-end 2023 (old cut) from City in Concert (2023). Demo recording record.', '/media/background-video/Video-66802.mp4', '/media/demo/cover-01.svg', 480, 'Highlights', pg_temp.d(3109), false, false, 42, 'archived', '2023-12-16'::date::timestamptz + interval '19 days');

-- diary
insert into diary_posts (id, slug, title, excerpt, body, cover_url, location, author_name, tags, event_id, status, published_at) values
  (pg_temp.d(8101), 'behind-the-stepwell', 'Behind the Stepwell', 'How a stepwell full of debris became a concert hall for forty-five people.', 'It took six weekends to clear the steps.

We tested the sound with a single tabla: one stroke and the stone answered for three seconds. That was the whole pitch.', '/media/demo/cover-06.svg', 'Stepwell Pavilion', 'Tangy team', array['behind the scenes', 'venues']::text[], pg_temp.d(3101), 'published', '2022-02-12'::date::timestamptz + interval '5 days'),
  (pg_temp.d(8102), 'building-a-session', 'Building a Session', 'What happens between booking a courtyard and the first note.', 'A Tangy night starts eight weeks out: venue walk, acoustic test, the artists’ first visit, a lighting plan with no floodlights.

The last thing we decide is the running order.', '/media/demo/cover-03.svg', 'Chowmahalla Courtyard', 'Maya Iyer (demo)', array['behind the scenes']::text[], pg_temp.d(3106), 'published', '2023-03-11'::date::timestamptz + interval '6 days'),
  (pg_temp.d(8103), 'notes-from-the-courtyard', 'Notes from the Courtyard', 'Field notes from a spring evening at Chowmahalla.', 'The oud started before the sun was fully down.

By the third piece the pigeons had settled and the courtyard was the quietest it had been all day.', '/media/demo/cover-05.svg', 'Chowmahalla Courtyard', 'Nikhil Rao (demo)', array['field notes']::text[], pg_temp.d(3111), 'published', '2024-04-13'::date::timestamptz + interval '7 days'),
  (pg_temp.d(8104), 'the-people-behind-tangy', 'The People Behind Tangy', 'The gate team, the chai station and the sound desk.', 'Every night needs around twenty people who are not on stage.

This is about them — the volunteers who check tickets, pour chai and carry rugs at midnight.', '/media/demo/cover-09.svg', 'Stepwell Pavilion', 'Tangy team', array['people']::text[], pg_temp.d(3115), 'published', '2024-11-30'::date::timestamptz + interval '8 days'),
  (pg_temp.d(8105), 'why-heritage-spaces-matter', 'Why Heritage Spaces Matter', 'Old stone carries sound better than any hall we could afford.', 'We did not choose heritage spaces for the photographs.

We chose them because a 400-year-old courtyard was designed for voices without microphones.', '/media/demo/cover-05.svg', 'Taramati Baradari Pavilion', 'Maya Iyer (demo)', array['essays']::text[], pg_temp.d(3114), 'published', '2024-09-21'::date::timestamptz + interval '9 days'),
  (pg_temp.d(8106), 'a-night-under-the-banyan', 'A Night Under the Banyan', 'The power cut at 9:12, and the qawwali that kept going.', 'The lights went out mid-verse. Zoya did not stop; the chorus clapped louder.

When the generator came back nobody wanted it.', '/media/demo/cover-09.svg', 'Shamirpet Banyan Grove', 'Nikhil Rao (demo)', array['stories', 'monsoon']::text[], pg_temp.d(3119), 'published', '2025-07-26'::date::timestamptz + interval '10 days'),
  (pg_temp.d(8107), 'inside-the-archive', 'Inside the Archive', 'Tapes, posters and ticket stubs from the first seasons.', 'The archive is three steel cupboards and a spreadsheet.

We have every poster since 2022 and most of the tapes.', '/media/demo/cover-07.svg', 'Taramati Baradari Pavilion', 'Tangy team', array['archive']::text[], pg_temp.d(3104), 'published', '2022-11-19'::date::timestamptz + interval '11 days'),
  (pg_temp.d(8108), 'artist-notes-ananya-rao', 'Artist Notes: Ananya Rao', 'The violinist on playing to lanterns.', 'Ananya asked for the lights to be lowered again during soundcheck.

“The violin listens differently in the dark,” she said.', '/media/demo/cover-09.svg', 'Chowmahalla Courtyard', 'Maya Iyer (demo)', array['artist notes']::text[], pg_temp.d(3117), 'published', '2025-03-08'::date::timestamptz + interval '12 days'),
  (pg_temp.d(8109), 'artist-notes-kabir-sethi', 'Artist Notes: Kabir Sethi', 'On teaching sixty people a theka in four minutes.', 'Kabir starts every circle the same way: slow, and with a joke.

By the third cycle the steps are clapping back.', '/media/demo/cover-02.svg', 'Stepwell Pavilion', 'Nikhil Rao (demo)', array['artist notes']::text[], pg_temp.d(3124), 'published', '2026-05-16'::date::timestamptz + interval '13 days'),
  (pg_temp.d(8110), 'dawn-is-a-venue', 'Dawn Is a Venue', 'Why we keep doing 5:30 AM concerts.', 'At dawn the city is quiet enough to hear a tanpura from the gate.

Fifty-four people came. Most of them stayed for breakfast.', '/media/demo/cover-07.svg', 'Stepwell Pavilion', 'Tangy team', array['essays', 'dawn']::text[], pg_temp.d(3116), 'published', '2025-01-18'::date::timestamptz + interval '14 days'),
  (pg_temp.d(8111), 'brass-and-the-neighbours', 'Brass and the Neighbours', 'How we told the neighbourhood a brass band was coming.', 'We knocked on forty doors with sweets and a flyer.

Three neighbours came. One brought a trumpet.', '/media/demo/cover-01.svg', 'Qutb Shahi Stepwell Lawns', 'Maya Iyer (demo)', array['behind the scenes']::text[], pg_temp.d(3120), 'published', '2025-09-13'::date::timestamptz + interval '15 days'),
  (pg_temp.d(8112), 'the-poetry-night', 'The Poetry Night', 'Spoken word and ghazal in a family haveli.', 'Saba read for twenty minutes; Rukhsana sang between the poems.

The host family served chai from their own kitchen.', '/media/demo/cover-06.svg', 'Old City Haveli Courtyard', 'Nikhil Rao (demo)', array['stories']::text[], pg_temp.d(3118), 'published', '2025-04-12'::date::timestamptz + interval '16 days'),
  (pg_temp.d(8113), 'sunrise-ambient-notes', 'Sunrise Ambient — Notes', 'Drones, birds and the first light on the stepwell lawns.', 'Yamini started the drone at 6:02.

The birds joined at 6:10, which was not on the running order.', '/media/demo/cover-09.svg', 'Qutb Shahi Stepwell Lawns', 'Tangy team', array['field notes', 'dawn']::text[], pg_temp.d(3122), 'published', '2026-01-10'::date::timestamptz + interval '17 days'),
  (pg_temp.d(8114), 'what-we-learned-in-2024', 'What We Learned in 2024', 'A flooded grove, a cancelled night and the programme that replaced it.', 'Monsoon 2024 was cancelled two days out.

We refunded everyone and folded the artists into Deccan Resonance. It became our biggest night.', '/media/demo/cover-05.svg', 'Shamirpet Banyan Grove', 'Maya Iyer (demo)', array['archive', 'essays']::text[], pg_temp.d(3113), 'published', '2024-08-03'::date::timestamptz + interval '18 days'),
  (pg_temp.d(8115), 'courtyard-jazz', 'Courtyard Jazz', 'A jazz trio and a stone courtyard.', 'Rhea sang standards and one Konkani song.

The courtyard turned the double bass into something that sounded like a building.', '/media/demo/cover-05.svg', 'Chowmahalla Courtyard', 'Nikhil Rao (demo)', array['stories']::text[], pg_temp.d(3123), 'published', '2026-03-14'::date::timestamptz + interval '19 days');

-- announcements
insert into announcements (id, title, body, category, character, destination, audience, priority, status, publish_at, expire_at, author_id) values
  (pg_temp.d(2601), 'The archive is open', 'Browse every past session, programme, gallery and Tangy TV recording since 2022.', 'ARCHIVE', 'violinist', '/archive', 'all', 'normal', 'published', now() + interval '-5 days', now() + interval '55 days', pg_temp.d(101)),
  (pg_temp.d(2602), 'Volunteers wanted for the winter season', 'Gate, chai station and stage crew — no experience needed. Apply to volunteer.', 'VOLUNTEER', 'violinist', '/volunteer/apply', 'all', 'normal', 'published', now() + interval '-3 days', now() + interval '57 days', pg_temp.d(101)),
  (pg_temp.d(2603), 'Season 2026 programme published', 'The full 2026 programme — sunrise sets, courtyards, the stepwell and what is on sale now.', 'PROGRAMME', 'violinist', '/archive/programmes/season-2026', 'all', 'normal', 'published', now() + interval '-8 days', now() + interval '52 days', pg_temp.d(101)),
  (pg_temp.d(2604), 'New venue: Taramati Baradari Pavilion (demo)', 'Twelve arches on a hill — our largest acoustic venue returns for the autumn.', 'VENUE', 'violinist', '/sessions', 'all', 'normal', 'published', now() + interval '-12 days', now() + interval '48 days', pg_temp.d(101)),
  (pg_temp.d(2605), 'Monsoon Sessions 2025 — the recordings', 'The power-cut qawwali is now on Tangy TV.', 'ARCHIVE', 'violinist', '/tv', 'all', 'normal', 'published', now() + interval '-20 days', now() + interval '40 days', pg_temp.d(101)),
  (pg_temp.d(2606), 'Photo walk: Tangy Spaces', 'A new album of our venues by daylight.', 'ARCHIVE', 'violinist', '/gallery/tangy-spaces', 'all', 'normal', 'published', now() + interval '-25 days', now() + interval '35 days', pg_temp.d(101)),
  (pg_temp.d(2607), 'Artist applications for 2027', 'Draft — opens once the 2027 dates are confirmed.', 'GENERAL', 'violinist', '/artist/register', 'all', 'normal', 'draft', now() + interval '15 days', now() + interval '75 days', pg_temp.d(101)),
  (pg_temp.d(2608), 'Courtyard Sessions 2026 recap', 'Photos, a recording and notes from the March courtyard night.', 'ARCHIVE', 'violinist', '/sessions/archive/courtyard-sessions-2026', 'all', 'normal', 'published', now() + interval '-30 days', now() + interval '30 days', pg_temp.d(101));

-- partners, volunteers and patrons (accounts created by scripts/demo-data.sh)
update profiles set role = 'sponsor' where id between pg_temp.d(124) and pg_temp.d(127);
update profiles set role = 'vendor' where id between pg_temp.d(134) and pg_temp.d(137);
update profiles set role = 'venue' where id between pg_temp.d(143) and pg_temp.d(145);
update profiles set role = 'volunteer' where id between pg_temp.d(190) and pg_temp.d(199);
insert into sponsor_profiles (id, organization_name, sponsorship_tier, website, contact_designation) values
  (pg_temp.d(124), 'Banyan Coffee Roasters (demo)', 'Associate', 'https://example.com/demo/banyan-coffee', 'Marketing lead'),
  (pg_temp.d(125), 'Stepwell Press (demo)', 'Community', 'https://example.com/demo/stepwell-press', 'Editor'),
  (pg_temp.d(126), 'Deccan Radio 90.4 (demo)', 'Presenting', 'https://example.com/demo/deccan-radio', 'Station head'),
  (pg_temp.d(127), 'Old City Ink (demo)', 'Community', 'https://example.com/demo/old-city-ink', 'Founder');
insert into vendor_profiles (id, business_name, category, phone, description) values
  (pg_temp.d(134), 'Lamp Lighters Co. (demo)', 'Decor', '+91 98480 00134', 'Brass lamps and lanterns for heritage nights.'),
  (pg_temp.d(135), 'Floor & Rug Rentals (demo)', 'Seating', '+91 98480 00135', 'Rugs, cushions and low chairs.'),
  (pg_temp.d(136), 'Irani Cafe Cart (demo)', 'Food & beverage', '+91 98480 00136', 'Osmania biscuits and Irani chai.'),
  (pg_temp.d(137), 'Poster Press Studio (demo)', 'Print', '+91 98480 00137', 'Screen-printed posters and tickets.');
insert into venue_profiles (id, property_name, location, capacity, description) values
  (pg_temp.d(143), 'Taramati Baradari Pavilion (demo)', 'Gandipet', 250, 'Hilltop pavilion host.'),
  (pg_temp.d(144), 'Qutb Shahi Stepwell Lawns (demo)', 'Ibrahim Bagh', 180, 'Stepwell lawns host.'),
  (pg_temp.d(145), 'Old City Haveli Courtyard (demo)', 'Shah Ali Banda', 120, 'Family haveli host.');
update venues set partner_profile_id = pg_temp.d(143) where id = pg_temp.d(2101);
update venues set partner_profile_id = pg_temp.d(144) where id = pg_temp.d(2102);
update venues set partner_profile_id = pg_temp.d(145) where id = pg_temp.d(2103);
insert into volunteer_profiles (id, availability, skills, emergency_contact)
select pg_temp.d(n), (array['Weekends', 'Evenings', 'Flexible'])[1 + n % 3], (array['Gate check-in', 'Hospitality', 'Photography', 'Stage crew', 'Chai station'])[1 + n % 5], '+91 98480 9' || lpad(n::text, 4, '0')
from generate_series(190, 199) n;
insert into event_assignments (event_id, assignee_role, assignee_id, title, status, assigned_by)
select pg_temp.d(301 + n % 3), 'volunteer', pg_temp.d(190 + n), (array['Gate', 'Chai station', 'Seating', 'Stage crew'])[1 + n % 4], 'confirmed', pg_temp.d(101)
from generate_series(0, 9) n;
-- Monsoon Sessions (sold out): eight more people waiting, in order.
insert into waitlist (id, event_id, user_id, name, email, quantity, status, created_at)
select pg_temp.d(1110 + n), pg_temp.d(303), p.id, p.full_name, p.email, 1 + n % 3, 'waiting', now() - make_interval(hours => 60 - n * 6)
from generate_series(0, 7) n join profiles p on p.id = pg_temp.d(180 + n);


commit;
\o
