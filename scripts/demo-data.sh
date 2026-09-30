#!/usr/bin/env bash
# LOCAL DEMO DATASET — never for production.
#
#   scripts/demo-data.sh seed     create demo accounts + load supabase/demo/demo_seed.sql
#   scripts/demo-data.sh remove   delete every demo record and demo account
#   scripts/demo-data.sh status   count what's loaded
#
# Needs SERVICE_ROLE_KEY (the LOCAL stack's key: eval "$(npx supabase status -o env)").
# Refuses to run unless SUPABASE_URL is a localhost address. Demo records are
# identifiable by the id prefix de300000-0000-4000-8000- and @demo.tangy.local
# emails. Sign in as any demo account with its email; the one-time code lands
# in the local Mailpit inbox (http://127.0.0.1:54324).
set -euo pipefail
cd "$(dirname "$0")/.."
URL="${SUPABASE_URL:-http://127.0.0.1:54321}"
case "$URL" in
  http://127.0.0.1:*|http://localhost:*) ;;
  *) echo "Refusing: SUPABASE_URL=$URL is not a local stack. Demo data is local-only." >&2; exit 1 ;;
esac
SR="${SERVICE_ROLE_KEY:?Set SERVICE_ROLE_KEY to the LOCAL stack service key (npx supabase status -o env)}"
C="${DB_CONTAINER:-$(docker ps --format '{{.Names}}' | grep -m1 '^supabase_db_')}"
psql_() { docker exec -i "$C" psql -U postgres -d postgres -q -v ON_ERROR_STOP=1 "$@"; }
id() { printf 'de300000-0000-4000-8000-%012d' "$1"; }

USERS=(
  "101|ops@demo.tangy.local|Maya Iyer"          "102|desk@demo.tangy.local|Sam Joseph"           "103|director@demo.tangy.local|Nikhil Rao"
  "110|ananya.rao@demo.tangy.local|Ananya Rao"  "111|kabir.sethi@demo.tangy.local|Kabir Sethi"   "112|charminar.collective@demo.tangy.local|Imtiaz Ali"
  "113|zoya.qadri@demo.tangy.local|Zoya Qadri"
  "120|saffron.tea@demo.tangy.local|Kavya Reddy" "121|deccan.loom@demo.tangy.local|Imran Hussain" "122|charminar.audio@demo.tangy.local|Priya Das"
  "123|irani.bakehouse@demo.tangy.local|Farzana Irani"
  "130|kulhad.chai@demo.tangy.local|Ravi Kumar"  "131|lantern.loom@demo.tangy.local|Neha Jain"   "132|echo.sound@demo.tangy.local|Joseph Mathew"
  "133|biryani.box@demo.tangy.local|Afzal Khan"
  "140|farah@demo.tangy.local|Farah Siddiqui"    "141|rahul.menon@demo.tangy.local|Rahul Menon" "142|nandini@demo.tangy.local|Nandini Rao"
  "150|aisha@demo.tangy.local|Aisha Begum"       "151|dev@demo.tangy.local|Dev Patel"           "152|kavin@demo.tangy.local|Kavin Raj"
  "153|sneha@demo.tangy.local|Sneha Rao"         "154|omar@demo.tangy.local|Omar Farooq"
  "160|sound.crew@demo.tangy.local|Manoj Reddy"  "161|light.crew@demo.tangy.local|Suresh Babu"
  "170|meera.kulkarni@demo.tangy.local|Meera Kulkarni" "171|arvind.shah@demo.tangy.local|Arvind Shah" "172|sana.ahmed@demo.tangy.local|Sana Ahmed"
  "173|rhea.dsouza@demo.tangy.local|Rhea Dsouza" "174|vikram.rao@demo.tangy.local|Vikram Rao"   "175|harsh.vardhan@demo.tangy.local|Harsh Vardhan"
  "176|priya.nair@demo.tangy.local|Priya Nair"   "177|sameer.khan@demo.tangy.local|Sameer Khan" "178|divya.menon@demo.tangy.local|Divya Menon"
  "179|ravi.teja@demo.tangy.local|Ravi Teja"
)
MEDIA=( "gallery/de300000-demo/stepwell-rehearsal.jpg|public/media/gallery/tangy5.jpg"
        "diary/de300000-demo/dawn-draft-cover.jpg|public/media/gallery/tangy9.jpg"
        "tv/de300000-demo/teaser-still.jpg|public/media/gallery/tangy1.jpg" )

auth() { curl -s -o /dev/null -w '%{http_code}' -X "$1" "$URL/auth/v1/admin/users${2:-}" -H "apikey: $SR" -H "Authorization: Bearer $SR" -H 'Content-Type: application/json' ${3:+-d "$3"}; }

remove() {
  psql_ < supabase/demo/demo_remove.sql
  for m in "${MEDIA[@]}"; do
    curl -s -o /dev/null -X DELETE "$URL/storage/v1/object/content-media" -H "apikey: $SR" -H "Authorization: Bearer $SR" -H 'Content-Type: application/json' -d "{\"prefixes\":[\"${m%%|*}\"]}"
  done
  for u in "${USERS[@]}"; do auth DELETE "/$(id "${u%%|*}")" >/dev/null; done
  echo "demo data removed"
}

seed() {
  if [[ "$(psql_ -At -c "select count(*) from events where id::text like 'de300000-%'")" != "0" ]]; then
    echo "demo data is already loaded — run '$0 remove' first to reload it" >&2; exit 1
  fi
  for u in "${USERS[@]}"; do
    IFS='|' read -r n email name <<< "$u"
    code=$(auth POST "" "{\"id\":\"$(id "$n")\",\"email\":\"$email\",\"email_confirm\":true,\"user_metadata\":{\"full_name\":\"$name\"}}")
    [[ "$code" == 200 || "$code" == 422 ]] || { echo "could not create $email (HTTP $code)" >&2; exit 1; }
  done
  psql_ < supabase/demo/demo_seed.sql
  for m in "${MEDIA[@]}"; do
    path="${m%%|*}"; file="${m#*|}"
    curl -s -o /dev/null -X POST "$URL/storage/v1/object/content-media/$path" -H "apikey: $SR" -H "Authorization: Bearer $SR" -H 'Content-Type: image/jpeg' -H 'x-upsert: true' --data-binary "@$file"
  done
  status
  cat <<'NOTE'

Demo accounts (sign in with the email; the code arrives in Mailpit, http://127.0.0.1:54324):
  ops@demo.tangy.local (admin) · desk@demo.tangy.local (staff) · director@demo.tangy.local (super admin)
  ananya.rao@ (artist) · saffron.tea@ (sponsor) · kulhad.chai@ (vendor) · farah@ (venue host)
  aisha@ (volunteer with live check-in access tonight) · meera.kulkarni@ (patron holding a waitlist offer)
NOTE
}

status() {
  psql_ -At -c "select 'demo sessions', count(*) from events where id::text like 'de300000-%'
    union all select 'demo artists', count(*) from artists where id::text like 'de300000-%'
    union all select 'demo accounts', count(*) from profiles where email like '%@demo.tangy.local'
    union all select 'demo bookings', count(*) from bookings where id::text like 'de300000-%'
    union all select 'demo tickets', count(*) from tickets t join bookings b on b.id = t.booking_id where b.id::text like 'de300000-%'
    union all select 'demo check-ins', count(*) from checkins where booking_id::text like 'de300000-%'
    union all select 'demo waitlist entries', count(*) from waitlist where id::text like 'de300000-%'
    union all select 'demo conversations', count(*) from conversations where id::text like 'de300000-%'
    union all select 'demo messages', count(*) from messages where conversation_id::text like 'de300000-%'
    union all select 'demo content items', (select count(*) from tv_videos where id::text like 'de300000-%') + (select count(*) from diary_posts where id::text like 'de300000-%') + (select count(*) from gallery_albums where id::text like 'de300000-%') + (select count(*) from announcements where id::text like 'de300000-%')" | tr '|' ':'
}

case "${1:-}" in
  seed) seed ;;
  remove) remove ;;
  status) status ;;
  *) echo "usage: $0 seed|remove|status" >&2; exit 1 ;;
esac
