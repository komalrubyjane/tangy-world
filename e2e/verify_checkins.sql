select t.ticket_number, count(c.*) as records, string_agg(c.method::text, ',') from tickets t left join checkins c on c.ticket_id = t.id group by 1 order by 1;
select action, count(*) from audit_logs where action like 'checkin.%' and created_at > now() - interval '15 minutes' group by 1;
