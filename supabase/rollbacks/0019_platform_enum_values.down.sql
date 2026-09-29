-- REVERSE of 0019_platform_enum_values.sql — run by hand only, AFTER
-- rollbacks/0020_platform_finalization.down.sql.
--
-- Postgres cannot drop a value from an enum in place. 0020's rollback already
-- moves every row off 'expired' (bookings -> 'cancelled', booking requests ->
-- 'cancelled'), so the two unused labels are harmless and are left in place.
-- Removing them would require recreating both types and every dependent
-- column, view and function, which is not worth the risk for an unused label.
select 1;
