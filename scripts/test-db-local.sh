#!/usr/bin/env bash
# Docker-free alternative to scripts/test-db.sh + test-fresh-db.sh.
# Builds a THROWAWAY local PostgreSQL 16 cluster, loads
# supabase/tests/local/supabase_shim.sql (Supabase's API roles, auth.*
# helpers, storage/extensions schemas, default privileges), applies every
# migration in order (one transaction each), then runs every
# supabase/tests/*.test.sql. Never connects to a Supabase project.
#
#   scripts/test-db-local.sh              # all migrations, all suites
#   UP_TO=0034 scripts/test-db-local.sh   # stop after a given migration
#
# Needs the PostgreSQL 16 server binaries (PG_BIN, default
# /usr/lib/postgresql/16/bin) with pgcrypto and uuid-ossp. Run as root it
# drives the cluster as the `postgres` OS user (initdb refuses root).
# What it does not cover: GoTrue, PostgREST, Storage API, Realtime, pg_cron,
# Edge Functions — use test-db.sh against `npx supabase start` for those.
set -uo pipefail
cd "$(dirname "$0")/.."
PG_BIN="${PG_BIN:-/usr/lib/postgresql/16/bin}"
UP_TO="${UP_TO:-9999}"
PORT="${PORT:-54329}"
WORK="$(mktemp -d)"; chmod 777 "$WORK"
as_pg() { if [ "$(id -u)" = "0" ]; then su postgres -s /bin/bash -c "$*"; else bash -c "$*"; fi; }
cleanup() { as_pg "$PG_BIN/pg_ctl -D '$WORK/data' -m immediate stop" >/dev/null 2>&1; rm -rf "$WORK"; }
trap cleanup EXIT
as_pg "$PG_BIN/initdb -D '$WORK/data' -U postgres --auth=trust" >/dev/null || exit 1
as_pg "$PG_BIN/pg_ctl -D '$WORK/data' -o \"-p $PORT -k '$WORK' -c listen_addresses=''\" -l '$WORK/pg.log' -w start" >/dev/null || exit 1
PSQL=(psql -h "$WORK" -p "$PORT" -U postgres -d postgres -X -q -v ON_ERROR_STOP=1)

"${PSQL[@]}" -f supabase/tests/local/supabase_shim.sql >/dev/null 2>&1 || { echo "shim failed"; exit 1; }
n=0
for f in supabase/migrations/*.sql; do
  [ "$(basename "$f" | cut -c1-4)" \> "$UP_TO" ] && break
  out=$("${PSQL[@]}" -1 -f "$f" 2>&1) || { echo "FAILED $(basename "$f")"; echo "$out" | grep -m3 ERROR; exit 1; }
  n=$((n + 1))
done
echo "applied $n migrations"

total=0; fail=0
for f in supabase/tests/*.test.sql; do
  out=$("${PSQL[@]}" < "$f" 2>&1)
  c=$(echo "$out" | grep -c "NOTICE:  ok"); total=$((total + c))
  if echo "$out" | grep -qE "^(psql:[^ ]* )?ERROR"; then
    fail=1; echo "$(basename "$f"): FAILED after $c — $(echo "$out" | grep -m1 ERROR)"
  else
    echo "$(basename "$f"): $c"
  fi
done
echo "$total assertions"
exit $fail
