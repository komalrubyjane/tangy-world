#!/usr/bin/env bash
# Data-safety checks for 0035_phase1_security_gaps.sql on THROWAWAY local
# PostgreSQL databases (same shim as scripts/test-db-local.sh; never touches
# a Supabase project).
#
#   A. 0001–0034 apply; representative rows are loaded; 0035 applies and
#      every row of every public table is byte-identical afterwards
#   B. re-applying 0035 succeeds and changes nothing
#   C. the rollback restores 0034's function privileges exactly and keeps rows
#   D. 0035 re-applies after the rollback and its test suite passes
#   E. duplicate artists.user_id: 0035 stops and changes nothing
#   F. a database without 0017–0034 (main's 0016 schema): 0035 stops
set -uo pipefail
cd "$(dirname "$0")/.."
PG_BIN="${PG_BIN:-/usr/lib/postgresql/16/bin}"
PORT="${PORT:-54330}"
WORK="$(mktemp -d)"; chmod 777 "$WORK"
as_pg() { if [ "$(id -u)" = "0" ]; then su postgres -s /bin/bash -c "$*"; else bash -c "$*"; fi; }
cleanup() { as_pg "$PG_BIN/pg_ctl -D '$WORK/data' -m immediate stop" >/dev/null 2>&1; rm -rf "$WORK"; }
trap cleanup EXIT
as_pg "$PG_BIN/initdb -D '$WORK/data' -U postgres --auth=trust" >/dev/null || exit 1
as_pg "$PG_BIN/pg_ctl -D '$WORK/data' -o \"-p $PORT -k '$WORK' -c listen_addresses=''\" -l '$WORK/pg.log' -w start" >/dev/null || exit 1
P() { psql -h "$WORK" -p "$PORT" -U postgres -X -q -v ON_ERROR_STOP=1 "$@"; }
M=supabase/migrations/0035_phase1_security_gaps.sql
R=supabase/rollbacks/0035_phase1_security_gaps.down.sql
fail=0
pass() { echo "PASS  $1"; }
bad() { echo "FAIL  $1"; fail=1; }

newdb() {  # newdb <name> <last migration to apply>
  P -d postgres -c "create database $1" >/dev/null
  # Roles are cluster-wide: on the second database their CREATE fails, harmlessly.
  P -d "$1" -v ON_ERROR_STOP=0 -f supabase/tests/local/supabase_shim.sql >/dev/null 2>&1
  P -d "$1" -c "alter database $1 set search_path to \"\$user\", public, extensions" >/dev/null
  for f in supabase/migrations/*.sql; do
    [ "$(basename "$f" | cut -c1-4)" \> "$2" ] && break
    P -d "$1" -1 -f "$f" >/dev/null 2>&1 || { echo "setup: $(basename "$f") failed on $1"; exit 1; }
  done
}

# Fingerprint of every row in every public table (except 0035's own ACL
# snapshot) and of every function ACL entry that existed before 0035.
ROWS="select string_agg(t, '|' order by t) from (
  select c.relname || ':' || (xpath('/row/c/text()', query_to_xml(format(
    'select count(*) || ''/'' || coalesce(md5(string_agg(x::text, '''' order by x::text)), '''') as c from public.%I x', c.relname), false, true, '')))[1]::text as t
  from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and c.relname <> '_security_0035_function_acl') s"
ACLS="select md5(string_agg(e, ',' order by e)) from (
  select p.oid::regprocedure::text || '>' || a.grantee::regrole::text || ':' || a.privilege_type as e
  from pg_proc p cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
  where p.pronamespace = 'public'::regnamespace and a.grantee <> 0 and a.grantee <> p.proowner
    and p.proname not in ('guard_application_start', 'guard_profile_identity', 'sync_profile_email',
                          'guard_assignment_request_artist', 'guard_conversation_admin_participant')
  union all
  select p.oid::regprocedure::text || '>PUBLIC:' || a.privilege_type
  from pg_proc p cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
  where p.pronamespace = 'public'::regnamespace and a.grantee = 0
    and p.proname not in ('guard_application_start', 'guard_profile_identity', 'sync_profile_email',
                          'guard_assignment_request_artist', 'guard_conversation_admin_participant')) s"
SEED="
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000005a1', 'owner.admin@seed.test', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000005a2', 'patron@seed.test', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000005a3', 'artist.ok@seed.test', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000005a4', 'artist.pending@seed.test', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000005a5', 'vendor@seed.test', 'authenticated', 'authenticated');
update profiles set role = 'super_admin' where id = '00000000-0000-0000-0000-0000000005a1';
insert into events (id, slug, name, event_date, capacity, price, status) values
  ('00000000-0000-0000-0000-0000000005e1', 'seed-1', 'Seed Session', current_date + 20, 120, 799, 'on-sale'),
  ('00000000-0000-0000-0000-0000000005e2', 'seed-2', 'Seed Past', current_date - 20, 120, 799, 'past');
insert into artists (user_id, name, email, status) values
  ('00000000-0000-0000-0000-0000000005a3', 'Seed Artist', 'artist.ok@seed.test', 'approved'),
  ('00000000-0000-0000-0000-0000000005a4', 'Seed Pending', 'artist.pending@seed.test', 'pending');
insert into collaborations (type, business_name, email, user_id, status) values ('vendor', 'Seed Chai', 'vendor@seed.test', '00000000-0000-0000-0000-0000000005a5', 'approved');
insert into private_enquiries (type, name, email, status) values ('wedding', 'Seed Enquiry', 'e@seed.test', 'pending');
insert into contact_enquiries (name, email, message, status) values ('Seed Contact', 'c@seed.test', 'hello', 'replied');
insert into bookings (id, registration_code, user_id, event_id, attendee_name, attendee_email, quantity, amount, status) values
  ('00000000-0000-0000-0000-0000000005b1', 'SEED-1', '00000000-0000-0000-0000-0000000005a2', '00000000-0000-0000-0000-0000000005e1', 'Patron', 'patron@seed.test', 2, 1886, 'confirmed');
insert into tickets (id, booking_id, event_id, user_id, ticket_number, token, status) values
  ('00000000-0000-0000-0000-0000000005c1', '00000000-0000-0000-0000-0000000005b1', '00000000-0000-0000-0000-0000000005e1', '00000000-0000-0000-0000-0000000005a2', 'SEED-1-01', 'tok-seed-1', 'checked_in'),
  ('00000000-0000-0000-0000-0000000005c2', '00000000-0000-0000-0000-0000000005b1', '00000000-0000-0000-0000-0000000005e1', '00000000-0000-0000-0000-0000000005a2', 'SEED-1-02', 'tok-seed-2', 'valid');
insert into checkins (booking_id, ticket_id, event_id) values ('00000000-0000-0000-0000-0000000005b1', '00000000-0000-0000-0000-0000000005c1', '00000000-0000-0000-0000-0000000005e1');
insert into waitlist (event_id, name, email) values ('00000000-0000-0000-0000-0000000005e1', 'Patron', 'patron@seed.test');
"

echo "== A. existing rows survive 0035"
newdb a 0034
P -d a -c "$SEED" >/dev/null || { echo "seed failed"; exit 1; }
rows0=$(P -d a -At -c "$ROWS"); acl0=$(P -d a -At -c "$ACLS")
echo "   $(P -d a -At -c "select (select count(*) from events)||' events, '||(select count(*) from bookings)||' bookings, '||(select count(*) from tickets)||' tickets, '||(select count(*) from checkins)||' check-ins, '||(select count(*) from artists)||' artists, '||(select count(*) from profiles)||' profiles'")"
if P -d a -1 -f "$M" >/dev/null 2>&1; then pass "0035 applies on a 0034 database with data"; else bad "0035 failed to apply"; fi
[ "$(P -d a -At -c "$ROWS")" = "$rows0" ] && pass "every row of every table unchanged" || bad "rows changed"
[ "$(P -d a -At -c "select count(*) from artists where status = 'approved'")" = "1" ] && pass "pre-existing approved rows keep their status" || bad "status rewritten"

echo "== B. re-apply"
if P -d a -1 -f "$M" >/dev/null 2>&1; then pass "0035 re-applies (idempotent)"; else bad "re-apply failed"; fi
[ "$(P -d a -At -c "$ROWS")" = "$rows0" ] && pass "rows still unchanged" || bad "rows changed on re-apply"

echo "== C. rollback"
if P -d a -1 -f "$R" >/dev/null 2>&1; then pass "rollback applies"; else bad "rollback failed"; fi
[ "$(P -d a -At -c "$ACLS")" = "$acl0" ] && pass "function privileges are exactly the 0034 ones again" || bad "function privileges differ after rollback"
[ "$(P -d a -At -c "select count(*) from pg_trigger where tgname in ('artists_guard_start','guard_profile_identity_change','on_auth_user_email_changed','assignment_requests_guard_artist','conversation_participants_guard_admin')")" = "0" ] && pass "0035 triggers removed" || bad "triggers left behind"
[ "$(P -d a -At -c "select count(*) from pg_policies where policyname = 'waitlist: self read own by email'")" = "1" ] && pass "0009 waitlist policy restored" || bad "waitlist policy not restored"
[ "$(P -d a -At -c "$ROWS")" = "$rows0" ] && pass "rows unchanged by the rollback" || bad "rows changed by rollback"

echo "== D. re-apply after rollback"
if P -d a -1 -f "$M" >/dev/null 2>&1; then pass "0035 re-applies after rollback"; else bad "re-apply after rollback failed"; fi
out=$(P -d a < supabase/tests/phase1_security_gaps.test.sql 2>&1)
echo "$out" | grep -q "PASSED" && pass "phase1 suite passes after rollback + re-apply ($(echo "$out" | grep -c 'NOTICE:  ok') assertions)" || { bad "phase1 suite failed"; echo "$out" | grep -m2 ERROR; }

echo "== E. duplicate artists.user_id stops the migration"
newdb e 0034
P -d e -c "insert into auth.users (id, email, aud, role) values ('00000000-0000-0000-0000-0000000005d1', 'dup@seed.test', 'authenticated', 'authenticated');
  insert into artists (user_id, name, email, status) values ('00000000-0000-0000-0000-0000000005d1', 'Dup One', 'dup@seed.test', 'rejected'), ('00000000-0000-0000-0000-0000000005d1', 'Dup Two', 'dup@seed.test', 'pending');" >/dev/null
rows_e=$(P -d e -At -c "$ROWS"); acl_e=$(P -d e -At -c "$ACLS")
err=$(P -d e -1 -f "$M" 2>&1)
echo "$err" | grep -q "STOP: artists.user_id has duplicates" && pass "stops with: $(echo "$err" | grep -o 'STOP: artists.user_id has duplicates[^.]*' | cut -c1-120)" || bad "did not stop on duplicates"
[ "$(P -d e -At -c "$ROWS")" = "$rows_e" ] && [ "$(P -d e -At -c "$ACLS")" = "$acl_e" ] \
  && [ "$(P -d e -At -c "select count(*) from pg_trigger where tgname = 'artists_guard_start'")" = "0" ] \
  && [ "$(P -d e -At -c "select to_regclass('public._security_0035_function_acl') is null")" = "t" ] \
  && pass "nothing changed: both artist rows kept, no trigger, no privilege change, no snapshot table" || bad "partial changes after STOP"

echo "== F. wrong baseline (main's 0016 schema) stops the migration"
newdb f 0016
err=$(P -d f -1 -f "$M" 2>&1)
echo "$err" | grep -q "STOP: 0035 expects the platform-finalization schema" && pass "stops on a 0016 database" || bad "did not stop on 0016"

exit $fail
