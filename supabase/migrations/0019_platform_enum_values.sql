-- Tangy Sessions — enum values used by 0020_platform_finalization.sql.
--
-- Own file for the same reason as 0010_venue_role.sql: a new enum value
-- cannot be used in the transaction that adds it.
--
--   booking_status 'expired'     — a pending checkout whose hold ran out
--                                  (server-side expiry, 0020)
--   assignment_status 'expired'  — an artist booking request nobody answered
--                                  before its deadline
alter type booking_status add value if not exists 'expired';
alter type assignment_status add value if not exists 'expired';
