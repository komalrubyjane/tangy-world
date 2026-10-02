#!/usr/bin/env bash
# LOCAL STACK ONLY. Proves the migrations apply to an empty database:
# builds a scratch database `tangy_fresh` next to the local stack's own, with
# Supabase's auth/storage/extensions schemas copied from it (our objects on
# them fail to copy and are skipped — the migrations recreate them), applies
# every migration in order, then runs every tests/*.test.sql against it.
# The stack's `postgres` database is not touched. Drop it afterwards with:
#   docker exec <db container> psql -U supabase_admin -c 'drop database tangy_fresh'
set -uo pipefail
C="${DB_CONTAINER:-$(docker ps --format '{{.Names}}' | grep -m1 '^supabase_db_')}"
cd "$(dirname "$0")/.."
docker exec $C psql -U supabase_admin -d postgres -qAtc "drop database if exists tangy_fresh" -c "create database tangy_fresh"
docker exec $C bash -c "pg_dump -U supabase_admin -d postgres --schema-only -n auth -n storage -n extensions | psql -U supabase_admin -d tangy_fresh -q" >/dev/null 2>&1
docker exec $C bash -c "pg_dump -U supabase_admin -d postgres --data-only -t storage.migrations -t auth.schema_migrations | psql -U supabase_admin -d tangy_fresh -q" >/dev/null 2>&1
docker exec -i $C psql -U supabase_admin -d tangy_fresh -q -v ON_ERROR_STOP=1 <<'SQL'
alter schema public owner to postgres;
grant create, connect, temporary on database tangy_fresh to postgres;
grant usage on schema public to anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant all on sequences to anon, authenticated, service_role;
grant usage on schema extensions to postgres, anon, authenticated, service_role;
alter database tangy_fresh set search_path to "$user", public, extensions;
create publication supabase_realtime;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;
-- The storage schema copy brings our own policies on storage.objects with it;
-- the migrations create them, so start without them.
do $$ declare p record; begin
  for p in select policyname from pg_policies where schemaname = 'storage' and tablename = 'objects' loop
    execute format('drop policy %I on storage.objects', p.policyname);
  end loop;
end $$;
SQL
for f in supabase/migrations/*.sql; do
  out=$(docker exec -i $C psql -U postgres -d tangy_fresh -q -v ON_ERROR_STOP=1 < "$f" 2>&1 | grep -v "NOTICE\|^$\|^DETAIL\|^HINT\|WARNING")
  if echo "$out" | grep -q ERROR; then echo "FAILED $f"; echo "$out" | head -5; exit 1; fi
done
echo "applied $(ls supabase/migrations/*.sql | wc -l | tr -d ' ') migrations to tangy_fresh"
total=0; fail=0
for f in supabase/tests/*.test.sql; do
  out=$(docker exec -i $C psql -U postgres -d tangy_fresh -v ON_ERROR_STOP=1 -q < "$f" 2>&1)
  n=$(echo "$out" | grep -c "NOTICE:  ok"); total=$((total + n))
  if echo "$out" | grep -q "^ERROR"; then fail=1; echo "$(basename "$f"): FAILED after $n — $(echo "$out" | grep -m1 ERROR)"; else echo "$(basename "$f"): $n"; fi
done
echo "$total assertions on a fresh database"
exit $fail
