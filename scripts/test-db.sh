#!/usr/bin/env bash
# Runs the admin-system database tests against a LOCAL Supabase Postgres
# (never production). Each test file runs in one transaction and rolls back.
#
#   1. Start a local stack:  npx supabase start      (from any scratch folder)
#   2. Apply migrations:     scripts/test-db.sh --apply   (first time only)
#   3. Run tests:            scripts/test-db.sh
#
# Override the container with DB_CONTAINER=<name>.
set -euo pipefail
cd "$(dirname "$0")/.."

DB_CONTAINER="${DB_CONTAINER:-$(docker ps --format '{{.Names}}' | grep -m1 '^supabase_db_' || true)}"
if [[ -z "$DB_CONTAINER" ]]; then
  echo "No local Supabase database container found (run 'npx supabase start')." >&2
  exit 1
fi
PSQL=(docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q)

if [[ "${1:-}" == "--apply" ]]; then
  for f in supabase/migrations/0*.sql; do
    echo "applying $f"
    "${PSQL[@]}" < "$f"
  done
fi

# The suites wipe tables inside their own transactions; the local demo
# dataset (scripts/demo-data.sh) is set aside first and restored afterwards
# (its accounts stay, so the SQL seed alone brings it back).
demo=$("${PSQL[@]}" -At -c "select count(*) from events where id::text like 'de300000-%'")
if [[ "$demo" != "0" ]]; then
  "${PSQL[@]}" < supabase/demo/demo_remove.sql
  # Restore every demo seed, in the order scripts/demo-data.sh loads them
  # (the accounts are still there, so the SQL alone brings it all back).
  trap 'for f in demo_seed demo_seed_history demo_seed_artist_portal demo_seed_workflow; do "${PSQL[@]}" < "supabase/demo/$f.sql" || exit 1; done && echo "(demo dataset restored)"' EXIT
fi

total=0
for f in supabase/tests/*.test.sql; do
  output="$("${PSQL[@]}" < "$f" 2>&1)" || { echo "$f:"; echo "$output" | grep -E "ERROR|FAIL|CONTEXT" >&2; exit 1; }
  n=$(echo "$output" | grep -c "NOTICE:  ok")
  total=$((total + n))
  echo "$(basename "$f"): $n assertions — $(echo "$output" | grep "PASSED")"
done
echo "$total assertions passed in total"
