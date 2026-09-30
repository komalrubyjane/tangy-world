-- Tangy Sessions — messaging access control and privacy.
--
-- Classification (see supabase/README.md → Messaging security): messages are
-- NOT end-to-end encrypted. They are stored as plaintext in messages.content,
-- protected in transit by TLS and at rest by the database's storage
-- encryption, and access is enforced by RLS + SECURITY DEFINER RPCs. The Tangy
-- team (messages.manage) can read partner threads by design — it is a support
-- inbox. These tests pin that model down so it cannot silently widen.
-- One transaction, rolled back at the end. Run: scripts/test-db.sh

\set ON_ERROR_STOP 1
\set QUIET 1
begin;

delete from messages; delete from conversation_participants; delete from conversations;
delete from notifications; delete from email_outbox;

create schema tt;
create function tt.login(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;
create function tt.anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('role', 'anon', true);
end $$;
create function tt.logout() returns void language plpgsql as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
end $$;
create function tt.expect_error(p_sql text, p_pattern text, p_label text) returns void language plpgsql as $$
begin
  execute p_sql;
  raise exception 'FAIL [%]: expected an error matching "%", but the statement succeeded', p_label, p_pattern;
exception when others then
  if sqlerrm like 'FAIL [%' then raise; end if;
  if sqlerrm not ilike p_pattern then
    raise exception 'FAIL [%]: expected error matching "%", got "%"', p_label, p_pattern, sqlerrm;
  end if;
  raise notice 'ok  %', p_label;
end $$;
create function tt.check(p_cond boolean, p_label text) returns void language plpgsql as $$
begin
  if p_cond is not true then
    raise exception 'FAIL [%]', p_label;
  end if;
  raise notice 'ok  %', p_label;
end $$;
grant usage on schema tt to anon, authenticated;
grant execute on all functions in schema tt to anon, authenticated;

insert into auth.users (id, email, aud, role, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000d501', 'mgr@msg.tangy.test',     'authenticated', 'authenticated', '{"full_name":"Mira Manager"}'),
  ('00000000-0000-0000-0000-00000000d502', 'staff@msg.tangy.test',   'authenticated', 'authenticated', '{"full_name":"Sam Staff"}'),
  ('00000000-0000-0000-0000-00000000d503', 'artist@msg.tangy.test',  'authenticated', 'authenticated', '{"full_name":"Asha Artist"}'),
  ('00000000-0000-0000-0000-00000000d504', 'sponsor@msg.tangy.test', 'authenticated', 'authenticated', '{"full_name":"Sona Sponsor"}'),
  ('00000000-0000-0000-0000-00000000d505', 'pat@msg.tangy.test',     'authenticated', 'authenticated', '{"full_name":"Pat Patron"}');
update profiles set role = 'admin' where id = '00000000-0000-0000-0000-00000000d501';
update profiles set role = 'staff' where id = '00000000-0000-0000-0000-00000000d502';
update profiles set role = 'artist' where id = '00000000-0000-0000-0000-00000000d503';
update profiles set role = 'sponsor' where id = '00000000-0000-0000-0000-00000000d504';

\echo '--- 1. A partner thread'
select tt.login('00000000-0000-0000-0000-00000000d503');
create temp table conv on commit drop as select start_partner_conversation('Rider', 'My rider: 2 mics, code QX7731') as id;
grant select on conv to authenticated, anon;
select tt.check((select count(*) = 1 from messages), 'the artist sees their own message');

\echo '--- 2. Nobody else outside the team can read it'
select tt.login('00000000-0000-0000-0000-00000000d504');
select tt.check((select count(*) from conversations) = 0 and (select count(*) from messages) = 0 and (select count(*) from conversation_participants) = 0,
  'another partner sees no conversations, messages or participants');
select tt.expect_error($$select * from conversation_messages((select id from conv))$$, '%not found%', 'another partner cannot open the thread by id');
select tt.expect_error($$select send_message((select id from conv), 'let me in')$$, '%not found%', 'another partner cannot post into it');
select tt.login('00000000-0000-0000-0000-00000000d505');
select tt.check((select count(*) from messages) = 0, 'a patron cannot read it');
select tt.login('00000000-0000-0000-0000-00000000d502');
select tt.check((select count(*) from messages) = 0 and (select count(*) from conversations) = 0, 'event staff cannot read partner messages');
select tt.expect_error($$select * from conversation_messages((select id from conv))$$, '%not found%', 'staff cannot open the thread by id');
select tt.anon();
select tt.check((select count(*) from messages) = 0, 'signed-out visitors cannot read messages');

\echo '--- 3. No forging, no self-invites, no edits'
select tt.login('00000000-0000-0000-0000-00000000d504');
select tt.expect_error($$insert into messages (conversation_id, sender_id, content) values ((select id from conv), '00000000-0000-0000-0000-00000000d504', 'x')$$, '%row-level security%', 'a non-participant cannot insert a message');
select tt.expect_error($$insert into conversation_participants (conversation_id, user_id, role) values ((select id from conv), auth.uid(), 'owner')$$, '%row-level security%', 'a user cannot add themselves to a thread');
select tt.login('00000000-0000-0000-0000-00000000d503');
select tt.expect_error($$insert into messages (conversation_id, sender_id, content) values ((select id from conv), '00000000-0000-0000-0000-00000000d501', 'Approved! — Tangy')$$, '%row-level security%', 'a participant cannot send as someone else (e.g. impersonate the team)');
with u as (update messages set content = 'edited' returning id) select tt.check(not exists (select 1 from u), 'messages cannot be edited after sending');
with d as (delete from messages returning id) select tt.check(not exists (select 1 from d), 'messages cannot be deleted by participants');
select tt.expect_error($$insert into conversations (subject, conversation_type, created_by, external_user_id) values ('x', 'artist_support', auth.uid(), '00000000-0000-0000-0000-00000000d504')$$, '%row-level security%', 'a user cannot create a support thread aimed at someone else');
select mark_conversation_read((select id from conv));
select tt.login('00000000-0000-0000-0000-00000000d504');
select tt.check((select count(*) from message_read_states) = 0, 'read receipts of others are private');

\echo '--- 4. The Tangy team (messages.manage) reads and replies — by design'
select tt.login('00000000-0000-0000-0000-00000000d501');
select tt.check((select count(*) = 1 from conversation_messages((select id from conv))), 'an admin can open the partner thread');
select send_message((select id from conv), 'Got it, thanks.');
select tt.login('00000000-0000-0000-0000-00000000d503');
select tt.check((select count(*) = 2 from conversation_messages((select id from conv)) where from_tangy is not null), 'the artist sees the team reply');

\echo '--- 5. What the platform does NOT claim'
select tt.logout();
select tt.check((select content from messages order by created_at limit 1) = 'My rider: 2 mics, code QX7731',
  'messages are stored as plaintext (NOT end-to-end encrypted) — keep product copy honest');
select tt.check(not exists (select 1 from audit_logs where metadata::text like '%QX7731%'), 'audit logs never contain message text');
select tt.check(not exists (select 1 from email_outbox where body like '%QX7731%' or subject like '%QX7731%'), 'notification emails never contain message text');
select tt.check(exists (select 1 from notifications where type = 'message.new'), 'recipients are notified in-app');

\echo ''
\echo 'ALL MESSAGING SECURITY DATABASE TESTS PASSED'
rollback;
