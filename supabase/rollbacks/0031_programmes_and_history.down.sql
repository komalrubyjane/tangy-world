-- Rollback for 0031_programmes_and_history.sql: drops programmes (export
-- first — their rows go) and the recorded-attendance column.
begin;
drop table if exists programme_events;
drop table if exists programmes;
alter table events drop column if exists attendance_recorded;
commit;
