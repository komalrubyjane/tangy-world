#!/usr/bin/env bash
# Runs every E2E suite against the local stack + dev server (see README.md).
set -uo pipefail
cd "$(dirname "$0")"
export DB_CONTAINER="${DB_CONTAINER:-$(docker ps --format '{{.Names}}' | grep -m1 '^supabase_db_')}"
psql() { docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -q -v ON_ERROR_STOP=1; }
mkdir -p shots
fail=0
# devmode.mjs drives the two dev-tools servers (DEV_MOCK_BASE / DEV_LOCAL_BASE, see README.md).
for suite in superadmin manager staff session platform portals mobile devmode; do
  psql < reset.sql && psql < staff_setup.sql || exit 1
  [[ $suite == staff ]] && node make-cam.mjs
  echo "== $suite"
  node "$suite.mjs" > "shots/$suite.log" 2>&1 || fail=1
  grep -q "^FAIL" "shots/$suite.log" && fail=1
  grep -vE "^PASS" "shots/$suite.log" | grep -v '^$' | sed 's/^/   /'
  echo "   $(grep -c '^PASS' "shots/$suite.log") passed"
  [[ $suite == staff ]] && psql < verify_checkins.sql  # one attendance record per scanned ticket
done
exit $fail
