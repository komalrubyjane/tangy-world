-- REVERSE of 0025_enquiries_auth_first.sql — run by hand only, BEFORE
-- rollbacks/0024_event_booking_form.down.sql.
--
-- Restores anonymous contact / private-session enquiries, 0013's artist insert
-- policy, 0021's notify() and 0020's notification_meta(), and drops the
-- duplicate guard and receipt triggers. DATA: contact_enquiries.user_id is
-- dropped (the link from a contact message to its account); in-app receipt
-- notifications already sent stay.

begin;

drop trigger if exists collaborations_receipt on collaborations;
drop trigger if exists crew_applications_receipt on crew_applications;
drop trigger if exists artists_receipt on artists;
drop trigger if exists private_enquiries_receipt on private_enquiries;
drop trigger if exists contact_enquiries_receipt on contact_enquiries;
drop function if exists notify_on_enquiry_received();

drop trigger if exists collaborations_guard_duplicate on collaborations;
drop trigger if exists crew_applications_guard_duplicate on crew_applications;
drop trigger if exists artists_guard_duplicate on artists;
drop trigger if exists private_enquiries_guard_duplicate on private_enquiries;
drop trigger if exists contact_enquiries_guard_duplicate on contact_enquiries;
drop function if exists guard_duplicate_application();

create or replace function notify(p_user_id uuid, p_type text, p_title text, p_body text default null,
                                  p_link text default null, p_event_id uuid default null, p_priority text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  m record;
  v_email text;
  v_priority text;
  v_link text := canonical_console_link(p_link);
begin
  if p_user_id is null or p_user_id = auth.uid() then
    return;
  end if;
  select email into v_email from profiles where id = p_user_id and is_active;
  if not found then
    return;
  end if;
  select * into m from notification_meta(p_type) limit 1;
  v_priority := coalesce(p_priority, m.priority);
  if m.critical or notification_allowed(p_user_id, m.pref, 'in_app') then
    insert into notifications (user_id, type, title, body, link, event_id, category, priority)
    values (p_user_id, p_type, left(p_title, 200), left(p_body, 1000), v_link, p_event_id, m.category, v_priority);
  end if;
  if m.email and v_email is not null and notification_allowed(p_user_id, m.pref, 'email') then
    insert into email_outbox (user_id, to_email, notification_type, subject, body, link, dedupe_key)
    values (p_user_id, v_email, p_type, left(p_title, 200), left(p_body, 1000), v_link,
            -- one email per thread per 15 minutes for chat; otherwise one per identical notice per hour
            case when p_type = 'message.new'
                 then p_user_id || ':' || coalesce(v_link, '') || ':' || floor(extract(epoch from now()) / 900)
                 else p_user_id || ':' || p_type || ':' || coalesce(v_link, '') || ':' || md5(coalesce(p_title, '')) || ':' || floor(extract(epoch from now()) / 3600) end)
    on conflict (dedupe_key) do nothing;
  end if;
end;
$$;
revoke execute on function notify(uuid, text, text, text, text, uuid, text) from public, anon, authenticated;
grant execute on function notify(uuid, text, text, text, text, uuid, text) to service_role;

create or replace function notification_meta(p_type text)
returns table (category text, pref text, priority text, email boolean, critical boolean)
language sql immutable
as $$
  with m as (
    select v.category, v.pref, v.priority, v.email, v.critical
    from (values
    ('message.new',             'messages',     'messages',             'normal',    true,  false),
    ('booking.requested',       'events',       'booking_requests',     'important', true,  false),
    ('booking.accepted',        'events',       'booking_requests',     'normal',    true,  false),
    ('booking.declined',        'events',       'booking_requests',     'normal',    true,  false),
    ('booking.expired',         'events',       'booking_requests',     'normal',    false, false),
    ('assignment.new',          'events',       'event_updates',        'normal',    true,  false),
    ('schedule.changed',        'events',       'schedule_changes',     'important', true,  false),
    ('event.updated',           'events',       'event_updates',        'important', true,  false),
    ('event.cancelled',         'events',       'event_updates',        'urgent',    true,  true),
    ('event.reminder',          'events',       'event_reminders',      'important', true,  false),
    ('announcement.published',  'events',       'announcements',        'normal',    true,  false),
    ('document.added',          'events',       'document_updates',     'normal',    true,  false),
    ('requirement.requested',   'requirements', 'requirement_requests', 'important', true,  false),
    ('requirement.submitted',   'requirements', 'requirement_reviews',  'normal',    true,  false),
    ('requirement.reviewed',    'requirements', 'requirement_reviews',  'important', true,  false),
    ('task.assigned',           'tasks',        'tasks',                'normal',    false, false),
    ('task.overdue',            'tasks',        'tasks',                'important', false, false),
    ('access.granted',          'events',       'access',               'important', true,  false),
    ('access.revoked',          'events',       'access',               'important', true,  true),
    ('access.expiring',         'events',       'access',               'important', false, false),
    ('access.requested',        'events',       'access',               'normal',    true,  false),
    ('access.declined',         'events',       'access',               'normal',    false, false),
    ('application.new',         'applications', 'applications',         'normal',    true,  false),
    ('application.approved',    'applications', 'applications',         'important', false, true),
    ('application.rejected',    'applications', 'applications',         'normal',    false, true),
    ('media.reviewed',          'events',       'document_updates',     'normal',    false, false),
    ('media.submitted',         'events',       'document_updates',     'normal',    false, false),
    ('asset.submitted',         'events',       'document_updates',     'normal',    false, false),
    ('asset.reviewed',          'events',       'document_updates',     'normal',    true,  false),
    ('invoice.issued',          'payments',     'payment_updates',      'normal',    true,  false),
    ('invoice.paid',            'payments',     'payment_updates',      'normal',    true,  false),
    ('booking_payment.expired', 'payments',     'payment_updates',      'normal',    false, false),
    ('payment.late',            'payments',     'payment_updates',      'urgent',    true,  true),
    ('payment.webhook_failed',  'payments',     'payment_updates',      'urgent',    true,  true)
  ) v(t, category, pref, priority, email, critical)
    where v.t = p_type
  )
  select * from m
  union all
  select 'system', 'system', 'normal', false, false where not exists (select 1 from m);
$$;

drop policy if exists "artists: self apply" on artists;
create policy "artists: requires linked account" on artists for insert with check (user_id is not null);

drop policy if exists "private_enquiries: authenticated self submit" on private_enquiries;
create policy "private_enquiries: anyone can submit" on private_enquiries for insert with check (true);

drop policy if exists "contact_enquiries: self read own" on contact_enquiries;
drop policy if exists "contact_enquiries: authenticated self submit" on contact_enquiries;
create policy "contact_enquiries: anyone can submit" on contact_enquiries for insert with check (true);
drop index if exists contact_enquiries_user_id_idx;
alter table contact_enquiries drop column if exists user_id;

commit;
