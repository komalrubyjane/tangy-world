#!/usr/bin/env bash
# Runs the SQL security tests against a THROWAWAY local PostgreSQL cluster.
# It never connects to a Supabase project — no URL or key is read.
#
#   supabase/tests/run_local.sh                 # all migrations, then every *.test.sql
#   UP_TO=0016 supabase/tests/run_local.sh      # stop after 0016 (pre-lockdown baseline)
#
# Requires PostgreSQL 16 server binaries (initdb/pg_ctl) and the pgcrypto
# contrib extension. Set PG_BIN if they are not in /usr/lib/postgresql/16/bin.
# When run as root it re-executes the cluster commands as the `postgres` OS
# user, because initdb refuses to run as root.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PG_BIN="${PG_BIN:-/usr/lib/postgresql/16/bin}"
UP_TO="${UP_TO:-9999}"
WORK="$(mktemp -d)"
chmod 777 "$WORK"
PORT="${PORT:-54329}"

as_pg() {
  if [ "$(id -u)" = "0" ]; then su postgres -s /bin/bash -c "$*"; else bash -c "$*"; fi
}

cleanup() { as_pg "$PG_BIN/pg_ctl -D '$WORK/data' -m immediate stop" >/dev/null 2>&1 || true; rm -rf "$WORK"; }
trap cleanup EXIT

as_pg "$PG_BIN/initdb -D '$WORK/data' -U postgres --auth=trust" >/dev/null
as_pg "$PG_BIN/pg_ctl -D '$WORK/data' -o \"-p $PORT -k '$WORK' -c listen_addresses=''\" -l '$WORK/pg.log' -w start" >/dev/null

PSQL=(psql -h "$WORK" -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q -X)

"${PSQL[@]}" -f "$ROOT/supabase/tests/local/supabase_shim.sql" >/dev/null

for f in "$ROOT"/supabase/migrations/*.sql; do
  num="$(basename "$f" | cut -c1-4)"
  if [ "$num" \> "$UP_TO" ]; then break; fi
  # One transaction per file, like pasting each file into the SQL editor.
  "${PSQL[@]}" -1 -f "$f" >/dev/null
  echo "applied $(basename "$f")"
done

status=0
for t in "$ROOT"/supabase/tests/*.test.sql; do
  echo "=== $(basename "$t")"
  if ! "${PSQL[@]}" -f "$t"; then status=1; fi
done
exit $status
