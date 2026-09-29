-- LOCAL TEST DATA ONLY: make Vol. 5 "today" for the staff flow and reset its check-ins.
update events set event_date = (now() at time zone 'Asia/Kolkata')::date where name = 'Tangy Sessions Vol. 5';
alter table event_tasks disable trigger guard_event_task_status_trigger;
update event_tasks set due_at = ((now() at time zone 'Asia/Kolkata')::date + time '20:00') at time zone 'Asia/Kolkata', status = 'pending';
alter table event_tasks enable trigger guard_event_task_status_trigger;
delete from checkins where ticket_id in (select id from tickets);
update tickets set status = 'valid' where status = 'checked_in';
