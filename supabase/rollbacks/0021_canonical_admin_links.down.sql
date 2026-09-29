-- REVERSE of 0021_canonical_admin_links.sql — run by hand only, BEFORE
-- rollbacks/0020_platform_finalization.down.sql.
--
-- Restores 0020's notify() (links stored exactly as passed) and drops the
-- helper. Notifications created while 0021 was live keep their
-- /admin-portal/... links, which are valid routes either way.

begin;

create or replace function notify(p_user_id uuid, p_type text, p_title text, p_body text default null,
                                  p_link text default null, p_event_id uuid default null, p_priority text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  m record;
  v_email text;
  v_priority text;
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
    values (p_user_id, p_type, left(p_title, 200), left(p_body, 1000), p_link, p_event_id, m.category, v_priority);
  end if;
  if m.email and v_email is not null and notification_allowed(p_user_id, m.pref, 'email') then
    insert into email_outbox (user_id, to_email, notification_type, subject, body, link, dedupe_key)
    values (p_user_id, v_email, p_type, left(p_title, 200), left(p_body, 1000), p_link,
            case when p_type = 'message.new'
                 then p_user_id || ':' || coalesce(p_link, '') || ':' || floor(extract(epoch from now()) / 900)
                 else p_user_id || ':' || p_type || ':' || coalesce(p_link, '') || ':' || md5(coalesce(p_title, '')) || ':' || floor(extract(epoch from now()) / 3600) end)
    on conflict (dedupe_key) do nothing;
  end if;
end;
$$;
revoke execute on function notify(uuid, text, text, text, text, uuid, text) from public, anon, authenticated;
grant execute on function notify(uuid, text, text, text, text, uuid, text) to service_role;

drop function if exists canonical_console_link(text);

commit;
