-- ============================================================================
-- TANGY WORLD — LOCAL DEMO: EVENT ↔ ARTIST WORKFLOW (NOT PRODUCTION DATA)
--
-- Loaded after demo_seed_artist_portal.sql by scripts/demo-data.sh seed
-- (LOCAL stack only). Every approved demo artist gets a calendar for the next
-- eight weeks (available / tentative / unavailable / unset days; some artists
-- deliberately haven't updated in a while), and seven review scenarios:
--   A  Ragas at Dusk            2 artists, both available
--   B  Folk & Fusion Night      3 artists, one tentative, two available
--   C  Monsoon Listening Room   draft; Kabir Sethi marked the date unavailable
--   D  Courtyard: New Voices    a pending session request (Kabir Sethi)
--   E  Stepwell Strings         an accepted request (Ananya Rao)
--   F  Old City Qawwali Night   cancelled — line-up kept as history
--   G  Winter Baithak           completed, last month
-- plus a private Super Admin ↔ artist conversation. Notifications are created
-- by the real triggers. Removed by demo_remove.sql (de300000- id prefix).
-- ============================================================================
\set ON_ERROR_STOP 1
\o /dev/null
begin;
create function pg_temp.d(n bigint) returns uuid language sql immutable
as $$ select ('de300000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid $$;
create function pg_temp.at(days int, t time) returns timestamptz language sql stable
as $$ select ((current_date + days) + t) at time zone 'Asia/Kolkata' $$;

-- 0. Instruments, so the artist selector can be searched by instrument.
update artists set instruments = case
    when genre ilike '%ghazal%' then '{Vocals,Harmonium}'::text[]
    when genre ilike '%qawwali%' or genre ilike '%sufi%' then '{Vocals,Harmonium,Tabla}'
    when genre ilike '%hindustani%' then (case when subgenre ilike '%sarod%' then '{Sarod}' when subgenre ilike '%sitar%' then '{Sitar}' else '{Vocals,Tanpura}' end)::text[]
    when genre ilike '%carnatic%' then '{Violin,Veena}'
    when genre ilike '%percussion%' then '{Tabla,Daf,Dholak}'
    when genre ilike '%chamber%' or genre ilike '%classical%' then '{Violin,Cello}'
    when genre ilike '%jazz%' then '{Saxophone,Double bass}'
    when genre ilike '%brass%' then '{Trumpet,Trombone,Tuba}'
    when genre ilike '%dhrupad%' then '{Vocals,Pakhawaj}'
    when genre ilike '%dance%' then '{Ghungroo,Tabla}'
    when genre ilike '%poetry%' then '{Spoken word}'
    when genre ilike '%electronic%' or genre ilike '%ambient%' then '{Synth,Electronics}'
    when genre ilike '%indie%' or genre ilike '%folk%' or genre ilike '%fusion%' then '{Vocals,Guitar}'
    else '{Vocals}' end
 where id::text like 'de300000-%' and coalesce(array_length(instruments, 1), 0) = 0;

-- 1. Calendars. A deterministic mix per artist and day; the timestamps are
-- written as they would have been when the artist last updated.
set local session_replication_role = replica;
insert into artist_availability (artist_id, date, status, note, updated_at)
select a.id, current_date + g.d,
       case when (abs(hashtext(a.id::text || g.d)) % 10) < 6 then 'available'
            when (abs(hashtext(a.id::text || g.d)) % 10) < 8 then 'tentative' else 'unavailable' end,
       case when (abs(hashtext(a.id::text || g.d)) % 10) = 9 then 'Travelling' when (abs(hashtext(a.id::text || g.d)) % 10) = 7 then 'Holding for a wedding booking' end,
       case when abs(hashtext(a.id::text)) % 4 = 0 then now() - interval '45 days' else now() - make_interval(hours => abs(hashtext(a.id::text)) % 240) end
  from artists a cross join generate_series(1, 56) g(d)
 where a.id::text like 'de300000-%' and a.status = 'approved'
   and abs(hashtext(a.id::text || g.d)) % 7 <> 0          -- leave some days unset
on conflict (artist_id, date) do nothing;
-- The artists the scenarios rely on, set explicitly.
insert into artist_availability (artist_id, date, status, note, updated_at) values
  (pg_temp.d(401), current_date + 12, 'available', null, now() - interval '2 hours'),
  (pg_temp.d(4103), current_date + 12, 'available', null, now() - interval '1 day'),
  (pg_temp.d(4104), current_date + 16, 'tentative', 'Might be in Kochi that week', now() - interval '3 days'),
  (pg_temp.d(4102), current_date + 16, 'available', null, now() - interval '3 days'),
  (pg_temp.d(403), current_date + 16, 'available', null, now() - interval '5 days'),
  (pg_temp.d(402), current_date + 20, 'unavailable', 'Touring in Pune', now() - interval '1 day'),
  (pg_temp.d(404), current_date + 20, 'available', null, now() - interval '50 days'),
  (pg_temp.d(402), current_date + 24, 'available', null, now() - interval '1 day'),
  (pg_temp.d(4105), current_date + 24, 'available', null, now() - interval '4 days'),
  (pg_temp.d(401), current_date + 28, 'available', null, now() - interval '2 hours')
on conflict (artist_id, date) do update set status = excluded.status, note = excluded.note, updated_at = excluded.updated_at;
-- Ananya keeps her calendar fresh; Zoya hasn't touched hers in a while.
update artist_availability set updated_at = now() - interval '2 hours' where artist_id = pg_temp.d(401);
update artist_availability set updated_at = now() - interval '50 days' where artist_id = pg_temp.d(404);
set local session_replication_role = origin;

-- 2. The scenario events.
insert into events (id, slug, name, description, category, event_date, event_time, end_time, venue, venue_id, capacity, price, status, tags, image_url, timezone) values
  (pg_temp.d(7001), 'demo-ragas-at-dusk', 'Ragas at Dusk', 'Two sets as the light goes: Carnatic violin, then sarod.', 'concert', current_date + 12, '7:00 PM', '9:15 PM', 'Taramati Baradari Pavilion (demo)', pg_temp.d(2101), 200, 1100, 'on-sale', '{Carnatic,Hindustani}', '/media/gallery/tangy2.jpg', 'Asia/Kolkata'),
  (pg_temp.d(7002), 'demo-folk-fusion-night', 'Folk & Fusion Night', 'Three acts, one courtyard: strings, songs and a collective.', 'concert', current_date + 16, '6:30 PM', '10:00 PM', 'Old City Haveli Courtyard (demo)', pg_temp.d(2103), 120, 900, 'on-sale', '{Folk,Fusion}', '/media/gallery/tangy3.jpg', 'Asia/Kolkata'),
  (pg_temp.d(7003), 'demo-monsoon-listening-room', 'Monsoon Listening Room', 'A small rain-season evening — line-up still being built.', 'concert', current_date + 20, '7:30 PM', null, 'Qutb Shahi Stepwell Lawns (demo)', pg_temp.d(2102), 80, 800, 'draft', '{Monsoon}', null, 'Asia/Kolkata'),
  (pg_temp.d(7004), 'demo-courtyard-new-voices', 'Courtyard Sessions: New Voices', 'An open stage for new songwriters, with a drum circle to close.', 'concert', current_date + 24, '7:00 PM', '9:30 PM', 'Old City Haveli Courtyard (demo)', pg_temp.d(2103), 120, 600, 'on-sale', '{Indie}', '/media/gallery/tangy5.jpg', 'Asia/Kolkata'),
  (pg_temp.d(7005), 'demo-stepwell-strings', 'Stepwell Strings', 'Violin and veena at the stepwell.', 'concert', current_date + 28, '6:45 PM', '8:45 PM', 'Qutb Shahi Stepwell Lawns (demo)', pg_temp.d(2102), 150, 1000, 'on-sale', '{Carnatic}', '/media/gallery/tangy1.jpg', 'Asia/Kolkata'),
  (pg_temp.d(7006), 'demo-old-city-qawwali-night', 'Old City Qawwali Night', 'Cancelled — the courtyard is under repair.', 'concert', current_date + 9, '8:00 PM', null, 'Old City Haveli Courtyard (demo)', pg_temp.d(2103), 120, 900, 'on-sale', '{Qawwali}', null, 'Asia/Kolkata'),
  (pg_temp.d(7007), 'demo-winter-baithak', 'Winter Baithak', 'A long evening of ghazal and sarod, by the fire.', 'concert', current_date - 20, '7:00 PM', '10:00 PM', 'Taramati Baradari Pavilion (demo)', pg_temp.d(2101), 200, 1000, 'past', '{Ghazal}', '/media/gallery/tangy4.jpg', 'Asia/Kolkata');

-- 3. Line-ups (times in the event's zone). "You're on the lineup" goes out
-- once, after the times are set, exactly as save_event_lineup does it.
select set_config('tangy.defer_lineup_notice', 'on', true);
insert into event_artists (event_id, artist_id) values
  (pg_temp.d(7001), pg_temp.d(401)), (pg_temp.d(7001), pg_temp.d(4103)),
  (pg_temp.d(7002), pg_temp.d(4102)), (pg_temp.d(7002), pg_temp.d(4104)), (pg_temp.d(7002), pg_temp.d(403)),
  (pg_temp.d(7003), pg_temp.d(404)),
  (pg_temp.d(7004), pg_temp.d(4105)),
  (pg_temp.d(7006), pg_temp.d(403)), (pg_temp.d(7006), pg_temp.d(4101)),
  (pg_temp.d(7007), pg_temp.d(404)), (pg_temp.d(7007), pg_temp.d(4103));
insert into event_artist_details (event_id, artist_id, performance_order, performance_type, set_minutes, performance_start, performance_end, notes) values
  (pg_temp.d(7001), pg_temp.d(401), 1, 'Carnatic violin', 45, pg_temp.at(12, '19:00'), pg_temp.at(12, '19:45'), 'Opens the evening.'),
  (pg_temp.d(7001), pg_temp.d(4103), 2, 'Sarod recital', 60, pg_temp.at(12, '20:00'), pg_temp.at(12, '21:00'), null),
  (pg_temp.d(7002), pg_temp.d(4102), 1, 'String quartet', 45, pg_temp.at(16, '18:45'), pg_temp.at(16, '19:30'), null),
  (pg_temp.d(7002), pg_temp.d(4104), 2, 'Songs, solo guitar', 45, pg_temp.at(16, '19:45'), pg_temp.at(16, '20:30'), 'Tentative on her calendar — confirm travel.'),
  (pg_temp.d(7002), pg_temp.d(403), 3, 'Collective set', 60, pg_temp.at(16, '20:45'), pg_temp.at(16, '21:45'), null),
  (pg_temp.d(7003), pg_temp.d(404), 1, 'Ghazal', 60, pg_temp.at(20, '19:30'), pg_temp.at(20, '20:30'), null),
  (pg_temp.d(7004), pg_temp.d(4105), 2, 'Drum circle', 45, pg_temp.at(24, '20:30'), pg_temp.at(24, '21:15'), 'Closes the night.'),
  (pg_temp.d(7006), pg_temp.d(403), 1, 'Qawwali', 75, pg_temp.at(9, '20:00'), pg_temp.at(9, '21:15'), null),
  (pg_temp.d(7006), pg_temp.d(4101), 2, 'Ghazal', 45, pg_temp.at(9, '21:30'), pg_temp.at(9, '22:15'), null),
  (pg_temp.d(7007), pg_temp.d(404), 1, 'Ghazal', 60, pg_temp.at(-20, '19:00'), pg_temp.at(-20, '20:00'), null),
  (pg_temp.d(7007), pg_temp.d(4103), 2, 'Sarod', 75, pg_temp.at(-20, '20:15'), pg_temp.at(-20, '21:30'), null);
select set_config('tangy.defer_lineup_notice', 'off', true);
select notify_lineup_artist(x.e, x.a) from (values (pg_temp.d(7001), pg_temp.d(401)), (pg_temp.d(7002), pg_temp.d(403))) x(e, a);

-- 4. Requests: D pending (Kabir), E accepted (Ananya), F's closed by the
-- cancellation below, G completed.
insert into assignment_requests (id, session_id, artist_id, requested_by, status, message, proposed_start, proposed_end, performance_type, set_minutes, fee_offer, expires_at, created_at) values
  (pg_temp.d(7101), pg_temp.d(7004), pg_temp.d(402), pg_temp.d(101), 'pending', 'Would you open New Voices with a short set?', pg_temp.at(24, '19:30'), pg_temp.at(24, '20:15'), 'Opening set', 45, 12000, now() + interval '6 days', now() - interval '1 day'),
  (pg_temp.d(7102), pg_temp.d(7005), pg_temp.d(401), pg_temp.d(101), 'pending', 'Stepwell Strings — the main set?', pg_temp.at(28, '19:00'), pg_temp.at(28, '20:15'), 'Violin recital', 75, 18000, now() + interval '6 days', now() - interval '3 days'),
  (pg_temp.d(7103), pg_temp.d(7006), pg_temp.d(4101), pg_temp.d(101), 'accepted', null, pg_temp.at(9, '21:30'), pg_temp.at(9, '22:15'), 'Ghazal', 45, null, now() + interval '2 days', now() - interval '10 days'),
  (pg_temp.d(7104), pg_temp.d(7007), pg_temp.d(404), pg_temp.d(101), 'completed', null, pg_temp.at(-20, '19:00'), pg_temp.at(-20, '20:00'), 'Ghazal', 60, 15000, now() - interval '30 days', now() - interval '40 days');
-- E: Ananya accepts (as the artist would) — she joins the line-up with the request's times.
update assignment_requests set status = 'accepted', responded_at = now() - interval '2 days' where id = pg_temp.d(7102);
select set_config('tangy.defer_lineup_notice', 'on', true);
insert into event_artists (event_id, artist_id) values (pg_temp.d(7005), pg_temp.d(401));
insert into event_artist_details (event_id, artist_id, performance_order, performance_type, set_minutes, performance_start, performance_end)
values (pg_temp.d(7005), pg_temp.d(401), 1, 'Violin recital', 75, pg_temp.at(28, '19:00'), pg_temp.at(28, '20:15'))
on conflict (event_id, artist_id) do nothing;
select set_config('tangy.defer_lineup_notice', 'off', true);
select notify_lineup_artist(pg_temp.d(7005), pg_temp.d(401));
-- F: cancelled the way the console does it (notifies the line-up, closes requests).
update events set status = 'cancelled' where id = pg_temp.d(7006);

-- 5. A private Super Admin ↔ artist thread (director ↔ Ananya).
insert into conversations (id, subject, category, conversation_type, created_by, external_user_id, assigned_admin_id, status, related_artist_id, created_at)
values (pg_temp.d(7201), 'Your October schedule', 'support', 'artist_private', pg_temp.d(103), pg_temp.d(110), pg_temp.d(103), 'pending', pg_temp.d(401), now() - interval '1 day');
insert into conversation_participants (conversation_id, user_id, role) values (pg_temp.d(7201), pg_temp.d(110), 'owner'), (pg_temp.d(7201), pg_temp.d(103), 'admin');
insert into messages (conversation_id, sender_id, content, created_at) values
  (pg_temp.d(7201), pg_temp.d(103), 'Ananya — can you hold Stepwell Strings and Ragas at Dusk? Both evenings are yours if you can.', now() - interval '20 hours'),
  (pg_temp.d(7201), pg_temp.d(110), 'Yes to both. Can I bring my own mic for the stepwell?', now() - interval '18 hours');

-- 5b. Sessions with their own page background (session + booking page).
update events set page_background = 'cover' where slug in ('heritage-after-dark', 'demo-ragas-at-dusk', 'monsoon-sessions-2025') and id::text like 'de300000-%';
update events set page_background = '#1E2440' where slug = 'kathak-movement-lab' and id::text like 'de300000-%';
update events set page_background = '#183126' where slug = 'demo-stepwell-strings' and id::text like 'de300000-%';

-- 6. A stale-calendar reminder, as the platform job would send it.
select send_availability_reminders();
commit;
