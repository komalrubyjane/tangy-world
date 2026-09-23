-- Tangy Sessions — artists.spotify, matching the existing instagram/
-- soundcloud columns. The artist portal's "Links" tab already had a Spotify
-- field with no backing column, so it silently never saved.

alter table artists add column if not exists spotify text;
