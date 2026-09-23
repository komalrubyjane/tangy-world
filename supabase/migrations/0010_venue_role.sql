-- Tangy Sessions — add the last missing account-type role value.
--
-- vendor/sponsor/volunteer/crew were already added in 0005_extend_roles.sql;
-- 'venue' is the only approved-role gap left, needed so an approved venue
-- host's profiles.role can actually reflect that (see 0011_role_portals.sql).
--
-- Own file/transaction, deliberately: a new enum value cannot be referenced
-- by a literal comparison in the same transaction that added it (same
-- constraint noted in 0005), so 0011 (which uses 'venue' in an UPDATE) must
-- run strictly after this commits.

alter type user_role add value if not exists 'venue';
