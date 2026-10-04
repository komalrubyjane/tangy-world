-- READ-ONLY check of TangySessions' scheduled work and email delivery.
-- ONE SELECT statement: it reads catalogs and counts rows; it cannot write,
-- create, schedule or change anything. Safe on a database without pg_cron
-- or pg_net. Paste it into the SQL editor and run it (docs/OPERATIONS.md §2a).
--
-- It never returns personal data (no addresses, subjects or bodies) and never
-- returns a cron job's command text: a dashboard-created email job carries
-- the x-cron-secret header inside its command.
-- pg_cron's tables are read through query_to_xml so the statement still
-- parses on a database where pg_cron is not installed.
with
cron_ok as (select to_regclass('cron.job') is not null and to_regclass('cron.job_run_details') is not null as ok)
select * from (
  select 1 as ord, 'EXTENSIONS' as section, 'pg_cron' as item,
    coalesce((select 'installed ' || extversion from pg_extension where extname = 'pg_cron'),
             case when exists (select 1 from pg_available_extensions where name = 'pg_cron') then 'NOT installed (available: enable it under Database → Extensions)' else 'not available' end) as value
  union all
  select 2, 'EXTENSIONS', 'pg_net (needed by Supabase Cron HTTP / Edge Function jobs)',
    coalesce((select 'installed ' || extversion from pg_extension where extname = 'pg_net'),
             case when exists (select 1 from pg_available_extensions where name = 'pg_net') then 'NOT installed' else 'not available' end)
  union all
  select 3, 'PLATFORM JOBS', 'cron job tangy-platform-jobs (0020, run_platform_jobs every 5 min)',
    case when not (select ok from cron_ok) then 'pg_cron not installed: NOT SCHEDULED' else coalesce((xpath('/row/c/text()', query_to_xml(
      $q$select string_agg(schedule || case when active then ' (active)' else ' (INACTIVE)' end, '; ') as c from cron.job where jobname = 'tangy-platform-jobs'$q$, false, true, '')))[1]::text, 'MISSING') end
  union all
  select 4, 'PLATFORM JOBS', 'cron job tangy-log-expired-access (0018; redundant with run_platform_jobs, harmless)',
    case when not (select ok from cron_ok) then 'n/a' else coalesce((xpath('/row/c/text()', query_to_xml(
      $q$select string_agg(schedule || case when active then ' (active)' else ' (inactive)' end, '; ') as c from cron.job where jobname = 'tangy-log-expired-access'$q$, false, true, '')))[1]::text, 'not scheduled (fine)') end
  union all
  select 5, 'PLATFORM JOBS', 'tangy-platform-jobs runs, last 24 h (succeeded / failed / last start)',
    case when not (select ok from cron_ok) then 'n/a' else coalesce((xpath('/row/c/text()', query_to_xml(
      $q$select count(*) filter (where d.status = 'succeeded') || ' / ' || count(*) filter (where d.status = 'failed') || ' / ' || coalesce(max(d.start_time)::text, 'never') as c
         from cron.job j join cron.job_run_details d on d.jobid = j.jobid
         where j.jobname = 'tangy-platform-jobs' and d.start_time > now() - interval '24 hours'$q$, false, true, '')))[1]::text, '0 / 0 / never') end
  union all
  select 6, 'PLATFORM JOBS', 'tangy-platform-jobs last failure (message, first 160 chars)',
    case when not (select ok from cron_ok) then 'n/a' else coalesce((xpath('/row/c/text()', query_to_xml(
      $q$select d.start_time || ': ' || left(coalesce(d.return_message, ''), 160) as c
         from cron.job j join cron.job_run_details d on d.jobid = j.jobid
         where j.jobname = 'tangy-platform-jobs' and d.status = 'failed' order by d.start_time desc limit 1$q$, false, true, '')))[1]::text, 'none') end
  union all
  select 7, 'PLATFORM JOBS', 'platform_job_runs (0029 log): last finished / runs last hour / skipped last hour',
    case when to_regclass('public.platform_job_runs') is null then 'table missing' else (xpath('/row/c/text()', query_to_xml(
      $q$select coalesce(max(finished_at)::text, 'never') || ' / ' || count(*) filter (where started_at > now() - interval '1 hour')
              || ' / ' || count(*) filter (where skipped and started_at > now() - interval '1 hour') as c from public.platform_job_runs$q$, false, true, '')))[1]::text end
  union all
  select 8, 'EMAIL', 'cron jobs that call send-notification-emails (name: schedule; command NOT shown)',
    case when not (select ok from cron_ok) then 'pg_cron not installed: use an external scheduler' else coalesce((xpath('/row/c/text()', query_to_xml(
      $q$select string_agg(coalesce(jobname, 'job ' || jobid) || ': ' || schedule || case when active then ' (active)' else ' (INACTIVE)' end, '; ' order by jobid) as c
         from cron.job where command ilike '%send-notification-emails%'$q$, false, true, '')))[1]::text, 'NONE: the email queue is not being drained by pg_cron') end
  union all
  select 9, 'EMAIL', 'email drain cron runs, last 24 h (succeeded / failed / last start)',
    case when not (select ok from cron_ok) then 'n/a' else coalesce((xpath('/row/c/text()', query_to_xml(
      $q$select count(*) filter (where d.status = 'succeeded') || ' / ' || count(*) filter (where d.status = 'failed') || ' / ' || coalesce(max(d.start_time)::text, 'never') as c
         from cron.job j join cron.job_run_details d on d.jobid = j.jobid
         where j.command ilike '%send-notification-emails%' and d.start_time > now() - interval '24 hours'$q$, false, true, '')))[1]::text, '0 / 0 / never') end
  union all
  select 10, 'EMAIL', 'email_outbox rows by status',
    case when to_regclass('public.email_outbox') is null then 'table missing' else coalesce((xpath('/row/c/text()', query_to_xml(
      $q$select string_agg(status || '=' || n, ', ' order by status) as c from (select status, count(*) n from public.email_outbox group by status) s$q$, false, true, '')))[1]::text, 'empty') end
  union all
  select 11, 'EMAIL', 'oldest queued email waiting (age) / last email sent at',
    case when to_regclass('public.email_outbox') is null then 'table missing' else (xpath('/row/c/text()', query_to_xml(
      $q$select coalesce((now() - min(created_at) filter (where status in ('queued', 'sending')))::text, 'nothing waiting')
              || ' / ' || coalesce(max(sent_at)::text, 'never') as c from public.email_outbox$q$, false, true, '')))[1]::text end
  union all
  select 12, 'EMAIL', 'failed emails (attempts exhausted) / last error (first 120 chars, addresses masked)',
    case when to_regclass('public.email_outbox') is null then 'table missing' else (xpath('/row/c/text()', query_to_xml(
      $q$select count(*) filter (where status = 'failed') || ' / ' ||
              coalesce((select left(regexp_replace(last_error, '[^\s<>"'',;:]+@[^\s<>"'',;:]+', '[address]', 'g'), 120) from public.email_outbox where last_error is not null order by coalesce(locked_at, created_at) desc limit 1), 'none') as c
         from public.email_outbox$q$, false, true, '')))[1]::text end
  union all
  select 13, 'EMAIL', 'pg_net HTTP responses kept by pg_net (all jobs): 2xx / 4xx / 5xx / errors; a cron "succeeded" only means the request was queued',
    case when to_regclass('net._http_response') is null then 'pg_net not installed' else (xpath('/row/c/text()', query_to_xml(
      $q$select count(*) filter (where status_code between 200 and 299) || ' / ' || count(*) filter (where status_code between 400 and 499)
              || ' / ' || count(*) filter (where status_code >= 500) || ' / ' || count(*) filter (where status_code is null) as c from net._http_response$q$, false, true, '')))[1]::text end
) report
order by ord;
