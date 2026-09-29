#!/usr/bin/env bash
# One-time: create the test accounts and seed data on a LOCAL Supabase stack.
set -euo pipefail
cd "$(dirname "$0")"
DB_CONTAINER="${DB_CONTAINER:-$(docker ps --format '{{.Names}}' | grep -m1 '^supabase_db_')}"
# Local stack key from the environment (`eval "$(npx supabase status -o env)"`).
SR="${SERVICE_ROLE_KEY:?Set SERVICE_ROLE_KEY from 'npx supabase status -o env' (local stack only)}"
for u in "root@tangy.test:Rhea Root" "manager@tangy.test:Mira Manager" "staff@tangy.test:Sam Staff" "staff2@tangy.test:Tara Staff" \
         "patron@tangy.test:Pat Patron" "vendor@tangy.test:Vik Vendor" "crew@tangy.test:Cam Crew" \
         "artist@tangy.test:Aria Artist" "sponsor@tangy.test:Saffron Sponsor" "vendorco@tangy.test:Chai Collective" \
         "venue@tangy.test:Hema Host" "volunteer@tangy.test:Rohan Das"; do
  curl -s -o /dev/null -X POST http://127.0.0.1:54321/auth/v1/admin/users -H "apikey: $SR" -H "Authorization: Bearer $SR" \
    -H "Content-Type: application/json" -d "{\"email\":\"${u%%:*}\",\"email_confirm\":true,\"user_metadata\":{\"full_name\":\"${u#*:}\"}}"
done
docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -q -v ON_ERROR_STOP=1 < seed.sql
docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -q -v ON_ERROR_STOP=1 < seed_platform.sql
npm install --silent
echo "seeded"
