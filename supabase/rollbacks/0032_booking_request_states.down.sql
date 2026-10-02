-- Rollback for 0032_booking_request_states.sql: Postgres cannot drop enum
-- values. Roll back 0033 first (it maps draft / confirmed / completed requests
-- back to cancelled / accepted); the unused values then stay harmlessly.
select 1;
