-- Rollback for 0029_private_media_realtime_jobs.sql: content-media public
-- again, 0027's waitlist offer engine and scheduled-jobs function, and no
-- availability signal or job-run log (the log's rows are dropped).
begin;

-- 4. jobs
drop function if exists run_platform_jobs(text);
create or replace function run_platform_jobs()
returns jsonb
language plpgsql security definer set search_path = public
as $$
begin
  return jsonb_build_object(
    'bookings_expired', expire_stale_bookings(),
    'waitlist_offers_expired', expire_waitlist_offers(),
    'requests_expired', expire_booking_requests(),
    'reminders', send_event_reminders(),
    'overdue_tasks', notify_overdue_tasks(),
    'expiring_access', notify_expiring_access(),
    'access_expiry_logged', log_expired_access());
end;
$$;
revoke execute on function run_platform_jobs() from public, anon, authenticated;
grant execute on function run_platform_jobs() to service_role;
drop table if exists platform_job_runs;

-- 3. allocation policy
create or replace function offer_waitlist_seats(p_event_id uuid)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_event events%rowtype;
  v_free int;
  v_hold int := setting_number('waitlist.offer_hold_minutes', 120)::int;
  r record;
  v_offered int := 0;
begin
  select * into v_event from events where id = p_event_id for update;
  if v_event.id is null or v_event.status in ('draft', 'cancelled', 'past') or v_event.event_date < current_date then
    return 0;
  end if;
  -- Lapsed offers first, so their seats flow onwards in this same pass.
  update waitlist set status = 'expired', resolved_at = now(), updated_at = now()
   where event_id = p_event_id and status = 'offered' and offer_expires_at <= now();
  select v_event.capacity
         - coalesce((select sum(quantity) from bookings where event_id = p_event_id and status in ('pending', 'confirmed')), 0)
         - waitlist_held_seats(p_event_id)
    into v_free;
  for r in select * from waitlist
           where event_id = p_event_id and status = 'waiting' and user_id is not null
           order by queue_no for update loop
    exit when v_free <= 0 or r.quantity > v_free;   -- strict FIFO: never skip the head of the queue
    update waitlist set status = 'offered', offered_at = now(), offer_expires_at = now() + make_interval(mins => v_hold), updated_at = now()
     where id = r.id;
    v_free := v_free - r.quantity;
    v_offered := v_offered + 1;
    perform notify(r.user_id, 'waitlist.offer', 'A seat opened up: ' || v_event.name,
      format('We''re holding %s seat%s for you until %s. Book now to keep them.', r.quantity, case when r.quantity = 1 then '' else 's' end,
             to_char(now() at time zone coalesce(v_event.timezone, 'Asia/Kolkata') + make_interval(mins => v_hold), 'HH12:MI AM, DD Mon')),
      '/sessions/' || v_event.slug, p_event_id);
    insert into audit_logs (actor_id, actor_email, actor_role, action, resource_type, resource_id, event_id, metadata)
    values (null, null, 'system', 'waitlist.offered', 'waitlist', r.id::text, p_event_id,
            jsonb_build_object('quantity', r.quantity, 'hold_minutes', v_hold));
  end loop;
  return v_offered;
end;
$$;
revoke execute on function offer_waitlist_seats(uuid) from public, anon, authenticated;
delete from system_settings where key = 'waitlist.allocation';

-- 2. availability signal
drop trigger if exists bookings_availability_signal on bookings;
drop trigger if exists waitlist_availability_signal on waitlist;
drop trigger if exists ticket_types_availability_signal on event_ticket_types;
drop trigger if exists events_availability_signal on events;
drop function if exists availability_signal_trigger();
drop function if exists bump_availability(uuid);
do $$
begin
  if exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'event_availability_signal') then
    alter publication supabase_realtime drop table event_availability_signal;
  end if;
end $$;
drop table if exists event_availability_signal;

-- 5. upload limits (back to 0013/0020 values)
update storage.buckets set file_size_limit = null, allowed_mime_types = null where id in ('artist-avatars', 'artist-media');
update storage.buckets set allowed_mime_types = null where id in ('event-documents', 'sponsor-assets');

-- 1. media
drop policy if exists "content-media: read" on storage.objects;
drop policy if exists "content-media: upload" on storage.objects;
create policy "content-media: upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'content-media' and (public.content_can('create', 'media') or public.content_can('create', 'tv') or public.content_can('create', 'diary')
                                               or public.content_can('edit', 'media') or public.content_can('edit', 'tv') or public.content_can('edit', 'diary')));
drop function if exists content_media_is_public(text);
update storage.buckets set public = true where id = 'content-media';

commit;
