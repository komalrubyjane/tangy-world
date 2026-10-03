-- Tangy Sessions — authentication-first enquiries + notification privacy.
--
-- Product rule: every enquiry / application / interest form requires a
-- signed-in account. Choosing a path never grants a role (profiles.role is
-- still only changed by an admin approval — 0003/0015/0018).
--
--  1. contact_enquiries and private_enquiries: no more anonymous inserts.
--     Inserts must come from a signed-in user as themselves
--     (user_id = auth.uid()); contact_enquiries gains user_id (older rows stay
--     NULL). Applicants can read their own enquiries.
--  2. artists: the insert policy only required *a* user_id ("requires linked
--     account"), so anyone — even anonymously — could file an application
--     attributed to another user. Now user_id must be the caller.
--  3. Duplicate guard: a second PENDING application of the same kind from the
--     same account is refused (DUPLICATE_APPLICATION), and an identical
--     contact message within 24 h is ignored as a double submit. Existing
--     rows are never touched. A per-user advisory lock makes the check safe
--     against concurrent submits.
--  4. Receipts + alerts: the applicant gets an in-app "we received it"
--     notification (and email, once email is configured); applications.review
--     holders are alerted to new contact / private-session enquiries (other
--     application types were already covered by 0018).
--  5. notify(): message emails no longer carry the message text (a preview
--     in someone's inbox leaves the platform); the in-app notification, seen
--     only by the recipient, still shows it. notify() may now address the
--     acting user for receipt-type notifications only.
--  6. notification_meta gains the types used by 0025–0027.
--
-- Rollback: rollbacks/0025_enquiries_auth_first.down.sql

begin;

-- 1. Enquiries belong to the signed-in user ---------------------------------------
alter table contact_enquiries add column if not exists user_id uuid references auth.users(id) on delete set null;
create index if not exists contact_enquiries_user_id_idx on contact_enquiries (user_id);

drop policy if exists "contact_enquiries: anyone can submit" on contact_enquiries;
drop policy if exists "contact_enquiries: authenticated self submit" on contact_enquiries;
create policy "contact_enquiries: authenticated self submit" on contact_enquiries for insert to authenticated
  with check (auth.uid() is not null and user_id = auth.uid());
drop policy if exists "contact_enquiries: self read own" on contact_enquiries;
create policy "contact_enquiries: self read own" on contact_enquiries for select to authenticated using (user_id = auth.uid());

drop policy if exists "private_enquiries: anyone can submit" on private_enquiries;
drop policy if exists "private_enquiries: authenticated self submit" on private_enquiries;
create policy "private_enquiries: authenticated self submit" on private_enquiries for insert to authenticated
  with check (auth.uid() is not null and user_id = auth.uid());

-- 2. Artist applications as yourself only ------------------------------------------
drop policy if exists "artists: requires linked account" on artists;
drop policy if exists "artists: self apply" on artists;
create policy "artists: self apply" on artists for insert to authenticated with check (auth.uid() = user_id);

-- 3. One pending application per kind -----------------------------------------------
create or replace function guard_duplicate_application()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_label text;
  v_dup boolean := false;
begin
  if new.user_id is null then
    return new;
  end if;
  -- Serialise this user's submissions so two quick clicks can't both pass.
  perform pg_advisory_xact_lock(hashtext('application:' || new.user_id::text));
  if tg_table_name = 'collaborations' then
    v_label := replace(new.type::text, '_', ' ');
    v_dup := exists (select 1 from collaborations where user_id = new.user_id and type = new.type and status = 'pending');
  elsif tg_table_name = 'crew_applications' then
    v_label := coalesce(new.category, 'crew');
    v_dup := exists (select 1 from crew_applications where user_id = new.user_id and category is not distinct from new.category and status = 'pending');
  elsif tg_table_name = 'artists' then
    v_label := 'artist';
    v_dup := exists (select 1 from artists where user_id = new.user_id and status = 'pending');
  elsif tg_table_name = 'private_enquiries' then
    v_label := 'private session';
    v_dup := exists (select 1 from private_enquiries where user_id = new.user_id and type = new.type and status = 'pending');
  elsif tg_table_name = 'contact_enquiries' then
    -- The same message twice within a day is a double submit, not a new enquiry.
    if exists (select 1 from contact_enquiries where user_id = new.user_id and created_at > now() - interval '24 hours'
               and lower(btrim(message)) = lower(btrim(new.message))) then
      raise exception 'DUPLICATE_APPLICATION: We already have this message — the team will reply soon.';
    end if;
    return new;
  end if;
  if v_dup then
    raise exception 'DUPLICATE_APPLICATION: You already have a pending % application — we''ll be in touch.', v_label;
  end if;
  return new;
end;
$$;

drop trigger if exists collaborations_guard_duplicate on collaborations;
create trigger collaborations_guard_duplicate before insert on collaborations for each row execute function guard_duplicate_application();
drop trigger if exists crew_applications_guard_duplicate on crew_applications;
create trigger crew_applications_guard_duplicate before insert on crew_applications for each row execute function guard_duplicate_application();
drop trigger if exists artists_guard_duplicate on artists;
create trigger artists_guard_duplicate before insert on artists for each row execute function guard_duplicate_application();
drop trigger if exists private_enquiries_guard_duplicate on private_enquiries;
create trigger private_enquiries_guard_duplicate before insert on private_enquiries for each row execute function guard_duplicate_application();
drop trigger if exists contact_enquiries_guard_duplicate on contact_enquiries;
create trigger contact_enquiries_guard_duplicate before insert on contact_enquiries for each row execute function guard_duplicate_application();

-- 6. Notification types -------------------------------------------------------------
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
    ('application.received',    'applications', 'applications',         'normal',    true,  true),
    ('enquiry.new',             'applications', 'applications',         'normal',    true,  false),
    ('media.reviewed',          'events',       'document_updates',     'normal',    false, false),
    ('media.submitted',         'events',       'document_updates',     'normal',    false, false),
    ('asset.submitted',         'events',       'document_updates',     'normal',    false, false),
    ('asset.reviewed',          'events',       'document_updates',     'normal',    true,  false),
    ('invoice.issued',          'payments',     'payment_updates',      'normal',    true,  false),
    ('invoice.paid',            'payments',     'payment_updates',      'normal',    true,  false),
    ('booking_payment.expired', 'payments',     'payment_updates',      'normal',    false, false),
    ('payment.late',            'payments',     'payment_updates',      'urgent',    true,  true),
    ('payment.review',          'payments',     'payment_updates',      'urgent',    true,  true),
    ('payment.webhook_failed',  'payments',     'payment_updates',      'urgent',    true,  true),
    ('waitlist.joined',         'events',       'event_updates',        'normal',    true,  true),
    ('waitlist.offer',          'events',       'event_updates',        'urgent',    true,  true),
    ('waitlist.offer_expired',  'events',       'event_updates',        'important', true,  true),
    ('waitlist.converted',      'events',       'event_updates',        'normal',    false, true)
  ) v(t, category, pref, priority, email, critical)
    where v.t = p_type
  )
  select * from m
  union all
  select 'system', 'system', 'normal', false, false where not exists (select 1 from m);
$$;

-- 5. notify(): private message emails; receipts may address the actor ------------
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
  v_email_body text;
begin
  -- Nobody is notified about their own actions — except receipts, which exist
  -- precisely to confirm the actor's own submission.
  if p_user_id is null or (p_user_id = auth.uid() and p_type not in ('application.received', 'waitlist.joined')) then
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
  -- Message text never goes into an email: the inbox is outside Tangy.
  v_email_body := case when p_type = 'message.new' then 'You have a new message on Tangy. Open it to read and reply.' else left(p_body, 1000) end;
  if m.email and v_email is not null and notification_allowed(p_user_id, m.pref, 'email') then
    insert into email_outbox (user_id, to_email, notification_type, subject, body, link, dedupe_key)
    values (p_user_id, v_email, p_type, left(p_title, 200), v_email_body, v_link,
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

-- 4. Receipts and enquiry alerts ------------------------------------------------------
create or replace function notify_on_enquiry_received()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_what text;
  v_link text;
begin
  -- IF branches (not one CASE expression): each table has different columns.
  if tg_table_name = 'collaborations' then
    v_what := replace(new.type::text, '_', ' ') || ' application';
  elsif tg_table_name = 'crew_applications' then
    v_what := coalesce(new.category, 'crew') || ' application';
  elsif tg_table_name = 'artists' then
    v_what := 'artist application';
  elsif tg_table_name = 'private_enquiries' then
    v_what := 'private session enquiry';
  else
    v_what := 'message';
  end if;
  v_link := case when tg_table_name in ('collaborations', 'crew_applications', 'artists') then '/dashboard' else null end;
  perform notify(new.user_id, 'application.received', 'We received your ' || v_what,
    'Thank you — the Tangy team reviews every submission and will reply by email. Applying doesn''t change your account until it''s approved.',
    v_link);
  if tg_table_name in ('private_enquiries', 'contact_enquiries') then
    perform notify_permission_holders('applications.review', 'enquiry.new',
      'New ' || v_what || ' from ' || coalesce(new.name, 'a member'),
      left(coalesce(new.message, ''), 140),
      case when tg_table_name = 'private_enquiries' then '/admin-portal/ops/enquiries' else '/admin-portal/ops/contact' end);
  end if;
  return new;
end;
$$;

drop trigger if exists collaborations_receipt on collaborations;
create trigger collaborations_receipt after insert on collaborations for each row execute function notify_on_enquiry_received();
drop trigger if exists crew_applications_receipt on crew_applications;
create trigger crew_applications_receipt after insert on crew_applications for each row execute function notify_on_enquiry_received();
drop trigger if exists artists_receipt on artists;
create trigger artists_receipt after insert on artists for each row execute function notify_on_enquiry_received();
drop trigger if exists private_enquiries_receipt on private_enquiries;
create trigger private_enquiries_receipt after insert on private_enquiries for each row execute function notify_on_enquiry_received();
drop trigger if exists contact_enquiries_receipt on contact_enquiries;
create trigger contact_enquiries_receipt after insert on contact_enquiries for each row execute function notify_on_enquiry_received();

commit;
