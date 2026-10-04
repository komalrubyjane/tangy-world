-- READ-ONLY check of TangySessions' online payments and the Razorpay webhook.
-- ONE SELECT statement: it reads and counts rows; it cannot write, settle,
-- refund or change anything. Run it in the SQL editor before and after the
-- first test payment (docs/OPERATIONS.md §3a). Wrap it in
-- `begin transaction read only; … rollback;` if you like.
--
-- No personal data: no names, emails, phone numbers or payloads. Booking
-- references (registration codes) are shown only for rows that need action,
-- so they can be looked up in Admin → Bookings.
select * from (
  select 1 as ord, 'BOOKINGS' as section, 'online bookings by status' as item,
    coalesce((select string_agg(status::text || '=' || n, ', ' order by status::text)
              from (select status, count(*) n from public.bookings where source = 'online' group by status) s), 'none') as value
  union all
  select 2, 'BOOKINGS', 'online bookings by payment_status',
    coalesce((select string_agg(payment_status || '=' || n, ', ' order by payment_status)
              from (select payment_status, count(*) n from public.bookings where source = 'online' group by payment_status) s), 'none')
  union all
  select 3, 'ACTION', 'pending checkouts older than the hold (expect 0 while tangy-platform-jobs runs)',
    (select count(*)::text from public.bookings
      where status = 'pending' and created_at < now() - make_interval(mins => public.setting_number('bookings.pending_timeout_minutes', 30)::int))
  union all
  select 4, 'ACTION', 'payments held for finance review (needs_review): count / latest references',
    (select count(*) || ' / ' || coalesce(string_agg(registration_code, ', '), '—')
       from (select registration_code from public.bookings where payment_status = 'needs_review' order by payment_updated_at desc nulls last limit 5) r)
      || case when (select count(*) from public.bookings where payment_status = 'needs_review') > 5 then ' …' else '' end
  union all
  select 5, 'ACTION', 'confirmed bookings with no tickets (expect 0)',
    (select count(*)::text from public.bookings b where b.status = 'confirmed'
       and not exists (select 1 from public.tickets t where t.booking_id = b.id))
  union all
  select 6, 'ACTION', 'confirmed online bookings whose ticket email is not sent: count / latest references (resend from Admin → Bookings)',
    (select count(*) || ' / ' || coalesce(string_agg(registration_code, ', '), '—')
       from (select registration_code from public.bookings where status = 'confirmed' and source = 'online' and ticket_email_status <> 'sent'
              order by payment_updated_at desc nulls last limit 5) r)
  union all
  select 7, 'ACTION', 'confirmed online bookings without a verified payment (expect 0)',
    (select count(*)::text from public.bookings where status = 'confirmed' and source = 'online' and not razorpay_signature_verified)
  union all
  select 8, 'WEBHOOK', 'webhook events: total / processed / with processing error / neither (in progress or lost)',
    (select count(*) || ' / ' || count(*) filter (where processed) || ' / ' || count(*) filter (where processing_error is not null)
            || ' / ' || count(*) filter (where not processed and processing_error is null) from public.payment_webhook_events)
  union all
  select 9, 'WEBHOOK', 'last webhook received / event types in the last 24 h',
    coalesce((select max(created_at)::text from public.payment_webhook_events), 'never') || ' / ' ||
    coalesce((select string_agg(event_type || '=' || n, ', ' order by event_type)
              from (select event_type, count(*) n from public.payment_webhook_events where created_at > now() - interval '24 hours' group by event_type) s), 'none')
  union all
  select 10, 'WEBHOOK', 'latest processing error (first 160 chars)',
    coalesce((select left(processing_error, 160) from public.payment_webhook_events
               where processing_error is not null order by created_at desc limit 1), 'none')
) report
order by ord;
