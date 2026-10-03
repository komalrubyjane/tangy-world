#!/usr/bin/env bash
# Validates supabase/production-bootstrap/ on a THROWAWAY local PostgreSQL 16
# cluster (same Supabase shim as scripts/test-db-local.sh). Never connects to
# a Supabase project.
#
#   1. checks the package: 0004 absent, unchanged copies byte-identical to
#      supabase/migrations/, the two .production.sql files differ from their
#      originals by deletions only
#   2. applies every package file in order, each as its own transaction
#   3. runs the read-only production inventory and the empty-database checks
#   4. runs every supabase/tests/*.test.sql suite on the same database
set -uo pipefail
cd "$(dirname "$0")/.."
B=supabase/production-bootstrap
PG_BIN="${PG_BIN:-/usr/lib/postgresql/16/bin}"
PORT="${PORT:-54331}"
WORK="$(mktemp -d)"; chmod 777 "$WORK"
as_pg() { if [ "$(id -u)" = "0" ]; then su postgres -s /bin/bash -c "$*"; else bash -c "$*"; fi; }
cleanup() { as_pg "$PG_BIN/pg_ctl -D '$WORK/data' -m immediate stop" >/dev/null 2>&1; rm -rf "$WORK"; }
trap cleanup EXIT
fail=0
pass() { echo "PASS  $1"; }
bad() { echo "FAIL  $1"; fail=1; }

echo "== 1. package"
ls $B/0004_* >/dev/null 2>&1 && bad "0004 is in the package" || pass "0004 is not in the package"
n=0; for f in $B/0*.sql; do
  b=$(basename "$f")
  case "$b" in
    *.production.sql)
      o=supabase/migrations/${b%.production.sql}.sql
      if diff "$o" "$f" | grep -q '^>'; then bad "$b adds lines to $o"; else pass "$b = $(basename "$o") minus $(diff "$o" "$f" | grep -c '^<') deleted lines, nothing added"; fi ;;
    *) cmp -s "$f" "supabase/migrations/$b" && n=$((n + 1)) || bad "$b differs from supabase/migrations/$b" ;;
  esac
done
pass "$n unchanged copies are byte-identical to supabase/migrations/"
[ "$(ls $B/0*.sql | wc -l)" = "34" ] && pass "34 migration files (0001-0035 without 0004)" || bad "expected 34 files"

echo "== 2. apply to a fresh local database"
as_pg "$PG_BIN/initdb -D '$WORK/data' -U postgres --auth=trust" >/dev/null || exit 1
as_pg "$PG_BIN/pg_ctl -D '$WORK/data' -o \"-p $PORT -k '$WORK' -c listen_addresses=''\" -l '$WORK/pg.log' -w start" >/dev/null || exit 1
P() { psql -h "$WORK" -p "$PORT" -U postgres -d postgres -X -q -v ON_ERROR_STOP=1 "$@"; }
P -f supabase/tests/local/supabase_shim.sql >/dev/null 2>&1 || { echo "shim failed"; exit 1; }
applied=0
for f in $B/0*.sql; do
  out=$(P -1 -f "$f" 2>&1) || { bad "$(basename "$f") failed: $(echo "$out" | grep -m1 ERROR)"; exit 1; }
  applied=$((applied + 1))
done
pass "applied $applied files in order (0001-0003, 0005-0035)"

echo "== 3. production inventory (read-only) and empty-database checks"
P -A -F ' | ' -t -c "begin transaction read only" -f $B/checks/production_inventory.readonly.sql -c "rollback" | sed 's/^/   /'
q() { P -At -c "$1"; }
chk() { [ "$(q "$1")" = "$2" ] && pass "$3" || bad "$3 (got: $(q "$1"))"; }
chk "select count(*) from pg_class where relnamespace = 'public'::regnamespace and relname in ('announcements','tv_videos','gallery_albums','gallery_photos','diary_posts','programmes','venues','role_permissions','system_settings')" 9 "CMS / RBAC / settings tables exist"
chk "select string_agg(id, ',' order by id) from storage.buckets" "artist-avatars,artist-documents,artist-media,content-media,event-documents,sponsor-assets" "all 6 storage buckets exist"
chk "select count(*) from events" 0 "no seed events (0004 skipped)"
chk "select count(*) from announcements" 0 "no mock announcements"
chk "select (select count(*) from tv_videos) + (select count(*) from gallery_albums) + (select count(*) from gallery_photos) + (select count(*) from diary_posts)" 0 "no seeded TV / gallery / diary content"
chk "select (select count(*) from auth.users) + (select count(*) from profiles)" 0 "no users or profiles"
chk "select (select count(*) from bookings) + (select count(*) from tickets) + (select count(*) from checkins) + (select count(*) from payment_webhook_events)" 0 "no bookings, tickets, check-ins or payment events"
chk "select (select count(*) from artists) + (select count(*) from collaborations) + (select count(*) from crew_applications) + (select count(*) from private_enquiries) + (select count(*) from contact_enquiries) + (select count(*) from artist_applications)" 0 "no artists, applications or enquiries"
chk "select (select count(*) from conversations) + (select count(*) from messages) + (select count(*) from notifications)" 0 "no conversations, messages or notifications"
chk "select (select count(*) from venues) + (select count(*) from event_ticket_types) + (select count(*) from waitlist)" 0 "no derived venues, ticket types or waitlist rows"
chk "select count(*) > 0 from role_permissions" t "role permissions configured"
chk "select count(*) > 0 from system_settings" t "system settings configured"
chk "select exists (select 1 from pg_proc where proname = 'artist_day_status' and pronamespace = 'public'::regnamespace)" t "0034 detected"
chk "select exists (select 1 from pg_proc where proname = 'guard_application_start' and pronamespace = 'public'::regnamespace)" t "0035 detected"

echo "== 4. test suites"
# Pass A — the suites exactly as they are. admin_system and content_cms
# contain assertions that the removed seed rows exist ("existing public
# announcements carried over", "the bundled TV channels are published"), so
# on the production schema they are EXPECTED to stop at those assertions.
# Pass B — the same suites with exactly the removed seed statements (taken
# from the package diff, nothing added) executed INSIDE each suite's own
# transaction, which the suite rolls back: proves every other assertion
# holds on the production schema without leaving seed rows behind.
seed="$WORK/removed_seed.sql"
for p in 0017_admin_system 0028_content_cms; do
  diff supabase/migrations/$p.sql $B/$p.production.sql | sed -n 's/^< //p'
done > "$seed"
run_suites() {  # run_suites <label> <inject seed: yes/no>
  local total=0 failed=""
  for f in supabase/tests/*.test.sql; do
    if [ "$2" = yes ]; then
      out=$(awk -v seed="$seed" '!done && /^begin;/ { print; while ((getline l < seed) > 0) print l; done = 1; next } { print }' "$f" | P 2>&1)
    else
      out=$(P < "$f" 2>&1)
    fi
    c=$(echo "$out" | grep -c "NOTICE:  ok"); total=$((total + c))
    if echo "$out" | grep -qE "^(psql:[^ ]* )?ERROR"; then
      failed="$failed $(basename "$f" .test.sql)"; echo "   $(basename "$f"): STOPPED after $c — $(echo "$out" | grep -m1 ERROR | cut -c1-110)"
    else
      echo "   $(basename "$f"): $c"
    fi
  done
  echo "   $1: $total assertions; stopped:${failed:- none}"
  RESULT="${failed# }"
}
echo "-- pass A: suites unchanged"
run_suites "pass A" no
[ "$RESULT" = "admin_system content_cms" ] && pass "pass A: only the two suites that assert the removed seed rows exist stop" || bad "pass A: unexpected failures: $RESULT"
echo "-- pass B: removed seed statements inside each suite's rolled-back transaction"
run_suites "pass B" yes
[ -z "$RESULT" ] && pass "pass B: all 18 suites pass on the production schema" || bad "pass B failures: $RESULT"
chk "select (select count(*) from events) + (select count(*) from announcements) + (select count(*) from tv_videos) + (select count(*) from gallery_photos) + (select count(*) from diary_posts) + (select count(*) from auth.users)" 0 "after both passes the database is still empty (all suites rolled back)"
exit $fail
