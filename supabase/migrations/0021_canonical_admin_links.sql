-- Tangy Sessions — canonical console links in new notifications.
--
-- The admin console moved from /admin to /admin-portal (the app keeps a
-- /admin/* → /admin-portal/* redirect, so older links keep working). 0020
-- already rewrote most notification generators, but several 0018 triggers
-- and RPCs still build /admin/... links: notify_on_assignment (staff
-- "my events"), notify_on_task (/admin/tasks), notify_on_application
-- (/admin/applications), on_message_created (/admin/messages?c=…) and
-- request_checkin_access (/admin/volunteers?requests=1).
--
-- Every in-app notification and every queued email goes through notify(),
-- so the link is canonicalised there once instead of copying five large
-- functions forward. Only /admin, /admin/... , /admin?... and /admin#...
-- are rewritten; /admin-portal/... and portal links are left untouched.
-- Rows that already exist are NOT rewritten (history stays as it was sent;
-- the redirect keeps them working).
--
-- Rollback: rollbacks/0021_canonical_admin_links.down.sql

begin;

create or replace function canonical_console_link(p_link text)
returns text
language sql immutable
as $$
  select case when p_link ~ '^/admin([/?#]|$)' then '/admin-portal' || substr(p_link, 7) else p_link end;
$$;

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

commit;
