#!/usr/bin/env bash
# LOCAL: run Tangy's scheduled work by hand and show the recent run log.
#
#   scripts/run-jobs.sh            run_platform_jobs() once (expiries, reminders, notices)
#   scripts/run-jobs.sh emails     also drain the email outbox via send-notification-emails
#
# In production the same work runs on a schedule (docs/OPERATIONS.md):
# pg_cron calls run_platform_jobs() every 5 minutes, and a scheduler POSTs to
# send-notification-emails with the x-cron-secret header. Both are idempotent:
# running them again, or twice at once, never processes a record twice
# (tests/media_realtime_jobs.test.sql, scripts/test-concurrency.sh).
set -euo pipefail
cd "$(dirname "$0")/.."
C="${DB_CONTAINER:-$(docker ps --format '{{.Names}}' | grep -m1 '^supabase_db_')}"
URL="${SUPABASE_URL:-http://127.0.0.1:54321}"
case "$URL" in http://127.0.0.1:*|http://localhost:*) ;; *) echo "Refusing: $URL is not a local stack." >&2; exit 1 ;; esac

echo "run_platform_jobs('manual'):"
docker exec -i "$C" psql -U postgres -d postgres -qAt -c "select jsonb_pretty(run_platform_jobs('manual'))"

if [[ "${1:-}" == "emails" ]]; then
  SR="${SERVICE_ROLE_KEY:?Set SERVICE_ROLE_KEY (local stack key) to call send-notification-emails}"
  echo "send-notification-emails:"
  curl -s -X POST "$URL/functions/v1/send-notification-emails" -H "Authorization: Bearer $SR" -H 'Content-Type: application/json' -d '{}'
  echo
fi

echo "Recent runs:"
docker exec -i "$C" psql -U postgres -d postgres -c "select id, started_at, finished_at - started_at as took, source, skipped from platform_job_runs order by id desc limit 5"
