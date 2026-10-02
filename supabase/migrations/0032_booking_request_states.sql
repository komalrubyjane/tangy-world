-- Tangy Sessions — new booking-request states (0033 uses them).
-- Enum values must be committed before they can be used, so they live in
-- their own file (same pattern as 0019_platform_enum_values.sql).
--
-- assignment_status (booking requests to artists) gains:
--   draft      — prepared by the team, not yet visible to the artist
--   confirmed  — the team confirmed an accepted request (logistics locked)
--   completed  — the session took place
-- `pending` remains "sent" (and "viewed" once the artist opens it).
alter type assignment_status add value if not exists 'draft';
alter type assignment_status add value if not exists 'confirmed';
alter type assignment_status add value if not exists 'completed';
