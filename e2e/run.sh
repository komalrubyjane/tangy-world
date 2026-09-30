#!/usr/bin/env bash
# Runs every E2E suite against the local stack + dev server (see README.md).
set -uo pipefail
cd "$(dirname "$0")"
export DB_CONTAINER="${DB_CONTAINER:-$(docker ps --format '{{.Names}}' | grep -m1 '^supabase_db_')}"
psql() { docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -q -v ON_ERROR_STOP=1; }
mkdir -p shots
fail=0
# The suites below assume only their own fixtures, so the local demo dataset
# (scripts/demo-data.sh) is taken out first; it is loaded again for the
# routing suite and left in place afterwards for review.
../scripts/demo-data.sh remove >/dev/null
run() {
  local suite=$1
  echo "== $suite"
  node "$suite.mjs" > "shots/$suite.log" 2>&1 || fail=1
  grep -q "^FAIL" "shots/$suite.log" && fail=1
  grep -vE "^PASS" "shots/$suite.log" | grep -v '^$' | sed 's/^/   /'
  echo "   $(grep -c '^PASS' "shots/$suite.log") passed"
}
# devmode.mjs drives the two dev-tools servers (DEV_MOCK_BASE / DEV_LOCAL_BASE, see README.md).
for suite in superadmin manager staff session platform groupcheckin checkout enquiries waitlist content portals mobile responsive devmode; do
  psql < reset.sql && psql < staff_setup.sql || exit 1
  [[ $suite == staff ]] && node make-cam.mjs
  run "$suite"
  [[ $suite == staff ]] && psql < verify_checkins.sql  # one attendance record per scanned ticket
done
psql < reset.sql && psql < staff_setup.sql || exit 1
../scripts/demo-data.sh seed >/dev/null || { echo "could not load the demo dataset"; exit 1; }
run routing
run sweep
exit $fail
