-- ============================================================================
-- TANGY WORLD — LOCAL DEMO: ARTIST PORTAL (NOT PRODUCTION DATA)
--
-- Loaded after demo_seed_history.sql by scripts/demo-data.sh seed (LOCAL only,
-- needs migrations 0032 / 0033). Fictional applicants and booking requests so
-- the artist portal and the admin review screens can be reviewed:
--   * 12 artist applications in every state (draft → approved / rejected /
--     withdrawn), each with a private demo performance video
--     (public/media/demo/demo-performance.mp4 — a title card, not a person)
--   * 16 booking requests for the four demo artists with portal accounts:
--     4 pending (1 viewed), 5 accepted (2 confirmed), 2 declined, 4 completed,
--     1 draft (team-only)
--   * availability (incl. one conflict) and artist media in every review state
-- Accounts 200–211 are created by the script; ids use the demo prefix.
-- ============================================================================
\set ON_ERROR_STOP 1
\o /dev/null
begin;
create function pg_temp.d(n bigint) returns uuid language sql immutable
as $$ select ('de300000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid $$;
create function pg_temp.at(days int, hhmm text) returns timestamptz language sql stable
as $$ select ((current_date + days)::text || ' ' || hhmm)::timestamp at time zone 'Asia/Kolkata' $$;
create function pg_temp.on_day(e int, hhmm text) returns timestamptz language sql stable
as $$ select ((select event_date from events where id = pg_temp.d(e))::text || ' ' || hhmm)::timestamp at time zone 'Asia/Kolkata' $$;

-- ---------------------------------------------------------------- applications
-- One helper builds the step data so every application can be reviewed end to end.
create function pg_temp.app_data(p_name text, p_stage text, p_email text, p_city text, p_type text, p_genre text, p_instr text[], p_langs text[],
                                 p_bio text, p_years int, p_level text, p_ig text, p_sp text)
returns jsonb language sql immutable as $$
  select jsonb_build_object(
    'about', jsonb_build_object('full_name', p_name, 'stage_name', p_stage, 'email', p_email, 'phone', '+91 98480 2' || right(md5(p_email), 4),
                                'whatsapp', '', 'city', p_city, 'country', 'India', 'website', ''),
    'artistry', jsonb_build_object('artist_type', p_type, 'primary_genre', p_genre, 'genres', to_jsonb(array[p_genre]), 'sub_genres', '',
                                   'instruments', to_jsonb(p_instr), 'other_instruments', '', 'languages', to_jsonb(p_langs), 'style', 'Acoustic, unhurried, made for stone rooms.',
                                   'short_bio', p_bio, 'long_bio', p_bio || ' (Demo applicant — fictional.)', 'years_active', p_years::text, 'experience_level', p_level),
    'experience', jsonb_build_object('years_performing', p_years::text, 'performance_count', (p_years * 12)::text, 'venues', 'Cafés, college fests and house concerts (demo)',
                                     'festivals', '', 'cultural_events', '', 'collaborations', '', 'played_tangy', 'No', 'tangy_event', '',
                                     'highlights', jsonb_build_array(jsonb_build_object('venue', 'A courtyard café (demo)', 'event', 'Monsoon evening', 'year', '2025', 'type', 'Acoustic set'))),
    'online', jsonb_build_object('instagram', p_ig, 'spotify', p_sp, 'youtube', '', 'soundcloud', '', 'website', '', 'other', '',
                                 'instagram_followers', (p_years * 900)::text, 'spotify_monthly_listeners', case when p_sp <> '' then (p_years * 400)::text else '' end, 'youtube_subscribers', ''),
    'media', jsonb_build_object('title', 'Live set (demo)', 'recorded_at', 'A courtyard café (demo)', 'recorded_on', '2025-11', 'performance_type', 'Acoustic set',
                                'description', 'Demo performance video — a title card, not a real performance.', 'second_video_url', '', 'photo_paths', '[]'::jsonb, 'epk_path', ''),
    'technical', jsonb_build_object('format', 'Solo', 'set_duration', '45 min', 'requirements', '["Microphones","Monitors"]'::jsonb, 'own_equipment', 'Partially', 'rider', '2 vocal mics, 1 DI', 'rider_path', ''),
    'hospitality', jsonb_build_object('travel_origin', p_city, 'members', '1', 'accommodation', case when p_city = 'Hyderabad' then 'No' else 'Yes' end, 'travel_assistance', 'No', 'requirements', '', 'food', 'Vegetarian'),
    'availability', jsonb_build_object('typical', 'Weekends', 'preferred_days', '["Fri","Sat","Sun"]'::jsonb, 'unavailable_dates', '', 'notice', '2 weeks', 'last_minute', 'Yes',
                                       'travel_radius', 'Within India', 'preferred_cities', 'Hyderabad, Bengaluru'));
$$;

create temp table demo_apps (n int, uid int, name text, stage text, city text, kind text, genre text, instr text[], langs text[], bio text, years int, lvl text, ig text, sp text, status text);
insert into demo_apps values
  (5201, 200, 'Nila Varghese', 'Nila', 'Kochi', 'Vocalist', 'Folk', array['Vocals'], array['Malayalam', 'English'], 'Sings Malabar folk songs with a shruti box and very little else.', 4, 'Emerging', '@nila.sings.demo', '', 'submitted'),
  (5202, 201, 'Arif Lodhi', 'Arif Lodhi', 'Hyderabad', 'Instrumentalist', 'Hindustani', array['Sitar'], array['Hindustani', 'Urdu'], 'Sitar player trained in the Imdadkhani style; plays long evening alaps.', 9, 'Professional', '@arif.sitar.demo', 'https://open.spotify.com/artist/demo-arif', 'submitted'),
  (5203, 202, 'Mehr Collective', 'Mehr Collective', 'Delhi', 'Ensemble', 'Sufi', array['Vocals', 'Harmonium', 'Tabla'], array['Urdu', 'Punjabi'], 'A five-piece Sufi ensemble singing Bulleh Shah and Amir Khusrau.', 6, 'Established', '@mehr.collective.demo', '', 'submitted'),
  (5204, 203, 'Kartik Iyengar', 'Kartik Iyengar', 'Chennai', 'Instrumentalist', 'Carnatic', array['Veena'], array['Tamil', 'Telugu'], 'Veena player who plays slow ragam-tanam-pallavi sets.', 12, 'Professional', '@kartik.veena.demo', 'https://open.spotify.com/artist/demo-kartik', 'under_review'),
  (5205, 204, 'Ritika Sen', 'Ritika Sen', 'Kolkata', 'Vocalist', 'Indie', array['Vocals', 'Guitar'], array['Bengali', 'English'], 'Writes Bengali-English songs about trams, rain and leaving home.', 5, 'Emerging', '@ritika.sen.demo', 'https://open.spotify.com/artist/demo-ritika', 'under_review'),
  (5206, 205, 'The Monsoon Ragas', 'The Monsoon Ragas', 'Pune', 'Band', 'Fusion', array['Guitar', 'Tabla', 'Bass'], array['Hindi', 'Marathi'], 'A raga-rock trio playing monsoon ragas with an electric guitar.', 7, 'Established', '@monsoonragas.demo', '', 'needs_information'),
  (5207, 206, 'Dev Bhaskar', 'DJ Dev B', 'Bengaluru', 'DJ', 'Electronic', array['Electronics'], array['Instrumental'], 'Ambient-leaning DJ sets built on field recordings and tanpura.', 3, 'Emerging', '@devb.demo', '', 'needs_information'),
  (5208, 207, 'Pranav Joshi', 'Pranav Joshi', 'Hyderabad', 'Instrumentalist', 'Hindustani', array['Bansuri'], array['Hindustani'], 'Bansuri player who prefers rooms with an echo.', 10, 'Professional', '@pranav.bansuri.demo', 'https://open.spotify.com/artist/demo-pranav', 'approved'),
  (5209, 208, 'Sana and the Lanterns', 'Sana & the Lanterns', 'Hyderabad', 'Band', 'Ghazal', array['Vocals', 'Harmonium', 'Violin'], array['Urdu'], 'Ghazals arranged for violin and harmonium, sung in a small room.', 8, 'Established', '@sana.lanterns.demo', '', 'approved'),
  (5210, 209, 'Ishaan Mehra', 'Ishaan Mehra', 'Mumbai', 'Solo Artist', 'Electronic', array['Electronics'], array['Instrumental'], 'Techno producer — loud, club-focused sets.', 4, 'Emerging', '@ishaan.mehra.demo', '', 'rejected'),
  (5211, 210, 'Leena Fernandes', 'Leena', 'Goa', 'Vocalist', 'Jazz', array['Vocals'], array['Konkani', 'English'], 'Jazz standards and Konkani songs with a trio.', 6, 'Established', '@leena.jazz.demo', '', 'withdrawn'),
  (5212, 211, 'Omkar Patil', 'Omkar Patil', 'Nashik', 'Instrumentalist', 'Percussion', array['Tabla'], array['Marathi'], 'Tabla player — draft application, not yet submitted.', 2, 'Emerging', '', '', 'draft');

-- Artist records for everything past draft (status follows the application).
insert into artists (id, user_id, name, stage_name, slug, email, genre, city, bio, long_bio, instagram, spotify, performance_type, experience_level,
                     country, languages, instruments, genres, years_active, avatar_url, status, applied_at, reviewed_at, reviewed_by, decision_reason)
select pg_temp.d(a.n - 1000), pg_temp.d(a.uid), a.name, a.stage, 'demo-applicant-' || a.uid, p.email, a.genre, a.city, a.bio, a.bio || ' (Demo applicant — fictional.)',
       nullif(a.ig, ''), nullif(a.sp, ''), a.kind, a.lvl, 'India', a.langs, a.instr, array[a.genre], a.years, null,
       (case when a.status = 'approved' then 'approved' when a.status = 'rejected' then 'rejected' else 'pending' end)::application_status,
       now() - make_interval(days => 40 - (a.n - 5200) * 3),
       case when a.status in ('approved', 'rejected') then now() - interval '5 days' end,
       case when a.status in ('approved', 'rejected') then pg_temp.d(101) end,
       case when a.status = 'rejected' then 'Thank you — our rooms are acoustic-only, so this isn''t a fit right now.' end
from demo_apps a join profiles p on p.id = pg_temp.d(a.uid)
where a.status <> 'draft';
update profiles set role = 'artist' where id in (pg_temp.d(207), pg_temp.d(208));

insert into artist_applications (id, user_id, artist_id, status, data, current_step, video_storage_path, media_consent, accuracy_confirmed,
                                 info_request, public_message, submitted_at, decided_at, created_at)
select pg_temp.d(a.n), pg_temp.d(a.uid), case when a.status <> 'draft' then pg_temp.d(a.n - 1000) end, a.status,
       pg_temp.app_data(a.name, a.stage, p.email, a.city, a.kind, a.genre, a.instr, a.langs, a.bio, a.years, a.lvl, a.ig, a.sp),
       case when a.status = 'draft' then 3 else 8 end,
       case when a.status <> 'draft' then 'applications/' || pg_temp.d(a.uid) || '/demo-performance.mp4' end,
       a.status <> 'draft', a.status <> 'draft',
       case when a.status = 'needs_information' then jsonb_build_object('items', '["Technical rider required","Additional experience details"]'::jsonb,
            'message', 'Lovely video! Could you add your rider and two recent venues?', 'requested_at', now() - interval '2 days') end,
       case when a.status = 'rejected' then 'Thank you — our rooms are acoustic-only, so this isn''t a fit right now.' end,
       case when a.status <> 'draft' then now() - make_interval(days => 40 - (a.n - 5200) * 3) end,
       case when a.status in ('approved', 'rejected') then now() - interval '5 days' end,
       now() - make_interval(days => 45 - (a.n - 5200) * 3)
from demo_apps a join profiles p on p.id = pg_temp.d(a.uid);
insert into artist_private_profiles (artist_id, phone) values (pg_temp.d(4207), '+91 98480 20207'), (pg_temp.d(4208), '+91 98480 20208') on conflict do nothing;

-- Internal review notes (reviewers only).
insert into application_reviews (source_table, source_id, notes, tags, assessment, updated_by) values
  ('artist_applications', pg_temp.d(5204), 'Strong veena player; check the stepwell can take a seated set.', array['Recommended', 'Experienced'], '{"experience":"Strong","media_quality":"Adequate","technical":"Strong"}', pg_temp.d(101)),
  ('artist_applications', pg_temp.d(5206), 'Good energy; need rider before deciding.', array['Performance style'], '{"technical":"Weak"}', pg_temp.d(101)),
  ('artist_applications', pg_temp.d(5210), 'Club techno — not a fit for acoustic rooms.', array['New'], '{"experience":"Adequate"}', pg_temp.d(101));

-- ---------------------------------------------------------------- booking requests
-- Artists 401–404 have portal accounts (ananya.rao@, kabir.sethi@, charminar.collective@, zoya.qadri@).
create function pg_temp.req(p_n int, p_event int, p_artist int, p_status text, p_type text, p_minutes int, p_call text, p_start text, p_fee int, p_msg text,
                            p_viewed boolean default false, p_reason text default null)
returns void language sql as $$
  insert into assignment_requests (id, session_id, artist_id, requested_by, status, message, proposed_start, proposed_end, fee_offer, expires_at,
                                   performance_type, set_minutes, sets_count, call_time, soundcheck_at, technical_notes, hospitality_notes,
                                   viewed_at, confirmed_at, completed_at, responded_at, decline_reason, created_at)
  values (pg_temp.d(p_n), pg_temp.d(p_event), pg_temp.d(p_artist), pg_temp.d(101), p_status::assignment_status, p_msg,
          pg_temp.on_day(p_event, p_start), pg_temp.on_day(p_event, p_start) + make_interval(mins => p_minutes), p_fee,
          now() + interval '6 days', p_type, p_minutes, 1, pg_temp.on_day(p_event, p_call), pg_temp.on_day(p_event, p_call) + interval '30 minutes',
          'One vocal mic and one DI; we provide monitors.', 'Dinner after the set; green room on site.',
          case when p_viewed or p_status <> 'pending' then now() - interval '1 day' end,
          case when p_status = 'confirmed' then now() - interval '12 hours' end,
          case when p_status = 'completed' then (select event_date from events where id = pg_temp.d(p_event)) + interval '1 day' end,
          case when p_status in ('accepted', 'confirmed', 'declined', 'completed') then now() - interval '2 days' end,
          p_reason, now() - interval '5 days');
$$;
-- Pending (4; one already opened)
select pg_temp.req(5301, 307, 401, 'pending', 'Dawn set (violin)', 45, '04:45', '05:45', 18000, 'Would you open Dhrupad at Dawn with a short alap?', true);
select pg_temp.req(5302, 309, 402, 'pending', 'Live accompaniment', 60, '10:00', '11:00', 12000, 'Tabla for the kathak lab?');
select pg_temp.req(5303, 307, 403, 'pending', 'Folk set', 40, '05:00', '06:30', 30000, 'A closing folk set after the dhrupad.');
select pg_temp.req(5304, 308, 404, 'pending', 'Vocal demonstration', 30, '14:00', '15:00', 8000, 'Short qawwali demo for the field-recording workshop.');
-- Accepted (5; two confirmed) — they are on the line-up
select pg_temp.req(5305, 301, 401, 'confirmed', 'Acoustic set', 60, '16:30', '19:15', 25000, 'Heritage After Dark — opening set.');
select pg_temp.req(5306, 301, 403, 'accepted', 'Folk set', 45, '17:00', '20:30', 32000, 'Heritage After Dark — closing set.');
select pg_temp.req(5307, 302, 402, 'confirmed', 'Tabla circle', 90, '17:30', '18:30', 20000, 'Lead the circle again?');
select pg_temp.req(5308, 303, 404, 'accepted', 'Qawwali', 90, '18:00', '19:30', 40000, 'Monsoon Sessions headline.');
select pg_temp.req(5309, 310, 401, 'accepted', 'Guest set', 20, '18:00', '21:00', 10000, 'A short guest set with Noor Ensemble tonight.');
insert into event_artists (event_id, artist_id) values (pg_temp.d(310), pg_temp.d(401)) on conflict do nothing;
-- Declined (2)
select pg_temp.req(5310, 309, 404, 'declined', 'Vocal set', 30, '10:00', '11:30', 9000, 'A short set at the kathak lab?', true, 'Travelling for a family wedding that week.');
select pg_temp.req(5311, 308, 402, 'declined', 'Rhythm session', 45, '14:00', '16:00', 9000, 'Rhythm section for the workshop?', true, 'Teaching that afternoon — maybe next time.');
-- Completed (4) — past nights from the archive
select pg_temp.req(5312, 3117, 401, 'completed', 'Lantern set', 60, '16:30', '19:00', 22000, 'Heritage After Dark 2025.');
select pg_temp.req(5313, 3124, 402, 'completed', 'Tabla circle', 90, '17:00', '18:30', 18000, 'Rhythm at the Stepwell 2026.');
select pg_temp.req(5314, 3114, 403, 'completed', 'Folk set', 60, '17:00', '19:30', 28000, 'Deccan Resonance 2024.');
select pg_temp.req(5315, 3119, 404, 'completed', 'Qawwali', 90, '18:00', '19:30', 35000, 'Monsoon Sessions 2025.');
-- Draft (team-only; the artist never sees it)
select pg_temp.req(5316, 305, 403, 'draft', 'Folk set', 45, '15:00', '16:00', 20000, 'Draft — check the budget first.');

-- Logistics for the confirmed / accepted nights the artists see in their portal.
insert into event_artist_details (event_id, artist_id, call_time, soundcheck_at, performance_start, performance_end, instructions, fee_amount, fee_status, green_room, meals)
select r.session_id, r.artist_id, r.call_time, r.soundcheck_at, r.proposed_start, r.proposed_end, 'Arrive at the north gate; the team meets you there.', r.fee_offer,
       case when r.status = 'completed' then 'paid' else 'pending' end, 'On site', 'Dinner after the set'
from assignment_requests r where r.id between pg_temp.d(5305) and pg_temp.d(5315) and r.status in ('accepted', 'confirmed', 'completed')
on conflict (event_id, artist_id) do nothing;

-- ---------------------------------------------------------------- availability
insert into artist_availability (artist_id, date, status, note, start_time, end_time) values
  (pg_temp.d(401), current_date + 3, 'unavailable', 'Recording in Chennai', null, null),
  (pg_temp.d(401), current_date + 4, 'unavailable', 'Recording in Chennai', null, null),
  (pg_temp.d(401), current_date + 10, 'tentative', 'Might be travelling — will confirm', '16:00', '22:00'),
  (pg_temp.d(401), current_date + 14, 'available', null, null, null),
  (pg_temp.d(401), current_date + 15, 'available', null, null, null),
  (pg_temp.d(402), current_date + 5, 'unavailable', 'Teaching — booked in by mistake, please call', null, null),
  (pg_temp.d(402), current_date + 12, 'available', null, null, null),
  (pg_temp.d(404), current_date + 25, 'unavailable', 'Family wedding', null, null)
on conflict (artist_id, date) do update set status = excluded.status, note = excluded.note;

-- ---------------------------------------------------------------- artist media
insert into artist_media (id, artist_id, storage_path, file_name, file_size_bytes, mime_type, media_type, title, status, kind, description, tags, taken_on, event_id, performance_type, review_note) values
  (pg_temp.d(5401), pg_temp.d(401), pg_temp.d(401) || '/demo-live-set.mp4', 'demo-live-set.mp4', 51123, 'video/mp4', 'live_set', 'Live set — demo video', 'approved', 'video', 'Demo performance video (title card).', array['live', 'violin'], current_date - 60, pg_temp.d(3117), 'Acoustic set', null),
  (pg_temp.d(5402), pg_temp.d(401), pg_temp.d(401) || '/demo-venue.jpg', 'demo-venue.jpg', 120000, 'image/jpeg', 'image', 'Stepwell at dusk', 'under_review', 'photo', 'The venue before doors.', array['venue'], current_date - 20, null, null, null),
  (pg_temp.d(5403), pg_temp.d(402), pg_temp.d(402) || '/demo-live-set.mp4', 'demo-live-set.mp4', 51123, 'video/mp4', 'live_set', 'Tabla circle — demo video', 'approved', 'recording', 'Demo performance video (title card).', array['tabla'], current_date - 90, pg_temp.d(3124), 'Tabla circle', null),
  (pg_temp.d(5404), pg_temp.d(402), pg_temp.d(402) || '/demo-venue.jpg', 'demo-venue.jpg', 120000, 'image/jpeg', 'image', 'Rehearsal photo', 'rejected', 'photo', null, '{}', current_date - 30, null, null, 'Too dark — could you send a brighter one?'),
  (pg_temp.d(5405), pg_temp.d(403), pg_temp.d(403) || '/demo-venue.jpg', 'demo-venue.jpg', 120000, 'image/jpeg', 'image', 'Poster draft', 'uploaded', 'poster', 'Draft poster for the folk set.', array['poster'], null, null, null, null),
  (pg_temp.d(5406), pg_temp.d(404), pg_temp.d(404) || '/demo-live-set.mp4', 'demo-live-set.mp4', 51123, 'video/mp4', 'live_set', 'Qawwali — demo video', 'under_review', 'video', 'Demo performance video (title card).', array['qawwali'], current_date - 45, pg_temp.d(3119), 'Qawwali', null);

commit;
\o
