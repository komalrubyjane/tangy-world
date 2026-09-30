#!/usr/bin/env bash
# LOCAL STACK ONLY. Race-condition checks that need two real database
# sessions at once (a single-transaction SQL test can't show them):
#   1. two overlapping run_platform_jobs() → the second is skipped, not doubled
#   2. two checkouts racing for the last seat → exactly one succeeds
#   3. two offer passes racing for one released seat → exactly one offer
# Uses a throwaway session 'race-e2e-*' and removes it afterwards.
set -uo pipefail
C="${DB_CONTAINER:-$(docker ps --format '{{.Names}}' | grep -m1 '^supabase_db_')}"
q() { docker exec -i "$C" psql -U postgres -d postgres -qAt -v ON_ERROR_STOP=1 -c "$1"; }
fail=0
T="$(mktemp -d)"
trap 'rm -rf "$T"' EXIT
check() { if [[ "$1" == "$2" ]]; then echo "PASS  $3"; else echo "FAIL  $3 (got '$1', expected '$2')"; fail=1; fi; }

cleanup() {
  q "delete from waitlist where event_id in (select id from events where slug like 'race-e2e-%');
     delete from bookings where event_id in (select id from events where slug like 'race-e2e-%');
     delete from events where slug like 'race-e2e-%';
     delete from platform_job_runs where source like 'race-%';" >/dev/null
}
cleanup

# 1. Overlapping job runs -------------------------------------------------------------
( docker exec -i "$C" psql -U postgres -d postgres -qAt -c "begin; select pg_advisory_xact_lock(hashtext('tangy.run_platform_jobs')); select pg_sleep(3); commit;" >/dev/null ) &
sleep 1
second=$(q "select run_platform_jobs('race-second') ->> 'skipped'")
wait
check "$second" "true" "a run that overlaps another is skipped (single-flight lock)"
third=$(q "select (run_platform_jobs('race-third') ? 'bookings_expired')::text")
check "$third" "true" "once the first finishes, the next run goes ahead"
check "$(q "select count(*) from platform_job_runs where source = 'race-second' and skipped")" "1" "the skipped run is recorded"

# 2. Last-seat checkout race -------------------------------------------------------------
q "insert into events (slug, name, event_date, venue, capacity, price, status) values ('race-e2e-seat', 'Race Night', current_date + 3, 'Stepwell', 1, 500, 'on-sale')" >/dev/null
EVT=$(q "select id from events where slug = 'race-e2e-seat'")
race() { docker exec -i "$C" psql -U postgres -d postgres -qAt -c "select (create_pending_booking(null, '$EVT', '$1', 'R', 'r@x.test', null, 1, 0, 'gen', null)).status" 2>&1 | grep -o 'pending\|SOLD_OUT' | head -1; }
race RACE-A > "$T/race-a" & race RACE-B > "$T/race-b" & wait
results="$(cat "$T/race-a" "$T/race-b" | sort | tr '\n' ' ')"
check "$results" "SOLD_OUT pending " "two checkouts for the last seat: one succeeds, one is refused"
check "$(q "select count(*) from bookings where event_id = '$EVT' and status = 'pending'")" "1" "capacity is never exceeded"

# 3. Offer race -----------------------------------------------------------------------------
q "insert into auth.users (id, email, aud, role) values ('00000000-0000-0000-0000-0000000ace01', 'race1@tangy.test', 'authenticated', 'authenticated') on conflict do nothing" >/dev/null
q "insert into waitlist (event_id, user_id, name, email, quantity, status) values ('$EVT', '00000000-0000-0000-0000-0000000ace01', 'Race', 'race1@tangy.test', 1, 'waiting')" >/dev/null
q "alter table bookings disable trigger bookings_release_to_waitlist; update bookings set status = 'cancelled' where event_id = '$EVT'; alter table bookings enable trigger bookings_release_to_waitlist" >/dev/null
offer() { docker exec -i "$C" psql -U postgres -d postgres -qAt -c "select offer_waitlist_seats('$EVT')"; }
offer > "$T/offer-a" & offer > "$T/offer-b" & wait
check "$(cat "$T/offer-a" "$T/offer-b" | paste -sd+ - | bc)" "1" "two concurrent offer passes make exactly one offer"
check "$(q "select count(*) from waitlist where event_id = '$EVT' and status = 'offered'")" "1" "the released seat is offered once"

cleanup
q "delete from notifications where user_id = '00000000-0000-0000-0000-0000000ace01'; delete from auth.users where id = '00000000-0000-0000-0000-0000000ace01'" >/dev/null
[[ $fail == 0 ]] && echo "ALL CONCURRENCY CHECKS PASSED"
exit $fail
