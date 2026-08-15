# Tangy Sessions — Supabase setup

## 1. Apply the migrations

In the Supabase dashboard SQL editor (`https://supabase.com/dashboard/project/<ref>/sql/new`),
run these files **in order**, each as its own query:

1. `migrations/0001_schema.sql` — tables
2. `migrations/0002_rls.sql` — row-level security policies (authorization is enforced here, not just in the frontend)
3. `migrations/0003_role_security.sql` — closes two privilege-escalation gaps left open by 0002 (a signed-in user could otherwise PATCH their own `profiles.role` or `artists.status` directly)
4. `migrations/0004_seed_events.sql` — seeds the events table with the site's existing editorial content so Sessions/Archive/Booking/Calendar aren't empty on first load

## 2. Bootstrap your first admin account

RLS deliberately blocks everyone — including admins — from ever promoting their *own*
account's role (see 0003). That means there is no in-app way to create the first admin;
it has to be done once, directly, by whoever owns the Supabase project:

1. Sign up for a normal account on the live site (via the "LOGIN" button / patron modal, or the `/admin` sign-in form — both create the same kind of account).
2. In the Supabase dashboard → Table Editor → `profiles`, find that row and set `role` to `admin` (or `super_admin`).
3. Sign in at `/admin` with that account from then on.

Every admin after the first can be promoted from inside `/admin` → Users tab, by an existing admin.

## 3. Environment variables

Copy `.env.example` to `.env.local` and fill in:

- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — Project Settings → API in the Supabase dashboard.
- `VITE_RAZORPAY_KEY_ID` — not yet used by the app; ticketing currently confirms bookings directly without capturing payment (see `src/lib/bookingService.js`) until a Supabase Edge Function is written to create/verify Razorpay orders server-side with the secret key.

## What's NOT covered by these migrations

- Diary and Archive content are still static/editorial (`src/data/mockData.js` and the section components) — no CMS tables were added for them in this pass, since the existing authored content was already complete and doesn't need frequent editing.
- Real payment capture (Razorpay order creation + signature verification) needs a Supabase Edge Function — see `src/lib/bookingService.js` for the exact spot to wire it in.
