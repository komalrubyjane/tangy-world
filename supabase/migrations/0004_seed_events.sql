-- Tangy Sessions — seed the events table from the site's existing editorial
-- content (src/data/mockData.js) so Sessions/Archive/Booking/Calendar aren't
-- empty on first load. Dates on two of the originally-authored "2026" entries
-- are shifted forward one year so they read as genuinely upcoming; everything
-- else keeps its original story/venue/description as authored. Edit or delete
-- freely from the admin dashboard once real sessions are scheduled.

insert into events (slug, name, description, event_date, event_time, venue, image_url, capacity, price, status, featured, tags, story)
values
  ('vol-1', 'Tangy Sessions Vol. 1',
   'An immersive night of underground acoustic & sufi music echoing through 300-year-old stone corridors.',
   '2025-08-15', '7:00 PM', 'Bansilalpet Stepwell', '/media/gallery/tangy1.jpg', 200, 799, 'past', false,
   array['Sufi', 'Acoustic', 'Heritage'],
   'The night the 17th-century stepwell came alive. 200 listeners gathered under the open moonlight as acoustics rebounded off limestone walls.'),

  ('vol-2', 'Tangy Sessions Vol. 2',
   'Carnatic violin ragas fused with sub-bass textures inside historic acoustic pavilions.',
   '2025-09-20', '8:00 PM', 'Taramati Baradari', '/media/gallery/tangy2.jpg', 250, 999, 'past', false,
   array['Violin', 'Fusion', 'Carnatic'],
   'Taramati Baradari was built for music projection. Varun''s violin resonated across the entire valley without amplification.'),

  ('solstice', 'Tangy Sessions: Solstice',
   'A winter solstice special — the longest night, the deepest sounds.',
   '2025-12-21', '6:30 PM', 'Chowmahalla Courtyard', '/media/gallery/tangy3.jpg', 180, 1299, 'past', false,
   array['Folk', 'Solstice', 'Live'],
   'Fires lit in clay pots along the courtyard arches while folk melodies carried through midnight darkness.'),

  ('vol-3', 'Tangy Sessions Vol. 3',
   'Experimental vocal ambient loops, tabla rhythms, and ancient stone resonance on Valentine''s eve.',
   '2026-02-14', '7:30 PM', 'Bansilalpet Stepwell', '/media/gallery/tangy8.jpg', 200, 899, 'past', false,
   array['Vocal', 'Ambient', 'Tabla'],
   'A love letter to the forgotten stones of Hyderabad — intimate, raw, and unscripted.'),

  ('solstice-2027', 'Tangy Sessions: Summer Solstice',
   'A summer solstice celebration — the longest day, the most resonant night at the greatest acoustic pavilion.',
   '2027-06-21', '7:00 PM', 'Taramati Baradari', '/media/gallery/tangy1.jpg', 250, 1499, 'on-sale', true,
   array['Sufi', 'Acoustic', 'Solstice'],
   'Under twelve arches built to carry a voice two miles, we gather for the longest night of 2027.'),

  ('monsoon-2027', 'Tangy Sessions: Monsoon Ritual',
   'Unamplified folk music in a Nizam-era courtyard as the monsoon rains fall on ancient neem trees.',
   '2027-07-25', '6:00 PM', 'Old City Courtyard', '/media/gallery/tangy3.jpg', 180, 799, 'on-sale', false,
   array['Folk', 'Monsoon', 'Heritage'],
   'The most honest recording is rain on clay pots and a flute in a 130-year-old courtyard.'),

  ('vol-4', 'Tangy Sessions Vol. 4',
   'The roster returns to the stepwell for another unamplified night of heritage acoustics and live improvisation.',
   '2026-09-19', '7:00 PM', 'Bansilalpet Stepwell', '/media/gallery/tangy4.jpg', 220, 899, 'on-sale', true,
   array['Heritage', 'Live', 'Acoustic'],
   'A return to where it all started — the stepwell, unamplified, under open sky.')
on conflict (slug) do nothing;
