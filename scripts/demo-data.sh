#!/usr/bin/env bash
# LOCAL DEMO DATASET — never for production.
#
#   scripts/demo-data.sh seed     create demo accounts + load the supabase/demo/demo_seed*.sql files
#   scripts/demo-data.sh remove   delete every demo record and demo account
#   scripts/demo-data.sh status   count what's loaded
#
# Needs SERVICE_ROLE_KEY (the LOCAL stack's key: eval "$(npx supabase status -o env)").
# Refuses to run unless SUPABASE_URL is a localhost address. Demo records are
# identifiable by the id prefix de300000-0000-4000-8000- and @demo.tangy.local
# emails. Sign in as any demo account with its email; the one-time code lands
# in the local Mailpit inbox (http://127.0.0.1:54324).
#
# DEMO_TARGET=review loads the same dataset into a disposable hosted REVIEW
# project instead (never production). Its credentials are read from
# .env.review.local (gitignored, never committed): SUPABASE_URL (https://<ref>.supabase.co),
# SUPABASE_DB_URL (postgres connection string) and SUPABASE_SECRET_KEY (sb_secret_…
# or legacy service_role). Sign-in codes then come from the project's own email.
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ "${DEMO_TARGET:-local}" == review ]]; then
  [[ -f .env.review.local ]] || { echo "DEMO_TARGET=review needs .env.review.local (see .env.example)" >&2; exit 1; }
  set -a; . ./.env.review.local; set +a
  URL="${SUPABASE_URL:?Set SUPABASE_URL in .env.review.local}"
  case "$URL" in
    https://*.supabase.co) ;;
    *) echo "Refusing: $URL is not a hosted review project." >&2; exit 1 ;;
  esac
  SR="${SUPABASE_SECRET_KEY:?Set SUPABASE_SECRET_KEY in .env.review.local}"
  : "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL in .env.review.local}"
else
  URL="${SUPABASE_URL:-http://127.0.0.1:54321}"
  case "$URL" in
    http://127.0.0.1:*|http://localhost:*) ;;
    *) echo "Refusing: SUPABASE_URL=$URL is not a local stack. Demo data is local-only (use DEMO_TARGET=review for a review project)." >&2; exit 1 ;;
  esac
  SR="${SERVICE_ROLE_KEY:?Set SERVICE_ROLE_KEY to the LOCAL stack service key (npx supabase status -o env)}"
fi
# New sb_secret_ keys go in the apikey header only; legacy JWT keys also as a bearer token.
KEYH=(-H "apikey: $SR")
[[ "$SR" == sb_secret_* ]] || KEYH+=(-H "Authorization: Bearer $SR")
C="${DB_CONTAINER:-$(docker ps --format '{{.Names}}' | grep -m1 '^supabase_db_')}"
if [[ "${DEMO_TARGET:-local}" == review ]]; then
  # The local stack's container has psql; it connects to the hosted database directly.
  psql_() { docker exec -i -e PGCONNECT_TIMEOUT=20 "$C" psql "$SUPABASE_DB_URL" -q -v ON_ERROR_STOP=1 "$@"; }
else
  psql_() { docker exec -i "$C" psql -U postgres -d postgres -q -v ON_ERROR_STOP=1 "$@"; }
fi
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
  # Archive / scale additions (demo_seed_history.sql)
  "124|banyan.coffee@demo.tangy.local|Rohan Iyer"  "125|stepwell.press@demo.tangy.local|Ayesha Khan" "126|deccan.radio@demo.tangy.local|Vivek Rao"
  "127|old.city.ink@demo.tangy.local|Zainab Ali"
  "134|lamp.lighters@demo.tangy.local|Suma Reddy" "135|rug.rentals@demo.tangy.local|Kiran Das"   "136|irani.cafe@demo.tangy.local|Farhan Irani"
  "137|poster.press@demo.tangy.local|Leela Nair"
  "143|baradari.host@demo.tangy.local|Arif Hussain" "144|stepwell.lawns@demo.tangy.local|Padma Rao" "145|haveli.host@demo.tangy.local|Salma Begum"
  "190|vol.anika@demo.tangy.local|Anika Shah"    "191|vol.bilal@demo.tangy.local|Bilal Ahmed"   "192|vol.chitra@demo.tangy.local|Chitra Menon"
  "193|vol.daniel@demo.tangy.local|Daniel Thomas" "194|vol.esha@demo.tangy.local|Esha Gupta"   "195|vol.faisal@demo.tangy.local|Faisal Khan"
  "196|vol.gauri@demo.tangy.local|Gauri Joshi"   "197|vol.harish@demo.tangy.local|Harish Kumar" "198|vol.isha@demo.tangy.local|Isha Reddy"
  "199|vol.jaya@demo.tangy.local|Jaya Prakash"
  "180|neel.patil@demo.tangy.local|Neel Patil"   "181|tara.bose@demo.tangy.local|Tara Bose"     "182|uday.kiran@demo.tangy.local|Uday Kiran"
  "183|vani.rao@demo.tangy.local|Vani Rao"       "184|wasim.ali@demo.tangy.local|Wasim Ali"     "185|yamini.s@demo.tangy.local|Yamini S"
  "186|zubin.mehta.demo@demo.tangy.local|Zubin Mistry" "187|asha.p@demo.tangy.local|Asha P"
  # Artist applicants (demo_seed_artist_portal.sql)
  "200|nila.v@demo.tangy.local|Nila Varghese"    "201|arif.lodhi@demo.tangy.local|Arif Lodhi"   "202|mehr.collective@demo.tangy.local|Mehr Collective"
  "203|kartik.i@demo.tangy.local|Kartik Iyengar" "204|ritika.sen@demo.tangy.local|Ritika Sen"   "205|monsoon.ragas@demo.tangy.local|The Monsoon Ragas"
  "206|dev.bhaskar@demo.tangy.local|Dev Bhaskar" "207|pranav.joshi@demo.tangy.local|Pranav Joshi" "208|sana.lanterns@demo.tangy.local|Sana and the Lanterns"
  "209|ishaan.m@demo.tangy.local|Ishaan Mehra"   "210|leena.f@demo.tangy.local|Leena Fernandes" "211|omkar.p@demo.tangy.local|Omkar Patil"
)
MEDIA=( "gallery/de300000-demo/stepwell-rehearsal.jpg|public/media/gallery/tangy5.jpg"
        "diary/de300000-demo/dawn-draft-cover.jpg|public/media/gallery/tangy4.jpg"
        "tv/de300000-demo/teaser-still.jpg|public/media/gallery/tangy4.jpg" )

auth() { curl -s -o /dev/null -w '%{http_code}' -X "$1" "$URL/auth/v1/admin/users${2:-}" "${KEYH[@]}" -H 'Content-Type: application/json' ${3:+-d "$3"}; }

remove() {
  psql_ < supabase/demo/demo_remove.sql
  for m in "${MEDIA[@]}"; do
    curl -s -o /dev/null -X DELETE "$URL/storage/v1/object/content-media" "${KEYH[@]}" -H 'Content-Type: application/json' -d "{\"prefixes\":[\"${m%%|*}\"]}"
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
  psql_ < supabase/demo/demo_seed_history.sql   # past sessions, programmes, archive content
  psql_ < supabase/demo/demo_seed_artist_portal.sql   # applications, booking requests, artist media (0033)
  psql_ < supabase/demo/demo_seed_workflow.sql   # availability, multi-artist line-ups, workflow examples (0034)
  # Private artist-media files: each applicant's demo performance video and the
  # demo artists' media (a title-card video and an empty-venue photo).
  for n in 200 201 202 203 204 205 206 207 208 209 210; do
    curl -s -o /dev/null -X POST "$URL/storage/v1/object/artist-media/applications/$(id $n)/demo-performance.mp4" "${KEYH[@]}" -H 'Content-Type: video/mp4' -H 'x-upsert: true' --data-binary "@public/media/demo/demo-performance.mp4"
  done
  for n in 401 402 403 404; do
    curl -s -o /dev/null -X POST "$URL/storage/v1/object/artist-media/$(id $n)/demo-live-set.mp4" "${KEYH[@]}" -H 'Content-Type: video/mp4' -H 'x-upsert: true' --data-binary "@public/media/demo/demo-performance.mp4"
    curl -s -o /dev/null -X POST "$URL/storage/v1/object/artist-media/$(id $n)/demo-venue.jpg" "${KEYH[@]}" -H 'Content-Type: image/jpeg' -H 'x-upsert: true' --data-binary "@public/media/gallery/tangy4.jpg"
  done
  for m in "${MEDIA[@]}"; do
    path="${m%%|*}"; file="${m#*|}"
    curl -s -o /dev/null -X POST "$URL/storage/v1/object/content-media/$path" "${KEYH[@]}" -H 'Content-Type: image/jpeg' -H 'x-upsert: true' --data-binary "@$file"
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
    union all select 'demo past sessions', count(*) from events where id::text like 'de300000-%' and event_date < current_date
    union all select 'demo programmes', count(*) from programmes where id::text like 'de300000-%'
    union all select 'demo gallery albums', count(*) from gallery_albums where id::text like 'de300000-%'
    union all select 'demo gallery photos', count(*) from gallery_photos where id::text like 'de300000-%'
    union all select 'demo TV videos', count(*) from tv_videos where id::text like 'de300000-%'
    union all select 'demo diary posts', count(*) from diary_posts where id::text like 'de300000-%'
    union all select 'demo announcements', count(*) from announcements where id::text like 'de300000-%'
    union all select 'demo accounts', count(*) from profiles where email like '%@demo.tangy.local'
    union all select 'demo bookings', count(*) from bookings where id::text like 'de300000-%'
    union all select 'demo tickets', count(*) from tickets t join bookings b on b.id = t.booking_id where b.id::text like 'de300000-%'
    union all select 'demo check-ins', count(*) from checkins where booking_id::text like 'de300000-%'
    union all select 'demo waitlist entries', count(*) from waitlist where id::text like 'de300000-%'
    union all select 'demo conversations', count(*) from conversations where id::text like 'de300000-%'
    union all select 'demo messages', count(*) from messages where conversation_id::text like 'de300000-%'
    union all select 'demo content items', (select count(*) from tv_videos where id::text like 'de300000-%') + (select count(*) from diary_posts where id::text like 'de300000-%') + (select count(*) from gallery_albums where id::text like 'de300000-%') + (select count(*) from announcements where id::text like 'de300000-%')" | tr '|' ':'
}

# Review project only: apply every migration, in order, stopping at the first error.
migrate() {
  [[ "${DEMO_TARGET:-local}" == review ]] || { echo "migrate is for DEMO_TARGET=review (locally use scripts/test-db.sh --apply)" >&2; exit 1; }
  for f in supabase/migrations/0*.sql; do
    echo "applying ${f##*/}"
    psql_ < "$f" >/dev/null
  done
}

# Review project only: give the nine Team Demo Login accounts the shared review
# password (TEAM_REVIEW_PASSWORD in .env.review.local — the same value the
# review deployment gets as VITE_TEAM_REVIEW_PASSWORD) and the names the team
# expects. Disposable demo accounts in a disposable project; never production.
review_logins() {
  [[ "${DEMO_TARGET:-local}" == review ]] || { echo "review-logins is for DEMO_TARGET=review" >&2; exit 1; }
  local pw="${TEAM_REVIEW_PASSWORD:?Set TEAM_REVIEW_PASSWORD in .env.review.local}"
  local esc=${pw//\\/\\\\}; esc=${esc//\"/\\\"}
  for email in director ops desk ananya.rao saffron.tea kulhad.chai farah aisha meera.kulkarni; do
    uid=$(psql_ -At -c "select id from auth.users where email = '$email@demo.tangy.local'")
    [[ -n "$uid" ]] || { echo "no demo account $email@demo.tangy.local — run seed first" >&2; exit 1; }
    code=$(auth PUT "/$uid" "{\"password\":\"$esc\"}")
    [[ "$code" == 200 ]] || { echo "could not set the review password for $email (HTTP $code)" >&2; exit 1; }
  done
  psql_ -c "update profiles set full_name = v.name from (values
      ('director@demo.tangy.local', 'Komal Tej'), ('ops@demo.tangy.local', 'Tangy Manager'), ('desk@demo.tangy.local', 'Tangy Staff')
    ) v(email, name) where profiles.email = v.email" >/dev/null
  echo "review logins ready: 9 demo accounts"
}

case "${1:-}" in
  migrate) migrate ;;
  seed) seed ;;
  remove) remove ;;
  status) status ;;
  review-logins) review_logins ;;
  *) echo "usage: $0 seed|remove|status (DEMO_TARGET=review: also migrate, review-logins)" >&2; exit 1 ;;
esac
